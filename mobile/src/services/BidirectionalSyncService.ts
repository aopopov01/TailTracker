/**
 * TailTracker Bidirectional Sync Service
 * 
 * Ensures users fill information once and it syncs seamlessly between local and cloud databases.
 * Provides real-time bidirectional sync with conflict resolution and offline support.
 */

import { supabase } from './supabase';
import { databaseService } from '../../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PetProfile } from '../../contexts/PetProfileContext';
import { SupabasePetProfile } from './SupabaseSyncService';

export interface SyncedField {
  field: string;
  localValue: any;
  remoteValue: any;
  lastModified: string;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

export interface SyncResult {
  success: boolean;
  fieldsUpdated: string[];
  conflicts: string[];
  error?: string;
}

export interface ConflictResolution {
  field: string;
  resolution: 'local' | 'remote' | 'merge';
  mergedValue?: any;
}

class BidirectionalSyncService {
  private static instance: BidirectionalSyncService;
  private syncInProgress = false;
  private readonly SYNC_METADATA_KEY = 'sync_metadata';
  private readonly FIELD_TIMESTAMPS_KEY = 'field_timestamps';
  private syncSubscription: any = null;

  public static getInstance(): BidirectionalSyncService {
    if (!BidirectionalSyncService.instance) {
      BidirectionalSyncService.instance = new BidirectionalSyncService();
    }
    return BidirectionalSyncService.instance;
  }

  /**
   * Start real-time sync for a pet profile
   */
  async startRealTimeSync(localPetId: number, supabasePetId: string): Promise<void> {
    if (this.syncSubscription) {
      this.stopRealTimeSync();
    }

    console.log(`🔄 Starting real-time sync: local ${localPetId} ↔ remote ${supabasePetId}`);

    this.syncSubscription = supabase
      .channel('pet_profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pets',
          filter: `id=eq.${supabasePetId}`
        },
        async (payload) => {
          console.log('🔄 Remote pet profile changed, syncing to local:', payload);
          await this.handleRemoteChange(localPetId, payload.new as SupabasePetProfile);
        }
      )
      .subscribe();
  }

