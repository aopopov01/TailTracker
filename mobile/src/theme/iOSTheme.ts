import { useColorScheme } from 'react-native';

/**
 * iOS-specific theme configuration following Apple's Human Interface Guidelines
 * This theme provides native iOS styling and colors
 */

// iOS System Colors (iOS 13+)
export const iOSSystemColors = {
  // Primary colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759', 
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D92',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',

  // Gray colors
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',

  // Labels
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C43',
  quaternaryLabel: '#3C3C43',

  // Fills
  systemFill: '#78788033',
  secondarySystemFill: '#78788028',
  tertiarySystemFill: '#7676801E',
  quaternarySystemFill: '#74748014',

  // Backgrounds
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',

  // Grouped backgrounds
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',
  tertiarySystemGroupedBackground: '#F2F2F7',

  // Separators
  separator: '#3C3C4336',
  opaqueSeparator: '#C6C6C8',
};

// iOS Dark Mode Colors
export const iOSSystemColorsDark = {
  // Primary colors (same as light)
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemIndigo: '#5E5CE6',
  systemOrange: '#FF9F0A',
  systemPink: '#FF375F',
  systemPurple: '#BF5AF2',
  systemRed: '#FF453A',
  systemTeal: '#40C8E0',
  systemYellow: '#FFD60A',

  // Gray colors
  systemGray: '#8E8E93',
  systemGray2: '#636366',
  systemGray3: '#48484A',
  systemGray4: '#3A3A3C',
  systemGray5: '#2C2C2E',
  systemGray6: '#1C1C1E',

  // Labels
  label: '#FFFFFF',
  secondaryLabel: '#EBEBF5',
  tertiaryLabel: '#EBEBF5',
  quaternaryLabel: '#EBEBF5',

  // Fills
  systemFill: '#78788033',
  secondarySystemFill: '#78788028',
  tertiarySystemFill: '#7676801E',
  quaternarySystemFill: '#74748014',

  // Backgrounds
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  tertiarySystemBackground: '#2C2C2E',

  // Grouped backgrounds
  systemGroupedBackground: '#000000',
  secondarySystemGroupedBackground: '#1C1C1E',
  tertiarySystemGroupedBackground: '#2C2C2E',

  // Separators
  separator: '#54545836',
  opaqueSeparator: '#38383A',
};

// TailTracker-specific colors
export const tailTrackerColors = {
  primary: '#007AFF',        // iOS Blue
  secondary: '#34C759',      // iOS Green
  accent: '#FF9500',         // iOS Orange
  warning: '#FFCC00',        // iOS Yellow
  error: '#FF3B30',          // iOS Red
  success: '#34C759',        // iOS Green
  info: '#5AC8FA',          // iOS Teal

  // TailTracker brand colors
  petPrimary: '#6B73FF',     // Custom pet blue
  petSecondary: '#9BB5FF',   // Light pet blue
  petAccent: '#FF6B9D',      // Pet pink
  safeZone: '#30D158',       // Green for safe zones
  alertZone: '#FF453A',      // Red for alert zones
};

// Typography following iOS guidelines
export const iOSTypography = {
  // iOS Text Styles
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },
};

// Spacing following iOS guidelines
export const iOSSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // iOS-specific spacing
  systemSpacing: 20,
  readableContentMargin: 16,
  safeAreaInsets: {
    top: 44,    // Status bar + navigation bar
    bottom: 34, // Home indicator
  },
};

// Border radius following iOS guidelines  
export const iOSBorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 20,
  
  // iOS-specific radius
  systemRadius: 10,
  cardRadius: 12,
  buttonRadius: 8,
};

// Shadows following iOS guidelines
export const iOSShadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // iOS-specific shadows
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
};

// Animation configurations for iOS
export const iOSAnimations = {
  // Standard iOS animations
  standard: {
    duration: 250,
    easing: 'easeInOut',
    useNativeDriver: true,
  },
  quick: {
    duration: 150,
    easing: 'easeOut',
    useNativeDriver: true,
  },
  slow: {
    duration: 400,
    easing: 'easeInOut',
    useNativeDriver: true,
  },
  
  // iOS-specific animations
  spring: {
    tension: 100,
    friction: 8,
    useNativeDriver: true,
  },
  modal: {
    duration: 300,
    easing: 'easeInOut',
    useNativeDriver: true,
  },
};

/**
 * Hook to get the current iOS theme based on appearance
 */
export const useIOSTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    ...(isDark ? iOSSystemColorsDark : iOSSystemColors),
    ...tailTrackerColors,
  };

  const theme = {
    colors,
    typography: iOSTypography,
    spacing: iOSSpacing,
    borderRadius: iOSBorderRadius,
    shadows: iOSShadows,
    animations: iOSAnimations,
    isDark,
  };

  return theme;
};

