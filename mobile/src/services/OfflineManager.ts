import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiClient } from './ApiClient';
import { OfflineDataLayer } from './OfflineDataLayer';
import { OfflineStorageService } from './OfflineStorageService';
import { OfflineSyncEngine } from './OfflineSyncEngine';
import { PriorityLostPetService } from './PriorityLostPetService';

export interface OfflineManagerConfig {
  // Storage Configuration
  databaseName: string;
  maxImageSize: number;
  compressionQuality: number;
  encryptionEnabled: boolean;
  storageQuotaMB: number;
  autoCleanupEnabled: boolean;
  cleanupThresholdDays: number;

  // Sync Configuration
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  syncIntervalMs: number;
  backgroundSyncEnabled: boolean;
  wifiOnlySync: boolean;
  batteryOptimized: boolean;
  compressionEnabled: boolean;

  // Data Layer Configuration
  enableOptimisticUpdates: boolean;
  cacheSize: number;
  cacheTTL: number;
  enableRealTimeSync: boolean;
  offlineQueueLimit: number;

  // Lost Pet Priority Configuration
  immediateUploadEnabled: boolean;
  backgroundLocationEnabled: boolean;
  highFrequencySync: boolean;
  emergencyContactsSync: boolean;
  localAlertCaching: boolean;
  compressionForUrgentUploads: boolean;
  batteryOptimizedMode: boolean;
}

export class OfflineManager extends EventEmitter {
  private storage: OfflineStorageService | null = null;
  private syncEngine: OfflineSyncEngine | null = null;
  private dataLayer: OfflineDataLayer | null = null;
  private lostPetService: PriorityLostPetService | null = null;
  private apiClient: ApiClient;
  private config: OfflineManagerConfig;
  private isInitialized = false;

  constructor(apiClient: ApiClient, config?: Partial<OfflineManagerConfig>) {
    super();
    this.apiClient = apiClient;
    this.config = this.createDefaultConfig(config);
  }

  private createDefaultConfig(config?: Partial<OfflineManagerConfig>): OfflineManagerConfig {
    return {
      // Storage defaults
      databaseName: 'tailtracker_offline.db',
      maxImageSize: 2 * 1024 * 1024, // 2MB
      compressionQuality: 0.8,
      encryptionEnabled: true,
      storageQuotaMB: 500, // 500MB
      autoCleanupEnabled: true,
      cleanupThresholdDays: 30,

      // Sync defaults
      batchSize: 50,
      maxRetries: 3,
      retryDelayMs: 5000,
      syncIntervalMs: 30000, // 30 seconds
      backgroundSyncEnabled: true,
      wifiOnlySync: false,
      batteryOptimized: true,
      compressionEnabled: true,

      // Data layer defaults
      enableOptimisticUpdates: true,
      cacheSize: 1000,
      cacheTTL: 300000, // 5 minutes
      enableRealTimeSync: true,
      offlineQueueLimit: 1000,

      // Lost pet priority defaults
      immediateUploadEnabled: true,
      backgroundLocationEnabled: true,
      highFrequencySync: true,
      emergencyContactsSync: true,
      localAlertCaching: true,
      compressionForUrgentUploads: true,
      batteryOptimizedMode: false, // Disabled for lost pet urgency

      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('OfflineManager already initialized');
      return;
    }

    try {
      this.emit('initializationStarted');

      // Initialize storage service
      this.storage = new OfflineStorageService({
        databaseName: this.config.databaseName,
        maxImageSize: this.config.maxImageSize,
        compressionQuality: this.config.compressionQuality,
        encryptionEnabled: this.config.encryptionEnabled,
        storageQuotaMB: this.config.storageQuotaMB,
        autoCleanupEnabled: this.config.autoCleanupEnabled,
        cleanupThresholdDays: this.config.cleanupThresholdDays
      });

      await this.storage.initialize();
      this.emit('storageInitialized');

      // Initialize sync engine
      this.syncEngine = new OfflineSyncEngine(
        this.storage,
        this.apiClient,
        {
          batchSize: this.config.batchSize,
          maxRetries: this.config.maxRetries,
          retryDelayMs: this.config.retryDelayMs,
          syncIntervalMs: this.config.syncIntervalMs,
          backgroundSyncEnabled: this.config.backgroundSyncEnabled,
          wifiOnlySync: this.config.wifiOnlySync,
          batteryOptimized: this.config.batteryOptimized,
          compressionEnabled: this.config.compressionEnabled
        }
      );

      this.setupSyncEngineEvents();
      this.emit('syncEngineInitialized');

      // Initialize data layer
      this.dataLayer = new OfflineDataLayer(
        this.storage,
        this.syncEngine,
        {
          enableOptimisticUpdates: this.config.enableOptimisticUpdates,
          cacheSize: this.config.cacheSize,
          cacheTTL: this.config.cacheTTL,
          enableRealTimeSync: this.config.enableRealTimeSync,
          offlineQueueLimit: this.config.offlineQueueLimit
        }
      );

      this.setupDataLayerEvents();
      this.emit('dataLayerInitialized');

      // Initialize lost pet priority service
      this.lostPetService = new PriorityLostPetService(
        this.storage,
        this.syncEngine,
        {
          immediateUploadEnabled: this.config.immediateUploadEnabled,
          backgroundLocationEnabled: this.config.backgroundLocationEnabled,
          highFrequencySync: this.config.highFrequencySync,
          emergencyContactsSync: this.config.emergencyContactsSync,
          localAlertCaching: this.config.localAlertCaching,
          compressionForUrgentUploads: this.config.compressionForUrgentUploads,
          batteryOptimizedMode: this.config.batteryOptimizedMode
        }
      );

      this.setupLostPetServiceEvents();
      this.emit('lostPetServiceInitialized');

      // Load saved settings
      await this.loadSettings();

      this.isInitialized = true;
      this.emit('initializationCompleted');

      console.log('OfflineManager initialization completed successfully');
    } catch (error) {
      console.error('Failed to initialize OfflineManager:', error);
      this.emit('initializationFailed', error);
      throw new Error('Offline functionality initialization failed');
    }
  }

