// Core colors for TailTracker design system
export const colors = {
  // Primary colors
  primary: '#007AFF',
  primaryLight: '#4D9FFF',
  primaryDark: '#0056CC',
  
  // Secondary colors
  secondary: '#FF3B30',
  secondaryLight: '#FF6B5F',
  secondaryDark: '#D70015',
  
  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black: '#000000',
  },
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },
  
  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // Surface colors
  onSurface: '#111827',
  onSurfaceVariant: '#6B7280',
  
  // Premium colors
  premium: {
    gold: '#FFD700',
    goldLight: '#FFEF7F',
    goldDark: '#B8860B',
  },
} as const;

export type Colors = typeof colors;

export default colors;