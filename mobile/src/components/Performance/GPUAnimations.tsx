import React, { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  runOnJS,
  useDerivedValue,
  useAnimatedGestureHandler,
  Extrapolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// High-performance spring configuration for 60fps
const SPRING_CONFIG = {
  damping: 15,
  mass: 1,
  stiffness: 150,
  overshootClamping: false,
  restSpeedThreshold: 0.001,
  restDisplacementThreshold: 0.001,
};

// Timing configuration for smooth animations
const TIMING_CONFIG = {
  duration: 300,
};

interface GPUFadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  from?: number;
  to?: number;
  onComplete?: () => void;
}

export const GPUFadeIn = memo<GPUFadeInProps>(({
  children,
  delay = 0,
  duration = 300,
  from = 0,
  to = 1,
  onComplete,
}) => {
  const opacity = useSharedValue(from);

  useEffect(() => {
    opacity.value = withTiming(
      to,
      { duration },
      onComplete ? () => runOnJS(onComplete)() : undefined
    );
  }, [opacity, to, duration, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }), []);

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
});

GPUFadeIn.displayName = 'GPUFadeIn';

interface GPUSlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  distance?: number;
  onComplete?: () => void;
}

export const GPUSlideIn = memo<GPUSlideInProps>(({
  children,
  direction = 'right',
  delay = 0,
  distance = 50,
  onComplete,
}) => {
  const translateX = useSharedValue(
    direction === 'left' ? -distance : direction === 'right' ? distance : 0
  );
  const translateY = useSharedValue(
    direction === 'up' ? -distance : direction === 'down' ? distance : 0
  );
  const opacity = useSharedValue(0);

  useEffect(() => {
    const animateIn = () => {
      translateX.value = withSpring(0, SPRING_CONFIG);
      translateY.value = withSpring(0, SPRING_CONFIG);
      opacity.value = withTiming(
        1,
        TIMING_CONFIG,
        onComplete ? () => runOnJS(onComplete)() : undefined
      );
    };

    if (delay > 0) {
      setTimeout(animateIn, delay);
    } else {
      animateIn();
    }
  }, [translateX, translateY, opacity, delay, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }), []);

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
});

GPUSlideIn.displayName = 'GPUSlideIn';

interface GPUScaleInProps {
  children: React.ReactNode;
  delay?: number;
  from?: number;
  to?: number;
  onComplete?: () => void;
}

export const GPUScaleIn = memo<GPUScaleInProps>(({
  children,
  delay = 0,
  from = 0.3,
  to = 1,
  onComplete,
}) => {
  const scale = useSharedValue(from);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const animateIn = () => {
      scale.value = withSpring(to, SPRING_CONFIG);
      opacity.value = withTiming(
        1,
        TIMING_CONFIG,
        onComplete ? () => runOnJS(onComplete)() : undefined
      );
    };

    if (delay > 0) {
      setTimeout(animateIn, delay);
    } else {
      animateIn();
    }
  }, [scale, opacity, to, delay, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }), []);

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
});

GPUScaleIn.displayName = 'GPUScaleIn';

interface GPUPulseProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  duration?: number;
}

export const GPUPulse = memo<GPUPulseProps>(({
  children,
  minScale = 1,
  maxScale = 1.05,
  duration = 1000,
}) => {
  const scale = useSharedValue(minScale);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: duration / 2 }),
        withTiming(minScale, { duration: duration / 2 })
      ),
      -1,
      false
    );
  }, [scale, minScale, maxScale, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }), []);

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
});

GPUPulse.displayName = 'GPUPulse';

interface GPUShimmerProps {
  width: number;
  height: number;
  colors?: string[];
  duration?: number;
}

export const GPUShimmer = memo<GPUShimmerProps>(({
  width,
  height,
  colors = ['#f0f0f0', '#e0e0e0', '#f0f0f0'],
  duration = 1500,
}) => {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width, { duration }),
      -1,
      false
    );
  }, [translateX, width, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }), []);

  return (
    <View style={[styles.shimmerContainer, { width, height }]}>
      <Animated.View
        style={[
          styles.shimmerGradient,
          { width, height },
          animatedStyle,
        ]}
      />
    </View>
  );
});

GPUShimmer.displayName = 'GPUShimmer';

