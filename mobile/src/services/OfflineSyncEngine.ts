import { EventEmitter } from 'events';
import NetInfo from '@react-native-community/netinfo';
import { ApiClient } from './ApiClient';
import { OfflineStorageService, OfflineRecord } from './OfflineStorageService';

export interface SyncConfig {
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  syncIntervalMs: number;
  backgroundSyncEnabled: boolean;
  wifiOnlySync: boolean;
  batteryOptimized: boolean;
  compressionEnabled: boolean;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
  percentage: number;
  estimatedTimeRemaining: number;
}

export interface ConflictResolution {
  recordId: string;
  table: string;
  localData: any;
  serverData: any;
  conflictType: 'UPDATE_CONFLICT' | 'DELETE_CONFLICT' | 'CREATE_CONFLICT';
  resolution: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE' | 'MANUAL_REQUIRED';
  mergedData?: any;
}

export class OfflineSyncEngine extends EventEmitter {
  private storage: OfflineStorageService;
  private apiClient: ApiClient;
  private config: SyncConfig;
  private syncInProgress = false;
  private syncTimer?: NodeJS.Timeout;
  private networkState = { isConnected: false, type: 'none', isWifiEnabled: false };
  private batteryLevel = 100;
  private conflicts: ConflictResolution[] = [];
  
  constructor(storage: OfflineStorageService, apiClient: ApiClient, config: SyncConfig) {
    super();
    this.storage = storage;
    this.apiClient = apiClient;
    this.config = config;
    
    this.initializeNetworkMonitoring();
    this.startPeriodicSync();
  }

  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasConnected = this.networkState.isConnected;
      this.networkState = {
        isConnected: state.isConnected || false,
        type: state.type,
        isWifiEnabled: state.type === 'wifi'
      };

      this.emit('networkStateChanged', this.networkState);