/**
 * Get platform-specific theme properties
 */
export const getIOSThemeProps = (colorScheme: 'light' | 'dark' | null = null) => {
  const isDark = colorScheme === 'dark';

  return {
    // Status bar
    statusBarStyle: isDark ? 'light-content' : 'dark-content',
    
    // Navigation bar
    navigationBarStyle: isDark ? 'dark' : 'light',
    
    // Tab bar
    tabBarStyle: {
      backgroundColor: isDark ? iOSSystemColorsDark.systemBackground : iOSSystemColors.systemBackground,
      borderTopColor: isDark ? iOSSystemColorsDark.separator : iOSSystemColors.separator,
    },
    
    // Keyboard appearance
    keyboardAppearance: isDark ? 'dark' : 'light',
    
    // Activity indicator
    activityIndicatorColor: iOSSystemColors.systemBlue,
  };
};

/**
 * iOS-specific component styles
 */
export const iOSComponentStyles = {
  // Card component
  card: {
    backgroundColor: iOSSystemColors.secondarySystemGroupedBackground,
    borderRadius: iOSBorderRadius.cardRadius,
    ...iOSShadows.card,
    padding: iOSSpacing.md,
  },
  
  // Button styles
  button: {
    primary: {
      backgroundColor: tailTrackerColors.primary,
      borderRadius: iOSBorderRadius.buttonRadius,
      paddingHorizontal: iOSSpacing.md,
      paddingVertical: iOSSpacing.sm + 4,
      minHeight: 44,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: tailTrackerColors.primary,
      borderRadius: iOSBorderRadius.buttonRadius,
      paddingHorizontal: iOSSpacing.md,
      paddingVertical: iOSSpacing.sm + 4,
      minHeight: 44,
    },
    destructive: {
      backgroundColor: tailTrackerColors.error,
      borderRadius: iOSBorderRadius.buttonRadius,
      paddingHorizontal: iOSSpacing.md,
      paddingVertical: iOSSpacing.sm + 4,
      minHeight: 44,
    },
  },
  
  // Input styles
  input: {
    backgroundColor: iOSSystemColors.tertiarySystemBackground,
    borderRadius: iOSBorderRadius.systemRadius,
    borderWidth: 1,
    borderColor: iOSSystemColors.separator,
    paddingHorizontal: iOSSpacing.md,
    paddingVertical: iOSSpacing.sm + 4,
    minHeight: 44,
    fontSize: 17,
    color: iOSSystemColors.label,
  },
  
  // List item styles
  listItem: {
    backgroundColor: iOSSystemColors.secondarySystemGroupedBackground,
    paddingHorizontal: iOSSpacing.md,
    paddingVertical: iOSSpacing.sm + 4,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: iOSSystemColors.separator,
  },
};

/**
 * Theme configuration for different contexts
 */
export const iOSThemeContexts = {
  // Home screen
  home: {
    backgroundColor: iOSSystemColors.systemGroupedBackground,
    cardBackgroundColor: iOSSystemColors.secondarySystemGroupedBackground,
    textColor: iOSSystemColors.label,
    secondaryTextColor: iOSSystemColors.secondaryLabel,
  },
  
  // Settings screen
  settings: {
    backgroundColor: iOSSystemColors.systemGroupedBackground,
    cellBackgroundColor: iOSSystemColors.secondarySystemGroupedBackground,
    separatorColor: iOSSystemColors.separator,
  },
  
  // Map screen
  map: {
    backgroundColor: iOSSystemColors.systemBackground,
    overlayBackgroundColor: iOSSystemColors.secondarySystemBackground,
    safeZoneColor: tailTrackerColors.safeZone,
    alertZoneColor: tailTrackerColors.alertZone,
  },
  
  // Pet profile
  petProfile: {
    backgroundColor: iOSSystemColors.systemBackground,
    cardBackgroundColor: iOSSystemColors.secondarySystemBackground,
    headerBackgroundColor: tailTrackerColors.petPrimary,
  },
};

// Export the complete iOS theme
export const iOSTheme = {
  colors: {
    light: iOSSystemColors,
    dark: iOSSystemColorsDark,
    brand: tailTrackerColors,
  },
  typography: iOSTypography,
  spacing: iOSSpacing,
  borderRadius: iOSBorderRadius,
  shadows: iOSShadows,
  animations: iOSAnimations,
  components: iOSComponentStyles,
  contexts: iOSThemeContexts,
};