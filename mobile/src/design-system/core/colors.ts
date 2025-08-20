/**
 * TailTracker Emotional Color System
 * 
 * A scientifically-crafted color palette designed to evoke trust, safety, joy, and deep 
 * emotional connections between pets and their humans. Each color is chosen for its 
 * psychological impact and cultural associations with pet care and love.
 */

// ====================================
// PRIMARY EMOTIONAL PALETTE
// ====================================

/**
 * Primary Brand Colors - The Heart of TailTracker
 * These colors represent the core emotional states we want to evoke
 */
export const emotionalPrimary = {
  // Trust & Security - Deep blues that convey reliability and protection
  trustBlue: '#1E3A8A',        // Deep trust - primary CTA color
  guardianBlue: '#3B82F6',     // Guardian protection - secondary actions
  skyBlue: '#60A5FA',          // Open sky freedom - tertiary elements
  
  // Love & Warmth - Soft corals and roses that evoke unconditional love
  heartCoral: '#F87171',       // Warm love - emotional highlights
  snuggleRose: '#FB7185',      // Cozy comfort - warm interactions
  gentlePink: '#FBBF24',       // Gentle affection - subtle warmth
  
  // Joy & Playfulness - Vibrant greens and yellows for happy moments
  playGreen: '#10B981',        // Active play - success states
  joyfulLime: '#84CC16',       // Pure joy - celebration moments
  sunshineYellow: '#F59E0B',   // Bright happiness - attention grabbers
  
  // Calm & Peace - Soothing purples and lavenders for relaxation
  peaceLavender: '#8B5CF6',    // Peaceful rest - calming elements
  zenViolet: '#A855F7',        // Deep calm - meditation states
  dreamPurple: '#C084FC',      // Sweet dreams - gentle backgrounds
} as const;

/**
 * Contextual Emotional Colors
 * Colors that respond to specific emotional contexts and pet care scenarios
 */
export const contextualColors = {
  // Safety & Security
  safeHaven: '#059669',        // Deep forest green - secure zones
  alertAmber: '#D97706',       // Warm amber - gentle warnings
  emergencyRed: '#DC2626',     // Clear red - urgent situations
  unknownGray: '#6B7280',      // Neutral gray - unknown status
  
  // Health & Wellness
  healthyGreen: '#16A34A',     // Vibrant health - good status
  concernOrange: '#EA580C',    // Health concern - needs attention
  criticalRed: '#B91C1C',      // Critical health - immediate action
  recoveryBlue: '#0284C7',     // Recovery process - healing
  
  // Pet Personality Colors - Celebrating Individual Character
  loyalBrown: '#92400E',       // Loyal companion - earth tones
  playfulOrange: '#EA580C',    // Energetic playmate - bright energy
  gentleBeige: '#A3A3A3',      // Gentle soul - soft neutrals
  wiseGray: '#52525B',         // Wise elder - distinguished grays
  mischievousGold: '#CA8A04',  // Playful troublemaker - golden mischief
} as const;

// ====================================
// ADAPTIVE COLOR SYSTEM
// ====================================

/**
 * Light Mode Color Palette
 * Optimized for daytime use with high contrast and energy
 */
