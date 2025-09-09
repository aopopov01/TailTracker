import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: any;
  placeholder?: string;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'memory' | 'disk' | 'none';
  resize?: 'cover' | 'contain' | 'stretch' | 'center';
  blurhash?: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
  enableMemoryCache?: boolean;
  enableDiskCache?: boolean;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface CacheEntry {
  uri: string;
  localPath: string;
  timestamp: number;
  size: number;
}

// PERFORMANCE OPTIMIZATION: Advanced image cache management
class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private currentCacheSize = 0;
  private cacheDirectory = `${FileSystem.cacheDirectory}images/`;

  public static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  async initialize() {
    try {
      await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
      await this.loadCacheIndex();
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  private async loadCacheIndex() {
    try {
      const indexPath = `${this.cacheDirectory}index.json`;
      const indexExists = await FileSystem.getInfoAsync(indexPath);
      
      if (indexExists.exists) {
        const indexData = await FileSystem.readAsStringAsync(indexPath);
        const cacheIndex = JSON.parse(indexData);
        
        // Validate cache entries and calculate size
        for (const [key, entry] of Object.entries(cacheIndex as Record<string, CacheEntry>)) {
          const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
          if (fileInfo.exists) {
            this.cache.set(key, entry);
            this.currentCacheSize += entry.size;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load cache index:', error);
    }
  }

  private async saveCacheIndex() {
    try {
      const indexPath = `${this.cacheDirectory}index.json`;
      const cacheIndex = Object.fromEntries(this.cache);
      await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(cacheIndex));
    } catch (error) {
      console.error('Failed to save cache index:', error);
    }
  }

  async getCachedImage(uri: string): Promise<string | null> {
    const cacheKey = this.generateCacheKey(uri);
    const entry = this.cache.get(cacheKey);
    
    if (entry) {
      const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
      if (fileInfo.exists) {
        // Update access time
        entry.timestamp = Date.now();
        return entry.localPath;
      } else {
        // Clean up invalid entry
        this.cache.delete(cacheKey);
      }
    }
    
    return null;
  }

  async cacheImage(uri: string, localPath: string, size: number): Promise<void> {
    const cacheKey = this.generateCacheKey(uri);
    
    // Check if we need to clean cache
    if (this.currentCacheSize + size > this.maxCacheSize) {
      await this.cleanCache(size);
    }
    
    const entry: CacheEntry = {
      uri,
      localPath,
      timestamp: Date.now(),
      size,
    };
    
    this.cache.set(cacheKey, entry);
    this.currentCacheSize += size;
    await this.saveCacheIndex();
  }

  private async cleanCache(requiredSpace: number) {
    // Sort by timestamp (LRU)
    const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    let freedSpace = 0;
    for (const [key, entry] of entries) {
      try {
        await FileSystem.deleteAsync(entry.localPath);
        this.cache.delete(key);
        this.currentCacheSize -= entry.size;
        freedSpace += entry.size;
        
        if (freedSpace >= requiredSpace) {
          break;
        }
      } catch (error) {
        console.error('Failed to delete cached file:', error);
      }
    }
  }

  private generateCacheKey(uri: string): string {
    return uri.replace(/[^a-zA-Z0-9]/g, '_');
  }
}

const cacheManager = ImageCacheManager.getInstance();

// PERFORMANCE OPTIMIZATION: Optimized image component with advanced caching and lazy loading
const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(({
  source,
  style,
  placeholder,
  priority = 'normal',
  cachePolicy = 'disk',
  resize = 'cover',
  blurhash,
  onLoad,
  onError,
  enableMemoryCache = true,
  enableDiskCache = true,
  quality = 0.8,
  maxWidth,
  maxHeight,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState(source);

  // PERFORMANCE OPTIMIZATION: Calculate optimal image dimensions
  const optimizedDimensions = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    let targetWidth = maxWidth || screenWidth;
    let targetHeight = maxHeight || screenHeight;
    
    // Apply quality-based scaling for better performance
    if (quality < 1) {
      targetWidth *= quality;
      targetHeight *= quality;
    }
    
    return {
      width: Math.round(targetWidth),
      height: Math.round(targetHeight),
    };
  }, [maxWidth, maxHeight, quality]);

  // PERFORMANCE OPTIMIZATION: Initialize cache manager
  useEffect(() => {
    cacheManager.initialize();
  }, []);

  // PERFORMANCE OPTIMIZATION: Handle image caching and optimization
  const processImage = useCallback(async () => {
    if (typeof source === 'number') {
      // Local image asset - no caching needed
      setImageSource(source);
      setIsLoading(false);
      return;
    }

    if (!source.uri) {
      setError(new Error('Invalid image source'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      if (enableDiskCache && cachePolicy !== 'none') {
        const cached = await cacheManager.getCachedImage(source.uri);
        if (cached) {
          setCachedUri(cached);
          setImageSource({ uri: cached });
          setIsLoading(false);
          onLoad?.();
          return;
        }
      }

      // Download and optionally cache the image
      if (enableDiskCache && cachePolicy === 'disk') {
        const cacheKey = source.uri.replace(/[^a-zA-Z0-9]/g, '_');
        const localPath = `${FileSystem.cacheDirectory}images/${cacheKey}.jpg`;

        const downloadResult = await FileSystem.downloadAsync(source.uri, localPath);
        
        if (downloadResult.status === 200) {
          const fileInfo = await FileSystem.getInfoAsync(localPath);
          if (fileInfo.exists && fileInfo.size) {
            await cacheManager.cacheImage(source.uri, localPath, fileInfo.size);
            setCachedUri(localPath);
            setImageSource({ uri: localPath });
          }
        }
      } else {
        // Use original source if not caching
        setImageSource(source);
      }
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err);
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  }, [source, enableDiskCache, cachePolicy, onLoad, onError]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((err: any) => {
    setIsLoading(false);
    setError(err);
    onError?.(err);
  }, [onError]);

  // PERFORMANCE OPTIMIZATION: Memoized image props
  const imageProps = useMemo(() => ({
    source: imageSource,
    style: [styles.image, style],
    contentFit: resize as any,
    transition: 300,
    placeholder: placeholder || blurhash,
    onLoad: handleLoad,
    onError: handleError,
    priority: priority,
    cachePolicy: enableMemoryCache ? 'memory-disk' as const : 'disk' as const,
    ...optimizedDimensions,
  }), [
    imageSource,
    style,
    resize,
    placeholder,
    blurhash,
    handleLoad,
    handleError,
    priority,
    enableMemoryCache,
    optimizedDimensions,
  ]);

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          {/* Add error placeholder here */}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image {...imageProps} />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});

export default OptimizedImage;

// PERFORMANCE OPTIMIZATION: Export cache management utilities
export const ImageCacheUtils = {
  clearCache: async () => {
    const cacheManager = ImageCacheManager.getInstance();
    // Implementation to clear cache
  },
  
  getCacheSize: async () => {
    // Implementation to get cache size
    return 0;
  },
  
  preloadImages: async (urls: string[]) => {
    // Implementation to preload images
    const promises = urls.map(url => {
      // Preload implementation
      return Promise.resolve();
    });
    
    return Promise.all(promises);
  },
};