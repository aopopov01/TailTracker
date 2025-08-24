/**
 * TailTracker Accessibility System
 * 
 * Comprehensive accessibility framework ensuring WCAG 2.1 AA compliance
 * and inclusive design for all pet parents, regardless of their abilities.
 * Every feature is designed to be accessible from the ground up.
 */

import { Platform, AccessibilityInfo, Dimensions } from 'react-native';
import { tailTrackerColors } from '../core/colors';
import { tailTrackerTypography } from '../core/typography';
import { tailTrackerSpacing } from '../core/spacing';

// ====================================
// WCAG 2.1 COMPLIANCE FRAMEWORK
// ====================================

/**
 * WCAG 2.1 AA Compliance Standards
 * Implementation guidelines for accessibility standards
 */
export const WCAGStandards = {
  // Level A Requirements (Minimum)
  levelA: {
    nonTextContent: {
      requirement: '1.1.1',
      description: 'All non-text content has text alternatives',
      implementation: 'alt text, accessibility labels, descriptions',
    },
    audioVideoAlternatives: {
      requirement: '1.2.1',
      description: 'Audio and video content has alternatives',
      implementation: 'captions, transcripts, audio descriptions',
    },
    keyboardAccessible: {
      requirement: '2.1.1',
      description: 'All functionality available via keyboard',
      implementation: 'tab navigation, focus management, skip links',
    },
    seizuresFlashes: {
      requirement: '2.3.1',
      description: 'No content flashes more than 3 times per second',
      implementation: 'animation limits, flash detection',
    },
    pageTitle: {
      requirement: '2.4.2',
      description: 'Web pages have descriptive titles',
      implementation: 'screen titles, navigation context',
    },
    focusOrder: {
      requirement: '2.4.3',
      description: 'Focus order is logical and meaningful',
      implementation: 'tab order, focus management',
    },
    linkPurpose: {
      requirement: '2.4.4',
      description: 'Link purpose is clear from context',
      implementation: 'descriptive link text, context',
    },
    languageOfPage: {
      requirement: '3.1.1',
      description: 'Language of page is programmatically determined',
      implementation: 'locale settings, language attributes',
    },
    onFocus: {
      requirement: '3.2.1',
      description: 'No unexpected context changes on focus',
      implementation: 'predictable focus behavior',
    },
    onInput: {
      requirement: '3.2.2',
      description: 'No unexpected context changes on input',
      implementation: 'predictable input behavior',
    },
    errorIdentification: {
      requirement: '3.3.1',
      description: 'Input errors are identified and described',
      implementation: 'error messages, validation feedback',
    },
    labelsInstructions: {
      requirement: '3.3.2',
      description: 'Labels and instructions are provided',
      implementation: 'form labels, input instructions',
    },
    parsing: {
      requirement: '4.1.1',
      description: 'Content can be parsed reliably',
      implementation: 'valid markup, semantic structure',
    },
    nameRoleValue: {
      requirement: '4.1.2',
      description: 'UI components have accessible names and roles',
      implementation: 'accessibility properties, semantic roles',
    },
  },
  
  // Level AA Requirements (Target)
  levelAA: {
    contrast: {
      requirement: '1.4.3',
      description: 'Text has contrast ratio of at least 4.5:1',
      implementation: 'color contrast validation, testing tools',
      minimumRatio: 4.5,
      largeTextRatio: 3.0,
    },
    resizeText: {
      requirement: '1.4.4',
      description: 'Text can be resized up to 200% without assistive technology',
      implementation: 'scalable fonts, responsive design',
      maximumZoom: 2.0,
    },
    imagesOfText: {
      requirement: '1.4.5',
      description: 'Images of text are avoided unless essential',
      implementation: 'text over images, vector graphics',
    },
    keyboardNoTrap: {
      requirement: '2.1.2',
      description: 'Keyboard focus is not trapped',
      implementation: 'focus management, escape mechanisms',
    },
    timing: {
      requirement: '2.2.1',
      description: 'Timing is adjustable',
      implementation: 'time limits, extensions, warnings',
    },
    pauseStopHide: {
      requirement: '2.2.2',
      description: 'Moving content can be paused, stopped, or hidden',
      implementation: 'animation controls, auto-play settings',
    },
    seizuresFlashesAA: {
      requirement: '2.3.1',
      description: 'Enhanced seizure and flash protection',
      implementation: 'stricter flash limits, motion controls',
    },
    skipBlocks: {
      requirement: '2.4.1',
      description: 'Blocks of content can be skipped',
      implementation: 'skip links, landmarks, navigation aids',
    },
    focusVisible: {
      requirement: '2.4.7',
      description: 'Focus indicator is visible',
      implementation: 'focus rings, visual indicators',
    },
    languageOfParts: {
      requirement: '3.1.2',
      description: 'Language of parts is programmatically determined',
      implementation: 'multi-language support, locale switching',
    },
    consistentNavigation: {
      requirement: '3.2.3',
      description: 'Navigation is consistent across pages',
      implementation: 'navigation patterns, layout consistency',
    },
    consistentIdentification: {
      requirement: '3.2.4',
      description: 'Components are identified consistently',
      implementation: 'consistent labeling, icon usage',
    },
    errorSuggestion: {
      requirement: '3.3.3',
      description: 'Error messages include suggestions',
      implementation: 'helpful error messages, correction guidance',
    },
    errorPreventionLegal: {
      requirement: '3.3.4',
      description: 'Legal and financial submissions can be reversed',
      implementation: 'confirmation steps, undo mechanisms',
    },
  },
} as const;

