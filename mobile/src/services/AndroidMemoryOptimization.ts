import React from 'react';
import { Platform, Dimensions, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MEMORY_CACHE_KEY = '@TailTracker:memory_cache';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_DIMENSION = 1024; // Max width/height for processed images
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export interface ImageCacheEntry {
  uri: string;
  localPath: string;
  size: number;
  timestamp: number;
  dimensions: { width: number; height: number };
  compressed: boolean;
}

export interface MemoryStats {
  totalCacheSize: number;
  cacheEntries: number;
  availableMemory: number;
  isLowMemory: boolean;
  lastCleanup: number;
}

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  enableCache?: boolean;
  aggressive?: boolean;
}

class AndroidMemoryOptimizationService {
  private imageCache: Map<string, ImageCacheEntry> = new Map();
  private cacheSize = 0;
  private isCleaningUp = false;
  private memoryWarningCallbacks: Set<() => void> = new Set();
  private lowMemoryThreshold = 100 * 1024 * 1024; // 100MB

  constructor() {
    this.initializeMemoryOptimization();
  }

  /**
   * Initialize memory optimization service
   */
  private async initializeMemoryOptimization(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.warn('Android Memory Optimization is only available on Android');
      return;
    }

    try {
      await this.loadCacheIndex();
      await this.setupMemoryWarningListeners();
      await this.performInitialCleanup();
      
      console.log('Android Memory Optimization initialized');
    } catch (error) {
      console.error('Error initializing memory optimization:', error);
    }
  }

  /**
   * Optimize image for memory usage
   */
  async optimizeImage(
    imageUri: string, 
    options: OptimizationOptions = {}
  ): Promise<string> {
    try {
      if (!this.isValidImageUri(imageUri)) {
        throw new Error('Invalid image URI');
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(imageUri, options);
      if (options.enableCache !== false) {
        const cached = await this.getCachedImage(cacheKey);
        if (cached) {
          return cached.localPath;
        }
      }

      // Get image info
      const imageInfo = await this.getImageInfo(imageUri);
      if (!imageInfo) {
        throw new Error('Unable to get image information');
      }

      // Determine if optimization is needed
      const needsOptimization = this.shouldOptimizeImage(imageInfo, options);
      
      let optimizedUri = imageUri;
      
      if (needsOptimization) {
        optimizedUri = await this.processImage(imageUri, imageInfo, options);
      }

      // Cache the result if enabled
      if (options.enableCache !== false) {
        await this.cacheImage(cacheKey, optimizedUri, imageInfo);
      }

      return optimizedUri;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return imageUri; // Return original on error
    }
  }

  /**
   * Batch optimize multiple images
   */
  async batchOptimizeImages(
    imageUris: string[], 
    options: OptimizationOptions = {}
  ): Promise<string[]> {
    try {
      // Check memory before processing
      await this.checkMemoryAndCleanup();

      const results: string[] = [];
      const batchSize = options.aggressive ? 2 : 5; // Smaller batches for aggressive mode

      for (let i = 0; i < imageUris.length; i += batchSize) {
        const batch = imageUris.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(uri => this.optimizeImage(uri, options))
        );
        
        results.push(...batchResults);

        // Trigger garbage collection hint between batches
        if (i + batchSize < imageUris.length) {
          await this.triggerGarbageCollection();
        }
      }

      return results;
    } catch (error) {
      console.error('Error batch optimizing images:', error);
      return imageUris; // Return originals on error
    }
  }

  /**
   * Create thumbnail with memory optimization
   */
  async createThumbnail(
    imageUri: string, 
    size: number = 200, 
    quality: number = 0.8
  ): Promise<string> {
    try {
      const options: OptimizationOptions = {
        maxWidth: size,
        maxHeight: size,
        quality,
        format: 'jpeg',
        enableCache: true,
        aggressive: true,
      };

      return await this.optimizeImage(imageUri, options);
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      return imageUri;
    }
  }

  /**
   * Preload and cache images
   */
  async preloadImages(imageUris: string[]): Promise<void> {
    try {
      // Limit concurrent preloading to avoid memory issues
      const concurrentLimit = 3;
      
      for (let i = 0; i < imageUris.length; i += concurrentLimit) {
        const batch = imageUris.slice(i, i + concurrentLimit);
        
        await Promise.all(
          batch.map(uri => 
            this.optimizeImage(uri, { 
              enableCache: true, 
              quality: 0.8,
              maxWidth: MAX_IMAGE_DIMENSION,
              maxHeight: MAX_IMAGE_DIMENSION,
            })
          )
        );

        // Small delay between batches
        await this.delay(100);
      }
    } catch (error) {
      console.error('Error preloading images:', error);
    }
  }

  /**
   * Clear image cache
   */
  async clearImageCache(): Promise<void> {
    try {
      this.isCleaningUp = true;

      // Delete cached files
      for (const entry of this.imageCache.values()) {
        try {
          await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
        } catch (error) {
          console.warn(`Failed to delete cached file: ${entry.localPath}`, error);
        }
      }

      // Clear cache index
      this.imageCache.clear();
      this.cacheSize = 0;

      // Update storage
      await this.saveCacheIndex();

      console.log('Image cache cleared');
    } catch (error) {
      console.error('Error clearing image cache:', error);
    } finally {
      this.isCleaningUp = false;
    }
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<MemoryStats> {
    try {
      // Get available memory (mock implementation)
      const availableMemory = await this.getAvailableMemory();
      
      return {
        totalCacheSize: this.cacheSize,
        cacheEntries: this.imageCache.size,
        availableMemory,
        isLowMemory: availableMemory < this.lowMemoryThreshold,
        lastCleanup: await this.getLastCleanupTime(),
      };
    } catch (error) {
      console.error('Error getting memory stats:', error);
      return {
        totalCacheSize: 0,
        cacheEntries: 0,
        availableMemory: 0,
        isLowMemory: true,
        lastCleanup: 0,
      };
    }
  }

  /**
   * Add memory warning callback
   */
  addMemoryWarningCallback(callback: () => void): () => void {
    this.memoryWarningCallbacks.add(callback);
    return () => this.memoryWarningCallbacks.delete(callback);
  }

  /**
   * Force garbage collection
   */
  async triggerGarbageCollection(): Promise<void> {
    try {
      // Small delay to allow React Native to clean up
      await this.delay(100);
      
      // Clear any temporary variables
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      console.warn('Garbage collection failed:', error);
    }
  }

  /**
   * Private methods
   */

  private async processImage(
    imageUri: string, 
    imageInfo: any, 
    options: OptimizationOptions
  ): Promise<string> {
    try {
      const { width, height } = imageInfo;
      const maxWidth = options.maxWidth || MAX_IMAGE_DIMENSION;
      const maxHeight = options.maxHeight || MAX_IMAGE_DIMENSION;
      const quality = options.quality || 0.8;
      const format = options.format || 'jpeg';

      // Calculate new dimensions
      const scale = Math.min(maxWidth / width, maxHeight / height, 1);
      const newWidth = Math.round(width * scale);
      const newHeight = Math.round(height * scale);

      const manipulatorOptions: any = {
        compress: quality,
        format: format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : 
                format === 'png' ? ImageManipulator.SaveFormat.PNG :
                ImageManipulator.SaveFormat.JPEG,
      };

      const actions = [];

      // Resize if needed
      if (scale < 1) {
        actions.push({
          resize: { width: newWidth, height: newHeight }
        });
      }

      // Apply additional optimizations for aggressive mode
      if (options.aggressive) {
        // Reduce quality further for aggressive optimization
        manipulatorOptions.compress = Math.min(quality * 0.8, 0.6);
      }

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        manipulatorOptions
      );

      return result.uri;
    } catch (error) {
      console.error('Error processing image:', error);
      return imageUri;
    }
  }

  private shouldOptimizeImage(imageInfo: any, options: OptimizationOptions): boolean {
    const { width, height } = imageInfo;
    const maxWidth = options.maxWidth || MAX_IMAGE_DIMENSION;
    const maxHeight = options.maxHeight || MAX_IMAGE_DIMENSION;

    // Optimize if image is larger than max dimensions
    if (width > maxWidth || height > maxHeight) {
      return true;
    }

    // Optimize if in aggressive mode
    if (options.aggressive) {
      return true;
    }

    // Optimize if low memory
    return this.isLowMemoryDevice();
  }

  private async getImageInfo(imageUri: string): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width, height) => resolve({ width, height }),
          (error) => reject(error)
        );
      });
    } catch (error) {
      console.error('Error getting image info:', error);
      return null;
    }
  }

  private generateCacheKey(imageUri: string, options: OptimizationOptions): string {
    const optionsString = JSON.stringify(options);
    return `${imageUri}_${optionsString}`.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private async getCachedImage(cacheKey: string): Promise<ImageCacheEntry | null> {
    try {
      const entry = this.imageCache.get(cacheKey);
      
      if (!entry) {
        return null;
      }

      // Check if cache entry is expired
      if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
        await this.removeCacheEntry(cacheKey);
        return null;
      }

      // Check if file still exists
      const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
      if (!fileInfo.exists) {
        await this.removeCacheEntry(cacheKey);
        return null;
      }

      return entry;
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  }

  private async cacheImage(
    cacheKey: string, 
    imageUri: string, 
    imageInfo: any
  ): Promise<void> {
    try {
      // Check if we need to cleanup cache first
      await this.checkCacheSizeAndCleanup();

      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        return;
      }

      const entry: ImageCacheEntry = {
        uri: imageUri,
        localPath: imageUri,
        size: fileInfo.size || 0,
        timestamp: Date.now(),
        dimensions: imageInfo,
        compressed: true,
      };

      this.imageCache.set(cacheKey, entry);
      this.cacheSize += entry.size;

      await this.saveCacheIndex();
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }

  private async removeCacheEntry(cacheKey: string): Promise<void> {
    try {
      const entry = this.imageCache.get(cacheKey);
      if (entry) {
        this.cacheSize -= entry.size;
        this.imageCache.delete(cacheKey);
        
        try {
          await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
        } catch (error) {
          console.warn('Failed to delete cache file:', error);
        }
      }
    } catch (error) {
      console.error('Error removing cache entry:', error);
    }
  }

  private async checkCacheSizeAndCleanup(): Promise<void> {
    if (this.cacheSize > MAX_CACHE_SIZE) {
      await this.cleanupOldCacheEntries();
    }
  }

  private async cleanupOldCacheEntries(): Promise<void> {
    try {
      if (this.isCleaningUp) return;
      this.isCleaningUp = true;

      // Sort entries by timestamp (oldest first)
      const entries = Array.from(this.imageCache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      );

      // Remove oldest entries until we're under the limit
      let removedSize = 0;
      const targetRemoval = this.cacheSize - (MAX_CACHE_SIZE * 0.8); // Remove to 80% of max

      for (const [key] of entries) {
        if (removedSize >= targetRemoval) break;
        
        const entry = this.imageCache.get(key);
        if (entry) {
          removedSize += entry.size;
          await this.removeCacheEntry(key);
        }
      }

      await this.saveCacheIndex();
      console.log(`Cleaned up ${removedSize} bytes from image cache`);
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    } finally {
      this.isCleaningUp = false;
    }
  }

  private async checkMemoryAndCleanup(): Promise<void> {
    try {
      const isLowMemory = await this.isLowMemoryDevice();
      
      if (isLowMemory) {
        await this.cleanupOldCacheEntries();
        await this.triggerGarbageCollection();
        this.notifyMemoryWarningCallbacks();
      }
    } catch (error) {
      console.error('Error checking memory:', error);
    }
  }

  private async isLowMemoryDevice(): Promise<boolean> {
    try {
      const availableMemory = await this.getAvailableMemory();
      return availableMemory < this.lowMemoryThreshold;
    } catch (error) {
      return false;
    }
  }

  private async getAvailableMemory(): Promise<number> {
    try {
      // Mock implementation - would use native module in real app
      return 200 * 1024 * 1024; // 200MB
    } catch (error) {
      return 0;
    }
  }

  private isValidImageUri(uri: string): boolean {
    if (!uri || typeof uri !== 'string') return false;
    
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lowerUri = uri.toLowerCase();
    
    return validExtensions.some(ext => lowerUri.includes(ext)) || 
           uri.startsWith('data:image/') ||
           uri.startsWith('file://') ||
           uri.startsWith('content://') ||
           uri.startsWith('http://') ||
           uri.startsWith('https://');
  }

  private async setupMemoryWarningListeners(): Promise<void> {
    // In a real implementation, this would listen to native memory warnings
    console.log('Memory warning listeners setup');
  }

  private notifyMemoryWarningCallbacks(): void {
    this.memoryWarningCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in memory warning callback:', error);
      }
    });
  }

  private async performInitialCleanup(): Promise<void> {
    try {
      // Clean up expired cache entries on startup
      const now = Date.now();
      const expiredKeys = [];

      for (const [key, entry] of this.imageCache.entries()) {
        if (now - entry.timestamp > CACHE_EXPIRY) {
          expiredKeys.push(key);
        }
      }

      for (const key of expiredKeys) {
        await this.removeCacheEntry(key);
      }

      if (expiredKeys.length > 0) {
        await this.saveCacheIndex();
        console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
      }
    } catch (error) {
      console.error('Error performing initial cleanup:', error);
    }
  }

  private async loadCacheIndex(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(MEMORY_CACHE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.imageCache = new Map(data.entries || []);
        this.cacheSize = data.cacheSize || 0;
      }
    } catch (error) {
      console.error('Error loading cache index:', error);
      this.imageCache = new Map();
      this.cacheSize = 0;
    }
  }

  private async saveCacheIndex(): Promise<void> {
    try {
      const data = {
        entries: Array.from(this.imageCache.entries()),
        cacheSize: this.cacheSize,
        lastSaved: Date.now(),
      };
      
      await AsyncStorage.setItem(MEMORY_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving cache index:', error);
    }
  }

  private async getLastCleanupTime(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem('@TailTracker:last_cleanup');
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.memoryWarningCallbacks.clear();
  }
}

