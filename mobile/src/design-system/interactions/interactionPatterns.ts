/**
 * TailTracker Interaction Design Patterns
 * 
 * Comprehensive interaction patterns that create delightful, 60fps experiences
 * with haptic feedback, sound design, and emotional state management.
 * Every interaction is designed to strengthen the bond between pets and humans.
 */

import { Platform, Vibration } from 'react-native';
import { tailTrackerMotions } from '../animations/motionSystem';
import { tailTrackerColors } from '../core/colors';

// ====================================
// HAPTIC FEEDBACK SYSTEM
// ====================================

/**
 * Haptic Feedback Patterns
 * Tactile feedback that enhances emotional connections
 */
export const hapticPatterns = {
  // Basic feedback types
  light: {
    type: 'impactLight',
    description: 'Gentle tap for subtle confirmations',
    usage: ['Button hover', 'Toggle switches', 'Slider adjustments'],
    implementation: () => {
      if (Platform.OS === 'ios') {
        // iOS: Use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      } else {
        Vibration.vibrate(50);
      }
    },
  },
  
  medium: {
    type: 'impactMedium',
    description: 'Confident feedback for important actions',
    usage: ['Button press', 'Menu selection', 'Form submission'],
    implementation: () => {
      if (Platform.OS === 'ios') {
        // iOS: Use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      } else {
        Vibration.vibrate(100);
      }
    },
  },
  
  heavy: {
    type: 'impactHeavy',
    description: 'Strong feedback for significant actions',
    usage: ['Emergency alerts', 'Critical confirmations', 'Achievement unlocks'],
    implementation: () => {
      if (Platform.OS === 'ios') {
        // iOS: Use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      } else {
        Vibration.vibrate(200);
      }
    },
  },
  
  // Emotional feedback patterns
  success: {
    type: 'notificationSuccess',
    description: 'Celebratory feedback for positive outcomes',
    usage: ['Pet found', 'Health goal achieved', 'Safe zone reached'],
    pattern: [100, 50, 100],
    implementation: () => {
      if (Platform.OS === 'ios') {
        // iOS: Use Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } else {
        Vibration.vibrate([100, 50, 100]);
      }
    },
  },
  
  warning: {
    type: 'notificationWarning',
    description: 'Attention-grabbing feedback for concerns',
    usage: ['Low battery', 'Leaving safe zone', 'Health reminder'],
    pattern: [150, 75, 150, 75, 150],
    implementation: () => {
      if (Platform.OS === 'ios') {
        // iOS: Use Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      } else {
        Vibration.vibrate([150, 75, 150, 75, 150]);
      }
    },
  },
  
  error: {
    type: 'notificationError',
    description: 'Urgent feedback for critical situations',
    usage: ['Pet missing', 'Emergency situation', 'System error'],
    pattern: [200, 100, 200, 100, 200],
    implementation: () => {
      if (Platform.OS === 'ios') {
        // iOS: Use Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      } else {
        Vibration.vibrate([200, 100, 200, 100, 200]);
      }
    },
  },
  
  // Pet-specific patterns
  heartbeat: {
    type: 'custom',
    description: 'Gentle heartbeat pattern for emotional moments',
    usage: ['Pet bonding moments', 'Health monitoring', 'Love gestures'],
    pattern: [80, 50, 120, 200, 80, 50, 120],
    implementation: () => {
      Vibration.vibrate([80, 50, 120, 200, 80, 50, 120]);
    },
  },
  
  playful: {
    type: 'custom',
    description: 'Bouncy pattern for fun interactions',
    usage: ['Game achievements', 'Playful interactions', 'Fun discoveries'],
    pattern: [50, 30, 70, 30, 50, 30, 100],
    implementation: () => {
      Vibration.vibrate([50, 30, 70, 30, 50, 30, 100]);
    },
  },
} as const;

// ====================================
// SOUND DESIGN SYSTEM
// ====================================

/**
 * Sound Design Patterns
 * Audio feedback that creates emotional resonance and enhances UX
 */
