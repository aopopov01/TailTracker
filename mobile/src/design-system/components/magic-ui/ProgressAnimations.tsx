/**
 * Magic UI - Progress & Loading Animations for React Native
 * Adapted from Magic UI progress bar, orbiting circles, and number ticker components
 */

import React, { useEffect } from 'react';
import { View, Text, ViewProps, TextProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { tailTrackerMotions } from '../../animations/motionSystem';

// ====================================
// ANIMATED CIRCULAR PROGRESS BAR
// ====================================

interface AnimatedCircularProgressBarProps extends ViewProps {
  value: number;
  max?: number;
  min?: number;
  size?: number;
  strokeWidth?: number;
  primaryColor?: string;
  secondaryColor?: string;
  showText?: boolean;
  textColor?: string;
  duration?: number;
}

export const AnimatedCircularProgressBar: React.FC<AnimatedCircularProgressBarProps> = ({
  value,
  max = 100,
  min = 0,
  size = 120,
  strokeWidth = 8,
  primaryColor = '#3B82F6',
  secondaryColor = '#E5E7EB',
  showText = true,
  textColor = '#374151',
  duration = 1000,
  style,
  ...props
}) => {
  const progress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const targetProgress = ((value - min) / (max - min)) * 100;
    progress.value = withTiming(targetProgress, { duration });
  }, [value, min, max, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const strokeDashoffset = circumference - (progress.value / 100) * circumference;
    return {
      strokeDashoffset,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value > 0 ? 1 : 0, { duration: 300 }),
  }));

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]} {...props}>
      {/* Background circle */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: secondaryColor,
          position: 'absolute',
        }}
      />
      
      {/* Progress circle - simplified for React Native */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: primaryColor,
          position: 'absolute',
          transform: [{ rotate: '-90deg' }],
        }}
      />

      {/* Progress text */}
      {showText && (
        <Animated.Text
          style={[
            {
              fontSize: size * 0.15,
              fontWeight: '600',
              color: textColor,
            },
            textAnimatedStyle,
          ]}
        >
          {Math.round(((value - min) / (max - min)) * 100)}%
        </Animated.Text>
      )}
    </View>
  );
};

// ====================================
// NUMBER TICKER ANIMATION
// ====================================

interface NumberTickerProps extends TextProps {
  value: number;
  startValue?: number;
  duration?: number;
  delay?: number;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
}

export const NumberTicker: React.FC<NumberTickerProps> = ({
  value,
  startValue = 0,
  duration = 1000,
  delay = 0,
  decimalPlaces = 0,
  prefix = '',
  suffix = '',
  style,
  ...props
}) => {
  const animatedValue = useSharedValue(startValue);
  const [displayValue, setDisplayValue] = React.useState(startValue);

  useEffect(() => {
    const startAnimation = () => {
      animatedValue.value = withTiming(
        value,
        { duration },
        (finished) => {
          if (finished) {
            runOnJS(setDisplayValue)(value);
          }
        }
      );
    };

    const timeout = setTimeout(startAnimation, delay);
    return () => clearTimeout(timeout);
  }, [value, duration, delay]);

  // Update display value during animation
  useEffect(() => {
    const interval = setInterval(() => {
      const currentValue = animatedValue.value;
      setDisplayValue(currentValue);
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return num.toFixed(decimalPlaces);
  };

  return (
    <Text style={style} {...props}>
      {prefix}{formatNumber(displayValue)}{suffix}
    </Text>
  );
};

// ====================================
// ORBITING CIRCLES
// ====================================

interface OrbitingCirclesProps extends ViewProps {
  children: React.ReactNode[];
  radius?: number;
  duration?: number;
  reverse?: boolean;
  iconSize?: number;
}

export const OrbitingCircles: React.FC<OrbitingCirclesProps> = ({
  children,
  radius = 100,
  duration = 8000,
  reverse = false,
  iconSize = 40,
  style,
  ...props
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(reverse ? -360 : 360, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [duration, reverse]);

  return (
    <View
      style={[
        {
          width: (radius + iconSize) * 2,
          height: (radius + iconSize) * 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      {...props}
    >
      {/* Orbital path indicator */}
      <View
        style={{
          position: 'absolute',
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.1)',
        }}
      />

      {React.Children.map(children, (child, index) => {
        const angle = (360 / children.length) * index;
        
        return (
          <OrbitingItem
            key={index}
            rotation={rotation}
            angle={angle}
            radius={radius}
            iconSize={iconSize}
          >
            {child}
          </OrbitingItem>
        );
      })}
    </View>
  );
};

interface OrbitingItemProps {
  children: React.ReactNode;
  rotation: Animated.SharedValue<number>;
  angle: number;
  radius: number;
  iconSize: number;
}

const OrbitingItem: React.FC<OrbitingItemProps> = ({
  children,
  rotation,
  angle,
  radius,
  iconSize,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const totalRotation = rotation.value + angle;
    const radian = (totalRotation * Math.PI) / 180;
    const x = Math.cos(radian) * radius;
    const y = Math.sin(radian) * radius;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: iconSize,
          height: iconSize,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: iconSize / 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ====================================
// BLUR FADE ANIMATION
// ====================================

interface BlurFadeProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  offset?: number;
}

export const BlurFade: React.FC<BlurFadeProps> = ({
  children,
  delay = 0,
  duration = 600,
  direction = 'up',
  offset = 20,
}) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(direction === 'left' ? -offset : direction === 'right' ? offset : 0);
  const translateY = useSharedValue(direction === 'up' ? -offset : direction === 'down' ? offset : 0);

  useEffect(() => {
    const startAnimation = () => {
      opacity.value = withTiming(1, { duration });
      translateX.value = withTiming(0, { duration });
      translateY.value = withTiming(0, { duration });
    };

    const timeout = setTimeout(startAnimation, delay);
    return () => clearTimeout(timeout);
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

// ====================================
// SCROLL PROGRESS INDICATOR
// ====================================

interface ScrollProgressProps extends ViewProps {
  progress: number; // 0 to 1
  height?: number;
  colors?: string[];
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  progress,
  height = 4,
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'],
  style,
  ...props
}) => {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 300 });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => {
    const width = interpolate(animatedProgress.value, [0, 1], [0, 100]);
    return {
      width: `${width}%`,
    };
  });

  return (
    <View
      style={[
        {
          height,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        },
        style,
      ]}
      {...props}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: colors[0],
          },
          progressStyle,
        ]}
      />
    </View>
  );
};

// ====================================
// EXPORTS
// ====================================

export const MagicProgressAnimations = {
  AnimatedCircularProgressBar,
  NumberTicker,
  OrbitingCircles,
  BlurFade,
  ScrollProgress,
};

export default MagicProgressAnimations;