// Export singleton instance
export const androidMemoryOptimization = new AndroidMemoryOptimizationService();

// TailTracker-specific memory optimization helpers
export const TailTrackerMemoryOptimization = {
  /**
   * Optimize pet profile image
   */
  async optimizePetProfileImage(imageUri: string): Promise<string> {
    return await androidMemoryOptimization.optimizeImage(imageUri, {
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.8,
      format: 'jpeg',
      enableCache: true,
    });
  },

  /**
   * Create pet thumbnail
   */
  async createPetThumbnail(imageUri: string): Promise<string> {
    return await androidMemoryOptimization.createThumbnail(imageUri, 150, 0.7);
  },

  /**
   * Optimize gallery images
   */
  async optimizeGalleryImages(imageUris: string[]): Promise<string[]> {
    return await androidMemoryOptimization.batchOptimizeImages(imageUris, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.85,
      format: 'jpeg',
      enableCache: true,
    });
  },

  /**
   * Optimize for low memory devices
   */
  async optimizeForLowMemory(imageUri: string): Promise<string> {
    return await androidMemoryOptimization.optimizeImage(imageUri, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.6,
      format: 'jpeg',
      enableCache: true,
      aggressive: true,
    });
  },

  /**
   * Preload pet images
   */
  async preloadPetImages(pets: Array<{ profileImage?: string; galleryImages?: string[] }>): Promise<void> {
    const imageUris: string[] = [];
    
    pets.forEach(pet => {
      if (pet.profileImage) {
        imageUris.push(pet.profileImage);
      }
      if (pet.galleryImages) {
        imageUris.push(...pet.galleryImages);
      }
    });

    await androidMemoryOptimization.preloadImages(imageUris);
  },
};

