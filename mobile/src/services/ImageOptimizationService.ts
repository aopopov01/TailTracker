import { Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { log } from '../utils/Logger';
import { CDNIntegrationService } from './CDNIntegrationService';
import { EnhancedCacheManager } from './EnhancedCacheManager';
import { PerformanceMonitor } from './PerformanceMonitor';

interface ImageMetadata {
  id: string;
  originalUrl: string;
  dimensions: { width: number; height: number };
  size: number;
  format: string;
  aspectRatio: number;
  dominantColors: string[];
  blurHash?: string;
  variants: ImageVariant[];
  lastOptimized: number;
}

interface ImageVariant {
  quality: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  url: string;
  localPath?: string;
  dimensions: { width: number; height: number };
  size: number;
  format: string;
  compressionRatio: number;
}

interface OptimizationConfig {
  enableWebP: boolean;
  enableAVIF: boolean;
  compressionQuality: Record<string, number>;
  maxDimensions: Record<string, { width: number; height: number }>;
  enableProgressive: boolean;
  enableLazyLoading: boolean;
  preloadDistance: number;
  batchSize: number;
  enableBlurHash: boolean;
  enableDominantColor: boolean;
}

interface LazyLoadingState {
  isIntersecting: boolean;
  distance: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  preloaded: boolean;
  loaded: boolean;
  error: boolean;
}

interface OptimizationJob {
  id: string;
  sourceUrl: string;
  targetVariants: string[];
  priority: number;
  onComplete?: (results: ImageVariant[]) => void;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

class ImageOptimizationServiceClass {
  private config: OptimizationConfig;
  private imageMetadata: Map<string, ImageMetadata> = new Map();
  private lazyLoadingStates: Map<string, LazyLoadingState> = new Map();
  private optimizationQueue: OptimizationJob[] = [];
  private isProcessingQueue = false;
  private intersectionObserver?: any;
  private screenDimensions = Dimensions.get('window');

  constructor() {
    this.config = {
      enableWebP: true,
      enableAVIF: false, // Not widely supported yet
      compressionQuality: {
        thumbnail: 60,
        small: 70,
        medium: 85,
        large: 90,
        original: 95
      },
      maxDimensions: {
        thumbnail: { width: 150, height: 150 },
        small: { width: 400, height: 400 },
        medium: { width: 800, height: 800 },
        large: { width: 1200, height: 1200 },
        original: { width: 2400, height: 2400 }
      },
      enableProgressive: true,
      enableLazyLoading: true,
      preloadDistance: 200,
      batchSize: 3,
      enableBlurHash: true,
      enableDominantColor: true
    };

    this.initialize();
  }

  private async initialize() {
    try {
      await this.loadConfiguration();
      await this.loadImageMetadata();
      this.setupDimensionsListener();
      this.startOptimizationProcessor();
      
      log.debug('Image Optimization Service initialized');
    } catch (error) {
      log.error('Failed to initialize Image Optimization Service:', error);
    }
  }

  // Image Analysis and Metadata Extraction
  async analyzeImage(imageUrl: string, localPath?: string): Promise<ImageMetadata> {
    const startTime = performance.now();
    
    try {
      const imageId = this.generateImageId(imageUrl);
      const existingMetadata = this.imageMetadata.get(imageId);
      
      if (existingMetadata && Date.now() - existingMetadata.lastOptimized < 24 * 60 * 60 * 1000) {
        return existingMetadata;
      }

      // Get image dimensions and basic info
      const dimensions = await this.getImageDimensions(localPath || imageUrl);
      const size = localPath ? await this.getFileSize(localPath) : 0;
      const format = this.extractFormat(imageUrl);
      const aspectRatio = dimensions.width / dimensions.height;

      // Extract additional metadata
      const dominantColors = this.config.enableDominantColor 
        ? await this.extractDominantColors(localPath || imageUrl)
        : [];
      
      const blurHash = this.config.enableBlurHash 
        ? await this.generateBlurHash(localPath || imageUrl)
        : undefined;

      const metadata: ImageMetadata = {
        id: imageId,
        originalUrl: imageUrl,
        dimensions,
        size,
        format,
        aspectRatio,
        dominantColors,
        blurHash,
        variants: [],
        lastOptimized: Date.now()
      };

      this.imageMetadata.set(imageId, metadata);
      await this.persistImageMetadata();

      PerformanceMonitor.recordMetric({
        name: 'image_analysis',
        value: performance.now() - startTime,
        timestamp: Date.now(),
        category: 'image',
        metadata: { imageId, format, width: dimensions.width, height: dimensions.height }
      });

      return metadata;

    } catch (error) {
      log.error(`Failed to analyze image ${imageUrl}:`, error);
      throw error;
    }
  }

  private async getImageDimensions(source: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (source.startsWith('http')) {
        Image.getSize(
          source,
          (width, height) => resolve({ width, height }),
          error => reject(error)
        );
      } else {
        // For local files, use ImageManipulator to get dimensions
        ImageManipulator.manipulateAsync(source, [], { format: ImageManipulator.SaveFormat.JPEG })
          .then(result => {
            // Extract dimensions from manipulation result
            // This is a simplified approach - you might need to use a different method
            resolve({ width: 800, height: 600 }); // Placeholder
          })
          .catch(reject);
      }
    });
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return (fileInfo.exists && 'size' in fileInfo) ? fileInfo.size : 0;
    } catch {
      return 0;
    }
  }

  private extractFormat(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || 'jpg';
  }

  private generateImageId(url: string): string {
    return btoa(url).replace(/[/+=]/g, '').substring(0, 16);
  }

  // Advanced Image Optimization
  async optimizeImage(
    imageUrl: string,
    targetVariants: ('thumbnail' | 'small' | 'medium' | 'large')[] = ['thumbnail', 'medium'],
    options: {
      priority?: number;
      onProgress?: (progress: number) => void;
      forceReoptimize?: boolean;
    } = {}
  ): Promise<ImageVariant[]> {
    const imageId = this.generateImageId(imageUrl);
    
    try {
      // Check if variants already exist and are up to date
      const metadata = await this.analyzeImage(imageUrl);
      
      if (!options.forceReoptimize && metadata.variants.length > 0) {
        const existingVariants = metadata.variants.filter(v => 
          targetVariants.includes(v.quality as any)
        );
        
        if (existingVariants.length === targetVariants.length) {
          return existingVariants;
        }
      }

      // Add to optimization queue
      return new Promise((resolve, reject) => {
        const job: OptimizationJob = {
          id: imageId,
          sourceUrl: imageUrl,
          targetVariants,
          priority: options.priority || 5,
          onComplete: resolve,
          onProgress: options.onProgress,
          onError: reject
        };

        this.addToOptimizationQueue(job);
      });

    } catch (error) {
      log.error(`Failed to optimize image ${imageUrl}:`, error);
      throw error;
    }
  }

  private addToOptimizationQueue(job: OptimizationJob) {
    // Remove existing job with same ID
    this.optimizationQueue = this.optimizationQueue.filter(j => j.id !== job.id);
    
    // Add new job and sort by priority
    this.optimizationQueue.push(job);
    this.optimizationQueue.sort((a, b) => b.priority - a.priority);

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processOptimizationQueue();
    }
  }

  private async processOptimizationQueue() {
    if (this.isProcessingQueue || this.optimizationQueue.length === 0) return;
    
    this.isProcessingQueue = true;

    try {
      while (this.optimizationQueue.length > 0) {
        // Process batch of optimizations
        const batch = this.optimizationQueue.splice(0, this.config.batchSize);
        
        await Promise.allSettled(
          batch.map(job => this.executeOptimization(job))
        );

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async executeOptimization(job: OptimizationJob): Promise<void> {
    const startTime = performance.now();
    
    try {
      const metadata = this.imageMetadata.get(job.id);
      if (!metadata) throw new Error('Image metadata not found');

      // Download original image if needed
      const localPath = await this.ensureImageLocal(job.sourceUrl);
      
      const variants: ImageVariant[] = [];
      const totalVariants = job.targetVariants.length;

      for (let i = 0; i < totalVariants; i++) {
        const quality = job.targetVariants[i];
        
        if (job.onProgress) {
          job.onProgress(i / totalVariants);
        }

        const variant = await this.createImageVariant(localPath, quality, metadata);
        variants.push(variant);
      }

      // Update metadata with new variants
      metadata.variants = [
        ...metadata.variants.filter(v => !job.targetVariants.includes(v.quality as any)),
        ...variants
      ];
      metadata.lastOptimized = Date.now();

      await this.persistImageMetadata();

      if (job.onProgress) {
        job.onProgress(1);
      }

      if (job.onComplete) {
        job.onComplete(variants);
      }

      PerformanceMonitor.recordMetric({
        name: 'image_optimization',
        value: performance.now() - startTime,
        timestamp: Date.now(),
        category: 'image',
        metadata: { 
          imageId: job.id,
          variants: job.targetVariants.length,
          originalSize: metadata.size
        }
      });

    } catch (error) {
      log.error(`Optimization failed for job ${job.id}:`, error);
      
      if (job.onError) {
        job.onError(error as Error);
      }
    }
  }

  private async ensureImageLocal(imageUrl: string): Promise<string> {
    // Check if we already have it cached
    const cacheKey = `original_image_${this.generateImageId(imageUrl)}`;
    const cached = await EnhancedCacheManager.get<{ localPath: string }>(cacheKey);
    
    if (cached && cached.localPath) {
      const fileInfo = await FileSystem.getInfoAsync(cached.localPath);
      if (fileInfo.exists) {
        return cached.localPath;
      }
    }

    // Download image
    const downloadResult = await CDNIntegrationService.downloadAsset(imageUrl, {
      priority: 'medium',
      useCache: true
    });

    if (!downloadResult.success || !downloadResult.localPath) {
      throw new Error('Failed to download image for optimization');
    }

    // Cache the local path
    await EnhancedCacheManager.set(
      cacheKey,
      { localPath: downloadResult.localPath },
      { ttl: 24 * 60 * 60 * 1000, priority: 'medium' }
    );

    return downloadResult.localPath;
  }

  private async createImageVariant(
    sourcePath: string,
    quality: string,
    metadata: ImageMetadata
  ): Promise<ImageVariant> {
    const targetDimensions = this.config.maxDimensions[quality];
    const targetQuality = this.config.compressionQuality[quality];
    
    try {
      // Calculate optimal dimensions while maintaining aspect ratio
      const optimalDimensions = this.calculateOptimalDimensions(
        metadata.dimensions,
        targetDimensions
      );

      // Perform image manipulation
      const manipulationActions: any[] = [];
      
      // Resize if needed
      if (optimalDimensions.width !== metadata.dimensions.width ||
          optimalDimensions.height !== metadata.dimensions.height) {
        manipulationActions.push({
          resize: optimalDimensions
        });
      }

      const format = this.config.enableWebP ? 'webp' : 'jpeg';
      const result = await ImageManipulator.manipulateAsync(
        sourcePath,
        manipulationActions,
        {
          compress: targetQuality / 100,
          format: format === 'webp' ? ImageManipulator.SaveFormat.WEBP : ImageManipulator.SaveFormat.JPEG
        }
      );

      // Get file size of optimized image
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      const optimizedSize = (fileInfo.exists && 'size' in fileInfo) ? fileInfo.size : 0;
      const compressionRatio = metadata.size > 0 ? optimizedSize / metadata.size : 1;

      // Upload to CDN if configured
      const cdnUrl = await this.uploadToCDN(result.uri, quality);

      const variant: ImageVariant = {
        quality: quality as any,
        url: cdnUrl || result.uri,
        localPath: result.uri,
        dimensions: optimalDimensions,
        size: optimizedSize,
        format,
        compressionRatio
      };

      return variant;

    } catch (error) {
      log.error(`Failed to create variant ${quality}:`, error);
      throw error;
    }
  }

  private calculateOptimalDimensions(
    originalDimensions: { width: number; height: number },
    maxDimensions: { width: number; height: number }
  ): { width: number; height: number } {
    const { width: originalWidth, height: originalHeight } = originalDimensions;
    const { width: maxWidth, height: maxHeight } = maxDimensions;

    // If image is already smaller, return original dimensions
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return originalDimensions;
    }

    // Calculate aspect ratio
    const aspectRatio = originalWidth / originalHeight;

    // Determine constraining dimension
    let targetWidth, targetHeight;
    
    if (maxWidth / maxHeight > aspectRatio) {
      // Height is constraining
      targetHeight = maxHeight;
      targetWidth = Math.round(maxHeight * aspectRatio);
    } else {
      // Width is constraining
      targetWidth = maxWidth;
      targetHeight = Math.round(maxWidth / aspectRatio);
    }

    return {
      width: targetWidth,
      height: targetHeight
    };
  }

  private async uploadToCDN(localPath: string, quality: string): Promise<string | null> {
    // This would integrate with your CDN service
    // For now, just return the local path
    return null;
  }

  // Lazy Loading Implementation
  setupLazyLoading(
    imageUrls: string[],
    containerRef: any,
    options: {
      threshold?: number;
      rootMargin?: string;
      preloadDistance?: number;
    } = {}
  ) {
    if (!this.config.enableLazyLoading) return;

    // Lazy loading threshold configuration
    const threshold = options.threshold || 0.1;
    // Lazy loading root margin configuration
    const rootMargin = options.rootMargin || `${this.config.preloadDistance}px`;

    // Initialize lazy loading states
    imageUrls.forEach(url => {
      const imageId = this.generateImageId(url);
      if (!this.lazyLoadingStates.has(imageId)) {
        this.lazyLoadingStates.set(imageId, {
          isIntersecting: false,
          distance: Infinity,
          priority: 'low',
          preloaded: false,
          loaded: false,
          error: false
        });
      }
    });

    // Setup intersection observer (conceptual - React Native doesn't have IntersectionObserver)
    // This would be implemented using scroll events and view measurements
    this.setupScrollBasedLazyLoading(imageUrls, containerRef, options);
  }

  private setupScrollBasedLazyLoading(
    imageUrls: string[],
    containerRef: any,
    options: any
  ) {
    // This would implement scroll-based lazy loading
    // For React Native, you'd typically use onScroll events and measure view positions
    log.debug('Setting up scroll-based lazy loading for', imageUrls.length, 'images');
  }

  async handleImageIntersection(
    imageUrl: string,
    isIntersecting: boolean,
    distance: number = 0
  ): Promise<void> {
    const imageId = this.generateImageId(imageUrl);
    const state = this.lazyLoadingStates.get(imageId);
    
    if (!state) return;

    state.isIntersecting = isIntersecting;
    state.distance = distance;

    // Determine priority based on distance
    if (distance < 100) {
      state.priority = 'critical';
    } else if (distance < 300) {
      state.priority = 'high';
    } else if (distance < 600) {
      state.priority = 'medium';
    } else {
      state.priority = 'low';
    }

    // Preload if within preload distance and not already preloaded
    if (distance <= this.config.preloadDistance && !state.preloaded) {
      await this.preloadImage(imageUrl, state.priority);
      state.preloaded = true;
    }

    // Load if intersecting and not already loaded
    if (isIntersecting && !state.loaded && !state.error) {
      await this.loadImage(imageUrl, state.priority);
      state.loaded = true;
    }
  }

  private async preloadImage(imageUrl: string, priority: string): Promise<void> {
    try {
      // Optimize thumbnail first for quick preview
      await this.optimizeImage(imageUrl, ['thumbnail'], {
        priority: priority === 'critical' ? 10 : 5
      });

      log.debug(`Preloaded thumbnail for ${imageUrl}`);

    } catch (error) {
      log.error(`Failed to preload image ${imageUrl}:`, error);
    }
  }

  private async loadImage(imageUrl: string, priority: string): Promise<void> {
    try {
      // Optimize appropriate variants based on screen size
      const variants = this.determineRequiredVariants();
      
      await this.optimizeImage(imageUrl, variants, {
        priority: priority === 'critical' ? 10 : (priority === 'high' ? 8 : 5)
      });

      log.debug(`Loaded image variants for ${imageUrl}:`, variants);

    } catch (error) {
      log.error(`Failed to load image ${imageUrl}:`, error);
      
      // Update error state
      const imageId = this.generateImageId(imageUrl);
      const state = this.lazyLoadingStates.get(imageId);
      if (state) {
        state.error = true;
      }
    }
  }

  private determineRequiredVariants(): ('thumbnail' | 'small' | 'medium' | 'large')[] {
    const { width, height } = this.screenDimensions;
    const screenArea = width * height;

    // Determine variants based on screen size and pixel density
    if (screenArea < 800 * 600) {
      return ['thumbnail', 'small'];
    } else if (screenArea < 1200 * 800) {
      return ['thumbnail', 'medium'];
    } else {
      return ['thumbnail', 'medium', 'large'];
    }
  }

  // Utility Methods
  private async extractDominantColors(imagePath: string): Promise<string[]> {
    // This would use a color extraction library
    // For now, return mock colors
    return ['#4A90E2', '#F5A623', '#7ED321'];
  }

  private async generateBlurHash(imagePath: string): Promise<string | undefined> {
    // This would generate a BlurHash for placeholder
    // For now, return a mock BlurHash
    return 'LKO2?V%2Tw=w]~RBVZRi};RPxuwH';
  }

  private setupDimensionsListener() {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      this.screenDimensions = window;
    });

    return subscription;
  }

  private startOptimizationProcessor() {
    // Process optimization queue every 500ms
    setInterval(() => {
      if (!this.isProcessingQueue && this.optimizationQueue.length > 0) {
        this.processOptimizationQueue();
      }
    }, 500);
  }

  // Public API Methods
  async getOptimizedImageUrl(
    originalUrl: string,
    quality: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'
  ): Promise<string> {
    const imageId = this.generateImageId(originalUrl);
    const metadata = this.imageMetadata.get(imageId);
    
    if (metadata) {
      const variant = metadata.variants.find(v => v.quality === quality);
      if (variant?.url) {
        return variant.url;
      }
    }

    // If optimized version not available, return CDN optimized URL
    return CDNIntegrationService.getOptimizedAssetUrl(originalUrl, { quality });
  }

  async preloadImages(urls: string[], priority: 'high' | 'medium' | 'low' = 'low'): Promise<void> {
    const promises = urls.map(url => 
      this.optimizeImage(url, ['thumbnail'], { 
        priority: priority === 'high' ? 8 : (priority === 'medium' ? 5 : 2)
      }).catch(error => {
        log.warn(`Failed to preload ${url}:`, error);
      })
    );

    await Promise.allSettled(promises);
  }

  getImageMetadata(imageUrl: string): ImageMetadata | null {
    const imageId = this.generateImageId(imageUrl);
    return this.imageMetadata.get(imageId) || null;
  }

  getLazyLoadingState(imageUrl: string): LazyLoadingState | null {
    const imageId = this.generateImageId(imageUrl);
    return this.lazyLoadingStates.get(imageId) || null;
  }

  updateConfiguration(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.persistConfiguration();
  }

  getOptimizationStats() {
    const totalImages = this.imageMetadata.size;
    const totalVariants = Array.from(this.imageMetadata.values())
      .reduce((sum, metadata) => sum + metadata.variants.length, 0);
    
    const totalOriginalSize = Array.from(this.imageMetadata.values())
      .reduce((sum, metadata) => sum + metadata.size, 0);
    
    const totalOptimizedSize = Array.from(this.imageMetadata.values())
      .reduce((sum, metadata) => 
        sum + metadata.variants.reduce((variantSum, variant) => variantSum + variant.size, 0), 0);

    const averageCompressionRatio = totalOriginalSize > 0 ? totalOptimizedSize / totalOriginalSize : 1;

    return {
      totalImages,
      totalVariants,
      totalOriginalSize,
      totalOptimizedSize,
      spaceSavings: totalOriginalSize - totalOptimizedSize,
      averageCompressionRatio,
      queueLength: this.optimizationQueue.length,
      lazyLoadingStatesCount: this.lazyLoadingStates.size
    };
  }

  // Cache Management
  async clearOptimizedImages(): Promise<void> {
    try {
      // Clear optimized image files
      const cacheDir = `${FileSystem.documentDirectory}optimized_images/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(cacheDir);
      }

      // Clear metadata
      this.imageMetadata.clear();
      this.lazyLoadingStates.clear();

      // Clear persisted data
      await AsyncStorage.multiRemove([
        'image_optimization_metadata',
        'image_optimization_config'
      ]);

      log.debug('Optimized images cache cleared');

    } catch (error) {
      log.error('Failed to clear optimized images cache:', error);
      throw error;
    }
  }

  // Persistence Methods
  private async loadConfiguration(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('image_optimization_config');
      if (stored) {
        const savedConfig = JSON.parse(stored);
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      log.error('Failed to load image optimization configuration:', error);
    }
  }

  private async persistConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem('image_optimization_config', JSON.stringify(this.config));
    } catch (error) {
      log.error('Failed to persist image optimization configuration:', error);
    }
  }

  private async loadImageMetadata(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('image_optimization_metadata');
      if (stored) {
        const metadataArray = JSON.parse(stored);
        this.imageMetadata = new Map(metadataArray);
      }
    } catch (error) {
      log.error('Failed to load image optimization metadata:', error);
    }
  }

  private async persistImageMetadata(): Promise<void> {
    try {
      const metadataArray = Array.from(this.imageMetadata.entries());
      await AsyncStorage.setItem('image_optimization_metadata', JSON.stringify(metadataArray));
    } catch (error) {
      log.error('Failed to persist image optimization metadata:', error);
    }
  }
}

export const ImageOptimizationService = new ImageOptimizationServiceClass();
export default ImageOptimizationService;