// Premium animations for TailTracker design system
import { Animated, Easing } from 'react-native';

export interface PremiumAnimationConfig {
  duration?: number;
  easing?: (value: number) => number;
  delay?: number;
}

export class PremiumAnimations {
  // Page transition animations
  static pages = {
    transition: (type: string) => ({
      entering: {
        opacity: 1,
        translateX: 0,
        translateY: 0,
        scale: 1,
      },
      exiting: {
        opacity: 0,
        translateX: -100,
        translateY: 0,
        scale: 0.9,
      },
    }),
  };

  // Screen animations
  static screens = {
    modal: {
      entering: { scale: 1 },
      exiting: { scale: 0.9 },
    },
    tabSwitch: {
      entering: { opacity: 1, translateX: 0, scale: 1 },
      exiting: { opacity: 0, translateX: -50, scale: 0.95 },
      fadeOut: { opacity: 0, translateX: -50, scale: 0.95 },
      fadeIn: { opacity: 1, translateX: 0, scale: 1 },
      duration: 300,
    },
    heroTransition: {
      entering: { scale: 1, opacity: 1, translateY: 0 },
      exiting: { scale: 0.95, opacity: 0, translateY: 10 },
      to: { scale: 1, opacity: 1, translateY: 0 },
    },
  };

  // Button animations
  static buttons = {
    press: (intensity: number = 1) => ({
      pressIn: () => ({ scale: 0.95 * intensity }),
      pressOut: () => ({ scale: 1 }),
    }),
    ripple: (color: string = '#ffffff', intensity: number = 1) => ({
      scale: 1.5 * intensity,
      opacity: 0,
    }),
    release: { scale: 1, duration: 200 },
  };

  // Spring configurations
  static springs = {
    gentle: { tension: 120, friction: 14 },
    bouncy: { tension: 180, friction: 12 },
    smooth: { tension: 100, friction: 10 },
    crisp: { tension: 200, friction: 8 },
    playful: { tension: 300, friction: 10 },
  };

  // Timing configurations
  static timings = {
    quick: { duration: 150 },
    fast: { duration: 200 },
    normal: { duration: 300 },
    standard: { duration: 400 },
    comfortable: { duration: 450 },
    slow: { duration: 500 },
    celebration: { duration: 1200 },
  };

  // Success animations
  static success = {
    checkmark: () => ({
      scale: 1.2,
    }),
  };

  // Loading animations
  static loading = {
    shimmer: () => ({
      opacity: 0.5,
      translateX: 200,
    }),
    pulse: () => ({
      scale: 1.05,
      opacity: 0.8,
    }),
  };

  // Form animations
  static forms = {
    error: () => ({
      translateX: [-10, 10, -8, 8, -6, 6, -4, 4, 0],
    }),
    focus: () => ({
      borderWidth: 2,
      scale: 1.05,
      opacity: 1,
    }),
    floatingLabel: (focused: boolean = false, hasValue: boolean = false) => ({
      translateY: focused || hasValue ? -20 : 0,
      scale: focused || hasValue ? 0.8 : 1,
      opacity: focused || hasValue ? 0.8 : 0.6,
    }),
  };

  // Shimmer effect for premium features
  static createShimmerAnimation(
    animatedValue: Animated.Value,
    config: PremiumAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const { duration = 1500, easing = Easing.linear, delay = 0 } = config;

    return Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration,
          easing,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration,
          easing,
          useNativeDriver: false,
        }),
      ])
    );
  }

  // Gold glow effect
  static createGoldGlowAnimation(
    animatedValue: Animated.Value,
    config: PremiumAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = 2000,
      easing = Easing.inOut(Easing.sin),
      delay = 0,
    } = config;

    return Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration,
          easing,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration,
          easing,
          useNativeDriver: false,
        }),
      ])
    );
  }

  // Premium card entrance animation
  static createPremiumEntranceAnimation(
    scaleValue: Animated.Value,
    opacityValue: Animated.Value,
    config: PremiumAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = 600,
      easing = Easing.out(Easing.back(1.7)),
      delay = 0,
    } = config;

    return Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration,
        easing,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: duration * 0.8,
        delay: delay + duration * 0.2,
        useNativeDriver: false,
      }),
    ]);
  }

  // Pulse animation for premium badges
  static createPulseAnimation(
    animatedValue: Animated.Value,
    config: PremiumAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = 1000,
      easing = Easing.inOut(Easing.ease),
      delay = 0,
    } = config;

    return Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animatedValue, {
          toValue: 1.1,
          duration: duration / 2,
          easing,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration / 2,
          easing,
          useNativeDriver: false,
        }),
      ])
    );
  }
}

// Animation presets
export const premiumAnimationPresets = {
  shimmer: {
    duration: 1500,
    easing: Easing.linear,
  },
  goldGlow: {
    duration: 2000,
    easing: Easing.inOut(Easing.sin),
  },
  entrance: {
    duration: 600,
    easing: Easing.out(Easing.back(1.7)),
  },
  pulse: {
    duration: 1000,
    easing: Easing.inOut(Easing.ease),
  },
} as const;

export default PremiumAnimations;
