/**
 * TailTracker Premium Pull-to-Refresh Component
 *
 * A delightful pull-to-refresh implementation with custom animations,
 * pet-themed indicators, and smooth haptic feedback.
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';

import premiumAnimations from '../../design-system/animations/premiumAnimations';
import { useMaterialTheme } from '../../theme/MaterialThemeProvider';
import hapticUtils from '../../utils/hapticUtils';

const { width: screenWidth } = Dimensions.get('window');

// ====================================
// TYPES AND INTERFACES
// ====================================

export interface PremiumPullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  theme?: 'pet' | 'heart' | 'paw' | 'bone';
  pullThreshold?: number;
  maxPullDistance?: number;
  showProgress?: boolean;
  hapticEnabled?: boolean;
  style?: ViewStyle;
}

// ====================================
// PREMIUM PULL TO REFRESH COMPONENT
// ====================================

export const PremiumPullToRefresh: React.FC<PremiumPullToRefreshProps> = ({
  children,
  onRefresh,
  refreshing = false,
  theme = 'pet',
  pullThreshold = 80,
  maxPullDistance = 120,
  showProgress = true,
  hapticEnabled = true,
  style,
}) => {
  const { theme: materialTheme } = useMaterialTheme();

  // Animation values
  const pullDistance = useSharedValue(0);
  const indicatorRotation = useSharedValue(0);
  const indicatorScale = useSharedValue(0);
  const progressOpacity = useSharedValue(0);
  const isTriggered = useSharedValue(false);

  // State
  const [internalRefreshing, setInternalRefreshing] = React.useState(false);

  // ====================================
  // GESTURE HANDLER
  // ====================================

  const handleGestureEvent = useCallback(
    (event: any) => {
      const { translationY, velocityY } = event.nativeEvent;

      if (translationY > 0 && !internalRefreshing) {
        pullDistance.value = Math.min(translationY, maxPullDistance);

        // Calculate indicator scale based on pull distance
        const scaleProgress = interpolate(
          pullDistance.value,
          [0, pullThreshold],
          [0, 1],
          Extrapolation.CLAMP
        );
        indicatorScale.value = scaleProgress;

        // Rotate indicator based on pull distance
        const rotationProgress = interpolate(
          pullDistance.value,
          [0, maxPullDistance],
          [0, 360],
          Extrapolation.CLAMP
        );
        indicatorRotation.value = rotationProgress;

        // Show progress indicator
        if (showProgress) {
          progressOpacity.value = scaleProgress;
        }

        // Haptic feedback at threshold
        if (pullDistance.value >= pullThreshold && !isTriggered.value) {
          isTriggered.value = true;
          if (hapticEnabled) {
            runOnJS(hapticUtils.pet.mood)('excited');
          }
        } else if (pullDistance.value < pullThreshold && isTriggered.value) {
          isTriggered.value = false;
        }
      }
    },
    [
      pullThreshold,
      maxPullDistance,
      internalRefreshing,
      hapticEnabled,
      showProgress,
      indicatorRotation,
      indicatorScale,
      isTriggered,
      progressOpacity,
      pullDistance,
    ]
  );

  const handleGestureEnd = useCallback(
    (event: any) => {
      const { translationY } = event.nativeEvent;

      if (translationY >= pullThreshold && !internalRefreshing) {
        // Trigger refresh
        setInternalRefreshing(true);

        // Success haptic
        if (hapticEnabled) {
          hapticUtils.success();
        }

        // Start refresh animation
        indicatorRotation.value = withRepeat(
          withSequence(withSpring(360), withSpring(720)),
          -1,
          false
        );

        // Execute refresh function
        onRefresh().finally(() => {
          setInternalRefreshing(false);

          // Reset animations
          pullDistance.value = withSpring(0);
          indicatorScale.value = withSpring(0);
          indicatorRotation.value = withSpring(0);
          progressOpacity.value = withSpring(0);
          isTriggered.value = false;
        });
      } else {
        // Reset to initial position
        pullDistance.value = withSpring(0);
        indicatorScale.value = withSpring(0);
        indicatorRotation.value = withSpring(0);
        progressOpacity.value = withSpring(0);
        isTriggered.value = false;
      }
    },
    [
      pullThreshold,
      internalRefreshing,
      onRefresh,
      hapticEnabled,
      pullDistance,
      indicatorScale,
      indicatorRotation,
      progressOpacity,
      isTriggered,
    ]
  );

  // ====================================
  // ANIMATED STYLES
  // ====================================

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const transforms = [];
    transforms.push({ scale: indicatorScale.value });
    transforms.push({ rotate: `${indicatorRotation.value}deg` });

    return {
      transform: transforms,
      opacity: indicatorScale.value,
    };
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    const progressWidth = interpolate(
      pullDistance.value,
      [0, pullThreshold],
      [0, screenWidth - 40],
      Extrapolation.CLAMP
    );

    return {
      width: progressWidth,
      opacity: progressOpacity.value,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    const transforms = [];
    transforms.push({ translateY: pullDistance.value * 0.3 });

    return {
      transform: transforms,
    };
  });

  // ====================================
  // THEME CONFIGURATIONS
  // ====================================

  const getThemeConfig = useCallback(() => {
    switch (theme) {
      case 'pet':
        return {
          icon: 'paw-outline',
          colors: ['#3B82F6', '#1D4ED8'] as const,
          backgroundColor: materialTheme.colors.primary,
        };
      case 'heart':
        return {
          icon: 'heart-outline',
          colors: ['#F87171', '#EF4444'] as const,
          backgroundColor: '#F87171',
        };
      case 'paw':
        return {
          icon: 'paw-outline',
          colors: ['#10B981', '#059669'] as const,
          backgroundColor: '#10B981',
        };
      case 'bone':
        return {
          icon: 'fitness-outline',
          colors: ['#F59E0B', '#D97706'] as const,
          backgroundColor: '#F59E0B',
        };
      default:
        return {
          icon: 'refresh-outline',
          colors: [
            materialTheme.colors.primary,
            materialTheme.colors.primary,
          ] as const,
          backgroundColor: materialTheme.colors.primary,
        };
    }
  }, [theme, materialTheme.colors.primary]);

  const themeConfig = useMemo(() => getThemeConfig(), [getThemeConfig]);

  // ====================================
  // RENDER INDICATOR
  // ====================================

  const renderIndicator = () => (
    <Animated.View style={[styles.indicatorContainer, animatedIndicatorStyle]}>
      <LinearGradient
        colors={themeConfig.colors}
        style={styles.indicatorBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={themeConfig.icon as any} size={24} color='#FFFFFF' />
      </LinearGradient>
    </Animated.View>
  );

  const renderProgressBar = () => {
    if (!showProgress) return null;

    return (
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, animatedProgressStyle]}>
          <LinearGradient
            colors={themeConfig.colors}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
    );
  };

  // ====================================
  // RENDER COMPONENT
  // ====================================

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={event => {
        if (event.nativeEvent.state === State.END) {
          handleGestureEnd(event);
        }
      }}
    >
      <Animated.View style={[styles.container, style]}>
        {/* Pull Indicator */}
        <View style={styles.pullIndicatorContainer}>
          {renderIndicator()}
          {renderProgressBar()}
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, animatedContainerStyle]}>
          {children}
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};

