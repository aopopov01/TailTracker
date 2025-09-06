/**
 * Offline Data Layer for TailTracker
 * Manages local storage, caching, and data persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabasePet, DatabaseUser } from './databaseService';
import { ServiceHelpers } from '../utils/serviceHelpers';

export interface OfflineData {
  id: string;
  type: 'pet' | 'user' | 'photo' | 'family';
  data: any;
  timestamp: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  action: 'create' | 'update' | 'delete';
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: string;
  ttl: number;
  key: string;
}

export class OfflineDataLayer {
  private static instance: OfflineDataLayer;
  private readonly STORAGE_KEYS = {
    OFFLINE_QUEUE: '@TailTracker:offlineQueue',
    USER_CACHE: '@TailTracker:userCache',
    PET_CACHE: '@TailTracker:petCache',
    PHOTO_CACHE: '@TailTracker:photoCache',
    SETTINGS_CACHE: '@TailTracker:settingsCache',
    SYNC_TIMESTAMP: '@TailTracker:lastSync',
  };

  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  public static getInstance(): OfflineDataLayer {
    if (!OfflineDataLayer.instance) {
      OfflineDataLayer.instance = new OfflineDataLayer();
    }
    return OfflineDataLayer.instance;
  }

  // Queue Management
  async addToOfflineQueue(item: Omit<OfflineData, 'id' | 'timestamp'>): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const newItem: OfflineData = {
        ...item,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      
      queue.push(newItem);
      await AsyncStorage.setItem(this.STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add item to offline queue:', error);
      throw error;
    }
  }

  async getOfflineQueue(): Promise<OfflineData[]> {
    try {
      const queueData = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_QUEUE);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  }

  async updateOfflineQueueItem(itemId: string, updates: Partial<OfflineData>): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const itemIndex = queue.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        queue[itemIndex] = { ...queue[itemIndex], ...updates };
        await AsyncStorage.setItem(this.STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Failed to update offline queue item:', error);
      throw error;
    }
  }

  async removeFromOfflineQueue(itemId: string): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const filteredQueue = queue.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(this.STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error('Failed to remove item from offline queue:', error);
      throw error;
    }
  }

  async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.OFFLINE_QUEUE);
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
      throw error;
    }
  }

  // Cache Management
  async setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: new Date().toISOString(),
        ttl,
        key,
      };
      
      await AsyncStorage.setItem(`@TailTracker:cache:${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Failed to set cache:', error);
      throw error;
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const cacheData = await AsyncStorage.getItem(`@TailTracker:cache:${key}`);
      if (!cacheData) return null;

      const cacheEntry: CacheEntry<T> = JSON.parse(cacheData);
      const now = Date.now();
      const cacheTime = new Date(cacheEntry.timestamp).getTime();
      
      // Check if cache is expired
      if (now - cacheTime > cacheEntry.ttl) {
        await this.removeCache(key);
        return null;
      }
      
      return cacheEntry.data;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@TailTracker:cache:${key}`);
    } catch (error) {
      console.error('Failed to remove cache:', error);
      throw error;
    }
  }

  async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@TailTracker:cache:'));
      
      for (const key of cacheKeys) {
        const cacheData = await AsyncStorage.getItem(key);
        if (!cacheData) continue;
        
        const cacheEntry: CacheEntry = JSON.parse(cacheData);
        const now = Date.now();
        const cacheTime = new Date(cacheEntry.timestamp).getTime();
        
        if (now - cacheTime > cacheEntry.ttl) {
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@TailTracker:cache:'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear all cache:', error);
      throw error;
    }
  }

  // Specialized Cache Methods
  async cacheUser(user: DatabaseUser): Promise<void> {
    const cacheKey = `user_${user.id}`;
    await this.setCache(cacheKey, user);
    
    // Also cache by auth_user_id for quick lookup
    await this.setCache(`user_auth_${user.auth_user_id}`, user);
  }

  async getCachedUser(userId: number): Promise<DatabaseUser | null> {
    return await this.getCache<DatabaseUser>(`user_${userId}`);
  }

  async getCachedUserByAuthId(authUserId: string): Promise<DatabaseUser | null> {
    return await this.getCache<DatabaseUser>(`user_auth_${authUserId}`);
  }

  async cachePets(userId: number, pets: DatabasePet[]): Promise<void> {
    const cacheKey = `pets_user_${userId}`;
    await this.setCache(cacheKey, pets);
    
    // Cache individual pets
    for (const pet of pets) {
      await this.setCache(`pet_${pet.id}`, pet);
    }
  }

  async getCachedPets(userId: number): Promise<DatabasePet[] | null> {
    return await this.getCache<DatabasePet[]>(`pets_user_${userId}`);
  }

  async getCachedPet(petId: number): Promise<DatabasePet | null> {
    return await this.getCache<DatabasePet>(`pet_${petId}`);
  }

  // Sync Management
  async setLastSyncTimestamp(timestamp: string = new Date().toISOString()): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.SYNC_TIMESTAMP, timestamp);
    } catch (error) {
      console.error('Failed to set sync timestamp:', error);
      throw error;
    }
  }

  async getLastSyncTimestamp(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.STORAGE_KEYS.SYNC_TIMESTAMP);
    } catch (error) {
      console.error('Failed to get sync timestamp:', error);
      return null;
    }
  }

  // Data Export/Import for Backup
  async exportOfflineData(): Promise<{
    queue: OfflineData[];
    cache: Record<string, CacheEntry>;
    timestamp: string;
  }> {
    try {
      const queue = await this.getOfflineQueue();
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@TailTracker:cache:'));
      
      const cache: Record<string, CacheEntry> = {};
      
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const cleanKey = key.replace('@TailTracker:cache:', '');
          cache[cleanKey] = JSON.parse(data);
        }
      }
      
      return {
        queue,
        cache,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to export offline data:', error);
      throw error;
    }
  }

  async importOfflineData(data: {
    queue: OfflineData[];
    cache: Record<string, CacheEntry>;
  }): Promise<void> {
    try {
      // Import queue
      await AsyncStorage.setItem(this.STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(data.queue));
      
      // Import cache
      for (const [key, entry] of Object.entries(data.cache)) {
        await AsyncStorage.setItem(`@TailTracker:cache:${key}`, JSON.stringify(entry));
      }
    } catch (error) {
      console.error('Failed to import offline data:', error);
      throw error;
    }
  }

  // Storage Management
  async getStorageUsage(): Promise<{
    totalKeys: number;
    cacheKeys: number;
    queueItems: number;
    estimatedSizeKB: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@TailTracker:cache:'));
      const queue = await this.getOfflineQueue();
      
      // Rough size estimation
      let totalSize = 0;
      for (const key of keys) {
        if (key.startsWith('@TailTracker:')) {
          const data = await AsyncStorage.getItem(key);
          totalSize += data?.length || 0;
        }
      }
      
      return {
        totalKeys: keys.filter(key => key.startsWith('@TailTracker:')).length,
        cacheKeys: cacheKeys.length,
        queueItems: queue.length,
        estimatedSizeKB: Math.round(totalSize / 1024),
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return {
        totalKeys: 0,
        cacheKeys: 0,
        queueItems: 0,
        estimatedSizeKB: 0,
      };
    }
  }

  async cleanupStorage(options: {
    clearExpiredCache?: boolean;
    clearFailedQueueItems?: boolean;
    maxQueueAge?: number; // days
  } = {}): Promise<void> {
    try {
      if (options.clearExpiredCache) {
        await this.clearExpiredCache();
      }
      
      if (options.clearFailedQueueItems) {
        const queue = await this.getOfflineQueue();
        const validQueue = queue.filter(item => item.syncStatus !== 'failed');
        await AsyncStorage.setItem(this.STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(validQueue));
      }
      
      if (options.maxQueueAge) {
        const queue = await this.getOfflineQueue();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - options.maxQueueAge);
        
        const recentQueue = queue.filter(item => 
          new Date(item.timestamp) > cutoffDate
        );
        await AsyncStorage.setItem(this.STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(recentQueue));
      }
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const offlineDataLayer = OfflineDataLayer.getInstance();
export default offlineDataLayer;