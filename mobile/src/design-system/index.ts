/**
 * TailTracker Design System - Main Export
 * 
 * Complete design system for TailTracker that creates emotional connections
 * between pets and their humans through thoughtful design, intelligent animations,
 * and premium experiences.
 * 
 * This is the main entry point for the entire TailTracker design system.
 * 
 * @example
 * ```typescript
 * // Import design tokens
 * import { colors, spacing, typography } from '@/design-system';
 * 
 * // Import animations
 * import { useTailWagAnimation, useEmotionalIntelligence } from '@/design-system';
 * 
 * // Import components
 * import { EmotionalButton, PetCard } from '@/design-system';
 * 
 * // Import complete systems
 * import { TailTrackerAnimations, illustrations } from '@/design-system';
 * ```
 */

// ====================================
// CORE DESIGN TOKENS
// ====================================

export { default as colors } from './core/colors';
export { default as spacing } from './core/spacing';
export { default as typography } from './core/typography';

// ====================================
// COMPLETE ANIMATION SYSTEM
// ====================================

// Re-export everything from animations for convenience
export * from './animations';

// Main animation system (most important export)
export { 
  TailTrackerAnimations,
  useEmotionalIntelligence,
  useTailWagAnimation,
  useHeartEyesAnimation,
  usePremiumButtonAnimation,
  useSuccessCelebration,
  AnimationPresets,
  useQuickAnimations,
  useAnimationSystemSetup,
} from './animations';

// ====================================
// ILLUSTRATION SYSTEM
// ====================================

export * from './illustrations';

// ====================================
// ICON SYSTEM
// ====================================

export * from './icons/iconSystem';

// ====================================
// COMPONENTS
// ====================================

// Buttons
export { default as EmotionalButton } from './components/buttons/EmotionalButton';

// Cards
export { default as PetCard } from './components/cards/PetCard';

// ====================================
// INTERACTION PATTERNS
// ====================================

export * from './interactions/interactionPatterns';

// ====================================
// ACCESSIBILITY SYSTEM
// ====================================

export * from './accessibility/accessibilitySystem';

// ====================================
// COMPLETE DESIGN SYSTEM
// ====================================

/**
 * Complete TailTracker Design System
 * 
 * This is the main design system object that contains all
 * design tokens, components, animations, and utilities
 * organized by category for easy access.
 */
export const TailTrackerDesignSystem = {
  // Core design tokens
  tokens: {
    colors: require('./core/colors').default,
    spacing: require('./core/spacing').default,
    typography: require('./core/typography').default,
  },
  
  // Complete animation system
  animations: require('./animations').TailTrackerAnimations,
  
  // Illustration system
  illustrations: require('./illustrations'),
  
  // Component library
  components: {
    EmotionalButton: require('./components/buttons/EmotionalButton').default,
    PetCard: require('./components/cards/PetCard').default,
  },
  
  // Interaction patterns
  interactions: require('./interactions/interactionPatterns'),
  
  // Accessibility system
  accessibility: require('./accessibility/accessibilitySystem'),
  
  // Icon system
  icons: require('./icons/iconSystem'),
} as const;

// ====================================
// DESIGN SYSTEM SETUP HOOK
// ====================================

/**
 * Complete design system setup hook
 * Call this once in your app root to initialize the entire design system
 */
export const useDesignSystemSetup = () => {
  const { useAnimationSystemSetup } = require('./animations');
  
  // Initialize animation system
  const animationSystem = useAnimationSystemSetup();
  
  // Additional design system initialization could go here
  // (theme setup, accessibility configuration, etc.)
  
  return {
    animationSystem,
    isReady: animationSystem.isSystemReady,
  };
};

// ====================================
// DESIGN SYSTEM METADATA
// ====================================

/**
 * Design system metadata and information
 */
export const DesignSystemInfo = {
  name: 'TailTracker Design System',
  version: '1.0.0',
  description: 'Complete design system for creating emotional pet experiences',
  
  features: [
    // Core features
    'Emotional design tokens',
    'Pet-focused color palettes',
    'Premium typography system',
    'Flexible spacing system',
    
    // Animation features
    'Pet personality animations',
    'Emotional intelligence',
    'Premium micro-interactions',
    'Performance monitoring',
    '60fps guaranteed animations',
    'Accessibility support',
    'Battery optimization',
    'Haptic feedback coordination',
    
    // Component features
    'Emotional button components',
    'Interactive pet cards',
    'Responsive illustrations',
    'Accessible interactions',
    
    // System features
    'Complete icon library',
    'Illustration system',
    'Interaction patterns',
    'Accessibility compliance',
  ],
  
  principles: [
    'Emotional connection comes first',
    'Performance is non-negotiable',
    'Accessibility is built-in, not added on',
    'Every interaction should delight',
    'Consistency creates trust',
    'Simplicity enables joy',
  ],
  
  requirements: {
    'react-native': '>=0.70.0',
    'react': '>=18.0.0',
    'react-native-reanimated': '>=3.0.0',
    'react-native-gesture-handler': '>=2.0.0',
    'expo-haptics': '>=12.0.0',
    'react-native-svg': '>=13.0.0',
  },
  
  browsers: {
    ios: '>=13.0',
    android: '>=6.0',
  },
} as const;

