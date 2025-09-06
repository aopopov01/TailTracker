/**
 * TailTracker Skeleton Loader Components
 * 
 * Beautiful, smooth skeleton loading states that keep users engaged
 * while content is loading with premium shimmer animations.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import premiumAnimations from '../../design-system/animations/premiumAnimations';
import { useMaterialTheme } from '../../theme/MaterialThemeProvider';

const { width: screenWidth } = Dimensions.get('window');

// ====================================
// TYPES AND INTERFACES
// ====================================

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  shimmerColors?: string[];
}

export interface SkeletonCardProps {
  variant?: 'pet' | 'list' | 'profile' | 'notification';
  count?: number;
  style?: ViewStyle;
}

// ====================================
// BASE SKELETON COMPONENT
// ====================================

export const Skeleton: React.FC<SkeletonProps> = ({
  width = 100,
  height = 20,
  borderRadius = 8,
  style,
  shimmerColors,
}) => {
  const { theme, isDarkMode } = useMaterialTheme();
  
  // Animation values
  const shimmerTranslateX = useSharedValue(-1);
  
  // Start shimmer animation
  React.useEffect(() => {
    shimmerTranslateX.value = withRepeat(
      premiumAnimations.loading.shimmer().translateX,
      -1,
      false
    );
  }, [shimmerTranslateX]);
  
  // Animated styles
  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerTranslateX.value,
      [-1, 1],
      [-screenWidth, screenWidth],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [{ translateX }],
    };
  });
  
  const getShimmerColors = () => {
    if (shimmerColors) return shimmerColors;
    
    if (isDarkMode) {
      return [
        'rgba(255, 255, 255, 0.05)',
        'rgba(255, 255, 255, 0.15)',
        'rgba(255, 255, 255, 0.05)',
      ];
    } else {
      return [
        'rgba(0, 0, 0, 0.05)',
        'rgba(0, 0, 0, 0.15)',
        'rgba(0, 0, 0, 0.05)',
      ];
    }
  };
  
  const getBackgroundColor = () => {
    return isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  };
  
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: getBackgroundColor(),
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, shimmerStyle]}>
        <LinearGradient
          colors={getShimmerColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
};

// ====================================
// SKELETON CARD VARIANTS
// ====================================

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  variant = 'list',
  count = 1,
  style,
}) => {
  const renderSkeletonCard = (index: number) => {
    switch (variant) {
      case 'pet':
        return <PetCardSkeleton key={index} />;
      case 'list':
        return <ListItemSkeleton key={index} />;
      case 'profile':
        return <ProfileSkeleton key={index} />;
      case 'notification':
        return <NotificationSkeleton key={index} />;
      default:
        return <ListItemSkeleton key={index} />;
    }
  };
  
  return (
    <View style={style}>
      {Array.from({ length: count }, (_, index) => renderSkeletonCard(index))}
    </View>
  );
};

// ====================================
// PET CARD SKELETON
// ====================================

const PetCardSkeleton: React.FC = () => {
  return (
    <View style={styles.petCardSkeleton}>
      {/* Pet Image */}
      <View style={styles.petImageContainer}>
        <Skeleton width={80} height={80} borderRadius={12} />
      </View>
      
      {/* Pet Info */}
      <View style={styles.petInfoContainer}>
        {/* Pet Name */}
        <Skeleton width="60%" height={24} borderRadius={4} style={{ marginBottom: 8 }} />
        
        {/* Pet Details */}
        <Skeleton width="80%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
        
        {/* Status Indicators */}
        <View style={styles.indicatorsRow}>
          <Skeleton width={60} height={20} borderRadius={10} />
          <Skeleton width={40} height={20} borderRadius={10} style={{ marginLeft: 8 }} />
        </View>
      </View>
      
      {/* Action Button */}
      <View style={styles.actionContainer}>
        <Skeleton width={32} height={32} borderRadius={16} />
      </View>
    </View>
  );
};

// ====================================
// LIST ITEM SKELETON
// ====================================

