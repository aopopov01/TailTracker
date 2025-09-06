/**
 * Offline Sync Engine for TailTracker
 * Handles conflict resolution and advanced synchronization logic
 */

import { offlineDataLayer, OfflineData } from './OfflineDataLayer';
import { databaseService, DatabaseUser, DatabasePet } from './databaseService';
import { offlineManager } from './OfflineManager';
import { ServiceHelpers, handleServiceError } from '../utils/serviceHelpers';

export type ConflictResolutionStrategy = 'server_wins' | 'client_wins' | 'merge' | 'manual';

export interface SyncConflict {
  id: string;
  type: 'pet' | 'user' | 'photo' | 'family';
  localData: any;
  serverData: any;
  conflictFields: string[];
  timestamp: string;
  strategy?: ConflictResolutionStrategy;
}

export interface SyncEngineConfig {
  batchSize: number;
  retryAttempts: number;
  conflictResolutionStrategy: ConflictResolutionStrategy;
  enableAutoMerge: boolean;
  syncInterval: number;
}

export interface DetailedSyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  conflictsDetected: number;
  conflictsResolved: number;
  errors: string[];
  conflicts: SyncConflict[];
  timestamp: string;
  duration: number;
}

export class OfflineSyncEngine {
  private static instance: OfflineSyncEngine;
  private config: SyncEngineConfig = {
    batchSize: 10,
    retryAttempts: 3,
    conflictResolutionStrategy: 'server_wins',
    enableAutoMerge: true,
    syncInterval: 30000, // 30 seconds
  };

  private syncTimer?: NodeJS.Timeout;
  private activeConflicts: Map<string, SyncConflict> = new Map();

  public static getInstance(): OfflineSyncEngine {
    if (!OfflineSyncEngine.instance) {
      OfflineSyncEngine.instance = new OfflineSyncEngine();
    }
    return OfflineSyncEngine.instance;
  }

  private constructor() {
    this.initializeAutoSync();
  }

  public configure(config: Partial<SyncEngineConfig>): void {
    this.config = { ...this.config, ...config };
    this.restartAutoSync();
  }

  public getConfiguration(): SyncEngineConfig {
    return { ...this.config };
  }

