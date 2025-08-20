/**
 * TailTracker Spatial Design System
 * 
 * A harmonious spacing and layout system that creates visual rhythm and emotional
 * flow throughout the app. Every measurement is designed to feel natural and
 * create subconscious comfort for pet parents.
 */

import { Dimensions, Platform } from 'react-native';

// ====================================
// DEVICE DIMENSIONS & BREAKPOINTS
// ====================================

/**
 * Device Information
 * Real-time device dimensions and safe area considerations
 */
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const deviceInfo = {
  screen: {
    width: screenWidth,
    height: screenHeight,
  },
  
  // Breakpoint system for responsive design
  breakpoints: {
    small: 320,    // iPhone SE and smaller
    medium: 375,   // iPhone 12/13/14 standard
    large: 414,    // iPhone 12/13/14 Plus
    xlarge: 768,   // iPad Mini and larger
    xxlarge: 1024, // iPad Pro and larger
  },
  
  // Current device category
  category: (() => {
    if (screenWidth <= 320) return 'small';
    if (screenWidth <= 375) return 'medium';
    if (screenWidth <= 414) return 'large';
    if (screenWidth <= 768) return 'xlarge';
    return 'xxlarge';
  })(),
} as const;

// ====================================
// FUNDAMENTAL SPACING SCALE
// ====================================

/**
 * Base Spacing Units
 * Built on a 4px grid system for pixel-perfect alignment
 */
export const baseSpacing = {
  xxs: 2,    // Micro spacing - tight elements
  xs: 4,     // Extra small - icon padding
  sm: 8,     // Small - button padding
  md: 16,    // Medium - card padding
  lg: 24,    // Large - section spacing
  xl: 32,    // Extra large - screen margins
  xxl: 48,   // Double extra large - major sections
  xxxl: 64,  // Triple extra large - hero sections
} as const;

/**
 * Semantic Spacing System
 * Meaningful spacing names that convey intent and emotion
 */
export const semanticSpacing = {
  // Touch & Interaction
  touchTarget: 44,           // Minimum touch target (Apple HIG)
  touchPadding: 12,          // Comfortable touch padding
  tapArea: 48,               // Generous tap area for important actions
  
  // Content & Readability
  readingMargin: 20,         // Comfortable reading margins
  contentPadding: 16,        // Standard content padding
  textLineSpacing: 8,        // Space between text blocks
  paragraphSpacing: 24,      // Space between paragraphs
  
  // Navigation & Structure
  navigationHeight: Platform.select({
    ios: 44,
    android: 56,
    default: 44,
  }),
  tabBarHeight: Platform.select({
    ios: 49,
    android: 56,
    default: 49,
  }),
  headerHeight: Platform.select({
    ios: 44,
    android: 56,
    default: 44,
  }),
  
  // Safe Areas
  safeAreaTop: Platform.select({
    ios: 44,    // Status bar + navigation bar
    android: 24, // Status bar
    default: 24,
  }),
  safeAreaBottom: Platform.select({
    ios: 34,    // Home indicator
    android: 0,  // No home indicator
    default: 0,
  }),
  
  // Cards & Containers
  cardPadding: 20,           // Internal card padding
  cardMargin: 16,            // Space between cards
  cardRadius: 12,            // Card corner radius
  containerMargin: 20,       // Screen edge margins
  
  // Lists & Items
  listItemHeight: 60,        // Standard list item height
  listItemPadding: 16,       // List item internal padding
  listSeparator: 1,          // Separator line thickness
  listSectionSpacing: 32,    // Space between list sections
  
  // Forms & Inputs
  inputHeight: 48,           // Standard input field height
  inputPadding: 16,          // Input internal padding
  inputMargin: 12,           // Space between inputs
  formSectionSpacing: 40,    // Space between form sections
  
  // Pet-Specific Spacing
  petCardSpacing: 20,        // Space between pet profile cards
  activityItemSpacing: 12,   // Space between activity items
  healthMetricSpacing: 16,   // Space between health metrics
  mapControlSpacing: 16,     // Space around map controls
} as const;

// ====================================
// RESPONSIVE SPACING SYSTEM
// ====================================

/**
 * Responsive Spacing Modifiers
 * Spacing that adapts to different screen sizes for optimal UX
 */
export const responsiveSpacing = {
  small: {
    // Compact spacing for small screens
    containerMargin: 16,
    cardPadding: 16,
    sectionSpacing: 24,
    heroSpacing: 32,
  },
  
  medium: {
    // Standard spacing for medium screens
    containerMargin: 20,
    cardPadding: 20,
    sectionSpacing: 32,
    heroSpacing: 48,
  },
  
  large: {
    // Generous spacing for large screens
    containerMargin: 24,
    cardPadding: 24,
    sectionSpacing: 40,
    heroSpacing: 64,
  },
  
  xlarge: {
    // Tablet-optimized spacing
    containerMargin: 32,
    cardPadding: 32,
    sectionSpacing: 48,
    heroSpacing: 80,
  },
} as const;

