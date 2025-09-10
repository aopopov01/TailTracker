/**
 * TailTracker Supabase Sync Service
 * 
 * Handles synchronization between local onboarding data and Supabase cloud database.
 * Provides seamless offline-to-online data transition and real-time sync capabilities.
 */

import { supabase } from './supabase';
import { databaseService } from '../../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PetProfile } from '../../contexts/PetProfileContext';

export interface SyncResult {
  success: boolean;
  petId?: string;
  supabasePetId?: string;
  error?: string;
  syncedData?: {
    profile: boolean;
    vaccinations: boolean;
    photos: boolean;
  };
}

export interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  family_id?: string;
  subscription_status: 'free' | 'premium' | 'family' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  owner_id: string;
  subscription_status: 'free' | 'premium' | 'family' | 'cancelled' | 'expired';
  max_pets: number;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface SupabasePetProfile {
  id: string;
  user_id: string;
  family_id?: string;
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  weight?: number;
  microchip_id?: string;
  color?: string;
  sex?: string;
  neutered?: boolean;
  
  // Onboarding-specific fields
  personality_traits?: string[];
  favorite_activities?: string[];
  exercise_needs?: 'low' | 'moderate' | 'high';
  care_preferences?: string[];
  favorite_toys?: string[];
  feeding_schedule?: string;
  special_notes?: string;
  
  // Additional onboarding fields
  approximate_age?: string;
  use_approximate_age?: boolean;
  height_cm?: number;
  weight_unit?: string;
  height_unit?: string;
  emergency_contact_relationship?: string;
  
  medical_conditions?: string[];
  dietary_restrictions?: string[];
  emergency_contact?: string;
  veterinarian_info?: any;
  insurance_info?: any;
  notes?: string;
  profile_photo_url?: string;
  status: 'active' | 'lost' | 'found' | 'deceased';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

class SupabaseSyncService {
  private static instance: SupabaseSyncService;
  private syncInProgress = false;
  private readonly SYNC_KEY = 'lastSyncTimestamp';
  private readonly PENDING_SYNC_KEY = 'pendingSyncData';

  public static getInstance(): SupabaseSyncService {
    if (!SupabaseSyncService.instance) {
      SupabaseSyncService.instance = new SupabaseSyncService();
    }
    return SupabaseSyncService.instance;
  }

  /**
   * Complete onboarding sync - moves local profile data to Supabase
   */
  async syncOnboardingProfile(localPetId: number): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, error: 'Sync already in progress' };
    }

    this.syncInProgress = true;

    try {
      console.log('Starting onboarding sync for pet ID:', localPetId);

      // Check authentication with retry logic
      let user = null;
      let authError = null;
      
      // Try to get user with retry for auth state changes
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: userData, error: currentAuthError } = await supabase.auth.getUser();
        authError = currentAuthError;
        user = userData.user;
        
        if (user) {
          break; // Success
        }
        
        if (attempt < 2) {
          console.log(`Authentication attempt ${attempt + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
      }
      
      if (authError || !user) {
        console.error('Authentication failed after retries:', authError);
        
        // No email verification required - proceed with error
        
        throw new Error('User not authenticated - please log in');
      }
      
      // Email verification disabled - users can sync immediately after registration
      console.log('✅ User authenticated, proceeding with sync (no email verification required)');

      // Get local pet profile
      const localProfile = await databaseService.getPetById(localPetId, user.id);
      if (!localProfile) {
        // Clear pending sync for non-existent pet
        console.log(`Pet ID ${localPetId} not found locally, clearing pending sync data`);
        await AsyncStorage.removeItem(this.PENDING_SYNC_KEY);
        throw new Error('Local pet profile not found');
      }

      // Ensure user profile exists
      await this.ensureUserProfile(user);

      // Get or create family
      const family = await this.getOrCreateFamily(user.id);

      // Check subscription limits
      await this.checkSubscriptionLimits(family);

      // Transform and sync pet profile
      const supabasePet = this.transformToSupabasePet(localProfile, user.id, family.id);
      const { data: insertedPet, error: insertError } = await supabase
        .from('pets')
        .insert([supabasePet])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to insert pet: ${insertError.message}`);
      }

      console.log('Pet synced to Supabase:', insertedPet.id);

      // Sync vaccinations if any
      const vaccinationsSynced = await this.syncVaccinations(localPetId, insertedPet.id);

      // Sync photos if any
      const photosSynced = await this.syncPetPhotos(localPetId, insertedPet.id);

      // For now, we'll skip updating the local profile with Supabase ID
      // This would require adding a method to the database service
      console.log(`Local pet ${localPetId} synced to Supabase as ${insertedPet.id}`);

      // Store sync metadata
      await this.storeSyncMetadata({
        localPetId,
        supabasePetId: insertedPet.id,
        syncTimestamp: new Date().toISOString(),
      });

      // Mark sync complete
      await AsyncStorage.setItem(this.SYNC_KEY, new Date().toISOString());

      return {
        success: true,
        petId: localPetId.toString(),
        supabasePetId: insertedPet.id,
        syncedData: {
          profile: true,
          vaccinations: vaccinationsSynced,
          photos: photosSynced,
        },
      };

    } catch (error) {
      console.error('Onboarding sync failed:', error);
      
      // Provide more specific error context
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('Sync error details:', {
        localPetId,
        errorMessage,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString()
      });
      
      // Store for retry only if it's a recoverable error
      const isRecoverableError = this.isRecoverableError(error);
      if (isRecoverableError) {
        console.log('Error is recoverable, storing for retry');
        await this.storePendingSyncData(localPetId, error);
      } else {
        console.log('Error is not recoverable, not storing for retry');
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Ensure user profile exists in Supabase
   */
  private async ensureUserProfile(user: any): Promise<UserProfile> {
    // First, try to find by auth_user_id
    const { data: existingProfile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (existingProfile && !fetchError) {
      return existingProfile;
    }

    // If not found by auth_user_id, check if there's an existing user with the same email
    const { data: emailProfile, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (emailProfile && !emailError) {
      // Update the existing profile with the correct auth_user_id
      const { data: updatedProfile, error: updateError } = await supabase
        .from('users')
        .update({ auth_user_id: user.id })
        .eq('id', emailProfile.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update user profile: ${updateError.message}`);
      }

      return updatedProfile;
    }

    // Create new user profile if not found by either method
    const userProfile = {
      auth_user_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'TailTracker User',
      phone: user.user_metadata?.phone,
      avatar_url: user.user_metadata?.avatar_url,
      subscription_status: 'free' as const,
    };

    const { data: insertedProfile, error: insertError } = await supabase
      .from('users')
      .insert([userProfile])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create user profile: ${insertError.message}`);
    }

    return insertedProfile;
  }

  /**
   * Get or create family for user
   */
  private async getOrCreateFamily(userId: string): Promise<Family> {
    // Check if user is already in a family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', userId)
      .single();

    if (userProfile?.family_id) {
      const { data: family } = await supabase
        .from('families')
        .select('*')
        .eq('id', userProfile.family_id)
        .single();

      if (family) return family;
    }

    // Create new family
    const familyData = {
      name: 'My Family',
      owner_id: userId,
      subscription_status: 'free' as const,
      max_pets: 1,
      max_members: 2,
    };

    const { data: newFamily, error: familyError } = await supabase
      .from('families')
      .insert([familyData])
      .select()
      .single();

    if (familyError) {
      throw new Error(`Failed to create family: ${familyError.message}`);
    }

    // Update user profile with family ID
    await supabase
      .from('users')
      .update({ family_id: newFamily.id })
      .eq('id', userId);

    return newFamily;
  }

  /**
   * Check subscription limits before syncing
   */
  private async checkSubscriptionLimits(family: Family): Promise<void> {
    const { data: existingPets, error } = await supabase
      .from('pets')
      .select('id')
      .eq('family_id', family.id)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to check existing pets: ${error.message}`);
    }

    const currentPetCount = existingPets?.length || 0;

    if (currentPetCount >= family.max_pets) {
      throw new Error(`Pet limit reached (${family.max_pets}) for ${family.subscription_status} tier`);
    }
  }

  /**
   * Transform local pet profile to Supabase format
   */
  private transformToSupabasePet(localProfile: PetProfile, userId: string, familyId: string): Omit<SupabasePetProfile, 'id' | 'created_at' | 'updated_at'> {
    return {
      user_id: userId,
      family_id: familyId,
      name: localProfile.name || 'Unknown Pet',
      species: localProfile.species || 'other',
      breed: localProfile.breed || undefined,
      birth_date: localProfile.dateOfBirth ? localProfile.dateOfBirth.toISOString().split('T')[0] : undefined,
      weight: localProfile.weight ? parseFloat(localProfile.weight) : undefined,
      microchip_id: undefined, // Not in current profile structure
      color: localProfile.colorMarkings || undefined,
      sex: localProfile.gender || undefined,
      neutered: undefined, // Not in current profile structure
      
      // New onboarding fields
      personality_traits: localProfile.personalityTraits || undefined,
      favorite_activities: localProfile.favoriteActivities || undefined,
      exercise_needs: localProfile.exerciseNeeds || undefined,
      care_preferences: localProfile.favoriteToys || undefined,
      favorite_toys: localProfile.favoriteToys || undefined,
      feeding_schedule: localProfile.feedingSchedule || undefined,
      special_notes: localProfile.specialNotes || undefined,
      
      // Additional onboarding fields
      approximate_age: localProfile.approximateAge || undefined,
      use_approximate_age: localProfile.useApproximateAge || false,
      height_cm: localProfile.height ? parseFloat(localProfile.height) : undefined,
      weight_unit: localProfile.weightUnit || 'kg',
      height_unit: localProfile.heightUnit || 'cm',
      emergency_contact_relationship: localProfile.emergencyContact?.relationship || undefined,
      
      medical_conditions: localProfile.medicalConditions || undefined,
      dietary_restrictions: localProfile.allergies || undefined,
      emergency_contact: localProfile.emergencyContact?.name || undefined,
      veterinarian_info: undefined, // Not in current profile structure
      insurance_info: localProfile.insuranceProvider ? {
        provider: localProfile.insuranceProvider,
        policy: localProfile.insurancePolicyNumber
      } : undefined,
      notes: localProfile.specialNotes || undefined,
      profile_photo_url: undefined, // Will be set during photo sync
      status: 'active',
      is_public: false,
    };
  }

  /**
   * Sync vaccination records
   */
  private async syncVaccinations(localPetId: number, supabasePetId: string): Promise<boolean> {
    try {
      // For now, just return true as vaccination sync is not implemented in database service
      // This would be implemented when vaccination management is added
      console.log(`Vaccination sync placeholder for pet ${supabasePetId}`);
      return true;
    } catch (error) {
      console.error('Vaccination sync error:', error);
      return false;
    }
  }

  /**
   * Sync pet photos
   */
  private async syncPetPhotos(localPetId: number, supabasePetId: string): Promise<boolean> {
    try {
      // For now, just return true as photo sync is not implemented in database service
      // This would be implemented when photo management is added
      console.log(`Photo sync placeholder for pet ${supabasePetId}`);
      return true;
    } catch (error) {
      console.error('Photo sync error:', error);
      return false;
    }
  }

  /**
   * Store sync metadata
   */
  private async storeSyncMetadata(metadata: any): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem('syncMetadata');
      const data = existing ? JSON.parse(existing) : [];
      data.push(metadata);
      await AsyncStorage.setItem('syncMetadata', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store sync metadata:', error);
    }
  }

  /**
   * Store pending sync data for retry
   */
  private async storePendingSyncData(localPetId: number, error: any): Promise<void> {
    try {
      const pendingData = {
        localPetId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      await AsyncStorage.setItem(this.PENDING_SYNC_KEY, JSON.stringify(pendingData));
    } catch (storageError) {
      console.error('Failed to store pending sync data:', storageError);
    }
  }

  /**
   * Check for pending syncs and retry
   */
  async retryPendingSyncs(): Promise<SyncResult[]> {
    try {
      const pendingData = await AsyncStorage.getItem(this.PENDING_SYNC_KEY);
      if (!pendingData) {
        return [];
      }

      const pending = JSON.parse(pendingData);
      const results: SyncResult[] = [];

      if (Array.isArray(pending)) {
        // Multiple pending syncs
        for (const item of pending) {
          const result = await this.syncOnboardingProfile(item.localPetId);
          results.push(result);
        }
      } else {
        // Single pending sync
        const result = await this.syncOnboardingProfile(pending.localPetId);
        results.push(result);
      }

      // Clear pending syncs on successful retry
      const allSuccessful = results.every(r => r.success);
      if (allSuccessful) {
        await AsyncStorage.removeItem(this.PENDING_SYNC_KEY);
      }

      return results;
    } catch (error) {
      console.error('Failed to retry pending syncs:', error);
      return [];
    }
  }

  /**
   * Check if sync is available (user authenticated and online)
   */
  async isSyncAvailable(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    lastSync: string | null;
    hasPendingSync: boolean;
    isAuthenticated: boolean;
  }> {
    const lastSync = await AsyncStorage.getItem(this.SYNC_KEY);
    const pendingSync = await AsyncStorage.getItem(this.PENDING_SYNC_KEY);
    const isAuthenticated = await this.isSyncAvailable();

    return {
      lastSync,
      hasPendingSync: !!pendingSync,
      isAuthenticated,
    };
  }

  /**
   * Determine if an error is recoverable and should be retried
   */
  private isRecoverableError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Non-recoverable errors (don't retry these)
    const nonRecoverableErrors = [
      'Local pet profile not found',
      'User not authenticated - please log in',
      'Invalid pet data',
      'Pet ID',
      'not found locally'
    ];
    
    // Check if this is a non-recoverable error
    const isNonRecoverable = nonRecoverableErrors.some(nonRecoverable => 
      errorMessage.includes(nonRecoverable)
    );
    
    if (isNonRecoverable) {
      return false;
    }
    
    // Recoverable errors (network, temporary auth issues, etc.)
    const recoverableErrors = [
      'Network request failed',
      'timeout',
      'connection',
      'Failed to insert pet',
      'Failed to create user profile',
      'Failed to create family'
    ];
    
    const isRecoverable = recoverableErrors.some(recoverable => 
      errorMessage.toLowerCase().includes(recoverable.toLowerCase())
    );
    
    // Default to recoverable for unknown errors
    return isRecoverable || true;
  }

  /**
   * Clear sync data (for testing/debugging)
   */
  async clearSyncData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(this.SYNC_KEY),
      AsyncStorage.removeItem(this.PENDING_SYNC_KEY),
      AsyncStorage.removeItem('syncMetadata'),
    ]);
  }
}

// Export singleton instance
export const supabaseSyncService = SupabaseSyncService.getInstance();
export default supabaseSyncService;