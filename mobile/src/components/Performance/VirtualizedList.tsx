import React, { 
  useMemo, 
  useCallback, 
  useState, 
  useRef,
  memo 
} from 'react';
import {
  FlatList,
  VirtualizedList as RNVirtualizedList,
  Dimensions,
  View,
  StyleSheet,
  InteractionManager,
  Platform,
} from 'react-native';
import { useMemoryOptimization } from '../../utils/AdvancedMemoryManager';
import { usePerformanceOptimizer } from '../../utils/PerformanceOptimizer';

/**
 * Industry-Leading Virtualized List Component
 * Target: 60 FPS scrolling, minimal memory footprint, instant response
 */

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  itemHeight?: number | ((item: T, index: number) => number);
  estimatedItemSize?: number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement;
  numColumns?: number;
  horizontal?: boolean;
  contentContainerStyle?: any;
  style?: any;
  optimizeFor?: 'memory' | 'performance' | 'balanced';
  enableVirtualization?: boolean;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  initialNumToRender?: number;
  removeClippedSubviews?: boolean;
  getItemLayout?: (
    data: T[] | null | undefined,
    index: number,
  ) => { length: number; offset: number; index: number };
}

const ITEM_SEPARATOR_HEIGHT = 1;
const DEFAULT_WINDOW_SIZE = 10;
const DEFAULT_MAX_TO_RENDER_PER_BATCH = 10;

/**
 * Memoized list item wrapper for optimal re-rendering
 */
const MemoizedListItem = memo(<T extends any>({
  item,
  index,
  renderItem,
  keyExtractor,
}: {
  item: T;
  index: number;
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
}) => {
  const key = keyExtractor(item, index);
  
  return (
    <View key={key} style={styles.itemContainer}>
      {renderItem({ item, index })}
    </View>
  );
});

MemoizedListItem.displayName = 'MemoizedListItem';

/**
 * Performance-optimized FlatList wrapper
 */
export const VirtualizedList = <T extends any>({
  data,
  renderItem,
  keyExtractor,
  itemHeight,
  estimatedItemSize = 60,
  onEndReached,
  onEndReachedThreshold = 0.5,
  refreshing = false,
  onRefresh,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  numColumns = 1,
  horizontal = false,
  contentContainerStyle,
  style,
  optimizeFor = 'balanced',
  enableVirtualization = true,
  maxToRenderPerBatch,
  windowSize,
  initialNumToRender,
  removeClippedSubviews,
  getItemLayout,
}: VirtualizedListProps<T>) => {
  
  const flatListRef = useRef<FlatList<T>>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  
  const { deviceCapabilities } = usePerformanceOptimizer();
  const { memoryStats, getFromPool, returnToPool } = useMemoryOptimization();

  // Dynamic performance settings based on device capabilities and optimization target
  const performanceSettings = useMemo(() => {
    const baseSettings = {
      maxToRenderPerBatch: DEFAULT_MAX_TO_RENDER_PER_BATCH,
      windowSize: DEFAULT_WINDOW_SIZE,
      initialNumToRender: 10,
      removeClippedSubviews: Platform.OS === 'android',
      updateCellsBatchingPeriod: 50,
      legacyImplementation: false,
    };

    // Adjust based on device capabilities
    if (deviceCapabilities.isLowEndDevice || optimizeFor === 'memory') {
      return {
        ...baseSettings,
        maxToRenderPerBatch: 5,
        windowSize: 5,
        initialNumToRender: 5,
        removeClippedSubviews: true,
        updateCellsBatchingPeriod: 100,
      };
    }

    if (deviceCapabilities.renderingTier === 'premium' || optimizeFor === 'performance') {
      return {
        ...baseSettings,
        maxToRenderPerBatch: 20,
        windowSize: 20,
        initialNumToRender: 15,
        updateCellsBatchingPeriod: 16, // 60fps
      };
    }

    return baseSettings;
  }, [deviceCapabilities, optimizeFor]);

  // Override with props if provided
  const finalSettings = {
    ...performanceSettings,
    ...(maxToRenderPerBatch && { maxToRenderPerBatch }),
    ...(windowSize && { windowSize }),
    ...(initialNumToRender && { initialNumToRender }),
    ...(removeClippedSubviews !== undefined && { removeClippedSubviews }),
  };

  /**
   * Optimized getItemLayout for consistent item heights
   */
  const optimizedGetItemLayout = useCallback((
    data: T[] | null | undefined,
    index: number,
  ) => {
    if (getItemLayout) {
      return getItemLayout(data, index);
    }

    if (typeof itemHeight === 'number') {
      return {
        length: itemHeight,
        offset: itemHeight * index,
        index,
      };
    }

    // Fallback to estimated size
    return {
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    };
  }, [getItemLayout, itemHeight, estimatedItemSize]);

  /**
   * Performance-optimized render item with object pooling
   */
  const optimizedRenderItem = useCallback(({ item, index }: { item: T; index: number }) => {
    // Use object pooling for render events
    const renderEvent = getFromPool('renderEvents') || { item: null, index: 0, timestamp: 0 };
    renderEvent.item = item;
    renderEvent.index = index;
    renderEvent.timestamp = Date.now();

    const result = (
      <MemoizedListItem
        item={item}
        index={index}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    );

    // Return to pool after rendering
    InteractionManager.runAfterInteractions(() => {
      returnToPool('renderEvents', renderEvent);
    });

    return result;
  }, [renderItem, keyExtractor, getFromPool, returnToPool]);

  /**
   * Track scroll events for performance optimization
   */
  const handleScrollBeginDrag = useCallback(() => {
    setIsScrolling(true);
    performance.mark('scroll-start');
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    setIsScrolling(false);
    performance.mark('scroll-end');
    performance.measure('scroll-duration', 'scroll-start', 'scroll-end');
  }, []);

  /**
   * Optimize viewport calculations
   */
  const onViewableItemsChanged = useCallback(({ viewableItems, changed }) => {
    if (viewableItems.length > 0) {
      const start = viewableItems[0].index || 0;
      const end = viewableItems[viewableItems.length - 1].index || 0;
      setVisibleRange({ start, end });
    }

    // Track performance metrics
    if (changed.length > 0) {
      performance.mark('viewable-items-changed');
    }
  }, []);

  const viewabilityConfig = useMemo(() => ({
    waitForInteraction: true,
    viewAreaCoveragePercentThreshold: 50,
    minimumViewTime: 250,
  }), []);

  /**
   * Optimized end reached handler with debouncing
   */
  const debouncedEndReached = useCallback(() => {
    if (onEndReached && !isScrolling) {
      InteractionManager.runAfterInteractions(() => {
        onEndReached();
      });
    }
  }, [onEndReached, isScrolling]);

  /**
   * Memory-aware item separator
   */
  const ItemSeparatorComponent = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  // Dynamic list configuration based on data size and performance
  const shouldUseVirtualization = useMemo(() => {
    if (!enableVirtualization) return false;
    
    // Always virtualize for large datasets
    if (data.length > 50) return true;
    
    // Virtualize based on memory pressure
    if (memoryStats.trend === 'increasing' && data.length > 20) return true;
    
    // Don't virtualize small lists to avoid overhead
    return data.length > 10;
  }, [enableVirtualization, data.length, memoryStats.trend]);

  // Common props for both virtualized and non-virtualized lists
  const commonProps = {
    data,
    renderItem: optimizedRenderItem,
    keyExtractor,
    style,
    contentContainerStyle,
    numColumns,
    horizontal,
    refreshing,
    onRefresh,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
    ItemSeparatorComponent,
    onScrollBeginDrag: handleScrollBeginDrag,
    onScrollEndDrag: handleScrollEndDrag,
    onEndReached: debouncedEndReached,
    onEndReachedThreshold,
    onViewableItemsChanged,
    viewabilityConfig,
    // Performance optimizations
    keyboardShouldPersistTaps: 'handled',
    keyboardDismissMode: 'on-drag',
  };

  if (shouldUseVirtualization) {
    return (
      <FlatList
        ref={flatListRef}
        {...commonProps}
        {...finalSettings}
        getItemLayout={typeof itemHeight === 'number' ? optimizedGetItemLayout : undefined}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      />
    );
  }

  // For small lists, use regular ScrollView-based rendering
  return (
    <View style={[styles.container, style]}>
      {data.map((item, index) => (
        <View key={keyExtractor(item, index)}>
          {optimizedRenderItem({ item, index })}
          {index < data.length - 1 && <ItemSeparatorComponent />}
        </View>
      ))}
    </View>
  );
};

