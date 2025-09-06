// Motion system for consistent animations across the app
import { Dimensions } from 'react-native';
import { withSpring, withTiming, withSequence, Easing } from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Animation presets
export const ANIMATION_CONFIGS = {
  // Spring animations
  spring: {
    default: {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    },
    bouncy: {
      damping: 12,
      stiffness: 400,
      mass: 1,
    },
    gentle: {
      damping: 25,
      stiffness: 200,
      mass: 1.2,
    },
  },
  
  // Timing animations  
  timing: {
    fast: {
      duration: 200,
      easing: Easing.out(Easing.quad),
    },
    normal: {
      duration: 300,
      easing: Easing.out(Easing.ease),
    },
    slow: {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    },
  },
};

// Common animation functions
export const createSpringAnimation = (config = ANIMATION_CONFIGS.spring.default) => {
  return (toValue: number) => withSpring(toValue, config);
};

export const createTimingAnimation = (config = ANIMATION_CONFIGS.timing.normal) => {
  return (toValue: number) => withTiming(toValue, config);
};

// Preset animations
export const fadeIn = (duration = 300) => withTiming(1, { duration });
export const fadeOut = (duration = 300) => withTiming(0, { duration });

export const slideInFromRight = (duration = 300) => 
  withTiming(0, { duration, easing: Easing.out(Easing.ease) });

export const slideInFromLeft = (duration = 300) => 
  withTiming(0, { duration, easing: Easing.out(Easing.ease) });

export const slideOutToRight = (duration = 300) => 
  withTiming(screenWidth, { duration, easing: Easing.in(Easing.ease) });

export const slideOutToLeft = (duration = 300) => 
  withTiming(-screenWidth, { duration, easing: Easing.in(Easing.ease) });

export const scaleIn = (duration = 300) => 
  withTiming(1, { duration, easing: Easing.out(Easing.back(1.5)) });

export const scaleOut = (duration = 300) => 
  withTiming(0, { duration, easing: Easing.in(Easing.ease) });

// Complex animations
export const pulseAnimation = (scale = 1.1) => {
  return withSequence(
    withTiming(scale, { duration: 150 }),
    withTiming(1, { duration: 150 })
  );
};

export const shakeAnimation = (intensity = 10) => {
  return withSequence(
    withTiming(-intensity, { duration: 50 }),
    withTiming(intensity, { duration: 50 }),
    withTiming(-intensity, { duration: 50 }),
    withTiming(intensity, { duration: 50 }),
    withTiming(0, { duration: 50 })
  );
};

// Layout animations
export const layoutTransition = {
  duration: 300,
  easing: Easing.out(Easing.ease),
};

// Motion values
export const createMotionValues = () => ({
  opacity: 0,
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotate: 0,
});

// Screen transitions
export const SCREEN_TRANSITIONS = {
  slideFromRight: {
    initial: { translateX: screenWidth },
    animate: { translateX: 0 },
    exit: { translateX: -screenWidth },
  },
  slideFromLeft: {
    initial: { translateX: -screenWidth },
    animate: { translateX: 0 },
    exit: { translateX: screenWidth },
  },
  fadeScale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  modal: {
    initial: { opacity: 0, scale: 0.9, translateY: 50 },
    animate: { opacity: 1, scale: 1, translateY: 0 },
    exit: { opacity: 0, scale: 0.9, translateY: 50 },
  },
};

export default {
  ANIMATION_CONFIGS,
  createSpringAnimation,
  createTimingAnimation,
  fadeIn,
  fadeOut,
  slideInFromRight,
  slideInFromLeft,
  slideOutToRight,
  slideOutToLeft,
  scaleIn,
  scaleOut,
  pulseAnimation,
  shakeAnimation,
  layoutTransition,
  createMotionValues,
  SCREEN_TRANSITIONS,
};