// ====================================
// COLOR CONTRAST VALIDATION
// ====================================

/**
 * Color Contrast Checker
 * Validates color combinations against WCAG standards
 */
export class ColorContrastChecker {
  // Convert hex to RGB
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  }
  
  // Calculate relative luminance
  private static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
  
  // Calculate contrast ratio
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }
  
  // Check if color combination meets WCAG standards
  static meetsWCAG(
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA',
    fontSize: 'normal' | 'large' = 'normal'
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    
    if (level === 'AAA') {
      return fontSize === 'large' ? ratio >= 4.5 : ratio >= 7;
    } else {
      return fontSize === 'large' ? ratio >= 3 : ratio >= 4.5;
    }
  }
  
  // Get accessibility rating
  static getAccessibilityRating(foreground: string, background: string): {
    ratio: number;
    rating: 'Fail' | 'AA Large' | 'AA' | 'AAA';
  } {
    const ratio = this.getContrastRatio(foreground, background);
    
    if (ratio < 3) return { ratio, rating: 'Fail' };
    if (ratio < 4.5) return { ratio, rating: 'AA Large' };
    if (ratio < 7) return { ratio, rating: 'AA' };
    return { ratio, rating: 'AAA' };
  }
}

// ====================================
// ACCESSIBLE COLOR PALETTE
// ====================================

/**
 * WCAG Compliant Color Combinations
 * Pre-validated color pairs that meet accessibility standards
 */
