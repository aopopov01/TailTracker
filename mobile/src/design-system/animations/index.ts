/**
 * TailTracker Animation System - Main Export
 * 
 * Complete state-of-the-art animation system that creates emotional connections
 * through intelligent, responsive motion design.
 * 
 * This is the main entry point for all TailTracker animations.
 * Import what you need for maximum performance.
 * 
 * @example
 * ```typescript
 * // Import specific animations
 * import { useTailWagAnimation, useHeartEyesAnimation } from '@/design-system/animations';
 * 
 * // Import complete systems
 * import { petAnimations, premiumMicroInteractions } from '@/design-system/animations';
 * 
 * // Import emotional intelligence
 * import { useEmotionalIntelligence } from '@/design-system/animations';
 * ```
 */

// ====================================
// CORE MOTION SYSTEM
// ====================================

export {
  // Base motion system with timing and easing curves
  tailTrackerMotions,
  animationDurations,
  easingCurves,
  gestureAnimations,
  screenTransitions,
  componentAnimations,
  loadingAnimations,
  microInteractions,
  hapticAnimations,
  accessibilityAnimations,
} from './motionSystem';

// ====================================
// PET PERSONALITY ANIMATIONS
// ====================================

export {
  // Pet-specific animation hooks
  useTailWagAnimation,
  useBreathingAnimation,
  useBlinkingAnimation,
  useHeadTiltAnimation,
  usePlayfulBounceAnimation,
  useHeartEyesAnimation,
  
  // Complete pet animation system
  petAnimations,
  
  // Types for emotional animations
  type EmotionalState,
  type PetPersonality,
  type AnimationIntensity,
  type EmotionalAnimationConfig,
} from './emotionalAnimationSystem';

// ====================================
// PREMIUM MICRO-INTERACTIONS
// ====================================

export {
  // Premium interface animations
  usePremiumButtonAnimation,
  usePetCardAnimation,
  useEmotionalTransition,
  useSuccessCelebration,
  usePersonalizedLoadingAnimation,
  
  // Complete micro-interaction system
  premiumMicroInteractions,
} from './premiumMicroInteractions';

// ====================================
// EMOTIONAL INTELLIGENCE
// ====================================

export {
  // Core emotional intelligence hook
  useEmotionalIntelligence,
  
  // Context-aware animation hooks
  useContextualSuccessAnimation,
  useAdaptiveLoadingAnimation,
  useMoodResponsivePetAnimation,
  usePerformanceOptimizedAnimation,
  
  // Complete emotional intelligence system
  emotionalIntelligenceHooks,
  
  // Types for emotional intelligence
  type UserEmotionalState,
  type AppContext,
  type DeviceCapabilities,
  type AnimationPreferences,
} from './emotionalIntelligenceHooks';

// ====================================
// PERFORMANCE MONITORING
// ====================================

export {
  // Performance monitoring hooks
  useAnimationPerformanceMonitor,
  useAnimationProfiler,
  usePerformanceOptimization,
  usePerformanceOverlay,
  
  // Performance monitoring core
  AnimationPerformanceMonitor,
  
  // Complete performance system
  performanceMonitoring,
  
  // Types for performance monitoring
  type PerformanceMetrics,
  type AnimationProfile,
  type PerformanceAlert,
} from './performanceMonitoring';

// ====================================
// USAGE EXAMPLES
// ====================================

export {
  // Complete example components
  AnimatedPetCard,
  PetCardUsageExample,
} from './examples/PetCardExample';

export {
  AnimatedOnboarding,
} from './examples/OnboardingExample';

export {
  AnimatedNavigation,
} from './examples/NavigationExample';

// ====================================
// COMPLETE ANIMATION SYSTEM
// ====================================

/**
 * Complete TailTracker Animation System
 * 
 * This is the main animation system object that contains all
 * animation configurations, hooks, and utilities organized
 * by category for easy access.
 */
