import { Platform } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

// TailTracker brand colors for Material Design 3
const TailTrackerColors = {
  // Primary palette - Warm and trustworthy tones
  primary: {
    light: '#6750A4',
    main: '#6750A4',
    dark: '#4F378B',
    container: '#EADDFF',
    onContainer: '#21005D',
  },
  
  // Secondary palette - Complementary pet-friendly colors
  secondary: {
    light: '#625B71',
    main: '#625B71',
    dark: '#4A4458',
    container: '#E8DEF8',
    onContainer: '#1D192B',
  },
  
  // Tertiary palette - Nature-inspired colors
  tertiary: {
    light: '#7D5260',
    main: '#7D5260',
    dark: '#633B48',
    container: '#FFD8E4',
    onContainer: '#31111D',
  },
  
  // Error colors
  error: {
    light: '#BA1A1A',
    main: '#BA1A1A',
    dark: '#93000A',
    container: '#FFDAD6',
    onContainer: '#410002',
  },
  
  // Pet-specific semantic colors
  pet: {
    health: {
      excellent: '#00C853',
      good: '#4CAF50',
      warning: '#FF9800',
      critical: '#F44336',
    },
    activity: {
      high: '#FF5722',
      medium: '#FF9800',
      low: '#9E9E9E',
    },
    mood: {
      happy: '#FFEB3B',
      content: '#8BC34A',
      stressed: '#FF9800',
      anxious: '#F44336',
    },
  },
  
  // Background and surface colors
  surface: {
    light: '#FFFBFE',
    dark: '#1C1B1F',
    variant: '#E7E0EC',
    darkVariant: '#49454F',
  },
  
  // Outline colors
  outline: {
    light: '#79747E',
    dark: '#938F99',
    variant: '#CAC4D0',
    darkVariant: '#49454F',
  },
};

// Typography configuration for Android
const fontConfig = {
  android: {
    regular: {
      fontFamily: 'Roboto',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'Roboto-Medium',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'Roboto-Light',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'Roboto-Thin',
      fontWeight: '100' as const,
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100' as const,
    },
  },
};

// Material Design 3 Light Theme
export const TailTrackerLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: TailTrackerColors.primary.main,
    onPrimary: '#FFFFFF',
    primaryContainer: TailTrackerColors.primary.container,
    onPrimaryContainer: TailTrackerColors.primary.onContainer,
    
    secondary: TailTrackerColors.secondary.main,
    onSecondary: '#FFFFFF',
    secondaryContainer: TailTrackerColors.secondary.container,
    onSecondaryContainer: TailTrackerColors.secondary.onContainer,
    
    tertiary: TailTrackerColors.tertiary.main,
    onTertiary: '#FFFFFF',
    tertiaryContainer: TailTrackerColors.tertiary.container,
    onTertiaryContainer: TailTrackerColors.tertiary.onContainer,
    
    error: TailTrackerColors.error.main,
    onError: '#FFFFFF',
    errorContainer: TailTrackerColors.error.container,
    onErrorContainer: TailTrackerColors.error.onContainer,
    
    background: TailTrackerColors.surface.light,
    onBackground: '#1C1B1F',
    surface: TailTrackerColors.surface.light,
    onSurface: '#1C1B1F',
    surfaceVariant: TailTrackerColors.surface.variant,
    onSurfaceVariant: '#49454F',
    
    outline: TailTrackerColors.outline.light,
    outlineVariant: TailTrackerColors.outline.variant,
    
    // Custom pet colors
    ...TailTrackerColors.pet,
  },
  fonts: configureFonts({ config: fontConfig as any }),
  roundness: 16, // Material Design 3 rounded corners
};

// Material Design 3 Dark Theme
export const TailTrackerDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#D0BCFF',
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
    
    secondary: '#CCC2DC',
    onSecondary: '#332D41',
    secondaryContainer: '#4A4458',
    onSecondaryContainer: '#E8DEF8',
    
    tertiary: '#EFB8C8',
    onTertiary: '#492532',
    tertiaryContainer: '#633B48',
    onTertiaryContainer: '#FFD8E4',
    
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    
    background: TailTrackerColors.surface.dark,
    onBackground: '#E6E1E5',
    surface: TailTrackerColors.surface.dark,
    onSurface: '#E6E1E5',
    surfaceVariant: TailTrackerColors.surface.darkVariant,
    onSurfaceVariant: '#CAC4D0',
    
    outline: TailTrackerColors.outline.dark,
    outlineVariant: TailTrackerColors.outline.darkVariant,
    
    // Custom pet colors (adjusted for dark theme)
    pet: {
      health: {
        excellent: '#66BB6A',
        good: '#81C784',
        warning: '#FFB74D',
        critical: '#E57373',
      },
      activity: {
        high: '#FF8A65',
        medium: '#FFB74D',
        low: '#BDBDBD',
      },
      mood: {
        happy: '#FFF176',
        content: '#AED581',
        stressed: '#FFB74D',
        anxious: '#E57373',
      },
    },
  },
  fonts: configureFonts({ config: fontConfig as any }),
  roundness: 16,
};

// Theme variants for different contexts
export const PetProfileTheme = {
  ...TailTrackerLightTheme,
  colors: {
    ...TailTrackerLightTheme.colors,
    // Warmer colors for pet profiles
    primary: '#8BC34A',
    primaryContainer: '#DCEDC8',
    surface: '#F8F9FA',
  },
};