export const lightModeColors = {
  // Surfaces & Backgrounds
  background: '#FFFFFF',           // Pure white - clean canvas
  surfacePrimary: '#F8FAFC',      // Soft white - main content areas
  surfaceSecondary: '#F1F5F9',    // Light gray - secondary containers
  surfaceTertiary: '#E2E8F0',     // Medium gray - subtle divisions
  
  // Text & Content
  textPrimary: '#0F172A',         // Deep charcoal - primary text
  textSecondary: '#475569',       // Medium gray - secondary text
  textTertiary: '#94A3B8',        // Light gray - tertiary text
  textInverse: '#FFFFFF',         // White text - dark backgrounds
  
  // Interactive Elements
  interactive: emotionalPrimary.trustBlue,
  interactiveHover: emotionalPrimary.guardianBlue,
  interactivePressed: '#1E40AF',
  interactiveDisabled: '#D1D5DB',
  
  // Feedback Colors
  success: contextualColors.healthyGreen,
  warning: contextualColors.alertAmber,
  error: contextualColors.emergencyRed,
  info: emotionalPrimary.skyBlue,
  
  // Borders & Dividers
  borderPrimary: '#E5E7EB',       // Subtle borders
  borderSecondary: '#D1D5DB',     // Medium borders
  borderTertiary: '#9CA3AF',      // Strong borders
  
  // Overlay & Shadows
  overlay: 'rgba(15, 23, 42, 0.4)',  // Modal overlays
  shadowLight: 'rgba(0, 0, 0, 0.05)', // Soft shadows
  shadowMedium: 'rgba(0, 0, 0, 0.1)',  // Card shadows
  shadowStrong: 'rgba(0, 0, 0, 0.25)', // Prominent shadows
} as const;

/**
 * Dark Mode Color Palette
 * Optimized for evening use with reduced eye strain and premium feel
 */
export const darkModeColors = {
  // Surfaces & Backgrounds
  background: '#0F172A',           // Deep navy - immersive background
  surfacePrimary: '#1E293B',      // Dark slate - main content areas
  surfaceSecondary: '#334155',    // Medium slate - secondary containers
  surfaceTertiary: '#475569',     // Light slate - subtle divisions
  
  // Text & Content
  textPrimary: '#F8FAFC',         // Soft white - primary text
  textSecondary: '#CBD5E1',       // Light gray - secondary text
  textTertiary: '#94A3B8',        // Medium gray - tertiary text
  textInverse: '#0F172A',         // Dark text - light backgrounds
  
  // Interactive Elements
  interactive: emotionalPrimary.skyBlue,
  interactiveHover: emotionalPrimary.guardianBlue,
  interactivePressed: '#2563EB',
  interactiveDisabled: '#4B5563',
  
  // Feedback Colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',
  
  // Borders & Dividers
  borderPrimary: '#374151',       // Subtle borders
  borderSecondary: '#4B5563',     // Medium borders
  borderTertiary: '#6B7280',      // Strong borders
  
  // Overlay & Shadows
  overlay: 'rgba(0, 0, 0, 0.6)',     // Modal overlays
  shadowLight: 'rgba(0, 0, 0, 0.2)',  // Soft shadows
  shadowMedium: 'rgba(0, 0, 0, 0.3)',  // Card shadows
  shadowStrong: 'rgba(0, 0, 0, 0.5)',  // Prominent shadows
} as const;

// ====================================
// PET-SPECIFIC COLOR PERSONALITIES
// ====================================

/**
 * Pet Type Color Associations
 * Each pet type gets a carefully selected color that reflects their typical characteristics
 */
export const petTypeColors = {
  dog: {
    primary: '#92400E',      // Loyal brown - man's best friend
    secondary: '#F59E0B',    // Golden energy - playful spirit
    background: '#FEF3C7',   // Warm cream - cozy comfort
  },
  cat: {
    primary: '#7C3AED',      // Mysterious purple - independent spirit
    secondary: '#C084FC',    // Soft lavender - graceful elegance
    background: '#F3E8FF',   // Light purple - regal sophistication
  },
  bird: {
    primary: '#0891B2',      // Sky blue - freedom and flight
    secondary: '#22D3EE',    // Bright cyan - vibrant personality
    background: '#CFFAFE',   // Light cyan - airy lightness
  },
  fish: {
    primary: '#0284C7',      // Ocean blue - aquatic serenity
    secondary: '#38BDF8',    // Light blue - flowing grace
    background: '#DBEAFE',   // Pale blue - tranquil waters
  },
  rabbit: {
    primary: '#DB2777',      // Soft pink - gentle nature
    secondary: '#F472B6',    // Rose pink - sweet innocence
    background: '#FCE7F3',   // Pale pink - tender care
  },
  hamster: {
    primary: '#A3A3A3',      // Soft gray - small but mighty
    secondary: '#D4D4D8',    // Light gray - playful energy
    background: '#F4F4F5',   // Pale gray - cozy nesting
  },
  reptile: {
    primary: '#16A34A',      // Forest green - ancient wisdom
    secondary: '#4ADE80',    // Bright green - natural beauty
    background: '#DCFCE7',   // Pale green - exotic charm
  },
  other: {
    primary: '#6366F1',      // Indigo - unique spirit
    secondary: '#A5B4FC',    // Light indigo - special bond
    background: '#E0E7FF',   // Pale indigo - individual love
  },
} as const;