export const soundPatterns = {
  // UI Sounds
  buttonTap: {
    file: 'button-tap.mp3',
    volume: 0.3,
    description: 'Gentle click sound for button interactions',
    emotional_context: 'confidence',
  },
  
  toggleOn: {
    file: 'toggle-on.mp3',
    volume: 0.4,
    description: 'Positive chime for enabling features',
    emotional_context: 'success',
  },
  
  toggleOff: {
    file: 'toggle-off.mp3',
    volume: 0.3,
    description: 'Gentle sound for disabling features',
    emotional_context: 'neutral',
  },
  
  // Navigation Sounds
  pageTransition: {
    file: 'page-slide.mp3',
    volume: 0.2,
    description: 'Smooth swoosh for page transitions',
    emotional_context: 'flow',
  },
  
  modalAppear: {
    file: 'modal-pop.mp3',
    volume: 0.4,
    description: 'Gentle pop for modal appearances',
    emotional_context: 'attention',
  },
  
  modalDismiss: {
    file: 'modal-dismiss.mp3',
    volume: 0.3,
    description: 'Soft close sound for modal dismissal',
    emotional_context: 'completion',
  },
  
  // Emotional Sounds
  heartbeat: {
    file: 'heartbeat.mp3',
    volume: 0.5,
    description: 'Gentle heartbeat for emotional moments',
    emotional_context: 'love',
    loop: true,
  },
  
  achievement: {
    file: 'achievement.mp3',
    volume: 0.6,
    description: 'Celebratory chime for achievements',
    emotional_context: 'joy',
  },
  
  petFound: {
    file: 'pet-found.mp3',
    volume: 0.7,
    description: 'Relief and joy sound when pet is found',
    emotional_context: 'relief',
  },
  
  // Alert Sounds
  gentleAlert: {
    file: 'gentle-alert.mp3',
    volume: 0.5,
    description: 'Non-alarming notification sound',
    emotional_context: 'attention',
  },
  
  urgentAlert: {
    file: 'urgent-alert.mp3',
    volume: 0.8,
    description: 'Urgent but not panic-inducing alert',
    emotional_context: 'urgency',
  },
  
  emergencyAlert: {
    file: 'emergency-alert.mp3',
    volume: 1.0,
    description: 'Clear emergency sound without panic',
    emotional_context: 'emergency',
  },
  
  // Pet-Specific Sounds
  dogBark: {
    file: 'friendly-bark.mp3',
    volume: 0.4,
    description: 'Friendly dog bark for dog-related actions',
    emotional_context: 'playful',
  },
  
  catPurr: {
    file: 'gentle-purr.mp3',
    volume: 0.3,
    description: 'Soothing cat purr for cat-related actions',
    emotional_context: 'calm',
  },
  
  birdChirp: {
    file: 'cheerful-chirp.mp3',
    volume: 0.4,
    description: 'Happy bird chirp for bird-related actions',
    emotional_context: 'joy',
  },
} as const;

// ====================================
// 60FPS ANIMATION PATTERNS
// ====================================

/**
 * High-Performance Animation Patterns
 * Butter-smooth 60fps animations for premium feel
 */
export const performanceAnimations = {
  // Button Interactions
  buttonPress: {
    duration: tailTrackerMotions.durations.instant,
    easing: tailTrackerMotions.easing.easeOut,
    properties: ['transform.scale', 'opacity'],
    useNativeDriver: true,
    optimization: 'GPU-accelerated',
    keyframes: {
      0: { scale: 1, opacity: 1 },
      100: { scale: 0.95, opacity: 0.8 },
    },
  },
  
  buttonRelease: {
    duration: tailTrackerMotions.durations.quick,
    easing: tailTrackerMotions.easing.bounce,
    properties: ['transform.scale', 'opacity'],
    useNativeDriver: true,
    optimization: 'GPU-accelerated',
    keyframes: {
      0: { scale: 0.95, opacity: 0.8 },
      70: { scale: 1.02, opacity: 1 },
      100: { scale: 1, opacity: 1 },
    },
  },
  
  // List Animations
  listItemAppear: {
    duration: tailTrackerMotions.durations.standard,
    easing: tailTrackerMotions.easing.natural,
    properties: ['transform.translateY', 'opacity'],
    useNativeDriver: true,
    staggerDelay: 50,
    keyframes: {
      0: { translateY: 20, opacity: 0 },
      100: { translateY: 0, opacity: 1 },
    },
  },
  
  listItemRemove: {
    duration: tailTrackerMotions.durations.fast,
    easing: tailTrackerMotions.easing.easeIn,
    properties: ['transform.translateX', 'opacity', 'transform.scale'],
    useNativeDriver: true,
    keyframes: {
      0: { translateX: 0, opacity: 1, scale: 1 },
      100: { translateX: 100, opacity: 0, scale: 0.8 },
    },
  },
  
  // Modal Animations
  modalSlideUp: {
    duration: tailTrackerMotions.durations.comfortable,
    easing: tailTrackerMotions.easing.easeOut,
    properties: ['transform.translateY', 'opacity'],
    useNativeDriver: true,
    keyframes: {
      0: { translateY: '100%', opacity: 0 },
      100: { translateY: 0, opacity: 1 },
    },
  },
  
  modalFadeIn: {
    duration: tailTrackerMotions.durations.standard,
    easing: tailTrackerMotions.easing.easeOut,
    properties: ['opacity', 'transform.scale'],
    useNativeDriver: true,
    keyframes: {
      0: { opacity: 0, scale: 0.9 },
      100: { opacity: 1, scale: 1 },
    },
  },
  
  // Loading Animations
  spinnerRotation: {
    duration: 1000,
    easing: 'linear',
    properties: ['transform.rotate'],
    useNativeDriver: true,
    iterationCount: 'infinite',
    keyframes: {
      0: { rotate: '0deg' },
      100: { rotate: '360deg' },
    },
  },
  
  pulseAnimation: {
    duration: 1500,
    easing: tailTrackerMotions.easing.easeInOut,
    properties: ['opacity', 'transform.scale'],
    useNativeDriver: true,
    iterationCount: 'infinite',
    keyframes: {
      0: { opacity: 1, scale: 1 },
      50: { opacity: 0.5, scale: 0.95 },
      100: { opacity: 1, scale: 1 },
    },
  },
} as const;

