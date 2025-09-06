import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorMonitoring } from './ErrorMonitoringService';
import { offlineQueueManager } from './OfflineQueueManager';

export interface DataEntity {
  id: string;
  type: string;
  data: any;
  version: number;
  lastModified: number;
  checksum: string;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  clientId: string;
}

export interface DataConflict {
  entityId: string;
  entityType: string;
  field: string;
  localValue: any;
  serverValue: any;
  localTimestamp: number;
  serverTimestamp: number;
  resolution: 'pending' | 'local_wins' | 'server_wins' | 'merged' | 'manual';
  mergeStrategy?: string;
}

export interface OptimisticUpdate {
  id: string;
  entityId: string;
  entityType: string;
  operation: 'create' | 'update' | 'delete';
  originalData: any;
  optimisticData: any;
  timestamp: number;
  rollbackData?: any;
  committed: boolean;
  failed: boolean;
}

export interface BackupPoint {
  id: string;
  timestamp: number;
  entities: Record<string, DataEntity>;
  checksum: string;
  size: number;
  compressed: boolean;
  metadata: {
    userId: string;
    deviceId: string;
    appVersion: string;
    dataVersion: string;
  };
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'range' | 'pattern' | 'custom';
  value?: any;
  customValidator?: (value: any, entity: any) => boolean;
  errorMessage: string;
}

export interface EntitySchema {
  type: string;
  version: number;
  fields: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';
    required: boolean;
    validation?: ValidationRule[];
  }>;
  relationships?: Record<string, {
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    target: string;
    cascadeDelete?: boolean;
  }>;
}

export class DataIntegrityService {
  private static instance: DataIntegrityService;
  private dataStore = new Map<string, DataEntity>();
  private optimisticUpdates = new Map<string, OptimisticUpdate>();
  private conflicts = new Map<string, DataConflict[]>();
  private backupQueue: BackupPoint[] = [];
  private entitySchemas = new Map<string, EntitySchema>();
  private clientId: string;
  
  private readonly MAX_BACKUPS = 10;
  private readonly BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_OPTIMISTIC_UPDATES = 100;
  private readonly CONFLICT_RESOLUTION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  private readonly STORAGE_KEYS = {
    DATA_STORE: '@tailtracker:data_store',
    OPTIMISTIC_UPDATES: '@tailtracker:optimistic_updates',
    CONFLICTS: '@tailtracker:conflicts',
    BACKUPS: '@tailtracker:backups',
    SCHEMAS: '@tailtracker:schemas',
  };

  private constructor() {
    this.clientId = this.generateClientId();
    this.initializeService();
  }

  public static getInstance(): DataIntegrityService {
    if (!DataIntegrityService.instance) {
      DataIntegrityService.instance = new DataIntegrityService();
    }
    return DataIntegrityService.instance;
  }

