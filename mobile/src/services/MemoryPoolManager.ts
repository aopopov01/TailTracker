import { AppState, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PerformanceMonitor } from './PerformanceMonitor';

interface MemoryPool {
  id: string;
  name: string;
  size: number;
  used: number;
  reserved: number;
  fragmentationLevel: number;
  allocatedBlocks: MemoryBlock[];
  freeBlocks: MemoryBlock[];
  allocationStrategy: 'first_fit' | 'best_fit' | 'worst_fit' | 'buddy_system';
  gcThreshold: number;
  lastGC: number;
}

interface MemoryBlock {
  id: string;
  address: number;
  size: number;
  inUse: boolean;
  allocatedAt: number;
  lastAccessed: number;
  type: 'image' | 'cache' | 'component' | 'general';
  priority: 'critical' | 'high' | 'medium' | 'low';
  refs: number;
}

interface GarbageCollectionConfig {
  enableAutoGC: boolean;
  gcInterval: number;
  memoryPressureThreshold: number;
  aggressiveGCThreshold: number;
  generationalGC: boolean;
  incrementalGC: boolean;
  compactionEnabled: boolean;
  youngGenerationSize: number;
  oldGenerationSize: number;
  maxGCPause: number;
}

interface MemoryMetrics {
  totalMemory: number;
  usedMemory: number;
  freeMemory: number;
  fragmentedMemory: number;
  gcCount: number;
  gcTime: number;
  averageGCTime: number;
  memoryLeaks: number;
  allocationRate: number;
  deallocationRate: number;
  poolUtilization: Map<string, number>;
}

interface AllocationRequest {
  size: number;
  type: 'image' | 'cache' | 'component' | 'general';
  priority: 'critical' | 'high' | 'medium' | 'low';
  alignment?: number;
  maxLifetime?: number;
}

interface GCEvent {
  id: string;
  timestamp: number;
  type: 'minor' | 'major' | 'full';
  trigger: 'manual' | 'threshold' | 'pressure' | 'timer';
  duration: number;
  memoryReclaimed: number;
  objectsCollected: number;
  compactionPerformed: boolean;
}

class MemoryPoolManagerClass {
  private pools: Map<string, MemoryPool> = new Map();
  private config: GarbageCollectionConfig;
  private metrics: MemoryMetrics;
  private gcEvents: GCEvent[] = [];
  private isGCRunning = false;
  private gcTimer?: NodeJS.Timeout;
  private memoryPressureTimer?: NodeJS.Timeout;
  private blockIdCounter = 0;
  private totalAllocatedMemory = 0;
  private allocationCallbacks: Map<string, (block: MemoryBlock) => void> = new Map();
  private deallocationCallbacks: Map<string, (blockId: string) => void> = new Map();

  constructor() {
    this.config = {
      enableAutoGC: true,
      gcInterval: 30000, // 30 seconds
      memoryPressureThreshold: 0.85, // 85% memory usage
      aggressiveGCThreshold: 0.95, // 95% for aggressive GC
      generationalGC: true,
      incrementalGC: true,
      compactionEnabled: true,
      youngGenerationSize: 32 * 1024 * 1024, // 32MB
      oldGenerationSize: 128 * 1024 * 1024, // 128MB
      maxGCPause: 50 // 50ms max pause time
    };

    this.metrics = {
      totalMemory: 0,
      usedMemory: 0,
      freeMemory: 0,
      fragmentedMemory: 0,
      gcCount: 0,
      gcTime: 0,
      averageGCTime: 0,
      memoryLeaks: 0,
      allocationRate: 0,
      deallocationRate: 0,
      poolUtilization: new Map()
    };

    this.initialize();
  }

  private async initialize() {
    try {
      await this.loadConfiguration();
      this.createDefaultPools();
      this.setupMemoryPressureMonitoring();
      this.setupAutomaticGC();
      this.setupAppStateListener();
      
      console.log('Memory Pool Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Memory Pool Manager:', error);
    }
  }