// ====================================
// LAYOUT GRID SYSTEM
// ====================================

/**
 * Grid System
 * Flexible grid system for consistent layouts across all screens
 */
export const gridSystem = {
  // Base grid configuration
  columns: 12,               // 12-column grid system
  gutterWidth: 16,           // Space between grid columns
  maxWidth: 1200,            // Maximum content width
  
  // Container widths for different breakpoints
  containerWidths: {
    small: screenWidth - (semanticSpacing.containerMargin * 2),
    medium: screenWidth - (semanticSpacing.containerMargin * 2),
    large: screenWidth - (semanticSpacing.containerMargin * 2),
    xlarge: Math.min(screenWidth - 64, 1200),
  },
  
  // Column calculations
  getColumnWidth: (columns: number, totalColumns: number = 12) => {
    const containerWidth = gridSystem.containerWidths[deviceInfo.category];
    const totalGutters = (totalColumns - 1) * gridSystem.gutterWidth;
    const availableWidth = containerWidth - totalGutters;
    return (availableWidth / totalColumns) * columns + ((columns - 1) * gridSystem.gutterWidth);
  },
} as const;

// ====================================
// COMPONENT-SPECIFIC SPACING
// ====================================

/**
 * Button Spacing System
 * Spacing specifically designed for button comfort and accessibility
 */
export const buttonSpacing = {
  // Internal button padding
  primary: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  
  secondary: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 40,
  },
  
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 32,
  },
  
  // Space between buttons
  stackSpacing: 12,          // Vertical space in button stacks
  groupSpacing: 8,           // Horizontal space in button groups
  
  // Float action button
  fab: {
    size: 56,
    margin: 16,
    elevation: 6,
  },
} as const;

/**
 * Card Spacing System
 * Consistent spacing for card-based layouts
 */
export const cardSpacing = {
  // Pet profile cards
  petCard: {
    padding: 20,
    margin: 16,
    imageSpacing: 16,
    contentSpacing: 12,
  },
  
  // Activity cards
  activityCard: {
    padding: 16,
    margin: 12,
    iconSpacing: 12,
    metricSpacing: 8,
  },
  
  // Health cards
  healthCard: {
    padding: 20,
    margin: 16,
    headerSpacing: 16,
    dataSpacing: 12,
  },
  
  // Notification cards
  notificationCard: {
    padding: 16,
    margin: 8,
    iconSpacing: 12,
    actionSpacing: 16,
  },
} as const;

/**
 * Form Spacing System
 * Optimal spacing for form usability and visual hierarchy
 */
