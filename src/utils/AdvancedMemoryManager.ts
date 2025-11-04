import { useEffect, useState } from 'react';
import { Platform, DeviceEventEmitter, AppState } from 'react-native';
import { performanceOptimizer } from './PerformanceOptimizer';

// React hook for memory management

/**
 * Advanced Memory Management System
 * Target: <150MB peak usage, aggressive garbage collection, memory leak prevention
 */

interface MemoryPool<T> {
  pool: T[];
  create: () => T;
  reset: (item: T) => T;
  maxSize: number;
}

interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  peak: number;
  timestamp: number;
}

class AdvancedMemoryManager {
  private memoryPools: Map<string, MemoryPool<any>> = new Map();
  private memoryMetrics: MemoryMetrics[] = [];
  private isMonitoring: boolean = false;
  private cleanupInterval?: NodeJS.Timeout;
  private memoryPressureListeners: Set<() => void> = new Set();
  private imageCache: Map<
    string,
    { data: any; lastUsed: number; size: number }
  > = new Map();
  private readonly MAX_IMAGE_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_METRICS_HISTORY = 100;

  /**
   * Initialize memory management system
   */
  initialize(): void {
    this.setupMemoryMonitoring();
    this.setupMemoryPools();
    this.setupMemoryPressureHandling();
    this.setupPeriodicCleanup();
    this.trackAppStateChanges();
  }

  /**
   * Setup memory pressure handling
   */
  private setupMemoryPressureHandling(): void {
    // Initialize memory pressure listeners set if not already done
    if (Platform.OS === 'ios') {
      DeviceEventEmitter.addListener(
        'MemoryWarning',
        this.handleMemoryWarning.bind(this)
      );
    } else if (Platform.OS === 'android') {
      DeviceEventEmitter.addListener(
        'MemoryPressure',
        this.handleMemoryWarning.bind(this)
      );
    }
  }

  /**
   * Setup comprehensive memory monitoring
   */
  private setupMemoryMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor memory usage every 5 seconds
    const monitorInterval = setInterval(() => {
      this.collectMemoryMetrics();
      this.analyzeMemoryTrends();
      this.enforceMemoryLimits();
    }, 5000);