export const EmergencyTheme = {
  ...TailTrackerLightTheme,
  colors: {
    ...TailTrackerLightTheme.colors,
    // High contrast colors for emergency situations
    primary: '#D32F2F',
    primaryContainer: '#FFEBEE',
    surface: '#FFFFFF',
    error: '#B71C1C',
  },
};

export const VetTheme = {
  ...TailTrackerLightTheme,
  colors: {
    ...TailTrackerLightTheme.colors,
    // Medical/professional colors
    primary: '#1976D2',
    primaryContainer: '#E3F2FD',
    surface: '#FAFAFA',
  },
};

// Component-specific theme extensions
export const MaterialComponentStyles = {
  button: {
    // Filled button (primary)
    filled: {
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 24,
      elevation: 1,
    },
    
    // Outlined button
    outlined: {
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderWidth: 1,
    },
    
    // Text button
    text: {
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    
    // Elevated button
    elevated: {
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 24,
      elevation: 1,
    },
    
    // Tonal button
    tonal: {
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
  },
  
  card: {
    // Standard card
    standard: {
      borderRadius: 12,
      elevation: 1,
      margin: 8,
    },
    
    // Elevated card
    elevated: {
      borderRadius: 12,
      elevation: 3,
      margin: 8,
    },
    
    // Filled card
    filled: {
      borderRadius: 12,
      elevation: 0,
      margin: 8,
    },
    
    // Outlined card
    outlined: {
      borderRadius: 12,
      elevation: 0,
      borderWidth: 1,
      margin: 8,
    },
  },
  
  textInput: {
    // Filled text input
    filled: {
      borderRadius: 4,
      backgroundColor: 'rgba(103, 80, 164, 0.04)',
    },
    
    // Outlined text input
    outlined: {
      borderRadius: 4,
      borderWidth: 1,
    },
  },
  
  navigationBar: {
    // Bottom navigation
    bottom: {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      elevation: 3,
    },
    
    // Top app bar
    top: {
      elevation: 0,
      borderBottomWidth: 1,
    },
  },
  
  fab: {
    // Floating action button
    standard: {
      borderRadius: 16,
      elevation: 6,
    },
    
    // Large FAB
    large: {
      borderRadius: 28,
      elevation: 6,
    },
    
    // Small FAB
    small: {
      borderRadius: 12,
      elevation: 6,
    },
    
    // Extended FAB
    extended: {
      borderRadius: 16,
      elevation: 6,
      paddingHorizontal: 16,
    },
  },
  
  chip: {
    // Assist chip
    assist: {
      borderRadius: 8,
      borderWidth: 1,
    },
    
    // Filter chip
    filter: {
      borderRadius: 8,
      borderWidth: 1,
    },
    
    // Input chip
    input: {
      borderRadius: 8,
    },
    
    // Suggestion chip
    suggestion: {
      borderRadius: 8,
      elevation: 1,
    },
  },
};

// Animation durations following Material Design 3
export const MaterialAnimations = {
  duration: {
    short1: 50,   // micro-interactions
    short2: 100,  // micro-interactions
    short3: 150,  // micro-interactions
    short4: 200,  // micro-interactions
    medium1: 250, // small components
    medium2: 300, // small components
    medium3: 350, // small components
    medium4: 400, // small components
    long1: 450,   // large components
    long2: 500,   // large components
    long3: 550,   // large components
    long4: 600,   // large components
    extraLong1: 700, // complex transitions
    extraLong2: 800, // complex transitions
    extraLong3: 900, // complex transitions
    extraLong4: 1000, // complex transitions
  },
  
  easing: {
    standard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
    decelerated: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
    accelerated: 'cubic-bezier(0.4, 0.0, 1, 1.0)',
    emphasized: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
  },
};

// Elevation levels for Android
export const MaterialElevation = {
  level0: 0,  // surfaces at rest
  level1: 1,  // cards, small components
  level2: 3,  // medium components
  level3: 6,  // large components, FABs
  level4: 8,  // navigation drawers
  level5: 12, // modal bottom sheets, menus
};

// Responsive breakpoints
export const MaterialBreakpoints = {
  compact: 600,  // phones in portrait
  medium: 840,   // tablets in portrait, phones in landscape
  expanded: 1200, // tablets in landscape, desktops
};

// State layer opacities for interactive components
export const StateLayerOpacity = {
  hover: 0.08,
  focus: 0.12,
  pressed: 0.12,
  dragged: 0.16,
  selected: 0.12,
  activated: 0.12,
  disabled: 0.12,
};

// Export default theme based on platform
export const defaultMaterialTheme = Platform.OS === 'android' 
  ? TailTrackerLightTheme 
  : TailTrackerLightTheme;

export default {
  light: TailTrackerLightTheme,
  dark: TailTrackerDarkTheme,
  petProfile: PetProfileTheme,
  emergency: EmergencyTheme,
  vet: VetTheme,
  components: MaterialComponentStyles,
  animations: MaterialAnimations,
  elevation: MaterialElevation,
  breakpoints: MaterialBreakpoints,
  stateLayer: StateLayerOpacity,
};