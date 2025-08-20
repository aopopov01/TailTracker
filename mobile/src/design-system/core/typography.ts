/**
 * TailTracker Emotional Typography System
 * 
 * A carefully crafted typographic hierarchy that creates emotional connections through
 * visual storytelling. Each type style is designed to convey specific emotions and 
 * guide users through their pet care journey with warmth, trust, and clarity.
 */

import { Platform } from 'react-native';

// ====================================
// FONT FAMILIES & WEIGHTS
// ====================================

/**
 * Font Family System
 * Platform-optimized fonts that maintain consistency while respecting native conventions
 */
export const fontFamilies = {
  // Primary font family - Modern, friendly, and trustworthy
  primary: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  
  // Display font family - For headers and hero content
  display: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  
  // Monospace font family - For technical content and data
  monospace: Platform.select({
    ios: 'SF Mono',
    android: 'Roboto Mono',
    default: 'monospace',
  }),
} as const;

/**
 * Font Weight System
 * Semantic font weights that create visual hierarchy and emotional tone
 */
export const fontWeights = {
  thin: '100',        // Ultra-light - delicate accents
  light: '300',       // Light - subtle information
  regular: '400',     // Regular - body text
  medium: '500',      // Medium - emphasized content
  semibold: '600',    // Semi-bold - important information
  bold: '700',        // Bold - strong emphasis
  heavy: '800',       // Heavy - powerful statements
  black: '900',       // Black - maximum impact
} as const;

// ====================================
// EMOTIONAL TYPOGRAPHY HIERARCHY
// ====================================

/**
 * Hero Typography - For emotional impact and brand moments
 * Large, bold typography that creates immediate emotional connection
 */
export const heroTypography = {
  // Splash screen and major brand moments
  brandHero: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: fontWeights.heavy,
    fontFamily: fontFamilies.display,
    letterSpacing: -1.2,
    textAlign: 'center' as const,
    // Emotional context: "TailTracker" on splash screen
  },
  
  // Onboarding and major milestones
  milestoneHero: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: fontWeights.bold,
    fontFamily: fontFamilies.display,
    letterSpacing: -0.9,
    textAlign: 'center' as const,
    // Emotional context: "Welcome home, Max!" first login
  },
  
  // Pet profile headers and celebration moments
  celebrationHero: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: fontWeights.bold,
    fontFamily: fontFamilies.display,
    letterSpacing: -0.8,
    textAlign: 'center' as const,
    // Emotional context: "Happy Birthday!" pet celebrations
  },
} as const;

/**
 * Display Typography - For section headers and important information
 * Creates visual hierarchy while maintaining emotional warmth
 */
export const displayTypography = {
  // Screen titles and main headers
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeights.bold,
    fontFamily: fontFamilies.primary,
    letterSpacing: -0.5,
    // Emotional context: "My Pets", "Health Dashboard"
  },
  
  // Section headers within screens
  sectionHeader: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamilies.primary,
    letterSpacing: -0.3,
    // Emotional context: "Recent Activity", "Health Trends"
  },
  
  // Card titles and feature headers
  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamilies.primary,
    letterSpacing: -0.2,
    // Emotional context: "Today's Walk", "Vet Appointment"
  },
  
  // Subheaders and category labels
  subheader: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.primary,
    letterSpacing: -0.1,
    // Emotional context: "This Week", "Upcoming Events"
  },
} as const;

/**
 * Body Typography - For readable content and user interface text
 * Optimized for legibility and emotional clarity
 */
export const bodyTypography = {
  // Main body text for articles and descriptions
  bodyLarge: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: fontWeights.regular,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0,
    // Emotional context: Pet care tips, health advice
  },
  
  // Standard body text for most UI content
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeights.regular,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0,
    // Emotional context: List items, form labels
  },
  
  // Smaller body text for secondary information
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.1,
    // Emotional context: Timestamps, helper text
  },
  
  // Emphasized body text for important messages
  bodyEmphasized: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0,
    // Emotional context: Important notifications, key information
  },
} as const;

