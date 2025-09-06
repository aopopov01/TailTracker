/**
 * Material Theme Configuration
 */

import { DefaultTheme, MD3DarkTheme as DarkTheme, MD3Theme as Theme } from 'react-native-paper';

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

export const materialTheme = {
  light: materialLightTheme,
  dark: materialDarkTheme,
};

export default materialTheme;