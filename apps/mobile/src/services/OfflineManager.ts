/**
 * Offline Manager for TailTracker
 * Coordinates offline functionality and manages sync operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from './databaseService';
import { ServiceHelpers, handleServiceError } from '../utils/serviceHelpers';
import NetInfo from '@react-native-community/netinfo';

interface OfflineData {
  id: string;
  type: 'pet' | 'health' | 'vaccination' | 'user' | 'photo' | 'family';
  operation: 'create' | 'update' | 'delete';
  action?: 'create' | 'update' | 'delete'; // Legacy property
  data: any;
  timestamp: number;
  synced?: boolean;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

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
  private connectivityListeners: Set<(status: ConnectivityStatus) => void> =
    new Set();
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

  // Helper methods to replace OfflineDataLayer
  private async addToOfflineQueue(data: OfflineData): Promise<void> {
    const queue = await this.getOfflineQueue();
    queue.push(data);
    await AsyncStorage.setItem(
      '@tailtracker:offline_queue',
      JSON.stringify(queue)
    );
  }

  private async getOfflineQueue(): Promise<OfflineData[]> {
    const stored = await AsyncStorage.getItem('@tailtracker:offline_queue');
    return stored ? JSON.parse(stored) : [];
  }

  private async updateOfflineQueueItem(
    id: string,
    updates: Partial<OfflineData>
  ): Promise<void> {
    const queue = await this.getOfflineQueue();
    const index = queue.findIndex(item => item.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await AsyncStorage.setItem(
        '@tailtracker:offline_queue',
        JSON.stringify(queue)
      );
    }
  }

  private async removeFromOfflineQueue(id: string): Promise<void> {
    const queue = await this.getOfflineQueue();
    const filtered = queue.filter(item => item.id !== id);
    await AsyncStorage.setItem(
      '@tailtracker:offline_queue',
      JSON.stringify(filtered)
    );
  }

  private async getLastSyncTimestamp(): Promise<string | null> {
    return await AsyncStorage.getItem('@tailtracker:last_sync');
  }

  private async setLastSyncTimestamp(timestamp: number): Promise<void> {
    await AsyncStorage.setItem(
      '@tailtracker:last_sync',
      new Date(timestamp).toISOString()
    );
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

  public addConnectivityListener(
    listener: (status: ConnectivityStatus) => void
  ): () => void {
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
    return (
      this.lastConnectivityStatus.isConnected &&
      this.lastConnectivityStatus.isInternetReachable
    );
  }

  public async queueForOfflineSync(
    data: Omit<OfflineData, 'id' | 'timestamp' | 'synced'>
  ): Promise<void> {
    try {
      const queueItem: OfflineData = {
        ...data,
        id: `offline_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        synced: false,
      };
      await this.addToOfflineQueue(queueItem);
      console.log(
        `Queued ${data.type} ${data.operation} operation for offline sync`
      );
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
      const queue = await this.getOfflineQueue();
      const pendingItems = queue.filter(
        item => item.syncStatus === 'pending' || item.syncStatus === 'failed'
      );

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
            await this.updateOfflineQueueItem(item.id, {
              syncStatus: 'synced',
            });
            syncedCount++;
            console.log(`Synced ${item.type} ${item.action} operation`);
          } else {
            await this.updateOfflineQueueItem(item.id, {
              syncStatus: 'failed',
            });
            failedCount++;
            errors.push(`Failed to sync ${item.type} ${item.action}`);
          }
        } catch (error) {
          await this.updateOfflineQueueItem(item.id, {
            syncStatus: 'failed',
          });
          failedCount++;
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(
            `Error syncing ${item.type} ${item.action}: ${errorMessage}`
          );
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

      console.log(
        `Sync completed: ${syncedCount} synced, ${failedCount} failed`
      );
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
            await databaseService.createPetPhoto(item.data.petId, {
              url: item.data.photoUrl,
              ...item.data.metadata,
            });
            return true;
          }
          return false;
        case 'delete':
          if (item.data.petId && item.data.photoUrl) {
            await databaseService.deletePetPhoto(
              item.data.petId,
              item.data.photoUrl
            );
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
            await databaseService.createFamilyMembership({
              familyId: item.data.familyId,
              userId: item.data.userId,
              role: item.data.role,
            });
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
      const queue = await this.getOfflineQueue();
      const syncedItems = queue.filter(item => item.syncStatus === 'synced');

      for (const item of syncedItems) {
        await this.removeFromOfflineQueue(item.id);
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
      const queue = await this.getOfflineQueue();
      const lastSync = await this.getLastSyncTimestamp();

      return {
        queuedItems: queue.length,
        pendingItems: queue.filter(item => item.syncStatus === 'pending')
          .length,
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
      const queue = await this.getOfflineQueue();
      const failedItems = queue.filter(item => item.syncStatus === 'failed');

      for (const item of failedItems) {
        await this.removeFromOfflineQueue(item.id);
      }

      console.log(`Cleared ${failedItems.length} failed items from queue`);
    } catch (error) {
      throw handleServiceError(error, 'Failed to clear failed items');
    }
  }

  public async retryFailedItems(): Promise<SyncResult> {
    try {
      const queue = await this.getOfflineQueue();
      const failedItems = queue.filter(item => item.syncStatus === 'failed');

      for (const item of failedItems) {
        await this.updateOfflineQueueItem(item.id, {
          syncStatus: 'pending',
        });
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
