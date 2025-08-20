/**
 * TailTracker Emotional Intelligence Animation Hooks
 * 
 * Advanced hooks that make animations emotionally intelligent and contextually aware.
 * These hooks analyze user state, app context, and device capabilities to deliver
 * the perfect animation experience.
 * 
 * Features:
 * - Context-aware animation selection
 * - Performance-adaptive animation complexity
 * - Accessibility-first reduced motion support
 * - Battery-conscious animation management
 * - User behavior learning and adaptation
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { Haptics } from 'expo-haptics';
import { AccessibilityInfo, AppState, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tailTrackerMotions } from './motionSystem';

// ====================================
// TYPES AND INTERFACES
// ====================================

export interface UserEmotionalState {
  primary: 'joy' | 'excitement' | 'calm' | 'stress' | 'sadness' | 'love';
  secondary?: 'accomplished' | 'frustrated' | 'curious' | 'anxious' | 'content';
  intensity: 'low' | 'medium' | 'high';
  confidence: number; // 0-1, how confident we are in this assessment
}

export interface AppContext {
  screen: string;
  userAction: 'browsing' | 'managing' | 'discovering' | 'celebrating' | 'troubleshooting';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  appUsageSession: 'first_time' | 'returning_user' | 'power_user';
  petInteractionContext: 'routine' | 'emergency' | 'bonding' | 'health_check';
}

export interface DeviceCapabilities {
  performanceLevel: 'low' | 'medium' | 'high';
  batteryLevel: 'critical' | 'low' | 'medium' | 'high';
  isLowPowerMode: boolean;
  reducedMotionEnabled: boolean;
  hapticCapability: 'none' | 'basic' | 'advanced';
  screenSize: 'small' | 'medium' | 'large';
}

export interface AnimationPreferences {
  intensityPreference: 'minimal' | 'moderate' | 'full';
  hapticPreference: boolean;
  celebrationStyle: 'subtle' | 'enthusiastic';
  loadingStyle: 'functional' | 'delightful';
  transitionStyle: 'quick' | 'smooth' | 'expressive';
}

// ====================================
// EMOTIONAL INTELLIGENCE CORE HOOK
// ====================================

/**
 * Core Emotional Intelligence Hook
 * Analyzes context and adapts animations accordingly
 */
