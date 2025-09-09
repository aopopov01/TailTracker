import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { ImageOptimizationService } from '../../services/ImageOptimizationService';
import { usePerformanceMonitor } from '../../services/PerformanceMonitor';

interface OptimizedImageProps {
  source: { uri: string } | string;
  style?: ImageStyle | ViewStyle;
  placeholder?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  priority?: 'high' | 'normal' | 'low';
  lazy?: boolean;
  blur?: number;
  onLoad?: () => void;
  onError?: (error: any) => void;
  accessible?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder,
  width,
  height,
  quality = 0.85,
  format = 'jpeg',
  priority = 'normal',
  lazy = false,
  blur,
  onLoad,
  onError,
  accessible = true,
  accessibilityLabel,
  testID
}) => {
  const [optimizedUri, setOptimizedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  const performanceMonitor = usePerformanceMonitor();

  // Extract URI from source
  const sourceUri = useMemo(() => {
    return typeof source === 'string' ? source : source.uri;
  }, [source]);

  // Generate unique image ID for performance tracking
  const imageId = useMemo(() => {
    return `opt_img_${sourceUri.replace(/[^a-zA-Z0-9]/g, '_').slice(-50)}`;
  }, [sourceUri]);

  // Optimization options
  const optimizationOptions = useMemo(() => ({
    maxWidth: width,
    maxHeight: height,
    quality,
    format
  }), [width, height, quality, format]);

  // Handle image loading
  const loadOptimizedImage = useCallback(async () => {
    if (!sourceUri || !isVisible) return;

    try {
      setIsLoading(true);
      setHasError(false);

      const imageService = ImageOptimizationService.getInstance();
      const optimized = await imageService.optimizeImage(
        sourceUri,
        optimizationOptions
      );

      setOptimizedUri(optimized.uri);
      setIsLoading(false);
      onLoad?.();

    } catch (error) {
      console.error('Failed to optimize image:', error);
      setHasError(true);
      setIsLoading(false);
      setOptimizedUri(sourceUri); // Fallback to original
      onError?.(error);
    }
  }, [sourceUri, isVisible, optimizationOptions, onLoad, onError]);

  // Load image when visible
  useEffect(() => {
    if (isVisible) {
      loadOptimizedImage();
    }
  }, [isVisible, loadOptimizedImage]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (lazy && !isVisible) {
      // In a real implementation, you'd use an intersection observer
      // For now, we'll simulate visibility after a short delay
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [lazy, isVisible]);

  // Memoized styles
  const containerStyle = useMemo(() => [
    styles.container,
    style,
    width ? { width } : undefined,
    height ? { height } : undefined
  ].filter(Boolean), [style, width, height]);

  const imageStyle = useMemo(() => [
    styles.image,
    width ? { width } : undefined,
    height ? { height } : undefined
  ].filter(Boolean), [width, height]);  // Render placeholder
  if (isLoading || !optimizedUri) {
    return (
      <View style={containerStyle} testID={`${testID}-loading`}>
        {placeholder && (
          <Image
            source={{ uri: placeholder }}
            style={imageStyle}
            contentFit="cover"
            accessible={accessible}
            accessibilityLabel={`Loading ${accessibilityLabel || 'image'}`}
          />
        )}
      </View>
    );
  }

  // Render error state
  if (hasError && !optimizedUri) {
    return (
      <View style={[containerStyle, styles.errorContainer]} testID={`${testID}-error`}>
        {/* You could add an error icon here */}
      </View>
    );
  }

  // Render optimized image
  return (
    <View style={containerStyle} testID={testID}>
      <Image
        source={{ uri: optimizedUri }}
        style={imageStyle}
        contentFit="cover"
        placeholder={placeholder ? { uri: placeholder } : undefined}
        placeholderContentFit="cover"
        transition={200}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel}
        onLoad={() => {
          performanceMonitor.recordMetrics({
            componentRenderTime: Date.now() - Date.now(),
            memoryUsage: 0,
            timestamp: Date.now()
          });
          onLoad?.();
        }}
        onError={(error) => {
          setHasError(true);
          onError?.(error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(OptimizedImage);