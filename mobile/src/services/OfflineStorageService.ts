import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { MilitaryGradeCryptoService } from './MilitaryGradeCryptoService';

export interface StorageConfig {
  databaseName: string;
  maxImageSize: number;
  compressionQuality: number;
  encryptionEnabled: boolean;
  storageQuotaMB: number;
  autoCleanupEnabled: boolean;
  cleanupThresholdDays: number;
}

export interface OfflineRecord {
  id: string;
  table: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  localTimestamp: number;
  serverTimestamp?: number;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  conflictResolution?: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE' | 'MANUAL';
}

export interface ImageRecord {
  id: string;
  localPath: string;
  originalPath?: string;
  serverUrl?: string;
  size: number;
  mimeType: string;
  compressed: boolean;
  encrypted: boolean;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  checksum: string;
}

export class OfflineStorageService {
  private db: SQLite.SQLiteDatabase | null = null;
  private crypto: MilitaryGradeCryptoService;
  private config: StorageConfig;
  private isInitialized = false;

  constructor(config: StorageConfig) {
    this.config = config;
    this.crypto = MilitaryGradeCryptoService.getInstance();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize database
      this.db = await SQLite.openDatabaseAsync(this.config.databaseName);
      
      // Create tables
      await this.createTables();
      
      // Initialize crypto service (singleton already initialized)
      
      // Create directories
      await this.createDirectories();
      
      // Run cleanup if enabled
      if (this.config.autoCleanupEnabled) {
        await this.cleanup();
      }
      
      this.isInitialized = true;
      console.log('OfflineStorageService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OfflineStorageService:', error);
      throw new Error('Storage initialization failed');
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Core pet data
      `CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        local_timestamp INTEGER NOT NULL,
        server_timestamp INTEGER,
        sync_status TEXT DEFAULT 'PENDING',
        checksum TEXT
      )`,
      
      // Health records
      `CREATE TABLE IF NOT EXISTS health_records (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        data TEXT NOT NULL,
        local_timestamp INTEGER NOT NULL,
        server_timestamp INTEGER,
        sync_status TEXT DEFAULT 'PENDING',
        checksum TEXT,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,
      
      // Offline sync queue
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        local_timestamp INTEGER NOT NULL,
        server_timestamp INTEGER,
        sync_status TEXT DEFAULT 'PENDING',
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        priority TEXT DEFAULT 'MEDIUM',
        conflict_resolution TEXT
      )`,
      
      // Image storage metadata
      `CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        local_path TEXT NOT NULL,
        original_path TEXT,
        server_url TEXT,
        size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        compressed INTEGER DEFAULT 0,
        encrypted INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'PENDING',
        checksum TEXT NOT NULL
      )`,
      
      // Lost pet reports (priority sync)
      `CREATE TABLE IF NOT EXISTS lost_pet_reports (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        data TEXT NOT NULL,
        local_timestamp INTEGER NOT NULL,
        server_timestamp INTEGER,
        sync_status TEXT DEFAULT 'PENDING',
        priority TEXT DEFAULT 'CRITICAL',
        location_data TEXT,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,
      
      // Family coordination
      `CREATE TABLE IF NOT EXISTS family_coordination (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL,
        data TEXT NOT NULL,
        local_timestamp INTEGER NOT NULL,
        server_timestamp INTEGER,
        sync_status TEXT DEFAULT 'PENDING'
      )`,
      
      // Emergency contacts (always available offline)
      `CREATE TABLE IF NOT EXISTS emergency_contacts (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        local_timestamp INTEGER NOT NULL,
        server_timestamp INTEGER,
        sync_status TEXT DEFAULT 'PENDING'
      )`,
      
      // Settings and preferences
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        local_timestamp INTEGER NOT NULL,
        sync_required INTEGER DEFAULT 1
      )`
    ];

    for (const table of tables) {
      await this.db.execAsync(table);
    }