// React hooks for memory optimization
export const useAndroidMemoryOptimization = () => {
  const [memoryStats, setMemoryStats] = React.useState<MemoryStats>({
    totalCacheSize: 0,
    cacheEntries: 0,
    availableMemory: 0,
    isLowMemory: false,
    lastCleanup: 0,
  });
  const [isOptimizing, setIsOptimizing] = React.useState(false);

  React.useEffect(() => {
    loadMemoryStats();

    // Add memory warning listener
    const removeCallback = androidMemoryOptimization.addMemoryWarningCallback(() => {
      loadMemoryStats();
    });

    // Periodic stats update
    const interval = setInterval(loadMemoryStats, 60000); // Every minute

    return () => {
      removeCallback();
      clearInterval(interval);
    };
  }, []);

  const loadMemoryStats = async () => {
    try {
      const stats = await androidMemoryOptimization.getMemoryStats();
      setMemoryStats(stats);
    } catch (error) {
      console.error('Error loading memory stats:', error);
    }
  };

  const optimizeImage = async (imageUri: string, options?: OptimizationOptions) => {
    try {
      setIsOptimizing(true);
      const optimizedUri = await androidMemoryOptimization.optimizeImage(imageUri, options);
      await loadMemoryStats();
      return optimizedUri;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return imageUri;
    } finally {
      setIsOptimizing(false);
    }
  };

  const clearCache = async () => {
    try {
      setIsOptimizing(true);
      await androidMemoryOptimization.clearImageCache();
      await loadMemoryStats();
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const triggerGarbageCollection = async () => {
    try {
      await androidMemoryOptimization.triggerGarbageCollection();
      await loadMemoryStats();
    } catch (error) {
      console.error('Error triggering garbage collection:', error);
    }
  };

  return {
    memoryStats,
    isOptimizing,
    optimizeImage,
    clearCache,
    triggerGarbageCollection,
    createThumbnail: androidMemoryOptimization.createThumbnail.bind(androidMemoryOptimization),
    batchOptimizeImages: androidMemoryOptimization.batchOptimizeImages.bind(androidMemoryOptimization),
    preloadImages: androidMemoryOptimization.preloadImages.bind(androidMemoryOptimization),
    // TailTracker-specific helpers
    optimizePetProfileImage: TailTrackerMemoryOptimization.optimizePetProfileImage,
    createPetThumbnail: TailTrackerMemoryOptimization.createPetThumbnail,
    optimizeGalleryImages: TailTrackerMemoryOptimization.optimizeGalleryImages,
    optimizeForLowMemory: TailTrackerMemoryOptimization.optimizeForLowMemory,
    preloadPetImages: TailTrackerMemoryOptimization.preloadPetImages,
  };
};