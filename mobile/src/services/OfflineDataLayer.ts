import { EventEmitter } from 'events';
import NetInfo from '@react-native-community/netinfo';
import { OfflineStorageService } from './OfflineStorageService';
import { OfflineSyncEngine } from './OfflineSyncEngine';

export interface OptimisticUpdate<T = any> {
  id: string;
  table: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: T;
  originalData?: T;
  timestamp: number;
  rollbackCallback?: () => Promise<void>;
}

export interface DataLayerConfig {
  enableOptimisticUpdates: boolean;
  cacheSize: number;
  cacheTTL: number;
  enableRealTimeSync: boolean;
  offlineQueueLimit: number;
}

export interface QueryOptions {
  useCache?: boolean;
  forceSync?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  offline?: boolean;
}

export class OfflineDataLayer extends EventEmitter {
  private storage: OfflineStorageService;
  private syncEngine: OfflineSyncEngine;
  private config: DataLayerConfig;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private optimisticUpdates = new Map<string, OptimisticUpdate>();
  private isOnline = false;
  private pendingCallbacks = new Map<string, ((data: any) => void)[]>();

  constructor(
    storage: OfflineStorageService,
    syncEngine: OfflineSyncEngine,
    config: DataLayerConfig
  ) {
    super();
    this.storage = storage;
    this.syncEngine = syncEngine;
    this.config = config;

    this.initializeNetworkMonitoring();
    this.setupSyncEngineEvents();
  }

  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected || false;