  // Memory Pool Management
  private createDefaultPools() {
    // Main application pool
    this.createPool('main', 64 * 1024 * 1024, 'best_fit'); // 64MB

    // Image cache pool
    this.createPool('images', 128 * 1024 * 1024, 'buddy_system'); // 128MB

    // Component cache pool
    this.createPool('components', 32 * 1024 * 1024, 'first_fit'); // 32MB

    // General purpose pool
    this.createPool('general', 16 * 1024 * 1024, 'best_fit'); // 16MB

    // High priority pool
    this.createPool('priority', 16 * 1024 * 1024, 'worst_fit'); // 16MB for critical allocations
  }

  createPool(
    name: string, 
    size: number, 
    strategy: MemoryPool['allocationStrategy'] = 'best_fit'
  ): string {
    const poolId = `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pool: MemoryPool = {
      id: poolId,
      name,
      size,
      used: 0,
      reserved: size * 0.1, // Reserve 10% for critical operations
      fragmentationLevel: 0,
      allocatedBlocks: [],
      freeBlocks: [{
        id: `free_${poolId}_0`,
        address: 0,
        size,
        inUse: false,
        allocatedAt: 0,
        lastAccessed: 0,
        type: 'general',
        priority: 'low',
        refs: 0
      }],
      allocationStrategy: strategy,
      gcThreshold: size * 0.8, // Trigger GC at 80% usage
      lastGC: Date.now()
    };

    this.pools.set(poolId, pool);
    this.metrics.totalMemory += size;
    this.metrics.freeMemory += size;

    console.log(`Created memory pool '${name}' (${this.formatBytes(size)})`);
    return poolId;
  }

  // Memory Allocation
  async allocate(request: AllocationRequest, poolName?: string): Promise<MemoryBlock | null> {
    const startTime = performance.now();
    
    try {
      // Find suitable pool
      const pool = this.findSuitablePool(request, poolName);
      if (!pool) {
        console.warn(`No suitable pool found for allocation of ${this.formatBytes(request.size)}`);
        return null;
      }

      // Check if GC is needed before allocation
      if (this.shouldTriggerGC(pool)) {
        await this.performGarbageCollection(pool.id, 'minor');
      }

      // Attempt allocation
      const block = this.allocateFromPool(pool, request);
      if (!block) {
        // Try compaction and retry
        if (this.config.compactionEnabled) {
          await this.compactPool(pool);
          const retryBlock = this.allocateFromPool(pool, request);
          if (retryBlock) {
            return retryBlock;
          }
        }

        // Try GC and retry
        await this.performGarbageCollection(pool.id, 'major');
        return this.allocateFromPool(pool, request);
      }

      // Update metrics
      this.updateAllocationMetrics(block.size, performance.now() - startTime);

      // Notify allocation callbacks
      this.notifyAllocationCallbacks(block);

      return block;

    } catch (error) {
      console.error('Memory allocation failed:', error);
      return null;
    }
  }

  private findSuitablePool(request: AllocationRequest, preferredPoolName?: string): MemoryPool | null {
    // Try preferred pool first
    if (preferredPoolName) {
      for (const pool of this.pools.values()) {
        if (pool.name === preferredPoolName && this.canAllocateFromPool(pool, request.size)) {
          return pool;
        }
      }
    }

    // Find pool based on type and priority
    const candidatePools = Array.from(this.pools.values()).filter(pool => 
      this.canAllocateFromPool(pool, request.size)
    );

    if (candidatePools.length === 0) {
      return null;
    }

    // Sort by suitability
    candidatePools.sort((a, b) => {
      // Prefer pools with less fragmentation
      const fragmentationDiff = a.fragmentationLevel - b.fragmentationLevel;
      if (Math.abs(fragmentationDiff) > 0.1) {
        return fragmentationDiff;
      }

      // Prefer pools with more available space
      const availableA = (a.size - a.used - a.reserved) / a.size;
      const availableB = (b.size - b.used - b.reserved) / b.size;
      return availableB - availableA;
    });

    return candidatePools[0];
  }

  private canAllocateFromPool(pool: MemoryPool, size: number): boolean {
    const availableSpace = pool.size - pool.used - pool.reserved;
    return availableSpace >= size && this.hasContiguousSpace(pool, size);
  }

  private hasContiguousSpace(pool: MemoryPool, size: number): boolean {
    return pool.freeBlocks.some(block => block.size >= size);
  }

  private allocateFromPool(pool: MemoryPool, request: AllocationRequest): MemoryBlock | null {
    const suitableBlock = this.findSuitableBlock(pool, request);
    if (!suitableBlock) {
      return null;
    }

    // Split block if necessary
    const allocatedBlock = this.splitBlock(suitableBlock, request);
    if (!allocatedBlock) {
      return null;
    }

    // Update pool state
    pool.used += allocatedBlock.size;
    pool.allocatedBlocks.push(allocatedBlock);
    this.removeFreeBlock(pool, suitableBlock);

    // Update metrics
    this.metrics.usedMemory += allocatedBlock.size;
    this.metrics.freeMemory -= allocatedBlock.size;
    this.totalAllocatedMemory += allocatedBlock.size;

    return allocatedBlock;
  }

  private findSuitableBlock(pool: MemoryPool, request: AllocationRequest): MemoryBlock | null {
    const candidates = pool.freeBlocks.filter(block => block.size >= request.size);
    
    if (candidates.length === 0) {
      return null;
    }

    switch (pool.allocationStrategy) {
      case 'first_fit':
        return candidates[0];
      
      case 'best_fit':
        return candidates.reduce((best, current) => 
          current.size < best.size ? current : best
        );
      
      case 'worst_fit':
        return candidates.reduce((worst, current) => 
          current.size > worst.size ? current : worst
        );
      
      case 'buddy_system':
        return this.findBuddyBlock(candidates, request.size);
      
      default:
        return candidates[0];
    }
  }

  private findBuddyBlock(candidates: MemoryBlock[], size: number): MemoryBlock | null {
    // Find the smallest power-of-2 block that can fit the request
    let buddySize = 1;
    while (buddySize < size) {
      buddySize *= 2;
    }

    return candidates.find(block => block.size >= buddySize) || candidates[0];
  }

  private splitBlock(block: MemoryBlock, request: AllocationRequest): MemoryBlock | null {
    const requiredSize = request.size;
    
    if (block.size < requiredSize) {
      return null;
    }

    const allocatedBlock: MemoryBlock = {
      id: `block_${++this.blockIdCounter}`,
      address: block.address,
      size: requiredSize,
      inUse: true,
      allocatedAt: Date.now(),
      lastAccessed: Date.now(),
      type: request.type,
      priority: request.priority,
      refs: 1
    };

    // Create remainder block if needed
    if (block.size > requiredSize) {
      const remainderBlock: MemoryBlock = {
        id: `free_${this.blockIdCounter}`,
        address: block.address + requiredSize,
        size: block.size - requiredSize,
        inUse: false,
        allocatedAt: 0,
        lastAccessed: 0,
        type: 'general',
        priority: 'low',
        refs: 0
      };

      // Add remainder back to free blocks
      const pool = this.findPoolContainingBlock(block.address);
      if (pool) {
        pool.freeBlocks.push(remainderBlock);
        this.sortFreeBlocks(pool);
      }
    }

    return allocatedBlock;
  }

  private removeFreeBlock(pool: MemoryPool, block: MemoryBlock) {
    const index = pool.freeBlocks.findIndex(b => b.id === block.id);
    if (index >= 0) {
      pool.freeBlocks.splice(index, 1);
    }
  }

  private sortFreeBlocks(pool: MemoryPool) {
    pool.freeBlocks.sort((a, b) => a.address - b.address);
  }

  // Memory Deallocation
  async deallocate(blockId: string): Promise<boolean> {
    try {
      const block = this.findAllocatedBlock(blockId);
      if (!block) {
        console.warn(`Block ${blockId} not found for deallocation`);
        return false;
      }

      const pool = this.findPoolContainingBlock(block.address);
      if (!pool) {
        console.error(`Pool not found for block ${blockId}`);
        return false;
      }

      // Remove from allocated blocks
      const index = pool.allocatedBlocks.findIndex(b => b.id === blockId);
      if (index >= 0) {
        pool.allocatedBlocks.splice(index, 1);
      }

      // Update pool state
      pool.used -= block.size;

      // Create free block
      const freeBlock: MemoryBlock = {
        ...block,
        inUse: false,
        refs: 0
      };

      pool.freeBlocks.push(freeBlock);

      // Try to merge with adjacent free blocks
      await this.mergeAdjacentBlocks(pool, freeBlock);

      // Update metrics
      this.metrics.usedMemory -= block.size;
      this.metrics.freeMemory += block.size;
      this.totalAllocatedMemory -= block.size;
      this.updateDeallocationMetrics();

      // Notify deallocation callbacks
      this.notifyDeallocationCallbacks(blockId);

      return true;

    } catch (error) {
      console.error('Memory deallocation failed:', error);
      return false;
    }
  }

  private async mergeAdjacentBlocks(pool: MemoryPool, block: MemoryBlock) {
    // Sort free blocks by address
    this.sortFreeBlocks(pool);

    let merged = true;
    while (merged) {
      merged = false;
      
      for (let i = 0; i < pool.freeBlocks.length - 1; i++) {
        const current = pool.freeBlocks[i];
        const next = pool.freeBlocks[i + 1];

        // Check if blocks are adjacent
        if (current.address + current.size === next.address) {
          // Merge blocks
          current.size += next.size;
          pool.freeBlocks.splice(i + 1, 1);
          merged = true;
          break;
        }
      }
    }
  }

  // Garbage Collection
  async performGarbageCollection(
    poolId?: string, 
    type: 'minor' | 'major' | 'full' = 'minor'
  ): Promise<GCEvent> {
    if (this.isGCRunning) {
      console.log('Garbage collection already in progress');
      return this.gcEvents[this.gcEvents.length - 1];
    }

    this.isGCRunning = true;
    const startTime = performance.now();
    const gcId = `gc_${Date.now()}`;

    try {
      const event: GCEvent = {
        id: gcId,
        timestamp: Date.now(),
        type,
        trigger: 'manual',
        duration: 0,
        memoryReclaimed: 0,
        objectsCollected: 0,
        compactionPerformed: false
      };

      console.log(`Starting ${type} garbage collection${poolId ? ` for pool ${poolId}` : ''}`);

      let totalReclaimed = 0;
      let totalObjectsCollected = 0;

      // Determine which pools to collect
      const poolsToCollect = poolId 
        ? [this.pools.get(poolId)].filter(p => p !== undefined) as MemoryPool[]
        : Array.from(this.pools.values());

      // Perform collection on each pool
      for (const pool of poolsToCollected) {
        const poolResult = await this.collectPool(pool, type);
        totalReclaimed += poolResult.memoryReclaimed;
        totalObjectsCollected += poolResult.objectsCollected;
        
        if (poolResult.compactionPerformed) {
          event.compactionPerformed = true;
        }
      }

      // Native garbage collection if available
      if (global.gc && type === 'full') {
        global.gc();
      }

      // Update event
      event.duration = performance.now() - startTime;
      event.memoryReclaimed = totalReclaimed;
      event.objectsCollected = totalObjectsCollected;

      // Update metrics
      this.metrics.gcCount++;
      this.metrics.gcTime += event.duration;
      this.metrics.averageGCTime = this.metrics.gcTime / this.metrics.gcCount;

      // Store event
      this.gcEvents.push(event);
      
      // Limit event history
      if (this.gcEvents.length > 100) {
        this.gcEvents.splice(0, this.gcEvents.length - 100);
      }

      // Update pool last GC time
      poolsToCollect.forEach(pool => {
        pool.lastGC = Date.now();
      });

      console.log(`GC completed: reclaimed ${this.formatBytes(totalReclaimed)} in ${event.duration.toFixed(2)}ms`);

      // Record performance metric
      PerformanceMonitor.recordMetric({
        name: 'garbage_collection',
        value: event.duration,
        timestamp: Date.now(),
        category: 'memory',
        metadata: {
          type,
          memoryReclaimed: totalReclaimed,
          objectsCollected: totalObjectsCollected,
          poolsCollected: poolsToCollect.length
        }
      });

      return event;

    } finally {
      this.isGCRunning = false;
    }
  }

  private async collectPool(pool: MemoryPool, type: 'minor' | 'major' | 'full'): Promise<{
    memoryReclaimed: number;
    objectsCollected: number;
    compactionPerformed: boolean;
  }> {
    let memoryReclaimed = 0;
    let objectsCollected = 0;
    let compactionPerformed = false;

    // Find unreferenced or expired blocks
    const blocksToCollect = this.findCollectableBlocks(pool, type);
    
    // Collect blocks
    for (const block of blocksToCollect) {
      await this.deallocate(block.id);
      memoryReclaimed += block.size;
      objectsCollected++;
    }

    // Perform compaction if fragmentation is high
    if (pool.fragmentationLevel > 0.3 && this.config.compactionEnabled) {
      await this.compactPool(pool);
      compactionPerformed = true;
    }

    // Update pool fragmentation level
    this.updatePoolFragmentation(pool);

    return { memoryReclaimed, objectsCollected, compactionPerformed };
  }

  private findCollectableBlocks(pool: MemoryPool, type: 'minor' | 'major' | 'full'): MemoryBlock[] {
    const now = Date.now();
    const collectableBlocks: MemoryBlock[] = [];

    for (const block of pool.allocatedBlocks) {
      let shouldCollect = false;

      // Check reference count
      if (block.refs <= 0) {
        shouldCollect = true;
      }

      // Age-based collection for different GC types
      const age = now - block.allocatedAt;
      if (type === 'minor' && age < this.config.youngGenerationSize) {
        // Collect young objects that haven't been accessed recently
        if (now - block.lastAccessed > 30000) { // 30 seconds
          shouldCollect = true;
        }
      } else if (type === 'major' || type === 'full') {
        // Collect older objects
        if (now - block.lastAccessed > 300000) { // 5 minutes
          shouldCollect = true;
        }
      }

      // Priority-based collection
      if (block.priority === 'low' && age > 600000) { // 10 minutes for low priority
        shouldCollect = true;
      }

      if (shouldCollect) {
        collectableBlocks.push(block);
      }
    }

    return collectableBlocks;
  }

  private async compactPool(pool: MemoryPool): Promise<void> {
    console.log(`Compacting pool ${pool.name}`);
    
    // Sort allocated blocks by address
    pool.allocatedBlocks.sort((a, b) => a.address - b.address);

    let currentAddress = 0;
    const compactedBlocks: MemoryBlock[] = [];

    // Move all allocated blocks to the beginning
    for (const block of pool.allocatedBlocks) {
      const compactedBlock = { ...block, address: currentAddress };
      compactedBlocks.push(compactedBlock);
      currentAddress += block.size;
    }

    // Update allocated blocks
    pool.allocatedBlocks = compactedBlocks;

    // Create single free block for remaining space
    const remainingSpace = pool.size - currentAddress;
    if (remainingSpace > 0) {
      pool.freeBlocks = [{
        id: `free_compacted_${Date.now()}`,
        address: currentAddress,
        size: remainingSpace,
        inUse: false,
        allocatedAt: 0,
        lastAccessed: 0,
        type: 'general',
        priority: 'low',
        refs: 0
      }];
    } else {
      pool.freeBlocks = [];
    }

    // Update fragmentation level
    pool.fragmentationLevel = 0; // Perfect compaction
  }

  private updatePoolFragmentation(pool: MemoryPool) {
    if (pool.freeBlocks.length === 0) {
      pool.fragmentationLevel = 0;
      return;
    }

    // Calculate fragmentation as ratio of free block count to total free space
    const totalFreeSpace = pool.freeBlocks.reduce((sum, block) => sum + block.size, 0);
    const averageBlockSize = totalFreeSpace / pool.freeBlocks.length;
    const largestBlock = Math.max(...pool.freeBlocks.map(block => block.size));
    
    pool.fragmentationLevel = 1 - (averageBlockSize / largestBlock);
  }

  // Memory Pressure Monitoring
  private setupMemoryPressureMonitoring() {
    this.memoryPressureTimer = setInterval(() => {
      this.checkMemoryPressure();
    }, 5000); // Check every 5 seconds
  }

  private checkMemoryPressure() {
    const usageRatio = this.metrics.usedMemory / this.metrics.totalMemory;
    
    if (usageRatio > this.config.aggressiveGCThreshold) {
      console.warn(`Critical memory pressure detected: ${(usageRatio * 100).toFixed(1)}%`);
      this.performGarbageCollection(undefined, 'full');
    } else if (usageRatio > this.config.memoryPressureThreshold) {
      console.log(`Memory pressure detected: ${(usageRatio * 100).toFixed(1)}%`);
      this.performGarbageCollection(undefined, 'major');
    }
  }

  // Automatic GC
  private setupAutomaticGC() {
    if (!this.config.enableAutoGC) return;

    this.gcTimer = setInterval(async () => {
      if (!this.isGCRunning) {
        await this.performGarbageCollection(undefined, 'minor');
      }
    }, this.config.gcInterval);
  }

  private shouldTriggerGC(pool: MemoryPool): boolean {
    return pool.used > pool.gcThreshold;
  }

  // App State Integration
  private setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        // Perform major GC when app goes to background
        this.performGarbageCollection(undefined, 'major');
      } else if (nextAppState === 'active') {
        // Update metrics when app becomes active
        this.updateMemoryMetrics();
      }
    });
  }

  // Utility Methods
  private findAllocatedBlock(blockId: string): MemoryBlock | null {
    for (const pool of this.pools.values()) {
      const block = pool.allocatedBlocks.find(b => b.id === blockId);
      if (block) {
        return block;
      }
    }
    return null;
  }

  private findPoolContainingBlock(address: number): MemoryPool | null {
    for (const pool of this.pools.values()) {
      if (address >= 0 && address < pool.size) {
        return pool;
      }
    }
    return null;
  }

  private updateAllocationMetrics(size: number, duration: number) {
    this.metrics.allocationRate = (this.metrics.allocationRate * 0.9) + (size * 0.1);
  }

  private updateDeallocationMetrics() {
    this.metrics.deallocationRate = (this.metrics.deallocationRate * 0.9) + (1 * 0.1);
  }

  private updateMemoryMetrics() {
    this.metrics.totalMemory = Array.from(this.pools.values()).reduce((sum, pool) => sum + pool.size, 0);
    this.metrics.usedMemory = Array.from(this.pools.values()).reduce((sum, pool) => sum + pool.used, 0);
    this.metrics.freeMemory = this.metrics.totalMemory - this.metrics.usedMemory;
    
    // Update pool utilization
    this.metrics.poolUtilization.clear();
    for (const pool of this.pools.values()) {
      this.metrics.poolUtilization.set(pool.name, pool.used / pool.size);
    }
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  // Callback Management
  onAllocation(callback: (block: MemoryBlock) => void): string {
    const id = `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.allocationCallbacks.set(id, callback);
    return id;
  }

