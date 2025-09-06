/**
 * TailTracker Advanced Visual Accessibility System
 * 
 * Comprehensive visual accessibility features supporting users with
 * visual impairments, including color blindness, low vision, light sensitivity,
 * and other visual processing differences.
 */

import React, { useState, useEffect, useMemo, useContext, createContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Appearance,
  StatusBar,
  Platform,
  AccessibilityRole,
} from 'react-native';
import AccessibilityManager from './AccessibilityManager';

/**
 * Color Contrast Ratios (WCAG AAA+ Standards)
 */
export const CONTRAST_RATIOS = {
  // Enhanced ratios beyond WCAG AAA (7:1)
  MAXIMUM: 21, // Pure white on pure black
  ENHANCED: 12, // High contrast mode
  AAA_LARGE: 7, // WCAG AAA for large text (18pt+)
  AAA_NORMAL: 7, // WCAG AAA for normal text
  AA_LARGE: 4.5, // WCAG AA for large text
  AA_NORMAL: 4.5, // WCAG AA for normal text
  UI_COMPONENTS: 3, // WCAG AA for UI components
};

/**
 * Color Blindness Support
 */
export const COLOR_BLIND_PALETTES = {
  protanopia: {
    // Red-blind friendly palette
    primary: '#0066CC',
    secondary: '#FF9900',
    success: '#009900',
    warning: '#FFD700',
    danger: '#0066CC', // Use blue instead of red
    info: '#6600CC',
  },
  deuteranopia: {
    // Green-blind friendly palette
    primary: '#CC6600',
    secondary: '#0066FF',
    success: '#0066FF', // Use blue instead of green
    warning: '#FFD700',
    danger: '#CC0000',
    info: '#6600CC',
  },
  tritanopia: {
    // Blue-blind friendly palette
    primary: '#CC0000',
    secondary: '#009900',
    success: '#009900',
    warning: '#FF9900', // Use orange instead of yellow
    danger: '#CC0000',
    info: '#CC0000', // Use red instead of blue
  },
  monochromacy: {
    // Complete color blindness - use contrast only
    primary: '#000000',
    secondary: '#666666',
    success: '#333333',
    warning: '#999999',
    danger: '#000000',
    info: '#444444',
  },
};

/**
 * High Contrast Themes
 */
export const HIGH_CONTRAST_THEMES = {
  standard: {
    background: '#FFFFFF',
    surface: '#FAFAFA',
    text: '#000000',
    textSecondary: '#333333',
    border: '#E0E0E0',
    focusIndicator: '#2196F3',
  },
  high: {
    background: '#FFFFFF',
    surface: '#F0F0F0',
    text: '#000000',
    textSecondary: '#111111',
    border: '#999999',
    focusIndicator: '#0000FF',
  },
  enhanced: {
    background: '#FFFFFF',
    surface: '#E0E0E0',
    text: '#000000',
    textSecondary: '#000000',
    border: '#666666',
    focusIndicator: '#FF0000',
  },
  maximum: {
    background: '#FFFFFF',
    surface: '#CCCCCC',
    text: '#000000',
    textSecondary: '#000000',
    border: '#000000',
    focusIndicator: '#FF0000',
  },
  dark_high: {
    background: '#000000',
    surface: '#111111',
    text: '#FFFFFF',
    textSecondary: '#EEEEEE',
    border: '#666666',
    focusIndicator: '#00FFFF',
  },
  dark_maximum: {
    background: '#000000',
    surface: '#000000',
    text: '#FFFFFF',
    textSecondary: '#FFFFFF',
    border: '#FFFFFF',
    focusIndicator: '#FFFF00',
  },
};

/**
 * Typography Scales for Different Needs
 */
export const TYPOGRAPHY_SCALES = {
  standard: {
    h1: 24,
    h2: 20,
    h3: 18,
    body: 16,
    caption: 14,
    small: 12,
  },
  large: {
    h1: 32,
    h2: 28,
    h3: 24,
    body: 20,
    caption: 18,
    small: 16,
  },
  extraLarge: {
    h1: 40,
    h2: 36,
    h3: 32,
    body: 24,
    caption: 22,
    small: 20,
  },
  dyslexiaFriendly: {
    h1: 26,
    h2: 22,
    h3: 20,
    body: 18,
    caption: 16,
    small: 14,
  },
};

