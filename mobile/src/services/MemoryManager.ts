import { InteractionManager, AppState } from 'react-native';

// Type declarations for global objects that might not be available
declare global {
  var gc: (() => void) | undefined;
  var WeakRef: {
    new <T extends object>(target: T): {
      deref(): T | undefined;
    };
  } | undefined;
}

interface MemoryPoolItem<T> {
  item: T;
  inUse: boolean;
  lastUsed: number;
}

class MemoryManagerService {
  private pools = new Map<string, MemoryPoolItem<any>[]>();
  private cleanupTimer?: NodeJS.Timeout;
  private memoryPressureListeners = new Set<() => void>();
  private gcTimer?: NodeJS.Timeout;
  private appStateSubscription: any = null;

  constructor() {
    this.initializeMemoryManagement();
  }

  private initializeMemoryManagement() {
    // Start periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 30000); // Every 30 seconds

    // Monitor app state for memory optimization
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    // Start garbage collection optimization
    this.startGCOptimization();
  }

  private startGCOptimization() {
    // Trigger GC at optimal times
    this.gcTimer = setInterval(() => {
      if (global.gc && AppState.currentState === 'active') {
        InteractionManager.runAfterInteractions(() => {
          global.gc!();
        });
      }
    }, 60000); // Every minute
  }

  // Object Pool Management
  createPool<T>(poolName: string, factory: () => T, initialSize: number = 5): void {
    if (this.pools.has(poolName)) {
      return;
    }

    const pool: MemoryPoolItem<T>[] = [];
    for (let i = 0; i < initialSize; i++) {
      pool.push({
        item: factory(),
        inUse: false,
        lastUsed: 0
      });
    }

    this.pools.set(poolName, pool);
  }

  borrowFromPool<T>(poolName: string, factory?: () => T): T | null {
    const pool = this.pools.get(poolName) as MemoryPoolItem<T>[];
    if (!pool) {
      if (factory) {
        this.createPool(poolName, factory);
        return this.borrowFromPool(poolName);
      }
      return null;
    }

    // Find available item
    for (const poolItem of pool) {
      if (!poolItem.inUse) {
        poolItem.inUse = true;
        poolItem.lastUsed = Date.now();
        return poolItem.item;
      }
    }

    // Create new item if pool is full and factory is provided
    if (factory && pool.length < 20) { // Limit pool size
      const newItem = {
        item: factory(),
        inUse: true,
        lastUsed: Date.now()
      };
      pool.push(newItem);
      return newItem.item;
    }

    return null;
  }

  returnToPool<T>(poolName: string, item: T): void {
    const pool = this.pools.get(poolName) as MemoryPoolItem<T>[];
    if (!pool) return;

    const poolItem = pool.find(p => p.item === item);
    if (poolItem) {
      poolItem.inUse = false;
      poolItem.lastUsed = Date.now();
    }
  }  // WeakRef management for automatic cleanup
  private weakRefs = new Set<any>();

  createManagedReference<T extends object>(obj: T): any {
    if (typeof WeakRef !== 'undefined') {
      const weakRef = new WeakRef(obj);
      this.weakRefs.add(weakRef);
      return weakRef;
    } else {
      // Fallback for environments without WeakRef support
      return { deref: () => obj };
    }
  }

  // Memory pressure handling
  onMemoryPressure(callback: () => void): () => void {
    this.memoryPressureListeners.add(callback);
    return () => this.memoryPressureListeners.delete(callback);
  }