export const formSpacing = {
  // Input field spacing
  input: {
    height: 48,
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  
  // Label spacing
  label: {
    marginBottom: 8,
    marginTop: 24, // When following another input
  },
  
  // Helper text spacing
  helper: {
    marginTop: 4,
    marginBottom: 16,
  },
  
  // Form section spacing
  section: {
    marginBottom: 32,
    headerMargin: 24,
  },
  
  // Checkbox and radio spacing
  choice: {
    itemSpacing: 16,
    groupSpacing: 24,
    labelSpacing: 12,
  },
} as const;

// ====================================
// NAVIGATION SPACING
// ====================================

/**
 * Navigation Spacing System
 * Consistent spacing for all navigation elements
 */
export const navigationSpacing = {
  // Tab bar
  tabBar: {
    height: semanticSpacing.tabBarHeight,
    padding: 8,
    iconSpacing: 4,
    labelSpacing: 2,
  },
  
  // Header navigation
  header: {
    height: semanticSpacing.headerHeight,
    paddingHorizontal: 16,
    titleSpacing: 16,
    actionSpacing: 8,
  },
  
  // Drawer navigation
  drawer: {
    itemHeight: 48,
    itemPadding: 16,
    sectionSpacing: 24,
    iconSpacing: 16,
  },
  
  // Bottom sheet navigation
  bottomSheet: {
    handleHeight: 4,
    handleWidth: 32,
    handleSpacing: 12,
    contentPadding: 20,
  },
} as const;

// ====================================
// MODAL & OVERLAY SPACING
// ====================================

/**
 * Modal Spacing System
 * Spacing for modals, alerts, and overlay content
 */
export const modalSpacing = {
  // Standard modal
  standard: {
    padding: 24,
    margin: 20,
    headerSpacing: 20,
    contentSpacing: 16,
    actionSpacing: 24,
  },
  
  // Alert dialog
  alert: {
    padding: 20,
    margin: 40,
    titleSpacing: 16,
    messageSpacing: 20,
    buttonSpacing: 12,
  },
  
  // Action sheet
  actionSheet: {
    padding: 16,
    itemHeight: 48,
    itemSpacing: 0,
    sectionSpacing: 8,
  },
  
  // Tooltip
  tooltip: {
    padding: 12,
    arrowSize: 8,
    offset: 8,
  },
} as const;

// ====================================
// MAP & LOCATION SPACING
// ====================================

/**
 * Map Interface Spacing
 * Spacing for map-based features and location services
 */
export const mapSpacing = {
  // Map controls
  controls: {
    margin: 16,
    buttonSize: 48,
    buttonSpacing: 12,
  },
  
  // Location markers
  markers: {
    size: 32,
    labelOffset: 8,
    clusterSpacing: 4,
  },
  
  // Safe zone indicators
  safeZone: {
    radiusIndicator: 2,
    labelSpacing: 8,
    adjustmentHandle: 20,
  },
  
  // Map info panel
  infoPanel: {
    padding: 20,
    headerSpacing: 16,
    contentSpacing: 12,
  },
} as const;

// ====================================
// ANIMATION SPACING
// ====================================

/**
 * Animation Spacing Values
 * Spacing values specifically for smooth animations and transitions
 */
export const animationSpacing = {
  // Slide distances
  slideDistance: {
    small: 10,
    medium: 20,
    large: 40,
  },
  
  // Scale factors
  scale: {
    subtle: 0.02,    // 2% scale change
    noticeable: 0.05, // 5% scale change
    dramatic: 0.1,   // 10% scale change
  },
  
  // Stagger delays for list animations
  staggerDelay: 50,  // 50ms between item animations
  
  // Parallax offsets
  parallax: {
    subtle: 0.2,
    medium: 0.5,
    strong: 1.0,
  },
} as const;

// ====================================
// COMPLETE SPACING SYSTEM
// ====================================

/**
 * Complete Spacing System Export
 * All spacing values organized for easy consumption by components
 */
export const tailTrackerSpacing = {
  // Base values
  base: baseSpacing,
  semantic: semanticSpacing,
  
  // Responsive system
  responsive: responsiveSpacing,
  current: responsiveSpacing[deviceInfo.category],
  
  // Layout system
  grid: gridSystem,
  device: deviceInfo,
  
  // Component-specific spacing
  button: buttonSpacing,
  card: cardSpacing,
  form: formSpacing,
  navigation: navigationSpacing,
  modal: modalSpacing,
  map: mapSpacing,
  
  // Animation spacing
  animation: animationSpacing,
} as const;

// ====================================
// SPACING UTILITY FUNCTIONS
// ====================================

/**
 * Spacing Utility Functions
 * Helper functions for applying spacing dynamically
 */
export const spacingUtils = {
  /**
   * Get responsive spacing based on current device
   */
  getResponsiveSpacing: (spacingKey: keyof typeof baseSpacing) => {
    const baseValue = baseSpacing[spacingKey];
    const modifier = deviceInfo.category === 'small' ? 0.8 : 
                    deviceInfo.category === 'xlarge' ? 1.2 : 1.0;
    return Math.round(baseValue * modifier);
  },
  
  /**
   * Create margin object from spacing values
   */
  createMargin: (
    top?: number,
    right?: number,
    bottom?: number,
    left?: number
  ) => ({
    marginTop: top,
    marginRight: right,
    marginBottom: bottom,
    marginLeft: left,
  }),
  
  /**
   * Create padding object from spacing values
   */
  createPadding: (
    top?: number,
    right?: number,
    bottom?: number,
    left?: number
  ) => ({
    paddingTop: top,
    paddingRight: right,
    paddingBottom: bottom,
    paddingLeft: left,
  }),
  
  /**
   * Get safe area insets for current device
   */
  getSafeAreaInsets: () => ({
    top: semanticSpacing.safeAreaTop,
    bottom: semanticSpacing.safeAreaBottom,
    left: 0,
    right: 0,
  }),
  
  /**
   * Calculate grid column width
   */
  getColumnWidth: gridSystem.getColumnWidth,
  
  /**
   * Get spacing for component type
   */
  getComponentSpacing: (
    component: 'button' | 'card' | 'form' | 'navigation' | 'modal' | 'map',
    variant?: string
  ) => {
    const componentSpacing = tailTrackerSpacing[component];
    return variant ? componentSpacing[variant] || componentSpacing : componentSpacing;
  },
};

export default tailTrackerSpacing;