import React, { createContext, useContext, useState, useEffect } from 'react';
import { StatusBar, useColorScheme, Platform } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  TailTrackerLightTheme, 
  TailTrackerDarkTheme,
  PetProfileTheme,
  EmergencyTheme,
  VetTheme,
} from './materialDesign3Theme';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeVariant = 'default' | 'petProfile' | 'emergency' | 'vet';

interface ThemeContextType {
  theme: typeof TailTrackerLightTheme;
  themeMode: ThemeMode;
  themeVariant: ThemeVariant;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeVariant: (variant: ThemeVariant) => void;
  toggleTheme: () => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@TailTracker:theme_mode';
const THEME_VARIANT_STORAGE_KEY = '@TailTracker:theme_variant';

interface MaterialThemeProviderProps {
  children: React.ReactNode;
  initialThemeMode?: ThemeMode;
  initialThemeVariant?: ThemeVariant;
}

export const MaterialThemeProvider: React.FC<MaterialThemeProviderProps> = ({
  children,
  initialThemeMode = 'system',
  initialThemeVariant = 'default',
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialThemeMode);
  const [themeVariant, setThemeVariantState] = useState<ThemeVariant>(initialThemeVariant);
  const [isLoading, setIsLoading] = useState(true);

  // Determine if dark mode should be active
  const isDarkMode = 
    themeMode === 'dark' || 
    (themeMode === 'system' && systemColorScheme === 'dark');

  // Get the current theme based on mode and variant
  const getCurrentTheme = () => {
    let baseTheme = isDarkMode ? TailTrackerDarkTheme : TailTrackerLightTheme;
    
    // Apply theme variant
    switch (themeVariant) {
      case 'petProfile':
        baseTheme = isDarkMode ? TailTrackerDarkTheme : PetProfileTheme;
        break;
      case 'emergency':
        baseTheme = isDarkMode ? TailTrackerDarkTheme : EmergencyTheme;
        break;
      case 'vet':
        baseTheme = isDarkMode ? TailTrackerDarkTheme : VetTheme;
        break;
      default:
        // Use base theme
        break;
    }
    
    return baseTheme;
  };

  const theme = getCurrentTheme();

  // Load saved theme preferences
  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        const [savedThemeMode, savedThemeVariant] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(THEME_VARIANT_STORAGE_KEY),
        ]);

        if (savedThemeMode && ['light', 'dark', 'system'].includes(savedThemeMode)) {
          setThemeModeState(savedThemeMode as ThemeMode);
        }

        if (savedThemeVariant && ['default', 'petProfile', 'emergency', 'vet'].includes(savedThemeVariant)) {
          setThemeVariantState(savedThemeVariant as ThemeVariant);
        }
      } catch (error) {
        console.warn('Failed to load theme preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreferences();
  }, []);

  // Save theme mode to storage
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme mode:', error);
    }
  };

  // Save theme variant to storage
  const setThemeVariant = async (variant: ThemeVariant) => {
    try {
      setThemeVariantState(variant);
      await AsyncStorage.setItem(THEME_VARIANT_STORAGE_KEY, variant);
    } catch (error) {
      console.warn('Failed to save theme variant:', error);
    }
  };

  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Reset to system theme
  const resetTheme = () => {
    setThemeMode('system');
    setThemeVariant('default');
  };

  // Update status bar based on theme
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(theme.colors.surface, true);
      StatusBar.setBarStyle(
        isDarkMode ? 'light-content' : 'dark-content',
        true
      );
    }
  }, [theme, isDarkMode]);

  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    themeVariant,
    isDarkMode,
    setThemeMode,
    setThemeVariant,
    toggleTheme,
    resetTheme,
  };

  if (isLoading) {
    // Return loading component or null while loading preferences
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <PaperProvider theme={theme}>
        <StatusBar
          backgroundColor={theme.colors.surface}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          translucent={false}
        />
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useMaterialTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useMaterialTheme must be used within a MaterialThemeProvider');
  }
  return context;
};

// Hook for theme-aware styles
export const useThemedStyles = <T extends Record<string, any>>(
  getStyles: (theme: typeof TailTrackerLightTheme) => T
): T => {
  const { theme } = useMaterialTheme();
  return React.useMemo(() => getStyles(theme), [theme, getStyles]);
};

// Hook for responsive design
export const useResponsiveValue = <T>(
  values: {
    compact?: T;
    medium?: T;
    expanded?: T;
  },
  fallback: T
): T => {
  const { theme } = useMaterialTheme();
  // This would need to be implemented with actual screen dimensions
  // For now, return fallback
  return fallback;
};

// Theme-aware component wrapper
export const withMaterialTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: typeof TailTrackerLightTheme }>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { theme } = useMaterialTheme();
    return <Component {...props} theme={theme} ref={ref} />;
  });
};

// Utility functions for theming
export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation - could be enhanced
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

export const getColorWithOpacity = (color: string, opacity: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const interpolateColor = (
  color1: string,
  color2: string,
  factor: number
): string => {
  // Simple linear interpolation between two colors
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  
  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Theme context types for TypeScript
export type MaterialTheme = typeof TailTrackerLightTheme;
export type MaterialColors = typeof TailTrackerLightTheme.colors;