/**
 * Font Families for Accessibility
 */
export const ACCESSIBLE_FONTS = {
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
  }),
  dyslexiaFriendly: Platform.select({
    ios: 'Helvetica',
    android: 'Roboto',
  }),
  highReadability: Platform.select({
    ios: 'Helvetica Neue',
    android: 'Roboto',
  }),
};

/**
 * Visual Accessibility Context
 */
interface VisualAccessibilityContextType {
  theme: any;
  colorPalette: any;
  typography: any;
  contrastMode: 'standard' | 'high' | 'enhanced' | 'maximum';
  colorBlindnessSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromacy';
  fontSizeMultiplier: number;
  fontFamily: string;
  reduceMotion: boolean;
  updateVisualSettings: (settings: Partial<any>) => void;
}

const VisualAccessibilityContext = createContext<VisualAccessibilityContextType | null>(null);

/**
 * Visual Accessibility Provider
 */
interface VisualAccessibilityProviderProps {
  children: React.ReactNode;
}

export const VisualAccessibilityProvider: React.FC<VisualAccessibilityProviderProps> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const accessibilityManager = AccessibilityManager.getInstance();
  const [preferences, setPreferences] = useState(accessibilityManager.getPreferences());

  useEffect(() => {
    const preferencesListener = (newPreferences: any) => {
      setPreferences(newPreferences);
    };

    accessibilityManager.on('preferences-updated', preferencesListener);

    return () => {
      accessibilityManager.off('preferences-updated', preferencesListener);
    };
  }, [accessibilityManager]);

  // Generate theme based on preferences
  const theme = useMemo(() => {
    const visual = preferences.visualAccessibility;
    
    // Base theme selection
    let baseTheme = HIGH_CONTRAST_THEMES.standard;
    
    if (visual.contrastMode === 'high') {
      baseTheme = HIGH_CONTRAST_THEMES.high;
    } else if (visual.contrastMode === 'enhanced') {
      baseTheme = HIGH_CONTRAST_THEMES.enhanced;
    } else if (visual.contrastMode === 'maximum') {
      baseTheme = HIGH_CONTRAST_THEMES.maximum;
    }
    
    // Apply dark mode if preferred
    if (systemColorScheme === 'dark') {
      if (visual.contrastMode === 'maximum') {
        baseTheme = HIGH_CONTRAST_THEMES.dark_maximum;
      } else if (visual.contrastMode !== 'standard') {
        baseTheme = HIGH_CONTRAST_THEMES.dark_high;
      }
    }
    
    return baseTheme;
  }, [preferences.visualAccessibility, systemColorScheme]);

  // Generate color palette based on color blindness support
  const colorPalette = useMemo(() => {
    const colorBlindType = preferences.visualAccessibility.colorBlindnessSupport;
    
    if (colorBlindType !== 'none' && COLOR_BLIND_PALETTES[colorBlindType]) {
      return COLOR_BLIND_PALETTES[colorBlindType];
    }
    
    // Standard palette
    return {
      primary: '#2196F3',
      secondary: '#FF9800',
      success: '#4CAF50',
      warning: '#FFC107',
      danger: '#F44336',
      info: '#00BCD4',
    };
  }, [preferences.visualAccessibility.colorBlindnessSupport]);

  // Generate typography based on preferences
  const typography = useMemo(() => {
    const visual = preferences.visualAccessibility;
    let baseScale = TYPOGRAPHY_SCALES.standard;
    
    // Apply font size multiplier
    const multiplier = visual.fontSizeMultiplier;
    if (multiplier >= 2.0) {
      baseScale = TYPOGRAPHY_SCALES.extraLarge;
    } else if (multiplier >= 1.5) {
      baseScale = TYPOGRAPHY_SCALES.large;
    }
    
    // Apply dyslexia-friendly adjustments
    if (visual.fontFamily === 'dyslexia-friendly') {
      baseScale = TYPOGRAPHY_SCALES.dyslexiaFriendly;
    }
    
    // Apply multiplier to all sizes
    const scaledTypography = Object.entries(baseScale).reduce((acc, [key, size]) => {
      acc[key] = Math.round(size * multiplier);
      return acc;
    }, {} as any);
    
    return {
      ...scaledTypography,
      fontFamily: ACCESSIBLE_FONTS[visual.fontFamily === 'dyslexia-friendly' ? 'dyslexiaFriendly' : visual.fontFamily === 'high-readability' ? 'highReadability' : visual.fontFamily as keyof typeof ACCESSIBLE_FONTS] || ACCESSIBLE_FONTS.system,
      lineHeight: 1.2 + (visual.lineSpacing - 1.0),
      letterSpacing: visual.letterSpacing,
    };
  }, [preferences.visualAccessibility]);

  const updateVisualSettings = async (settings: Partial<any>) => {
    await accessibilityManager.updatePreference('visualAccessibility', settings);
  };

  const value: VisualAccessibilityContextType = {
    theme,
    colorPalette,
    typography,
    contrastMode: preferences.visualAccessibility.contrastMode,
    colorBlindnessSupport: preferences.visualAccessibility.colorBlindnessSupport,
    fontSizeMultiplier: preferences.visualAccessibility.fontSizeMultiplier,
    fontFamily: preferences.visualAccessibility.fontFamily,
    reduceMotion: preferences.visualAccessibility.reduceMotion,
    updateVisualSettings,
  };

  return (
    <VisualAccessibilityContext.Provider value={value}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.background === '#000000' ? 'light-content' : 'dark-content'}
      />
      {children}
    </VisualAccessibilityContext.Provider>
  );
};

