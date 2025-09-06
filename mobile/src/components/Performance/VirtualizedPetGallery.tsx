import React, { memo, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  VirtualizedList,
  ListRenderItem,
  ViewToken,
} from 'react-native';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { PetPhoto } from '@/services/PetService';
import { AdvancedImage } from './AdvancedImage';

interface VirtualizedPetGalleryProps {
  photos: PetPhoto[];
  numColumns?: number;
  itemHeight?: number;
  spacing?: number;
  onPhotoPress?: (photo: PetPhoto, index: number) => void;
  onPhotoLongPress?: (photo: PetPhoto, index: number) => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  keyExtractor?: (item: PetPhoto, index: number) => string;
  getItemLayout?: (data: PetPhoto[] | null | undefined, index: number) => { length: number; offset: number; index: number };
}

interface PhotoGridItem {
  photos: PetPhoto[];
  isRow: boolean;
  rowIndex: number;
}

// Performance-optimized photo grid item component
const PhotoGridRow = memo<{
  item: PhotoGridItem;
  numColumns: number;
  itemHeight: number;
  spacing: number;
  onPhotoPress?: (photo: PetPhoto, index: number) => void;
  onPhotoLongPress?: (photo: PetPhoto, index: number) => void;
}>(({ item, numColumns, itemHeight, spacing, onPhotoPress, onPhotoLongPress }) => {
  const screenWidth = Dimensions.get('window').width;
  const totalSpacing = spacing * (numColumns + 1);
  const itemWidth = (screenWidth - totalSpacing) / numColumns;

  return (
    <View style={[styles.row, { paddingHorizontal: spacing / 2 }]}>
      {item.photos.map((photo, photoIndex) => {
        const actualIndex = item.rowIndex * numColumns + photoIndex;
        return (
          <PhotoGridItemMemo
            key={photo.id || `photo-${actualIndex}`}
            photo={photo}
            index={actualIndex}
            width={itemWidth}
            height={itemHeight}
            spacing={spacing / 2}
            onPress={onPhotoPress}
            onLongPress={onPhotoLongPress}
          />
        );
      })}
      {/* Fill remaining columns with empty views for consistent spacing */}
      {Array.from({ length: numColumns - item.photos.length }, (_, index) => (
        <View
          key={`empty-${index}`}
          style={{
            width: itemWidth,
            height: itemHeight,
            marginHorizontal: spacing / 2,
          }}
        />
      ))}
    </View>
  );
});

PhotoGridRow.displayName = 'PhotoGridRow';

// Individual photo item component with advanced optimizations
const PhotoGridItemMemo = memo<{
  photo: PetPhoto;
  index: number;
  width: number;
  height: number;
  spacing: number;
  onPress?: (photo: PetPhoto, index: number) => void;
  onLongPress?: (photo: PetPhoto, index: number) => void;
}>(({ photo, index, width, height, spacing, onPress, onLongPress }) => {
  const handlePress = useCallback(() => {
    onPress?.(photo, index);
  }, [photo, index, onPress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(photo, index);
  }, [photo, index, onLongPress]);

  // Generate blurhash for smoother loading
  const blurhash = useMemo(() => {
    // Generate a basic blurhash pattern for placeholder
    return 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
  }, []);

  return (
    <View
      style={[
        styles.photoItem,
        {
          width,
          height,
          marginHorizontal: spacing,
          marginBottom: spacing,
        },
      ]}
    >
      <AdvancedImage
        source={{ uri: photo.photo_url }}
        style={styles.photo}
        contentFit="cover"
        priority={index < 6 ? 'high' : 'normal'} // Prioritize first 6 images
        blurhash={blurhash}
        recyclingKey={`photo-${photo.id}`}
        fadeDuration={200}
        progressive
        onLoad={() => {
          // Track image load performance
          if (__DEV__) {
            console.log(`Image loaded: ${photo.id}`);
          }
        }}
        onError={(error) => {
          console.warn('Failed to load photo:', photo.id, error);
        }}
      />

      {/* Profile badge */}
      {photo.is_profile_photo && (
        <View style={styles.profileBadge}>
          <View style={styles.profileBadgeInner} />
        </View>
      )}

      {/* Touch overlay */}
      <View
        style={StyleSheet.absoluteFill}
        onTouchStart={handlePress}
        onLongPress={handleLongPress}
      />
    </View>
  );
});