  private triggerMemoryPressure() {
    this.memoryPressureListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Memory pressure callback error:', error);
      }
    });
  }

  // Cleanup operations
  private performCleanup() {
    // Clean up pools
    this.cleanupPools();
    
    // Clean up weak references
    this.cleanupWeakRefs();
    
    // Trigger memory pressure if needed
    this.checkMemoryPressure();
  }

  private cleanupPools() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [poolName, pool] of this.pools.entries()) {
      // Remove unused items older than maxAge
      const itemsToRemove = pool.filter(
        item => !item.inUse && (now - item.lastUsed) > maxAge
      );

      if (itemsToRemove.length > 0) {
        const newPool = pool.filter(item => !itemsToRemove.includes(item));
        this.pools.set(poolName, newPool);
        
        console.log(`Cleaned up ${itemsToRemove.length} items from pool: ${poolName}`);
      }
    }
  }

  private cleanupWeakRefs() {
    if (typeof WeakRef === 'undefined') {
      return; // Skip cleanup if WeakRef is not available
    }
    
    const toRemove: any[] = [];
    
    for (const weakRef of this.weakRefs) {
      if (weakRef.deref && weakRef.deref() === undefined) {
        toRemove.push(weakRef);
      }
    }

    toRemove.forEach(weakRef => this.weakRefs.delete(weakRef));
  }

  private checkMemoryPressure() {
    // Check if memory usage is high
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
      
      if (usageRatio > 0.85) { // 85% memory usage threshold
        console.warn('High memory usage detected, triggering cleanup');
        this.triggerMemoryPressure();
      }
    }
  }

  private handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'background') {
      // Aggressive cleanup when app goes to background
      this.performCleanup();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  };

  // Component cleanup utilities
  createComponentCleanup() {
    const cleanup = new Set<() => void>();
    
    return {
      add: (cleanupFn: () => void) => cleanup.add(cleanupFn),
      remove: (cleanupFn: () => void) => cleanup.delete(cleanupFn),
      cleanup: () => {
        cleanup.forEach(fn => {
          try {
            fn();
          } catch (error) {
            console.error('Component cleanup error:', error);
          }
        });
        cleanup.clear();
      }
    };
  }  // Image memory pool specifically for TailTracker
  initializeImagePool() {
    this.createPool('imageCache', () => ({
      uri: '',
      data: null,
      width: 0,
      height: 0,
      timestamp: 0
    }), 50);
  }

  // List rendering optimization
  createVirtualizedListConfig(itemCount: number) {
    // Calculate optimal settings based on available memory
    const memoryInfo = this.getMemoryInfo();
    const availableMemory = memoryInfo ? memoryInfo.jsHeapSizeLimit - memoryInfo.usedJSHeapSize : 100 * 1024 * 1024;
    
    // Estimate items that can fit in memory
    const estimatedItemSize = 1024; // 1KB per item estimate
    const maxItems = Math.floor(availableMemory / (estimatedItemSize * 10)); // 10x safety margin
    
    return {
      windowSize: Math.min(10, Math.max(5, maxItems / itemCount)),
      initialNumToRender: Math.min(20, itemCount),
      maxToRenderPerBatch: Math.min(10, maxItems / 20),
      removeClippedSubviews: true,
      updateCellsBatchingPeriod: 100,
      getItemLayout: (data: any, index: number) => ({
        length: estimatedItemSize,
        offset: estimatedItemSize * index,
        index,
      }),
    };
  }

  // Memory monitoring
  getMemoryInfo() {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  getMemoryStats() {
    const memInfo = this.getMemoryInfo();
    if (!memInfo) return null;

    return {
      used: (memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
      total: (memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
      limit: (memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB',
      usage: ((memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100).toFixed(1) + '%',
      pools: this.pools.size,
      weakRefs: this.weakRefs.size
    };
  }

  // Cleanup and disposal
  dispose() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    this.pools.clear();
    this.weakRefs.clear();
    this.memoryPressureListeners.clear();
  }
}

// Singleton instance
export const MemoryManager = new MemoryManagerService();

// React hook for memory management
export function useMemoryManager() {
  return {
    createComponentCleanup: MemoryManager.createComponentCleanup.bind(MemoryManager),
    borrowFromPool: MemoryManager.borrowFromPool.bind(MemoryManager),
    returnToPool: MemoryManager.returnToPool.bind(MemoryManager),
    onMemoryPressure: MemoryManager.onMemoryPressure.bind(MemoryManager),
    getMemoryStats: MemoryManager.getMemoryStats.bind(MemoryManager),
    createVirtualizedListConfig: MemoryManager.createVirtualizedListConfig.bind(MemoryManager)
  };
}

export default MemoryManager;