/**
 * Magic UI - Animated Button for React Native
 * Adapted from Magic UI shimmer and pulsating button components
 */

import React from 'react';
import { Pressable, PressableProps, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  withSequence,
} from 'react-native-reanimated';
import { tailTrackerMotions } from '../../animations/motionSystem';

interface AnimatedButtonProps extends Omit<PressableProps, 'children'> {
  children: string;
  variant?: 'shimmer' | 'pulsating' | 'rainbow' | 'shine';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  pulseColor?: string;
  shimmerColor?: string;
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'shimmer',
  size = 'md',
  disabled = false,
  loading = false,
  pulseColor = '#3B82F6',
  shimmerColor = 'rgba(255, 255, 255, 0.3)',
  style,
  ...props
}) => {
  // Animation values
  const shimmerProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pressScale = useSharedValue(1);

  React.useEffect(() => {
    if (variant === 'shimmer') {
      shimmerProgress.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        false
      );
    }
    
    if (variant === 'pulsating') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
    }
  }, [variant]);

  // Size configurations
  const sizeConfig = {
    sm: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      borderRadius: 6,
    },
    md: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      borderRadius: 8,
    },
    lg: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      fontSize: 18,
      borderRadius: 10,
    },
  };

  const config = sizeConfig[size];

  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: pressScale.value * (variant === 'pulsating' ? pulseScale.value : 1) }
      ],
    };
  });

  const shimmerOverlayStyle = useAnimatedStyle(() => {
    if (variant !== 'shimmer') return {};
    
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-100, 100]
    );

    return {
      transform: [{ translateX }],
      opacity: interpolate(
        shimmerProgress.value,
        [0, 0.5, 1],
        [0, 1, 0]
      ),
    };
  });

  const handlePressIn = () => {
    pressScale.value = withTiming(0.95, {
      duration: tailTrackerMotions.durations.instant,
    });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, {
      duration: tailTrackerMotions.durations.quick,
    });
  };

  const baseButtonStyle = {
    backgroundColor: disabled ? '#9CA3AF' : '#3B82F6',
    ...config,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    opacity: disabled ? 0.6 : 1,
  };

  const textStyle = {
    color: '#FFFFFF',
    fontSize: config.fontSize,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  };

  return (
    <AnimatedPressable
      style={[baseButtonStyle, animatedButtonStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shimmer overlay for shimmer variant */}
      {variant === 'shimmer' && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: shimmerColor,
            },
            shimmerOverlayStyle,
          ]}
        />
      )}

      {/* Rainbow overlay for rainbow variant */}
      {variant === 'rainbow' && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: pulseColor,
            borderRadius: config.borderRadius,
          }}
        />
      )}

      <Text style={textStyle}>
        {loading ? 'Loading...' : children}
      </Text>
    </AnimatedPressable>
  );
};

export default AnimatedButton;