export const accessibleColorPairs = {
  // High contrast combinations
  highContrast: {
    darkOnLight: {
      foreground: tailTrackerColors.light.textPrimary,    // #0F172A
      background: tailTrackerColors.light.background,     // #FFFFFF
      ratio: ColorContrastChecker.getContrastRatio('#0F172A', '#FFFFFF'), // ~15:1
      wcagLevel: 'AAA',
    },
    lightOnDark: {
      foreground: tailTrackerColors.dark.textPrimary,     // #F8FAFC
      background: tailTrackerColors.dark.background,      // #0F172A
      ratio: ColorContrastChecker.getContrastRatio('#F8FAFC', '#0F172A'), // ~15:1
      wcagLevel: 'AAA',
    },
  },
  
  // Brand color combinations
  brandAccessible: {
    trustBlueOnWhite: {
      foreground: tailTrackerColors.primary.trustBlue,    // #1E3A8A
      background: tailTrackerColors.light.background,     // #FFFFFF
      ratio: ColorContrastChecker.getContrastRatio('#1E3A8A', '#FFFFFF'),
      wcagLevel: 'AA',
    },
    whiteOnTrustBlue: {
      foreground: tailTrackerColors.light.textInverse,    // #FFFFFF
      background: tailTrackerColors.primary.trustBlue,    // #1E3A8A
      ratio: ColorContrastChecker.getContrastRatio('#FFFFFF', '#1E3A8A'),
      wcagLevel: 'AA',
    },
    emergencyRedOnWhite: {
      foreground: tailTrackerColors.contextual.emergencyRed, // #DC2626
      background: tailTrackerColors.light.background,        // #FFFFFF
      ratio: ColorContrastChecker.getContrastRatio('#DC2626', '#FFFFFF'),
      wcagLevel: 'AA',
    },
  },
  
  // Pet type accessible combinations
  petTypeAccessible: {
    dogBrownOnCream: {
      foreground: tailTrackerColors.petTypes.dog.primary,    // #92400E
      background: tailTrackerColors.petTypes.dog.background, // #FEF3C7
      ratio: ColorContrastChecker.getContrastRatio('#92400E', '#FEF3C7'),
      wcagLevel: 'AA',
    },
    catPurpleOnLight: {
      foreground: tailTrackerColors.petTypes.cat.primary,    // #7C3AED
      background: tailTrackerColors.petTypes.cat.background, // #F3E8FF
      ratio: ColorContrastChecker.getContrastRatio('#7C3AED', '#F3E8FF'),
      wcagLevel: 'AA',
    },
  },
} as const;

// ====================================
// TYPOGRAPHY ACCESSIBILITY
// ====================================

/**
 * Accessible Typography Guidelines
 * Font sizes and styling that meet accessibility standards
 */
export const accessibleTypography = {
  // Minimum font sizes
  minimumSizes: {
    mobile: {
      body: 16,        // Minimum body text size
      caption: 12,     // Minimum caption size
      button: 16,      // Minimum button text
      input: 16,       // Prevents zoom on iOS
    },
    tablet: {
      body: 18,
      caption: 14,
      button: 18,
      input: 18,
    },
  },
  
  // Line height guidelines
  lineHeights: {
    minimum: 1.2,      // Absolute minimum
    recommended: 1.5,  // WCAG recommended
    comfortable: 1.6,  // Extra comfortable reading
  },
  
  // Letter spacing for readability
  letterSpacing: {
    dyslexiaFriendly: 0.12,  // Increased spacing for dyslexia
    normal: 0,               // Standard spacing
    condensed: -0.02,        // Slightly condensed (use sparingly)
  },
  
  // Font weight accessibility
  fontWeights: {
    minimum: '400',     // Minimum for readability
    emphasized: '600',  // For emphasis without bold
    strong: '700',      // Strong emphasis
  },
  
  // Text decoration guidelines
  textDecoration: {
    links: {
      default: 'underline',           // Always underline links
      hover: 'underline',             // Maintain underline on hover
      visited: 'underline',           // Underline visited links
      focus: 'underline thick',       // Thicker underline on focus
    },
    emphasis: {
      avoid: ['color-only'],          // Don't rely on color alone
      use: ['bold', 'italic', 'underline'], // Use multiple indicators
    },
  },
} as const;

// ====================================
// FOCUS MANAGEMENT SYSTEM
// ====================================

/**
 * Focus Management for Accessibility
 * Comprehensive focus handling for keyboard navigation
 */
export class FocusManager {
  private static focusHistory: string[] = [];
  private static currentFocusedElement: string | null = null;
  
