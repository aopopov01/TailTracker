/**
 * TailTracker Motion Design System
 * 
 * A delightful animation system that creates emotional connections through 
 * smooth, purposeful motion. Every animation tells part of the story of the 
 * loving relationship between pets and their humans.
 */

import { Easing } from 'react-native';

// ====================================
// EMOTION-DRIVEN TIMING SYSTEM
// ====================================

/**
 * Animation Durations
 * Carefully timed durations that feel natural and create emotional resonance
 */
export const animationDurations = {
  // Micro-interactions - Quick feedback
  instant: 150,         // Immediate response - button press
  quick: 200,           // Fast feedback - toggle states
  snappy: 250,          // Snappy response - menu transitions
  
  // Standard interactions - Comfortable pace
  fast: 300,            // Fast but comfortable - slide transitions
  standard: 400,        // Standard pace - modal appearances
  comfortable: 500,     // Relaxed pace - page transitions
  
  // Storytelling animations - Deliberate and emotional
  gentle: 600,          // Gentle reveal - onboarding steps
  graceful: 800,        // Graceful movement - hero animations
  storytelling: 1000,   // Story pace - welcome sequences
  
  // Special moments - Celebration and emphasis
  celebration: 1200,    // Celebration moments - achievements
  dramatic: 1500,       // Dramatic reveals - major milestones
  cinematic: 2000,      // Cinematic moments - app intro
} as const;

/**
 * Easing Functions
 * Custom easing curves that create natural, organic motion
 */
export const easingCurves = {
  // Natural motion - Physics-inspired easing
  natural: Easing.bezier(0.25, 0.46, 0.45, 0.94),      // Smooth natural movement
  bounce: Easing.bezier(0.68, -0.55, 0.265, 1.55),     // Playful bounce
  elastic: Easing.bezier(0.175, 0.885, 0.32, 1.275),   // Elastic feel
  
  // UI motion - Interface-optimized easing
  easeOut: Easing.bezier(0.0, 0.0, 0.2, 1),           // Material Design standard
  easeIn: Easing.bezier(0.4, 0.0, 1, 1),              // Accelerated entrance
  easeInOut: Easing.bezier(0.4, 0.0, 0.2, 1),         // Balanced motion
  
  // Emotional easing - Feeling-based curves
  caring: Easing.bezier(0.25, 0.1, 0.25, 1),          // Gentle, caring motion
  playful: Easing.bezier(0.68, 0.12, 0.265, 1.55),    // Energetic, fun
  trustworthy: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Reliable, steady
  
  // Special purpose
  linear: Easing.linear,                                // Constant speed
  spring: Easing.bezier(0.26, 1.36, 0.74, -0.29),    // Spring-like motion
} as const;

// ====================================
// GESTURE-BASED ANIMATIONS
// ====================================

/**
 * Gesture Animation Configurations
 * Animations that respond to user touch with natural physics
 */
export const gestureAnimations = {
  // Touch feedback
  touchDown: {
    scale: 0.95,
    duration: animationDurations.instant,
    easing: easingCurves.easeOut,
    opacity: 0.8,
  },
  
  touchUp: {
    scale: 1.0,
    duration: animationDurations.quick,
    easing: easingCurves.bounce,
    opacity: 1.0,
  },
  
  // Swipe gestures
  swipeReveal: {
    translateX: 0,
    duration: animationDurations.standard,
    easing: easingCurves.natural,
    overshoot: 1.05, // Slight overshoot for natural feel
  },
  
  // Pull to refresh
  pullToRefresh: {
    threshold: 100,
    snapBackDuration: animationDurations.fast,
    triggerDuration: animationDurations.comfortable,
    easing: easingCurves.elastic,
  },
  
  // Drag interactions
  dragResponsive: {
    resistanceFactor: 0.8, // Slight resistance for natural feel
    returnDuration: animationDurations.standard,
    returnEasing: easingCurves.spring,
  },
} as const;

// ====================================
// PAGE TRANSITION ANIMATIONS
// ====================================

/**
 * Screen Transition Library
 * Beautiful transitions between screens that maintain emotional flow
 */
export const screenTransitions = {
  // Standard navigation
  slideFromRight: {
    duration: animationDurations.standard,
    easing: easingCurves.natural,
    from: { translateX: '100%', opacity: 0.8 },
    to: { translateX: 0, opacity: 1 },
  },
  
  slideFromLeft: {
    duration: animationDurations.standard,
    easing: easingCurves.natural,
    from: { translateX: '-100%', opacity: 0.8 },
    to: { translateX: 0, opacity: 1 },
  },
  
  // Modal presentations
  modalSlideUp: {
    duration: animationDurations.comfortable,
    easing: easingCurves.easeOut,
    from: { translateY: '100%', scale: 0.95 },
    to: { translateY: 0, scale: 1 },
  },
  
  modalFadeIn: {
    duration: animationDurations.standard,
    easing: easingCurves.easeOut,
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
  },
  
  // Special transitions
  heroTransition: {
    duration: animationDurations.graceful,
    easing: easingCurves.caring,
    from: { scale: 0.8, opacity: 0, translateY: 20 },
    to: { scale: 1, opacity: 1, translateY: 0 },
  },
  
  // Tab transitions
  tabSwitch: {
    duration: animationDurations.fast,
    easing: easingCurves.easeInOut,
    fadeOut: { opacity: 0, scale: 0.95 },
    fadeIn: { opacity: 1, scale: 1 },
  },
} as const;

