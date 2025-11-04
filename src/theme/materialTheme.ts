/**
 * Material Theme Configuration
 */

import {
  DefaultTheme,
  MD3DarkTheme as DarkTheme,
  MD3Theme as Theme,
} from 'react-native-paper';

export interface MaterialThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  onPrimary: string;
  onSecondary: string;
  onSurface: string;
  onBackground: string;
  onError: string;
  text: string;
  disabled: string;
  placeholder: string;
  backdrop: string;
  notification: string;
}

const lightColors: Partial<MaterialThemeColors> = {
  primary: '#6200ee',
  primaryDark: '#3700b3',
  primaryLight: '#bb86fc',
  accent: '#03dac6',
  background: '#ffffff',
  surface: '#ffffff',
  error: '#b00020',
  onPrimary: '#ffffff',
  onSecondary: '#000000',
  onSurface: '#000000',
  onBackground: '#000000',
  onError: '#ffffff',
  text: '#000000',
  disabled: 'rgba(0, 0, 0, 0.26)',
  placeholder: 'rgba(0, 0, 0, 0.54)',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  notification: '#f50057',
};

const darkColors: Partial<MaterialThemeColors> = {
  primary: '#bb86fc',
  primaryDark: '#3700b3',
  primaryLight: '#bb86fc',
  accent: '#03dac6',
  background: '#121212',
  surface: '#1e1e1e',
  error: '#cf6679',
  onPrimary: '#000000',
  onSecondary: '#ffffff',
  onSurface: '#ffffff',
  onBackground: '#ffffff',
  onError: '#000000',
  text: '#ffffff',
  disabled: 'rgba(255, 255, 255, 0.38)',
  placeholder: 'rgba(255, 255, 255, 0.54)',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  notification: '#ff9800',
};

export const materialLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...lightColors,
  },
};

export const materialDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...darkColors,
  },
};

export const petColors = {
  dog: '#FF6B6B',
  cat: '#4ECDC4',
  bird: '#45B7D1',
  fish: '#96CEB4',
  rabbit: '#FFEAA7',
  hamster: '#DDA0DD',
  reptile: '#98D8C8',
  other: '#A8A8A8',
};

export const statusColors = {
  safe: '#4CAF50',
  alert: '#FF9800',
  danger: '#F44336',
  unknown: '#9E9E9E',
  offline: '#607D8B',
};

export const materialTheme = {
  light: materialLightTheme,
  dark: materialDarkTheme,
};

export default materialTheme;
