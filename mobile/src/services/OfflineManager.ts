/**
 * Offline Manager for TailTracker
 * Coordinates offline functionality and manages sync operations
 */

import { offlineDataLayer, OfflineData } from './OfflineDataLayer';
import { databaseService } from './databaseService';
import { ServiceHelpers, handleServiceError } from '../utils/serviceHelpers';
import NetInfo from '@react-native-community/netinfo';

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: string[];
}

export interface ConnectivityStatus {
  isConnected: boolean;
  connectionType: string;
  isInternetReachable: boolean;
}

export class OfflineManager {
  private static instance: OfflineManager;
  private syncInProgress = false;
  private connectivityListeners: Set<(status: ConnectivityStatus) => void> = new Set();
  private lastConnectivityStatus: ConnectivityStatus = {
    isConnected: false,
    connectionType: 'none',
    isInternetReachable: false,
  };

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private constructor() {
    this.initializeConnectivityMonitoring();
  }

  private async initializeConnectivityMonitoring(): Promise<void> {
    try {
      NetInfo.addEventListener(state => {
        const status: ConnectivityStatus = {
          isConnected: state.isConnected ?? false,
          connectionType: state.type,
          isInternetReachable: state.isInternetReachable ?? false,
        };

        const wasOffline = !this.lastConnectivityStatus.isConnected;
        const isNowOnline = status.isConnected && status.isInternetReachable;

        this.lastConnectivityStatus = status;
        
        this.connectivityListeners.forEach(listener => {
          try {
            listener(status);
          } catch (error) {
            console.error('Error in connectivity listener:', error);
          }
        });

        if (wasOffline && isNowOnline) {
          this.onConnectionRestored();
        }
      });
    } catch (error) {
      console.error('Failed to initialize connectivity monitoring:', error);
    }
  }

  private async onConnectionRestored(): Promise<void> {
    try {
      console.log('Connection restored, starting automatic sync...');
      await this.syncOfflineQueue();
    } catch (error) {
      console.error('Failed to sync after connection restored:', error);
    }
  }

  public addConnectivityListener(listener: (status: ConnectivityStatus) => void): () => void {
    this.connectivityListeners.add(listener);
    
    listener(this.lastConnectivityStatus);
    
    return () => {
      this.connectivityListeners.delete(listener);
    };
  }

  public async getConnectivityStatus(): Promise<ConnectivityStatus> {
    try {
      const state = await NetInfo.fetch();
      this.lastConnectivityStatus = {
        isConnected: state.isConnected ?? false,
        connectionType: state.type,
        isInternetReachable: state.isInternetReachable ?? false,
      };
      return this.lastConnectivityStatus;
    } catch (error) {
      console.error('Failed to get connectivity status:', error);
      return this.lastConnectivityStatus;
    }
  }

  public isOnline(): boolean {
    return this.lastConnectivityStatus.isConnected && this.lastConnectivityStatus.isInternetReachable;
  }

  public async queueForOfflineSync(data: Omit<OfflineData, 'id' | 'timestamp'>): Promise<void> {
    try {
      await offlineDataLayer.addToOfflineQueue(data);
      console.log(`Queued ${data.type} ${data.action} operation for offline sync`);
    } catch (error) {
      throw handleServiceError(error, 'Failed to queue item for offline sync');
    }
  }

