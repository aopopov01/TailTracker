import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { PerformanceMonitor } from './PerformanceMonitor';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: number;
  etag?: string;
  size: number;
  priority: 'high' | 'medium' | 'low';
}

interface CacheConfig {
  maxSize: number; // bytes
  maxAge: number; // milliseconds
  enableCompression: boolean;
  persistToDisk: boolean;
  syncStrategy: 'immediate' | 'lazy' | 'scheduled';
}

interface SyncQueueItem {
  key: string;
  data: any;
  operation: 'create' | 'update' | 'delete';
  timestamp: number;
  retryCount: number;
  priority: number;
}

class AdvancedCacheServiceClass {
  private memoryCache = new Map<string, CacheEntry>();
  private syncQueue: SyncQueueItem[] = [];
  private isOnline = true;
  private config: CacheConfig;
  private currentSize = 0;
  private syncInProgress = false;
  private compressionEnabled = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      enableCompression: true,
      persistToDisk: true,
      syncStrategy: 'lazy',
      ...config
    };

    this.initializeCache();
    this.setupNetworkListener();
    this.startBackgroundSync();
  }

  private async initializeCache() {
    // Load persisted cache entries
    if (this.config.persistToDisk) {
      await this.loadPersistedCache();
    }

    // Initialize compression if available
    this.compressionEnabled = this.config.enableCompression && 
      typeof global.TextEncoder !== 'undefined';

    // Load sync queue
    await this.loadSyncQueue();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        // Just came online, start sync
        this.processSyncQueue();
      }
    });
  }

  private startBackgroundSync() {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && this.config.syncStrategy === 'scheduled') {
        this.processSyncQueue();
      }
    }, 5 * 60 * 1000);
  }  // Core cache operations
  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: 'high' | 'medium' | 'low';
      etag?: string;
      sync?: boolean;
    } = {}
  ): Promise<void> {
    PerformanceMonitor.startAPICall(`cache_set_${key}`, 'SET');

    try {
      const serialized = JSON.stringify(data);
      const size = new Blob([serialized]).size;
      
      // Compression would be applied here if implemented
      if (this.compressionEnabled && size > 1000) {
        await this.compress(serialized);
      }

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (options.ttl || this.config.maxAge),
        version: 1,
        etag: options.etag,
        size,
        priority: options.priority || 'medium'
      };

      // Check if we need to free space
      await this.ensureSpace(size);

      this.memoryCache.set(key, entry);
      this.currentSize += size;

      // Persist to disk if enabled
      if (this.config.persistToDisk) {
        await this.persistEntry(key, entry);
      }

      // Add to sync queue if needed
      if (options.sync !== false) {
        this.addToSyncQueue(key, data, 'create');
      }

      PerformanceMonitor.endAPICall(`cache_set_${key}`, 'SET', 200);
    } catch (error) {
      PerformanceMonitor.endAPICall(`cache_set_${key}`, 'SET', 500, true);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    PerformanceMonitor.startAPICall(`cache_get_${key}`, 'GET');

    try {
      // Check memory cache first
      const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
      
      if (entry) {
        // Check if expired
        if (Date.now() > entry.expiresAt) {
          await this.delete(key);
          PerformanceMonitor.endAPICall(`cache_get_${key}`, 'GET', 404);
          return null;
        }

        PerformanceMonitor.endAPICall(`cache_get_${key}`, 'GET', 200);
        return entry.data;
      }

      // Try disk cache if enabled
      if (this.config.persistToDisk) {
        const diskEntry = await this.loadPersistedEntry<T>(key);
        if (diskEntry && Date.now() <= diskEntry.expiresAt) {
          // Move back to memory cache
          this.memoryCache.set(key, diskEntry);
          this.currentSize += diskEntry.size;
          
          PerformanceMonitor.endAPICall(`cache_get_${key}`, 'GET', 200);
          return diskEntry.data;
        }
      }

      PerformanceMonitor.endAPICall(`cache_get_${key}`, 'GET', 404);
      return null;
    } catch {
      PerformanceMonitor.endAPICall(`cache_get_${key}`, 'GET', 500, true);
      return null;
    }
  }  async delete(key: string): Promise<void> {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.memoryCache.delete(key);
    }

    // Remove from disk
    if (this.config.persistToDisk) {
      await AsyncStorage.removeItem(`cache_${key}`);
    }

    // Add deletion to sync queue
    this.addToSyncQueue(key, null, 'delete');
  }

  // Advanced cache operations
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      ttl?: number;
      priority?: 'high' | 'medium' | 'low';
      staleWhileRevalidate?: boolean;
    } = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached && !options.staleWhileRevalidate) {
      return cached;
    }

    try {
      const fresh = await fetcher();
      await this.set(key, fresh, options);
      return fresh;
    } catch (error) {
      // Return stale data if available and fetch failed
      if (cached) {
        console.warn(`Using stale cache for ${key}, fetch failed:`, error);
        return cached;
      }
      throw error;
    }
  }

  // Bulk operations for efficiency
  async setMultiple<T>(entries: { key: string; data: T; options?: any }[]): Promise<void> {
    const promises = entries.map(({ key, data, options }) => 
      this.set(key, data, options)
    );
    await Promise.allSettled(promises);
  }

  async getMultiple<T>(keys: string[]): Promise<{ key: string; data: T | null }[]> {
    const promises = keys.map(async key => ({
      key,
      data: await this.get<T>(key)
    }));
    
    return Promise.all(promises);
  }

  // Cache management
  private async ensureSpace(requiredSize: number): Promise<void> {
    while (this.currentSize + requiredSize > this.config.maxSize && this.memoryCache.size > 0) {
      // Remove least recently used low-priority items
      const entries = Array.from(this.memoryCache.entries());
      
      // Sort by priority and timestamp (LRU for same priority)
      entries.sort((a, b) => {
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        const priorityDiff = priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        return a[1].timestamp - b[1].timestamp;
      });

      const [keyToRemove] = entries[0];
      await this.delete(keyToRemove);
    }
  }  // Sync queue management
  private addToSyncQueue(key: string, data: any, operation: 'create' | 'update' | 'delete') {
    const existingIndex = this.syncQueue.findIndex(item => item.key === key);
    
    if (existingIndex >= 0) {
      // Update existing item
      this.syncQueue[existingIndex] = {
        ...this.syncQueue[existingIndex],
        data,
        operation,
        timestamp: Date.now()
      };
    } else {
      // Add new item
      this.syncQueue.push({
        key,
        data,
        operation,
        timestamp: Date.now(),
        retryCount: 0,
        priority: operation === 'delete' ? 3 : (operation === 'update' ? 2 : 1)
      });
    }

    // Auto-sync if strategy is immediate
    if (this.config.syncStrategy === 'immediate' && this.isOnline) {
      this.processSyncQueue();
    }

    // Persist sync queue
    this.persistSyncQueue();
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Sort by priority and timestamp
      this.syncQueue.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.timestamp - b.timestamp;
      });

      const batch = this.syncQueue.slice(0, 10); // Process 10 at a time
      const processed: string[] = [];

      for (const item of batch) {
        try {
          await this.syncItem(item);
          processed.push(item.key);
        } catch (error) {
          item.retryCount++;
          
          // Remove items that have failed too many times
          if (item.retryCount > 3) {
            processed.push(item.key);
            console.error(`Sync failed permanently for ${item.key}:`, error);
          }
        }
      }

      // Remove processed items
      this.syncQueue = this.syncQueue.filter(item => !processed.includes(item.key));
      await this.persistSyncQueue();

    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    // This would integrate with your actual API
    // For now, we'll simulate the sync process
    console.log(`Syncing ${item.operation} for ${item.key}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Persistence methods
  private async loadPersistedCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      const entries = await AsyncStorage.multiGet(cacheKeys);
      
      for (const [key, value] of entries) {
        if (value) {
          const cacheKey = key.replace('cache_', '');
          const entry = JSON.parse(value);
          
          if (Date.now() <= entry.expiresAt) {
            this.memoryCache.set(cacheKey, entry);
            this.currentSize += entry.size;
          } else {
            // Clean up expired entry
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load persisted cache:', error);
    }
  }  private async persistEntry(key: string, entry: CacheEntry): Promise<void> {
    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error(`Failed to persist cache entry ${key}:`, error);
    }
  }

  private async loadPersistedEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const value = await AsyncStorage.getItem(`cache_${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to load persisted entry ${key}:`, error);
      return null;
    }
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const queue = await AsyncStorage.getItem('sync_queue');
      if (queue) {
        this.syncQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  private async persistSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  // Utility methods
  private async compress(data: string): Promise<string> {
    // Simple compression using TextEncoder/TextDecoder
    // In production, you might want to use a more sophisticated compression library
    try {
      // Compression implementation placeholder
      
      // For now, just return the original data
      // You could implement actual compression here
      return data;
    } catch {
      return data;
    }
  }

  // Public utility methods
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.currentSize = 0;
    this.syncQueue = [];

    if (this.config.persistToDisk) {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove([...cacheKeys, 'sync_queue']);
    }
  }

  getCacheStats() {
    return {
      memoryEntries: this.memoryCache.size,
      currentSize: this.currentSize,
      maxSize: this.config.maxSize,
      usagePercentage: (this.currentSize / this.config.maxSize) * 100,
      syncQueueLength: this.syncQueue.length,
      isOnline: this.isOnline,
      config: this.config
    };
  }
}

// Singleton instance
export const AdvancedCacheService = new AdvancedCacheServiceClass();
export default AdvancedCacheService;