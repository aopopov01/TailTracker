// Color constants for TailTracker app
export const colors = {
  // Primary colors
  primary: '#6366f1',
  primaryVariant: '#4f46e5',
  primaryContainer: '#e0e7ff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#1e1b4b',

  // Secondary colors
  secondary: '#10b981',
  secondaryVariant: '#059669',
  secondaryContainer: '#d1fae5',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#064e3b',

  // Tertiary colors
  tertiary: '#f59e0b',
  tertiaryVariant: '#d97706',
  tertiaryContainer: '#fef3c7',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#92400e',

  // Surface colors
  surface: '#ffffff',
  surfaceVariant: '#f1f5f9',
  onSurface: '#0f172a',
  onSurfaceVariant: '#64748b',

  // Background colors
  background: '#ffffff',
  onBackground: '#0f172a',

  // Error colors
  error: '#ef4444',
  errorContainer: '#fee2e2',
  onError: '#ffffff',
  onErrorContainer: '#dc2626',

  // Success colors
  success: '#22c55e',
  successContainer: '#dcfce7',
  onSuccess: '#ffffff',
  onSuccessContainer: '#166534',

  // Warning colors
  warning: '#f59e0b',
  warningContainer: '#fef3c7',
  onWarning: '#ffffff',
  onWarningContainer: '#92400e',

  // Info colors
  info: '#3b82f6',
  infoContainer: '#dbeafe',
  onInfo: '#ffffff',
  onInfoContainer: '#1e40af',

  // Outline colors
  outline: '#e2e8f0',
  outlineVariant: '#f1f5f9',

  // Shadow
  shadow: '#000000',
  scrim: 'rgba(0, 0, 0, 0.32)',

  // Base colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Text colors
  text: '#0f172a',
  textSecondary: '#64748b',
  textDisabled: '#9ca3af',

  // Additional primary variants
  primaryDark: '#4338ca',

  // Gray scale
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Pet-specific colors
  petColors: {
    dog: '#8b5cf6',
    cat: '#ec4899',
    bird: '#06b6d4',
    fish: '#0ea5e9',
    rabbit: '#84cc16',
    hamster: '#f97316',
    reptile: '#22c55e',
    other: '#6b7280',
  },

  // Status colors
  status: {
    active: '#22c55e',
    lost: '#ef4444',
    found: '#f59e0b',
    inactive: '#6b7280',
  },

  // Priority colors
  priority: {
    low: '#6b7280',
    medium: '#f59e0b',
    high: '#f97316',
    urgent: '#ef4444',
  },

  // Vaccination status colors
  vaccination: {
    upToDate: '#22c55e',
    due: '#f59e0b',
    overdue: '#ef4444',
    unknown: '#6b7280',
  },

  // Medical condition colors
  medical: {
    healthy: '#22c55e',
    minor: '#f59e0b',
    serious: '#f97316',
    critical: '#ef4444',
  },

  // Grade colors
  grades: {
    A: '#22c55e',
    B: '#84cc16',
    C: '#f59e0b',
    D: '#f97316',
    F: '#ef4444',
  },

  // Dark mode colors (for theme switching)
  dark: {
    primary: '#818cf8',
    primaryContainer: '#3730a3',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    onSurface: '#f1f5f9',
    onSurfaceVariant: '#94a3b8',
    background: '#0f172a',
    onBackground: '#f1f5f9',
    outline: '#475569',
    outlineVariant: '#334155',
  },

  // Gradient colors
  gradients: {
    primary: ['#6366f1', '#8b5cf6'],
    secondary: ['#10b981', '#059669'],
    sunset: ['#f59e0b', '#f97316', '#ef4444'],
    ocean: ['#06b6d4', '#3b82f6', '#6366f1'],
    forest: ['#22c55e', '#16a34a', '#15803d'],
    royal: ['#8b5cf6', '#a855f7', '#c084fc'],
  },

  // Opacity levels
  opacity: {
    disabled: 0.38,
    inactive: 0.60,
    secondary: 0.74,
    primary: 0.87,
    high: 0.95,
  },
} as const;

export type ColorName = keyof typeof colors;
export type PetColorName = keyof typeof colors.petColors;
export type StatusColorName = keyof typeof colors.status;
export type PriorityColorName = keyof typeof colors.priority;

// Helper functions
export const getColorWithOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const getPetColor = (petType: string): string => {
  const normalizedType = petType.toLowerCase() as PetColorName;
  return colors.petColors[normalizedType] || colors.petColors.other;
};

export const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase() as StatusColorName;
  return colors.status[normalizedStatus] || colors.status.inactive;
};

export const getPriorityColor = (priority: string): string => {
  const normalizedPriority = priority.toLowerCase() as PriorityColorName;
  return colors.priority[normalizedPriority] || colors.priority.low;
};

export default colors;