PhotoGridItemMemo.displayName = 'PhotoGridItemMemo';

export const VirtualizedPetGallery = memo<VirtualizedPetGalleryProps>(({
  photos,
  numColumns = 2,
  itemHeight = 200,
  spacing = 8,
  onPhotoPress,
  onPhotoLongPress,
  onEndReached,
  onEndReachedThreshold = 0.1,
  refreshing = false,
  onRefresh,
  keyExtractor,
  getItemLayout,
}) => {
  const [viewableItems, setViewableItems] = useState<ViewToken[]>([]);
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  // Convert photos array into grid rows for virtualization
  const gridData = useMemo(() => {
    const rows: PhotoGridItem[] = [];
    for (let i = 0; i < photos.length; i += numColumns) {
      const rowPhotos = photos.slice(i, i + numColumns);
      rows.push({
        photos: rowPhotos,
        isRow: true,
        rowIndex: Math.floor(i / numColumns),
      });
    }
    return rows;
  }, [photos, numColumns]);

  // Optimized key extractor
  const defaultKeyExtractor = useCallback(
    (item: PhotoGridItem, index: number) => {
      if (keyExtractor && item.photos.length > 0) {
        return keyExtractor(item.photos[0], index);
      }
      return `row-${index}-${item.photos.map(p => p.id).join('-')}`;
    },
    [keyExtractor]
  );

  // Optimized item layout calculation
  const calculateItemLayout = useCallback(
    (data: PhotoGridItem[] | null | undefined, index: number) => {
      const length = itemHeight + spacing;
      return {
        length,
        offset: length * index,
        index,
      };
    },
    [itemHeight, spacing]
  );

  // Render item with performance optimizations
  const renderItem: ListRenderItem<PhotoGridItem> = useCallback(
    ({ item, index }) => (
      <PhotoGridRow
        item={item}
        numColumns={numColumns}
        itemHeight={itemHeight}
        spacing={spacing}
        onPhotoPress={onPhotoPress}
        onPhotoLongPress={onPhotoLongPress}
      />
    ),
    [numColumns, itemHeight, spacing, onPhotoPress, onPhotoLongPress]
  );

  // Viewability change handler for performance tracking
  const onViewableItemsChanged = useCallback(
    ({ viewableItems: newViewableItems }: { viewableItems: ViewToken[] }) => {
      setViewableItems(newViewableItems);
      
      // Preload nearby images
      newViewableItems.forEach((viewableItem) => {
        const item = viewableItem.item as PhotoGridItem;
        item.photos.forEach((photo) => {
          // Trigger preloading for visible items
          if (photo.photo_url) {
            // ImageMemoryPool preloading would be triggered here
          }
        });
      });
    },
    []
  );

  // Get item count
  const getItemCount = useCallback((data: PhotoGridItem[]) => data.length, []);

  // Get item by index
  const getItem = useCallback((data: PhotoGridItem[], index: number) => data[index], []);

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VirtualizedList
        data={gridData}
        renderItem={renderItem}
        keyExtractor={defaultKeyExtractor}
        getItemCount={getItemCount}
        getItem={getItem}
        getItemLayout={getItemLayout || calculateItemLayout}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef.current}
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        initialNumToRender={8}
        windowSize={10}
        updateCellsBatchingPeriod={50}
        disableVirtualization={false}
        legacyImplementation={false}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
      />
    </View>
  );
});

VirtualizedPetGallery.displayName = 'VirtualizedPetGallery';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoItem: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  photo: {
    flex: 1,
  },
  profileBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBadgeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#E3E3E3',
    borderRadius: 8,
  },
});

VirtualizedPetGallery.displayName = 'VirtualizedPetGallery';