      if (!wasOnline && this.isOnline) {
        this.emit('connectionRestored');
        this.processOptimisticUpdates();
      } else if (wasOnline && !this.isOnline) {
        this.emit('connectionLost');
      }
    });
  }

  private setupSyncEngineEvents(): void {
    this.syncEngine.on('syncCompleted', () => {
      this.emit('syncCompleted');
      this.invalidateExpiredCache();
    });

    this.syncEngine.on('conflictsDetected', (conflicts) => {
      this.emit('conflictsDetected', conflicts);
    });

    this.syncEngine.on('syncProgress', (progress) => {
      this.emit('syncProgress', progress);
    });
  }

  // Pet Operations
  async createPet(petData: any, options: QueryOptions = {}): Promise<string> {
    const id = this.generateId();
    const fullPetData = { ...petData, id, createdAt: new Date().toISOString() };

    if (this.config.enableOptimisticUpdates && !options.offline) {
      await this.applyOptimisticUpdate({
        id,
        table: 'pets',
        action: 'CREATE',
        data: fullPetData,
        timestamp: Date.now()
      });
    }

    // Save to local storage
    const localId = await this.storage.savePet(fullPetData);
    
    // Update cache
    this.updateCache(`pets:${id}`, fullPetData);

    // Emit event
    this.emit('petCreated', fullPetData);

    return localId;
  }

  async updatePet(id: string, updates: any, options: QueryOptions = {}): Promise<void> {
    // Get current pet data
    const currentPet = await this.getPet(id, { useCache: true });
    if (!currentPet) {
      throw new Error(`Pet ${id} not found`);
    }

    const updatedPet = { 
      ...currentPet, 
      ...updates, 
      id, 
      updatedAt: new Date().toISOString() 
    };

    if (this.config.enableOptimisticUpdates && !options.offline) {
      await this.applyOptimisticUpdate({
        id,
        table: 'pets',
        action: 'UPDATE',
        data: updatedPet,
        originalData: currentPet,
        timestamp: Date.now(),
        rollbackCallback: async () => {
          await this.storage.savePet(currentPet);
        }
      });
    }

    // Save to local storage
    await this.storage.savePet(updatedPet);
    
    // Update cache
    this.updateCache(`pets:${id}`, updatedPet);

    // Emit event
    this.emit('petUpdated', updatedPet);
  }

  async getPet(id: string, options: QueryOptions = {}): Promise<any | null> {
    const cacheKey = `pets:${id}`;

    // Check cache first
    if (options.useCache !== false) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    // Try local storage
    let pet = await this.storage.getPet(id);
    
    // If not found locally and online, try to sync
    if (!pet && this.isOnline && !options.offline) {
      try {
        await this.syncEngine.forceSyncTable('pets');
        pet = await this.storage.getPet(id);
      } catch (error) {
        console.warn('Failed to sync pet data:', error);
      }
    }

    if (pet) {
      this.updateCache(cacheKey, pet);
    }

    return pet;
  }

  async getAllPets(options: QueryOptions = {}): Promise<any[]> {
    const cacheKey = 'pets:all';

    // Check cache first
    if (options.useCache !== false) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    // Get from local storage
    let pets = await this.storage.getAllPets();

    // Apply optimistic updates
    pets = this.applyOptimisticUpdatesToCollection(pets, 'pets');

    // Update cache
    this.updateCache(cacheKey, pets, { ttl: 30000 }); // 30 seconds TTL for lists

    return pets;
  }

  async deletePet(id: string, options: QueryOptions = {}): Promise<void> {
    const pet = await this.getPet(id);
    if (!pet) return;

    if (this.config.enableOptimisticUpdates && !options.offline) {
      await this.applyOptimisticUpdate({
        id,
        table: 'pets',
        action: 'DELETE',
        data: { id },
        originalData: pet,
        timestamp: Date.now(),
        rollbackCallback: async () => {
          await this.storage.savePet(pet);
        }
      });
    }

    // Mark as deleted in local storage (soft delete)
    await this.storage.savePet({ ...pet, deleted: true });
    
    // Remove from cache
    this.removeFromCache(`pets:${id}`);
    this.removeFromCache('pets:all');

    // Emit event
    this.emit('petDeleted', { id });
  }

  // Health Records Operations
  async createHealthRecord(petId: string, healthData: any, options: QueryOptions = {}): Promise<string> {
    const id = this.generateId();
    const fullHealthData = { 
      ...healthData, 
      id, 
      petId, 
      createdAt: new Date().toISOString() 
    };

    if (this.config.enableOptimisticUpdates && !options.offline) {
      await this.applyOptimisticUpdate({
        id,
        table: 'health_records',
        action: 'CREATE',
        data: fullHealthData,
        timestamp: Date.now()
      });
    }

    const localId = await this.storage.saveHealthRecord(petId, fullHealthData);
    
    // Update cache
    this.updateCache(`health_records:${petId}`, null); // Invalidate pet's health records cache
    
    this.emit('healthRecordCreated', fullHealthData);

    return localId;
  }

  async getHealthRecords(petId: string, options: QueryOptions = {}): Promise<any[]> {
    const cacheKey = `health_records:${petId}`;

    if (options.useCache !== false) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    let records = await this.storage.getHealthRecords(petId);

    // Apply optimistic updates
    records = this.applyOptimisticUpdatesToCollection(records, 'health_records');

    this.updateCache(cacheKey, records);

    return records;
  }

  // Lost Pet Operations (Priority Sync)
  async createLostPetReport(petId: string, reportData: any): Promise<string> {
    const id = this.generateId();
    const fullReportData = { 
      ...reportData, 
      id, 
      petId, 
      createdAt: new Date().toISOString(),
      priority: 'CRITICAL',
      status: 'ACTIVE'
    };

    // Always apply optimistic update for lost pet reports
    if (this.config.enableOptimisticUpdates) {
      await this.applyOptimisticUpdate({
        id,
        table: 'lost_pet_reports',
        action: 'CREATE',
        data: fullReportData,
        timestamp: Date.now()
      });
    }

    const localId = await this.storage.saveLostPetReport(petId, fullReportData);
    
    // Immediately try to sync if online
    if (this.isOnline) {
      try {
        await this.syncEngine.forceSyncTable('lost_pet_reports');
      } catch (error) {
        console.warn('Failed to immediately sync lost pet report:', error);
      }
    }

    this.emit('lostPetReportCreated', fullReportData);

    return localId;
  }

  // Image Operations
  async saveImage(imageUri: string, metadata: any = {}): Promise<string> {
    const id = await this.storage.saveImage(imageUri, {
      ...metadata,
      compressed: true // Always compress for offline storage
    });

    this.emit('imageSaved', { id, uri: imageUri });

    return id;
  }

  async getImage(id: string): Promise<string | null> {
    const cacheKey = `image:${id}`;
    
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const imagePath = await this.storage.getImage(id);
    
    if (imagePath) {
      this.updateCache(cacheKey, imagePath);
    }

    return imagePath;
  }

  // Optimistic Updates Management
  private async applyOptimisticUpdate(update: OptimisticUpdate): Promise<void> {
    this.optimisticUpdates.set(update.id, update);

    // If online, try to sync immediately
    if (this.isOnline && this.config.enableRealTimeSync) {
      try {
        await this.syncEngine.forceSyncTable(update.table);
        this.optimisticUpdates.delete(update.id);
      } catch (error) {
        console.warn('Failed to sync optimistic update:', error);
        // Keep the update for later processing
      }
    }

    this.emit('optimisticUpdateApplied', update);
  }

  private async processOptimisticUpdates(): Promise<void> {
    if (!this.isOnline) return;

    const updates = Array.from(this.optimisticUpdates.values());
    
    for (const update of updates) {
      try {
        await this.syncEngine.forceSyncTable(update.table);
        this.optimisticUpdates.delete(update.id);
        this.emit('optimisticUpdateSynced', update);
      } catch (error) {
        console.warn(`Failed to sync optimistic update ${update.id}:`, error);
        
        // If it's been too long, consider rollback
        if (Date.now() - update.timestamp > 300000) { // 5 minutes
          await this.rollbackOptimisticUpdate(update);
        }
      }
    }
  }

  private async rollbackOptimisticUpdate(update: OptimisticUpdate): Promise<void> {
    if (update.rollbackCallback) {
      try {
        await update.rollbackCallback();
        this.optimisticUpdates.delete(update.id);
        this.emit('optimisticUpdateRolledBack', update);
      } catch (error) {
        console.error('Failed to rollback optimistic update:', error);
      }
    }
  }

  private applyOptimisticUpdatesToCollection(collection: any[], table: string): any[] {
    const updates = Array.from(this.optimisticUpdates.values())
      .filter(update => update.table === table);

    if (updates.length === 0) return collection;

    let result = [...collection];

    for (const update of updates) {
      switch (update.action) {
        case 'CREATE':
          // Add to collection if not already there
          if (!result.find(item => item.id === update.data.id)) {
            result.push(update.data);
          }
          break;
        case 'UPDATE':
          // Update existing item
          const index = result.findIndex(item => item.id === update.data.id);
          if (index !== -1) {
            result[index] = { ...result[index], ...update.data };
          }
          break;
        case 'DELETE':
          // Remove from collection
          result = result.filter(item => item.id !== update.data.id);
          break;
      }
    }

    return result;
  }

  // Cache Management
  private updateCache(key: string, data: any, options: { ttl?: number } = {}): void {
    if (this.cache.size >= this.config.cacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = Math.ceil(this.config.cacheSize * 0.1); // Remove 10%
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.config.cacheTTL
    });
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check TTL
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private removeFromCache(key: string): void {
    this.cache.delete(key);
  }

  private invalidateExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Query Builder for Complex Operations
  query(table: string) {
    return new OfflineQueryBuilder(this, table);
  }

  // Batch Operations
  async batch(operations: (() => Promise<any>)[]): Promise<any[]> {
    const results: any[] = [];
    const rollbacks: (() => Promise<void>)[] = [];

    try {
      for (const operation of operations) {
        const result = await operation();
        results.push(result);
      }

      return results;
    } catch (error) {
      // Rollback all successful operations
      for (const rollback of rollbacks.reverse()) {
        try {
          await rollback();
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }

      throw error;
    }
  }

  // Data Export/Import
  async exportData(): Promise<{
    pets: any[];
    healthRecords: any[];
    images: string[];
    timestamp: number;
  }> {
    const [pets, allHealthRecords] = await Promise.all([
      this.getAllPets({ useCache: false }),
      this.storage.getAllPets().then(pets => 
        Promise.all(pets.map(pet => this.getHealthRecords(pet.id)))
      )
    ]);

    const healthRecords = allHealthRecords.flat();
    
    return {
      pets,
      healthRecords,
      images: [], // Image export feature - implement with CDN integration
      timestamp: Date.now()
    };
  }

  async importData(data: any): Promise<void> {
    // Data import with conflict resolution - implement batch processing
    throw new Error('Import not yet implemented');
  }

  // Utilities
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Status and Statistics
  async getStatus(): Promise<{
    isOnline: boolean;
    cacheSize: number;
    pendingUpdates: number;
    lastSyncTime: number;
    syncInProgress: boolean;
  }> {
    const syncStats = await this.syncEngine.getSyncStats();
    
    return {
      isOnline: this.isOnline,
      cacheSize: this.cache.size,
      pendingUpdates: this.optimisticUpdates.size,
      lastSyncTime: syncStats.lastSyncTime,
      syncInProgress: this.syncEngine.isSyncing()
    };
  }

  // Cleanup
  async clearCache(): Promise<void> {
    this.cache.clear();
    this.emit('cacheCleared');
  }

  async clearOfflineData(): Promise<void> {
    this.cache.clear();
    this.optimisticUpdates.clear();
    // Note: This doesn't clear the SQLite database - that would be done by the storage service
    this.emit('offlineDataCleared');
  }

  destroy(): void {
    this.removeAllListeners();
    this.cache.clear();
    this.optimisticUpdates.clear();
  }
}