// ====================================
// COMPONENT ANIMATIONS
// ====================================

/**
 * Component-Specific Animations
 * Reusable animations for common UI components
 */
export const componentAnimations = {
  // Button animations
  button: {
    press: {
      scale: 0.95,
      duration: animationDurations.instant,
      easing: easingCurves.easeOut,
    },
    release: {
      scale: 1.0,
      duration: animationDurations.quick,
      easing: easingCurves.bounce,
    },
    loading: {
      rotate: '360deg',
      duration: 1000,
      easing: easingCurves.linear,
      iterationCount: 'infinite',
    },
  },
  
  // Card animations
  card: {
    appear: {
      from: { opacity: 0, translateY: 20, scale: 0.95 },
      to: { opacity: 1, translateY: 0, scale: 1 },
      duration: animationDurations.standard,
      easing: easingCurves.natural,
    },
    hover: {
      scale: 1.02,
      translateY: -2,
      shadowOpacity: 0.15,
      duration: animationDurations.quick,
      easing: easingCurves.easeOut,
    },
    tap: {
      scale: 0.98,
      duration: animationDurations.instant,
      easing: easingCurves.easeOut,
    },
  },
  
  // List animations
  list: {
    itemAppear: {
      from: { opacity: 0, translateX: -20 },
      to: { opacity: 1, translateX: 0 },
      duration: animationDurations.standard,
      easing: easingCurves.natural,
      staggerDelay: 50, // Delay between items
    },
    itemRemove: {
      to: { opacity: 0, translateX: 20, scale: 0.9 },
      duration: animationDurations.fast,
      easing: easingCurves.easeIn,
    },
  },
  
  // Input animations
  input: {
    focus: {
      borderColor: '#3B82F6',
      borderWidth: 2,
      duration: animationDurations.quick,
      easing: easingCurves.easeOut,
    },
    error: {
      translateX: [-10, 10, -8, 8, -6, 6, -4, 4, 0],
      duration: animationDurations.standard,
      easing: easingCurves.easeInOut,
    },
    success: {
      borderColor: '#22C55E',
      scale: 1.02,
      duration: animationDurations.quick,
      easing: easingCurves.bounce,
    },
  },
  
  // Toggle animations
  toggle: {
    switch: {
      duration: animationDurations.quick,
      easing: easingCurves.easeInOut,
      thumbTranslate: 20, // Distance thumb travels
      backgroundColorChange: true,
    },
  },
} as const;

// ====================================
// LOADING ANIMATIONS
// ====================================

/**
 * Loading Animation Library
 * Engaging loading states that maintain user interest
 */
export const loadingAnimations = {
  // Spinner variations
  spinner: {
    basic: {
      rotate: '360deg',
      duration: 1000,
      easing: easingCurves.linear,
      iterationCount: 'infinite',
    },
    bounce: {
      scale: [1, 1.1, 1],
      duration: 1000,
      easing: easingCurves.easeInOut,
      iterationCount: 'infinite',
    },
    pulse: {
      opacity: [1, 0.5, 1],
      scale: [1, 0.95, 1],
      duration: 1500,
      easing: easingCurves.easeInOut,
      iterationCount: 'infinite',
    },
  },
  
  // Skeleton loading
  skeleton: {
    shimmer: {
      translateX: ['-100%', '100%'],
      duration: 1500,
      easing: easingCurves.linear,
      iterationCount: 'infinite',
    },
    pulse: {
      opacity: [0.5, 1, 0.5],
      duration: 2000,
      easing: easingCurves.easeInOut,
      iterationCount: 'infinite',
    },
  },
  
  // Progress indicators
  progress: {
    indeterminate: {
      translateX: ['-100%', '100%'],
      duration: 2000,
      easing: easingCurves.easeInOut,
      iterationCount: 'infinite',
    },
    determinate: {
      duration: animationDurations.comfortable,
      easing: easingCurves.easeOut,
    },
  },
  
  // Pet-themed loading
  petLoading: {
    pawPrint: {
      scale: [0.8, 1.2, 0.8],
      opacity: [0.5, 1, 0.5],
      duration: 1000,
      easing: easingCurves.easeInOut,
      iterationCount: 'infinite',
      staggerDelay: 200, // For multiple paw prints
    },
    heartbeat: {
      scale: [1, 1.1, 1],
      duration: 800,
      easing: easingCurves.easeInOut,
      iterationCount: 'infinite',
    },
  },
} as const;

// ====================================
// MICRO-INTERACTION ANIMATIONS
// ====================================

