// Premium animations for TailTracker design system
import { Animated, Easing } from 'react-native';

export interface PremiumAnimationConfig {
  duration?: number;
  easing?: (value: number) => number;
  delay?: number;
}

export class PremiumAnimations {
  // Shimmer effect for premium features
  static createShimmerAnimation(
    animatedValue: Animated.Value,
    config: PremiumAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = 1500,
      easing = Easing.linear,
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

  // Gold glow effect
  static createGoldGlowAnimation(
    animatedValue: Animated.Value,
    config: PremiumAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = 2000,
      easing = Easing.inOut(Easing.sine),
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
    easing: Easing.inOut(Easing.sine),
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