/**
 * High-performance grid list for images and cards
 */
interface VirtualizedGridProps<T> extends VirtualizedListProps<T> {
  itemWidth: number;
  itemHeight: number;
  spacing?: number;
  aspectRatio?: number;
}

export const VirtualizedGrid = <T extends any>({
  data,
  renderItem,
  keyExtractor,
  itemWidth,
  itemHeight,
  spacing = 10,
  numColumns,
  style,
  ...otherProps
}: VirtualizedGridProps<T>) => {
  const screenWidth = Dimensions.get('window').width;
  
  // Calculate optimal number of columns if not provided
  const optimalColumns = useMemo(() => {
    if (numColumns) return numColumns;
    
    const availableWidth = screenWidth - (spacing * 2);
    const itemWidthWithSpacing = itemWidth + spacing;
    return Math.floor(availableWidth / itemWidthWithSpacing);
  }, [numColumns, screenWidth, itemWidth, spacing]);

  // Chunk data for grid layout
  const chunkedData = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < data.length; i += optimalColumns) {
      chunks.push(data.slice(i, i + optimalColumns));
    }
    return chunks;
  }, [data, optimalColumns]);

  const renderGridRow = useCallback(({ item: rowData, index }: { item: T[]; index: number }) => (
    <View style={[styles.gridRow, { marginHorizontal: spacing / 2 }]}>
      {rowData.map((item, itemIndex) => (
        <View
          key={keyExtractor(item, index * optimalColumns + itemIndex)}
          style={[
            styles.gridItem,
            {
              width: itemWidth,
              height: itemHeight,
              marginHorizontal: spacing / 2,
              marginBottom: spacing,
            },
          ]}
        >
          {renderItem({ item, index: index * optimalColumns + itemIndex })}
        </View>
      ))}
    </View>
  ), [renderItem, keyExtractor, optimalColumns, itemWidth, itemHeight, spacing]);

  return (
    <VirtualizedList
      data={chunkedData}
      renderItem={renderGridRow}
      keyExtractor={(item, index) => `row-${index}`}
      itemHeight={itemHeight + spacing}
      style={style}
      numColumns={1}
      optimizeFor="performance"
      {...otherProps}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    flex: 1,
  },
  separator: {
    height: ITEM_SEPARATOR_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    overflow: 'hidden',
  },
});

export default VirtualizedList;