  /**
   * Initialize the data integrity service
   */
  private async initializeService(): Promise<void> {
    try {
      await this.loadPersistedData();
      this.registerDefaultSchemas();
      this.startPeriodicBackups();
      this.startConflictResolutionMonitor();
      
      errorMonitoring.addBreadcrumb({
        category: 'system',
        message: 'Data Integrity Service initialized',
        level: 'info',
        data: {
          entities: this.dataStore.size,
          optimisticUpdates: this.optimisticUpdates.size,
          conflicts: this.conflicts.size,
        },
      });
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DataIntegrityService', action: 'Initialize' },
        'high',
        ['data_integrity', 'initialization']
      );
    }
  }

  /**
   * Create optimistic update with rollback capability
   */
  public async createOptimisticUpdate(
    entityId: string,
    entityType: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<string> {
    try {
      const updateId = this.generateUpdateId();
      const existingEntity = this.dataStore.get(`${entityType}_${entityId}`);
      
      const optimisticUpdate: OptimisticUpdate = {
        id: updateId,
        entityId,
        entityType,
        operation,
        originalData: existingEntity?.data || null,
        optimisticData: data,
        timestamp: Date.now(),
        committed: false,
        failed: false,
      };

      // Store rollback data for update and delete operations
      if (operation === 'update' || operation === 'delete') {
        optimisticUpdate.rollbackData = existingEntity?.data;
      }

      // Apply optimistic update
      await this.applyOptimisticUpdate(optimisticUpdate);
      
      // Store optimistic update
      this.optimisticUpdates.set(updateId, optimisticUpdate);
      await this.persistOptimisticUpdates();

      // Queue for server sync
      await this.queueServerSync(optimisticUpdate);

      // Clean up old optimistic updates
      this.cleanupOptimisticUpdates();

      return updateId;
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        {
          component: 'DataIntegrityService',
          action: 'Create Optimistic Update',
          entityId,
          entityType,
        },
        'medium',
        ['data_integrity', 'optimistic_update']
      );
      throw error;
    }
  }

  /**
   * Commit optimistic update when server confirms
   */
  public async commitOptimisticUpdate(
    updateId: string,
    serverData?: any
  ): Promise<void> {
    try {
      const update = this.optimisticUpdates.get(updateId);
      if (!update) {
        throw new Error(`Optimistic update not found: ${updateId}`);
      }

      // Update with server data if provided
      if (serverData) {
        const entityKey = `${update.entityType}_${update.entityId}`;
        const entity = this.dataStore.get(entityKey);
        
        if (entity) {
          entity.data = serverData;
          entity.version++;
          entity.lastModified = Date.now();
          entity.syncStatus = 'synced';
          entity.checksum = this.calculateChecksum(serverData);
          
          this.dataStore.set(entityKey, entity);
        }
      }

      // Mark as committed
      update.committed = true;
      this.optimisticUpdates.set(updateId, update);

      await Promise.all([
        this.persistDataStore(),
        this.persistOptimisticUpdates(),
      ]);

      errorMonitoring.addBreadcrumb({
        category: 'system',
        message: `Optimistic update committed: ${updateId}`,
        level: 'info',
        data: { updateId, entityId: update.entityId, entityType: update.entityType },
      });
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DataIntegrityService', action: 'Commit Optimistic Update' },
        'medium',
        ['data_integrity', 'optimistic_commit']
      );
      throw error;
    }
  }

  /**
   * Rollback optimistic update on failure
   */
  public async rollbackOptimisticUpdate(updateId: string): Promise<void> {
    try {
      const update = this.optimisticUpdates.get(updateId);
      if (!update) {
        throw new Error(`Optimistic update not found: ${updateId}`);
      }

      const entityKey = `${update.entityType}_${update.entityId}`;
      
      // Restore original state
      if (update.operation === 'create') {
        // Remove the entity that was optimistically created
        this.dataStore.delete(entityKey);
      } else if (update.rollbackData) {
        // Restore previous data
        const entity = this.dataStore.get(entityKey);
        if (entity) {
          entity.data = update.rollbackData;
          entity.syncStatus = 'synced'; // Reset sync status
          this.dataStore.set(entityKey, entity);
        }
      }

      // Mark as failed
      update.failed = true;
      this.optimisticUpdates.set(updateId, update);

      await Promise.all([
        this.persistDataStore(),
        this.persistOptimisticUpdates(),
      ]);

      errorMonitoring.addBreadcrumb({
        category: 'system',
        message: `Optimistic update rolled back: ${updateId}`,
        level: 'warning',
        data: { updateId, entityId: update.entityId, entityType: update.entityType },
      });
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DataIntegrityService', action: 'Rollback Optimistic Update' },
        'high',
        ['data_integrity', 'optimistic_rollback']
      );
      throw error;
    }
  }

  /**
   * Detect and handle data conflicts
   */
  public async handleDataConflict(
    entityId: string,
    entityType: string,
    serverData: any,
    serverTimestamp: number
  ): Promise<DataConflict[]> {
    try {
      const entityKey = `${entityType}_${entityId}`;
      const localEntity = this.dataStore.get(entityKey);
      
      if (!localEntity) {
        // No local data, accept server data
        await this.storeEntity(entityType, entityId, serverData, serverTimestamp);
        return [];
      }

      const conflicts: DataConflict[] = [];
      const localData = localEntity.data;

      // Compare field by field
      const schema = this.entitySchemas.get(entityType);
      const fieldsToCheck = schema ? Object.keys(schema.fields) : Object.keys(localData);

      for (const field of fieldsToCheck) {
        if (this.hasFieldConflict(localData[field], serverData[field])) {
          const conflict: DataConflict = {
            entityId,
            entityType,
            field,
            localValue: localData[field],
            serverValue: serverData[field],
            localTimestamp: localEntity.lastModified,
            serverTimestamp,
            resolution: 'pending',
          };

          conflicts.push(conflict);
        }
      }

      if (conflicts.length > 0) {
        // Store conflicts for resolution
        const existingConflicts = this.conflicts.get(entityKey) || [];
        this.conflicts.set(entityKey, [...existingConflicts, ...conflicts]);
        await this.persistConflicts();

        // Attempt automatic resolution
        for (const conflict of conflicts) {
          await this.attemptAutomaticResolution(conflict);
        }
      } else {
        // No conflicts, update local data
        await this.storeEntity(entityType, entityId, serverData, serverTimestamp);
      }

      return conflicts;
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        {
          component: 'DataIntegrityService',
          action: 'Handle Data Conflict',
          entityId,
          entityType,
        },
        'high',
        ['data_integrity', 'conflict']
      );
      throw error;
    }
  }

  /**
   * Resolve data conflict with specified strategy
   */
  public async resolveConflict(
    entityId: string,
    entityType: string,
    field: string,
    strategy: 'local_wins' | 'server_wins' | 'merge' | 'manual',
    mergedValue?: any
  ): Promise<void> {
    try {
      const entityKey = `${entityType}_${entityId}`;
      const conflicts = this.conflicts.get(entityKey) || [];
      const conflict = conflicts.find(c => c.field === field);
      
      if (!conflict) {
        throw new Error(`Conflict not found for ${entityKey}.${field}`);
      }

      const entity = this.dataStore.get(entityKey);
      if (!entity) {
        throw new Error(`Entity not found: ${entityKey}`);
      }

      let resolvedValue: any;

      switch (strategy) {
        case 'local_wins':
          resolvedValue = conflict.localValue;
          break;
        case 'server_wins':
          resolvedValue = conflict.serverValue;
          break;
        case 'merge':
          resolvedValue = this.mergeValues(conflict.localValue, conflict.serverValue, field);
          break;
        case 'manual':
          if (mergedValue === undefined) {
            throw new Error('Manual resolution requires merged value');
          }
          resolvedValue = mergedValue;
          break;
      }

      // Apply resolution
      entity.data[field] = resolvedValue;
      entity.version++;
      entity.lastModified = Date.now();
      entity.syncStatus = 'pending'; // Mark for sync
      
      // Update conflict status
      conflict.resolution = strategy;
      
      // Remove resolved conflict
      const updatedConflicts = conflicts.filter(c => c.field !== field);
      if (updatedConflicts.length === 0) {
        this.conflicts.delete(entityKey);
      } else {
        this.conflicts.set(entityKey, updatedConflicts);
      }

      await Promise.all([
        this.persistDataStore(),
        this.persistConflicts(),
      ]);

      // Queue for sync
      await this.queueEntitySync(entity);

      errorMonitoring.addBreadcrumb({
        category: 'system',
        message: `Conflict resolved: ${entityKey}.${field} using ${strategy}`,
        level: 'info',
        data: { entityId, entityType, field, strategy },
      });
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DataIntegrityService', action: 'Resolve Conflict' },
        'high',
        ['data_integrity', 'conflict_resolution']
      );
      throw error;
    }
  }

  /**
   * Create data backup point
   */
  public async createBackup(metadata?: any): Promise<string> {
    try {
      const backupId = this.generateBackupId();
      const entities: Record<string, DataEntity> = {};

      // Copy all entities
      for (const [key, entity] of this.dataStore.entries()) {
        entities[key] = { ...entity };
      }

      const backup: BackupPoint = {
        id: backupId,
        timestamp: Date.now(),
        entities,
        checksum: this.calculateChecksum(entities),
        size: JSON.stringify(entities).length,
        compressed: false,
        metadata: {
          userId: metadata?.userId || 'anonymous',
          deviceId: this.clientId,
          appVersion: metadata?.appVersion || '1.0.0',
          dataVersion: metadata?.dataVersion || '1.0',
        },
      };

      // Add to backup queue
      this.backupQueue.push(backup);

      // Maintain backup limit
      if (this.backupQueue.length > this.MAX_BACKUPS) {
        this.backupQueue.shift();
      }

      await this.persistBackups();

      errorMonitoring.addBreadcrumb({
        category: 'system',
        message: `Data backup created: ${backupId}`,
        level: 'info',
        data: {
          backupId,
          entityCount: Object.keys(entities).length,
          size: backup.size,
        },
      });

      return backupId;
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DataIntegrityService', action: 'Create Backup' },
        'medium',
        ['data_integrity', 'backup']
      );
      throw error;
    }
  }

  /**
   * Restore from backup point
   */
  public async restoreFromBackup(backupId: string): Promise<void> {
    try {
      const backup = this.backupQueue.find(b => b.id === backupId);
      if (!backup) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Verify backup integrity
      const calculatedChecksum = this.calculateChecksum(backup.entities);
      if (calculatedChecksum !== backup.checksum) {
        throw new Error(`Backup integrity check failed: ${backupId}`);
      }

      // Create current state backup before restore
      await this.createBackup({ isPreRestore: true });

      // Restore entities
      this.dataStore.clear();
      for (const [key, entity] of Object.entries(backup.entities)) {
        this.dataStore.set(key, entity);
      }

      await this.persistDataStore();

      errorMonitoring.addBreadcrumb({
        category: 'system',
        message: `Data restored from backup: ${backupId}`,
        level: 'info',
        data: {
          backupId,
          restoredEntities: Object.keys(backup.entities).length,
          backupTimestamp: backup.timestamp,
        },
      });
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DataIntegrityService', action: 'Restore Backup' },
        'critical',
        ['data_integrity', 'backup_restore']
      );
      throw error;
    }
  }

  /**
   * Validate entity data against schema
   */
  public validateEntity(entityType: string, data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const schema = this.entitySchemas.get(entityType);
    if (!schema) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];

    // Validate required fields
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
      const value = data[fieldName];

      if (fieldSchema.required && (value === undefined || value === null)) {
        errors.push(`Field '${fieldName}' is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        // Type validation
        if (!this.validateFieldType(value, fieldSchema.type)) {
          errors.push(`Field '${fieldName}' must be of type ${fieldSchema.type}`);
        }

        // Custom validation rules
        if (fieldSchema.validation) {
          for (const rule of fieldSchema.validation) {
            if (!this.validateFieldRule(value, rule, data)) {
              errors.push(rule.errorMessage);
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get current data integrity status
   */
  public getIntegrityStatus(): {
    totalEntities: number;
    syncedEntities: number;
    pendingEntities: number;
    conflictedEntities: number;
    activeOptimisticUpdates: number;
    backupCount: number;
    lastBackup?: number;
    healthScore: number;
  } {
    const totalEntities = this.dataStore.size;
    let syncedEntities = 0;
    let pendingEntities = 0;
    let conflictedEntities = 0;

    for (const entity of this.dataStore.values()) {
      switch (entity.syncStatus) {
        case 'synced':
          syncedEntities++;
          break;
        case 'pending':
          pendingEntities++;
          break;
        case 'conflict':
          conflictedEntities++;
          break;
      }
    }

    const activeOptimisticUpdates = Array.from(this.optimisticUpdates.values())
      .filter(u => !u.committed && !u.failed).length;

    const lastBackup = this.backupQueue.length > 0 
      ? Math.max(...this.backupQueue.map(b => b.timestamp))
      : undefined;

    // Calculate health score (0-100)
    let healthScore = 100;
    if (totalEntities > 0) {
      healthScore -= (pendingEntities / totalEntities) * 20;
      healthScore -= (conflictedEntities / totalEntities) * 30;
      healthScore -= Math.min(activeOptimisticUpdates / 10, 1) * 20;
      if (!lastBackup || Date.now() - lastBackup > 24 * 60 * 60 * 1000) {
        healthScore -= 10;
      }
    }

    return {
      totalEntities,
      syncedEntities,
      pendingEntities,
      conflictedEntities,
      activeOptimisticUpdates,
      backupCount: this.backupQueue.length,
      lastBackup,
      healthScore: Math.max(0, Math.round(healthScore)),
    };
  }

  /**
   * Private helper methods
   */
  private async applyOptimisticUpdate(update: OptimisticUpdate): Promise<void> {
    const entityKey = `${update.entityType}_${update.entityId}`;

    switch (update.operation) {
      case 'create':
        await this.storeEntity(
          update.entityType,
          update.entityId,
          update.optimisticData,
          update.timestamp,
          'pending'
        );
        break;

      case 'update':
        const entity = this.dataStore.get(entityKey);
        if (entity) {
          entity.data = { ...entity.data, ...update.optimisticData };
          entity.version++;
          entity.lastModified = update.timestamp;
          entity.syncStatus = 'pending';
          this.dataStore.set(entityKey, entity);
        }
        break;

      case 'delete':
        const entityToDelete = this.dataStore.get(entityKey);
        if (entityToDelete) {
          entityToDelete.syncStatus = 'pending';
          // Mark as deleted but keep for rollback
          entityToDelete.data.__deleted = true;
        }
        break;
    }

    await this.persistDataStore();
  }

  private async storeEntity(
    entityType: string,
    entityId: string,
    data: any,
    timestamp?: number,
    syncStatus: DataEntity['syncStatus'] = 'synced'
  ): Promise<void> {
    const entityKey = `${entityType}_${entityId}`;
    const entity: DataEntity = {
      id: entityId,
      type: entityType,
      data,
      version: 1,
      lastModified: timestamp || Date.now(),
      checksum: this.calculateChecksum(data),
      syncStatus,
      clientId: this.clientId,
    };

    this.dataStore.set(entityKey, entity);
  }

  private hasFieldConflict(localValue: any, serverValue: any): boolean {
    // Deep comparison for objects and arrays
    return JSON.stringify(localValue) !== JSON.stringify(serverValue);
  }

  private async attemptAutomaticResolution(conflict: DataConflict): Promise<void> {
    // Simple automatic resolution rules
    if (conflict.serverTimestamp > conflict.localTimestamp + 60000) {
      // Server is significantly newer, prefer server
      await this.resolveConflict(
        conflict.entityId,
        conflict.entityType,
        conflict.field,
        'server_wins'
      );
    }
    // Add more automatic resolution rules as needed
  }

  private mergeValues(localValue: any, serverValue: any, field: string): any {
    // Simple merge strategies
    if (typeof localValue === 'string' && typeof serverValue === 'string') {
      // For strings, prefer longer version or combine if appropriate
      return localValue.length >= serverValue.length ? localValue : serverValue;
    }

    if (typeof localValue === 'number' && typeof serverValue === 'number') {
      // For numbers, take the maximum
      return Math.max(localValue, serverValue);
    }

    if (Array.isArray(localValue) && Array.isArray(serverValue)) {
      // For arrays, merge unique items
      return [...new Set([...localValue, ...serverValue])];
    }

    // Default to server value
    return serverValue;
  }

  private validateFieldType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'date':
        return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
      default:
        return true;
    }
  }

  private validateFieldRule(value: any, rule: ValidationRule, entity: any): boolean {
    switch (rule.type) {
      case 'required':
        return value !== undefined && value !== null && value !== '';
      case 'range':
        if (typeof value === 'number' && typeof rule.value === 'object') {
          const range = rule.value as { min?: number; max?: number };
          return (!range.min || value >= range.min) && (!range.max || value <= range.max);
        }
        return true;
      case 'pattern':
        if (typeof value === 'string' && rule.value instanceof RegExp) {
          return rule.value.test(value);
        }
        return true;
      case 'custom':
        return rule.customValidator ? rule.customValidator(value, entity) : true;
      default:
        return true;
    }
  }

  private async queueServerSync(update: OptimisticUpdate): Promise<void> {
    // Queue update for server synchronization
    await offlineQueueManager.enqueueAction(
      'OPTIMISTIC_UPDATE_SYNC',
      update,
      { priority: 'medium', requiresAuthentication: true }
    );
  }

  private async queueEntitySync(entity: DataEntity): Promise<void> {
    // Queue entity for server synchronization
    await offlineQueueManager.enqueueAction(
      'ENTITY_SYNC',
      entity,
      { priority: 'medium', requiresAuthentication: true }
    );
  }

  private cleanupOptimisticUpdates(): void {
    const updates = Array.from(this.optimisticUpdates.values());
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    // Remove old committed or failed updates
    for (const update of updates) {
      if ((update.committed || update.failed) && update.timestamp < cutoff) {
        this.optimisticUpdates.delete(update.id);
      }
    }

    // Limit total number of updates
    if (this.optimisticUpdates.size > this.MAX_OPTIMISTIC_UPDATES) {
      const sortedUpdates = updates.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = sortedUpdates.slice(0, this.optimisticUpdates.size - this.MAX_OPTIMISTIC_UPDATES);
      
      for (const update of toRemove) {
        this.optimisticUpdates.delete(update.id);
      }
    }
  }

  private startPeriodicBackups(): void {
    setInterval(() => {
      this.createBackup().catch(error => {
        console.warn('Periodic backup failed:', error);
      });
    }, this.BACKUP_INTERVAL);
  }

  private startConflictResolutionMonitor(): void {
    setInterval(() => {
      this.resolveExpiredConflicts().catch(error => {
        console.warn('Conflict resolution monitor failed:', error);
      });
    }, this.CONFLICT_RESOLUTION_TIMEOUT);
  }

  private async resolveExpiredConflicts(): Promise<void> {
    const cutoff = Date.now() - this.CONFLICT_RESOLUTION_TIMEOUT;
    
    for (const [entityKey, conflicts] of this.conflicts.entries()) {
      const expiredConflicts = conflicts.filter(
        c => c.resolution === 'pending' && c.serverTimestamp < cutoff
      );

      for (const conflict of expiredConflicts) {
        // Auto-resolve expired conflicts (prefer server)
        const [entityType, entityId] = entityKey.split('_');
        await this.resolveConflict(
          entityId,
          entityType,
          conflict.field,
          'server_wins'
        );
      }
    }
  }

  private registerDefaultSchemas(): void {
    // Register schemas for common entities
    this.entitySchemas.set('pet', {
      type: 'pet',
      version: 1,
      fields: {
        name: { type: 'string', required: true },
        breed: { type: 'string', required: true },
        birthDate: { type: 'date', required: false },
        photos: { type: 'array', required: false },
        vaccinations: { type: 'array', required: false },
      },
    });

    this.entitySchemas.set('user', {
      type: 'user',
      version: 1,
      fields: {
        email: { type: 'string', required: true },
        name: { type: 'string', required: true },
        preferences: { type: 'object', required: false },
      },
    });
  }

  // Utility methods
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUpdateId(): string {
    return `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChecksum(data: any): string {
    // Simple checksum calculation (in production, use proper hashing)
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  // Persistence methods
  private async loadPersistedData(): Promise<void> {
    try {
      const [dataStore, optimisticUpdates, conflicts, backups] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.DATA_STORE),
        AsyncStorage.getItem(this.STORAGE_KEYS.OPTIMISTIC_UPDATES),
        AsyncStorage.getItem(this.STORAGE_KEYS.CONFLICTS),
        AsyncStorage.getItem(this.STORAGE_KEYS.BACKUPS),
      ]);

      if (dataStore) {
        const entries = JSON.parse(dataStore);
        this.dataStore = new Map(entries);
      }

      if (optimisticUpdates) {
        const entries = JSON.parse(optimisticUpdates);
        this.optimisticUpdates = new Map(entries);
      }

      if (conflicts) {
        const entries = JSON.parse(conflicts);
        this.conflicts = new Map(entries);
      }

      if (backups) {
        this.backupQueue = JSON.parse(backups);
      }
    } catch (error) {
      console.warn('Failed to load persisted data integrity data:', error);
    }
  }

  private async persistDataStore(): Promise<void> {
    try {
      const entries = Array.from(this.dataStore.entries());
      await AsyncStorage.setItem(this.STORAGE_KEYS.DATA_STORE, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to persist data store:', error);
    }
  }

  private async persistOptimisticUpdates(): Promise<void> {
    try {
      const entries = Array.from(this.optimisticUpdates.entries());
      await AsyncStorage.setItem(this.STORAGE_KEYS.OPTIMISTIC_UPDATES, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to persist optimistic updates:', error);
    }
  }

  private async persistConflicts(): Promise<void> {
    try {
      const entries = Array.from(this.conflicts.entries());
      await AsyncStorage.setItem(this.STORAGE_KEYS.CONFLICTS, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to persist conflicts:', error);
    }
  }

  private async persistBackups(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.BACKUPS, JSON.stringify(this.backupQueue));
    } catch (error) {
      console.warn('Failed to persist backups:', error);
    }
  }
}

// Export singleton
export const dataIntegrityService = DataIntegrityService.getInstance();