/**
 * Hook to use visual accessibility context
 */
export const useVisualAccessibility = () => {
  const context = useContext(VisualAccessibilityContext);
  if (!context) {
    throw new Error('useVisualAccessibility must be used within VisualAccessibilityProvider');
  }
  return context;
};

/**
 * Accessible Text Component
 */
interface AccessibleTextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'text' | 'textSecondary';
  weight?: 'normal' | 'bold';
  align?: 'left' | 'center' | 'right';
  style?: any;
  accessible?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLevel?: number;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  variant = 'body',
  color = 'text',
  weight = 'normal',
  align = 'left',
  style,
  accessible = true,
  accessibilityRole,
  accessibilityLevel,
  ...props
}) => {
  const { theme, colorPalette, typography } = useVisualAccessibility();

  const textStyle = useMemo(() => {
    const baseColor = color === 'text' || color === 'textSecondary' 
      ? theme[color] 
      : colorPalette[color] || theme.text;

    return StyleSheet.create({
      text: {
        fontSize: typography[variant],
        fontFamily: typography.fontFamily,
        lineHeight: typography[variant] * typography.lineHeight,
        letterSpacing: typography.letterSpacing,
        color: baseColor,
        fontWeight: weight === 'bold' ? 'bold' : 'normal',
        textAlign: align,
      },
    }).text;
  }, [theme, colorPalette, typography, variant, color, weight, align]);

  return (
    <Text
      style={[textStyle, style]}
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      {...props}
    >
      {children}
    </Text>
  );
};

/**
 * High Contrast Container
 */
interface AccessibleContainerProps {
  children: React.ReactNode;
  variant?: 'background' | 'surface' | 'card';
  padding?: number;
  margin?: number;
  borderRadius?: number;
  elevation?: number;
  style?: any;
  accessible?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
}

export const AccessibleContainer: React.FC<AccessibleContainerProps> = ({
  children,
  variant = 'surface',
  padding = 16,
  margin = 0,
  borderRadius = 8,
  elevation = 0,
  style,
  accessible = true,
  accessibilityRole,
  accessibilityLabel,
  ...props
}) => {
  const { theme, contrastMode } = useVisualAccessibility();

  const containerStyle = useMemo(() => {
    const backgroundColor = theme[variant];
    const borderColor = theme.border;
    
    // Enhanced borders for high contrast modes
    const borderWidth = contrastMode === 'maximum' ? 2 : 
                       contrastMode === 'enhanced' ? 1 : 0;

    return StyleSheet.create({
      container: {
        backgroundColor,
        padding,
        margin,
        borderRadius,
        borderWidth,
        borderColor,
        elevation: Platform.OS === 'android' ? elevation : 0,
        shadowOffset: Platform.OS === 'ios' && elevation > 0 ? { width: 0, height: 2 } : undefined,
        shadowOpacity: Platform.OS === 'ios' && elevation > 0 ? 0.1 : undefined,
        shadowRadius: Platform.OS === 'ios' && elevation > 0 ? 4 : undefined,
      },
    }).container;
  }, [theme, variant, padding, margin, borderRadius, elevation, contrastMode]);

  return (
    <View
      style={[containerStyle, style]}
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {children}
    </View>
  );
};

