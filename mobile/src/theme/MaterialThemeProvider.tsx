// Material Theme Provider for TailTracker
import React, { createContext, useContext, ReactNode } from 'react';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { colors } from '../design-system/core/colors';

interface MaterialTheme {
  colors: typeof colors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  shadows: {
    small: object;
    medium: object;
    large: object;
  };
}

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const borderRadius = {
  small: 4,
  medium: 8,
  large: 16,
};

const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

const materialTheme: MaterialTheme = {
  colors,
  spacing,
  borderRadius,
  shadows,
};

// Create the light theme
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background.primary,
    surface: colors.background.secondary,
    text: colors.text.primary,
  },
};

// Create the dark theme
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.neutral.gray900,
    surface: colors.neutral.gray800,
    text: colors.text.inverse,
  },
};

const MaterialThemeContext = createContext<{
  theme: MaterialTheme;
  isDark: boolean;
  toggleTheme: () => void;
}>({
  theme: materialTheme,
  isDark: false,
  toggleTheme: () => {},
});

interface MaterialThemeProviderProps {
  children: ReactNode;
  isDark?: boolean;
}

export const MaterialThemeProvider: React.FC<MaterialThemeProviderProps> = ({
  children,
  isDark = false,
}) => {
  const [darkMode, setDarkMode] = React.useState(isDark);

  const toggleTheme = React.useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const contextValue = React.useMemo(() => ({
    theme: materialTheme,
    isDark: darkMode,
    toggleTheme,
  }), [darkMode, toggleTheme]);

  return (
    <MaterialThemeContext.Provider value={contextValue}>
      <PaperProvider theme={darkMode ? darkTheme : lightTheme}>
        {children}
      </PaperProvider>
    </MaterialThemeContext.Provider>
  );
};

export const useMaterialTheme = () => {
  const context = useContext(MaterialThemeContext);
  if (!context) {
    throw new Error('useMaterialTheme must be used within a MaterialThemeProvider');
  }
  return context;
};

export const useThemeAwareStyles = () => {
  const { theme, isDark } = useMaterialTheme();
  return {
    theme,
    isDark,
    isDarkMode: isDark,
  };
};

export default MaterialThemeProvider;