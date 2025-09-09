// Font constants for TailTracker app
import { Platform } from 'react-native';

export const fonts = {
  // Font families
  families: {
    primary: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    secondary: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto',
      default: 'System',
    }),
    monospace: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },

  // Font sizes
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    '6xl': 36,
    '7xl': 42,
    '8xl': 48,
    '9xl': 56,
  },

  // Font weights
  weights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  } as const,

  // Common weight shortcuts (for backward compatibility)
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',

  // Line heights
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },

  // Predefined text styles
  styles: {
    // Headers
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 1.25,
      letterSpacing: -0.4,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600' as const,
      lineHeight: 1.3,
      letterSpacing: -0.2,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 1.35,
      letterSpacing: 0,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    h5: {
      fontSize: 18,
      fontWeight: '500' as const,
      lineHeight: 1.45,
      letterSpacing: 0,
    },
    h6: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 1.5,
      letterSpacing: 0,
    },

    // Body text
    body1: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.43,
      letterSpacing: 0,
    },
    body3: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 1.33,
      letterSpacing: 0,
    },

    // Captions
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 1.33,
      letterSpacing: 0.4,
    },
    overline: {
      fontSize: 10,
      fontWeight: '500' as const,
      lineHeight: 1.6,
      letterSpacing: 1.2,
      textTransform: 'uppercase' as const,
    },

    // Buttons
    button: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 1.75,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
    },
    buttonLarge: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1.5,
      letterSpacing: 0.2,
    },
    buttonSmall: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 1.33,
      letterSpacing: 0.4,
    },

    // Labels
    label: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 1.43,
      letterSpacing: 0,
    },
    labelSmall: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 1.33,
      letterSpacing: 0.4,
    },

    // Navigation
    tabLabel: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 1.33,
      letterSpacing: 0.4,
    },
    drawerLabel: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 1.5,
      letterSpacing: 0,
    },

    // Specialized
    petName: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 1.33,
      letterSpacing: 0,
    },
    petBreed: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.43,
      letterSpacing: 0,
    },
    appTitle: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 1.25,
      letterSpacing: -0.2,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    cardSubtitle: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.43,
      letterSpacing: 0,
    },
    timestamp: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 1.33,
      letterSpacing: 0,
    },
  },

  // Responsive text sizes (for different screen sizes)
  responsive: {
    small: {
      h1: 28,
      h2: 24,
      h3: 20,
      h4: 18,
      h5: 16,
      h6: 14,
      body1: 14,
      body2: 12,
    },
    medium: {
      h1: 32,
      h2: 28,
      h3: 24,
      h4: 20,
      h5: 18,
      h6: 16,
      body1: 16,
      body2: 14,
    },
    large: {
      h1: 36,
      h2: 32,
      h3: 28,
      h4: 24,
      h5: 20,
      h6: 18,
      body1: 18,
      body2: 16,
    },
  },

  // Platform-specific adjustments
  platform: {
    ios: {
      // iOS tends to render fonts slightly larger
      adjustmentFactor: 0.95,
      baselineOffset: Platform.OS === 'ios' ? 2 : 0,
    },
    android: {
      // Android standard sizing
      adjustmentFactor: 1.0,
      baselineOffset: 0,
    },
  },
} as const;

// Type definitions
export type FontFamily = keyof typeof fonts.families;
export type FontSize = keyof typeof fonts.sizes;
export type FontWeight = keyof typeof fonts.weights;
export type LineHeight = keyof typeof fonts.lineHeights;
export type LetterSpacing = keyof typeof fonts.letterSpacing;
export type TextStyle = keyof typeof fonts.styles;

// Helper functions
export const getFontFamily = (family: FontFamily = 'primary'): string => {
  return fonts.families[family];
};

export const getFontSize = (size: FontSize): number => {
  return fonts.sizes[size];
};

export const getFontWeight = (weight: FontWeight): string => {
  return fonts.weights[weight];
};

export const getTextStyle = (style: TextStyle) => {
  return fonts.styles[style];
};

export const createTextStyle = (
  size: FontSize | number,
  weight: FontWeight = 'normal',
  family: FontFamily = 'primary',
  lineHeight?: number,
  letterSpacing?: number
) => {
  return {
    fontFamily: getFontFamily(family),
    fontSize: typeof size === 'number' ? size : getFontSize(size),
    fontWeight: getFontWeight(weight),
    lineHeight: lineHeight || fonts.lineHeights.normal,
    letterSpacing: letterSpacing || fonts.letterSpacing.normal,
  };
};

// Responsive font scaling
export const getResponsiveFontSize = (baseSize: number, screenWidth: number): number => {
  if (screenWidth < 375) {
    return baseSize * 0.9;
  } else if (screenWidth > 414) {
    return baseSize * 1.1;
  }
  return baseSize;
};

export default fonts;