  // Focus ring styles
  static focusRingStyles = {
    default: {
      borderWidth: 2,
      borderColor: tailTrackerColors.primary.trustBlue,
      borderStyle: 'solid',
      borderRadius: 4,
      outline: 'none',
    },
    high_contrast: {
      borderWidth: 3,
      borderColor: '#000000',
      borderStyle: 'solid',
      borderRadius: 4,
      outline: 'none',
      backgroundColor: '#FFFF00', // High contrast yellow
    },
    error: {
      borderWidth: 2,
      borderColor: tailTrackerColors.semantic.errorPrimary,
      borderStyle: 'solid',
      borderRadius: 4,
      outline: 'none',
      shadowColor: tailTrackerColors.semantic.errorPrimary,
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  };
  
  // Set focus to element
  static setFocus(elementId: string) {
    this.focusHistory.push(elementId);
    this.currentFocusedElement = elementId;
    
    // Platform-specific focus implementation
    if (Platform.OS === 'ios') {
      // iOS focus implementation
      AccessibilityInfo.setAccessibilityFocus(parseInt(elementId));
    } else {
      // Android focus implementation
      AccessibilityInfo.setAccessibilityFocus(parseInt(elementId));
    }
  }
  
  // Return focus to previous element
  static returnFocus() {
    this.focusHistory.pop(); // Remove current
    const previousElement = this.focusHistory[this.focusHistory.length - 1];
    
    if (previousElement) {
      this.setFocus(previousElement);
    }
  }
  
  // Clear focus history
  static clearFocusHistory() {
    this.focusHistory = [];
    this.currentFocusedElement = null;
  }
  
  // Get focus order for screen
  static getFocusOrder(elements: Array<{ id: string; priority: number }>) {
    return elements
      .sort((a, b) => a.priority - b.priority)
      .map(element => element.id);
  }
  
  // Check if element should be focusable
  static isFocusable(element: {
    disabled?: boolean;
    hidden?: boolean;
    role?: string;
  }): boolean {
    if (element.disabled || element.hidden) return false;
    
    const focusableRoles = [
      'button',
      'link',
      'textbox',
      'combobox',
      'checkbox',
      'radio',
      'slider',
      'tab',
      'menuitem',
    ];
    
    return !element.role || focusableRoles.includes(element.role);
  }
}

// ====================================
// SCREEN READER SUPPORT
// ====================================

/**
 * Screen Reader Optimization
 * Support for VoiceOver, TalkBack, and other assistive technologies
 */
export const screenReaderSupport = {
  // Accessibility labels and hints
  labels: {
    // Navigation
    homeTab: 'Home tab',
    mapsTab: 'Maps tab', 
    petsTab: 'Pets tab',
    settingsTab: 'Settings tab',
    backButton: 'Go back',
    closeButton: 'Close',
    menuButton: 'Open menu',
    
    // Pet actions
    addPet: 'Add new pet',
    editPet: 'Edit pet information',
    findPet: 'Find pet location',
    emergencyAlert: 'Send emergency alert',
    
    // Status indicators
    petOnline: 'Pet is online and safe',
    petOffline: 'Pet tracker is offline',
    batteryLow: 'Tracker battery is low',
    batteryGood: 'Tracker battery is good',
    
    // Health indicators
    healthExcellent: 'Pet health is excellent',
    healthGood: 'Pet health is good',
    healthConcern: 'Pet health needs attention',
    healthCritical: 'Pet health is critical',
  },
  
  // Accessibility hints
  hints: {
    button: 'Double tap to activate',
    link: 'Double tap to open',
    textInput: 'Double tap to edit',
    slider: 'Swipe up or down to adjust',
    toggle: 'Double tap to toggle',
    
    // Context-specific hints
    petCard: 'Double tap to view pet details',
    mapPin: 'Double tap to view location details',
    notification: 'Double tap to open notification',
    emergencyButton: 'Double tap to send emergency alert to your contacts',
  },
  
  // Live regions for dynamic content
  liveRegions: {
    polite: 'polite',      // Non-urgent updates
    assertive: 'assertive', // Important updates
    off: 'off',            // No announcements
  },
  
  // Semantic roles
  roles: {
    // Navigation
    navigation: 'navigation',
    main: 'main',
    complementary: 'complementary',
    banner: 'banner',
    contentinfo: 'contentinfo',
    
    // Interactive elements
    button: 'button',
    link: 'link',
    textbox: 'textbox',
    combobox: 'combobox',
    checkbox: 'checkbox',
    radio: 'radio',
    
    // Content structure
    heading: 'heading',
    list: 'list',
    listitem: 'listitem',
    article: 'article',
    section: 'section',
    
    // Status and alerts
    alert: 'alert',
    status: 'status',
    progressbar: 'progressbar',
    dialog: 'dialog',
    alertdialog: 'alertdialog',
  },
} as const;

// ====================================
// TOUCH ACCESSIBILITY
// ====================================

/**
 * Touch Target Guidelines
 * Ensuring comfortable interaction for all users
 */
export const touchAccessibility = {
  // Minimum touch target sizes (in points)
  minimumSizes: {
    mobile: {
      primary: 44,      // Primary actions
      secondary: 40,    // Secondary actions
      tertiary: 36,     // Tertiary actions (with adequate spacing)
    },
    tablet: {
      primary: 48,
      secondary: 44,
      tertiary: 40,
    },
  },
  
  // Spacing between touch targets
  minimumSpacing: {
    adjacent: 8,        // Between adjacent targets
    separated: 16,      // Between separated targets
    grouped: 4,         // Within grouped targets
  },
  
  // Touch target expansion
  expansion: {
    invisible: {
      description: 'Expand touch area without visual change',
      implementation: 'hitSlop property',
      maxExpansion: 20,
    },
    visual: {
      description: 'Expand both visual and touch area',
      implementation: 'padding increase',
      maxExpansion: 12,
    },
  },
  
  // Gesture accessibility
  gestures: {
    alternatives: {
      swipe: 'Provide button alternatives to swipe gestures',
      pinch: 'Provide zoom controls for pinch gestures',
      long_press: 'Provide menu button for long press actions',
      drag: 'Provide step-by-step alternatives to drag actions',
    },
    
    timeouts: {
      tap: 100,           // Maximum tap duration
      long_press: 500,    // Minimum long press duration
      double_tap: 300,    // Maximum time between taps
    },
  },
} as const;

// ====================================
// MOTION ACCESSIBILITY
// ====================================

/**
 * Motion and Animation Accessibility
 * Respecting user preferences for motion
 */
export const motionAccessibility = {
  // Reduced motion alternatives
  reducedMotion: {
    // Instead of complex animations
    alternatives: {
      fade: 'Simple opacity changes',
      slide: 'Instant position changes',
      scale: 'Instant size changes',
      rotate: 'Instant rotation changes',
    },
    
    // Maximum animation parameters
    limits: {
      duration: 200,        // Maximum animation duration
      scale: 1.05,          // Maximum scale change
      rotation: 10,         // Maximum rotation in degrees
      translation: 20,      // Maximum translation in points
    },
  },
  
  // Vestibular safety
  vestibularSafety: {
    // Avoid these animations
    avoid: [
      'Rapid flashing (>3Hz)',
      'Continuous rotation',
      'Zoom with scale >3x',
      'Parallax scrolling',
      'Auto-playing video',
    ],
    
    // Safe alternatives
    alternatives: [
      'Gentle fades',
      'Slight scaling',
      'Progressive disclosure',
      'Static backgrounds',
      'User-controlled media',
    ],
  },
  
  // Animation controls
  controls: {
    playPause: 'Allow users to pause animations',
    speed: 'Allow users to control animation speed',
    disable: 'Allow users to disable animations completely',
  },
} as const;

// ====================================
// ACCESSIBILITY TESTING UTILITIES
// ====================================

/**
 * Accessibility Testing Tools
 * Automated testing and validation utilities
 */
export class AccessibilityTester {
  // Test color contrast
  static testColorContrast(colorPairs: Array<{ foreground: string; background: string; context: string }>) {
    const results = colorPairs.map(pair => ({
      ...pair,
      ...ColorContrastChecker.getAccessibilityRating(pair.foreground, pair.background),
    }));
    
    const failing = results.filter(result => result.rating === 'Fail');
    
    return {
      results,
      failing,
      passRate: (results.length - failing.length) / results.length,
    };
  }
  