  private setupSyncEngineEvents(): void {
    if (!this.syncEngine) return;

    this.syncEngine.on('syncStarted', () => {
      this.emit('syncStarted');
    });

    this.syncEngine.on('syncProgress', (progress) => {
      this.emit('syncProgress', progress);
    });

    this.syncEngine.on('syncCompleted', (progress) => {
      this.emit('syncCompleted', progress);
    });

    this.syncEngine.on('syncFailed', (error) => {
      this.emit('syncFailed', error);
    });

    this.syncEngine.on('conflictsDetected', (conflicts) => {
      this.emit('conflictsDetected', conflicts);
    });

    this.syncEngine.on('networkStateChanged', (networkState) => {
      this.emit('networkStateChanged', networkState);
    });

    this.syncEngine.on('connectionRestored', () => {
      this.emit('connectionRestored');
    });
  }

  private setupDataLayerEvents(): void {
    if (!this.dataLayer) return;

    this.dataLayer.on('optimisticUpdateApplied', (update) => {
      this.emit('optimisticUpdateApplied', update);
    });

    this.dataLayer.on('optimisticUpdateSynced', (update) => {
      this.emit('optimisticUpdateSynced', update);
    });

    this.dataLayer.on('optimisticUpdateRolledBack', (update) => {
      this.emit('optimisticUpdateRolledBack', update);
    });

    this.dataLayer.on('petCreated', (pet) => {
      this.emit('petCreated', pet);
    });

    this.dataLayer.on('petUpdated', (pet) => {
      this.emit('petUpdated', pet);
    });

    this.dataLayer.on('petDeleted', (petId) => {
      this.emit('petDeleted', petId);
    });

    this.dataLayer.on('healthRecordCreated', (record) => {
      this.emit('healthRecordCreated', record);
    });
  }