  public async syncOfflineQueue(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: ['Sync already in progress'],
      };
    }

    if (!this.isOnline()) {
      console.log('Device is offline, skipping sync...');
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: ['Device is offline'],
      };
    }

    this.syncInProgress = true;
    console.log('Starting offline queue sync...');

    try {
      const queue = await offlineDataLayer.getOfflineQueue();
      const pendingItems = queue.filter(item => item.syncStatus === 'pending' || item.syncStatus === 'failed');

      if (pendingItems.length === 0) {
        console.log('No items to sync');
        return {
          success: true,
          syncedItems: 0,
          failedItems: 0,
          errors: [],
        };
      }

      let syncedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const item of pendingItems) {
        try {
          const success = await this.syncSingleItem(item);
          if (success) {
            await offlineDataLayer.updateOfflineQueueItem(item.id, { syncStatus: 'synced' });
            syncedCount++;
            console.log(`Synced ${item.type} ${item.action} operation`);
          } else {
            await offlineDataLayer.updateOfflineQueueItem(item.id, { syncStatus: 'failed' });
            failedCount++;
            errors.push(`Failed to sync ${item.type} ${item.action}`);
          }
        } catch (error) {
          await offlineDataLayer.updateOfflineQueueItem(item.id, { syncStatus: 'failed' });
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error syncing ${item.type} ${item.action}: ${errorMessage}`);
          console.error(`Error syncing item ${item.id}:`, error);
        }
      }

      await this.cleanupSyncedItems();

      const result: SyncResult = {
        success: failedCount === 0,
        syncedItems: syncedCount,
        failedItems: failedCount,
        errors,
      };

      console.log(`Sync completed: ${syncedCount} synced, ${failedCount} failed`);
      return result;

    } catch (error) {
      console.error('Failed to sync offline queue:', error);
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncSingleItem(item: OfflineData): Promise<boolean> {
    try {
      switch (item.type) {
        case 'user':
          return await this.syncUserItem(item);
        case 'pet':
          return await this.syncPetItem(item);
        case 'photo':
          return await this.syncPhotoItem(item);
        case 'family':
          return await this.syncFamilyItem(item);
        default:
          console.warn(`Unknown sync item type: ${item.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to sync ${item.type} item:`, error);
      return false;
    }
  }

  private async syncUserItem(item: OfflineData): Promise<boolean> {
    try {
      switch (item.action) {
        case 'create':
          await databaseService.createUser(item.data);
          return true;
        case 'update':
          if (item.data.id) {
            await databaseService.updateUser(item.data.id, item.data);
            return true;
          }
          return false;
        case 'delete':
          if (item.data.id) {
            await databaseService.deleteUser(item.data.id);
            return true;
          }
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to sync user item:', error);
      return false;
    }
  }

  private async syncPetItem(item: OfflineData): Promise<boolean> {
    try {
      switch (item.action) {
        case 'create':
          await databaseService.createPet(item.data);
          return true;
        case 'update':
          if (item.data.id) {
            await databaseService.updatePet(item.data.id, item.data);
            return true;
          }
          return false;
        case 'delete':
          if (item.data.id) {
            await databaseService.softDeletePet(item.data.id);
            return true;
          }
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to sync pet item:', error);
      return false;
    }
  }

  private async syncPhotoItem(item: OfflineData): Promise<boolean> {
    try {
      switch (item.action) {
        case 'create':
          if (item.data.petId && item.data.photoUrl) {
            await databaseService.createPetPhoto(item.data.petId, item.data.photoUrl, item.data.metadata);
            return true;
          }
          return false;
        case 'delete':
          if (item.data.id) {
            await databaseService.deletePetPhoto(item.data.id);
            return true;
          }
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to sync photo item:', error);
      return false;
    }
  }

  private async syncFamilyItem(item: OfflineData): Promise<boolean> {
    try {
      switch (item.action) {
        case 'create':
          if (item.data.familyId && item.data.userId) {
            await databaseService.createFamilyMembership(item.data.familyId, item.data.userId, item.data.role);
            return true;
          }
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to sync family item:', error);
      return false;
    }
  }

  private async cleanupSyncedItems(): Promise<void> {
    try {
      const queue = await offlineDataLayer.getOfflineQueue();
      const syncedItems = queue.filter(item => item.syncStatus === 'synced');
      
      for (const item of syncedItems) {
        await offlineDataLayer.removeFromOfflineQueue(item.id);
      }
      
      console.log(`Cleaned up ${syncedItems.length} synced items from queue`);
    } catch (error) {
      console.error('Failed to cleanup synced items:', error);
    }
  }

  public async getOfflineStatus(): Promise<{
    queuedItems: number;
    pendingItems: number;
    failedItems: number;
    lastSync: string | null;
    isOnline: boolean;
  }> {
    try {
      const queue = await offlineDataLayer.getOfflineQueue();
      const lastSync = await offlineDataLayer.getLastSyncTimestamp();
      
      return {
        queuedItems: queue.length,
        pendingItems: queue.filter(item => item.syncStatus === 'pending').length,
        failedItems: queue.filter(item => item.syncStatus === 'failed').length,
        lastSync,
        isOnline: this.isOnline(),
      };
    } catch (error) {
      console.error('Failed to get offline status:', error);
      return {
        queuedItems: 0,
        pendingItems: 0,
        failedItems: 0,
        lastSync: null,
        isOnline: this.isOnline(),
      };
    }
  }

  public async forceSync(): Promise<SyncResult> {
    console.log('Forcing sync...');
    return await this.syncOfflineQueue();
  }

  public async clearFailedItems(): Promise<void> {
    try {
      const queue = await offlineDataLayer.getOfflineQueue();
      const failedItems = queue.filter(item => item.syncStatus === 'failed');
      
      for (const item of failedItems) {
        await offlineDataLayer.removeFromOfflineQueue(item.id);
      }
      
      console.log(`Cleared ${failedItems.length} failed items from queue`);
    } catch (error) {
      throw handleServiceError(error, 'Failed to clear failed items');
    }
  }

  public async retryFailedItems(): Promise<SyncResult> {
    try {
      const queue = await offlineDataLayer.getOfflineQueue();
      const failedItems = queue.filter(item => item.syncStatus === 'failed');
      
      for (const item of failedItems) {
        await offlineDataLayer.updateOfflineQueueItem(item.id, { syncStatus: 'pending' });
      }
      
      console.log(`Reset ${failedItems.length} failed items to pending`);
      
      return await this.syncOfflineQueue();
    } catch (error) {
      throw handleServiceError(error, 'Failed to retry failed items');
    }
  }
}

export const offlineManager = OfflineManager.getInstance();
export default offlineManager;