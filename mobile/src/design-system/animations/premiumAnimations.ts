/**
 * TailTracker Premium Animation System
 * 
 * World-class micro-interactions and animations designed to create
 * an absolutely premium experience that users will love.
 * 
 * Features:
 * - 60fps GPU-accelerated animations
 * - Haptic feedback coordination
 * - Accessibility support with reduced motion
 * - Performance-optimized transitions
 * - Emotional design language
 */

import { Easing, withTiming, withSequence, withRepeat, withDelay, withSpring } from 'react-native-reanimated';
import { hapticFeedback } from '../../utils/hapticUtils';

// ====================================
// PREMIUM TIMING CONSTANTS
// ====================================

export const PREMIUM_TIMINGS = {
  // Micro-interactions - Instant feedback
  tap: 100,
  quick: 150,
  snappy: 200,
  
  // Standard interactions
  fast: 250,
  standard: 300,
  comfortable: 400,
  
  // Emotional moments
  gentle: 500,
  graceful: 600,
  celebration: 800,
  
  // Special occasions
  dramatic: 1000,
  cinematic: 1500,
} as const;

export const PREMIUM_SPRINGS = {
  // Gentle springs for caring interactions
  gentle: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  
  // Bouncy springs for playful interactions
  playful: {
    damping: 15,
    stiffness: 400,
    mass: 0.6,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  
  // Smooth springs for elegant interactions
  smooth: {
    damping: 25,
    stiffness: 350,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  
  // Crisp springs for precise interactions
  crisp: {
    damping: 30,
    stiffness: 500,
    mass: 0.5,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
} as const;

// ====================================
// PREMIUM BUTTON ANIMATIONS
// ====================================

export const createButtonPressAnimation = (intensity: 'subtle' | 'medium' | 'bold' = 'medium') => {
  const scales = {
    subtle: { down: 0.98, up: 1.0 },
    medium: { down: 0.95, up: 1.02 },
    bold: { down: 0.92, up: 1.05 },
  };
  
  const scale = scales[intensity];
  
  return {
    pressIn: () => {
      'worklet';
      return withSequence(
        withTiming(scale.down, { duration: PREMIUM_TIMINGS.tap, easing: Easing.out(Easing.quad) }),
        withTiming(scale.up, { duration: PREMIUM_TIMINGS.quick, easing: Easing.out(Easing.back(1.2)) }),
        withTiming(1.0, { duration: PREMIUM_TIMINGS.fast, easing: Easing.out(Easing.quad) })
      );
    },
    
    pressOut: () => {
      'worklet';
      return withSpring(1.0, PREMIUM_SPRINGS.gentle);
    },
  };
};

export const createButtonRippleAnimation = (color: string, intensity: number = 0.2) => {
  return {
    opacity: withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(intensity, { duration: PREMIUM_TIMINGS.quick }),
      withTiming(0, { duration: PREMIUM_TIMINGS.standard })
    ),
    scale: withSequence(
      withTiming(0.3, { duration: 0 }),
      withTiming(1.2, { duration: PREMIUM_TIMINGS.standard, easing: Easing.out(Easing.quad) })
    ),
  };
};

// ====================================
// PREMIUM CARD ANIMATIONS
// ====================================

export const createCardHoverAnimation = () => {
  return {
    enter: () => {
      'worklet';
      return {
        scale: withSpring(1.02, PREMIUM_SPRINGS.gentle),
        translateY: withSpring(-2, PREMIUM_SPRINGS.smooth),
        shadowOpacity: withTiming(0.15, { duration: PREMIUM_TIMINGS.standard }),
      };
    },
    
    exit: () => {
      'worklet';
      return {
        scale: withSpring(1.0, PREMIUM_SPRINGS.gentle),
        translateY: withSpring(0, PREMIUM_SPRINGS.smooth),
        shadowOpacity: withTiming(0.1, { duration: PREMIUM_TIMINGS.standard }),
      };
    },
  };
};

export const createCardAppearAnimation = (delay: number = 0) => {
  return {
    opacity: withDelay(delay, withSpring(1, PREMIUM_SPRINGS.gentle)),
    translateY: withDelay(delay, withSpring(0, PREMIUM_SPRINGS.smooth)),
    scale: withDelay(delay, withSpring(1, PREMIUM_SPRINGS.playful)),
  };
};

export const createCardSwipeAnimation = (direction: 'left' | 'right') => {
  const translateX = direction === 'left' ? -300 : 300;
  
  return {
    translateX: withTiming(translateX, { duration: PREMIUM_TIMINGS.fast, easing: Easing.out(Easing.quad) }),
    opacity: withTiming(0, { duration: PREMIUM_TIMINGS.fast }),
    scale: withTiming(0.95, { duration: PREMIUM_TIMINGS.fast }),
  };
};

// ====================================
// PREMIUM LOADING ANIMATIONS
// ====================================

export const createSkeletonShimmerAnimation = () => {
  return {
    translateX: withRepeat(
      withSequence(
        withTiming(-100, { duration: 0 }),
        withTiming(100, { duration: PREMIUM_TIMINGS.dramatic, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    ),
  };
};

export const createPulseAnimation = (intensity: number = 0.3) => {
  return {
    opacity: withRepeat(
      withSequence(
        withTiming(1 - intensity, { duration: PREMIUM_TIMINGS.comfortable }),
        withTiming(1, { duration: PREMIUM_TIMINGS.comfortable })
      ),
      -1,
      true
    ),
  };
};

export const createHeartbeatAnimation = () => {
  return {
    scale: withRepeat(
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1.1, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(1.1, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
      ),
      -1,
      false
    ),
  };
};

// ====================================
// PREMIUM SUCCESS ANIMATIONS
// ====================================

export const createSuccessCheckmarkAnimation = () => {
  return {
    scale: withSequence(
      withTiming(0, { duration: 0 }),
      withSpring(1.3, { ...PREMIUM_SPRINGS.playful, duration: PREMIUM_TIMINGS.standard }),
      withSpring(1, PREMIUM_SPRINGS.gentle)
    ),
    rotate: withSequence(
      withTiming('0deg', { duration: 0 }),
      withTiming('360deg', { duration: PREMIUM_TIMINGS.celebration, easing: Easing.out(Easing.back(1.5)) })
    ),
  };
};

export const createCelebrationAnimation = () => {
  return {
    scale: withSequence(
      withSpring(1.2, PREMIUM_SPRINGS.playful),
      withDelay(PREMIUM_TIMINGS.quick, withSpring(1, PREMIUM_SPRINGS.gentle))
    ),
    rotate: withSequence(
      withTiming('-5deg', { duration: PREMIUM_TIMINGS.quick }),
      withTiming('5deg', { duration: PREMIUM_TIMINGS.quick }),
      withTiming('-3deg', { duration: PREMIUM_TIMINGS.quick }),
      withTiming('3deg', { duration: PREMIUM_TIMINGS.quick }),
      withTiming('0deg', { duration: PREMIUM_TIMINGS.quick })
    ),
  };
};

// ====================================
// PREMIUM FORM ANIMATIONS
// ====================================

export const createInputFocusAnimation = () => {
  return {
    borderWidth: withSpring(2, PREMIUM_SPRINGS.crisp),
    scale: withSpring(1.02, PREMIUM_SPRINGS.gentle),
  };
};

export const createInputErrorAnimation = () => {
  return {
    translateX: withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    ),
  };
};

export const createFloatingLabelAnimation = (isFocused: boolean, hasValue: boolean) => {
  const shouldFloat = isFocused || hasValue;
  
  return {
    translateY: withSpring(shouldFloat ? -20 : 0, PREMIUM_SPRINGS.gentle),
    scale: withSpring(shouldFloat ? 0.8 : 1, PREMIUM_SPRINGS.gentle),
    opacity: withTiming(shouldFloat ? 0.8 : 0.6, { duration: PREMIUM_TIMINGS.standard }),
  };
};

// ====================================
// PREMIUM PAGE TRANSITIONS
// ====================================

export const createPageTransition = (type: 'slide' | 'fade' | 'scale' | 'hero') => {
  switch (type) {
    case 'slide':
      return {
        entering: {
          translateX: withSpring(0, PREMIUM_SPRINGS.smooth),
          opacity: withTiming(1, { duration: PREMIUM_TIMINGS.standard }),
        },
        exiting: {
          translateX: withTiming(-50, { duration: PREMIUM_TIMINGS.fast }),
          opacity: withTiming(0, { duration: PREMIUM_TIMINGS.fast }),
        },
      };
      
    case 'fade':
      return {
        entering: {
          opacity: withTiming(1, { duration: PREMIUM_TIMINGS.comfortable }),
        },
        exiting: {
          opacity: withTiming(0, { duration: PREMIUM_TIMINGS.standard }),
        },
      };
      
    case 'scale':
      return {
        entering: {
          scale: withSpring(1, PREMIUM_SPRINGS.gentle),
          opacity: withTiming(1, { duration: PREMIUM_TIMINGS.standard }),
        },
        exiting: {
          scale: withTiming(0.95, { duration: PREMIUM_TIMINGS.fast }),
          opacity: withTiming(0, { duration: PREMIUM_TIMINGS.fast }),
        },
      };
      
    case 'hero':
      return {
        entering: {
          scale: withSequence(
            withTiming(0.8, { duration: 0 }),
            withSpring(1, { ...PREMIUM_SPRINGS.playful, duration: PREMIUM_TIMINGS.graceful })
          ),
          translateY: withSequence(
            withTiming(50, { duration: 0 }),
            withSpring(0, PREMIUM_SPRINGS.smooth)
          ),
          opacity: withTiming(1, { duration: PREMIUM_TIMINGS.graceful }),
        },
        exiting: {
          scale: withTiming(1.1, { duration: PREMIUM_TIMINGS.standard }),
          opacity: withTiming(0, { duration: PREMIUM_TIMINGS.standard }),
        },
      };
      
    default:
      return createPageTransition('fade');
  }
};

// ====================================
// PREMIUM MODAL ANIMATIONS
// ====================================

export const createModalAnimation = (type: 'slideUp' | 'scaleCenter' | 'fadeIn') => {
  switch (type) {
    case 'slideUp':
      return {
        entering: {
          translateY: withSpring(0, PREMIUM_SPRINGS.smooth),
          opacity: withTiming(1, { duration: PREMIUM_TIMINGS.standard }),
        },
        exiting: {
          translateY: withTiming(300, { duration: PREMIUM_TIMINGS.fast, easing: Easing.in(Easing.quad) }),
          opacity: withTiming(0, { duration: PREMIUM_TIMINGS.fast }),
        },
      };
      
    case 'scaleCenter':
      return {
        entering: {
          scale: withSpring(1, PREMIUM_SPRINGS.playful),
          opacity: withTiming(1, { duration: PREMIUM_TIMINGS.standard }),
        },
        exiting: {
          scale: withTiming(0.8, { duration: PREMIUM_TIMINGS.fast }),
          opacity: withTiming(0, { duration: PREMIUM_TIMINGS.fast }),
        },
      };
      
    case 'fadeIn':
      return {
        entering: {
          opacity: withTiming(1, { duration: PREMIUM_TIMINGS.comfortable }),
          scale: withSpring(1, PREMIUM_SPRINGS.gentle),
        },
        exiting: {
          opacity: withTiming(0, { duration: PREMIUM_TIMINGS.standard }),
          scale: withTiming(0.95, { duration: PREMIUM_TIMINGS.standard }),
        },
      };
      
    default:
      return createModalAnimation('slideUp');
  }
};

// ====================================
// PREMIUM PET-SPECIFIC ANIMATIONS
// ====================================

export const createPetMoodAnimation = (mood: 'happy' | 'playful' | 'sleepy' | 'excited') => {
  switch (mood) {
    case 'happy':
      return {
        scale: withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withSpring(1.1, PREMIUM_SPRINGS.gentle),
            withSpring(1, PREMIUM_SPRINGS.gentle)
          ),
          -1,
          false
        ),
      };
      
    case 'playful':
      return {
        rotate: withRepeat(
          withSequence(
            withTiming('-5deg', { duration: PREMIUM_TIMINGS.quick }),
            withTiming('5deg', { duration: PREMIUM_TIMINGS.quick }),
            withTiming('-3deg', { duration: PREMIUM_TIMINGS.quick }),
            withTiming('3deg', { duration: PREMIUM_TIMINGS.quick }),
            withTiming('0deg', { duration: PREMIUM_TIMINGS.standard })
          ),
          -1,
          false
        ),
      };
      
    case 'sleepy':
      return {
        opacity: withRepeat(
          withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(0.6, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          false
        ),
      };
      
    case 'excited':
      return {
        scale: withRepeat(
          withSequence(
            withSpring(1.15, { ...PREMIUM_SPRINGS.playful, duration: PREMIUM_TIMINGS.quick }),
            withSpring(1, PREMIUM_SPRINGS.gentle)
          ),
          3,
          false
        ),
      };
      
    default:
      return {};
  }
};

// ====================================
// PREMIUM NOTIFICATION ANIMATIONS
// ====================================

export const createNotificationAnimation = (type: 'toast' | 'banner' | 'badge') => {
  switch (type) {
    case 'toast':
      return {
        entering: {
          translateY: withSpring(0, PREMIUM_SPRINGS.smooth),
          opacity: withTiming(1, { duration: PREMIUM_TIMINGS.standard }),
          scale: withSpring(1, PREMIUM_SPRINGS.gentle),
        },
        exiting: {
          translateY: withTiming(-100, { duration: PREMIUM_TIMINGS.fast }),
          opacity: withTiming(0, { duration: PREMIUM_TIMINGS.fast }),
        },
      };
      
    case 'banner':
      return {
        entering: {
          translateY: withSpring(0, PREMIUM_SPRINGS.smooth),
          opacity: withTiming(1, { duration: PREMIUM_TIMINGS.comfortable }),
        },
        exiting: {
          translateY: withTiming(-50, { duration: PREMIUM_TIMINGS.standard }),
          opacity: withTiming(0, { duration: PREMIUM_TIMINGS.standard }),
        },
      };
      
    case 'badge':
      return {
        scale: withSequence(
          withTiming(0, { duration: 0 }),
          withSpring(1.3, PREMIUM_SPRINGS.playful),
          withSpring(1, PREMIUM_SPRINGS.gentle)
        ),
        pulse: withRepeat(
          withSequence(
            withTiming(1, { duration: 800 }),
            withSpring(1.1, PREMIUM_SPRINGS.gentle),
            withSpring(1, PREMIUM_SPRINGS.gentle)
          ),
          3,
          false
        ),
      };
      
    default:
      return createNotificationAnimation('toast');
  }
};

// ====================================
// HAPTIC COORDINATION
// ====================================

export const withHapticFeedback = (
  animation: any,
  hapticType: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error',
  timing: 'start' | 'end' | 'peak' = 'start'
) => {
  'worklet';
  
  if (timing === 'start') {
    hapticFeedback(hapticType);
  }
  
  // For more complex timing, we'd need to coordinate with animation callbacks
  return animation;
};

// ====================================
// ACCESSIBILITY SUPPORT
// ====================================

export const createAccessibleAnimation = (originalAnimation: any, reducedMotion: boolean = false) => {
  if (reducedMotion) {
    // Return simplified animations for reduced motion preference
    return {
      opacity: withTiming(1, { duration: PREMIUM_TIMINGS.fast }),
    };
  }
  
  return originalAnimation;
};

// ====================================
// PERFORMANCE OPTIMIZERS
// ====================================

export const optimizeForPerformance = (animation: any) => {
  // GPU acceleration hints and optimization flags
  return {
    ...animation,
    useNativeDriver: true,
    shouldRasterizeIOS: true,
    renderToHardwareTextureAndroid: true,
  };
};

export default {
  timings: PREMIUM_TIMINGS,
  springs: PREMIUM_SPRINGS,
  buttons: {
    press: createButtonPressAnimation,
    ripple: createButtonRippleAnimation,
  },
  cards: {
    hover: createCardHoverAnimation,
    appear: createCardAppearAnimation,
    swipe: createCardSwipeAnimation,
  },
  loading: {
    shimmer: createSkeletonShimmerAnimation,
    pulse: createPulseAnimation,
    heartbeat: createHeartbeatAnimation,
  },
  success: {
    checkmark: createSuccessCheckmarkAnimation,
    celebration: createCelebrationAnimation,
  },
  forms: {
    focus: createInputFocusAnimation,
    error: createInputErrorAnimation,
    floatingLabel: createFloatingLabelAnimation,
  },
  pages: {
    transition: createPageTransition,
  },
  modals: {
    animation: createModalAnimation,
  },
  pets: {
    mood: createPetMoodAnimation,
  },
  notifications: {
    animation: createNotificationAnimation,
  },
  haptic: withHapticFeedback,
  accessibility: createAccessibleAnimation,
  performance: optimizeForPerformance,
};