  private initializeAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      try {
        if (offlineManager.isOnline()) {
          await this.performIncrementalSync();
        }
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }, this.config.syncInterval);
  }

  private restartAutoSync(): void {
    this.initializeAutoSync();
  }

  public async performFullSync(): Promise<DetailedSyncResult> {
    const startTime = Date.now();
    console.log('Starting full sync...');

    const result: DetailedSyncResult = {
      success: false,
      syncedItems: 0,
      failedItems: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      errors: [],
      conflicts: [],
      timestamp: new Date().toISOString(),
      duration: 0,
    };

    try {
      if (!offlineManager.isOnline()) {
        result.errors.push('Device is offline');
        return result;
      }

      const queue = await offlineDataLayer.getOfflineQueue();
      const pendingItems = queue.filter(item => 
        item.syncStatus === 'pending' || item.syncStatus === 'failed'
      );

      if (pendingItems.length === 0) {
        result.success = true;
        return result;
      }

      const batches = this.createBatches(pendingItems);
      
      for (const batch of batches) {
        const batchResult = await this.processBatch(batch);
        
        result.syncedItems += batchResult.syncedItems;
        result.failedItems += batchResult.failedItems;
        result.conflictsDetected += batchResult.conflictsDetected;
        result.conflictsResolved += batchResult.conflictsResolved;
        result.errors.push(...batchResult.errors);
        result.conflicts.push(...batchResult.conflicts);
      }

      result.success = result.failedItems === 0;
      await offlineDataLayer.setLastSyncTimestamp();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      result.errors.push(errorMessage);
      console.error('Full sync failed:', error);
    } finally {
      result.duration = Date.now() - startTime;
      console.log(`Full sync completed in ${result.duration}ms`);
    }

    return result;
  }

  public async performIncrementalSync(): Promise<DetailedSyncResult> {
    const startTime = Date.now();
    
    const result: DetailedSyncResult = {
      success: false,
      syncedItems: 0,
      failedItems: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      errors: [],
      conflicts: [],
      timestamp: new Date().toISOString(),
      duration: 0,
    };

    try {
      const lastSync = await offlineDataLayer.getLastSyncTimestamp();
      const queue = await offlineDataLayer.getOfflineQueue();
      
      let itemsToSync = queue.filter(item => 
        item.syncStatus === 'pending' || item.syncStatus === 'failed'
      );

      if (lastSync) {
        const lastSyncTime = new Date(lastSync);
        itemsToSync = itemsToSync.filter(item => 
          new Date(item.timestamp) > lastSyncTime
        );
      }

      if (itemsToSync.length === 0) {
        result.success = true;
        return result;
      }

      console.log(`Incremental sync: processing ${itemsToSync.length} items`);

      const batch = itemsToSync.slice(0, this.config.batchSize);
      const batchResult = await this.processBatch(batch);

      Object.assign(result, batchResult);
      result.success = result.failedItems === 0;

      if (result.syncedItems > 0) {
        await offlineDataLayer.setLastSyncTimestamp();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      result.errors.push(errorMessage);
      console.error('Incremental sync failed:', error);
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  private createBatches<T>(items: T[]): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += this.config.batchSize) {
      batches.push(items.slice(i, i + this.config.batchSize));
    }
    return batches;
  }

  private async processBatch(batch: OfflineData[]): Promise<DetailedSyncResult> {
    const result: DetailedSyncResult = {
      success: false,
      syncedItems: 0,
      failedItems: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      errors: [],
      conflicts: [],
      timestamp: new Date().toISOString(),
      duration: 0,
    };

    for (const item of batch) {
      try {
        const itemResult = await this.syncItemWithConflictResolution(item);
        
        if (itemResult.success) {
          result.syncedItems++;
          await offlineDataLayer.updateOfflineQueueItem(item.id, { syncStatus: 'synced' });
        } else {
          result.failedItems++;
          await offlineDataLayer.updateOfflineQueueItem(item.id, { syncStatus: 'failed' });
          result.errors.push(itemResult.error || 'Unknown sync error');
        }

        if (itemResult.conflict) {
          result.conflictsDetected++;
          result.conflicts.push(itemResult.conflict);
          
          if (itemResult.conflictResolved) {
            result.conflictsResolved++;
          } else {
            this.activeConflicts.set(itemResult.conflict.id, itemResult.conflict);
          }
        }

      } catch (error) {
        result.failedItems++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Item ${item.id}: ${errorMessage}`);
        await offlineDataLayer.updateOfflineQueueItem(item.id, { syncStatus: 'failed' });
      }
    }

    result.success = result.failedItems === 0;
    return result;
  }

  private async syncItemWithConflictResolution(item: OfflineData): Promise<{
    success: boolean;
    error?: string;
    conflict?: SyncConflict;
    conflictResolved?: boolean;
  }> {
    try {
      if (item.action === 'create') {
        return await this.handleCreate(item);
      } else if (item.action === 'update') {
        return await this.handleUpdate(item);
      } else if (item.action === 'delete') {
        return await this.handleDelete(item);
      } else {
        return { success: false, error: `Unknown action: ${item.action}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async handleCreate(item: OfflineData): Promise<{
    success: boolean;
    error?: string;
    conflict?: SyncConflict;
    conflictResolved?: boolean;
  }> {
    try {
      switch (item.type) {
        case 'user':
          await databaseService.createUser(item.data);
          break;
        case 'pet':
          await databaseService.createPet(item.data);
          break;
        case 'photo':
          if (item.data.petId && item.data.photoUrl) {
            await databaseService.createPetPhoto(item.data.petId, item.data.photoUrl, item.data.metadata);
          }
          break;
        case 'family':
          if (item.data.familyId && item.data.userId) {
            await databaseService.createFamilyMembership(item.data.familyId, item.data.userId, item.data.role);
          }
          break;
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Create failed' };
    }
  }

  private async handleUpdate(item: OfflineData): Promise<{
    success: boolean;
    error?: string;
    conflict?: SyncConflict;
    conflictResolved?: boolean;
  }> {
    if (!item.data.id) {
      return { success: false, error: 'Missing ID for update operation' };
    }

    try {
      let serverData: any = null;
      
      if (item.type === 'user') {
        serverData = await databaseService.getUserById(item.data.id);
      } else if (item.type === 'pet') {
        serverData = await databaseService.getPetById(item.data.id);
      }

      if (!serverData) {
        return { success: false, error: `${item.type} not found on server` };
      }

      const conflict = this.detectConflict(item.data, serverData);
      
      if (conflict) {
        const conflictObj: SyncConflict = {
          id: `${item.type}_${item.data.id}_${Date.now()}`,
          type: item.type as any,
          localData: item.data,
          serverData,
          conflictFields: conflict,
          timestamp: new Date().toISOString(),
          strategy: this.config.conflictResolutionStrategy,
        };

        const resolvedData = await this.resolveConflict(conflictObj);
        
        if (resolvedData) {
          if (item.type === 'user') {
            await databaseService.updateUser(item.data.id, resolvedData);
          } else if (item.type === 'pet') {
            await databaseService.updatePet(item.data.id, resolvedData);
          }
          
          return { 
            success: true, 
            conflict: conflictObj, 
            conflictResolved: true 
          };
        } else {
          return { 
            success: false, 
            conflict: conflictObj, 
            conflictResolved: false,
            error: 'Conflict requires manual resolution' 
          };
        }
      } else {
        if (item.type === 'user') {
          await databaseService.updateUser(item.data.id, item.data);
        } else if (item.type === 'pet') {
          await databaseService.updatePet(item.data.id, item.data);
        }
        return { success: true };
      }

    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
  }

  private async handleDelete(item: OfflineData): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!item.data.id) {
      return { success: false, error: 'Missing ID for delete operation' };
    }

    try {
      if (item.type === 'user') {
        await databaseService.deleteUser(item.data.id);
      } else if (item.type === 'pet') {
        await databaseService.softDeletePet(item.data.id);
      } else if (item.type === 'photo') {
        await databaseService.deletePetPhoto(item.data.id);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  private detectConflict(localData: any, serverData: any): string[] | null {
    const conflictFields: string[] = [];
    const localTimestamp = new Date(localData.updated_at || localData.updatedAt);
    const serverTimestamp = new Date(serverData.updated_at || serverData.updatedAt);

    if (serverTimestamp > localTimestamp) {
      const fieldsToCheck = ['name', 'email', 'species', 'breed', 'weight', 'color', 'full_name'];
      
      for (const field of fieldsToCheck) {
        if (localData[field] !== undefined && 
            serverData[field] !== undefined && 
            localData[field] !== serverData[field]) {
          conflictFields.push(field);
        }
      }
    }

    return conflictFields.length > 0 ? conflictFields : null;
  }

  private async resolveConflict(conflict: SyncConflict): Promise<any | null> {
    switch (conflict.strategy || this.config.conflictResolutionStrategy) {
      case 'server_wins':
        return conflict.serverData;
        
      case 'client_wins':
        return conflict.localData;
        
      case 'merge':
        if (this.config.enableAutoMerge) {
          return this.autoMergeData(conflict.localData, conflict.serverData);
        }
        return null;
        
      case 'manual':
        return null;
        
      default:
        return conflict.serverData;
    }
  }

  private autoMergeData(localData: any, serverData: any): any {
    const merged = { ...serverData };
    
    const localTimestamp = new Date(localData.updated_at || localData.updatedAt);
    const serverTimestamp = new Date(serverData.updated_at || serverData.updatedAt);

    Object.keys(localData).forEach(key => {
      if (key === 'updated_at' || key === 'updatedAt') {
        merged[key] = localTimestamp > serverTimestamp ? localData[key] : serverData[key];
      } else if (localData[key] !== null && localData[key] !== undefined) {
        if (typeof localData[key] === 'string' && localData[key].length > 0) {
          merged[key] = localData[key];
        } else if (typeof localData[key] === 'number' && localData[key] > 0) {
          merged[key] = localData[key];
        } else if (Array.isArray(localData[key]) && localData[key].length > 0) {
          merged[key] = [...new Set([...serverData[key] || [], ...localData[key]])];
        }
      }
    });

    return merged;
  }

  public getActiveConflicts(): SyncConflict[] {
    return Array.from(this.activeConflicts.values());
  }

  public async resolveConflictManually(
    conflictId: string, 
    resolution: any, 
    strategy?: ConflictResolutionStrategy
  ): Promise<boolean> {
    const conflict = this.activeConflicts.get(conflictId);
    if (!conflict) {
      return false;
    }

    try {
      if (strategy) {
        conflict.strategy = strategy;
        const autoResolved = await this.resolveConflict(conflict);
        if (autoResolved) {
          resolution = autoResolved;
        }
      }

      if (conflict.type === 'user') {
        await databaseService.updateUser(conflict.localData.id, resolution);
      } else if (conflict.type === 'pet') {
        await databaseService.updatePet(conflict.localData.id, resolution);
      }

      this.activeConflicts.delete(conflictId);
      console.log(`Manually resolved conflict ${conflictId}`);
      return true;
    } catch (error) {
      console.error(`Failed to resolve conflict ${conflictId}:`, error);
      return false;
    }
  }

  public async clearResolvedConflicts(): Promise<void> {
    this.activeConflicts.clear();
  }

  public stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  public startAutoSync(): void {
    this.initializeAutoSync();
  }

  public async getSyncStatistics(): Promise<{
    totalSyncOperations: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncTime: number;
    activeConflicts: number;
    lastSyncTimestamp: string | null;
  }> {
    try {
      const lastSync = await offlineDataLayer.getLastSyncTimestamp();
      const activeConflictsCount = this.activeConflicts.size;
      
      return {
        totalSyncOperations: 0, 
        successfulSyncs: 0, 
        failedSyncs: 0, 
        averageSyncTime: 0, 
        activeConflicts: activeConflictsCount,
        lastSyncTimestamp: lastSync,
      };
    } catch (error) {
      console.error('Failed to get sync statistics:', error);
      return {
        totalSyncOperations: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageSyncTime: 0,
        activeConflicts: 0,
        lastSyncTimestamp: null,
      };
    }
  }
}

export const offlineSyncEngine = OfflineSyncEngine.getInstance();
export default offlineSyncEngine;