      // Trigger sync when connection is restored
      if (!wasConnected && this.networkState.isConnected) {
        this.emit('connectionRestored');
        setTimeout(() => this.sync(), 1000); // Wait a moment for connection to stabilize
      }
    });
  }

  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.shouldSync()) {
        this.sync();
      }
    }, this.config.syncIntervalMs);
  }

  private shouldSync(): boolean {
    if (this.syncInProgress) return false;
    if (!this.networkState.isConnected) return false;
    if (this.config.wifiOnlySync && !this.networkState.isWifiEnabled) return false;
    if (this.config.batteryOptimized && this.batteryLevel < 20) return false;
    
    return true;
  }

  async sync(): Promise<SyncProgress> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    if (!this.networkState.isConnected) {
      throw new Error('No network connection available');
    }

    this.syncInProgress = true;
    this.emit('syncStarted');

    const startTime = Date.now();
    const progress: SyncProgress = {
      total: 0,
      completed: 0,
      failed: 0,
      current: 'Initializing...',
      percentage: 0,
      estimatedTimeRemaining: 0
    };

    try {
      // Get pending sync items
      const syncQueue = await this.storage.getSyncQueue(this.config.batchSize);
      progress.total = syncQueue.length;
      
      if (syncQueue.length === 0) {
        this.emit('syncCompleted', progress);
        return progress;
      }

      // Group by priority for batch processing
      const priorityGroups = this.groupByPriority(syncQueue);
      
      // Process each priority group
      for (const [priority, records] of Object.entries(priorityGroups)) {
        progress.current = `Syncing ${priority.toLowerCase()} priority items...`;
        this.emit('syncProgress', progress);

        await this.processPriorityGroup(records, progress, startTime);
      }

      // Clean up synced items
      await this.storage.clearSyncedItems();
      
      // Handle any conflicts that arose during sync
      if (this.conflicts.length > 0) {
        this.emit('conflictsDetected', this.conflicts);
      }

      progress.percentage = 100;
      progress.current = 'Sync completed';
      this.emit('syncCompleted', progress);

      return progress;

    } catch (error) {
      console.error('Sync failed:', error);
      this.emit('syncFailed', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private groupByPriority(records: OfflineRecord[]): Record<string, OfflineRecord[]> {
    return records.reduce((groups, record) => {
      const priority = record.priority || 'MEDIUM';
      if (!groups[priority]) {
        groups[priority] = [];
      }
      groups[priority].push(record);
      return groups;
    }, {} as Record<string, OfflineRecord[]>);
  }

  private async processPriorityGroup(
    records: OfflineRecord[], 
    progress: SyncProgress, 
    startTime: number
  ): Promise<void> {
    // Priority order for future sorting implementation\n    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    
    for (const record of records) {
      try {
        await this.syncRecord(record);
        progress.completed++;
        
        // Update progress
        progress.percentage = Math.round((progress.completed / progress.total) * 100);
        progress.current = `Synced ${record.table} record`;
        
        // Estimate remaining time
        const elapsed = Date.now() - startTime;
        const avgTimePerItem = elapsed / progress.completed;
        progress.estimatedTimeRemaining = Math.round(avgTimePerItem * (progress.total - progress.completed));
        
        this.emit('syncProgress', progress);
        
      } catch (error) {
        console.error(`Failed to sync record ${record.id}:`, error);
        progress.failed++;
        
        await this.handleSyncError(record, error as Error);
      }
    }
  }

  private async syncRecord(record: OfflineRecord): Promise<void> {
    try {
      // Mark as syncing
      await this.storage.updateSyncStatus(record.id, 'SYNCING');

      let response: any;
      
      switch (record.action) {
        case 'CREATE':
          response = await this.syncCreate(record);
          break;
        case 'UPDATE':
          response = await this.syncUpdate(record);
          break;
        case 'DELETE':
          response = await this.syncDelete(record);
          break;
        default:
          throw new Error(`Unknown sync action: ${record.action}`);
      }

      // Mark as synced
      await this.storage.updateSyncStatus(record.id, 'SYNCED', response.timestamp);
      
    } catch (error) {
      // Check if it's a conflict error
      if (this.isConflictError(error as Error)) {
        await this.handleConflict(record, error as any);
      } else {
        throw error;
      }
    }
  }

  private async syncCreate(record: OfflineRecord): Promise<any> {
    const endpoint = this.getEndpointForTable(record.table);
    const response = await this.apiClient.post(endpoint, record.data);
    
    // Update local record with server ID if different
    if (response.data?.id && response.data.id !== record.data.id) {
      await this.updateLocalRecordId(record.table, record.data.id, response.data.id);
    }
    
    return response;
  }

  private async syncUpdate(record: OfflineRecord): Promise<any> {
    const endpoint = `${this.getEndpointForTable(record.table)}/${record.data.id}`;
    
    try {
      return await this.apiClient.put(endpoint, record.data);
    } catch (error: any) {
      if (error.status === 409) {
        // Conflict - server has newer version
        const serverData = await this.apiClient.get(endpoint);
        throw new ConflictError(record, serverData, 'UPDATE_CONFLICT');
      }
      throw error;
    }
  }

  private async syncDelete(record: OfflineRecord): Promise<any> {
    const endpoint = `${this.getEndpointForTable(record.table)}/${record.data.id}`;
    return await this.apiClient.delete(endpoint);
  }

  private async handleConflict(record: OfflineRecord, error: ConflictError): Promise<void> {
    const conflict: ConflictResolution = {
      recordId: record.id,
      table: record.table,
      localData: record.data,
      serverData: error.serverData,
      conflictType: error.type,
      resolution: (record.conflictResolution as 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE' | 'MANUAL_REQUIRED') || 'MANUAL_REQUIRED'
    };

    switch (conflict.resolution) {
      case 'LOCAL_WINS':
        await this.resolveConflictLocalWins(record);
        break;
      case 'SERVER_WINS':
        await this.resolveConflictServerWins(record, error.serverData);
        break;
      case 'MERGE':
        await this.resolveConflictMerge(record, error.serverData);
        break;
      default:
        // Add to conflicts list for manual resolution
        this.conflicts.push(conflict);
        await this.storage.updateSyncStatus(record.id, 'FAILED', undefined, 'Conflict requires manual resolution');
    }
  }

  private async resolveConflictLocalWins(record: OfflineRecord): Promise<void> {
    // Force update on server with local data
    const endpoint = `${this.getEndpointForTable(record.table)}/${record.data.id}`;
    const response = await this.apiClient.put(endpoint, { 
      ...record.data, 
      _forceUpdate: true 
    });
    
    await this.storage.updateSyncStatus(record.id, 'SYNCED', response.data?.timestamp);
  }

  private async resolveConflictServerWins(record: OfflineRecord, serverData: any): Promise<void> {
    // Update local data with server data
    await this.updateLocalRecord(record.table, serverData);
    await this.storage.updateSyncStatus(record.id, 'SYNCED', serverData.updatedAt);
  }

  private async resolveConflictMerge(record: OfflineRecord, serverData: any): Promise<void> {
    // Implement intelligent merge logic
    const mergedData = await this.mergeData(record.data, serverData);
    
    const endpoint = `${this.getEndpointForTable(record.table)}/${record.data.id}`;
    const response = await this.apiClient.put(endpoint, mergedData);
    
    // Update local record with merged data
    await this.updateLocalRecord(record.table, response);
    await this.storage.updateSyncStatus(record.id, 'SYNCED', response.data?.timestamp);
  }

  private async mergeData(localData: any, serverData: any): Promise<any> {
    // Implement intelligent merge strategies based on data type and business logic
    const merged = { ...serverData };
    
    // Merge arrays (like health records)
    if (Array.isArray(localData.items) && Array.isArray(serverData.items)) {
      const localItems = new Map(localData.items.map((item: any) => [item.id, item]));
      const serverItems = new Map(serverData.items.map((item: any) => [item.id, item]));
      
      // Keep newer versions of each item
      for (const [id, localItem] of localItems) {
        const serverItem = serverItems.get(id);
        if (!serverItem || (localItem as any).updatedAt > (serverItem as any).updatedAt) {
          merged.items = merged.items.filter((item: any) => item.id !== id);
          merged.items.push(localItem);
        }
      }
    }
    
    // Merge primitive fields (keep newer values)
    for (const key in localData) {
      if (key !== 'items' && localData[key] !== serverData[key]) {
        // For now, keep server data for safety
        // In production, implement field-specific merge logic
        merged[key] = serverData[key];
      }
    }
    
    merged.updatedAt = Math.max(
      new Date(localData.updatedAt || 0).getTime(),
      new Date(serverData.updatedAt || 0).getTime()
    );
    
    return merged;
  }

  private async handleSyncError(record: OfflineRecord, error: Error): Promise<void> {
    const retryCount = record.retryCount || 0;
    
    if (retryCount >= this.config.maxRetries) {
      await this.storage.updateSyncStatus(record.id, 'FAILED', undefined, error.message);
      this.emit('syncItemFailed', { record, error });
    } else {
      // Schedule retry with exponential backoff
      const delay = this.config.retryDelayMs * Math.pow(2, retryCount);
      setTimeout(() => {
        if (this.shouldSync()) {
          this.syncRecord(record);
        }
      }, delay);
      
      await this.storage.updateSyncStatus(record.id, 'PENDING', undefined, error.message);
    }
  }

  private isConflictError(error: Error): boolean {
    return error instanceof ConflictError || 
           (error as any).status === 409 || 
           error.message.includes('conflict');
  }

  private getEndpointForTable(table: string): string {
    const endpoints: Record<string, string> = {
      pets: '/api/pets',
      health_records: '/api/health-records',
      lost_pet_reports: '/api/lost-pets',
      family_coordination: '/api/family',
      emergency_contacts: '/api/emergency-contacts',
      images: '/api/images'
    };
    
    return endpoints[table] || `/api/${table}`;
  }

  private async updateLocalRecordId(table: string, oldId: string, newId: string): Promise<void> {
    // Implementation depends on table structure
    // This is a placeholder for the actual update logic
  }

  private async updateLocalRecord(table: string, data: any): Promise<void> {
    // Implementation depends on table structure
    // This is a placeholder for the actual update logic
  }

  // Public API for manual conflict resolution
  async resolveConflict(conflictId: string, resolution: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE', mergedData?: any): Promise<void> {
    const conflictIndex = this.conflicts.findIndex(c => c.recordId === conflictId);
    if (conflictIndex === -1) {
      throw new Error('Conflict not found');
    }

    const conflict = this.conflicts[conflictIndex];
    const record = await this.storage.getSyncQueue(1).then(queue => 
      queue.find(r => r.id === conflictId)
    );

    if (!record) {
      throw new Error('Sync record not found');
    }

    switch (resolution) {
      case 'LOCAL_WINS':
        await this.resolveConflictLocalWins(record);
        break;
      case 'SERVER_WINS':
        await this.resolveConflictServerWins(record, conflict.serverData);
        break;
      case 'MERGE':
        if (!mergedData) {
          throw new Error('Merged data required for MERGE resolution');
        }
        record.data = mergedData;
        await this.resolveConflictMerge(record, conflict.serverData);
        break;
    }

    // Remove from conflicts list
    this.conflicts.splice(conflictIndex, 1);
    this.emit('conflictResolved', { conflictId, resolution });
  }

  // Get sync statistics
  async getSyncStats(): Promise<{
    pendingCount: number;
    failedCount: number;
    lastSyncTime: number;
    conflictCount: number;
    totalSynced: number;
  }> {
    const queue = await this.storage.getSyncQueue(1000);
    
    return {
      pendingCount: queue.filter(r => r.syncStatus === 'PENDING').length,
      failedCount: queue.filter(r => r.syncStatus === 'FAILED').length,
      lastSyncTime: Math.max(...queue.map(r => r.serverTimestamp || 0)),
      conflictCount: this.conflicts.length,
      totalSynced: queue.filter(r => r.syncStatus === 'SYNCED').length
    };
  }

  // Force sync specific record types (for lost pet priority)
  async forceSyncTable(table: string): Promise<void> {
    if (!this.networkState.isConnected) {
      throw new Error('No network connection');
    }

    const records = await this.storage.getSyncQueue(100);
    const tableRecords = records.filter(r => r.table === table);
    
    for (const record of tableRecords) {
      try {
        await this.syncRecord(record);
      } catch (error) {
        console.error(`Force sync failed for ${record.id}:`, error);
      }
    }
  }

  // Pause/Resume sync
  pauseSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
    this.emit('syncPaused');
  }

  resumeSync(): void {
    this.startPeriodicSync();
    this.emit('syncResumed');
  }

  // Get current sync status
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  // Get network state
  getNetworkState() {
    return { ...this.networkState };
  }

  // Cleanup
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    this.removeAllListeners();
  }
}

class ConflictError extends Error {
  constructor(
    public record: OfflineRecord,
    public serverData: any,
    public type: 'UPDATE_CONFLICT' | 'DELETE_CONFLICT' | 'CREATE_CONFLICT'
  ) {
    super(`Sync conflict detected for ${record.table} record ${record.id}`);
    this.name = 'ConflictError';
  }
}