    // Listen for memory warnings
    if (Platform.OS === 'ios') {
      DeviceEventEmitter.addListener(
        'MemoryWarning',
        this.handleMemoryWarning.bind(this)
      );
    } else {
      // Android memory pressure handling
      DeviceEventEmitter.addListener(
        'MemoryPressure',
        this.handleMemoryWarning.bind(this)
      );
    }
  }

  /**
   * Create optimized memory pools for frequent allocations
   */
  private setupMemoryPools(): void {
    // Image object pool
    this.createMemoryPool('images', {
      create: () => ({ uri: '', width: 0, height: 0, cached: false }),
      reset: item => ({ ...item, uri: '', width: 0, height: 0, cached: false }),
      maxSize: 20,
    });

    // Event object pool
    this.createMemoryPool('events', {
      create: () => ({ id: '', type: '', data: null, timestamp: 0 }),
      reset: item => ({ ...item, id: '', type: '', data: null, timestamp: 0 }),
      maxSize: 50,
    });

    // Animation frame pool
    this.createMemoryPool('animationFrames', {
      create: () => ({ value: 0, progress: 0, callback: null }),
      reset: item => ({ ...item, value: 0, progress: 0, callback: null }),
      maxSize: 30,
    });

    // Touch event pool
    this.createMemoryPool('touchEvents', {
      create: () => ({ x: 0, y: 0, timestamp: 0, type: 'start' }),
      reset: item => ({ ...item, x: 0, y: 0, timestamp: 0, type: 'start' }),
      maxSize: 10,
    });
  }

  /**
   * Create a memory pool for specific object types
   */
  createMemoryPool<T>(name: string, config: Omit<MemoryPool<T>, 'pool'>): void {
    const pool: MemoryPool<T> = {
      pool: [],
      ...config,
    };

    // Pre-populate pool
    for (let i = 0; i < Math.min(5, config.maxSize); i++) {
      pool.pool.push(config.create());
    }

    this.memoryPools.set(name, pool);
  }

  /**
   * Get object from memory pool
   */
  getFromPool<T>(poolName: string): T | null {
    const pool = this.memoryPools.get(poolName) as MemoryPool<T>;
    if (!pool) return null;

    if (pool.pool.length > 0) {
      return pool.pool.pop()!;
    }

    // Create new if pool is empty and under limit
    if (pool.pool.length < pool.maxSize) {
      return pool.create();
    }

    return null;
  }

  /**
   * Return object to memory pool
   */
  returnToPool<T>(poolName: string, item: T): void {
    const pool = this.memoryPools.get(poolName) as MemoryPool<T>;
    if (!pool) return;

    if (pool.pool.length < pool.maxSize) {
      const resetItem = pool.reset(item);
      pool.pool.push(resetItem);
    }
  }

  /**
   * Collect current memory metrics
   */
  private collectMemoryMetrics(): void {
    try {
      let metrics: MemoryMetrics;

      if (Platform.OS === 'web') {
        // Web performance API
        const memInfo = (performance as any).memory;
        metrics = {
          heapUsed: memInfo?.usedJSHeapSize || 0,
          heapTotal: memInfo?.totalJSHeapSize || 0,
          external: 0,
          arrayBuffers: 0,
          peak: Math.max(
            ...this.memoryMetrics.map(m => m.heapUsed),
            memInfo?.usedJSHeapSize || 0
          ),
          timestamp: Date.now(),
        };
      } else {
        // Native memory tracking (would use native modules in production)
        const estimatedUsage = this.estimateMemoryUsage();
        metrics = {
          heapUsed: estimatedUsage.heap,
          heapTotal: estimatedUsage.total,
          external: estimatedUsage.external,
          arrayBuffers: estimatedUsage.buffers,
          peak: Math.max(
            ...this.memoryMetrics.map(m => m.heapUsed),
            estimatedUsage.heap
          ),
          timestamp: Date.now(),
        };
      }

      this.memoryMetrics.push(metrics);

      // Keep only recent metrics
      if (this.memoryMetrics.length > this.MAX_METRICS_HISTORY) {
        this.memoryMetrics.shift();
      }

      // Track with performance optimizer
      performanceOptimizer.trackMetric('memory_heap_used', metrics.heapUsed);
      performanceOptimizer.trackMetric('memory_heap_total', metrics.heapTotal);
    } catch (error) {
      console.warn('Failed to collect memory metrics:', error);
    }
  }

  /**
   * Estimate memory usage on native platforms
   */
  private estimateMemoryUsage(): {
    heap: number;
    total: number;
    external: number;
    buffers: number;
  } {
    // This would use native modules in production
    // For now, provide reasonable estimates based on app usage

    const imageCacheSize = Array.from(this.imageCache.values()).reduce(
      (sum, item) => sum + item.size,
      0
    );
    const poolSize = Array.from(this.memoryPools.values()).reduce(
      (sum, pool) => sum + pool.pool.length * 1000,
      0
    );

    return {
      heap: imageCacheSize + poolSize + 30 * 1024 * 1024, // Base app usage
      total: 150 * 1024 * 1024, // Target total memory
      external: imageCacheSize,
      buffers: poolSize,
    };
  }

  /**
   * Analyze memory trends and predict issues
   */
  private analyzeMemoryTrends(): void {
    if (this.memoryMetrics.length < 10) return;

    const recent = this.memoryMetrics.slice(-10);
    const avgGrowth =
      recent.reduce((sum, metric, index) => {
        if (index === 0) return 0;
        return sum + (metric.heapUsed - recent[index - 1].heapUsed);
      }, 0) /
      (recent.length - 1);

    // Detect memory leaks (consistent growth over 50KB per measurement)
    if (avgGrowth > 50 * 1024) {
      console.warn('Potential memory leak detected:', avgGrowth);
      this.triggerEmergencyCleanup();
    }

    // Predict when we'll hit memory limits
    const currentUsage = recent[recent.length - 1].heapUsed;
    const targetLimit = 150 * 1024 * 1024; // 150MB

    if (avgGrowth > 0) {
      const timeToLimit = ((targetLimit - currentUsage) / avgGrowth) * 5; // 5 second intervals

      if (timeToLimit < 300) {
        // Less than 5 minutes
        console.warn(
          `Approaching memory limit in ${timeToLimit.toFixed(0)} seconds`
        );
        this.triggerPreventiveCleanup();
      }
    }
  }

  /**
   * Enforce strict memory limits
   */
  private enforceMemoryLimits(): void {
    if (this.memoryMetrics.length === 0) return;

    const currentMetrics = this.memoryMetrics[this.memoryMetrics.length - 1];
    const targetLimit = 150 * 1024 * 1024; // 150MB
    const warningLimit = 120 * 1024 * 1024; // 120MB

    if (currentMetrics.heapUsed > targetLimit) {
      // Emergency cleanup
      this.triggerEmergencyCleanup();
    } else if (currentMetrics.heapUsed > warningLimit) {
      // Preventive cleanup
      this.triggerPreventiveCleanup();
    }
  }

  /**
   * Handle memory pressure warnings from system
   */
  private handleMemoryWarning(): void {
    console.log('System memory warning received - triggering cleanup');
    this.triggerEmergencyCleanup();

    // Notify listeners
    this.memoryPressureListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Memory pressure listener error:', error);
      }
    });
  }

  /**
   * Emergency memory cleanup - aggressive cleanup
   */
  private triggerEmergencyCleanup(): void {
    console.log('Triggering emergency memory cleanup');

    // Clear image cache completely
    this.imageCache.clear();

    // Reduce all memory pools to minimum
    this.memoryPools.forEach((pool, name) => {
      const keepItems = Math.min(2, pool.pool.length);
      pool.pool.splice(0, pool.pool.length - keepItems);
    });

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Clear old metrics
    this.memoryMetrics.splice(0, Math.max(0, this.memoryMetrics.length - 20));

    // Notify performance optimizer to reduce quality
    performanceOptimizer.adaptSettings();
  }

  /**
   * Preventive cleanup - moderate cleanup
   */
  private triggerPreventiveCleanup(): void {
    console.log('Triggering preventive memory cleanup');

    // Clean old images from cache
    this.cleanImageCache(0.7); // Remove 30% of cache

    // Reduce memory pools moderately
    this.memoryPools.forEach(pool => {
      const removeCount = Math.floor(pool.pool.length * 0.3);
      pool.pool.splice(0, removeCount);
    });

    // Clear old metrics
    if (this.memoryMetrics.length > 50) {
      this.memoryMetrics.splice(0, 20);
    }
  }

  /**
   * Setup periodic cleanup routine
   */
  private setupPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performRoutineCleanup();
    }, 60000); // Every minute
  }

  /**
   * Routine cleanup - gentle maintenance
   */
  private performRoutineCleanup(): void {
    // Clean expired cache entries
    this.cleanImageCache(0.9); // Remove 10% of cache

    // Clean old metrics
    if (this.memoryMetrics.length > this.MAX_METRICS_HISTORY) {
      this.memoryMetrics.splice(0, 10);
    }

    // Optimize memory pools
    this.memoryPools.forEach(pool => {
      if (pool.pool.length > pool.maxSize) {
        pool.pool.splice(0, pool.pool.length - pool.maxSize);
      }
    });
  }

  /**
   * Advanced image cache management
   */
  cacheImage(uri: string, data: any, size: number): void {
    // Remove old entries if cache is full
    const currentSize = Array.from(this.imageCache.values()).reduce(
      (sum, item) => sum + item.size,
      0
    );

    if (currentSize + size > this.MAX_IMAGE_CACHE_SIZE) {
      this.cleanImageCache(0.8); // Remove 20% to make space
    }

    this.imageCache.set(uri, {
      data,
      lastUsed: Date.now(),
      size,
    });
  }

  getCachedImage(uri: string): any | null {
    const cached = this.imageCache.get(uri);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.data;
    }
    return null;
  }

  /**
   * Clean image cache based on usage and age
   */
  private cleanImageCache(keepRatio: number): void {
    const entries = Array.from(this.imageCache.entries());

    // Sort by last used time (oldest first)
    entries.sort(([, a], [, b]) => a.lastUsed - b.lastUsed);

    const removeCount = Math.floor(entries.length * (1 - keepRatio));

    for (let i = 0; i < removeCount; i++) {
      this.imageCache.delete(entries[i][0]);
    }
  }

  /**
   * Track app state changes for memory optimization
   */
  private trackAppStateChanges(): void {
    AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background') {
        // App going to background - aggressive cleanup
        this.triggerPreventiveCleanup();
      } else if (nextAppState === 'active') {
        // App becoming active - minimal impact
        this.performRoutineCleanup();
      }
    });
  }

  /**
   * Register memory pressure listener
   */
  onMemoryPressure(callback: () => void): () => void {
    this.memoryPressureListeners.add(callback);
    return () => this.memoryPressureListeners.delete(callback);
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    current: MemoryMetrics | null;
    peak: number;
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    cacheSize: number;
    poolSizes: Record<string, number>;
  } {
    const current = this.memoryMetrics[this.memoryMetrics.length - 1] || null;
    const peak = Math.max(...this.memoryMetrics.map(m => m.heapUsed));
    const average =
      this.memoryMetrics.reduce((sum, m) => sum + m.heapUsed, 0) /
      Math.max(1, this.memoryMetrics.length);

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (this.memoryMetrics.length >= 5) {
      const recent = this.memoryMetrics.slice(-5);
      const first = recent[0].heapUsed;
      const last = recent[recent.length - 1].heapUsed;
      const diff = last - first;

      if (Math.abs(diff) > 5 * 1024 * 1024) {
        // 5MB threshold
        trend = diff > 0 ? 'increasing' : 'decreasing';
      }
    }

    const cacheSize = Array.from(this.imageCache.values()).reduce(
      (sum, item) => sum + item.size,
      0
    );
    const poolSizes: Record<string, number> = {};
    this.memoryPools.forEach((pool, name) => {
      poolSizes[name] = pool.pool.length;
    });

    return {
      current,
      peak,
      average,
      trend,
      cacheSize,
      poolSizes,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.memoryPools.clear();
    this.imageCache.clear();
    this.memoryMetrics.length = 0;
    this.memoryPressureListeners.clear();
    this.isMonitoring = false;
  }
}

// Export singleton instance
export const advancedMemoryManager = new AdvancedMemoryManager();

export const useMemoryOptimization = () => {
  const [memoryStats, setMemoryStats] = useState(
    advancedMemoryManager.getMemoryStats()
  );

  useEffect(() => {
    const updateStats = () => {
      setMemoryStats(advancedMemoryManager.getMemoryStats());
    };

    const interval = setInterval(updateStats, 10000); // Update every 10 seconds

    // Listen for memory pressure
    const removeListener = advancedMemoryManager.onMemoryPressure(() => {
      updateStats();
    });

    return () => {
      clearInterval(interval);
      removeListener();
    };
  }, []);

  return {
    memoryStats,
    getFromPool: advancedMemoryManager.getFromPool.bind(advancedMemoryManager),
    returnToPool: advancedMemoryManager.returnToPool.bind(
      advancedMemoryManager
    ),
    cacheImage: advancedMemoryManager.cacheImage.bind(advancedMemoryManager),
    getCachedImage: advancedMemoryManager.getCachedImage.bind(
      advancedMemoryManager
    ),
  };
};

export default advancedMemoryManager;
