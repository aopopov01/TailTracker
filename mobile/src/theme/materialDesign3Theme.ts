/**
 * Material Design 3 Theme Configuration
 */

import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';

export interface MaterialDesign3Colors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  elevation: {
    level0: string;
    level1: string;
    level2: string;
    level3: string;
    level4: string;
    level5: string;
  };
}

const lightColors: MaterialDesign3Colors = {
  primary: '#6750a4',
  onPrimary: '#ffffff',
  primaryContainer: '#e7ddf7',
  onPrimaryContainer: '#22005d',
  secondary: '#625b71',
  onSecondary: '#ffffff',
  secondaryContainer: '#e8def8',
  onSecondaryContainer: '#1d192b',
  tertiary: '#7d5260',
  onTertiary: '#ffffff',
  tertiaryContainer: '#ffd8e4',
  onTertiaryContainer: '#31111d',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',
  background: '#fef7ff',
  onBackground: '#1c1b1f',
  surface: '#fef7ff',
  onSurface: '#1c1b1f',
  surfaceVariant: '#e7e0ec',
  onSurfaceVariant: '#49454f',
  outline: '#79747e',
  outlineVariant: '#c4c7c5',
  scrim: '#000000',
  inverseSurface: '#313033',
  inverseOnSurface: '#f4eff4',
  inversePrimary: '#d0bcff',
  elevation: {
    level0: 'transparent',
    level1: '#f7f2fa',
    level2: '#f2edf7',
    level3: '#ece6f0',
    level4: '#e9e3ed',
    level5: '#e4dfea',
  },
};

const darkColors: MaterialDesign3Colors = {
  primary: '#d0bcff',
  onPrimary: '#381e72',
  primaryContainer: '#4f378b',
  onPrimaryContainer: '#e7ddf7',
  secondary: '#cbc2db',
  onSecondary: '#332d41',
  secondaryContainer: '#4a4458',
  onSecondaryContainer: '#e8def8',
  tertiary: '#efb8c8',
  onTertiary: '#492532',
  tertiaryContainer: '#633b48',
  onTertiaryContainer: '#ffd8e4',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  background: '#1c1b1f',
  onBackground: '#e6e1e5',
  surface: '#1c1b1f',
  onSurface: '#e6e1e5',
  surfaceVariant: '#49454f',
  onSurfaceVariant: '#cac4d0',
  outline: '#938f99',
  outlineVariant: '#49454f',
  scrim: '#000000',
  inverseSurface: '#e6e1e5',
  inverseOnSurface: '#313033',
  inversePrimary: '#6750a4',
  elevation: {
    level0: 'transparent',
    level1: '#22212a',
    level2: '#28253b',
    level3: '#302d4a',
    level4: '#322f4c',
    level5: '#35324f',
  },
};

export const materialDesign3LightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
};

export const materialDesign3DarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
};

export const materialDesign3Theme = {
  light: materialDesign3LightTheme,
  dark: materialDesign3DarkTheme,
};

// Additional exports for MaterialButton compatibility
export const MaterialComponentStyles = {
  surface: {
    borderRadius: 16,
    elevation: 1,
  },
  button: {
    borderRadius: 20,
    minHeight: 40,
  },
};

export const StateLayerOpacity = {
  hover: 0.08,
  focus: 0.12,
  pressed: 0.12,
  disabled: 0.12,
};

export default materialDesign3Theme;