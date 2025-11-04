// Spacing constants for TailTracker app
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const spacing = {
  // Base spacing unit (8px)
  base: 8,

  // Standard spacing scale
  xs: 4, // 0.5 * base
  sm: 8, // 1 * base
  md: 16, // 2 * base
  lg: 24, // 3 * base
  xl: 32, // 4 * base
  '2xl': 40, // 5 * base
  '3xl': 48, // 6 * base
  '4xl': 64, // 8 * base
  '5xl': 80, // 10 * base
  '6xl': 96, // 12 * base

  // Component-specific spacing
  components: {
    // Buttons
    buttonPadding: {
      horizontal: 16,
      vertical: 12,
    },
    buttonMargin: {
      horizontal: 8,
      vertical: 8,
    },
    buttonBorder: 8,

    // Cards
    cardPadding: {
      horizontal: 16,
      vertical: 16,
    },
    cardMargin: {
      horizontal: 12,
      vertical: 8,
    },
    cardBorder: 12,

    // Lists
    listItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginVertical: 4,
    },
    listHeader: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },

    // Forms
    input: {
      paddingHorizontal: 12,
      paddingVertical: 16,
      marginVertical: 8,
    },
    formSection: {
      marginVertical: 16,
    },
    fieldSpacing: 12,

    // Navigation
    tabBar: {
      paddingBottom: 20, // Extra padding for home indicator
      paddingTop: 8,
      height: 65,
    },
    drawer: {
      width: 280,
      itemPadding: 16,
    },
    header: {
      paddingHorizontal: 16,
      height: 56,
    },

    // Modals
    modal: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      marginHorizontal: 16,
    },
    modalOverlay: 20,

    // Floating Action Button
    fab: {
      margin: 16,
      bottom: 16,
      right: 16,
    },

    // Chips
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginHorizontal: 4,
      marginVertical: 4,
    },

    // Avatars and Images
    avatar: {
      small: 32,
      medium: 48,
      large: 72,
      xlarge: 96,
    },
    petPhoto: {
      small: 60,
      medium: 100,
      large: 150,
      xlarge: 200,
    },
  },

  // Screen margins and padding
  screen: {
    // Standard screen padding
    paddingHorizontal: 16,
    paddingVertical: 20,

    // Safe area adjustments
    safeArea: {
      top: 44,
      bottom: 34,
    },

    // Content margins
    contentMargin: 20,
    sectionMargin: 24,

    // Maximum content width (for tablets)
    maxContentWidth: 600,
  },

  // Grid system
  grid: {
    // Grid spacing for layouts
    gutter: 16,
    column: (screenWidth - 2 * 16) / 12, // 12-column grid

    // Common grid patterns
    twoColumn: (screenWidth - 3 * 16) / 2,
    threeColumn: (screenWidth - 4 * 16) / 3,
    fourColumn: (screenWidth - 5 * 16) / 4,
  },

  // Border radius values
  borderRadius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },

  // Shadow and elevation
  elevation: {
    none: 0,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
    '2xl': 24,
  },

  // Responsive breakpoints
  breakpoints: {
    sm: 375, // Small phones
    md: 414, // Large phones
    lg: 768, // Tablets (portrait)
    xl: 1024, // Tablets (landscape)
  },

  // Dynamic spacing based on screen size
  responsive: {
    // Padding that scales with screen size
    screenPadding: screenWidth < 375 ? 12 : 16,

    // Margins that adapt to screen size
    sectionSpacing: screenWidth < 375 ? 16 : 24,

    // Component sizes
    componentHeight: {
      button: screenWidth < 375 ? 40 : 48,
      input: screenWidth < 375 ? 44 : 52,
      listItem: screenWidth < 375 ? 56 : 64,
    },
  },

  // Animation and transition values
  animation: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: 'ease-in-out',
  },

  // Touch target sizes (minimum 44x44)
  touchTarget: {
    minimum: 44,
    comfortable: 48,
    large: 56,
  },

  // Special spacing for pet-related components
  pet: {
    profileCard: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      spacing: 16,
    },
    medicalCard: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      itemSpacing: 12,
    },
    vaccinationItem: {
      paddingHorizontal: 12,
      paddingVertical: 16,
      iconSpacing: 12,
    },
  },

  // Layout helpers
  layout: {
    // Flexbox shortcuts
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    spaceBetween: {
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    spaceAround: {
      justifyContent: 'space-around',
      alignItems: 'center',
    },

    // Common container styles
    container: {
      flex: 1,
      paddingHorizontal: 16,
    },
    section: {
      marginVertical: 16,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    column: {
      flexDirection: 'column' as const,
    },
  },
} as const;

// Type definitions
export type SpacingSize = keyof Pick<
  typeof spacing,
  'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
>;
export type BorderRadiusSize = keyof typeof spacing.borderRadius;
export type ElevationSize = keyof typeof spacing.elevation;

// Helper functions
export const getSpacing = (size: SpacingSize | number): number => {
  if (typeof size === 'number') return size;
  return spacing[size];
};

export const getBorderRadius = (size: BorderRadiusSize | number): number => {
  if (typeof size === 'number') return size;
  return spacing.borderRadius[size];
};

export const getElevation = (size: ElevationSize): number => {
  return spacing.elevation[size];
};

// Responsive spacing helpers
export const getResponsiveSpacing = (baseSpacing: number): number => {
  if (screenWidth < spacing.breakpoints.sm) {
    return baseSpacing * 0.8;
  } else if (screenWidth > spacing.breakpoints.lg) {
    return baseSpacing * 1.2;
  }
  return baseSpacing;
};

export const getResponsivePadding = (basePadding: number) => {
  return {
    paddingHorizontal: getResponsiveSpacing(basePadding),
    paddingVertical: getResponsiveSpacing(basePadding * 0.75),
  };
};

export const getResponsiveMargin = (baseMargin: number) => {
  return {
    marginHorizontal: getResponsiveSpacing(baseMargin),
    marginVertical: getResponsiveSpacing(baseMargin * 0.5),
  };
};

// Common padding/margin combinations
export const commonSpacing = {
  // Screen-level spacing
  screenPadding: {
    paddingHorizontal: spacing.screen.paddingHorizontal,
    paddingTop: spacing.screen.paddingVertical,
  },

  // Card spacing
  cardSpacing: {
    padding: spacing.components.cardPadding.horizontal,
    margin: spacing.components.cardMargin.horizontal,
    borderRadius: spacing.borderRadius.lg,
  },

  // Button spacing
  buttonSpacing: {
    paddingHorizontal: spacing.components.buttonPadding.horizontal,
    paddingVertical: spacing.components.buttonPadding.vertical,
    marginHorizontal: spacing.components.buttonMargin.horizontal,
    borderRadius: spacing.borderRadius.md,
  },

  // Input spacing
  inputSpacing: {
    paddingHorizontal: spacing.components.input.paddingHorizontal,
    paddingVertical: spacing.components.input.paddingVertical,
    marginVertical: spacing.components.input.marginVertical,
    borderRadius: spacing.borderRadius.md,
  },
};

export default spacing;
