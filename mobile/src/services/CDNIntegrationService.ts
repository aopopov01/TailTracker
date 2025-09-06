import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { EnhancedCacheManager } from './EnhancedCacheManager';

interface CDNConfig {
  baseUrl: string;
  fallbackUrls: string[];
  regions: string[];
  enableGeoRouting: boolean;
  enableCompression: boolean;
  enableWebP: boolean;
  cacheTTL: number;
  retryAttempts: number;
  timeout: number;
  enablePrefetch: boolean;
  batchSize: number;
}

interface AssetMetadata {
  id: string;
  type: 'image' | 'video' | 'document' | 'audio';
  originalUrl: string;
  cdnUrl: string;
  size: number;
  format: string;
  dimensions?: { width: number; height: number };
  checksum: string;
  lastModified: number;
  expiresAt: number;
  variants?: AssetVariant[];
}

interface AssetVariant {
  quality: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  url: string;
  size: number;
  dimensions: { width: number; height: number };
  format: string;
}

interface CDNPerformanceMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageLoadTime: number;
  dataTransferred: number;
  compressionSavings: number;
  failoverCount: number;
  regionPerformance: Map<string, number>;
}

interface DownloadJob {
  id: string;
  url: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  retryCount: number;
  timeout: number;
  onProgress?: (progress: number) => void;
  onComplete?: (result: DownloadResult) => void;
  onError?: (error: Error) => void;
}

interface DownloadResult {
  success: boolean;
  localPath?: string;
  size: number;
  duration: number;
  fromCache: boolean;
  cdnRegion?: string;
}

class CDNIntegrationServiceClass {
  private config: CDNConfig;
  private metrics: CDNPerformanceMetrics;
  private assetMetadata: Map<string, AssetMetadata> = new Map();
  private downloadQueue: DownloadJob[] = [];
  private activeDownloads: Set<string> = new Set();
  private regionPerformance: Map<string, number> = new Map();
  private preferredRegion: string | null = null;
  private isProcessingQueue = false;

  constructor() {
    this.config = {
      baseUrl: 'https://cdn.tailtracker.com',
      fallbackUrls: [
        'https://cdn-backup.tailtracker.com',
        'https://assets.tailtracker.com'
      ],
      regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
      enableGeoRouting: true,
      enableCompression: true,
      enableWebP: true,
      cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
      retryAttempts: 3,
      timeout: 30000,
      enablePrefetch: true,
      batchSize: 5
    };

    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageLoadTime: 0,
      dataTransferred: 0,
      compressionSavings: 0,
      failoverCount: 0,
      regionPerformance: new Map()
    };