  private setupLostPetServiceEvents(): void {
    if (!this.lostPetService) return;

    this.lostPetService.on('lostPetReportCreated', (report) => {
      this.emit('lostPetReportCreated', report);
    });

    this.lostPetService.on('lostPetReportUpdated', (report) => {
      this.emit('lostPetReportUpdated', report);
    });

    this.lostPetService.on('sightingReported', (sighting) => {
      this.emit('sightingReported', sighting);
    });

    this.lostPetService.on('emergencyContactAdded', (contact) => {
      this.emit('emergencyContactAdded', contact);
    });

    this.lostPetService.on('locationMonitoringStarted', () => {
      this.emit('locationMonitoringStarted');
    });

    this.lostPetService.on('locationMonitoringStopped', () => {
      this.emit('locationMonitoringStopped');
    });
  }

  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem('offline_manager_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.config = { ...this.config, ...settings };
      }
    } catch (error) {
      console.warn('Failed to load offline settings:', error);
    }
  }

  async updateSettings(newSettings: Partial<OfflineManagerConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newSettings };
      await AsyncStorage.setItem('offline_manager_settings', JSON.stringify(this.config));
      this.emit('settingsUpdated', this.config);
    } catch (error) {
      console.error('Failed to save offline settings:', error);
      throw error;
    }
  }

  // Public API Methods

  // Data Layer Access
  getDataLayer(): OfflineDataLayer | null {
    return this.dataLayer;
  }

  // Storage Access
  getStorageService(): OfflineStorageService | null {
    return this.storage;
  }

  // Sync Engine Access
  getSyncEngine(): OfflineSyncEngine | null {
    return this.syncEngine;
  }

  // Lost Pet Service Access
  getLostPetService(): PriorityLostPetService | null {
    return this.lostPetService;
  }

  // Force Sync
  async forceSync(): Promise<void> {
    if (!this.syncEngine) {
      throw new Error('Sync engine not initialized');
    }
    await this.syncEngine.sync();
  }

  // Get Overall Status
  async getStatus(): Promise<{
    initialized: boolean;
    storage: any;
    sync: any;
    dataLayer: any;
    lostPetService: any;
  }> {
    const storage = this.storage ? await this.storage.getStorageInfo() : null;
    const sync = this.syncEngine ? await this.syncEngine.getSyncStats() : null;
    const dataLayer = this.dataLayer ? await this.dataLayer.getStatus() : null;

    return {
      initialized: this.isInitialized,
      storage,
      sync,
      dataLayer,
      lostPetService: this.lostPetService ? {
        emergencyContactsCount: (await this.lostPetService.getEmergencyContacts()).length
      } : null
    };
  }

  // Resolve Conflicts
  async resolveConflict(
    conflictId: string, 
    resolution: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE', 
    mergedData?: any
  ): Promise<void> {
    if (!this.syncEngine) {
      throw new Error('Sync engine not initialized');
    }
    await this.syncEngine.resolveConflict(conflictId, resolution, mergedData);
  }

  // Storage Management
  async clearCache(): Promise<void> {
    if (this.dataLayer) {
      await this.dataLayer.clearCache();
    }
  }

  async clearOfflineData(): Promise<void> {
    if (this.dataLayer) {
      await this.dataLayer.clearOfflineData();
    }
  }

  async exportData(): Promise<any> {
    if (!this.dataLayer) {
      throw new Error('Data layer not initialized');
    }
    return await this.dataLayer.exportData();
  }

  // Configuration
  getConfig(): OfflineManagerConfig {
    return { ...this.config };
  }

  isReady(): boolean {
    return this.isInitialized && 
           this.storage !== null && 
           this.syncEngine !== null && 
           this.dataLayer !== null && 
           this.lostPetService !== null;
  }

  // Pause/Resume Operations
  pauseSync(): void {
    if (this.syncEngine) {
      this.syncEngine.pauseSync();
    }
  }

  resumeSync(): void {
    if (this.syncEngine) {
      this.syncEngine.resumeSync();
    }
  }

  // Health Check
  async healthCheck(): Promise<{
    storage: boolean;
    syncEngine: boolean;
    dataLayer: boolean;
    lostPetService: boolean;
    overall: boolean;
  }> {
    const checks = {
      storage: false,
      syncEngine: false,
      dataLayer: false,
      lostPetService: false,
      overall: false
    };

    try {
      // Check storage
      if (this.storage) {
        await this.storage.getStorageInfo();
        checks.storage = true;
      }

      // Check sync engine
      if (this.syncEngine) {
        await this.syncEngine.getSyncStats();
        checks.syncEngine = true;
      }

      // Check data layer
      if (this.dataLayer) {
        await this.dataLayer.getStatus();
        checks.dataLayer = true;
      }

      // Check lost pet service
      if (this.lostPetService) {
        await this.lostPetService.getEmergencyContacts();
        checks.lostPetService = true;
      }

      checks.overall = checks.storage && checks.syncEngine && checks.dataLayer && checks.lostPetService;
    } catch (error) {
      console.error('Health check failed:', error);
    }

    return checks;
  }

  // Cleanup and Destroy
  async destroy(): Promise<void> {
    this.removeAllListeners();

    if (this.lostPetService) {
      this.lostPetService.destroy();
      this.lostPetService = null;
    }

    if (this.dataLayer) {
      this.dataLayer.destroy();
      this.dataLayer = null;
    }

    if (this.syncEngine) {
      this.syncEngine.destroy();
      this.syncEngine = null;
    }

    if (this.storage) {
      await this.storage.close();
      this.storage = null;
    }

    this.isInitialized = false;
  }
}

// Singleton instance for global access
let offlineManagerInstance: OfflineManager | null = null;

export const initializeOfflineManager = async (
  apiClient: ApiClient, 
  config?: Partial<OfflineManagerConfig>
): Promise<OfflineManager> => {
  if (offlineManagerInstance) {
    console.warn('OfflineManager already initialized');
    return offlineManagerInstance;
  }

  offlineManagerInstance = new OfflineManager(apiClient, config);
  await offlineManagerInstance.initialize();
  return offlineManagerInstance;
};

export const getOfflineManager = (): OfflineManager | null => {
  return offlineManagerInstance;
};

export const destroyOfflineManager = async (): Promise<void> => {
  if (offlineManagerInstance) {
    await offlineManagerInstance.destroy();
    offlineManagerInstance = null;
  }
};