// ====================================
// LOADING STATE PATTERNS
// ====================================

/**
 * Loading State Designs
 * Engaging loading experiences that maintain user interest
 */
export const loadingStates = {
  // Standard Loading
  spinner: {
    type: 'rotation',
    component: 'ActivityIndicator',
    color: tailTrackerColors.primary.trustBlue,
    size: 'large',
    message: 'Loading...',
    timeout: 30000, // 30 seconds
  },
  
  // Pet-Themed Loading
  pawPrint: {
    type: 'sequence',
    animation: 'pawPrintSequence',
    colors: [
      tailTrackerColors.petTypes.dog.primary,
      tailTrackerColors.petTypes.cat.primary,
      tailTrackerColors.petTypes.bird.primary,
    ],
    message: 'Fetching your pets...',
    timeout: 15000,
  },
  
  heartbeat: {
    type: 'pulse',
    animation: 'heartbeatPulse',
    color: tailTrackerColors.primary.heartCoral,
    message: 'Connecting with love...',
    timeout: 20000,
  },
  
  // Skeleton Loading
  skeleton: {
    type: 'shimmer',
    animation: 'shimmerEffect',
    baseColor: tailTrackerColors.light.surfaceSecondary,
    highlightColor: tailTrackerColors.light.surfaceTertiary,
    speed: 1000,
    direction: 'ltr',
  },
  
  // Progressive Loading
  progressive: {
    type: 'stepped',
    steps: [
      { message: 'Connecting to TailTracker...', duration: 2000 },
      { message: 'Syncing pet data...', duration: 3000 },
      { message: 'Loading latest activity...', duration: 2000 },
      { message: 'Almost ready...', duration: 1000 },
    ],
    totalTimeout: 10000,
  },
  
  // Location Loading
  mapLoading: {
    type: 'ripple',
    animation: 'locationRipple',
    color: tailTrackerColors.contextual.safeHaven,
    message: 'Finding your pets...',
    timeout: 25000,
  },
  
  // Data Sync Loading
  dataSync: {
    type: 'progress',
    animation: 'progressBar',
    color: tailTrackerColors.primary.trustBlue,
    backgroundColor: tailTrackerColors.light.surfaceSecondary,
    message: 'Syncing health data...',
    showPercentage: true,
    timeout: 60000,
  },
} as const;

// ====================================
// ERROR STATE PATTERNS
// ====================================

/**
 * Error State Designs
 * Helpful, non-blaming error experiences that guide users to solutions
 */
