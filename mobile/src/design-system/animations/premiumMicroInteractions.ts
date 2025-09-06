/**
 * TailTracker Premium Micro-Interactions
 * 
 * Sophisticated micro-interactions that create premium feel and emotional
 * connection. Every interaction tells a story and strengthens the bond.
 * 
 * Features:
 * - Gesture-driven premium interactions
 * - Context-aware emotional responses
 * - Performance-optimized 60fps animations
 * - Haptic feedback coordination
 * - Accessibility-friendly alternatives
 */

import React, { useEffect, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { Haptics } from 'expo-haptics';
import {
  Gesture,
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
} from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
  useDerivedValue,
  cancelAnimation,
} from 'react-native-reanimated';
import { tailTrackerMotions } from './motionSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ====================================
// PREMIUM BUTTON INTERACTIONS
// ====================================

/**
 * Premium Button with Context-Aware Animation
 * Responds to user emotion and success/failure states
 */
export const usePremiumButtonAnimation = (
  isLoading: boolean = false,
  isSuccess: boolean = false,
  isError: boolean = false,
  variant: 'primary' | 'secondary' | 'premium' = 'primary'
) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const backgroundProgress = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const shadowElevation = useSharedValue(2);

  // Premium variant has enhanced animations
  const isPremium = variant === 'premium';

  // Press gesture with sophisticated feedback
  const pressGesture = Gesture.Tap()
    .onBegin(() => {
      'worklet';
      // Immediate tactile feedback
      runOnJS(Haptics.impactAsync)(
        isPremium ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
      
      scale.value = withTiming(isPremium ? 0.92 : 0.95, {
        duration: tailTrackerMotions.durations.instant,
        easing: tailTrackerMotions.easing.easeOut,
      });

      shadowElevation.value = withTiming(isPremium ? 8 : 4, {
        duration: tailTrackerMotions.durations.instant,
        easing: tailTrackerMotions.easing.easeOut,
      });
    })
    .onFinalize(() => {
      'worklet';
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
        mass: 0.8,
      });

      shadowElevation.value = withTiming(2, {
        duration: tailTrackerMotions.durations.standard,
        easing: tailTrackerMotions.easing.easeOut,
      });
    });

  // Loading state animation
  useEffect(() => {
    if (isLoading) {
      iconRotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      // Subtle breathing effect while loading
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, {
            duration: 800,
            easing: tailTrackerMotions.easing.easeInOut,
          }),
          withTiming(0.98, {
            duration: 800,
            easing: tailTrackerMotions.easing.easeInOut,
          })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(iconRotation);
      iconRotation.value = withTiming(0, {
        duration: tailTrackerMotions.durations.standard,
        easing: tailTrackerMotions.easing.easeOut,
      });

      scale.value = withTiming(1, {
        duration: tailTrackerMotions.durations.standard,
        easing: tailTrackerMotions.easing.natural,
      });
    }
  }, [isLoading, iconRotation, scale]);

  // Success celebration animation
  useEffect(() => {
    if (isSuccess) {
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
      
      // Success burst animation
      scale.value = withSequence(
        withTiming(1.1, {
          duration: tailTrackerMotions.durations.quick,
          easing: tailTrackerMotions.easing.easeOut,
        }),
        withTiming(1, {
          duration: tailTrackerMotions.durations.standard,
          easing: tailTrackerMotions.easing.bounce,
        })
      );

      backgroundProgress.value = withSequence(
        withTiming(1, {
          duration: tailTrackerMotions.durations.comfortable,
          easing: tailTrackerMotions.easing.easeOut,
        }),
        withDelay(1000, withTiming(0, {
          duration: tailTrackerMotions.durations.standard,
          easing: tailTrackerMotions.easing.easeIn,
        }))
      );
    }
  }, [isSuccess, backgroundProgress, scale]);

  // Error shake animation
  useEffect(() => {
    if (isError) {
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Error);
      
      // Gentle error indication (not jarring)
      scale.value = withSequence(
        withTiming(0.98, {
          duration: tailTrackerMotions.durations.instant,
          easing: tailTrackerMotions.easing.easeOut,
        }),
        withTiming(1.02, {
          duration: tailTrackerMotions.durations.quick,
          easing: tailTrackerMotions.easing.easeOut,
        }),
        withTiming(1, {
          duration: tailTrackerMotions.durations.standard,
          easing: tailTrackerMotions.easing.natural,
        })
      );
    }
  }, [isError, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${iconRotation.value}deg` }
    ],
    opacity: opacity.value,
    shadowOpacity: isPremium ? shadowElevation.value * 0.15 : shadowElevation.value * 0.1,
    elevation: shadowElevation.value,
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundProgress.value * 0.2,
    transform: [{ scale: backgroundProgress.value }],
  }));

  return { animatedStyle, backgroundAnimatedStyle, pressGesture };
};

// ====================================
// CARD INTERACTIONS
// ====================================

/**
 * Pet Card with Rich Interactions
 * Responds to touch with personality-based animations
 */
export const usePetCardAnimation = (
  petPersonality: 'energetic' | 'gentle' | 'playful' | 'calm' = 'gentle'
) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.1);
  const borderGlow = useSharedValue(0);

  // Personality-based hover responses
  const personalityAnimations = {
    energetic: {
      scale: 1.05,
      translateY: -8,
      rotation: 2,
      shadowOpacity: 0.25,
      duration: tailTrackerMotions.durations.quick,
    },
    gentle: {
      scale: 1.02,
      translateY: -4,
      rotation: 0,
      shadowOpacity: 0.15,
      duration: tailTrackerMotions.durations.standard,
    },
    playful: {
      scale: 1.04,
      translateY: -6,
      rotation: 1,
      shadowOpacity: 0.2,
      duration: tailTrackerMotions.durations.quick,
    },
    calm: {
      scale: 1.01,
      translateY: -2,
      rotation: 0,
      shadowOpacity: 0.12,
      duration: tailTrackerMotions.durations.comfortable,
    },
  };

  const animation = personalityAnimations[petPersonality];

  // Touch gesture with personality response
  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      'worklet';
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      
      scale.value = withTiming(0.98, {
        duration: tailTrackerMotions.durations.instant,
        easing: tailTrackerMotions.easing.easeOut,
      });
    })
    .onFinalize(() => {
      'worklet';
      scale.value = withSpring(animation.scale, {
        damping: 15,
        stiffness: 300,
      });

      translateY.value = withSpring(animation.translateY, {
        damping: 15,
        stiffness: 300,
      });

      rotation.value = withSpring(animation.rotation, {
        damping: 15,
        stiffness: 300,
      });

      shadowOpacity.value = withTiming(animation.shadowOpacity, {
        duration: animation.duration,
        easing: tailTrackerMotions.easing.easeOut,
      });

      borderGlow.value = withTiming(1, {
        duration: animation.duration,
        easing: tailTrackerMotions.easing.easeOut,
      });

      // Reset after hover
      setTimeout(() => {
        'worklet';
        scale.value = withSpring(1);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
        shadowOpacity.value = withTiming(0.1);
        borderGlow.value = withTiming(0);
      }, 2000);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    shadowOpacity: shadowOpacity.value,
    borderWidth: interpolate(borderGlow.value, [0, 1], [0, 2]),
    borderColor: `rgba(59, 130, 246, ${borderGlow.value * 0.6})`, // Blue glow
  }));

  return { animatedStyle, tapGesture };
};

// ====================================
// NAVIGATION TRANSITIONS
// ====================================

/**
 * Emotional Navigation Transitions
 * Context-aware transitions that maintain emotional flow
 */
export const useEmotionalTransition = (
  transitionType: 'discovery' | 'success' | 'exploration' | 'return' = 'exploration'
) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const transitionConfigs = {
    discovery: {
      // Curious, exploratory entrance
      enter: {
        from: { translateX: SCREEN_WIDTH * 0.3, scale: 0.9, opacity: 0 },
        to: { translateX: 0, scale: 1, opacity: 1 },
        duration: tailTrackerMotions.durations.graceful,
        easing: tailTrackerMotions.easing.caring,
      },
      exit: {
        to: { translateX: -SCREEN_WIDTH * 0.3, scale: 0.9, opacity: 0 },
        duration: tailTrackerMotions.durations.standard,
        easing: tailTrackerMotions.easing.easeIn,
      },
    },
    success: {
      // Celebratory entrance
      enter: {
        from: { translateX: 0, scale: 0.8, opacity: 0 },
        to: { translateX: 0, scale: 1, opacity: 1 },
        duration: tailTrackerMotions.durations.celebration,
        easing: tailTrackerMotions.easing.bounce,
      },
      exit: {
        to: { translateX: 0, scale: 1.1, opacity: 0 },
        duration: tailTrackerMotions.durations.standard,
        easing: tailTrackerMotions.easing.easeIn,
      },
    },
    exploration: {
      // Natural, flowing movement
      enter: {
        from: { translateX: SCREEN_WIDTH, scale: 0.95, opacity: 0.8 },
        to: { translateX: 0, scale: 1, opacity: 1 },
        duration: tailTrackerMotions.durations.standard,
        easing: tailTrackerMotions.easing.natural,
      },
      exit: {
        to: { translateX: -SCREEN_WIDTH, scale: 0.95, opacity: 0.8 },
        duration: tailTrackerMotions.durations.standard,
        easing: tailTrackerMotions.easing.natural,
      },
    },
    return: {
      // Comfortable return home
      enter: {
        from: { translateX: -SCREEN_WIDTH, scale: 0.95, opacity: 0.8 },
        to: { translateX: 0, scale: 1, opacity: 1 },
        duration: tailTrackerMotions.durations.comfortable,
        easing: tailTrackerMotions.easing.trustworthy,
      },
      exit: {
        to: { translateX: SCREEN_WIDTH, scale: 0.95, opacity: 0.8 },
        duration: tailTrackerMotions.durations.comfortable,
        easing: tailTrackerMotions.easing.trustworthy,
      },
    },
  };

  const config = transitionConfigs[transitionType];

  const enter = useCallback(() => {
    const { from, to, duration, easing } = config.enter;
    
    // Set initial state
    translateX.value = from.translateX;
    scale.value = from.scale;
    opacity.value = from.opacity;

    // Animate to final state
    translateX.value = withTiming(to.translateX, { duration, easing });
    scale.value = withTiming(to.scale, { duration, easing });
    opacity.value = withTiming(to.opacity, { duration, easing });
  }, [config.enter, opacity, scale, translateX]);

  const exit = useCallback(() => {
    const { to, duration, easing } = config.exit;
    
    translateX.value = withTiming(to.translateX, { duration, easing });
    scale.value = withTiming(to.scale, { duration, easing });
    opacity.value = withTiming(to.opacity, { duration, easing });
  }, [config.exit, opacity, scale, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return { animatedStyle, enter, exit };
};

// ====================================
// SUCCESS CELEBRATIONS
// ====================================

/**
 * Contextual Success Celebrations
 * Different celebration intensities based on achievement importance
 */
export const useSuccessCelebration = () => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const particles = useSharedValue(0);
  const heartScale = useSharedValue(0);

  const celebrate = (
    intensity: 'milestone' | 'achievement' | 'major_success' | 'daily_goal' = 'achievement'
  ) => {
    const celebrations = {
      daily_goal: {
        haptic: Haptics.ImpactFeedbackStyle.Light,
        scale: 1.05,
        rotation: 5,
        duration: tailTrackerMotions.durations.standard,
        particles: false,
      },
      achievement: {
        haptic: Haptics.ImpactFeedbackStyle.Medium,
        scale: 1.1,
        rotation: 10,
        duration: tailTrackerMotions.durations.comfortable,
        particles: true,
      },
      milestone: {
        haptic: Haptics.ImpactFeedbackStyle.Heavy,
        scale: 1.15,
        rotation: 15,
        duration: tailTrackerMotions.durations.celebration,
        particles: true,
      },
      major_success: {
        haptic: Haptics.NotificationFeedbackType.Success,
        scale: 1.2,
        rotation: 20,
        duration: tailTrackerMotions.durations.dramatic,
        particles: true,
      },
    };

    const config = celebrations[intensity];

    // Haptic feedback
    if (config.haptic === Haptics.NotificationFeedbackType.Success) {
      runOnJS(Haptics.notificationAsync)(config.haptic);
    } else {
      runOnJS(Haptics.impactAsync)(config.haptic as any);
    }

    // Main celebration animation
    scale.value = withSequence(
      withTiming(config.scale, {
        duration: config.duration * 0.3,
        easing: tailTrackerMotions.easing.easeOut,
      }),
      withTiming(1, {
        duration: config.duration * 0.7,
        easing: tailTrackerMotions.easing.bounce,
      })
    );

    rotation.value = withSequence(
      withTiming(config.rotation, {
        duration: config.duration * 0.4,
        easing: tailTrackerMotions.easing.easeOut,
      }),
      withTiming(-config.rotation * 0.5, {
        duration: config.duration * 0.3,
        easing: tailTrackerMotions.easing.easeInOut,
      }),
      withTiming(0, {
        duration: config.duration * 0.3,
        easing: tailTrackerMotions.easing.easeOut,
      })
    );

    // Particle effects for bigger celebrations
    if (config.particles) {
      particles.value = withSequence(
        withTiming(1, {
          duration: config.duration * 0.2,
          easing: tailTrackerMotions.easing.easeOut,
        }),
        withDelay(config.duration * 0.6, withTiming(0, {
          duration: config.duration * 0.2,
          easing: tailTrackerMotions.easing.easeIn,
        }))
      );
    }

    // Heart animation for milestones and major successes
    if (intensity === 'milestone' || intensity === 'major_success') {
      heartScale.value = withSequence(
        withDelay(config.duration * 0.3, withTiming(1.2, {
          duration: tailTrackerMotions.durations.quick,
          easing: tailTrackerMotions.easing.bounce,
        })),
        withTiming(1, {
          duration: tailTrackerMotions.durations.standard,
          easing: tailTrackerMotions.easing.easeOut,
        }),
        withDelay(1000, withTiming(0, {
          duration: tailTrackerMotions.durations.standard,
          easing: tailTrackerMotions.easing.easeIn,
        }))
      );
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const particleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: particles.value,
    transform: [{ scale: particles.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heartScale.value > 0 ? 1 : 0,
    transform: [{ scale: heartScale.value }],
  }));

  return {
    celebrate,
    animatedStyle,
    particleAnimatedStyle,
    heartAnimatedStyle,
  };
};

// ====================================
// LOADING STATES WITH PERSONALITY
// ====================================

/**
 * Personality-Driven Loading Animations
 * Loading states that reflect the app's caring personality
 */
export const usePersonalizedLoadingAnimation = (
  loadingType: 'searching' | 'processing' | 'uploading' | 'syncing' = 'processing'
) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const pawPosition = useSharedValue(0);

  useEffect(() => {
    const loadingAnimations = {
      searching: () => {
        // Gentle search animation - like a pet sniffing around
        scale.value = withRepeat(
          withSequence(
            withTiming(1.1, {
              duration: 800,
              easing: tailTrackerMotions.easing.easeInOut,
            }),
            withTiming(0.9, {
              duration: 800,
              easing: tailTrackerMotions.easing.easeInOut,
            })
          ),
          -1,
          true
        );
      },
      processing: () => {
        // Heartbeat-like processing
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, {
              duration: 600,
              easing: tailTrackerMotions.easing.easeOut,
            }),
            withTiming(1, {
              duration: 600,
              easing: tailTrackerMotions.easing.easeIn,
            })
          ),
          -1,
          false
        );
      },
      uploading: () => {
        // Paw prints walking animation
        pawPosition.value = withRepeat(
          withTiming(1, {
            duration: 1200,
            easing: Easing.linear,
          }),
          -1,
          false
        );
      },
      syncing: () => {
        // Gentle rotation like a pet turning its head
        rotation.value = withRepeat(
          withSequence(
            withTiming(10, {
              duration: 1000,
              easing: tailTrackerMotions.easing.easeInOut,
            }),
            withTiming(-10, {
              duration: 1000,
              easing: tailTrackerMotions.easing.easeInOut,
            }),
            withTiming(0, {
              duration: 1000,
              easing: tailTrackerMotions.easing.easeInOut,
            })
          ),
          -1,
          false
        );
      },
    };

    loadingAnimations[loadingType]();

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(scale);
      cancelAnimation(pawPosition);
    };
  }, [loadingType, pawPosition, rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const pawAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          pawPosition.value,
          [0, 0.25, 0.5, 0.75, 1],
          [0, 20, 40, 60, 80]
        ),
      },
    ],
    opacity: interpolate(
      pawPosition.value,
      [0, 0.2, 0.8, 1],
      [0.3, 1, 1, 0.3]
    ),
  }));

  return { animatedStyle, pawAnimatedStyle };
};

// ====================================
// EXPORT COMPLETE MICRO-INTERACTION SYSTEM
// ====================================

export const premiumMicroInteractions = {
  usePremiumButtonAnimation,
  usePetCardAnimation,
  useEmotionalTransition,
  useSuccessCelebration,
  usePersonalizedLoadingAnimation,
} as const;

export default premiumMicroInteractions;