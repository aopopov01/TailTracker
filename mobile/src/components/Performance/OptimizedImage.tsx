import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  InteractionManager,
  Image as RNImage,
  Platform,
  PixelRatio,
} from 'react-native';
import { Image } from 'expo-image';
import { useMemoryOptimization } from '../../utils/AdvancedMemoryManager';
import { usePerformanceOptimizer } from '../../utils/PerformanceOptimizer';

/**
 * Industry-Leading Image Optimization Component
 * Target: <300ms load time, memory-efficient, progressive loading
 */

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';
  placeholder?: string;
  priority?: 'low' | 'normal' | 'high';
  enableProgressiveLoading?: boolean;
  enableMemoryOptimization?: boolean;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onProgress?: (progress: { loaded: number; total: number }) => void;
  quality?: number;
  blurRadius?: number;
  tintColor?: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  preload?: boolean;
}

interface ImageLoadState {
  isLoading: boolean;
  hasLoaded: boolean;
  hasError: boolean;
  progress: number;
  loadStartTime: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  placeholder,
  priority = 'normal',
  enableProgressiveLoading = true,
  enableMemoryOptimization = true,
  onLoad,
  onError,
  onLoadStart,
  onProgress,
  quality,
  blurRadius,
  tintColor,
  width,
  height,
  lazy = false,
  preload = false,
}) => {
  const [loadState, setLoadState] = useState<ImageLoadState>({
    isLoading: false,
    hasLoaded: false,
    hasError: false,
    progress: 0,
    loadStartTime: 0,
  });

  const [inView, setInView] = useState(!lazy);
  const [optimizedSource, setOptimizedSource] = useState(source);
  
  const imageRef = useRef<any>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const viewRef = useRef<View>(null);
  
  const { memoryStats, cacheImage, getCachedImage } = useMemoryOptimization();
  const { imageQuality, shouldEnableBlur } = usePerformanceOptimizer();

  /**
   * Optimize image source based on device capabilities
   */
  const optimizeImageSource = useCallback((originalSource: { uri: string } | number) => {
    if (typeof originalSource === 'number') return originalSource;

    const { uri } = originalSource;
    const devicePixelRatio = PixelRatio.get();
    const screenData = Dimensions.get('window');

    // Calculate optimal dimensions
    const targetWidth = width || (screenData.width / 2);
    const targetHeight = height || (screenData.width / 2);
    
    // Adjust for device pixel ratio but cap at 2x for performance
    const pixelRatio = Math.min(devicePixelRatio, 2);
    const optimalWidth = Math.round(targetWidth * pixelRatio);
    const optimalHeight = Math.round(targetHeight * pixelRatio);

    // Use quality setting from performance optimizer
    const targetQuality = quality || imageQuality;

    // Generate optimized URL (assuming a CDN service)
    let optimizedUri = uri;
    
    // Add query parameters for image optimization
    const separator = uri.includes('?') ? '&' : '?';
    optimizedUri += `${separator}w=${optimalWidth}&h=${optimalHeight}&q=${Math.round(targetQuality * 100)}&f=webp`;

    // Add format hints for better compression
    if (Platform.OS === 'ios' && targetQuality < 0.8) {
      optimizedUri += '&f=heic';
    }

    return { uri: optimizedUri };
  }, [width, height, quality, imageQuality]);

  /**
   * Setup lazy loading with intersection observer (web) or viewport detection (native)
   */
  useEffect(() => {
    if (!lazy) return;

    if (Platform.OS === 'web') {
      // Use Intersection Observer for web
      if ('IntersectionObserver' in window) {
        intersectionObserverRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setInView(true);
                intersectionObserverRef.current?.disconnect();
              }
            });
          },
          { 
            rootMargin: '50px',
            threshold: 0.1 
          }
        );

        if (viewRef.current) {
          intersectionObserverRef.current.observe(viewRef.current as any);
        }
      } else {
        // Fallback for older browsers
        setInView(true);
      }
    } else {
      // Native lazy loading using InteractionManager
      const task = InteractionManager.runAfterInteractions(() => {
        setInView(true);
      });

      return () => task.cancel();
    }

    return () => {
      intersectionObserverRef.current?.disconnect();
    };
  }, [lazy]);

  /**
   * Optimize source when component mounts or props change
   */
  useEffect(() => {
    if (typeof source === 'number') {
      setOptimizedSource(source);
      return;
    }

    const optimized = optimizeImageSource(source);
    setOptimizedSource(optimized);

    // Preload if requested and high priority
    if (preload && priority === 'high') {
      RNImage.prefetch(optimized.uri);
    }
  }, [source, optimizeImageSource, preload, priority]);

  /**
   * Handle image load start
   */
  const handleLoadStart = useCallback(() => {
    setLoadState(prev => ({
      ...prev,
      isLoading: true,
      hasLoaded: false,
      hasError: false,
      loadStartTime: Date.now(),
      progress: 0,
    }));

    onLoadStart?.();
  }, [onLoadStart]);

  /**
   * Handle image load progress
   */
  const handleProgress = useCallback((event: { nativeEvent: { loaded: number; total: number } }) => {
    const { loaded, total } = event.nativeEvent;
    const progress = total > 0 ? loaded / total : 0;
    
    setLoadState(prev => ({
      ...prev,
      progress,
    }));

    onProgress?.({ loaded, total });
  }, [onProgress]);

  /**
   * Handle successful image load
   */
  const handleLoad = useCallback(() => {
    const loadTime = Date.now() - loadState.loadStartTime;
    
    setLoadState(prev => ({
      ...prev,
      isLoading: false,
      hasLoaded: true,
      progress: 1,
    }));

    // Cache image if memory optimization is enabled
    if (enableMemoryOptimization && typeof optimizedSource !== 'number') {
      const estimatedSize = (width || 200) * (height || 200) * 4; // RGBA bytes
      cacheImage(optimizedSource.uri, optimizedSource, estimatedSize);
    }

    // Track performance metrics
    if (loadTime < 1000) { // Only track reasonable load times
      performance.mark('image-load-complete');
      performance.measure('image-load-time', 'image-load-start', 'image-load-complete');
    }

    onLoad?.();
  }, [loadState.loadStartTime, enableMemoryOptimization, optimizedSource, width, height, cacheImage, onLoad]);

  /**
   * Handle image load error
   */
  const handleError = useCallback((error: any) => {
    setLoadState(prev => ({
      ...prev,
      isLoading: false,
      hasError: true,
    }));

    console.warn('Image load error:', error);
    onError?.(error);
  }, [onError]);

  /**
   * Check if image is cached
   */
  const getCachedImageData = useCallback(() => {
    if (!enableMemoryOptimization || typeof optimizedSource === 'number') {
      return null;
    }

    return getCachedImage(optimizedSource.uri);
  }, [enableMemoryOptimization, optimizedSource, getCachedImage]);

  // Don't render if lazy loading and not in view
  if (lazy && !inView) {
    return (
      <View ref={viewRef} style={[styles.container, style]}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  // Prepare image props with optimizations
  const imageProps = {
    source: optimizedSource,
    style: [styles.image, style],
    resizeMode,
    onLoadStart: handleLoadStart,
    onLoad: handleLoad,
    onError: handleError,
    onProgress: handleProgress,
    priority,
    placeholder: placeholder ? { uri: placeholder } : undefined,
    blurRadius: blurRadius && shouldEnableBlur ? blurRadius : undefined,
    tintColor,
  };

  // Use cached data if available
  const cachedData = getCachedImageData();
  if (cachedData && !loadState.isLoading) {
    imageProps.source = cachedData;
  }

  return (
    <View ref={viewRef} style={[styles.container, style]}>
      {/* Main optimized image */}
      <Image
        {...imageProps}
        cachePolicy={enableMemoryOptimization ? 'memory-disk' : 'memory'}
        transition={200}
        contentFit={resizeMode}
      />

      {/* Progressive loading overlay */}
      {enableProgressiveLoading && loadState.isLoading && (
        <View style={styles.progressOverlay}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${loadState.progress * 100}%` }
            ]} 
          />
        </View>
      )}

      {/* Error state */}
      {loadState.hasError && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorIcon} />
        </View>
      )}
    </View>
  );
};

/**
 * High-performance image gallery component with virtualization
 */
interface OptimizedImageGalleryProps {
  images: { uri: string; id: string }[];
  numColumns?: number;
  itemSize?: number;
  onImagePress?: (image: { uri: string; id: string }) => void;
  style?: any;
}

export const OptimizedImageGallery: React.FC<OptimizedImageGalleryProps> = ({
  images,
  numColumns = 2,
  itemSize = 150,
  onImagePress,
  style,
}) => {
  const { maxConcurrentImages } = usePerformanceOptimizer();
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: maxConcurrentImages });
  const [scrollOffset, setScrollOffset] = useState(0);

  const screenHeight = Dimensions.get('window').height;
  const itemsPerScreen = Math.ceil(screenHeight / itemSize) * numColumns;
  const bufferSize = Math.max(itemsPerScreen, maxConcurrentImages);

  /**
   * Update visible range based on scroll position
   */
  const updateVisibleRange = useCallback((offset: number) => {
    const startIndex = Math.max(0, Math.floor((offset / itemSize) * numColumns) - bufferSize);
    const endIndex = Math.min(images.length, startIndex + bufferSize * 2);
    
    setVisibleRange({ start: startIndex, end: endIndex });
    setScrollOffset(offset);
  }, [itemSize, numColumns, bufferSize, images.length]);

  // Render only visible images
  const visibleImages = images.slice(visibleRange.start, visibleRange.end);

  return (
    <View style={[styles.gallery, style]}>
      {visibleImages.map((image, index) => (
        <OptimizedImage
          key={image.id}
          source={{ uri: image.uri }}
          style={[
            styles.galleryImage,
            {
              width: itemSize,
              height: itemSize,
            },
          ]}
          width={itemSize}
          height={itemSize}
          lazy={index > bufferSize / 2}
          priority={index < 4 ? 'high' : 'normal'}
          enableMemoryOptimization={true}
          enableProgressiveLoading={true}
          onPress={() => onImagePress?.(image)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4BA8B5',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#ccc',
    borderRadius: 15,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryImage: {
    marginBottom: 10,
    borderRadius: 8,
  },
});

export default OptimizedImage;