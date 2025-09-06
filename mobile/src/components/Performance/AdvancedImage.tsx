import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

interface AdvancedImageProps {
  source: ImageSource | string;
  style?: any;
  placeholder?: ImageSource | string;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  transition?: number;
  onLoad?: () => void;
  onError?: (error: any) => void;
  priority?: 'low' | 'normal' | 'high';
  recyclingKey?: string;
  blurhash?: string;
  alt?: string;
  progressive?: boolean;
  fadeDuration?: number;
}

// Advanced image memory pool for optimal performance
class ImageMemoryPool {
  private static instance: ImageMemoryPool;
  private imageCache = new Map<string, { data: string; lastUsed: number; priority: number }>();
  private maxCacheSize = 50; // MB
  private currentCacheSize = 0;
  private compressionQuality = 0.8;

  static getInstance(): ImageMemoryPool {
    if (!ImageMemoryPool.instance) {
      ImageMemoryPool.instance = new ImageMemoryPool();
    }
    return ImageMemoryPool.instance;
  }

  async preloadImage(uri: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<void> {
    if (this.imageCache.has(uri)) {
      // Update last used timestamp
      const cached = this.imageCache.get(uri)!;
      cached.lastUsed = Date.now();
      return;
    }

    try {
      const priorityScore = priority === 'high' ? 3 : priority === 'normal' ? 2 : 1;
      
      // Simulate image preloading and caching
      this.imageCache.set(uri, {
        data: uri,
        lastUsed: Date.now(),
        priority: priorityScore,
      });

      this.currentCacheSize += 0.5; // Estimate cache size
      this.cleanupIfNeeded();
    } catch (error) {
      console.warn('Failed to preload image:', error);
    }
  }

  private cleanupIfNeeded(): void {
    if (this.currentCacheSize > this.maxCacheSize) {
      // Remove least recently used images with lowest priority
      const sortedEntries = Array.from(this.imageCache.entries())
        .sort((a, b) => {
          if (a[1].priority !== b[1].priority) {
            return a[1].priority - b[1].priority;
          }
          return a[1].lastUsed - b[1].lastUsed;
        });

      // Remove bottom 25% of entries
      const toRemove = Math.ceil(sortedEntries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        this.imageCache.delete(sortedEntries[i][0]);
        this.currentCacheSize -= 0.5;
      }
    }
  }

  clearCache(): void {
    this.imageCache.clear();
    this.currentCacheSize = 0;
  }

  getCacheInfo(): { size: number; count: number } {
    return {
      size: this.currentCacheSize,
      count: this.imageCache.size,
    };
  }
}

export const AdvancedImage = memo<AdvancedImageProps>(({
  source,
  style,
  placeholder,
  contentFit = 'cover',
  transition = 300,
  onLoad,
  onError,
  priority = 'normal',
  recyclingKey,
  blurhash,
  alt,
  progressive = true,
  fadeDuration = 300,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const imagePool = useRef(ImageMemoryPool.getInstance());
  const mountedRef = useRef(true);

  // Preload image based on priority
  useEffect(() => {
    const uri = typeof source === 'string' ? source : source?.uri;
    if (uri && priority === 'high') {
      imagePool.current.preloadImage(uri, priority);
    }
  }, [source, priority]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleLoad = useCallback(() => {
    if (!mountedRef.current) return;
    
    setIsLoaded(true);
    opacity.value = withTiming(1, { duration: fadeDuration });
    scale.value = withTiming(1, { duration: fadeDuration });
    
    runOnJS(() => {
      onLoad?.();
    })();
  }, [opacity, scale, fadeDuration, onLoad]);

  const handleError = useCallback((error: any) => {
    if (!mountedRef.current) return;
    
    setHasError(true);
    console.warn('Image load error:', error);
    onError?.(error);
  }, [onError]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }), []);

  const imageSource = typeof source === 'string' ? { uri: source } : source;

  return (
    <View style={[styles.container, style]}>
      {/* Placeholder */}
      {!isLoaded && !hasError && placeholder && (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Image
            source={typeof placeholder === 'string' ? { uri: placeholder } : placeholder}
            style={StyleSheet.absoluteFill}
            contentFit={contentFit}
          />
        </View>
      )}

      {/* Blurhash placeholder */}
      {!isLoaded && !hasError && blurhash && !placeholder && (
        <View style={[StyleSheet.absoluteFill, styles.blurhash]}>
          <Image
            source={{ blurhash }}
            style={StyleSheet.absoluteFill}
            contentFit={contentFit}
          />
        </View>
      )}

      {/* Main image */}
      {!hasError && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <Image
            source={imageSource}
            style={StyleSheet.absoluteFill}
            contentFit={contentFit}
            onLoad={handleLoad}
            onError={handleError}
            recyclingKey={recyclingKey}
            priority={priority}
            alt={alt}
            transition={transition}
            cachePolicy="memory-disk"
            allowDownscaling
            autoplay={false} // Disable autoplay for GIFs to save memory
            contentPosition="center"
            decodeFormat="rgb565" // Use less memory on Android
            {...(progressive && Platform.OS === 'ios' && { progressive: true })}
          />
        </Animated.View>
      )}

      {/* Error state */}
      {hasError && (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
          <View style={styles.errorContent}>
            <View style={styles.errorIcon} />
          </View>
        </View>
      )}
    </View>
  );
});

AdvancedImage.displayName = 'AdvancedImage';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#F0F0F0',
  },
  blurhash: {
    backgroundColor: '#F0F0F0',
  },
  errorContainer: {
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#E3E3E3',
    borderRadius: 4,
  },
});

export { ImageMemoryPool };