  onDeallocation(callback: (blockId: string) => void): string {
    const id = `dealloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.deallocationCallbacks.set(id, callback);
    return id;
  }

  removeCallback(callbackId: string) {
    this.allocationCallbacks.delete(callbackId);
    this.deallocationCallbacks.delete(callbackId);
  }

  private notifyAllocationCallbacks(block: MemoryBlock) {
    for (const callback of this.allocationCallbacks.values()) {
      try {
        callback(block);
      } catch (error) {
        console.error('Allocation callback error:', error);
      }
    }
  }

  private notifyDeallocationCallbacks(blockId: string) {
    for (const callback of this.deallocationCallbacks.values()) {
      try {
        callback(blockId);
      } catch (error) {
        console.error('Deallocation callback error:', error);
      }
    }
  }

  // Public API
  getMemoryMetrics(): MemoryMetrics & {
    pools: {
      name: string;
      size: number;
      used: number;
      utilization: number;
      fragmentation: number;
      blockCount: number;
    }[];
    recentGCEvents: GCEvent[];
  } {
    this.updateMemoryMetrics();
    
    const pools = Array.from(this.pools.values()).map(pool => ({
      name: pool.name,
      size: pool.size,
      used: pool.used,
      utilization: pool.used / pool.size,
      fragmentation: pool.fragmentationLevel,
      blockCount: pool.allocatedBlocks.length
    }));

    return {
      ...this.metrics,
      pools,
      recentGCEvents: this.gcEvents.slice(-10)
    };
  }

  getPoolStatus(poolName: string): {
    exists: boolean;
    size?: number;
    used?: number;
    fragmentation?: number;
    blockCount?: number;
    largestFreeBlock?: number;
  } {
    const pool = Array.from(this.pools.values()).find(p => p.name === poolName);
    
    if (!pool) {
      return { exists: false };
    }

    const largestFreeBlock = pool.freeBlocks.length > 0 
      ? Math.max(...pool.freeBlocks.map(b => b.size))
      : 0;

    return {
      exists: true,
      size: pool.size,
      used: pool.used,
      fragmentation: pool.fragmentationLevel,
      blockCount: pool.allocatedBlocks.length,
      largestFreeBlock
    };
  }

  updateConfiguration(newConfig: Partial<GarbageCollectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart timers if intervals changed
    if (newConfig.gcInterval && this.gcTimer) {
      clearInterval(this.gcTimer);
      this.setupAutomaticGC();
    }

    this.persistConfiguration();
  }

  // Memory Debugging
  dumpMemoryState(): {
    totalPools: number;
    totalMemory: string;
    usedMemory: string;
    freeMemory: string;
    fragmentation: number;
    pools: {
      name: string;
      size: string;
      used: string;
      blocks: number;
      fragmentation: number;
    }[];
    recentAllocations: {
      id: string;
      type: string;
      size: string;
      age: number;
    }[];
  } {
    const now = Date.now();
    const pools = Array.from(this.pools.values());
    
    // Get recent allocations (last 50)
    const allBlocks = pools.flatMap(pool => pool.allocatedBlocks);
    const recentAllocations = allBlocks
      .sort((a, b) => b.allocatedAt - a.allocatedAt)
      .slice(0, 50)
      .map(block => ({
        id: block.id,
        type: block.type,
        size: this.formatBytes(block.size),
        age: now - block.allocatedAt
      }));

    const avgFragmentation = pools.reduce((sum, pool) => sum + pool.fragmentationLevel, 0) / pools.length;

    return {
      totalPools: pools.length,
      totalMemory: this.formatBytes(this.metrics.totalMemory),
      usedMemory: this.formatBytes(this.metrics.usedMemory),
      freeMemory: this.formatBytes(this.metrics.freeMemory),
      fragmentation: avgFragmentation,
      pools: pools.map(pool => ({
        name: pool.name,
        size: this.formatBytes(pool.size),
        used: this.formatBytes(pool.used),
        blocks: pool.allocatedBlocks.length,
        fragmentation: pool.fragmentationLevel
      })),
      recentAllocations
    };
  }

  // Persistence
  private async loadConfiguration(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('memory_pool_config');
      if (stored) {
        const savedConfig = JSON.parse(stored);
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.error('Failed to load memory pool configuration:', error);
    }
  }

  private async persistConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem('memory_pool_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to persist memory pool configuration:', error);
    }
  }

  // Cleanup
  dispose(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }
    
    if (this.memoryPressureTimer) {
      clearInterval(this.memoryPressureTimer);
    }

    // Final garbage collection
    this.performGarbageCollection(undefined, 'full');

    // Clear all pools
    this.pools.clear();
    
    // Clear callbacks
    this.allocationCallbacks.clear();
    this.deallocationCallbacks.clear();

    console.log('Memory Pool Manager disposed');
  }
}

export const MemoryPoolManager = new MemoryPoolManagerClass();
export default MemoryPoolManager;