// ====================================
// MOOD & ACTIVITY COLORS
// ====================================

/**
 * Pet Mood Indicator Colors
 * Colors that help users instantly understand their pet's emotional state
 */
export const moodColors = {
  happy: {
    color: '#22C55E',        // Bright green - pure joy
    background: '#DCFCE7',   // Light green background
    icon: '😊',
  },
  playful: {
    color: '#F59E0B',        // Orange energy - ready to play
    background: '#FEF3C7',   // Light orange background
    icon: '🐕',
  },
  calm: {
    color: '#8B5CF6',        // Peaceful purple - relaxed state
    background: '#F3E8FF',   // Light purple background
    icon: '😌',
  },
  sleepy: {
    color: '#64748B',        // Soft gray - rest time
    background: '#F1F5F9',   // Light gray background
    icon: '😴',
  },
  anxious: {
    color: '#EAB308',        // Concern yellow - needs attention
    background: '#FEF9C3',   // Light yellow background
    icon: '😰',
  },
  excited: {
    color: '#EC4899',        // Pink excitement - high energy
    background: '#FCE7F3',   // Light pink background
    icon: '🤩',
  },
} as const;

/**
 * Activity Level Colors
 * Visual indicators for pet activity and exercise levels
 */
export const activityColors = {
  veryActive: {
    color: '#DC2626',        // High energy red
    label: 'Very Active',
    description: 'High energy, lots of movement',
  },
  active: {
    color: '#EA580C',        // Active orange
    label: 'Active',
    description: 'Good activity level',
  },
  moderate: {
    color: '#F59E0B',        // Moderate yellow
    label: 'Moderate',
    description: 'Some activity, room for more',
  },
  low: {
    color: '#6B7280',        // Low gray
    label: 'Low Activity',
    description: 'Minimal movement today',
  },
  resting: {
    color: '#8B5CF6',        // Peaceful purple
    label: 'Resting',
    description: 'Well-deserved rest time',
  },
} as const;

// ====================================
// GRADIENT COLLECTIONS
// ====================================

/**
 * Emotional Gradients
 * Beautiful gradients that create depth and emotional resonance
 */
export const emotionalGradients = {
  // Trust & Security
  protectiveBlue: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
  guardianShield: 'linear-gradient(135deg, #1E40AF 0%, #60A5FA 100%)',
  
  // Love & Warmth
  heartWarmth: 'linear-gradient(135deg, #F87171 0%, #FB7185 100%)',
  snuggleTime: 'linear-gradient(135deg, #FB7185 0%, #FBBF24 100%)',
  
  // Joy & Energy
  playfulBounce: 'linear-gradient(135deg, #10B981 0%, #84CC16 100%)',
  sunshineDay: 'linear-gradient(135deg, #F59E0B 0%, #FDE047 100%)',
  
  // Calm & Peace
  peacefulEvening: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
  dreamyNight: 'linear-gradient(135deg, #A855F7 0%, #C084FC 100%)',
  
  // Special Occasions
  celebrationRainbow: 'linear-gradient(135deg, #F87171 0%, #F59E0B 25%, #84CC16 50%, #3B82F6 75%, #8B5CF6 100%)',
  premiumGold: 'linear-gradient(135deg, #F59E0B 0%, #FDE047 50%, #F59E0B 100%)',
} as const;

// ====================================
// ACCESSIBILITY COLORS
// ====================================

/**
 * High Contrast Color Pairs
 * Ensuring WCAG 2.1 AA compliance for all users
 */