    this.initialize();
  }

  private async initialize() {
    try {
      await this.loadConfiguration();
      await this.loadAssetMetadata();
      await this.loadMetrics();
      await this.detectOptimalRegion();
      this.startQueueProcessor();
      this.startPerformanceMonitoring();
      
      console.log('CDN Integration Service initialized');
    } catch (error) {
      console.error('Failed to initialize CDN Integration Service:', error);
    }
  }

  // Asset URL Generation and Optimization
  getOptimizedAssetUrl(
    originalUrl: string,
    options: {
      quality?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
      format?: 'webp' | 'jpg' | 'png' | 'auto';
      width?: number;
      height?: number;
      dpr?: number; // Device pixel ratio
    } = {}
  ): string {
    try {
      // Use sync method for generating asset ID to avoid Promise issues
      const assetId = btoa(originalUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
      const metadata = this.assetMetadata.get(assetId);
      
      if (metadata?.variants) {
        const variant = this.selectOptimalVariant(metadata.variants, options);
        if (variant) {
          return this.buildCDNUrl(variant.url, options);
        }
      }

      // Generate optimized URL from original
      return this.buildOptimizedUrl(originalUrl, options);

    } catch (error) {
      console.error('Failed to generate optimized asset URL:', error);
      return originalUrl;
    }
  }

  private async generateAssetId(url: string): Promise<string> {
    try {
      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, url);
      return hash.substring(0, 16);
    } catch {
      return btoa(url).substring(0, 16);
    }
  }

  private selectOptimalVariant(variants: AssetVariant[], options: any): AssetVariant | null {
    const quality = options.quality || 'medium';
    const targetWidth = options.width || 0;
    const targetHeight = options.height || 0;

    // First try exact quality match
    let variant = variants.find(v => v.quality === quality);
    
    if (!variant && (targetWidth > 0 || targetHeight > 0)) {
      // Find closest size match
      variant = variants.reduce((best, current) => {
        const bestArea = best.dimensions.width * best.dimensions.height;
        const currentArea = current.dimensions.width * current.dimensions.height;
        const targetArea = targetWidth * targetHeight;
        
        const bestDiff = Math.abs(bestArea - targetArea);
        const currentDiff = Math.abs(currentArea - targetArea);
        
        return currentDiff < bestDiff ? current : best;
      });
    }

    // Fallback to medium quality
    return variant || variants.find(v => v.quality === 'medium') || variants[0];
  }

  private buildCDNUrl(assetUrl: string, options: any): string {
    const baseUrl = this.getOptimalCDNRegion();
    const url = new URL(assetUrl, baseUrl);
    
    // Add optimization parameters
    if (options.width) url.searchParams.set('w', options.width.toString());
    if (options.height) url.searchParams.set('h', options.height.toString());
    if (options.dpr && options.dpr > 1) url.searchParams.set('dpr', options.dpr.toString());
    
    // Format optimization
    if (this.config.enableWebP && options.format !== 'original') {
      url.searchParams.set('f', 'webp');
    }
    
    // Compression
    if (this.config.enableCompression) {
      url.searchParams.set('q', '85'); // 85% quality for good balance
    }

    return url.toString();
  }

  private buildOptimizedUrl(originalUrl: string, options: any): string {
    try {
      const baseUrl = this.getOptimalCDNRegion();
      const encodedUrl = encodeURIComponent(originalUrl);
      const url = new URL(`${baseUrl}/transform/${encodedUrl}`);
      
      // Add transformation parameters
      if (options.width) url.searchParams.set('w', options.width.toString());
      if (options.height) url.searchParams.set('h', options.height.toString());
      if (options.quality) url.searchParams.set('q', this.getQualityValue(options.quality).toString());
      if (options.format && options.format !== 'auto') {
        url.searchParams.set('f', options.format);
      } else if (this.config.enableWebP) {
        url.searchParams.set('f', 'webp');
      }
      if (options.dpr && options.dpr > 1) url.searchParams.set('dpr', options.dpr.toString());

      return url.toString();

    } catch (error) {
      console.error('Failed to build optimized URL:', error);
      return originalUrl;
    }
  }

  private getQualityValue(quality: string): number {
    const qualityMap: Record<string, number> = {
      'thumbnail': 60,
      'small': 70,
      'medium': 85,
      'large': 90,
      'original': 95
    };
    
    return qualityMap[quality] || 85;
  }

  private getOptimalCDNRegion(): string {
    if (this.preferredRegion) {
      return `${this.config.baseUrl}/${this.preferredRegion}`;
    }
    
    return this.config.baseUrl;
  }

  // Asset Download and Caching
  async downloadAsset(
    url: string,
    options: {
      priority?: 'critical' | 'high' | 'medium' | 'low';
      useCache?: boolean;
      timeout?: number;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<DownloadResult> {
    const startTime = performance.now();
    const assetId = await this.generateAssetId(url);
    
    try {
      // Check if already cached
      if (options.useCache !== false) {
        const cached = await this.getCachedAsset(assetId);
        if (cached) {
          this.metrics.cacheHits++;
          return {
            success: true,
            localPath: cached,
            size: 0,
            duration: performance.now() - startTime,
            fromCache: true
          };
        }
      }

      this.metrics.cacheMisses++;
      this.metrics.totalRequests++;

      // Add to download queue
      return new Promise((resolve, reject) => {
        const job: DownloadJob = {
          id: assetId,
          url,
          priority: options.priority || 'medium',
          retryCount: 0,
          timeout: options.timeout || this.config.timeout,
          onProgress: options.onProgress,
          onComplete: resolve,
          onError: reject
        };

        this.addToDownloadQueue(job);
      });

    } catch (error) {
      console.error(`Failed to download asset ${url}:`, error);
      throw error;
    }
  }

  private async getCachedAsset(assetId: string): Promise<string | null> {
    try {
      const cacheKey = `cdn_asset_${assetId}`;
      const cached = await EnhancedCacheManager.get<{ localPath: string }>(cacheKey);
      
      if (cached && cached.localPath) {
        // Verify file still exists
        const fileInfo = await FileSystem.getInfoAsync(cached.localPath);
        if (fileInfo.exists) {
          return cached.localPath;
        } else {
          // Clean up stale cache entry
          await EnhancedCacheManager.delete(cacheKey);
        }
      }
      
      return null;

    } catch (error) {
      console.error(`Failed to get cached asset ${assetId}:`, error);
      return null;
    }
  }

  private addToDownloadQueue(job: DownloadJob) {
    // Remove existing job with same ID
    this.downloadQueue = this.downloadQueue.filter(j => j.id !== job.id);
    
    // Add new job and sort by priority
    this.downloadQueue.push(job);
    this.downloadQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processDownloadQueue();
    }
  }

  private async processDownloadQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      while (this.downloadQueue.length > 0) {
        // Process batch of downloads
        const batch = this.downloadQueue.splice(0, this.config.batchSize);
        
        await Promise.allSettled(
          batch.map(job => this.executeDownload(job))
        );

        // Small delay between batches to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async executeDownload(job: DownloadJob): Promise<void> {
    if (this.activeDownloads.has(job.id)) return;
    
    this.activeDownloads.add(job.id);
    // Track download start time
    performance.now();
    
    try {
      const result = await this.performDownload(job);
      
      // Update metrics
      this.updateMetrics(result.duration, result.size);
      
      if (job.onComplete) {
        job.onComplete(result);
      }

    } catch (error) {
      console.error(`Download failed for ${job.url}:`, error);
      
      if (job.retryCount < this.config.retryAttempts) {
        job.retryCount++;
        setTimeout(() => {
          this.addToDownloadQueue(job);
        }, Math.pow(2, job.retryCount) * 1000); // Exponential backoff
      } else if (job.onError) {
        job.onError(error as Error);
      }

    } finally {
      this.activeDownloads.delete(job.id);
    }
  }

  private async performDownload(job: DownloadJob): Promise<DownloadResult> {
    // Track performance start time
    performance.now();
    let attempt = 0;
    let lastError: Error | null = null;

    // Try primary CDN first, then fallbacks
    const urlsToTry = [job.url, ...this.config.fallbackUrls.map(fallback => 
      job.url.replace(this.config.baseUrl, fallback)
    )];

    for (const url of urlsToTry) {
      try {
        attempt++;
        console.log(`Downloading ${url} (attempt ${attempt})`);

        const result = await this.downloadFromUrl(url, job);
        
        // If fallback was used, increment failover count
        if (attempt > 1) {
          this.metrics.failoverCount++;
        }

        return result;

      } catch (error) {
        lastError = error as Error;
        console.warn(`Download attempt ${attempt} failed for ${url}:`, error);
        
        // If this wasn't the last URL, continue to next
        if (attempt < urlsToTry.length) {
          continue;
        }
      }
    }

    // All attempts failed
    throw lastError || new Error('All download attempts failed');
  }

  private async downloadFromUrl(url: string, job: DownloadJob): Promise<DownloadResult> {
    const startTime = performance.now();
    
    try {
      // Create local file path
      const filename = `${job.id}_${Date.now()}`;
      const localPath = `${FileSystem.documentDirectory}cdn_cache/${filename}`;
      
      // Ensure directory exists
      const dirPath = `${FileSystem.documentDirectory}cdn_cache/`;
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }

      // Download file with progress tracking
      const downloadOptions: any = {};
      if (job.onProgress) {
        downloadOptions.progressCallback = (progress: any) => {
          const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          job.onProgress!(percent);
        };
      }
      
      await FileSystem.downloadAsync(
        url,
        localPath,
        downloadOptions
      );

      const duration = performance.now() - startTime;
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      const size = fileInfo.exists && !fileInfo.isDirectory ? (fileInfo as any).size || 0 : 0;

      // Cache the download result
      const cacheKey = `cdn_asset_${job.id}`;
      await EnhancedCacheManager.set(
        cacheKey,
        { localPath, url, downloadedAt: Date.now() },
        {
          ttl: this.config.cacheTTL,
          priority: job.priority === 'critical' ? 'high' : 'medium'
        }
      );

      return {
        success: true,
        localPath,
        size,
        duration,
        fromCache: false,
        cdnRegion: this.extractRegionFromUrl(url)
      };

    } catch (error) {
      console.error(`Failed to download from ${url}:`, error);
      throw error;
    }
  }

  private extractRegionFromUrl(url: string): string | undefined {
    for (const region of this.config.regions) {
      if (url.includes(region)) {
        return region;
      }
    }
    return undefined;
  }

  // Performance Optimization
  private async detectOptimalRegion() {
    if (!this.config.enableGeoRouting) return;

    const testPromises = this.config.regions.map(async region => {
      const startTime = performance.now();
      try {
        const testUrl = `${this.config.baseUrl}/${region}/health`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch(testUrl, { 
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const latency = performance.now() - startTime;
        this.regionPerformance.set(region, latency);
        return { region, latency };

      } catch {
        this.regionPerformance.set(region, Infinity);
        return { region, latency: Infinity };
      }
    });

    try {
      const results = await Promise.allSettled(testPromises);
      
      let bestRegion = this.config.regions[0];
      let bestLatency = Infinity;

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { region, latency } = result.value;
          if (latency < bestLatency) {
            bestLatency = latency;
            bestRegion = region;
          }
        }
      });

      this.preferredRegion = bestRegion;
      console.log(`Optimal CDN region: ${bestRegion} (${bestLatency.toFixed(2)}ms)`);

    } catch (error) {
      console.error('Failed to detect optimal CDN region:', error);
    }
  }

  private startPerformanceMonitoring() {
    // Monitor performance every 5 minutes
    setInterval(() => {
      this.optimizePerformance();
    }, 5 * 60 * 1000);

    // Update region performance every 30 minutes
    setInterval(() => {
      this.detectOptimalRegion();
    }, 30 * 60 * 1000);
  }

  private optimizePerformance() {
    // Adjust batch size based on performance
    const avgLoadTime = this.metrics.averageLoadTime;
    
    if (avgLoadTime > 5000) { // Slow performance
      this.config.batchSize = Math.max(1, this.config.batchSize - 1);
    } else if (avgLoadTime < 1000) { // Good performance
      this.config.batchSize = Math.min(10, this.config.batchSize + 1);
    }

    // Adjust timeout based on network performance
    if (avgLoadTime > 10000) {
      this.config.timeout = Math.min(60000, this.config.timeout + 5000);
    } else if (avgLoadTime < 2000) {
      this.config.timeout = Math.max(15000, this.config.timeout - 1000);
    }
  }

  private updateMetrics(duration: number, size: number) {
    // Update average load time using exponential moving average
    const alpha = 0.1;
    this.metrics.averageLoadTime = 
      this.metrics.averageLoadTime * (1 - alpha) + duration * alpha;
    
    this.metrics.dataTransferred += size;

    // Estimate compression savings (rough estimate)
    if (this.config.enableCompression) {
      this.metrics.compressionSavings += size * 0.3; // Assume 30% savings
    }
  }

  // Prefetching
  async prefetchAssets(urls: string[], priority: 'high' | 'medium' | 'low' = 'low'): Promise<void> {
    if (!this.config.enablePrefetch) return;

    // Check network conditions
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected || networkState.type === 'cellular') {
      console.log('Skipping prefetch due to network conditions');
      return;
    }

    // Queue prefetch jobs with low priority
    urls.forEach(url => {
      this.downloadAsset(url, { priority, useCache: true }).catch(error => {
        console.warn(`Prefetch failed for ${url}:`, error);
      });
    });
  }

  // Asset Management
  async registerAsset(originalUrl: string, metadata: Partial<AssetMetadata>): Promise<void> {
    const assetId = await this.generateAssetId(originalUrl);
    
    const fullMetadata: AssetMetadata = {
      id: assetId,
      type: 'image',
      originalUrl,
      cdnUrl: this.getOptimizedAssetUrl(originalUrl),
      size: 0,
      format: 'jpg',
      checksum: '',
      lastModified: Date.now(),
      expiresAt: Date.now() + this.config.cacheTTL,
      ...metadata
    };

    this.assetMetadata.set(assetId, fullMetadata);
    await this.persistAssetMetadata();
  }

  async getAssetMetadata(url: string): Promise<AssetMetadata | null> {
    const assetId = await this.generateAssetId(url);
    return this.assetMetadata.get(assetId) || null;
  }

  // Cache Management
  async clearCache(): Promise<void> {
    try {
      // Clear file system cache
      const cacheDir = `${FileSystem.documentDirectory}cdn_cache/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(cacheDir);
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      // Clear memory cache
      const keys = await AsyncStorage.getAllKeys();
      const cdnKeys = keys.filter(key => key.startsWith('cdn_asset_'));
      await AsyncStorage.multiRemove(cdnKeys);

      console.log('CDN cache cleared successfully');

    } catch (error) {
      console.error('Failed to clear CDN cache:', error);
      throw error;
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const cacheDir = `${FileSystem.documentDirectory}cdn_cache/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      
      if (!dirInfo.exists) return 0;

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = `${cacheDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        totalSize += fileInfo.exists && !fileInfo.isDirectory ? (fileInfo as any).size || 0 : 0;
      }

      return totalSize;

    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }

  // Public API
  getMetrics(): CDNPerformanceMetrics & { 
    cacheSize: number; 
    activeDownloads: number; 
    queueLength: number;
    preferredRegion: string | null;
  } {
    return {
      ...this.metrics,
      cacheSize: 0, // Would be calculated asynchronously
      activeDownloads: this.activeDownloads.size,
      queueLength: this.downloadQueue.length,
      preferredRegion: this.preferredRegion
    };
  }

  updateConfiguration(newConfig: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.persistConfiguration();
  }

  // Persistence
  private async loadConfiguration(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('cdn_config');
      if (stored) {
        const savedConfig = JSON.parse(stored);
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.error('Failed to load CDN configuration:', error);
    }
  }

  private async persistConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem('cdn_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to persist CDN configuration:', error);
    }
  }

  private async loadAssetMetadata(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('cdn_asset_metadata');
      if (stored) {
        const metadataArray = JSON.parse(stored);
        this.assetMetadata = new Map(metadataArray);
      }
    } catch (error) {
      console.error('Failed to load asset metadata:', error);
    }
  }

  private async persistAssetMetadata(): Promise<void> {
    try {
      const metadataArray = Array.from(this.assetMetadata.entries());
      await AsyncStorage.setItem('cdn_asset_metadata', JSON.stringify(metadataArray));
    } catch (error) {
      console.error('Failed to persist asset metadata:', error);
    }
  }

  private async loadMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('cdn_metrics');
      if (stored) {
        const savedMetrics = JSON.parse(stored);
        this.metrics = { ...this.metrics, ...savedMetrics };
        // Restore region performance map
        if (savedMetrics.regionPerformanceArray) {
          this.regionPerformance = new Map(savedMetrics.regionPerformanceArray);
        }
      }
    } catch (error) {
      console.error('Failed to load CDN metrics:', error);
    }
  }

  async persistMetrics(): Promise<void> {
    try {
      const metricsWithMap = {
        ...this.metrics,
        regionPerformanceArray: Array.from(this.regionPerformance.entries())
      };
      await AsyncStorage.setItem('cdn_metrics', JSON.stringify(metricsWithMap));
    } catch (error) {
      console.error('Failed to persist CDN metrics:', error);
    }
  }

  private startQueueProcessor(): void {
    // Process queue every 100ms
    setInterval(() => {
      if (!this.isProcessingQueue && this.downloadQueue.length > 0) {
        this.processDownloadQueue();
      }
    }, 100);
  }
}

export const CDNIntegrationService = new CDNIntegrationServiceClass();
export default CDNIntegrationService;