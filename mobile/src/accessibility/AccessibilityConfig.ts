/**
 * TailTracker Advanced Accessibility Configuration
 * 
 * This system goes beyond WCAG 2.1 AAA standards to create the most inclusive
 * pet care app experience possible. It provides comprehensive customization
 * for users across all disability spectrums.
 */

export interface AccessibilityPreferences {
  // Visual Accessibility
  visualAccessibility: {
    // Enhanced contrast ratios (7:1+ where possible)
    contrastMode: 'standard' | 'high' | 'enhanced' | 'maximum';
    colorBlindnessSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromacy';
    
    // Advanced text customization
    fontSizeMultiplier: number; // 0.5 to 3.0
    fontFamily: 'system' | 'dyslexia-friendly' | 'high-readability' | 'custom';
    lineSpacing: number; // 1.0 to 2.5
    letterSpacing: number; // 0.0 to 0.3
    
    // Motion and animations
    reduceMotion: boolean;
    eliminateAutoplay: boolean;
    parallaxDisabled: boolean;
    transitionDuration: number; // 0 to 2000ms
    
    // Visual enhancements
    focusIndicatorStyle: 'standard' | 'high-contrast' | 'thick-border' | 'color-fill';
    cursorEnhancement: boolean;
    screenFlashReduction: boolean;
    
    // Low vision support
    magnificationLevel: number; // 1.0 to 5.0
    magnificationStyle: 'smooth' | 'pixelated';
    screenReaderOptimized: boolean;
  };

  // Motor Accessibility
  motorAccessibility: {
    // Touch and gesture settings
    touchTargetMinSize: number; // 44pt to 80pt
    touchSensitivity: number; // 0.1 to 2.0
    gestureComplexity: 'simple' | 'standard' | 'complex';
    
    // Tremor and movement support
    tremorCompensation: boolean;
    holdDelay: number; // 0 to 3000ms
    clickTolerance: number; // pixels of movement allowed
    
    // Alternative input methods
    switchControlEnabled: boolean;
    switchScanningSpeed: number; // 0.5 to 5.0 seconds
    eyeTrackingSupport: boolean;
    headTrackingSupport: boolean;
    
    // One-handed operation
    oneHandedMode: 'off' | 'left' | 'right';
    thumbReachOptimization: boolean;
    
    // Voice control
    voiceControlEnabled: boolean;
    voiceSensitivity: number; // 0.1 to 2.0
    voiceCommandTimeout: number; // 1000 to 10000ms
  };

  // Cognitive Accessibility
  cognitiveAccessibility: {
    // Complexity reduction
    interfaceComplexity: 'minimal' | 'simple' | 'standard' | 'advanced';
    navigationStyle: 'linear' | 'hierarchical' | 'flat';
    informationDensity: 'low' | 'medium' | 'high';
    
    // Memory aids
    breadcrumbsEnabled: boolean;
    actionConfirmations: boolean;
    undoAvailable: boolean;
    progressIndicators: boolean;
    
    // Language and comprehension
    languageLevel: 'simple' | 'standard' | 'advanced';
    readingAssistance: boolean;
    definitionsEnabled: boolean;
    phoneticsEnabled: boolean;
    
    // Time and pacing
    timeoutExtensions: number; // multiplier 1.0 to 10.0
    pauseOnFocus: boolean;
    autoAdvanceDisabled: boolean;
    
    // Focus and attention
    distractionReduction: boolean;
    singleTaskMode: boolean;
    focusReminders: boolean;
  };

  // Auditory Accessibility
  auditoryAccessibility: {
    // Sound alternatives
    visualAlertsEnabled: boolean;
    hapticFeedbackEnabled: boolean;
    vibrationPatterns: 'subtle' | 'standard' | 'strong';
    
    // Audio enhancements
    audioDescriptions: boolean;
    soundAmplification: number; // 0.5 to 3.0
    frequencyAdjustment: 'none' | 'low-boost' | 'high-boost' | 'custom';
    
    // Hearing aid compatibility
    hearingAidOptimized: boolean;
    tinnitusMasking: boolean;
    
    // Sign language support
    signLanguagePreferred: boolean;
    signLanguageDialect: string;
  };

  // Communication Accessibility
  communicationAccessibility: {
    // Speech alternatives
    speechToText: boolean;
    textToSpeech: boolean;
    symbolCommunication: boolean;
    
    // AAC (Augmentative and Alternative Communication)
    aacEnabled: boolean;
    symbolSet: 'pictograms' | 'bliss' | 'makaton' | 'custom';
    communicationBoard: boolean;
    
    // Language support
    primaryLanguage: string;
    translationEnabled: boolean;
    simplifiedLanguage: boolean;
  };

  // Emergency Accessibility
  emergencyAccessibility: {
    // Crisis communication
    emergencyMode: boolean;
    panicButton: boolean;
    emergencyContacts: {
      name: string;
      phone: string;
      relationship: string;
      accessibilityNotes: string;
    }[];
    
    // Emergency simplification
    emergencySimplification: boolean;
    emergencyInstructions: boolean;
    locationSharing: 'always' | 'emergency-only' | 'never';
  };