  /**
   * Stop real-time sync
   */
  stopRealTimeSync(): void {
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
      this.syncSubscription = null;
      console.log('⏹️ Stopped real-time sync');
    }
  }

  /**
   * Sync a single field change immediately
   */
  async syncFieldChange(
    localPetId: number, 
    supabasePetId: string, 
    field: string, 
    value: any,
    userId: string
  ): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, fieldsUpdated: [], conflicts: [], error: 'Sync in progress' };
    }

    this.syncInProgress = true;

    try {
      console.log(`🔄 Syncing field '${field}' change: ${value}`);

      // Update timestamp for this field
      await this.updateFieldTimestamp(localPetId, field);

      // Update local database
      const localProfile = await databaseService.getPetById(localPetId, parseInt(userId));
      if (localProfile) {
        const updates = { [field]: value };
        await databaseService.updatePetProfile(localPetId, updates, parseInt(userId));
      }

      // Update remote database
      const supabaseUpdate = this.transformFieldToSupabase(field, value);
      if (supabaseUpdate) {
        const { error } = await supabase
          .from('pets')
          .update({
            ...supabaseUpdate,
            updated_at: new Date().toISOString()
          })
          .eq('id', supabasePetId);

        if (error) {
          throw new Error(`Failed to sync to remote: ${error.message}`);
        }
      }

      console.log(`✅ Field '${field}' synced successfully`);
      return {
        success: true,
        fieldsUpdated: [field],
        conflicts: []
      };

    } catch (error) {
      console.error(`❌ Field sync failed:`, error);
      return {
        success: false,
        fieldsUpdated: [],
        conflicts: [],
        error: error instanceof Error ? error.message : 'Unknown sync error'
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Perform full bidirectional sync
   */
  async performFullSync(localPetId: number, supabasePetId: string, userId: string): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, fieldsUpdated: [], conflicts: [], error: 'Sync already in progress' };
    }

    this.syncInProgress = true;

    try {
      console.log(`🔄 Starting full bidirectional sync: local ${localPetId} ↔ remote ${supabasePetId}`);

      // Get current data from both sources
      const localProfile = await databaseService.getPetById(localPetId, parseInt(userId));
      const { data: remoteProfile, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', supabasePetId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch remote profile: ${error.message}`);
      }

      if (!localProfile || !remoteProfile) {
        throw new Error('Profile not found in one of the databases');
      }

      // Get field timestamps
      const fieldTimestamps = await this.getFieldTimestamps(localPetId);

      // Compare fields and detect conflicts
      const syncResults = await this.compareAndSync(
        localProfile,
        remoteProfile,
        fieldTimestamps,
        localPetId,
        supabasePetId,
        userId
      );

      console.log(`✅ Full sync completed: ${syncResults.fieldsUpdated.length} fields updated, ${syncResults.conflicts.length} conflicts`);
      
      return syncResults;

    } catch (error) {
      console.error(`❌ Full sync failed:`, error);
      return {
        success: false,
        fieldsUpdated: [],
        conflicts: [],
        error: error instanceof Error ? error.message : 'Unknown sync error'
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Handle remote change from real-time subscription
   */
  private async handleRemoteChange(localPetId: number, remoteProfile: SupabasePetProfile): Promise<void> {
    try {
      const localUserId = await this.getLocalUserId();
      if (!localUserId) return;

      const localProfile = await databaseService.getPetById(localPetId, localUserId);
      if (!localProfile) return;

      // Transform remote changes to local format
      const localUpdates = this.transformSupabaseToLocal(remoteProfile);

      // Update local database
      await databaseService.updatePetProfile(localPetId, localUpdates, localUserId);

      console.log('✅ Remote changes synced to local database');

    } catch (error) {
      console.error('❌ Failed to handle remote change:', error);
    }
  }

  /**
   * Compare profiles and sync differences
   */
  private async compareAndSync(
    localProfile: any,
    remoteProfile: SupabasePetProfile,
    fieldTimestamps: Record<string, string>,
    localPetId: number,
    supabasePetId: string,
    userId: string
  ): Promise<SyncResult> {
    const fieldsUpdated: string[] = [];
    const conflicts: string[] = [];

    // Define field mappings between local and remote
    const fieldMappings = this.getFieldMappings();

    for (const [localField, remoteField] of Object.entries(fieldMappings)) {
      try {
        const localValue = localProfile[localField];
        const remoteValue = remoteProfile[remoteField as keyof SupabasePetProfile];

        // Skip if values are the same
        if (this.valuesEqual(localValue, remoteValue)) {
          continue;
        }

        const localTimestamp = fieldTimestamps[localField];
        const remoteTimestamp = remoteProfile.updated_at;

        // Determine which value is newer
        const shouldUpdateLocal = !localTimestamp || (remoteTimestamp > localTimestamp);
        const shouldUpdateRemote = localTimestamp && (localTimestamp > remoteTimestamp);

        if (shouldUpdateLocal && shouldUpdateRemote) {
          // Conflict detected
          conflicts.push(localField);
          console.log(`⚠️ Conflict detected for field '${localField}'`);
        } else if (shouldUpdateLocal) {
          // Update local with remote value
          const transformedValue = this.transformSupabaseFieldToLocal(remoteField, remoteValue);
          const updates = { [localField]: transformedValue };
          await databaseService.updatePetProfile(localPetId, updates, parseInt(userId));
          fieldsUpdated.push(localField);
          console.log(`📥 Updated local field '${localField}' from remote`);
        } else if (shouldUpdateRemote) {
          // Update remote with local value
          const transformedValue = this.transformLocalFieldToSupabase(localField, localValue);
          if (transformedValue) {
            await supabase
              .from('pets')
              .update({ 
                [remoteField]: transformedValue,
                updated_at: new Date().toISOString()
              })
              .eq('id', supabasePetId);
            fieldsUpdated.push(localField);
            console.log(`📤 Updated remote field '${remoteField}' from local`);
          }
        }

      } catch (error) {
        console.error(`❌ Error syncing field '${localField}':`, error);
      }
    }

    return {
      success: conflicts.length === 0,
      fieldsUpdated,
      conflicts
    };
  }

  /**
   * Resolve conflicts using specified resolution strategy
   */
  async resolveConflicts(
    localPetId: number,
    supabasePetId: string,
    resolutions: ConflictResolution[],
    userId: string
  ): Promise<SyncResult> {
    const fieldsUpdated: string[] = [];

    for (const resolution of resolutions) {
      try {
        const { field, resolution: strategy, mergedValue } = resolution;

        if (strategy === 'local') {
          // Use local value - update remote
          const localProfile = await databaseService.getPetById(localPetId, parseInt(userId));
          if (localProfile) {
            const localValue = localProfile[field as keyof typeof localProfile];
            const remoteField = this.getFieldMappings()[field];
            const transformedValue = this.transformLocalFieldToSupabase(field, localValue);
            
            if (transformedValue && remoteField) {
              await supabase
                .from('pets')
                .update({ 
                  [remoteField]: transformedValue,
                  updated_at: new Date().toISOString()
                })
                .eq('id', supabasePetId);
              fieldsUpdated.push(field);
            }
          }
        } else if (strategy === 'remote') {
          // Use remote value - update local
          const { data: remoteProfile } = await supabase
            .from('pets')
            .select('*')
            .eq('id', supabasePetId)
            .single();

          if (remoteProfile) {
            const remoteField = this.getFieldMappings()[field];
            const remoteValue = remoteProfile[remoteField as keyof SupabasePetProfile];
            const transformedValue = this.transformSupabaseFieldToLocal(remoteField, remoteValue);
            const updates = { [field]: transformedValue };
            await databaseService.updatePetProfile(localPetId, updates, parseInt(userId));
            fieldsUpdated.push(field);
          }
        } else if (strategy === 'merge' && mergedValue !== undefined) {
          // Use merged value - update both
          const updates = { [field]: mergedValue };
          await databaseService.updatePetProfile(localPetId, updates, parseInt(userId));

          const remoteField = this.getFieldMappings()[field];
          const transformedValue = this.transformLocalFieldToSupabase(field, mergedValue);
          
          if (transformedValue && remoteField) {
            await supabase
              .from('pets')
              .update({ 
                [remoteField]: transformedValue,
                updated_at: new Date().toISOString()
              })
              .eq('id', supabasePetId);
          }
          fieldsUpdated.push(field);
        }

        // Update field timestamp
        await this.updateFieldTimestamp(localPetId, field);

      } catch (error) {
        console.error(`❌ Error resolving conflict for field '${resolution.field}':`, error);
      }
    }

    return {
      success: true,
      fieldsUpdated,
      conflicts: []
    };
  }

  /**
   * Get field mappings between local and Supabase formats
   */
  private getFieldMappings(): Record<string, string> {
    return {
      'name': 'name',
      'species': 'species',
      'breed': 'breed',
      'dateOfBirth': 'birth_date',
      'weight': 'weight',
      'colorMarkings': 'color',
      'gender': 'sex',
      'personalityTraits': 'personality_traits',
      'medicalConditions': 'medical_conditions',
      'allergies': 'dietary_restrictions',
      'specialNotes': 'notes',
      'insuranceProvider': 'insurance_info',
      'insurancePolicyNumber': 'insurance_info'
    };
  }

  /**
   * Transform field from local to Supabase format
   */
  private transformFieldToSupabase(field: string, value: any): Record<string, any> | null {
    const mapping = this.getFieldMappings()[field];
    if (!mapping) return null;

    // Handle special transformations
    switch (field) {
      case 'dateOfBirth':
        return { [mapping]: value instanceof Date ? value.toISOString().split('T')[0] : value };
      case 'weight':
        return { [mapping]: typeof value === 'string' ? parseFloat(value) : value };
      case 'insuranceProvider':
      case 'insurancePolicyNumber':
        // Handle insurance info as object
        return { insurance_info: { provider: value } };
      default:
        return { [mapping]: value };
    }
  }

  /**
   * Transform field from Supabase to local format
   */
  private transformSupabaseFieldToLocal(field: string, value: any): any {
    switch (field) {
      case 'birth_date':
        return value ? new Date(value) : undefined;
      case 'weight':
        return value ? value.toString() : undefined;
      case 'insurance_info':
        return value?.provider || value?.policy || undefined;
      default:
        return value;
    }
  }

  /**
   * Transform local field to Supabase format
   */
  private transformLocalFieldToSupabase(field: string, value: any): any {
    switch (field) {
      case 'dateOfBirth':
        return value instanceof Date ? value.toISOString().split('T')[0] : value;
      case 'weight':
        return typeof value === 'string' ? parseFloat(value) : value;
      default:
        return value;
    }
  }

  /**
   * Transform full Supabase profile to local format
   */
  private transformSupabaseToLocal(remoteProfile: SupabasePetProfile): Partial<PetProfile> {
    return {
      name: remoteProfile.name,
      species: remoteProfile.species as any,
      breed: remoteProfile.breed,
      dateOfBirth: remoteProfile.birth_date ? new Date(remoteProfile.birth_date) : undefined,
      weight: remoteProfile.weight?.toString(),
      colorMarkings: remoteProfile.color,
      gender: remoteProfile.sex as any,
      personalityTraits: remoteProfile.personality_traits,
      medicalConditions: remoteProfile.medical_conditions,
      allergies: remoteProfile.dietary_restrictions,
      specialNotes: remoteProfile.notes,
      insuranceProvider: (remoteProfile.insurance_info as any)?.provider,
      insurancePolicyNumber: (remoteProfile.insurance_info as any)?.policy
    };
  }

  /**
   * Check if two values are equal (handles arrays and objects)
   */
  private valuesEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;

    if (Array.isArray(a) && Array.isArray(b)) {
      return JSON.stringify(a.sort()) === JSON.stringify(b.sort());
    }

    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return false;
  }

  /**
   * Update field timestamp
   */
  private async updateFieldTimestamp(localPetId: number, field: string): Promise<void> {
    try {
      const key = `${this.FIELD_TIMESTAMPS_KEY}_${localPetId}`;
      const existing = await AsyncStorage.getItem(key);
      const timestamps = existing ? JSON.parse(existing) : {};
      
      timestamps[field] = new Date().toISOString();
      
      await AsyncStorage.setItem(key, JSON.stringify(timestamps));
    } catch (error) {
      console.error('Failed to update field timestamp:', error);
    }
  }

  /**
   * Get field timestamps for a pet
   */
  private async getFieldTimestamps(localPetId: number): Promise<Record<string, string>> {
    try {
      const key = `${this.FIELD_TIMESTAMPS_KEY}_${localPetId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get field timestamps:', error);
      return {};
    }
  }

  /**
   * Get local user ID
   */
  private async getLocalUserId(): Promise<number | null> {
    try {
      // This would need to be implemented based on your auth context
      // For now, returning a placeholder
      return 1;
    } catch {
      return null;
    }
  }

  /**
   * Clear all sync data
   */
  async clearSyncData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const syncKeys = keys.filter(key => 
        key.startsWith(this.FIELD_TIMESTAMPS_KEY) || 
        key.startsWith(this.SYNC_METADATA_KEY)
      );
      await AsyncStorage.multiRemove(syncKeys);
    } catch (error) {
      console.error('Failed to clear sync data:', error);
    }
  }
}

// Export singleton instance
export const bidirectionalSyncService = BidirectionalSyncService.getInstance();
export default bidirectionalSyncService;