export const TailTrackerAnimations = {
  // Core motion system
  motion: {
    durations: require('./motionSystem').animationDurations,
    easing: require('./motionSystem').easingCurves,
    gestures: require('./motionSystem').gestureAnimations,
    screens: require('./motionSystem').screenTransitions,
    components: require('./motionSystem').componentAnimations,
    loading: require('./motionSystem').loadingAnimations,
    micro: require('./motionSystem').microInteractions,
    haptic: require('./motionSystem').hapticAnimations,
    accessibility: require('./motionSystem').accessibilityAnimations,
  },
  
  // Pet personality animations
  pets: {
    useTailWagAnimation: require('./emotionalAnimationSystem').useTailWagAnimation,
    useBreathingAnimation: require('./emotionalAnimationSystem').useBreathingAnimation,
    useBlinkingAnimation: require('./emotionalAnimationSystem').useBlinkingAnimation,
    useHeadTiltAnimation: require('./emotionalAnimationSystem').useHeadTiltAnimation,
    usePlayfulBounceAnimation: require('./emotionalAnimationSystem').usePlayfulBounceAnimation,
    useHeartEyesAnimation: require('./emotionalAnimationSystem').useHeartEyesAnimation,
  },
  
  // Premium micro-interactions
  premium: {
    usePremiumButtonAnimation: require('./premiumMicroInteractions').usePremiumButtonAnimation,
    usePetCardAnimation: require('./premiumMicroInteractions').usePetCardAnimation,
    useEmotionalTransition: require('./premiumMicroInteractions').useEmotionalTransition,
    useSuccessCelebration: require('./premiumMicroInteractions').useSuccessCelebration,
    usePersonalizedLoadingAnimation: require('./premiumMicroInteractions').usePersonalizedLoadingAnimation,
  },
  
  // Emotional intelligence
  intelligence: {
    useEmotionalIntelligence: require('./emotionalIntelligenceHooks').useEmotionalIntelligence,
    useContextualSuccessAnimation: require('./emotionalIntelligenceHooks').useContextualSuccessAnimation,
    useAdaptiveLoadingAnimation: require('./emotionalIntelligenceHooks').useAdaptiveLoadingAnimation,
    useMoodResponsivePetAnimation: require('./emotionalIntelligenceHooks').useMoodResponsivePetAnimation,
    usePerformanceOptimizedAnimation: require('./emotionalIntelligenceHooks').usePerformanceOptimizedAnimation,
  },
  
  // Performance monitoring
  performance: {
    useAnimationPerformanceMonitor: require('./performanceMonitoring').useAnimationPerformanceMonitor,
    useAnimationProfiler: require('./performanceMonitoring').useAnimationProfiler,
    usePerformanceOptimization: require('./performanceMonitoring').usePerformanceOptimization,
    usePerformanceOverlay: require('./performanceMonitoring').usePerformanceOverlay,
    AnimationPerformanceMonitor: require('./performanceMonitoring').AnimationPerformanceMonitor,
  },
  
  // Example components
  examples: {
    AnimatedPetCard: require('./examples/PetCardExample').AnimatedPetCard,
    AnimatedOnboarding: require('./examples/OnboardingExample').AnimatedOnboarding,
    AnimatedNavigation: require('./examples/NavigationExample').AnimatedNavigation,
  },
} as const;

// ====================================
// CONVENIENCE HOOKS
// ====================================

/**
 * Quick access hook for the most commonly used animations
 * Perfect for getting started quickly with TailTracker animations
 */
export const useQuickAnimations = () => {
  const { useTailWagAnimation, useHeartEyesAnimation, usePlayfulBounceAnimation } = require('./emotionalAnimationSystem');
  const { usePremiumButtonAnimation, useSuccessCelebration } = require('./premiumMicroInteractions');
  const { useEmotionalIntelligence } = require('./emotionalIntelligenceHooks');
  
  return {
    // Most common pet animations
    tailWag: useTailWagAnimation,
    heartEyes: useHeartEyesAnimation,
    playfulBounce: usePlayfulBounceAnimation,
    
    // Most common interface animations
    premiumButton: usePremiumButtonAnimation,
    successCelebration: useSuccessCelebration,
    
    // Emotional intelligence
    emotionalIntelligence: useEmotionalIntelligence,
  };
};

/**
 * Animation system setup hook
 * Call this once in your app root to initialize the animation system
 */
export const useAnimationSystemSetup = () => {
  const { useAnimationPerformanceMonitor } = require('./performanceMonitoring');
  const { useEmotionalIntelligence } = require('./emotionalIntelligenceHooks');
  
  // Initialize performance monitoring
  const performanceMonitor = useAnimationPerformanceMonitor();
  
  // Initialize emotional intelligence
  const emotionalIntelligence = useEmotionalIntelligence();
  
  return {
    performanceMonitor,
    emotionalIntelligence,
    isSystemReady: Boolean(performanceMonitor.metrics && emotionalIntelligence.userState),
  };
};