export const accessibilityColors = {
  highContrastPairs: {
    // Primary text combinations (4.5:1 ratio minimum)
    darkOnLight: { text: '#0F172A', background: '#FFFFFF' },
    lightOnDark: { text: '#FFFFFF', background: '#0F172A' },
    blueOnWhite: { text: '#1E3A8A', background: '#FFFFFF' },
    whiteOnBlue: { text: '#FFFFFF', background: '#1E3A8A' },
    
    // Secondary text combinations (3:1 ratio minimum for large text)
    grayOnLight: { text: '#475569', background: '#F8FAFC' },
    lightGrayOnDark: { text: '#CBD5E1', background: '#1E293B' },
  },
  
  // Color-blind friendly alternatives
  colorBlindSafe: {
    red: '#CC3311',      // Protanopia/Deuteranopia safe red
    green: '#009988',    // Safe green alternative
    blue: '#0077BB',     // Safe blue alternative
    orange: '#EE7733',   // Safe orange alternative
    purple: '#AA3377',   // Safe purple alternative
    yellow: '#FFDD44',   // Safe yellow alternative
  },
  
  // Focus indicators
  focusRing: {
    color: '#3B82F6',
    width: 2,
    offset: 2,
    style: 'solid',
  },
} as const;

// ====================================
// SEMANTIC COLOR SYSTEM
// ====================================

/**
 * Semantic Colors with Emotional Context
 * Colors that convey meaning while maintaining emotional connection
 */
export const semanticColors = {
  // Success States - Green family with warm undertones
  successPrimary: '#16A34A',       // Primary success green
  successSecondary: '#22C55E',     // Lighter success green
  successBackground: '#F0FDF4',    // Success background
  successBorder: '#BBF7D0',        // Success border
  
  // Warning States - Amber family with caring warmth
  warningPrimary: '#D97706',       // Primary warning amber
  warningSecondary: '#F59E0B',     // Lighter warning amber
  warningBackground: '#FFFBEB',    // Warning background
  warningBorder: '#FED7AA',        // Warning border
  
  // Error States - Red family with gentle urgency
  errorPrimary: '#DC2626',         // Primary error red
  errorSecondary: '#EF4444',       // Lighter error red
  errorBackground: '#FEF2F2',      // Error background
  errorBorder: '#FECACA',          // Error border
  
  // Info States - Blue family with trustworthy calm
  infoPrimary: '#0284C7',          // Primary info blue
  infoSecondary: '#0EA5E9',        // Lighter info blue
  infoBackground: '#F0F9FF',       // Info background
  infoBorder: '#BAE6FD',           // Info border
} as const;

// ====================================
// EXPORT COLLECTIONS
// ====================================

/**
 * Complete Color System Export
 * All colors organized for easy consumption by components
 */
export const tailTrackerColors = {
  // Core emotional palette
  primary: emotionalPrimary,
  contextual: contextualColors,
  
  // Adaptive themes
  light: lightModeColors,
  dark: darkModeColors,
  
  // Pet-specific colors
  petTypes: petTypeColors,
  moods: moodColors,
  activities: activityColors,
  
  // Visual enhancements
  gradients: emotionalGradients,
  
  // Accessibility & semantics
  accessibility: accessibilityColors,
  semantic: semanticColors,
} as const;

/**
 * Color Utility Functions
 */
export const colorUtils = {
  /**
   * Get color with opacity
   */
  withOpacity: (color: string, opacity: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
  
  /**
   * Get pet type color by pet type
   */
  getPetColor: (petType: keyof typeof petTypeColors) => {
    return petTypeColors[petType] || petTypeColors.other;
  },
  
  /**
   * Get mood color by mood state
   */
  getMoodColor: (mood: keyof typeof moodColors) => {
    return moodColors[mood] || moodColors.calm;
  },
  
  /**
   * Get activity color by activity level
   */
  getActivityColor: (level: keyof typeof activityColors) => {
    return activityColors[level] || activityColors.moderate;
  },
};

export default tailTrackerColors;