/**
 * Delightful Micro-interactions
 * Small animations that add personality and joy
 */
export const microInteractions = {
  // Success celebrations
  checkmarkSuccess: {
    phases: [
      { scale: 0, duration: 0 },
      { scale: 1.3, duration: animationDurations.quick, easing: easingCurves.bounce },
      { scale: 1, duration: animationDurations.instant, easing: easingCurves.easeOut },
    ],
  },
  
  // Heart like animation
  heartLike: {
    phases: [
      { scale: 1, opacity: 1 },
      { scale: 1.4, opacity: 0.8, duration: animationDurations.quick },
      { scale: 1, opacity: 1, duration: animationDurations.quick },
    ],
    color: '#F87171', // Heart color
  },
  
  // Notification badge
  notificationBadge: {
    appear: {
      from: { scale: 0, opacity: 0 },
      to: { scale: 1.2, opacity: 1 },
      then: { scale: 1, duration: animationDurations.instant },
      totalDuration: animationDurations.standard,
      easing: easingCurves.bounce,
    },
    pulse: {
      scale: [1, 1.1, 1],
      duration: 1000,
      easing: easingCurves.easeInOut,
      iterationCount: 3, // Pulse 3 times then stop
    },
  },
  
  // Pet mood indicator
  moodIndicator: {
    happy: {
      bounce: {
        translateY: [0, -5, 0],
        duration: 600,
        easing: easingCurves.bounce,
        iterationCount: 2,
      },
    },
    playful: {
      wiggle: {
        rotate: ['-5deg', '5deg', '-3deg', '3deg', '0deg'],
        duration: 500,
        easing: easingCurves.easeInOut,
      },
    },
    sleepy: {
      slow_pulse: {
        opacity: [1, 0.6, 1],
        duration: 2000,
        easing: easingCurves.easeInOut,
        iterationCount: 'infinite',
      },
    },
  },
  
  // Location ping
  locationPing: {
    ping: {
      scale: [1, 2],
      opacity: [1, 0],
      duration: 1500,
      easing: easingCurves.easeOut,
      iterationCount: 'infinite',
    },
  },
} as const;

// ====================================
// HAPTIC FEEDBACK COORDINATION
// ====================================

/**
 * Haptic Feedback System
 * Coordinate animations with haptic feedback for enhanced user experience
 */
export const hapticAnimations = {
  // Light feedback
  light: {
    animation: componentAnimations.button.press,
    hapticType: 'light',
    timing: 'onStart', // When to trigger haptic
  },
  
  // Medium feedback
  medium: {
    animation: componentAnimations.card.tap,
    hapticType: 'medium',
    timing: 'onStart',
  },
  
  // Heavy feedback
  heavy: {
    animation: microInteractions.checkmarkSuccess,
    hapticType: 'heavy',
    timing: 'onComplete',
  },
  
  // Success feedback
  success: {
    animation: microInteractions.heartLike,
    hapticType: 'success',
    timing: 'onStart',
  },
  
  // Warning feedback
  warning: {
    animation: componentAnimations.input.error,
    hapticType: 'warning',
    timing: 'onStart',
  },
  
  // Error feedback
  error: {
    animation: componentAnimations.input.error,
    hapticType: 'error',
    timing: 'onStart',
  },
} as const;

// ====================================
// ACCESSIBILITY ANIMATIONS
// ====================================

/**
 * Accessibility-Friendly Animations
 * Reduced motion alternatives for accessibility compliance
 */
export const accessibilityAnimations = {
  // Reduced motion alternatives
  reducedMotion: {
    // Simple fade instead of complex animations
    simpleFade: {
      from: { opacity: 0 },
      to: { opacity: 1 },
      duration: animationDurations.fast,
      easing: easingCurves.linear,
    },
    
    // Subtle scale instead of bounce
    subtleScale: {
      from: { scale: 0.98 },
      to: { scale: 1 },
      duration: animationDurations.quick,
      easing: easingCurves.easeOut,
    },
    
    // Instant transitions for severe motion sensitivity
    instant: {
      duration: 0,
      easing: easingCurves.linear,
    },
  },
  
  // Screen reader friendly
  screenReader: {
    // Announce important changes with subtle visual cues
    announceChange: {
      opacity: [1, 0.8, 1],
      duration: animationDurations.quick,
      easing: easingCurves.easeInOut,
    },
  },
} as const;

// ====================================
// COMPLETE MOTION SYSTEM
// ====================================

/**
 * Complete Motion System Export
 * All animation configurations organized for easy consumption
 */
export const tailTrackerMotions = {
  // Timing and easing
  durations: animationDurations,
  easing: easingCurves,
  
  // Interaction animations
  gestures: gestureAnimations,
  screens: screenTransitions,
  components: componentAnimations,
  
  // Feedback animations
  loading: loadingAnimations,
  micro: microInteractions,
  haptic: hapticAnimations,
  
  // Accessibility
  accessibility: accessibilityAnimations,
} as const;

export default tailTrackerMotions;