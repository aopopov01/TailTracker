import '@testing-library/jest-native/extend-expect';

// Accessibility testing utilities for React Native
export const AccessibilityTestUtils = {
  // Check if element has proper accessibility label
  hasAccessibilityLabel: (element: any, expectedLabel?: string) => {
    const label = element.props?.accessibilityLabel || element.props?.['aria-label'];
    if (expectedLabel) {
      return label === expectedLabel;
    }
    return Boolean(label && label.trim().length > 0);
  },

  // Check if element has accessibility role
  hasAccessibilityRole: (element: any, expectedRole?: string) => {
    const role = element.props?.accessibilityRole || element.props?.role;
    if (expectedRole) {
      return role === expectedRole;
    }
    return Boolean(role);
  },

  // Check if element is focusable
  isFocusable: (element: any) => {
    return element.props?.accessible !== false && 
           element.props?.accessibilityElementsHidden !== true;
  },

  // Check minimum touch target size (44x44 points for iOS, 48x48 dp for Android)
  hasMinimumTouchTarget: (element: any, platform: 'ios' | 'android' = 'ios') => {
    const minSize = platform === 'ios' ? 44 : 48;
    const style = element.props?.style || {};
    
    // Handle array styles
    const flatStyle = Array.isArray(style) 
      ? Object.assign({}, ...style) 
      : style;
    
    const width = flatStyle.width || flatStyle.minWidth;
    const height = flatStyle.height || flatStyle.minHeight;
    
    return (width >= minSize || !width) && (height >= minSize || !height);
  },

  // Check color contrast (simplified version)
  hasGoodColorContrast: (foreground: string, background: string) => {
    // This is a simplified check. In a real app, you'd calculate actual contrast ratios
    // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
    
    if (!foreground || !background) return false;
    
    // Simple heuristic: avoid very similar colors
    const fg = foreground.toLowerCase();
    const bg = background.toLowerCase();
    
    // Basic color contrast checks
    const poorContrast = [
      { fg: '#ffffff', bg: '#f0f0f0' }, // White on light gray
      { fg: '#000000', bg: '#333333' }, // Black on dark gray
      { fg: '#ffff00', bg: '#ffffff' }, // Yellow on white
    ];
    
    return !poorContrast.some(pair => 
      fg.includes(pair.fg.slice(1)) && bg.includes(pair.bg.slice(1))
    );
  },

  // Check if text is readable (not too small)
  hasReadableTextSize: (element: any) => {
    const style = element.props?.style || {};
    const flatStyle = Array.isArray(style) 
      ? Object.assign({}, ...style) 
      : style;
    
    const fontSize = flatStyle.fontSize;
    
    // Minimum readable size is typically 12sp on Android, 12pt on iOS
    return !fontSize || fontSize >= 12;
  },

  // Check if interactive element has accessibility state
  hasAccessibilityState: (element: any) => {
    const state = element.props?.accessibilityState;
    const role = element.props?.accessibilityRole;
    
    // Interactive elements should have state information
    if (['button', 'switch', 'checkbox', 'radio'].includes(role)) {
      return Boolean(state);
    }
    
    return true; // Non-interactive elements don't need state
  },

  // Generate accessibility audit report
  auditElement: (element: any, elementName = 'Element') => {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    if (!AccessibilityTestUtils.hasAccessibilityLabel(element)) {
      issues.push(`${elementName} lacks accessibility label`);
    }
    
    if (!AccessibilityTestUtils.hasAccessibilityRole(element)) {
      warnings.push(`${elementName} lacks accessibility role`);
    }
    
    if (!AccessibilityTestUtils.isFocusable(element)) {
      warnings.push(`${elementName} is not focusable`);
    }
    
    if (!AccessibilityTestUtils.hasMinimumTouchTarget(element)) {
      issues.push(`${elementName} may not meet minimum touch target size`);
    }
    
    if (!AccessibilityTestUtils.hasReadableTextSize(element)) {
      issues.push(`${elementName} text may be too small to read`);
    }
    
    return {
      passed: issues.length === 0,
      issues,
      warnings,
      score: Math.max(0, 100 - (issues.length * 20) - (warnings.length * 10)),
    };
  },
};

// Note: Custom Jest matchers disabled to prevent conflicts with Jest Expo setup
// Use AccessibilityTestUtils functions directly in tests instead

// Accessibility testing presets for common scenarios
export const AccessibilityPresets = {
  // Test button accessibility
  testButton: (element: any, buttonName = 'Button') => {
    expect(AccessibilityTestUtils.hasAccessibilityLabel(element)).toBe(true);
    expect(element.props.accessibilityRole).toBe('button');
    expect(AccessibilityTestUtils.hasMinimumTouchTarget(element)).toBe(true);
    expect(AccessibilityTestUtils.hasAccessibilityState(element)).toBe(true);
  },

  // Test form input accessibility
  testFormInput: (element: any, inputName = 'Input') => {
    expect(AccessibilityTestUtils.hasAccessibilityLabel(element)).toBe(true);
    expect(['none', 'text', 'search', 'email', 'password']).toContain(
      element.props.accessibilityRole || 'text'
    );
    expect(AccessibilityTestUtils.hasReadableTextSize(element)).toBe(true);
  },

  // Test navigation accessibility
  testNavigation: (element: any, navName = 'Navigation') => {
    expect(AccessibilityTestUtils.hasAccessibilityLabel(element)).toBe(true);
    expect(element.props.accessibilityRole).toBe('navigation');
    expect(AccessibilityTestUtils.isFocusable(element)).toBe(true);
  },

  // Test image accessibility
  testImage: (element: any, imageName = 'Image') => {
    expect(AccessibilityTestUtils.hasAccessibilityLabel(element)).toBe(true);
    expect(element.props.accessibilityRole).toBe('image');
    
    // Decorative images should have empty accessibility label
    if (element.props.accessibilityRole === 'none') {
      expect(element.props.accessibilityLabel).toBe('');
    }
  },
};

// Screen reader simulation for testing
export const ScreenReaderSimulator = {
  // Simulate how screen reader would announce element
  announce: (element: any): string => {
    const role = element.props?.accessibilityRole || '';
    const label = element.props?.accessibilityLabel || '';
    const state = element.props?.accessibilityState || {};
    
    let announcement = label;
    
    if (role) {
      announcement += `, ${role}`;
    }
    
    if (state.disabled) {
      announcement += ', disabled';
    }
    
    if (state.selected) {
      announcement += ', selected';
    }
    
    if (state.checked !== undefined) {
      announcement += state.checked ? ', checked' : ', unchecked';
    }
    
    return announcement.trim().replace(/^,\s*/, '');
  },

  // Get reading order for a component tree
  getReadingOrder: (component: any): string[] => {
    // This would traverse the component tree and return elements in reading order
    // Simplified version for testing
    return ['Element 1', 'Element 2', 'Element 3'];
  },
};

// Global accessibility test configuration
global.AccessibilityTestConfig = {
  strictMode: true, // Fail tests on any accessibility issues
  platform: 'ios', // Default platform for touch target calculations
  colorContrastThreshold: 4.5, // WCAG AA compliance
  minimumFontSize: 12,
};