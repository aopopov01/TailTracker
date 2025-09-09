import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  FlatList,
  FlatListProps,
  ViewabilityConfig,
  ViewToken,
  Dimensions,
  PixelRatio,
} from 'react-native';

// PERFORMANCE OPTIMIZATION: Enhanced FlatList with advanced optimizations
interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'getItemLayout' | 'keyExtractor'> {
  // Required optimization props
  keyExtractor: (item: T, index: number) => string;
  estimatedItemSize?: number;
  
  // Performance optimization props
  enableVirtualization?: boolean;
  windowSize?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  
  // Advanced features
  onViewabilityChanged?: (viewableItems: ViewToken[], changed: ViewToken[]) => void;
  enableViewabilityCallbacks?: boolean;
  
  // Custom optimization strategies
  useGetItemLayout?: boolean;
  dynamicHeightOptimization?: boolean;
  
  // Memory management
  removeClippedSubviews?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const pixelRatio = PixelRatio.get();

// PERFORMANCE OPTIMIZATION: Memoized viewability configuration
const viewabilityConfig: ViewabilityConfig = {
  waitForInteraction: true,
  viewAreaCoveragePercentThreshold: 50,
  minimumViewTime: 250,
};

function OptimizedFlatList<T>({
  keyExtractor,
  estimatedItemSize = 80,
  enableVirtualization = true,
  windowSize = 10,
  initialNumToRender = 10,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
  onViewabilityChanged,
  enableViewabilityCallbacks = false,
  useGetItemLayout = false,
  dynamicHeightOptimization = false,
  removeClippedSubviews = true,
  data,
  renderItem,
  ...props
}: OptimizedFlatListProps<T>) {
  
  // PERFORMANCE OPTIMIZATION: Track visible items for advanced optimizations
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [averageItemHeight, setAverageItemHeight] = useState(estimatedItemSize);
  
  // PERFORMANCE OPTIMIZATION: Memoized getItemLayout for consistent item sizes
  const getItemLayout = useMemo(() => {
    if (!useGetItemLayout) return undefined;
    
    return (data: ArrayLike<T> | null | undefined, index: number) => ({
      length: averageItemHeight,
      offset: averageItemHeight * index,
      index,
    });
  }, [useGetItemLayout, averageItemHeight]);

  // PERFORMANCE OPTIMIZATION: Memoized viewability change handler
  const handleViewabilityChanged = useCallback((info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
    if (!enableViewabilityCallbacks) return;
    
    // Update visible items tracking
    const newVisibleItems = new Set(
      info.viewableItems.map(item => keyExtractor(item.item, item.index || 0))
    );
    setVisibleItems(newVisibleItems);
    
    // Call custom handler
    onViewabilityChanged?.(info.viewableItems, info.changed);
    
    // PERFORMANCE OPTIMIZATION: Update average item height for better layout estimation
    if (dynamicHeightOptimization && info.viewableItems.length > 0) {
      const heights = info.viewableItems
        .filter(item => item.item && typeof item.index === 'number')
        .map(item => estimatedItemSize); // In real implementation, measure actual heights
      
      if (heights.length > 0) {
        const avgHeight = heights.reduce((sum, height) => sum + height, 0) / heights.length;
        setAverageItemHeight(prev => (prev + avgHeight) / 2); // Smooth transition
      }
    }
  }, [
    enableViewabilityCallbacks,
    onViewabilityChanged,
    keyExtractor,
    dynamicHeightOptimization,
    estimatedItemSize
  ]);

  // PERFORMANCE OPTIMIZATION: Memoized render item with performance tracking
  const optimizedRenderItem = useCallback<NonNullable<FlatListProps<T>['renderItem']>>((itemInfo) => {
    const itemKey = keyExtractor(itemInfo.item, itemInfo.index);
    const isVisible = visibleItems.has(itemKey);
    
    // Add performance metadata to item info
    const enhancedItemInfo = {
      ...itemInfo,
      isVisible,
      screenWidth,
      pixelRatio,
    };
    
    return renderItem?.(enhancedItemInfo) ?? null;
  }, [renderItem, keyExtractor, visibleItems]);

  // PERFORMANCE OPTIMIZATION: Calculate optimal performance props based on device
  const optimizedProps = useMemo(() => {
    const deviceOptimizations = {
      // Adjust based on device performance
      windowSize: pixelRatio <= 2 ? windowSize : Math.max(windowSize - 2, 5),
      maxToRenderPerBatch: pixelRatio <= 2 ? maxToRenderPerBatch : Math.max(maxToRenderPerBatch - 2, 5),
      initialNumToRender: pixelRatio <= 2 ? initialNumToRender : Math.max(initialNumToRender - 2, 5),
      updateCellsBatchingPeriod: pixelRatio <= 2 ? updateCellsBatchingPeriod : updateCellsBatchingPeriod + 20,
    };

    return {
      // Core performance optimizations
      removeClippedSubviews,
      disableVirtualization: !enableVirtualization,
      
      // Rendering optimizations
      windowSize: deviceOptimizations.windowSize,
      initialNumToRender: deviceOptimizations.initialNumToRender,
      maxToRenderPerBatch: deviceOptimizations.maxToRenderPerBatch,
      updateCellsBatchingPeriod: deviceOptimizations.updateCellsBatchingPeriod,
      
      // Layout optimizations
      getItemLayout,
      
      // Interaction optimizations
      keyboardShouldPersistTaps: 'handled' as const,
      scrollEventThrottle: 16,
      
      // ViewabilityConfig optimizations
      ...(enableViewabilityCallbacks && {
        viewabilityConfig,
        onViewableItemsChanged: handleViewabilityChanged,
      }),
    };
  }, [
    removeClippedSubviews,
    enableVirtualization,
    windowSize,
    initialNumToRender,
    maxToRenderPerBatch,
    updateCellsBatchingPeriod,
    getItemLayout,
    enableViewabilityCallbacks,
    handleViewabilityChanged,
  ]);

  // PERFORMANCE OPTIMIZATION: Monitor performance metrics
  useEffect(() => {
    const performanceLogger = {
      listSize: data?.length || 0,
      visibleItemsCount: visibleItems.size,
      averageItemHeight,
      timestamp: Date.now(),
    };
    
    // Log performance metrics for debugging
    if (__DEV__) {
      console.log('[OptimizedFlatList] Performance metrics:', performanceLogger);
    }
  }, [data?.length, visibleItems.size, averageItemHeight]);

  return (
    <FlatList<T>
      data={data}
      renderItem={optimizedRenderItem}
      keyExtractor={keyExtractor}
      {...optimizedProps}
      {...props}
    />
  );
}

// PERFORMANCE OPTIMIZATION: Memoize the component to prevent unnecessary re-renders
export default React.memo(OptimizedFlatList) as <T>(props: OptimizedFlatListProps<T>) => React.ReactElement;

// PERFORMANCE OPTIMIZATION: Export hook for FlatList performance monitoring
export const useFlatListPerformance = (listId: string) => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    scrollPerformance: 0,
    memoryUsage: 0,
  });

  const trackRenderTime = useCallback((startTime: number) => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
    }));
    
    if (__DEV__) {
      console.log(`[FlatList ${listId}] Render time: ${renderTime.toFixed(2)}ms`);
    }
  }, [listId]);

  const trackScrollPerformance = useCallback((scrollEventTime: number) => {
    setMetrics(prev => ({
      ...prev,
      scrollPerformance: scrollEventTime,
    }));
  }, []);

  return {
    metrics,
    trackRenderTime,
    trackScrollPerformance,
  };
};