// ====================================
// STANDARD REFRESH CONTROL WRAPPER
// ====================================

export const StandardPullToRefresh: React.FC<{
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  theme?: 'pet' | 'heart' | 'paw' | 'bone';
}> = ({ children, onRefresh, refreshing = false, theme = 'pet' }) => {
  const { theme: materialTheme } = useMaterialTheme();

  const getThemeColor = () => {
    switch (theme) {
      case 'heart':
        return '#F87171';
      case 'paw':
        return '#10B981';
      case 'bone':
        return '#F59E0B';
      default:
        return materialTheme.colors.primary;
    }
  };

  const handleRefresh = useCallback(async () => {
    hapticUtils.pet.mood('excited');
    await onRefresh();
    hapticUtils.success();
  }, [onRefresh]);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={getThemeColor()}
          colors={[getThemeColor()]}
          progressBackgroundColor='#FFFFFF'
          titleColor={getThemeColor()}
          title='Pull to refresh...'
        />
      }
    >
      {children}
    </ScrollView>
  );
};

// ====================================
// ANIMATED REFRESH LIST
// ====================================

export const AnimatedRefreshList: React.FC<{
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  showItemStagger?: boolean;
  staggerDelay?: number;
  style?: ViewStyle;
}> = ({
  children,
  onRefresh,
  refreshing = false,
  showItemStagger = true,
  staggerDelay = 100,
  style,
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(refreshing);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    hapticUtils.pet.mood('excited');

    await onRefresh();

    // Add slight delay for better UX
    setTimeout(() => {
      setIsRefreshing(false);
      hapticUtils.success();
    }, 300);
  }, [onRefresh]);

  React.useEffect(() => {
    setIsRefreshing(refreshing);
  }, [refreshing]);

  const childrenArray = React.Children.toArray(children);

  return (
    <StandardPullToRefresh onRefresh={handleRefresh} refreshing={isRefreshing}>
      <View style={[styles.listContainer, style]}>
        {showItemStagger
          ? childrenArray.map((child, index) => (
              <StaggeredItem
                key={index}
                delay={isRefreshing ? 0 : index * staggerDelay}
                isVisible={!isRefreshing}
              >
                {child}
              </StaggeredItem>
            ))
          : children}
      </View>
    </StandardPullToRefresh>
  );
};

// ====================================
// STAGGERED ITEM COMPONENT
// ====================================

const StaggeredItem: React.FC<{
  children: React.ReactNode;
  delay: number;
  isVisible: boolean;
}> = ({ children, delay, isVisible }) => {
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const translateY = useSharedValue(isVisible ? 0 : 20);

  React.useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        opacity.value = withSpring(1);
        translateY.value = withSpring(0);
      }, delay);
    } else {
      opacity.value = withSpring(0);
      translateY.value = withSpring(20);
    }
  }, [isVisible, delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pullIndicatorContainer: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  indicatorContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicatorBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  progressContainer: {
    width: screenWidth - 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
});

export default {
  PremiumPullToRefresh,
  StandardPullToRefresh,
  AnimatedRefreshList,
};