/**
 * Interactive Typography - For buttons, links, and interactive elements
 * Clear, actionable text that guides user behavior
 */
export const interactiveTypography = {
  // Primary action buttons
  buttonPrimary: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.1,
    textAlign: 'center' as const,
    // Emotional context: "Find My Pet", "Set Safe Zone"
  },
  
  // Secondary action buttons
  buttonSecondary: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.1,
    textAlign: 'center' as const,
    // Emotional context: "View Details", "Edit Profile"
  },
  
  // Text links and navigation items
  link: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0,
    textDecorationLine: 'underline' as const,
    // Emotional context: "Learn more", "Terms of Service"
  },
  
  // Tab bar and navigation labels
  navigation: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
    // Emotional context: "Home", "Maps", "Profile"
  },
} as const;

/**
 * Utility Typography - For data, labels, and system information
 * Clear, functional text that provides essential information
 */
export const utilityTypography = {
  // Form input labels
  inputLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.1,
    // Emotional context: "Pet Name", "Breed", "Age"
  },
  
  // Form placeholder text
  placeholder: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0,
    // Emotional context: "Enter your pet's name"
  },
  
  // Helper text and hints
  helper: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.2,
    // Emotional context: "This helps us provide better care tips"
  },
  
  // Error messages
  error: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.1,
    // Emotional context: "Please enter a valid email address"
  },
  
  // Data labels and metrics
  dataLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
    // Emotional context: "STEPS TODAY", "LAST SEEN"
  },
  
  // Large data values
  dataValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: fontWeights.bold,
    fontFamily: fontFamilies.primary,
    letterSpacing: -0.2,
    // Emotional context: "2,847", "12:30 PM"
  },
  
  // Small data values
  dataValueSmall: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamilies.primary,
    letterSpacing: -0.1,
    // Emotional context: "15.2 lbs", "72°F"
  },
} as const;

// ====================================
// EMOTIONAL TYPOGRAPHY MODIFIERS
// ====================================

/**
 * Emotional Typography Modifiers
 * Style variations that add emotional context to base typography
 */
export const emotionalModifiers = {
  // Warm and inviting - for welcoming messages
  warm: {
    color: '#F59E0B',        // Warm golden color
    fontWeight: fontWeights.medium,
    // Usage: Welcome messages, positive feedback
  },
  
  // Trustworthy and secure - for safety-related content
  secure: {
    color: '#1E3A8A',        // Deep trust blue
    fontWeight: fontWeights.semibold,
    // Usage: Security features, location services
  },
  
  // Gentle and caring - for health and wellness content
  caring: {
    color: '#059669',        // Caring green
    fontWeight: fontWeights.medium,
    // Usage: Health tips, care reminders
  },
  
  // Urgent but calm - for important alerts without panic
  urgent: {
    color: '#DC2626',        // Alert red
    fontWeight: fontWeights.semibold,
    // Usage: Important notifications, missing pet alerts
  },
  
  // Playful and fun - for engagement and delight
  playful: {
    color: '#8B5CF6',        // Playful purple
    fontWeight: fontWeights.medium,
    // Usage: Game elements, achievements, fun facts
  },
  
  // Premium and exclusive - for premium features
  premium: {
    color: '#92400E',        // Premium gold
    fontWeight: fontWeights.semibold,
    // Usage: Premium features, upgrade prompts
  },
} as const;

// ====================================
// RESPONSIVE TYPOGRAPHY SYSTEM
// ====================================

/**
 * Responsive Typography Scales
 * Typography that adapts to different screen sizes while maintaining emotional impact
 */
export const responsiveScales = {
  // Small screens (phones in portrait)
  small: {
    scaleMultiplier: 0.9,
    lineHeightAdjustment: 0.9,
    letterSpacingAdjustment: 0.1,
  },
  
  // Medium screens (phones in landscape, small tablets)
  medium: {
    scaleMultiplier: 1.0,
    lineHeightAdjustment: 1.0,
    letterSpacingAdjustment: 0,
  },
  
  // Large screens (tablets)
  large: {
    scaleMultiplier: 1.1,
    lineHeightAdjustment: 1.1,
    letterSpacingAdjustment: -0.1,
  },
} as const;