  // Test touch target sizes
  static testTouchTargets(targets: Array<{ id: string; width: number; height: number; context: string }>) {
    const { width: screenWidth } = Dimensions.get('window');
    const isTablet = screenWidth >= 768;
    const minimumSize = isTablet ? touchAccessibility.minimumSizes.tablet.primary : touchAccessibility.minimumSizes.mobile.primary;
    
    const results = targets.map(target => ({
      ...target,
      passes: target.width >= minimumSize && target.height >= minimumSize,
      minimumRequired: minimumSize,
    }));
    
    const failing = results.filter(result => !result.passes);
    
    return {
      results,
      failing,
      passRate: (results.length - failing.length) / results.length,
    };
  }
  
  // Test accessibility labels
  static testAccessibilityLabels(elements: Array<{ id: string; accessibilityLabel?: string; role: string }>) {
    const results = elements.map(element => ({
      ...element,
      hasLabel: !!element.accessibilityLabel,
      labelQuality: this.assessLabelQuality(element.accessibilityLabel, element.role),
    }));
    
    const failing = results.filter(result => !result.hasLabel || result.labelQuality === 'poor');
    
    return {
      results,
      failing,
      passRate: (results.length - failing.length) / results.length,
    };
  }
  
  // Assess accessibility label quality
  private static assessLabelQuality(label?: string, role?: string): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!label) return 'poor';
    
