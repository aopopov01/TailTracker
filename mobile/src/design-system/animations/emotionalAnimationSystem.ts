/**
 * TailTracker Emotional Animation System
 * 
 * State-of-the-art animation system that creates emotional connections between
 * pets and their humans through intelligent, responsive motion design.
 * 
 * Built with React Native Reanimated 3 for 60fps performance and emotional intelligence.
 */

import React from 'react';
import { Haptics } from 'expo-haptics';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import { tailTrackerMotions } from './motionSystem';

// ====================================
// EMOTIONAL ANIMATION TYPES
// ====================================

export type EmotionalState = 
  | 'happy' | 'excited' | 'calm' | 'sleepy' 
  | 'playful' | 'anxious' | 'curious' | 'loving';

export type PetPersonality = 
  | 'energetic' | 'gentle' | 'playful' | 'calm' 
  | 'anxious' | 'confident' | 'social' | 'independent';

export type AnimationIntensity = 'subtle' | 'moderate' | 'enthusiastic' | 'celebration';

export interface EmotionalAnimationConfig {
  emotion: EmotionalState;
  personality?: PetPersonality;
  intensity?: AnimationIntensity;
  context?: 'success' | 'failure' | 'neutral' | 'discovery';
  hapticFeedback?: boolean;
  reducedMotion?: boolean;
}

// ====================================
// PET PERSONALITY ANIMATIONS
// ====================================

/**
 * Pet Tail Wagging Animation System
 * Different tail wag patterns based on emotional state and personality
 */
export const useTailWagAnimation = (config: EmotionalAnimationConfig) => {
  const rotation = useSharedValue(0);
  
  const getWagPattern = () => {
    const { emotion, personality, intensity = 'moderate' } = config;
    
    const baseSpeed = {
      subtle: 800,
      moderate: 600,
      enthusiastic: 400,
      celebration: 300,
    }[intensity];

    const baseRotation = {
      subtle: 15,
      moderate: 25,
      enthusiastic: 35,
      celebration: 45,
    }[intensity];

    // Emotional modulation
    const emotionalModifiers = {
      happy: { speed: 0.9, rotation: 1.1 },
      excited: { speed: 0.7, rotation: 1.3 },
      calm: { speed: 1.3, rotation: 0.8 },
      sleepy: { speed: 2.0, rotation: 0.5 },
      playful: { speed: 0.6, rotation: 1.2 },
      anxious: { speed: 0.8, rotation: 0.9 },
      curious: { speed: 1.0, rotation: 1.0 },
      loving: { speed: 1.1, rotation: 1.1 },
    }[emotion];

    // Personality fine-tuning
    const personalityModifiers = personality ? {
      energetic: { speed: 0.8, rotation: 1.2 },
      gentle: { speed: 1.2, rotation: 0.9 },
      playful: { speed: 0.7, rotation: 1.3 },
      calm: { speed: 1.4, rotation: 0.8 },
      anxious: { speed: 0.9, rotation: 0.8 },
      confident: { speed: 0.8, rotation: 1.1 },
      social: { speed: 0.9, rotation: 1.0 },
      independent: { speed: 1.1, rotation: 0.9 },
    }[personality] : { speed: 1, rotation: 1 };

    return {
      duration: baseSpeed * emotionalModifiers.speed * personalityModifiers.speed,
      rotation: baseRotation * emotionalModifiers.rotation * personalityModifiers.rotation,
    };
  };

  const startWagging = () => {
    const { duration, rotation: maxRotation } = getWagPattern();
    
    if (config.hapticFeedback) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }

    rotation.value = withRepeat(
      withSequence(
        withTiming(maxRotation, { 
          duration: duration / 2, 
          easing: Easing.bezier(0.68, 0.12, 0.265, 1.55) 
        }),
        withTiming(-maxRotation, { 
          duration: duration, 
          easing: Easing.bezier(0.68, 0.12, 0.265, 1.55) 
        }),
        withTiming(0, { 
          duration: duration / 2, 
          easing: Easing.bezier(0.68, 0.12, 0.265, 1.55) 
        })
      ),
      -1, // Infinite repeat
      false
    );
  };

  const stopWagging = () => {
    rotation.value = withTiming(0, {
      duration: tailTrackerMotions.durations.standard,
      easing: tailTrackerMotions.easing.natural,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return { animatedStyle, startWagging, stopWagging };
};

/**
 * Pet Breathing Animation
 * Subtle breathing effect for sleeping or calm pets
 */
export const useBreathingAnimation = (isActive: boolean, emotion: EmotionalState = 'calm') => {
  const scale = useSharedValue(1);
  
  const breathingPatterns = {
    calm: { min: 0.98, max: 1.02, duration: 3000 },
    sleepy: { min: 0.99, max: 1.01, duration: 4000 },
    anxious: { min: 0.97, max: 1.03, duration: 2000 },
    happy: { min: 0.98, max: 1.02, duration: 2500 },
    excited: { min: 0.96, max: 1.04, duration: 1500 },
    playful: { min: 0.97, max: 1.03, duration: 2200 },
    curious: { min: 0.98, max: 1.02, duration: 2800 },
    loving: { min: 0.99, max: 1.01, duration: 3500 },
  };

  const pattern = breathingPatterns[emotion];

  React.useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(pattern.max, {
            duration: pattern.duration / 2,
            easing: Easing.bezier(0.37, 0, 0.63, 1), // Ease in-out
          }),
          withTiming(pattern.min, {
            duration: pattern.duration / 2,
            easing: Easing.bezier(0.37, 0, 0.63, 1),
          })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, {
        duration: tailTrackerMotions.durations.comfortable,
        easing: tailTrackerMotions.easing.natural,
      });
    }
  }, [isActive, emotion, pattern.duration, pattern.max, pattern.min, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
};