// ====================================
// THEME CONFIGURATION
// ====================================

/**
 * Default theme configuration for TailTracker
 * Combines all design tokens into a cohesive theme
 */
export const defaultTheme = {
  colors: require('./core/colors').default,
  spacing: require('./core/spacing').default,
  typography: require('./core/typography').default,
  animations: require('./animations').AnimationPresets,
} as const;

// ====================================
// DEVELOPMENT UTILITIES
// ====================================

/**
 * Development utilities for debugging and testing the design system
 */
export const designSystemUtils = {
  // Animation debugging
  enableAnimationDebugging: () => {
    if (__DEV__) {
      console.log('🎬 TailTracker Animation Debugging Enabled');
      // Enable animation performance overlay
      const { usePerformanceOverlay } = require('./animations');
      return usePerformanceOverlay(true);
    }
  },
  
  // Design token inspection
  inspectTokens: () => {
    if (__DEV__) {
      console.log('🎨 TailTracker Design Tokens:', {
        colors: require('./core/colors').default,
        spacing: require('./core/spacing').default,
        typography: require('./core/typography').default,
      });
    }
  },
  
  // Animation performance report
  getAnimationReport: () => {
    if (__DEV__) {
      const { AnimationPerformanceMonitor } = require('./animations');
      const monitor = AnimationPerformanceMonitor.getInstance();
      return monitor.getPerformanceReport();
    }
    return 'Performance monitoring only available in development';
  },
} as const;

// ====================================
// DEFAULT EXPORT
// ====================================

/**
 * Default export contains the most commonly used items from the design system
 */
export default {
  // Most used design tokens
  colors: require('./core/colors').default,
  spacing: require('./core/spacing').default,
  typography: require('./core/typography').default,
  
  // Most used animations
  useEmotionalIntelligence: require('./animations').useEmotionalIntelligence,
  useTailWagAnimation: require('./animations').useTailWagAnimation,
  useHeartEyesAnimation: require('./animations').useHeartEyesAnimation,
  usePremiumButtonAnimation: require('./animations').usePremiumButtonAnimation,
  useSuccessCelebration: require('./animations').useSuccessCelebration,
  
  // Most used components
  EmotionalButton: require('./components/buttons/EmotionalButton').default,
  PetCard: require('./components/cards/PetCard').default,
  
  // System setup
  useDesignSystemSetup,
  
  // Complete systems
  TailTrackerDesignSystem,
  TailTrackerAnimations: require('./animations').TailTrackerAnimations,
  
  // Theme and presets
  defaultTheme,
  AnimationPresets: require('./animations').AnimationPresets,
  
  // Metadata
  DesignSystemInfo,
  
  // Development utilities
  designSystemUtils,
};

/**
 * ====================================
 * GETTING STARTED GUIDE
 * ====================================
 * 
 * 1. Install Dependencies:
 * ```bash
 * npm install react-native-reanimated react-native-gesture-handler expo-haptics react-native-svg
 * ```
 * 
 * 2. Setup Design System:
 * ```typescript
 * import { useDesignSystemSetup } from '@/design-system';
 * 
 * export default function App() {
 *   const { isReady } = useDesignSystemSetup();
 *   
 *   if (!isReady) {
 *     return <LoadingScreen />;
 *   }
 *   
 *   return <YourApp />;
 * }
 * ```
 * 
 * 3. Use Design Tokens:
 * ```typescript
 * import { colors, spacing, typography } from '@/design-system';
 * 
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: colors.primary.main,
 *     padding: spacing.md,
 *   },
 *   text: {
 *     ...typography.heading.h1,
 *     color: colors.text.primary,
 *   },
 * });
 * ```
 * 
 * 4. Add Pet Animations:
 * ```typescript
 * import { useTailWagAnimation, useEmotionalIntelligence } from '@/design-system';
 * 
 * const MyPetComponent = () => {
 *   const { animatedStyle, startWagging } = useTailWagAnimation({
 *     emotion: 'happy',
 *     personality: 'playful',
 *   });
 *   
 *   const { inferEmotionalState } = useEmotionalIntelligence();
 *   
 *   return (
 *     <Animated.View style={animatedStyle}>
 *       {/* Your pet UI */}
 *     </Animated.View>
 *   );
 * };
 * ```
 * 
 * 5. Use Premium Components:
 * ```typescript
 * import { EmotionalButton, PetCard } from '@/design-system';
 * 
 * const MyScreen = () => (
 *   <View>
 *     <PetCard pet={myPet} />
 *     <EmotionalButton 
 *       onPress={handlePress}
 *       emotion="excited"
 *       variant="premium"
 *     >
 *       Premium Action
 *     </EmotionalButton>
 *   </View>
 * );
 * ```
 * 
 * For complete documentation:
 * - See /animations/AnimationImplementationGuide.md
 * - See /DESIGN_SYSTEM_OVERVIEW.md
 * - See /README.md
 */