/**
 * Enhanced Focus Indicator
 */
interface AccessibleFocusIndicatorProps {
  children: React.ReactNode;
  focused?: boolean;
  style?: any;
}

export const AccessibleFocusIndicator: React.FC<AccessibleFocusIndicatorProps> = ({
  children,
  focused = false,
  style,
}) => {
  const { theme } = useVisualAccessibility();
  const accessibilityManager = AccessibilityManager.getInstance();
  const preferences = accessibilityManager.getPreferences();

  const focusStyle = useMemo(() => {
    if (!focused) return {};

    const focusIndicatorStyle = preferences.visualAccessibility.focusIndicatorStyle;
    const baseColor = theme.focusIndicator;

    switch (focusIndicatorStyle) {
      case 'high-contrast':
        return {
          borderWidth: 3,
          borderColor: baseColor,
          borderStyle: 'solid',
        };
      case 'thick-border':
        return {
          borderWidth: 4,
          borderColor: baseColor,
          borderStyle: 'solid',
        };
      case 'color-fill':
        return {
          backgroundColor: `${baseColor}20`, // 20% opacity
          borderWidth: 2,
          borderColor: baseColor,
        };
      default:
        return {
          borderWidth: 2,
          borderColor: baseColor,
          borderStyle: 'solid',
        };
    }
  }, [focused, theme, preferences]);

  return (
    <View style={[style, focusStyle]}>
      {children}
    </View>
  );
};

/**
 * Color Blind Friendly Icon System
 */
interface ColorBlindFriendlyIconProps {
  type: 'success' | 'warning' | 'danger' | 'info';
  size?: number;
  showIcon?: boolean;
  showText?: boolean;
  style?: any;
}

export const ColorBlindFriendlyIcon: React.FC<ColorBlindFriendlyIconProps> = ({
  type,
  size = 20,
  showIcon = true,
  showText = false,
  style,
}) => {
  const { colorPalette, colorBlindnessSupport } = useVisualAccessibility();

  const iconMap = {
    success: '✓',
    warning: '⚠',
    danger: '✕',
    info: 'ℹ',
  };

  const shapeMap = {
    success: '●', // Circle for success
    warning: '▲', // Triangle for warning
    danger: '■', // Square for danger
    info: '◆', // Diamond for info
  };

  const textMap = {
    success: 'OK',
    warning: 'WARN',
    danger: 'ERROR',
    info: 'INFO',
  };

  const color = colorPalette[type];

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {showIcon && (
        <Text
          style={{
            fontSize: size,
            color,
            marginRight: showText ? 8 : 0,
            fontWeight: 'bold',
          }}
        >
          {colorBlindnessSupport !== 'none' ? shapeMap[type] : iconMap[type]}
        </Text>
      )}
      
      {showText && (
        <AccessibleText
          variant="caption"
          color={type}
          weight="bold"
          style={{ fontSize: size * 0.7 }}
        >
          {textMap[type]}
        </AccessibleText>
      )}
    </View>
  );
};

/**
 * Motion Reduced Animation Component
 */
interface AccessibleAnimationProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'rotate';
  duration?: number;
  enabled?: boolean;
}

export const AccessibleAnimation: React.FC<AccessibleAnimationProps> = ({
  children,
  type = 'fade',
  duration = 300,
  enabled = true,
}) => {
  const { reduceMotion } = useVisualAccessibility();

  // If motion is reduced or animation is disabled, render without animation
  if (reduceMotion || !enabled) {
    return <>{children}</>;
  }

  // In a full implementation, this would include actual animations
  // For now, we'll just render the children
  return <>{children}</>;
};

export default {
  VisualAccessibilityProvider,
  useVisualAccessibility,
  AccessibleText,
  AccessibleContainer,
  AccessibleFocusIndicator,
  ColorBlindFriendlyIcon,
  AccessibleAnimation,
  CONTRAST_RATIOS,
  COLOR_BLIND_PALETTES,
  HIGH_CONTRAST_THEMES,
  TYPOGRAPHY_SCALES,
};