// ====================================
// ANIMATION PRESETS
// ====================================

/**
 * Pre-configured animation presets for common use cases
 */
export const AnimationPresets = {
  // Quick setup for happy, energetic pets
  happyPet: {
    emotion: 'happy' as const,
    personality: 'energetic' as const,
    intensity: 'enthusiastic' as const,
    hapticFeedback: true,
  },
  
  // Quick setup for calm, gentle pets
  calmPet: {
    emotion: 'calm' as const,
    personality: 'gentle' as const,
    intensity: 'subtle' as const,
    hapticFeedback: false,
  },
  
  // Quick setup for playful pets
  playfulPet: {
    emotion: 'playful' as const,
    personality: 'playful' as const,
    intensity: 'moderate' as const,
    hapticFeedback: true,
  },
  
  // Quick setup for premium features
  premiumFeature: {
    variant: 'premium' as const,
    intensity: 'celebration' as const,
    hapticFeedback: true,
  },
  
  // Quick setup for success celebrations
  majorSuccess: {
    achievementLevel: 'major' as const,
    intensity: 'celebration' as const,
    hapticFeedback: true,
  },
  
  // Quick setup for emergency contexts
  emergency: {
    emotion: 'anxious' as const,
    intensity: 'subtle' as const,
    hapticFeedback: true,
    reducedMotion: true,
  },
} as const;

// ====================================
// VERSION AND METADATA
// ====================================

/**
 * Animation system metadata
 */
export const AnimationSystemInfo = {
  version: '1.0.0',
  description: 'TailTracker Emotional Animation System',
  features: [
    'Pet personality animations',
    'Emotional intelligence',
    'Premium micro-interactions',
    'Performance monitoring',
    'Accessibility support',
    '60fps guaranteed performance',
    'Battery optimization',
    'Haptic feedback coordination',
  ],
  requirements: {
    'react-native-reanimated': '>=3.0.0',
    'react-native-gesture-handler': '>=2.0.0',
    'expo-haptics': '>=12.0.0',
  },
} as const;

// ====================================
// DEFAULT EXPORT
// ====================================

/**
 * Default export contains the most commonly used items
 */
export default {
  // Most used hooks
  useEmotionalIntelligence: require('./emotionalIntelligenceHooks').useEmotionalIntelligence,
  useTailWagAnimation: require('./emotionalAnimationSystem').useTailWagAnimation,
  useHeartEyesAnimation: require('./emotionalAnimationSystem').useHeartEyesAnimation,
  usePremiumButtonAnimation: require('./premiumMicroInteractions').usePremiumButtonAnimation,
  useSuccessCelebration: require('./premiumMicroInteractions').useSuccessCelebration,
  
  // Convenience hooks
  useQuickAnimations,
  useAnimationSystemSetup,
  
  // Complete system
  TailTrackerAnimations,
  
  // Presets
  AnimationPresets,
  
  // System info
  AnimationSystemInfo,
};

/**
 * ====================================
 * USAGE EXAMPLES AND GETTING STARTED
 * ====================================
 * 
 * 1. Basic Pet Animation:
 * ```typescript
 * import { useTailWagAnimation } from '@/design-system/animations';
 * 
 * const { animatedStyle, startWagging } = useTailWagAnimation({
 *   emotion: 'happy',
 *   personality: 'playful',
 *   intensity: 'moderate',
 * });
 * ```
 * 
 * 2. Quick Setup:
 * ```typescript
 * import { useQuickAnimations } from '@/design-system/animations';
 * 
 * const { tailWag, heartEyes, premiumButton } = useQuickAnimations();
 * ```
 * 
 * 3. Complete System Setup:
 * ```typescript
 * import { useAnimationSystemSetup } from '@/design-system/animations';
 * 
 * const { isSystemReady } = useAnimationSystemSetup();
 * ```
 * 
 * 4. Performance Monitoring:
 * ```typescript
 * import { useAnimationPerformanceMonitor } from '@/design-system/animations';
 * 
 * const { metrics, alerts } = useAnimationPerformanceMonitor();
 * ```
 * 
 * For complete documentation, see AnimationImplementationGuide.md
 */