  // Platform-specific settings
  platformSettings: {
    // iOS specific
    voiceOverOptimized: boolean;
    dynamicTypeSupport: boolean;
    switchControlSupport: boolean;
    voiceControlSupport: boolean;
    guidedAccessReady: boolean;
    
    // Android specific
    talkBackOptimized: boolean;
    selectToSpeakEnabled: boolean;
    soundAmplifierIntegration: boolean;
    liveTranscribeSupport: boolean;
  };
}

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  visualAccessibility: {
    contrastMode: 'standard',
    colorBlindnessSupport: 'none',
    fontSizeMultiplier: 1.0,
    fontFamily: 'system',
    lineSpacing: 1.2,
    letterSpacing: 0.0,
    reduceMotion: false,
    eliminateAutoplay: false,
    parallaxDisabled: false,
    transitionDuration: 300,
    focusIndicatorStyle: 'standard',
    cursorEnhancement: false,
    screenFlashReduction: false,
    magnificationLevel: 1.0,
    magnificationStyle: 'smooth',
    screenReaderOptimized: false,
  },
  motorAccessibility: {
    touchTargetMinSize: 44,
    touchSensitivity: 1.0,
    gestureComplexity: 'standard',
    tremorCompensation: false,
    holdDelay: 0,
    clickTolerance: 10,
    switchControlEnabled: false,
    switchScanningSpeed: 2.0,
    eyeTrackingSupport: false,
    headTrackingSupport: false,
    oneHandedMode: 'off',
    thumbReachOptimization: false,
    voiceControlEnabled: false,
    voiceSensitivity: 1.0,
    voiceCommandTimeout: 3000,
  },
  cognitiveAccessibility: {
    interfaceComplexity: 'standard',
    navigationStyle: 'hierarchical',
    informationDensity: 'medium',
    breadcrumbsEnabled: true,
    actionConfirmations: false,
    undoAvailable: true,
    progressIndicators: true,
    languageLevel: 'standard',
    readingAssistance: false,
    definitionsEnabled: false,
    phoneticsEnabled: false,
    timeoutExtensions: 1.0,
    pauseOnFocus: false,
    autoAdvanceDisabled: false,
    distractionReduction: false,
    singleTaskMode: false,
    focusReminders: false,
  },
  auditoryAccessibility: {
    visualAlertsEnabled: false,
    hapticFeedbackEnabled: true,
    vibrationPatterns: 'standard',
    audioDescriptions: false,
    soundAmplification: 1.0,
    frequencyAdjustment: 'none',
    hearingAidOptimized: false,
    tinnitusMasking: false,
    signLanguagePreferred: false,
    signLanguageDialect: '',
  },
  communicationAccessibility: {
    speechToText: false,
    textToSpeech: false,
    symbolCommunication: false,
    aacEnabled: false,
    symbolSet: 'pictograms',
    communicationBoard: false,
    primaryLanguage: 'en',
    translationEnabled: false,
    simplifiedLanguage: false,
  },
  emergencyAccessibility: {
    emergencyMode: false,
    panicButton: false,
    emergencyContacts: [],
    emergencySimplification: false,
    emergencyInstructions: true,
    locationSharing: 'emergency-only',
  },
  platformSettings: {
    voiceOverOptimized: false,
    dynamicTypeSupport: true,
    switchControlSupport: false,
    voiceControlSupport: false,
    guidedAccessReady: false,
    talkBackOptimized: false,
    selectToSpeakEnabled: false,
    soundAmplifierIntegration: false,
    liveTranscribeSupport: false,
  },
};

/**
 * Accessibility capabilities detection
 */
export interface AccessibilityCapabilities {
  screenReaderActive: boolean;
  voiceControlAvailable: boolean;
  switchControlAvailable: boolean;
  eyeTrackingAvailable: boolean;
  hearingAidConnected: boolean;
  reduceMotionPreferred: boolean;
  highContrastPreferred: boolean;
  largeTextPreferred: boolean;
  deviceCapabilities: {
    hapticFeedback: boolean;
    vibration: boolean;
    camera: boolean;
    microphone: boolean;
    locationServices: boolean;
    bluetooth: boolean;
  };
}

/**
 * Accessibility testing metrics
 */
export interface AccessibilityMetrics {
  wcagAACompliance: boolean;
  wcagAAACompliance: boolean;
  touchTargetCompliance: boolean;
  colorContrastRatios: {
    normalText: number;
    largeText: number;
    uiElements: number;
  };
  keyboardNavigation: boolean;
  screenReaderCompatibility: number; // 0-100%
  voiceControlCompatibility: number; // 0-100%
  cognitiveLoadScore: number; // 1-10 scale
  taskCompletionRate: {
    withAssistiveTech: number;
    withoutAssistiveTech: number;
  };
}

export type AccessibilityAlert = {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  affectedFeatures: string[];
};