const ListItemSkeleton: React.FC = () => {
  return (
    <View style={styles.listItemSkeleton}>
      {/* Icon */}
      <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
      
      {/* Content */}
      <View style={styles.listContentContainer}>
        <Skeleton width="70%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="90%" height={14} borderRadius={4} />
      </View>
      
      {/* Trailing */}
      <View style={styles.listTrailingContainer}>
        <Skeleton width={24} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
        <Skeleton width={16} height={16} borderRadius={8} />
      </View>
    </View>
  );
};

// ====================================
// PROFILE SKELETON
// ====================================

const ProfileSkeleton: React.FC = () => {
  return (
    <View style={styles.profileSkeleton}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <Skeleton width={100} height={100} borderRadius={50} />
        <View style={styles.profileInfo}>
          <Skeleton width="60%" height={28} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width="80%" height={16} borderRadius={4} />
        </View>
      </View>
      
      {/* Stats */}
      <View style={styles.profileStats}>
        {Array.from({ length: 3 }, (_, index) => (
          <View key={index} style={styles.statItem}>
            <Skeleton width={40} height={20} borderRadius={4} style={{ marginBottom: 4 }} />
            <Skeleton width={60} height={14} borderRadius={4} />
          </View>
        ))}
      </View>
      
      {/* Content */}
      <View style={styles.profileContent}>
        <Skeleton width="100%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="85%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={16} borderRadius={4} />
      </View>
    </View>
  );
};

// ====================================
// NOTIFICATION SKELETON
// ====================================

const NotificationSkeleton: React.FC = () => {
  return (
    <View style={styles.notificationSkeleton}>
      {/* Icon */}
      <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: 12 }} />
      
      {/* Content */}
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Skeleton width="50%" height={16} borderRadius={4} />
          <Skeleton width={40} height={12} borderRadius={4} />
        </View>
        <Skeleton width="90%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      
      {/* Action */}
      <Skeleton width={8} height={8} borderRadius={4} />
    </View>
  );
};

// ====================================
// SKELETON LIST COMPONENT
// ====================================

export const SkeletonList: React.FC<{
  itemCount?: number;
  variant?: 'pet' | 'list' | 'notification';
  showHeader?: boolean;
}> = ({
  itemCount = 5,
  variant = 'list',
  showHeader = false,
}) => {
  return (
    <View style={styles.skeletonList}>
      {showHeader && (
        <View style={styles.listHeader}>
          <Skeleton width="40%" height={24} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={16} borderRadius={4} />
        </View>
      )}
      
      {Array.from({ length: itemCount }, (_, index) => (
        <SkeletonCard key={index} variant={variant} />
      ))}
    </View>
  );
};

// ====================================
// PULSING SKELETON VARIANT
// ====================================

export const PulsingSkeleton: React.FC<SkeletonProps> = ({
  width = 100,
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { isDarkMode } = useMaterialTheme();
  
  // Animation values
  const pulseOpacity = useSharedValue(0.3);
  
  // Start pulse animation
  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      premiumAnimations.loading.pulse().opacity,
      -1,
      true
    );
  }, [pulseOpacity]);
  
  // Animated styles
  const pulseStyle = useAnimatedStyle(() => {
    return {
      opacity: pulseOpacity.value,
    };
  });
  
  const getBackgroundColor = () => {
    return isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  };
  
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: getBackgroundColor(),
        },
        pulseStyle,
        style,
      ]}
    />
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  // Pet Card Skeleton
  petCardSkeleton: {
    flexDirection: 'row',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  petImageContainer: {
    marginRight: 16,
  },
  petInfoContainer: {
    flex: 1,
  },
  indicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // List Item Skeleton
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  listContentContainer: {
    flex: 1,
  },
  listTrailingContainer: {
    alignItems: 'flex-end',
  },
  
  // Profile Skeleton
  profileSkeleton: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    margin: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  profileContent: {
    marginTop: 16,
  },
  
  // Notification Skeleton
  notificationSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Skeleton List
  skeletonList: {
    flex: 1,
  },
  listHeader: {
    padding: 16,
    paddingBottom: 8,
  },
});

export default {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  PulsingSkeleton,
};