    const wordCount = label.split(' ').length;
    const hasRole = label.toLowerCase().includes(role?.toLowerCase() || '');
    const isDescriptive = wordCount >= 2;
    const isConcise = wordCount <= 10;
    
    if (isDescriptive && isConcise && hasRole) return 'excellent';
    if (isDescriptive && isConcise) return 'good';
    if (isDescriptive || isConcise) return 'fair';
    return 'poor';
  }
  
  // Generate accessibility report
  static generateReport(testResults: {
    colorContrast?: any;
    touchTargets?: any;
    accessibilityLabels?: any;
  }) {
    const overall = {
      colorContrast: testResults.colorContrast?.passRate || 0,
      touchTargets: testResults.touchTargets?.passRate || 0,
      accessibilityLabels: testResults.accessibilityLabels?.passRate || 0,
    };
    
    const overallScore = (overall.colorContrast + overall.touchTargets + overall.accessibilityLabels) / 3;
    
    return {
      overallScore,
      grade: overallScore >= 0.9 ? 'A' : overallScore >= 0.8 ? 'B' : overallScore >= 0.7 ? 'C' : 'F',
      details: overall,
      recommendations: this.generateRecommendations(overall),
    };
  }
  
  // Generate accessibility recommendations
  private static generateRecommendations(scores: { colorContrast: number; touchTargets: number; accessibilityLabels: number }) {
    const recommendations = [];
    
    if (scores.colorContrast < 0.9) {
      recommendations.push('Improve color contrast ratios to meet WCAG AA standards');
    }
    
    if (scores.touchTargets < 0.9) {
      recommendations.push('Increase touch target sizes to minimum 44pt on mobile');
    }
    
    if (scores.accessibilityLabels < 0.9) {
      recommendations.push('Add descriptive accessibility labels to all interactive elements');
    }
    
    return recommendations;
  }
}

// ====================================
// ACCESSIBILITY CHECKLIST
// ====================================

/**
 * TailTracker Accessibility Checklist
 * Comprehensive checklist for ensuring accessibility compliance
 */