// ====================================
// ACCESSIBILITY TYPOGRAPHY
// ====================================

/**
 * Accessibility Typography Settings
 * Typography options that ensure readability for all users
 */
export const accessibilityTypography = {
  // Large text for visually impaired users
  largeText: {
    fontScale: 1.3,
    lineHeightScale: 1.2,
    fontWeightIncrease: 100, // Increase font weight for better contrast
  },
  
  // High contrast text combinations
  highContrast: {
    lightBackground: '#0F172A',  // Dark text on light background
    darkBackground: '#FFFFFF',   // Light text on dark background
    minimumContrast: 4.5,        // WCAG AA standard
  },
  
  // Dyslexia-friendly adjustments
  dyslexiaFriendly: {
    letterSpacingIncrease: 0.12, // Increased letter spacing
    wordSpacingIncrease: 0.16,   // Increased word spacing
    lineHeightIncrease: 1.5,     // Increased line height
  },
} as const;

// ====================================
// ANIMATION-READY TYPOGRAPHY
// ====================================

/**
 * Typography Animation Properties
 * Typography settings optimized for smooth animations and transitions
 */
export const animatedTypography = {
  // Fade-in text animations
  fadeIn: {
    opacity: 0,
    transform: [{ translateY: 10 }],
    animationDuration: 300,
    animationEasing: 'easeOut',
  },
  
  // Scale text animations for emphasis
  scaleEmphasis: {
    transform: [{ scale: 1.05 }],
    animationDuration: 200,
    animationEasing: 'easeInOut',
  },
  
  // Typewriter effect for onboarding
  typewriter: {
    animationDuration: 50, // Per character
    animationEasing: 'linear',
    cursorColor: '#3B82F6',
  },
} as const;

// ====================================
// COMPLETE TYPOGRAPHY SYSTEM
// ====================================

/**
 * Complete Typography System Export
 * All typography styles organized for easy consumption by components
 */
export const tailTrackerTypography = {
  // Font configuration
  fonts: fontFamilies,
  weights: fontWeights,
  
  // Typography hierarchy
  hero: heroTypography,
  display: displayTypography,
  body: bodyTypography,
  interactive: interactiveTypography,
  utility: utilityTypography,
  
  // Emotional enhancements
  emotional: emotionalModifiers,
  
  // Adaptive features
  responsive: responsiveScales,
  accessibility: accessibilityTypography,
  animated: animatedTypography,
} as const;

// ====================================
// TYPOGRAPHY UTILITY FUNCTIONS
// ====================================

/**
 * Typography Utility Functions
 * Helper functions for applying typography styles dynamically
 */
export const typographyUtils = {
  /**
   * Apply responsive scaling to typography
   */
  applyResponsiveScale: (
    baseStyle: any, 
    screenSize: keyof typeof responsiveScales
  ) => {
    const scale = responsiveScales[screenSize];
    return {
      ...baseStyle,
      fontSize: baseStyle.fontSize * scale.scaleMultiplier,
      lineHeight: baseStyle.lineHeight * scale.lineHeightAdjustment,
      letterSpacing: (baseStyle.letterSpacing || 0) + scale.letterSpacingAdjustment,
    };
  },
  
  /**
   * Apply emotional modifier to typography
   */
  applyEmotionalModifier: (
    baseStyle: any,
    modifier: keyof typeof emotionalModifiers
  ) => {
    const emotionalStyle = emotionalModifiers[modifier];
    return {
      ...baseStyle,
      ...emotionalStyle,
    };
  },
  
  /**
   * Create accessible typography with proper contrast
   */
  createAccessibleStyle: (
    baseStyle: any,
    backgroundColor: string,
    isLargeText: boolean = false
  ) => {
    // This would typically integrate with a contrast checking library
    // For now, returning the base style with accessibility enhancements
    return {
      ...baseStyle,
      ...(isLargeText && accessibilityTypography.largeText),
    };
  },
};

export default tailTrackerTypography;