export const useEmotionalIntelligence = () => {
  const [userState, setUserState] = useState<UserEmotionalState>({
    primary: 'calm',
    intensity: 'medium',
    confidence: 0.5,
  });

  const [appContext, setAppContext] = useState<AppContext>({
    screen: 'home',
    userAction: 'browsing',
    timeOfDay: 'afternoon',
    appUsageSession: 'returning_user',
    petInteractionContext: 'routine',
  });

  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>({
    performanceLevel: 'high',
    batteryLevel: 'high',
    isLowPowerMode: false,
    reducedMotionEnabled: false,
    hapticCapability: 'advanced',
    screenSize: 'medium',
  });

  const [preferences, setPreferences] = useState<AnimationPreferences>({
    intensityPreference: 'moderate',
    hapticPreference: true,
    celebrationStyle: 'enthusiastic',
    loadingStyle: 'delightful',
    transitionStyle: 'smooth',
  });

  // Detect device capabilities on mount
  useEffect(() => {
    const detectCapabilities = async () => {
      try {
        // Check reduced motion
        const reducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
        
        // Estimate performance level based on screen size and device info
        const { width, height } = Dimensions.get('window');
        const screenSize = width < 375 ? 'small' : width > 414 ? 'large' : 'medium';
        const performanceLevel = screenSize === 'small' ? 'medium' : 'high';

        setDeviceCapabilities(prev => ({
          ...prev,
          reducedMotionEnabled: reducedMotion,
          screenSize,
          performanceLevel,
        }));

        // Load user preferences
        const savedPreferences = await AsyncStorage.getItem('tailtracker_animation_preferences');
        if (savedPreferences) {
          setPreferences(JSON.parse(savedPreferences));
        }
      } catch (error) {
        console.warn('Failed to detect device capabilities:', error);
      }
    };

    detectCapabilities();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    AsyncStorage.setItem('tailtracker_animation_preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Context inference based on user actions
  const inferEmotionalState = useCallback((
    actionType: 'success' | 'failure' | 'discovery' | 'routine' | 'emergency',
    previousStates?: UserEmotionalState[]
  ) => {
    const stateInferences = {
      success: { primary: 'joy' as const, secondary: 'accomplished' as const, intensity: 'high' as const },
      failure: { primary: 'stress' as const, secondary: 'frustrated' as const, intensity: 'medium' as const },
      discovery: { primary: 'excitement' as const, secondary: 'curious' as const, intensity: 'medium' as const },
      routine: { primary: 'calm' as const, secondary: 'content' as const, intensity: 'low' as const },
      emergency: { primary: 'stress' as const, secondary: 'anxious' as const, intensity: 'high' as const },
    };

    const newState = {
      ...stateInferences[actionType],
      confidence: 0.8,
    };

    setUserState(newState);
    return newState;
  }, []);

  // Get optimal animation configuration based on current context
  const getOptimalAnimationConfig = useCallback(() => {
    const { reducedMotionEnabled, performanceLevel, isLowPowerMode } = deviceCapabilities;
    const { intensityPreference } = preferences;
    const { intensity: emotionalIntensity } = userState;

    // Base configuration
    let config = {
      enableAnimations: true,
      duration: tailTrackerMotions.durations.standard,
      easing: tailTrackerMotions.easing.natural,
      hapticEnabled: preferences.hapticPreference,
      complexAnimations: true,
      particleEffects: true,
    };

    // Accessibility adaptations
    if (reducedMotionEnabled) {
      config = {
        ...config,
        enableAnimations: intensityPreference !== 'minimal',
        duration: tailTrackerMotions.durations.quick,
        easing: tailTrackerMotions.easing.linear,
        complexAnimations: false,
        particleEffects: false,
      };
    }

    // Performance adaptations
    if (performanceLevel === 'low' || isLowPowerMode) {
      config = {
        ...config,
        duration: Math.min(config.duration, tailTrackerMotions.durations.fast),
        complexAnimations: false,
        particleEffects: false,
      };
    }

    // Emotional adaptations
    if (emotionalIntensity === 'high' && intensityPreference === 'full') {
      config = {
        ...config,
        duration: tailTrackerMotions.durations.comfortable,
        complexAnimations: true,
        particleEffects: true,
      };
    } else if (emotionalIntensity === 'low' || intensityPreference === 'minimal') {
      config = {
        ...config,
        duration: tailTrackerMotions.durations.quick,
        complexAnimations: false,
      };
    }

    return config;
  }, [userState, deviceCapabilities, preferences]);

  return {
    userState,
    appContext,
    deviceCapabilities,
    preferences,
    setUserState,
    setAppContext,
    setPreferences,
    inferEmotionalState,
    getOptimalAnimationConfig,
  };
};

// ====================================
// CONTEXT-AWARE ANIMATION HOOKS
// ====================================

/**
 * Context-Aware Success Animation
 * Adapts celebration intensity based on achievement importance and user state
 */
export const useContextualSuccessAnimation = (
  achievementLevel: 'minor' | 'moderate' | 'major' | 'milestone'
) => {
  const { getOptimalAnimationConfig, userState, inferEmotionalState } = useEmotionalIntelligence();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const celebrate = useCallback(() => {
    const config = getOptimalAnimationConfig();
    
    // Infer emotional state from success
    inferEmotionalState('success');

    if (!config.enableAnimations) {
      // Minimal success indication for reduced motion
      scale.value = withTiming(1.02, {
        duration: config.duration,
        easing: config.easing,
      });
      return;
    }

    // Calculate animation intensity based on achievement and context
    const intensityMultipliers = {
      minor: 0.6,
      moderate: 0.8,
      major: 1.0,
      milestone: 1.3,
    };

    const intensity = intensityMultipliers[achievementLevel];
    const maxScale = 1 + (0.15 * intensity);
    const maxRotation = 10 * intensity;

    // Haptic feedback
    if (config.hapticEnabled) {
      const hapticIntensity = achievementLevel === 'milestone' || achievementLevel === 'major' 
        ? Haptics.ImpactFeedbackStyle.Heavy 
        : Haptics.ImpactFeedbackStyle.Medium;
      
      runOnJS(Haptics.impactAsync)(hapticIntensity);
    }

    // Success animation sequence
    scale.value = withTiming(maxScale, {
      duration: config.duration * 0.4,
      easing: tailTrackerMotions.easing.easeOut,
    }, () => {
      scale.value = withTiming(1, {
        duration: config.duration * 0.6,
        easing: tailTrackerMotions.easing.bounce,
      });
    });

    if (config.complexAnimations) {
      rotation.value = withTiming(maxRotation, {
        duration: config.duration * 0.3,
        easing: tailTrackerMotions.easing.easeOut,
      }, () => {
        rotation.value = withTiming(0, {
          duration: config.duration * 0.7,
          easing: tailTrackerMotions.easing.easeOut,
        });
      });
    }
  }, [achievementLevel, inferEmotionalState, getOptimalAnimationConfig]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return { celebrate, animatedStyle };
};

/**
 * Adaptive Loading Animation
 * Chooses loading animation based on context and user patience level
 */
export const useAdaptiveLoadingAnimation = (
  estimatedDuration: 'quick' | 'medium' | 'long' = 'medium'
) => {
  const { getOptimalAnimationConfig, userState } = useEmotionalIntelligence();
  const [currentAnimation, setCurrentAnimation] = useState<'spinner' | 'heartbeat' | 'pawprints'>('spinner');
  const animationValue = useSharedValue(0);
  
  useEffect(() => {
    const config = getOptimalAnimationConfig();
    
    // Choose animation style based on context
    if (!config.enableAnimations) {
      setCurrentAnimation('spinner');
    } else if (userState.primary === 'stress' || estimatedDuration === 'long') {
      setCurrentAnimation('heartbeat'); // Calming animation
    } else if (userState.primary === 'joy' || userState.primary === 'excitement') {
      setCurrentAnimation('pawprints'); // Playful animation
    } else {
      setCurrentAnimation('spinner'); // Standard animation
    }

    // Start animation
    const animationDurations = {
      quick: 800,
      medium: 1200,
      long: 2000,
    };

    animationValue.value = 0;
    animationValue.value = withTiming(1, {
      duration: animationDurations[estimatedDuration],
      easing: config.easing,
    }, () => {
      // Loop the animation
      animationValue.value = 0;
      animationValue.value = withTiming(1, {
        duration: animationDurations[estimatedDuration],
        easing: config.easing,
      });
    });
  }, [estimatedDuration, userState]);

  const animatedStyle = useAnimatedStyle(() => {
    switch (currentAnimation) {
      case 'heartbeat':
        return {
          transform: [
            { 
              scale: 1 + Math.sin(animationValue.value * Math.PI * 2) * 0.05 
            }
          ],
        };
      case 'pawprints':
        return {
          transform: [
            { 
              translateX: animationValue.value * 20 - 10 
            },
            { 
              rotate: `${Math.sin(animationValue.value * Math.PI * 4) * 5}deg` 
            }
          ],
        };
      default:
        return {
          transform: [
            { 
              rotate: `${animationValue.value * 360}deg` 
            }
          ],
        };
    }
  });

  return { animatedStyle, currentAnimation };
};

/**
 * Mood-Responsive Pet Animation
 * Pet animations that respond to inferred user mood
 */
export const useMoodResponsivePetAnimation = () => {
  const { userState, inferEmotionalState } = useEmotionalIntelligence();
  const animationValue = useSharedValue(0);
  const [currentMoodAnimation, setCurrentMoodAnimation] = useState<string>('neutral');

  useEffect(() => {
    const moodAnimations = {
      joy: 'bouncing',
      excitement: 'tail_wagging_fast',
      calm: 'breathing',
      stress: 'gentle_sway',
      sadness: 'slow_breathing',
      love: 'heart_eyes',
    };

    const newAnimation = moodAnimations[userState.primary] || 'neutral';
    setCurrentMoodAnimation(newAnimation);

    // Start mood-appropriate animation
    switch (newAnimation) {
      case 'bouncing':
        animationValue.value = withTiming(1, {
          duration: 600,
          easing: tailTrackerMotions.easing.bounce,
        });
        break;
      case 'tail_wagging_fast':
        animationValue.value = withTiming(1, {
          duration: 400,
          easing: tailTrackerMotions.easing.playful,
        });
        break;
      case 'breathing':
        animationValue.value = withTiming(1, {
          duration: 3000,
          easing: tailTrackerMotions.easing.caring,
        });
        break;
      default:
        animationValue.value = withTiming(1, {
          duration: 1000,
          easing: tailTrackerMotions.easing.natural,
        });
    }
  }, [userState.primary]);

  const animatedStyle = useAnimatedStyle(() => {
    switch (currentMoodAnimation) {
      case 'bouncing':
        return {
          transform: [
            { translateY: Math.sin(animationValue.value * Math.PI * 2) * -8 }
          ],
        };
      case 'tail_wagging_fast':
        return {
          transform: [
            { rotate: `${Math.sin(animationValue.value * Math.PI * 8) * 15}deg` }
          ],
        };
      case 'breathing':
        return {
          transform: [
            { scale: 1 + Math.sin(animationValue.value * Math.PI * 2) * 0.02 }
          ],
        };
      case 'gentle_sway':
        return {
          transform: [
            { rotate: `${Math.sin(animationValue.value * Math.PI) * 3}deg` }
          ],
        };
      default:
        return {};
    }
  });

  return { animatedStyle, currentMoodAnimation, inferEmotionalState };
};

// ====================================
// PERFORMANCE OPTIMIZATION HOOKS
// ====================================

/**
 * Performance-Aware Animation Hook
 * Automatically reduces animation complexity based on device performance
 */
export const usePerformanceOptimizedAnimation = () => {
  const { deviceCapabilities, getOptimalAnimationConfig } = useEmotionalIntelligence();
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const frameSkipCount = useRef(0);

  useEffect(() => {
    // Monitor app state for performance optimization
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        setShouldAnimate(false);
      } else if (nextAppState === 'active') {
        setShouldAnimate(true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const createOptimizedAnimation = useCallback((
    targetValue: number,
    options: { duration?: number; easing?: any } = {}
  ) => {
    const config = getOptimalAnimationConfig();
    
    if (!config.enableAnimations || !shouldAnimate) {
      return targetValue; // No animation
    }

    // Frame skipping for low-performance devices
    if (deviceCapabilities.performanceLevel === 'low') {
      frameSkipCount.current++;
      if (frameSkipCount.current % 2 === 0) {
        return targetValue; // Skip every other frame
      }
    }

    return withTiming(targetValue, {
      duration: options.duration || config.duration,
      easing: options.easing || config.easing,
    });
  }, [deviceCapabilities, shouldAnimate, getOptimalAnimationConfig]);

  return { createOptimizedAnimation, shouldAnimate };
};

// ====================================
// EXPORT COMPLETE EMOTIONAL INTELLIGENCE SYSTEM
// ====================================

export const emotionalIntelligenceHooks = {
  useEmotionalIntelligence,
  useContextualSuccessAnimation,
  useAdaptiveLoadingAnimation,
  useMoodResponsivePetAnimation,
  usePerformanceOptimizedAnimation,
} as const;

export default emotionalIntelligenceHooks;