export const errorStates = {
  // Network Errors
  networkError: {
    type: 'connection',
    icon: '📡',
    title: 'Connection Issue',
    message: 'Having trouble connecting to TailTracker. Let\'s get you back online.',
    actions: [
      {
        title: 'Try Again',
        type: 'primary',
        emotion: 'trust',
        action: 'retry',
      },
      {
        title: 'Check Settings',
        type: 'secondary',
        emotion: 'trust',
        action: 'settings',
      },
    ],
    haptic: hapticPatterns.warning,
    sound: soundPatterns.gentleAlert,
  },
  
  // Location Errors
  locationError: {
    type: 'permission',
    icon: '📍',
    title: 'Location Access Needed',
    message: 'To keep your pets safe, we need access to your location. This helps us track and protect them.',
    actions: [
      {
        title: 'Enable Location',
        type: 'primary',
        emotion: 'trust',
        action: 'requestPermission',
      },
      {
        title: 'Learn More',
        type: 'ghost',
        emotion: 'trust',
        action: 'learnMore',
      },
    ],
    helpText: 'Your location data is encrypted and never shared with third parties.',
    haptic: hapticPatterns.medium,
  },
  
  // Pet Not Found
  petNotFound: {
    type: 'search',
    icon: '🔍',
    title: 'Pet Not Found',
    message: 'We couldn\'t locate your pet right now. This might be due to GPS signal or device issues.',
    actions: [
      {
        title: 'Try Again',
        type: 'primary',
        emotion: 'trust',
        action: 'retry',
      },
      {
        title: 'Check Last Location',
        type: 'secondary',
        emotion: 'trust',
        action: 'lastLocation',
      },
      {
        title: 'Report Missing',
        type: 'destructive',
        emotion: 'urgent',
        action: 'reportMissing',
      },
    ],
    helpText: 'Last known location will be shown even if current location is unavailable.',
    haptic: hapticPatterns.warning,
    sound: soundPatterns.gentleAlert,
  },
  
  // Battery Low
  batteryLow: {
    type: 'device',
    icon: '🔋',
    title: 'Tracker Battery Low',
    message: 'Your pet\'s tracker battery is running low. Charge it soon to maintain protection.',
    severity: 'warning',
    actions: [
      {
        title: 'Set Reminder',
        type: 'primary',
        emotion: 'trust',
        action: 'setReminder',
      },
      {
        title: 'Dismiss',
        type: 'ghost',
        emotion: 'trust',
        action: 'dismiss',
      },
    ],
    autoRetry: false,
    haptic: hapticPatterns.warning,
    sound: soundPatterns.gentleAlert,
  },
  
  // Emergency Situations
  emergencyError: {
    type: 'emergency',
    icon: '🚨',
    title: 'Emergency Alert Failed',
    message: 'We couldn\'t send your emergency alert. Please try alternative contact methods.',
    severity: 'critical',
    actions: [
      {
        title: 'Call Emergency Contacts',
        type: 'primary',
        emotion: 'urgent',
        action: 'callContacts',
      },
      {
        title: 'Try Again',
        type: 'secondary',
        emotion: 'urgent',
        action: 'retry',
      },
    ],
    haptic: hapticPatterns.error,
    sound: soundPatterns.urgentAlert,
  },
  
  // Validation Errors
  formValidation: {
    type: 'validation',
    title: 'Please check your information',
    message: 'Some fields need your attention before we can continue.',
    severity: 'mild',
    actions: [
      {
        title: 'Review Form',
        type: 'primary',
        emotion: 'trust',
        action: 'focusError',
      },
    ],
    haptic: hapticPatterns.light,
    showInline: true,
  },
  
  // Empty States
  noPets: {
    type: 'empty',
    icon: '🐾',
    title: 'No Pets Yet',
    message: 'Add your first furry family member to get started with TailTracker.',
    actions: [
      {
        title: 'Add Your First Pet',
        type: 'primary',
        emotion: 'love',
        action: 'addPet',
      },
    ],
    illustration: 'empty-pets',
    isError: false,
  },
} as const;

// ====================================
// INTERACTION ORCHESTRATION
// ====================================

/**
 * Interaction Orchestrator
 * Coordinates haptic, sound, and visual feedback for cohesive experiences
 */
export class InteractionOrchestrator {
  private static soundEnabled = true;
  private static hapticEnabled = true;
  private static reducedMotion = false;
  
  static async playInteraction(
    interactionType: keyof typeof performanceAnimations,
    options: {
      haptic?: keyof typeof hapticPatterns;
      sound?: keyof typeof soundPatterns;
      skipAnimation?: boolean;
    } = {}
  ) {
    const { haptic, sound, skipAnimation } = options;
    
    // Play haptic feedback
    if (haptic && this.hapticEnabled) {
      hapticPatterns[haptic].implementation();
    }
    
    // Play sound
    if (sound && this.soundEnabled) {
      // Implementation would play the sound file
      console.log(`Playing sound: ${soundPatterns[sound].file}`);
    }
    
    // Return animation config (unless skipped or reduced motion)
    if (!skipAnimation && !this.reducedMotion) {
      return performanceAnimations[interactionType];
    }
    
    return null;
  }
  
  static setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }
  
  static setHapticEnabled(enabled: boolean) {
    this.hapticEnabled = enabled;
  }
  
  static setReducedMotion(enabled: boolean) {
    this.reducedMotion = enabled;
  }
  
  static showLoadingState(type: keyof typeof loadingStates) {
    return loadingStates[type];
  }
  
  static showErrorState(type: keyof typeof errorStates) {
    const errorConfig = errorStates[type];
    
    // Play haptic and sound feedback for errors
    if (errorConfig.haptic) {
      errorConfig.haptic.implementation();
    }
    
    if (errorConfig.sound && this.soundEnabled) {
      console.log(`Playing error sound: ${errorConfig.sound.file}`);
    }
    
    return errorConfig;
  }
}

export default {
  hapticPatterns,
  soundPatterns,
  performanceAnimations,
  loadingStates,
  errorStates,
  InteractionOrchestrator,
};