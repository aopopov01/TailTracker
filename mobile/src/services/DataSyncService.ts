/**
 * TailTracker Data Synchronization Service
 * 
 * This service provides real-time data synchronization across all tables
 * ensuring users never have to enter the same data twice.
 * 
 * Features:
 * - Automatic sync on data changes
 * - Real-time updates via Supabase subscriptions
 * - Offline sync queue for network failures
 * - Conflict resolution for concurrent edits
 * - Progress tracking and error handling
 */

import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types for sync operations
export interface SyncOperation {
  id: string;
  type: 'user_profile' | 'pet_data' | 'veterinarian' | 'full_sync';
  targetId: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  timestamp: Date;
  retryCount: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  syncLogId?: string;
  updatedTables: string[];
  errors?: string[];
  timestamp: Date;
}

export interface SyncProgress {
  total: number;
  completed: number;
  current: string;
  percentage: number;
}

// Sync Service Class
export class DataSyncService {
  private static instance: DataSyncService;
  private syncQueue: Map<string, SyncOperation> = new Map();
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();
  private syncInProgress = false;
  private syncListeners: ((progress: SyncProgress) => void)[] = [];
  private readonly SYNC_QUEUE_KEY = 'tailtracker_sync_queue';
  private readonly MAX_RETRY_COUNT = 3;
  private readonly SYNC_DEBOUNCE_MS = 2000;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  // Singleton pattern
  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  private constructor() {
    this.initialize();
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================

  private async initialize(): Promise<void> {
    try {
      // Load pending sync operations from storage
      await this.loadSyncQueue();
      
      // Setup real-time subscriptions
      await this.setupRealtimeSync();
      
      // Process any pending sync operations
      await this.processSyncQueue();
      
      console.log('DataSyncService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DataSyncService:', error);
    }
  }

  // =====================================================
  // SYNC QUEUE MANAGEMENT
  // =====================================================

  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      if (queueData) {
        const operations: SyncOperation[] = JSON.parse(queueData);
        operations.forEach(op => {
          // Convert timestamp back to Date object
          op.timestamp = new Date(op.timestamp);
          this.syncQueue.set(op.id, op);
        });
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      const operations = Array.from(this.syncQueue.values());
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): void {
    const syncOp: SyncOperation = {
      ...operation,
      id: `${operation.type}_${operation.targetId}_${Date.now()}`,
      timestamp: new Date(),
      retryCount: 0
    };

    this.syncQueue.set(syncOp.id, syncOp);
    this.saveSyncQueue();
  }

  // =====================================================
  // REAL-TIME SYNC SETUP
  // =====================================================

  private async setupRealtimeSync(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Subscribe to user profile changes
    const userChannel = supabase
      .channel(`user_sync_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `auth_user_id=eq.${user.id}`
        },
        (payload) => this.handleUserProfileChange(payload)
      )
      .subscribe();

    this.realtimeChannels.set('users', userChannel);

    // Subscribe to pet changes for user's families
    const petsChannel = supabase
      .channel(`pets_sync_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets'
        },
        (payload) => this.handlePetChange(payload)
      )
      .subscribe();

    this.realtimeChannels.set('pets', petsChannel);

    // Subscribe to veterinarian changes
    const vetsChannel = supabase
      .channel(`vets_sync_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'veterinarians'
        },
        (payload) => this.handleVeterinarianChange(payload)
      )
      .subscribe();

    this.realtimeChannels.set('veterinarians', vetsChannel);
  }

  // =====================================================
  // REAL-TIME EVENT HANDLERS
  // =====================================================

  private handleUserProfileChange(payload: any): void {
    console.log('User profile changed:', payload);
    this.debounceSync('user_profile', payload.new.id, () => {
      this.queueUserProfileSync(payload.new.auth_user_id);
    });
  }

  private handlePetChange(payload: any): void {
    console.log('Pet data changed:', payload);
    this.debounceSync('pet_data', payload.new?.id || payload.old?.id, () => {
      if (payload.eventType !== 'DELETE' && payload.new) {
        this.queuePetDataSync(payload.new.id);
      }
    });
  }

  private handleVeterinarianChange(payload: any): void {
    console.log('Veterinarian data changed:', payload);
    this.debounceSync('veterinarian', payload.new?.id || payload.old?.id, () => {
      if (payload.eventType !== 'DELETE' && payload.new) {
        this.queueVeterinarianSync(payload.new.id);
      }
    });
  }

  // =====================================================
  // DEBOUNCING FOR PERFORMANCE
  // =====================================================

  private debounceSync(type: string, targetId: string, callback: () => void): void {
    const key = `${type}_${targetId}`;
    
    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      callback();
      this.debounceTimers.delete(key);
    }, this.SYNC_DEBOUNCE_MS);
    
    this.debounceTimers.set(key, timer);
  }

  // =====================================================
  // PUBLIC SYNC METHODS
  // =====================================================

  /**
   * Queue user profile synchronization
   */
  public queueUserProfileSync(authUserId: string): void {
    this.addToSyncQueue({
      type: 'user_profile',
      targetId: authUserId,
      status: 'pending'
    });
    
    // Process queue immediately if not already processing
    if (!this.syncInProgress) {
      this.processSyncQueue();
    }
  }

  /**
   * Queue pet data synchronization
   */
  public queuePetDataSync(petId: string): void {
    this.addToSyncQueue({
      type: 'pet_data',
      targetId: petId,
      status: 'pending'
    });
    
    if (!this.syncInProgress) {
      this.processSyncQueue();
    }
  }

  /**
   * Queue veterinarian synchronization
   */
  public queueVeterinarianSync(vetId: string): void {
    this.addToSyncQueue({
      type: 'veterinarian',
      targetId: vetId,
      status: 'pending'
    });
    
    if (!this.syncInProgress) {
      this.processSyncQueue();
    }
  }

  /**
   * Queue full data synchronization for user
   */
  public async queueFullSync(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    this.addToSyncQueue({
      type: 'full_sync',
      targetId: user.id,
      status: 'pending'
    });
    
    if (!this.syncInProgress) {
      this.processSyncQueue();
    }
  }

  /**
   * Force immediate synchronization (bypasses queue)
   */
  public async forceSync(type: SyncOperation['type'], targetId: string): Promise<SyncResult> {
    return this.executeSyncOperation({ type, targetId });
  }

  // =====================================================
  // SYNC EXECUTION
  // =====================================================

  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || this.syncQueue.size === 0) {
      return;
    }

    this.syncInProgress = true;
    const operations = Array.from(this.syncQueue.values())
      .filter(op => op.status === 'pending' || op.status === 'failed')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const total = operations.length;
    let completed = 0;

    for (const operation of operations) {
      try {
        // Update progress
        this.notifyProgress({
          total,
          completed,
          current: `Syncing ${operation.type}: ${operation.targetId}`,
          percentage: Math.round((completed / total) * 100)
        });

        // Update operation status
        operation.status = 'syncing';
        this.syncQueue.set(operation.id, operation);
        await this.saveSyncQueue();

        // Execute sync operation
        const result = await this.executeSyncOperation({
          type: operation.type,
          targetId: operation.targetId
        });

        if (result.success) {
          // Remove completed operation from queue
          this.syncQueue.delete(operation.id);
          completed++;
        } else {
          // Handle retry logic
          operation.retryCount++;
          if (operation.retryCount >= this.MAX_RETRY_COUNT) {
            operation.status = 'failed';
            operation.error = result.errors?.join(', ') || 'Unknown error';
          } else {
            operation.status = 'pending';
            // Exponential backoff for retry
            setTimeout(() => {
              if (!this.syncInProgress) {
                this.processSyncQueue();
              }
            }, Math.pow(2, operation.retryCount) * 1000);
          }
          this.syncQueue.set(operation.id, operation);
        }

      } catch (error) {
        console.error(`Sync operation failed:`, error);
        operation.status = 'failed';
        operation.error = error instanceof Error ? error.message : 'Unknown error';
        this.syncQueue.set(operation.id, operation);
      }
    }

    // Final progress update
    this.notifyProgress({
      total,
      completed,
      current: 'Sync completed',
      percentage: 100
    });

    await this.saveSyncQueue();
    this.syncInProgress = false;

    // Schedule next sync check if there are still pending operations
    if (Array.from(this.syncQueue.values()).some(op => op.status === 'pending')) {
      setTimeout(() => this.processSyncQueue(), 5000);
    }
  }

  private async executeSyncOperation(params: { type: SyncOperation['type']; targetId: string }): Promise<SyncResult> {
    const { type, targetId } = params;
    
    try {
      let result: any;
      
      switch (type) {
        case 'user_profile':
          result = await this.syncUserProfile(targetId);
          break;
        case 'pet_data':
          result = await this.syncPetData(targetId);
          break;
        case 'veterinarian':
          result = await this.syncVeterinarian(targetId);
          break;
        case 'full_sync':
          result = await this.syncFullUserData(targetId);
          break;
        default:
          throw new Error(`Unknown sync type: ${type}`);
      }

      return {
        success: true,
        syncLogId: result.sync_log_id,
        updatedTables: this.extractUpdatedTables(result),
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`Sync operation ${type} failed:`, error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        updatedTables: [],
        timestamp: new Date()
      };
    }
  }

  // =====================================================
  // INDIVIDUAL SYNC METHODS
  // =====================================================

  private async syncUserProfile(authUserId: string): Promise<any> {
    const { data, error } = await supabase.rpc('sync_all_user_data', {
      user_auth_id: authUserId
    });

    if (error) throw error;
    return data;
  }

  private async syncPetData(petId: string): Promise<any> {
    const { data, error } = await supabase.rpc('sync_all_pet_data', {
      pet_uuid: petId
    });

    if (error) throw error;
    return data;
  }

  private async syncVeterinarian(vetId: string): Promise<any> {
    const { data, error } = await supabase.rpc('sync_all_veterinarian_data', {
      vet_uuid: vetId
    });

    if (error) throw error;
    return data;
  }

  private async syncFullUserData(authUserId: string): Promise<any> {
    const { data, error } = await supabase.rpc('sync_all_user_data_comprehensive', {
      user_auth_id: authUserId
    });

    if (error) throw error;
    return data;
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private extractUpdatedTables(syncResult: any): string[] {
    if (!syncResult || typeof syncResult !== 'object') return [];
    
    const tables: string[] = [];
    Object.keys(syncResult).forEach(key => {
      if (key !== 'status' && key !== 'synced_at' && key !== 'error' && key !== 'sync_log_id') {
        tables.push(key);
      }
    });
    
    return tables;
  }

  // =====================================================
  // PROGRESS TRACKING
  // =====================================================

  public addSyncProgressListener(callback: (progress: SyncProgress) => void): void {
    this.syncListeners.push(callback);
  }

  public removeSyncProgressListener(callback: (progress: SyncProgress) => void): void {
    const index = this.syncListeners.indexOf(callback);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  private notifyProgress(progress: SyncProgress): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        console.error('Error in sync progress listener:', error);
      }
    });
  }

  // =====================================================
  // STATUS AND MONITORING
  // =====================================================

  /**
   * Get current sync status
   */
  public getSyncStatus(): {
    inProgress: boolean;
    queueSize: number;
    pendingOperations: SyncOperation[];
    failedOperations: SyncOperation[];
  } {
    const operations = Array.from(this.syncQueue.values());
    
    return {
      inProgress: this.syncInProgress,
      queueSize: this.syncQueue.size,
      pendingOperations: operations.filter(op => op.status === 'pending' || op.status === 'syncing'),
      failedOperations: operations.filter(op => op.status === 'failed')
    };
  }

  /**
   * Get sync history from database
   */
  public async getSyncHistory(limit: number = 50): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('data_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch sync history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Clear failed sync operations
   */
  public clearFailedSyncs(): void {
    const operations = Array.from(this.syncQueue.values());
    operations.forEach(op => {
      if (op.status === 'failed') {
        this.syncQueue.delete(op.id);
      }
    });
    this.saveSyncQueue();
  }

  /**
   * Retry failed sync operations
   */
  public async retryFailedSyncs(): Promise<void> {
    const operations = Array.from(this.syncQueue.values());
    operations.forEach(op => {
      if (op.status === 'failed') {
        op.status = 'pending';
        op.retryCount = 0;
        op.error = undefined;
        this.syncQueue.set(op.id, op);
      }
    });
    
    await this.saveSyncQueue();
    
    if (!this.syncInProgress) {
      this.processSyncQueue();
    }
  }

  // =====================================================
  // CLEANUP
  // =====================================================

  /**
   * Cleanup resources when app is closing
   */
  public async cleanup(): Promise<void> {
    // Clear debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Unsubscribe from realtime channels
    this.realtimeChannels.forEach(channel => {
      channel.unsubscribe();
    });
    this.realtimeChannels.clear();

    // Clear listeners
    this.syncListeners.length = 0;

    // Save final queue state
    await this.saveSyncQueue();
  }
}

// Export singleton instance
export const dataSyncService = DataSyncService.getInstance();