    // Create indexes for performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_pets_sync_status ON pets (sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue (priority, local_timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue (sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_images_sync_status ON images (sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_lost_pets_priority ON lost_pet_reports (priority, local_timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_health_records_pet_id ON health_records (pet_id)'
    ];

    for (const index of indexes) {
      await this.db.execAsync(index);
    }
  }

  private async createDirectories(): Promise<void> {
    const directories = [
      `${FileSystem.documentDirectory}images/`,
      `${FileSystem.documentDirectory}images/compressed/`,
      `${FileSystem.documentDirectory}images/thumbnails/`,
      `${FileSystem.documentDirectory}exports/`,
      `${FileSystem.documentDirectory}backups/`
    ];

    for (const dir of directories) {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    }
  }

  // Pet Data Operations
  async savePet(petData: any): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = petData.id || this.generateId();
    const timestamp = Date.now();
    const dataStr = JSON.stringify(petData);
    const checksum = await this.generateChecksum(dataStr);

    // Encrypt data if enabled
    const finalData = this.config.encryptionEnabled 
      ? await this.crypto.encryptForStorage(dataStr, 'pet_data')
      : dataStr;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO pets 
       (id, data, local_timestamp, checksum) 
       VALUES (?, ?, ?, ?)`,
      [id, finalData, timestamp, checksum]
    );

    // Add to sync queue
    await this.addToSyncQueue('pets', 'CREATE', { id, ...petData }, 'MEDIUM');

    return id;
  }

  async getPet(id: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM pets WHERE id = ?',
      [id]
    ) as any;

    if (!result) return null;

    // Decrypt data if encrypted
    const dataStr = this.config.encryptionEnabled 
      ? await this.crypto.decryptFromStorage(result.data, 'pet_data')
      : result.data;

    return JSON.parse(dataStr);
  }

  async getAllPets(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync('SELECT * FROM pets') as any[];
    
    const pets = [];
    for (const result of results) {
      const dataStr = this.config.encryptionEnabled 
        ? await this.crypto.decryptFromStorage(result.data, 'pet_data')
        : result.data;
      
      pets.push({
        ...JSON.parse(dataStr),
        _offline: {
          localTimestamp: result.local_timestamp,
          serverTimestamp: result.server_timestamp,
          syncStatus: result.sync_status
        }
      });
    }

    return pets;
  }

  // Health Records Operations
  async saveHealthRecord(petId: string, healthData: any): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = healthData.id || this.generateId();
    const timestamp = Date.now();
    const dataStr = JSON.stringify(healthData);
    const checksum = await this.generateChecksum(dataStr);

    const finalData = this.config.encryptionEnabled 
      ? await this.crypto.encryptForStorage(dataStr, 'pet_data')
      : dataStr;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO health_records 
       (id, pet_id, data, local_timestamp, checksum) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, petId, finalData, timestamp, checksum]
    );

    await this.addToSyncQueue('health_records', 'CREATE', { id, petId, ...healthData }, 'HIGH');

    return id;
  }

  async getHealthRecords(petId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(
      'SELECT * FROM health_records WHERE pet_id = ? ORDER BY local_timestamp DESC',
      [petId]
    ) as any[];

    const records = [];
    for (const result of results) {
      const dataStr = this.config.encryptionEnabled 
        ? await this.crypto.decryptFromStorage(result.data, 'pet_data')
        : result.data;
      
      records.push({
        ...JSON.parse(dataStr),
        _offline: {
          localTimestamp: result.local_timestamp,
          serverTimestamp: result.server_timestamp,
          syncStatus: result.sync_status
        }
      });
    }

    return records;
  }

  // Image Storage Operations
  async saveImage(imageUri: string, metadata: Partial<ImageRecord>): Promise<string> {
    const id = this.generateId();
    const localPath = `${FileSystem.documentDirectory}images/${id}.jpg`;
    
    try {
      // Compress image if needed
      let finalUri = imageUri;
      if (metadata.compressed !== false) {
        finalUri = await this.compressImage(imageUri);
      }

      // Move to local storage
      await FileSystem.copyAsync({
        from: finalUri,
        to: localPath
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      const size = (fileInfo.exists && 'size' in fileInfo) ? fileInfo.size : 0;
      
      // Generate checksum
      const checksum = await this.generateFileChecksum(localPath);

      // Encrypt if enabled
      if (this.config.encryptionEnabled) {
        await this.encryptFile(localPath);
      }

      // Save metadata
      await this.db!.runAsync(
        `INSERT INTO images 
         (id, local_path, size, mime_type, compressed, encrypted, checksum) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id, 
          localPath, 
          size, 
          metadata.mimeType || 'image/jpeg',
          metadata.compressed !== false ? 1 : 0,
          this.config.encryptionEnabled ? 1 : 0,
          checksum
        ]
      );

      // Add to sync queue
      await this.addToSyncQueue('images', 'CREATE', { id, localPath }, 'LOW');

      return id;
    } catch (error) {
      console.error('Failed to save image:', error);
      throw new Error('Image save failed');
    }
  }

  async getImage(id: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM images WHERE id = ?',
      [id]
    ) as any;

    if (!result) return null;

    // Decrypt if encrypted
    if (result.encrypted) {
      await this.decryptFile(result.local_path);
    }

    return result.local_path;
  }

  // Lost Pet Reports (Priority Sync)
  async saveLostPetReport(petId: string, reportData: any): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const timestamp = Date.now();
    const dataStr = JSON.stringify(reportData);

    await this.db.runAsync(
      `INSERT INTO lost_pet_reports 
       (id, pet_id, data, local_timestamp, priority) 
       VALUES (?, ?, ?, ?, 'CRITICAL')`,
      [id, petId, dataStr, timestamp]
    );

    // Add to sync queue with highest priority
    await this.addToSyncQueue('lost_pet_reports', 'CREATE', { id, petId, ...reportData }, 'CRITICAL');

    return id;
  }

  // Sync Queue Management
  async addToSyncQueue(
    tableName: string, 
    action: 'CREATE' | 'UPDATE' | 'DELETE', 
    data: any, 
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const timestamp = Date.now();

    await this.db.runAsync(
      `INSERT INTO sync_queue 
       (id, table_name, action, data, local_timestamp, priority) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, tableName, action, JSON.stringify(data), timestamp, priority]
    );
  }

  async getSyncQueue(limit = 100): Promise<OfflineRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM sync_queue 
      WHERE sync_status = 'PENDING' OR sync_status = 'FAILED'
      ORDER BY 
        CASE priority 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          WHEN 'LOW' THEN 4 
        END,
        local_timestamp ASC
      LIMIT ?
    `, [limit]) as any[];

    return results.map(result => ({
      id: result.id,
      table: result.table_name,
      action: result.action,
      data: JSON.parse(result.data),
      localTimestamp: result.local_timestamp,
      serverTimestamp: result.server_timestamp,
      syncStatus: result.sync_status,
      retryCount: result.retry_count,
      lastError: result.last_error,
      priority: result.priority,
      conflictResolution: result.conflict_resolution
    }));
  }

  async updateSyncStatus(id: string, status: string, serverTimestamp?: number, error?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE sync_queue 
       SET sync_status = ?, server_timestamp = ?, last_error = ?, retry_count = retry_count + 1
       WHERE id = ?`,
      [status, serverTimestamp || null, error || null, id]
    );
  }

  async clearSyncedItems(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      "DELETE FROM sync_queue WHERE sync_status = 'SYNCED' AND local_timestamp < ?",
      [Date.now() - (24 * 60 * 60 * 1000)] // Keep for 24 hours
    );
  }

  // Storage Management
  async getStorageInfo(): Promise<{
    totalSize: number;
    availableSize: number;
    databaseSize: number;
    imageSize: number;
    quotaUsed: number;
    quotaRemaining: number;
  }> {
    const documentDir = FileSystem.documentDirectory!;
    const dbPath = `${documentDir}SQLite/${this.config.databaseName}`;
    const imageDir = `${documentDir}images/`;

    const [dbInfo] = await Promise.all([
      FileSystem.getInfoAsync(dbPath),
      FileSystem.getInfoAsync(imageDir)
    ]);

    const databaseSize = (dbInfo.exists && 'size' in dbInfo) ? dbInfo.size : 0;
    const imageSize = await this.calculateDirectorySize(imageDir);
    const totalUsed = databaseSize + imageSize;
    const quotaMB = this.config.storageQuotaMB;
    const quotaBytes = quotaMB * 1024 * 1024;

    return {
      totalSize: totalUsed,
      availableSize: quotaBytes - totalUsed,
      databaseSize,
      imageSize,
      quotaUsed: (totalUsed / quotaBytes) * 100,
      quotaRemaining: quotaBytes - totalUsed
    };
  }

  async cleanup(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoff = Date.now() - (this.config.cleanupThresholdDays * 24 * 60 * 60 * 1000);

    // Clean old synced records
    await this.db.runAsync(
      "DELETE FROM sync_queue WHERE sync_status = 'SYNCED' AND local_timestamp < ?",
      [cutoff]
    );

    // Clean orphaned images
    await this.cleanupOrphanedImages();

    // Vacuum database
    await this.db.execAsync('VACUUM');
  }

  // Utility Methods
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateChecksum(data: string): Promise<string> {
    // Use expo-crypto to generate SHA-256 hash
    const { digestStringAsync, CryptoDigestAlgorithm } = await import('expo-crypto');
    return await digestStringAsync(CryptoDigestAlgorithm.SHA256, data);
  }

  private async compressImage(uri: string): Promise<string> {
    // Image compression logic here
    // This would integrate with expo-image-manipulator
    return uri; // Placeholder
  }

  private async encryptFile(filePath: string): Promise<void> {
    // File encryption logic
    const content = await FileSystem.readAsStringAsync(filePath, { encoding: 'base64' });
    const encrypted = await this.crypto.encryptForStorage(content, 'file_data');
    await FileSystem.writeAsStringAsync(filePath, encrypted);
  }

  private async decryptFile(filePath: string): Promise<void> {
    // File decryption logic
    const content = await FileSystem.readAsStringAsync(filePath);
    const decrypted = await this.crypto.decryptFromStorage(content, 'file_data');
    await FileSystem.writeAsStringAsync(filePath, decrypted, { encoding: 'base64' });
  }

  private async generateFileChecksum(filePath: string): Promise<string> {
    const content = await FileSystem.readAsStringAsync(filePath, { encoding: 'base64' });
    return await this.generateChecksum(content);
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    try {
      const files = await FileSystem.readDirectoryAsync(dirPath);
      let totalSize = 0;

      for (const file of files) {
        const filePath = `${dirPath}${file}`;
        const info = await FileSystem.getInfoAsync(filePath);
        totalSize += (info.exists && 'size' in info) ? info.size : 0;
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  private async cleanupOrphanedImages(): Promise<void> {
    if (!this.db) return;

    const imageDir = `${FileSystem.documentDirectory}images/`;
    const files = await FileSystem.readDirectoryAsync(imageDir);
    
    for (const file of files) {
      const result = await this.db.getFirstAsync(
        'SELECT id FROM images WHERE local_path = ?',
        [`${imageDir}${file}`]
      );

      if (!result) {
        await FileSystem.deleteAsync(`${imageDir}${file}`, { idempotent: true });
      }
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }
}