interface GPUBouncyTouchProps {
  children: React.ReactNode;
  onPress?: () => void;
  scaleValue?: number;
  hapticFeedback?: boolean;
}

export const GPUBouncyTouch = memo<GPUBouncyTouchProps>(({
  children,
  onPress,
  scaleValue = 0.95,
  hapticFeedback = true,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      scale.value = withSpring(scaleValue, SPRING_CONFIG);
      opacity.value = withTiming(0.8, { duration: 100 });
    },
    onEnd: () => {
      scale.value = withSpring(1, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 100 });
      
      if (onPress) {
        runOnJS(onPress)();
      }
    },
    onCancel: () => {
      scale.value = withSpring(1, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 100 });
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }), []);

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
});

GPUBouncyTouch.displayName = 'GPUBouncyTouch';

interface GPUParallaxScrollProps {
  children: React.ReactNode;
  scrollY: Animated.SharedValue<number>;
  factor?: number;
}

export const GPUParallaxScroll = memo<GPUParallaxScrollProps>(({
  children,
  scrollY,
  factor = 0.5,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const translateY = scrollY.value * factor;
    return {
      transform: [{ translateY }],
    };
  }, [factor]);

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
});

GPUParallaxScroll.displayName = 'GPUParallaxScroll';

interface GPUProgressBarProps {
  progress: Animated.SharedValue<number>;
  width: number;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  borderRadius?: number;
}

export const GPUProgressBar = memo<GPUProgressBarProps>(({
  progress,
  width,
  height = 4,
  backgroundColor = '#E0E0E0',
  progressColor = '#007AFF',
  borderRadius = 2,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const progressWidth = interpolate(
      progress.value,
      [0, 1],
      [0, width],
      Extrapolate.CLAMP
    );
    
    return {
      width: progressWidth,
    };
  }, [width]);

  return (
    <View
      style={[
        styles.progressBarContainer,
        { width, height, backgroundColor, borderRadius },
      ]}
    >
      <Animated.View
        style={[
          styles.progressBarFill,
          { height, backgroundColor: progressColor, borderRadius },
          animatedStyle,
        ]}
      />
    </View>
  );
});

GPUProgressBar.displayName = 'GPUProgressBar';

interface GPUFloatingActionButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  size?: number;
  backgroundColor?: string;
  shadowColor?: string;
}

export const GPUFloatingActionButton = memo<GPUFloatingActionButtonProps>(({
  children,
  onPress,
  size = 56,
  backgroundColor = '#007AFF',
  shadowColor = '#000000',
}) => {
  const scale = useSharedValue(1);
  const elevation = useSharedValue(8);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(0.9, SPRING_CONFIG);
      elevation.value = withTiming(12, { duration: 150 });
    },
    onEnd: () => {
      scale.value = withSpring(1, SPRING_CONFIG);
      elevation.value = withTiming(8, { duration: 150 });
      
      if (onPress) {
        runOnJS(onPress)();
      }
    },
    onCancel: () => {
      scale.value = withSpring(1, SPRING_CONFIG);
      elevation.value = withTiming(8, { duration: 150 });
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    elevation: elevation.value,
    shadowOpacity: interpolate(elevation.value, [8, 12], [0.3, 0.5]),
  }), []);

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View
        style={[
          styles.fab,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
            shadowColor,
          },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
});

GPUFloatingActionButton.displayName = 'GPUFloatingActionButton';

const styles = StyleSheet.create({
  shimmerContainer: {
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  shimmerGradient: {
    backgroundColor: '#e0e0e0',
    opacity: 0.7,
  },
  progressBarContainer: {
    overflow: 'hidden',
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
});

// Components are already exported inline above

// Performance utility functions
export const createOptimizedAnimation = {
  fadeIn: (delay = 0, duration = 300) => ({
    delay,
    duration,
    from: 0,
    to: 1,
  }),
  
  slideIn: (direction: 'left' | 'right' | 'up' | 'down' = 'right', distance = 50) => ({
    direction,
    distance,
  }),
  
  scaleIn: (from = 0.3, to = 1) => ({
    from,
    to,
  }),
  
  spring: (toValue: number, config = SPRING_CONFIG) => ({
    toValue,
    config,
  }),
  
  timing: (toValue: number, duration = 300) => ({
    toValue,
    duration,
  }),
};