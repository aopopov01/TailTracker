import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: number;
  etag?: string;
  size: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  accessCount: number;
  lastAccessed: number;
  compressed: boolean;
  checksum: string;
}

interface CacheConfig {
  maxMemorySize: number; // bytes
  maxDiskSize: number; // bytes
  maxAge: number; // milliseconds
  enableCompression: boolean;
  compressionThreshold: number; // bytes
  persistToDisk: boolean;
  syncStrategy: 'immediate' | 'lazy' | 'scheduled';
  enableIntegrityCheck: boolean;
  enableStatistics: boolean;
  backgroundCleanup: boolean;
  memoryPressureThreshold: number; // percentage
}

interface CacheStatistics {
  hitCount: number;
  missCount: number;
  evictionCount: number;
  compressionRatio: number;
  memoryUsage: number;
  diskUsage: number;
  averageAccessTime: number;
  totalRequests: number;
}

interface MemoryPool {
  available: number;
  used: number;
  reserved: number;
  gcTrigger: number;
}

class EnhancedCacheManagerClass {
  private memoryCache = new Map<string, CacheEntry>();
  private diskCache = new Set<string>();
  private config: CacheConfig;
  private statistics: CacheStatistics;
  private memoryPool: MemoryPool;
  private compressionWorker?: Worker;
  private cleanupInterval?: NodeJS.Timeout;
  private memoryPressureInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxMemorySize: 64 * 1024 * 1024, // 64MB
      maxDiskSize: 256 * 1024 * 1024, // 256MB
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      enableCompression: true,
      compressionThreshold: 1024, // 1KB
      persistToDisk: true,
      syncStrategy: 'lazy',
      enableIntegrityCheck: true,
      enableStatistics: true,
      backgroundCleanup: true,
      memoryPressureThreshold: 85,
      ...config
    };

    this.statistics = {
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      compressionRatio: 1.0,
      memoryUsage: 0,
      diskUsage: 0,
      averageAccessTime: 0,
      totalRequests: 0
    };

    this.memoryPool = {
      available: this.config.maxMemorySize,
      used: 0,
      reserved: 0,
      gcTrigger: this.config.maxMemorySize * 0.8
    };

    this.initializeCache();
  }

  private async initializeCache() {
    if (this.isInitialized) return;

    try {
      // Load persisted configuration
      await this.loadConfiguration();
      
      // Initialize memory pool
      this.initializeMemoryPool();
      
      // Load existing cache entries
      if (this.config.persistToDisk) {
        await this.loadPersistedCache();
      }

      // Load statistics
      if (this.config.enableStatistics) {
        await this.loadStatistics();
      }

      // Start background processes
      if (this.config.backgroundCleanup) {
        this.startBackgroundCleanup();
      }

      this.startMemoryPressureMonitoring();

      this.isInitialized = true;
      console.log('Enhanced Cache Manager initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Enhanced Cache Manager:', error);
      throw error;
    }
  }

  // Memory Pool Management
  private initializeMemoryPool(): void {
    this.memoryPool = {
      available: this.config.maxMemorySize,
      used: 0,
      reserved: this.config.maxMemorySize * 0.1, // Reserve 10%
      gcTrigger: this.config.maxMemorySize * 0.8
    };
  }

  private async allocateMemory(size: number): Promise<boolean> {
    if (this.memoryPool.used + size > this.memoryPool.available - this.memoryPool.reserved) {
      // Trigger garbage collection
      await this.performGarbageCollection();
      
      // Check again after GC
      if (this.memoryPool.used + size > this.memoryPool.available - this.memoryPool.reserved) {
        return false; // Cannot allocate
      }
    }

    this.memoryPool.used += size;
    return true;
  }

  private deallocateMemory(size: number): void {
    this.memoryPool.used = Math.max(0, this.memoryPool.used - size);
  }

  // Advanced Cache Operations with LRU
  async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      priority?: 'critical' | 'high' | 'medium' | 'low';
      etag?: string;
      enableCompression?: boolean;
      persistToDisk?: boolean;
    } = {}
  ): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      // Serialize and calculate size
      const serialized = JSON.stringify(data);
      const originalSize = new Blob([serialized]).size;
      
      // Attempt memory allocation
      if (!await this.allocateMemory(originalSize)) {
        // Force eviction of low-priority items
        await this.forceEviction(originalSize);
        
        if (!await this.allocateMemory(originalSize)) {
          console.warn(`Cannot cache ${key}: insufficient memory`);
          return false;
        }
      }

      // Compress if beneficial
      let finalData = serialized;
      let compressed = false;
      let finalSize = originalSize;

      if (options.enableCompression !== false && 
          this.config.enableCompression && 
          originalSize > this.config.compressionThreshold) {
        
        const compressedData = await this.compressData(serialized);
        if (compressedData.length < originalSize * 0.9) { // Only use if >10% savings
          finalData = compressedData;
          compressed = true;
          finalSize = new Blob([compressedData]).size;
          
          // Update compression statistics
          this.updateCompressionStats(originalSize, finalSize);
        }
      }

      // Generate checksum for integrity
      const checksum = this.config.enableIntegrityCheck 
        ? await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, finalData)
        : '';

      // Create cache entry
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (options.ttl || this.config.maxAge),
        version: 1,
        etag: options.etag,
        size: finalSize,
        priority: options.priority || 'medium',
        accessCount: 1,
        lastAccessed: Date.now(),
        compressed,
        checksum
      };

      // Store in memory cache
      this.memoryCache.set(key, entry);
      this.statistics.memoryUsage += finalSize;

      // Persist to disk if enabled
      if (options.persistToDisk !== false && this.config.persistToDisk) {
        await this.persistToDisk(key, entry, finalData);
      }

      // Update statistics
      this.updateStatistics('set', performance.now() - startTime);
      
      return true;

    } catch (error) {
      console.error(`Failed to cache ${key}:`, error);
      this.updateStatistics('set', performance.now() - startTime, true);
      return false;
    }
  }

  async get<T>(key: string, options: { validateIntegrity?: boolean } = {}): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      // Check memory cache first
      let entry = this.memoryCache.get(key) as CacheEntry<T> | undefined | null;
      
      if (entry) {
        // Check if expired
        if (Date.now() > entry.expiresAt) {
          await this.delete(key);
          this.statistics.missCount++;
          return null;
        }

        // Update access patterns for LRU
        entry.lastAccessed = Date.now();
        entry.accessCount++;
        
        // Cache hit
        this.statistics.hitCount++;
        this.updateStatistics('get', performance.now() - startTime);
        
        return entry.data;
      }

      // Try disk cache
      if (this.config.persistToDisk && this.diskCache.has(key)) {
        entry = await this.loadFromDisk<T>(key);
        
        if (entry && Date.now() <= entry.expiresAt) {
          // Validate integrity if enabled
          if (options.validateIntegrity && this.config.enableIntegrityCheck) {
            const isValid = await this.validateIntegrity(entry);
            if (!isValid) {
              console.warn(`Integrity check failed for ${key}`);
              await this.delete(key);
              this.statistics.missCount++;
              return null;
            }
          }

          // Move back to memory cache if space allows
          if (await this.allocateMemory(entry.size)) {
            this.memoryCache.set(key, entry);
            this.statistics.memoryUsage += entry.size;
          }

          this.statistics.hitCount++;
          this.updateStatistics('get', performance.now() - startTime);
          
          return entry.data;
        }
      }

      // Cache miss
      this.statistics.missCount++;
      this.updateStatistics('get', performance.now() - startTime);
      return null;

    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      this.statistics.missCount++;
      this.updateStatistics('get', performance.now() - startTime, true);
      return null;
    }
  }

  // LRU Eviction Strategy
  private async performLRUEviction(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.memoryCache.entries());
    
    // Sort by priority and last accessed time (LRU for same priority)
    entries.sort((a, b) => {
      const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      const priorityDiff = priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // For same priority, evict least recently used
      return a[1].lastAccessed - b[1].lastAccessed;
    });

    let freedSpace = 0;
    const keysToEvict: string[] = [];

    for (const [key, entry] of entries) {
      if (entry.priority === 'critical') continue; // Never evict critical items
      
      keysToEvict.push(key);
      freedSpace += entry.size;
      
      if (freedSpace >= requiredSpace) break;
    }

    // Perform evictions
    for (const key of keysToEvict) {
      await this.evict(key);
      this.statistics.evictionCount++;
    }
  }

  private async forceEviction(requiredSpace: number): Promise<void> {
    console.log(`Force evicting to free ${requiredSpace} bytes`);
    
    // First, try LRU eviction
    await this.performLRUEviction(requiredSpace);
    
    // If still not enough space, evict by access frequency
    const availableSpace = this.memoryPool.available - this.memoryPool.used - this.memoryPool.reserved;
    if (availableSpace < requiredSpace) {
      await this.performFrequencyBasedEviction(requiredSpace - availableSpace);
    }
  }

  private async performFrequencyBasedEviction(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.memoryCache.entries());
    
    // Sort by access count (least accessed first)
    entries.sort((a, b) => {
      if (a[1].priority === 'critical' && b[1].priority !== 'critical') return 1;
      if (b[1].priority === 'critical' && a[1].priority !== 'critical') return -1;
      return a[1].accessCount - b[1].accessCount;
    });

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (entry.priority === 'critical') continue;
      
      await this.evict(key);
      freedSpace += entry.size;
      this.statistics.evictionCount++;
      
      if (freedSpace >= requiredSpace) break;
    }
  }

  private async evict(key: string): Promise<void> {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.deallocateMemory(entry.size);
      this.statistics.memoryUsage -= entry.size;
      this.memoryCache.delete(key);
      
      // Keep in disk cache if enabled
      if (this.config.persistToDisk) {
        this.diskCache.add(key);
      }
    }
  }

  // Garbage Collection
  private async performGarbageCollection(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Remove expired entries
      const expiredKeys: string[] = [];
      const now = Date.now();
      
      for (const [key, entry] of this.memoryCache.entries()) {
        if (now > entry.expiresAt) {
          expiredKeys.push(key);
        }
      }

      for (const key of expiredKeys) {
        await this.delete(key);
      }

      // Trigger native garbage collection if available
      if (global.gc) {
        global.gc();
      }

      console.log(`Garbage collection completed in ${performance.now() - startTime}ms, removed ${expiredKeys.length} expired entries`);

    } catch (error) {
      console.error('Garbage collection failed:', error);
    }
  }

  // Compression
  private async compressData(data: string): Promise<string> {
    try {
      // Simple run-length encoding for repeated patterns
      // In production, you might want to use a more sophisticated algorithm
      let compressed = '';
      let currentChar = data[0];
      let count = 1;

      for (let i = 1; i < data.length; i++) {
        if (data[i] === currentChar && count < 255) {
          count++;
        } else {
          compressed += count > 3 ? `${count}${currentChar}` : currentChar.repeat(count);
          currentChar = data[i];
          count = 1;
        }
      }
      compressed += count > 3 ? `${count}${currentChar}` : currentChar.repeat(count);

      return compressed.length < data.length ? compressed : data;

    } catch (error) {
      console.error('Compression failed:', error);
      return data;
    }
  }

  private async decompressData(data: string): Promise<string> {
    try {
      // Reverse of the compression algorithm
      let decompressed = '';
      let i = 0;

      while (i < data.length) {
        const char = data[i];
        if (i + 1 < data.length && !isNaN(parseInt(data[i]))) {
          const count = parseInt(data[i]);
          const repeatChar = data[i + 1];
          decompressed += repeatChar.repeat(count);
          i += 2;
        } else {
          decompressed += char;
          i++;
        }
      }

      return decompressed;

    } catch (error) {
      console.error('Decompression failed:', error);
      return data;
    }
  }

  // Integrity Validation
  private async validateIntegrity(entry: CacheEntry): Promise<boolean> {
    if (!this.config.enableIntegrityCheck || !entry.checksum) {
      return true;
    }

    try {
      const serialized = JSON.stringify(entry.data);
      const currentChecksum = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        serialized
      );

      return currentChecksum === entry.checksum;

    } catch (error) {
      console.error('Integrity validation failed:', error);
      return false;
    }
  }

  // Background Cleanup
  private startBackgroundCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.performBackgroundMaintenance();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  private startMemoryPressureMonitoring(): void {
    this.memoryPressureInterval = setInterval(() => {
      const usagePercentage = (this.memoryPool.used / this.memoryPool.available) * 100;
      
      if (usagePercentage > this.config.memoryPressureThreshold) {
        console.warn(`Memory pressure detected: ${usagePercentage.toFixed(1)}%`);
        this.performGarbageCollection();
      }
    }, 30 * 1000); // Every 30 seconds
  }

  private async performBackgroundMaintenance(): Promise<void> {
    try {
      // Clean expired entries
      await this.performGarbageCollection();
      
      // Optimize memory fragmentation
      await this.defragmentMemory();
      
      // Update statistics
      await this.persistStatistics();
      
      console.log('Background maintenance completed');

    } catch (error) {
      console.error('Background maintenance failed:', error);
    }
  }

  private async defragmentMemory(): Promise<void> {
    // Reorganize memory cache to reduce fragmentation
    const entries = Array.from(this.memoryCache.entries());
    
    // Sort by size to better pack memory
    entries.sort((a, b) => b[1].size - a[1].size);
    
    this.memoryCache.clear();
    this.memoryPool.used = 0;
    
    for (const [key, entry] of entries) {
      if (await this.allocateMemory(entry.size)) {
        this.memoryCache.set(key, entry);
        this.statistics.memoryUsage += entry.size;
      }
    }
  }

  // Statistics
  private updateStatistics(operation: 'get' | 'set', duration: number, error: boolean = false): void {
    if (!this.config.enableStatistics) return;

    this.statistics.totalRequests++;
    
    // Update average access time using exponential moving average
    const alpha = 0.1;
    this.statistics.averageAccessTime = 
      this.statistics.averageAccessTime * (1 - alpha) + duration * alpha;
  }

  private updateCompressionStats(originalSize: number, compressedSize: number): void {
    const ratio = compressedSize / originalSize;
    const alpha = 0.1;
    this.statistics.compressionRatio = 
      this.statistics.compressionRatio * (1 - alpha) + ratio * alpha;
  }

  // Persistence Methods
  private async persistToDisk(key: string, entry: CacheEntry, serializedData: string): Promise<void> {
    try {
      const diskEntry = {
        ...entry,
        serializedData: entry.compressed ? serializedData : undefined
      };
      
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(diskEntry));
      this.diskCache.add(key);
      this.statistics.diskUsage += entry.size;

    } catch (error) {
      console.error(`Failed to persist ${key} to disk:`, error);
    }
  }

  private async loadFromDisk<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const stored = await AsyncStorage.getItem(`cache_${key}`);
      if (!stored) return null;

      const diskEntry = JSON.parse(stored);
      
      // Decompress if needed
      if (diskEntry.compressed && diskEntry.serializedData) {
        const decompressed = await this.decompressData(diskEntry.serializedData);
        diskEntry.data = JSON.parse(decompressed);
      }

      delete diskEntry.serializedData;
      return diskEntry as CacheEntry<T>;

    } catch (error) {
      console.error(`Failed to load ${key} from disk:`, error);
      return null;
    }
  }

  // Public API
  async delete(key: string): Promise<void> {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.deallocateMemory(entry.size);
      this.statistics.memoryUsage -= entry.size;
      this.memoryCache.delete(key);
    }

    if (this.diskCache.has(key)) {
      await AsyncStorage.removeItem(`cache_${key}`);
      this.diskCache.delete(key);
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.diskCache.clear();
    this.memoryPool.used = 0;
    this.statistics.memoryUsage = 0;
    this.statistics.diskUsage = 0;

    if (this.config.persistToDisk) {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    }
  }

  getStatistics(): CacheStatistics & { memoryPool: MemoryPool; hitRate: number } {
    const hitRate = this.statistics.totalRequests > 0 
      ? this.statistics.hitCount / this.statistics.totalRequests 
      : 0;

    return {
      ...this.statistics,
      memoryPool: { ...this.memoryPool },
      hitRate
    };
  }

  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Cleanup
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.memoryPressureInterval) {
      clearInterval(this.memoryPressureInterval);
    }
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }
  }

  // Configuration Persistence
  private async loadConfiguration(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('cache_config');
      if (stored) {
        const savedConfig = JSON.parse(stored);
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.error('Failed to load cache configuration:', error);
    }
  }

  private async loadStatistics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('cache_statistics');
      if (stored) {
        const savedStats = JSON.parse(stored);
        this.statistics = { ...this.statistics, ...savedStats };
      }
    } catch (error) {
      console.error('Failed to load cache statistics:', error);
    }
  }

  private async persistStatistics(): Promise<void> {
    if (!this.config.enableStatistics) return;

    try {
      await AsyncStorage.setItem('cache_statistics', JSON.stringify(this.statistics));
    } catch (error) {
      console.error('Failed to persist cache statistics:', error);
    }
  }

  private async loadPersistedCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      for (const key of cacheKeys) {
        const cacheKey = key.replace('cache_', '');
        this.diskCache.add(cacheKey);
        
        // Optionally preload high-priority items into memory
        const entry = await this.loadFromDisk(cacheKey);
        if (entry && entry.priority === 'critical' && Date.now() <= entry.expiresAt) {
          if (await this.allocateMemory(entry.size)) {
            this.memoryCache.set(cacheKey, entry);
            this.statistics.memoryUsage += entry.size;
          }
        }
      }

    } catch (error) {
      console.error('Failed to load persisted cache:', error);
    }
  }
}

export const EnhancedCacheManager = new EnhancedCacheManagerClass();
export default EnhancedCacheManager;