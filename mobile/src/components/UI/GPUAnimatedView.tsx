import React, { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS,
  ReduceMotion
} from 'react-native-reanimated';
import { usePerformanceMonitor } from '../../services/PerformanceMonitor';

interface GPUAnimatedViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'rotate' | 'bounce' | 'pulse';
  duration?: number;
  delay?: number;
  loop?: boolean;
  onAnimationComplete?: () => void;
  onAnimationStart?: () => void;
  testID?: string;
}

const GPUAnimatedView: React.FC<GPUAnimatedViewProps> = ({
  children,
  style,
  animation = 'fadeIn',
  duration = 300,
  delay = 0,
  loop = false,
  onAnimationComplete,
  onAnimationStart,
  testID
}) => {
  const performanceMonitor = usePerformanceMonitor();
  
  // Shared values for GPU-optimized animations
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  
  // Animation configuration for optimal performance
  const springConfig = useMemo(() => ({
    damping: 20,
    stiffness: 200,
    mass: 1,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
    reduceMotion: ReduceMotion.System,
  }), []);

  const timingConfig = useMemo(() => ({
    duration,
    reduceMotion: ReduceMotion.System,
  }), [duration]);

  // Initialize animation values based on type
  React.useEffect(() => {
    const startTime = Date.now();
    
    // Track animation start
    if (onAnimationStart) {
      runOnJS(onAnimationStart)();
    }

    performanceMonitor.startTiming(`gpu_animation_${animation}`);

    const animationCompleteCallback = () => {
      performanceMonitor.endTiming(`gpu_animation_${animation}`, 'navigation', {
        animationType: animation,
        duration: Date.now() - startTime,
        loop
      });
      
      if (onAnimationComplete) {
        runOnJS(onAnimationComplete)();
      }
    };

    // Set initial values and start animations
    const startAnimation = () => {
      switch (animation) {
        case 'fadeIn':
          opacity.value = withTiming(1, timingConfig, loop ? undefined : animationCompleteCallback);
          break;
          
        case 'slideUp':
          translateY.value = 50;
          opacity.value = 0;
          translateY.value = withSpring(0, springConfig);
          opacity.value = withTiming(1, timingConfig, animationCompleteCallback);
          break;
          
        case 'slideDown':
          translateY.value = -50;
          opacity.value = 0;
          translateY.value = withSpring(0, springConfig);
          opacity.value = withTiming(1, timingConfig, animationCompleteCallback);
          break;
          
        case 'slideLeft':
          translateX.value = 50;
          opacity.value = 0;
          translateX.value = withSpring(0, springConfig);
          opacity.value = withTiming(1, timingConfig, animationCompleteCallback);
          break;
          
        case 'slideRight':
          translateX.value = -50;
          opacity.value = 0;
          translateX.value = withSpring(0, springConfig);
          opacity.value = withTiming(1, timingConfig, animationCompleteCallback);
          break;        case 'scale':
          scale.value = 0.8;
          opacity.value = 0;
          scale.value = withSpring(1, springConfig);
          opacity.value = withTiming(1, timingConfig, animationCompleteCallback);
          break;
          
        case 'rotate':
          rotate.value = withRepeat(
            withTiming(360, { duration: duration * 2 }),
            loop ? -1 : 1,
            false,
            animationCompleteCallback
          );
          opacity.value = withTiming(1, timingConfig);
          break;
          
        case 'bounce':
          translateY.value = withRepeat(
            withSequence(
              withTiming(-20, { duration: duration / 3 }),
              withTiming(0, { duration: duration / 3 }),
              withTiming(-10, { duration: duration / 6 }),
              withTiming(0, { duration: duration / 6 })
            ),
            loop ? -1 : 1,
            false,
            animationCompleteCallback
          );
          opacity.value = withTiming(1, timingConfig);
          break;
          
        case 'pulse':
          scale.value = withRepeat(
            withSequence(
              withTiming(1.1, { duration: duration / 2 }),
              withTiming(1, { duration: duration / 2 })
            ),
            loop ? -1 : 3,
            true,
            animationCompleteCallback
          );
          opacity.value = withTiming(1, timingConfig);
          break;
          
        default:
          opacity.value = withTiming(1, timingConfig, animationCompleteCallback);
          break;
      }
    };

    // Apply delay if specified
    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      return () => clearTimeout(timer);
    } else {
      startAnimation();
    }
  }, [animation, duration, delay, loop, onAnimationComplete, onAnimationStart, opacity, performanceMonitor, rotate, scale, springConfig, timingConfig, translateX, translateY]);

  // GPU-optimized animated style
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { 
          rotate: interpolate(
            rotate.value,
            [0, 360],
            [0, 360],
            Extrapolate.CLAMP
          ) + 'deg'
        },
      ],
    };
  }, []);

  return (
    <Animated.View
      style={[style, animatedStyle]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
};

export default React.memo(GPUAnimatedView);