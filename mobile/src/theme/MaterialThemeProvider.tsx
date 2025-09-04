import React from 'react';

/**
 * Simplified MaterialThemeProvider for testing purposes
 */

// Light theme
export const TailTrackerLightTheme = {
  colors: {
    primary: '#2196F3',
    secondary: '#FF9800',
    surface: '#FFFFFF',
    background: '#F5F5F5',
    text: '#000000',
    card: '#FFFFFF',
    border: '#E5E5E5',
  },
};

// Dark theme
export const TailTrackerDarkTheme = {
  colors: {
    primary: '#64B5F6',
    secondary: '#FFB74D',
    surface: '#1E1E1E',
    background: '#121212',
    text: '#FFFFFF',
    card: '#2D2D2D',
    border: '#404040',
  },
};

// Theme context
const MaterialThemeContext = React.createContext({
  theme: TailTrackerLightTheme,
  toggleTheme: () => {},
  isDarkMode: false,
});

// Theme provider component
export const MaterialThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [theme, setTheme] = React.useState(TailTrackerLightTheme);

  const toggleTheme = React.useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    setTheme(newDarkMode ? TailTrackerDarkTheme : TailTrackerLightTheme);
  }, [isDarkMode]);

  const value = React.useMemo(() => ({
    theme,
    toggleTheme,
    isDarkMode,
  }), [theme, toggleTheme, isDarkMode]);

  return (
    <MaterialThemeContext.Provider value={value}>
      {children}
    </MaterialThemeContext.Provider>
  );
};

// Hook to use theme
export const useMaterialTheme = () => {
  const context = React.useContext(MaterialThemeContext);
  if (!context) {
    throw new Error('useMaterialTheme must be used within MaterialThemeProvider');
  }
  return context;
};

// Hook for theme-aware styles (simplified)
export const useThemeAwareStyles = (getStyles: any) => {
  const { theme } = useMaterialTheme();
  return React.useMemo(() => getStyles(theme), [theme, getStyles]);
};

// Hook for responsive design (simplified)
export const useResponsiveValue = <T,>(values: any, fallback: T): T => {
  return fallback;
};

// Higher-order component wrapper (simplified)
export const withMaterialTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: any }>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { theme } = useMaterialTheme();
    return <Component {...props} theme={theme} ref={ref} />;
  });
};

export default MaterialThemeProvider;