export const accessibilityChecklist = {
  // Visual Design
  visual: [
    {
      id: 'color-contrast',
      requirement: 'All text has minimum 4.5:1 contrast ratio',
      wcag: '1.4.3',
      priority: 'high',
      testMethod: 'automated',
    },
    {
      id: 'color-meaning',
      requirement: 'Color is not the only means of conveying information',
      wcag: '1.4.1',
      priority: 'high',
      testMethod: 'manual',
    },
    {
      id: 'text-resize',
      requirement: 'Text can be resized up to 200% without horizontal scrolling',
      wcag: '1.4.4',
      priority: 'medium',
      testMethod: 'manual',
    },
    {
      id: 'focus-visible',
      requirement: 'Focus indicators are clearly visible',
      wcag: '2.4.7',
      priority: 'high',
      testMethod: 'manual',
    },
  ],
  
  // Interaction Design
  interaction: [
    {
      id: 'keyboard-accessible',
      requirement: 'All functionality is available via keyboard',
      wcag: '2.1.1',
      priority: 'high',
      testMethod: 'manual',
    },
    {
      id: 'focus-order',
      requirement: 'Focus order is logical and meaningful',
      wcag: '2.4.3',
      priority: 'high',
      testMethod: 'manual',
    },
    {
      id: 'touch-targets',
      requirement: 'Touch targets are minimum 44pt (iOS) / 48dp (Android)',
      wcag: '2.5.5',
      priority: 'medium',
      testMethod: 'automated',
    },
    {
      id: 'motion-control',
      requirement: 'Motion animations can be disabled',
      wcag: '2.3.3',
      priority: 'medium',
      testMethod: 'manual',
    },
  ],
  
  // Content Structure
  content: [
    {
      id: 'page-titles',
      requirement: 'All screens have descriptive titles',
      wcag: '2.4.2',
      priority: 'high',
      testMethod: 'manual',
    },
    {
      id: 'headings',
      requirement: 'Content uses proper heading hierarchy',
      wcag: '1.3.1',
      priority: 'medium',
      testMethod: 'manual',
    },
    {
      id: 'labels',
      requirement: 'All form elements have associated labels',
      wcag: '3.3.2',
      priority: 'high',
      testMethod: 'automated',
    },
    {
      id: 'error-messages',
      requirement: 'Error messages are descriptive and helpful',
      wcag: '3.3.3',
      priority: 'high',
      testMethod: 'manual',
    },
  ],
  
  // Screen Reader Support
  screenReader: [
    {
      id: 'alt-text',
      requirement: 'All images have appropriate alt text',
      wcag: '1.1.1',
      priority: 'high',
      testMethod: 'automated',
    },
    {
      id: 'semantic-markup',
      requirement: 'Content uses semantic roles and properties',
      wcag: '4.1.2',
      priority: 'high',
      testMethod: 'automated',
    },
    {
      id: 'live-regions',
      requirement: 'Dynamic content updates are announced',
      wcag: '4.1.3',
      priority: 'medium',
      testMethod: 'manual',
    },
    {
      id: 'reading-order',
      requirement: 'Content reading order is logical',
      wcag: '1.3.2',
      priority: 'high',
      testMethod: 'manual',
    },
  ],
} as const;

// ====================================
// ACCESSIBILITY HOOKS AND UTILITIES
// ====================================

import React from 'react';

/**
 * React Hook for Accessibility State
 */
export const useAccessibility = () => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = React.useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = React.useState(false);
  const [isHighContrastEnabled, setIsHighContrastEnabled] = React.useState(false);
  
  React.useEffect(() => {
    // Check screen reader status
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
    
    // Check reduce motion preference
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);
    
    // Listen for changes
    const screenReaderChangedListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );
    
    const reduceMotionChangedListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged', 
      setIsReduceMotionEnabled
    );
    
    return () => {
      screenReaderChangedListener?.remove();
      reduceMotionChangedListener?.remove();
    };
  }, []);
  
  return {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    isHighContrastEnabled,
    
    // Accessibility helpers
    getAccessibleProps: (element: {
      label?: string;
      hint?: string;
      role?: string;
    }) => ({
      accessible: true,
      accessibilityLabel: element.label,
      accessibilityHint: element.hint,
      accessibilityRole: element.role,
    }),
    
    // Motion helpers
    shouldReduceMotion: () => isReduceMotionEnabled,
    getMotionDuration: (defaultDuration: number) => 
      isReduceMotionEnabled ? Math.min(defaultDuration, 200) : defaultDuration,
  };
};

// ====================================
// COMPLETE ACCESSIBILITY SYSTEM EXPORT
// ====================================

export const TailTrackerAccessibility = {
  standards: WCAGStandards,
  colors: {
    checker: ColorContrastChecker,
    pairs: accessibleColorPairs,
  },
  typography: accessibleTypography,
  focus: FocusManager,
  screenReader: screenReaderSupport,
  touch: touchAccessibility,
  motion: motionAccessibility,
  testing: AccessibilityTester,
  checklist: accessibilityChecklist,
  hooks: { useAccessibility },
};

export default TailTrackerAccessibility;