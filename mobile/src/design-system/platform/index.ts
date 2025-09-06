/**
 * TailTracker Cross-Platform Consistency System
 * 
 * Main entry point for all cross-platform consistency utilities and components.
 * Provides a unified API for ensuring perfect iOS and Android consistency.
 */

// ====================================
// CORE PLATFORM SYSTEM
// ====================================

export {
  PlatformAdapter,
  PlatformDesignSystem,
  ConsistentStyling,
  platformAdapter,
  platformDesign,
  consistentStyling,
  type PlatformCapabilities,
  type PlatformMetrics,
  type PlatformDesignTokens,
  type ConsistentStyle,
} from './PlatformAdapter';

// ====================================
// CROSS-PLATFORM COMPONENTS
// ====================================

export {
  CrossPlatformButton,
  CrossPlatformInput,
  CrossPlatformCard,
  CrossPlatformModal,
  CrossPlatformSwitch,
} from './CrossPlatformComponents';

// ====================================
// VALIDATION & TESTING
// ====================================

export {
  VisualConsistencyValidator,
  FunctionalConsistencyValidator,
  PerformanceValidator,
  AccessibilityValidator,
  CrossPlatformConsistencyValidator,
  CrossPlatformTestUtils,
  consistencyValidator,
  type ValidationResult,
  type ConsistencyReport,
} from './ConsistencyValidator';

// ====================================
// PERFORMANCE MONITORING
// ====================================

export {
  CrossPlatformPerformanceMonitor,
  performanceMonitor,
  type FrameMetrics,
  type MemoryMetrics,
  type InteractionMetrics,
  type NetworkMetrics,
  type PerformanceBenchmark,
} from './PerformanceMonitor';

// ====================================
// CONVENIENCE EXPORTS
// ====================================

/**
 * Complete cross-platform system bundle
 * Use this for easy access to all functionality
 */
export const CrossPlatformSystem = {
  // Core platform adaptation
  adapter: platformAdapter,
  design: platformDesign,
  styling: consistentStyling,

  // Validation and testing
  validator: consistencyValidator,
  
  // Performance monitoring
  performance: performanceMonitor,

  // Quick access to commonly used utilities
  utils: {
    isIOS: () => platformAdapter.isIOS(),
    isAndroid: () => platformAdapter.isAndroid(),
    isTablet: () => platformAdapter.isTablet(),
    getMetrics: () => platformAdapter.getMetrics(),
    getCapabilities: () => platformAdapter.getCapabilities(),
    validateComponent: (name: string) => consistencyValidator.runFullValidation(name),
    startPerformanceMonitoring: () => performanceMonitor.startMonitoring(),
  },

  // Platform-specific design tokens
  tokens: {
    borderRadius: platformDesign.getBorderRadius,
    shadow: platformDesign.getShadow,
    spacing: platformDesign.getSpacing,
    animationDuration: platformDesign.getAnimationDuration,
    springConfig: platformDesign.getSpringConfig,
  },
};

/**
 * Cross-platform hooks for React components
 */
export const useCrossPlatformHooks = () => {
  const metrics = platformAdapter.getMetrics();
  const capabilities = platformAdapter.getCapabilities();

  return {
    metrics,
    capabilities,
    isIOS: platformAdapter.isIOS(),
    isAndroid: platformAdapter.isAndroid(),
    isTablet: platformAdapter.isTablet(),
    designTokens: platformDesign.getTokens(),
  };
};

/**
 * Validation shortcuts for common use cases
 */
export const ValidationShortcuts = {
  // Quick component validation
  validateButton: (metrics: any) => {
    return [
      VisualConsistencyValidator.validateSpacing('Button', metrics.padding, 24),
      FunctionalConsistencyValidator.validateTouchTargets('Button', metrics.width, metrics.height),
      AccessibilityValidator.validateContrast('Button', metrics.contrast),
    ];
  },

  // Quick performance check
  checkPerformance: () => {
    const metrics = performanceMonitor.getLatestMetrics();
    return {
      frameRate: metrics.frame ? 1000 / metrics.frame.frameTime : 0,
      memoryUsage: metrics.memory?.usedMemory || 0,
      isPerformant: performanceMonitor.generatePerformanceReport().overallScore > 85,
    };
  },

  // Quick accessibility audit
  auditAccessibility: (component: string, hasLabel: boolean, contrast: number) => {
    return [
      AccessibilityValidator.validateAccessibilityLabel(component, hasLabel),
      AccessibilityValidator.validateContrast(component, contrast),
      AccessibilityValidator.validateScreenReaderSupport(component, hasLabel),
    ];
  },
};

// ====================================
// DEFAULT EXPORT
// ====================================

export default CrossPlatformSystem;