// Query Builder for Complex Offline Queries
class OfflineQueryBuilder {
  private dataLayer: OfflineDataLayer;
  private tableName: string;
  private conditions: ((item: any) => boolean)[] = [];
  private sortField?: string;
  private sortDirection: 'asc' | 'desc' = 'asc';
  private limitValue?: number;

  constructor(dataLayer: OfflineDataLayer, table: string) {
    this.dataLayer = dataLayer;
    this.tableName = table;
  }

  where(field: string, operator: '=' | '!=' | '>' | '<' | '>=' | '<=', value: any): this {
    this.conditions.push((item: any) => {
      const itemValue = this.getNestedValue(item, field);
      
      switch (operator) {
        case '=': return itemValue === value;
        case '!=': return itemValue !== value;
        case '>': return itemValue > value;
        case '<': return itemValue < value;
        case '>=': return itemValue >= value;
        case '<=': return itemValue <= value;
        default: return false;
      }
    });
    
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.sortField = field;
    this.sortDirection = direction;
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  async execute(): Promise<any[]> {
    let data: any[] = [];

    // Get data based on table
    switch (this.tableName) {
      case 'pets':
        data = await this.dataLayer.getAllPets();
        break;
      default:
        throw new Error(`Unsupported table: ${this.tableName}`);
    }

    // Apply conditions
    for (const condition of this.conditions) {
      data = data.filter(condition);
    }

    // Apply sorting
    if (this.sortField) {
      data.sort((a, b) => {
        const aValue = this.getNestedValue(a, this.sortField!);
        const bValue = this.getNestedValue(b, this.sortField!);
        
        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitValue) {
      data = data.slice(0, this.limitValue);
    }

    return data;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}