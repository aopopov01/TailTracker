import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

// TailTracker Brand Colors
const brandColors = {
  primary: '#2E7D32', // Green for pets/nature
  primaryContainer: '#A5D6A7',
  secondary: '#FF6F00', // Orange for energy/playfulness
  secondaryContainer: '#FFE0B2',
  tertiary: '#1976D2', // Blue for trust/reliability
  tertiaryContainer: '#BBDEFB',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  background: '#FAFAFA',
  error: '#D32F2F',
  errorContainer: '#FFCDD2',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#1B5E20',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#E65100',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#0D47A1',
  onSurface: '#212121',
  onSurfaceVariant: '#424242',
  onBackground: '#212121',
  onError: '#FFFFFF',
  onErrorContainer: '#B71C1C',
  outline: '#BDBDBD',
  outlineVariant: '#E0E0E0',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2E2E2E',
  inverseOnSurface: '#F5F5F5',
  inversePrimary: '#81C784',
};

const darkBrandColors = {
  primary: '#81C784',
  primaryContainer: '#2E7D32',
  secondary: '#FFB74D',
  secondaryContainer: '#FF6F00',
  tertiary: '#64B5F6',
  tertiaryContainer: '#1976D2',
  surface: '#121212',
  surfaceVariant: '#1E1E1E',
  background: '#0E0E0E',
  error: '#F44336',
  errorContainer: '#D32F2F',
  onPrimary: '#1B5E20',
  onPrimaryContainer: '#FFFFFF',
  onSecondary: '#E65100',
  onSecondaryContainer: '#FFFFFF',
  onTertiary: '#0D47A1',
  onTertiaryContainer: '#FFFFFF',
  onSurface: '#E0E0E0',
  onSurfaceVariant: '#BDBDBD',
  onBackground: '#E0E0E0',
  onError: '#FFFFFF',
  onErrorContainer: '#FFFFFF',
  outline: '#757575',
  outlineVariant: '#424242',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#F5F5F5',
  inverseOnSurface: '#2E2E2E',
  inversePrimary: '#2E7D32',
};

// Custom fonts configuration
const fontConfig = configureFonts({
  config: {
    fontFamily: 'System',
  },
});

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...brandColors,
  },
  fonts: fontConfig,
  roundness: 12,
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkBrandColors,
  },
  fonts: fontConfig,
  roundness: 12,
};

// Pet-specific color palette
export const petColors = {
  dog: '#8BC34A',
  cat: '#FF9800',
  bird: '#03DAC6',
  fish: '#2196F3',
  rabbit: '#E91E63',
  hamster: '#795548',
  reptile: '#4CAF50',
  other: '#9E9E9E',
};

// Status colors
export const statusColors = {
  safe: '#4CAF50',
  alert: '#FF9800',
  danger: '#F44336',
  unknown: '#9E9E9E',
  offline: '#424242',
};

// Severity colors for notifications
export const severityColors = {
  low: '#2196F3',
  medium: '#FF9800',
  high: '#F44336',
  critical: '#AD1457',
};

export type Theme = typeof lightTheme;
export type ThemeColors = typeof lightTheme.colors;