/**
 * Pet Eye Blinking Animation
 * Natural blinking patterns with emotional variation
 */
export const useBlinkingAnimation = (emotion: EmotionalState = 'calm') => {
  const opacity = useSharedValue(1);
  
  const blinkPatterns = {
    calm: { interval: 4000, blinkDuration: 150 },
    sleepy: { interval: 2000, blinkDuration: 300 },
    excited: { interval: 6000, blinkDuration: 100 },
    happy: { interval: 5000, blinkDuration: 120 },
    anxious: { interval: 3000, blinkDuration: 180 },
    playful: { interval: 5500, blinkDuration: 110 },
    curious: { interval: 4500, blinkDuration: 140 },
    loving: { interval: 6500, blinkDuration: 200 },
  };

  const pattern = blinkPatterns[emotion];

  React.useEffect(() => {
    const blink = () => {
      opacity.value = withSequence(
        withTiming(0.1, { duration: pattern.blinkDuration / 2 }),
        withTiming(1, { duration: pattern.blinkDuration / 2 })
      );
    };

    const interval = setInterval(() => {
      runOnJS(blink)();
    }, pattern.interval);

    return () => clearInterval(interval);
  }, [emotion, pattern.interval, pattern.blinkDuration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return animatedStyle;
};

/**
 * Pet Head Tilt Animation
 * Curious head tilting behavior
 */
export const useHeadTiltAnimation = () => {
  const rotation = useSharedValue(0);
  
  const tilt = (direction: 'left' | 'right' = 'right') => {
    const angle = direction === 'right' ? 8 : -8;
    
    rotation.value = withSequence(
      withTiming(angle, {
        duration: tailTrackerMotions.durations.standard,
        easing: tailTrackerMotions.easing.caring,
      }),
      withDelay(800, withTiming(0, {
        duration: tailTrackerMotions.durations.comfortable,
        easing: tailTrackerMotions.easing.natural,
      }))
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return { animatedStyle, tilt };
};

/**
 * Playful Bounce Animation
 * Energetic bouncing for playful moments
 */
export const usePlayfulBounceAnimation = (config: EmotionalAnimationConfig) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  
  const bounce = () => {
    const { intensity = 'moderate', hapticFeedback } = config;
    
    const bounceHeight = {
      subtle: -8,
      moderate: -12,
      enthusiastic: -18,
      celebration: -25,
    }[intensity];

    const scaleAmount = {
      subtle: 1.02,
      moderate: 1.05,
      enthusiastic: 1.08,
      celebration: 1.12,
    }[intensity];

    if (hapticFeedback) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    }

    translateY.value = withSequence(
      withTiming(bounceHeight, {
        duration: tailTrackerMotions.durations.quick,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(0, {
        duration: tailTrackerMotions.durations.standard,
        easing: Easing.bounce,
      })
    );

    scale.value = withSequence(
      withTiming(scaleAmount, {
        duration: tailTrackerMotions.durations.quick,
        easing: tailTrackerMotions.easing.easeOut,
      }),
      withTiming(1, {
        duration: tailTrackerMotions.durations.standard,
        easing: tailTrackerMotions.easing.bounce,
      })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return { animatedStyle, bounce };
};

/**
 * Heart Eyes Animation
 * Special animation for love/affection moments
 */
export const useHeartEyesAnimation = () => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  
  const showHeartEyes = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Heart appearance
    scale.value = withSequence(
      withTiming(1.3, {
        duration: tailTrackerMotions.durations.quick,
        easing: tailTrackerMotions.easing.bounce,
      }),
      withTiming(1, {
        duration: tailTrackerMotions.durations.instant,
        easing: tailTrackerMotions.easing.easeOut,
      })
    );

    opacity.value = withTiming(1, {
      duration: tailTrackerMotions.durations.quick,
      easing: tailTrackerMotions.easing.easeOut,
    });

    // Gentle floating animation
    rotation.value = withRepeat(
      withSequence(
        withTiming(5, {
          duration: 1500,
          easing: Easing.bezier(0.45, 0, 0.55, 1),
        }),
        withTiming(-5, {
          duration: 1500,
          easing: Easing.bezier(0.45, 0, 0.55, 1),
        })
      ),
      -1,
      false
    );

    // Auto-hide after 3 seconds
    setTimeout(() => {
      hideHeartEyes();
    }, 3000);
  };

  const hideHeartEyes = () => {
    opacity.value = withTiming(0, {
      duration: tailTrackerMotions.durations.standard,
      easing: tailTrackerMotions.easing.easeIn,
    });
    
    scale.value = withTiming(0.8, {
      duration: tailTrackerMotions.durations.standard,
      easing: tailTrackerMotions.easing.easeIn,
    });

    rotation.value = withTiming(0, {
      duration: tailTrackerMotions.durations.standard,
      easing: tailTrackerMotions.easing.natural,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return { animatedStyle, showHeartEyes, hideHeartEyes };
};

// ====================================
// EXPORT COMPLETE PET ANIMATION SYSTEM
// ====================================

export const petAnimations = {
  useTailWagAnimation,
  useBreathingAnimation,
  useBlinkingAnimation,
  useHeadTiltAnimation,
  usePlayfulBounceAnimation,
  useHeartEyesAnimation,
} as const;

export default petAnimations;