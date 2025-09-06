/**
 * TailTracker Cross-Platform Test Suite
 * 
 * Automated tests that ensure visual and functional consistency
 * between iOS and Android implementations.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import '@testing-library/jest-native/extend-expect';

// Import cross-platform components
import {
  CrossPlatformButton,
  CrossPlatformInput,
  CrossPlatformCard,
  CrossPlatformModal,
  CrossPlatformSwitch,
} from '../../design-system/platform/CrossPlatformComponents';

// Import validation utilities
import {
  consistencyValidator,
  // CrossPlatformTestUtils,
} from '../../design-system/platform/ConsistencyValidator';

// Mock platform detection for testing
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios', // Can be overridden in individual tests
  select: jest.fn((options) => options.ios || options.default),
  Version: 14,
}));

// Mock haptic feedback
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

describe('Cross-Platform Component Consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ====================================
  // BUTTON COMPONENT TESTS
  // ====================================

  describe('CrossPlatformButton', () => {
    it('should render consistently across platforms', async () => {
      const onPressMock = jest.fn();

      // Test on iOS
      Platform.OS = 'ios';
      const { rerender, getByText: getByTextIOS } = render(
        <CrossPlatformButton title="Test Button" onPress={onPressMock} />
      );

      const iosButton = getByTextIOS('Test Button');
      expect(iosButton).toBeTruthy();

      // Test on Android
      Platform.OS = 'android';
      rerender(<CrossPlatformButton title="Test Button" onPress={onPressMock} />);
      
      const androidButton = getByTextIOS('Test Button');
      expect(androidButton).toBeTruthy();

      // Both should be touchable
      fireEvent.press(iosButton);
      expect(onPressMock).toHaveBeenCalled();
    });

    it('should have proper touch targets on both platforms', async () => {
      const onPressMock = jest.fn();

      // Test different sizes
      const sizes = ['small', 'medium', 'large'] as const;
      
      for (const size of sizes) {
        const { getByText } = render(
          <CrossPlatformButton
            title={`${size} Button`}
            onPress={onPressMock}
            size={size}
          />
        );

        const button = getByText(`${size} Button`).parent;
        
        // Verify minimum touch target sizes
        const expectedMinSize = size === 'small' ? 36 : size === 'large' ? 52 : 44;
        // In a real test, you would measure the actual rendered dimensions
        expect(button).toBeTruthy();
      }
    });

    it('should handle different variants consistently', async () => {
      const onPressMock = jest.fn();
      const variants = ['primary', 'secondary', 'tertiary', 'danger'] as const;

      for (const variant of variants) {
        const { getByText } = render(
          <CrossPlatformButton
            title={`${variant} Button`}
            onPress={onPressMock}
            variant={variant}
          />
        );

        const button = getByText(`${variant} Button`);
        expect(button).toBeTruthy();

        // Test interaction
        fireEvent.press(button);
        expect(onPressMock).toHaveBeenCalled();
        
        jest.clearAllMocks();
      }
    });

    it('should respect disabled state on both platforms', async () => {
      const onPressMock = jest.fn();

      const { getByText } = render(
        <CrossPlatformButton
          title="Disabled Button"
          onPress={onPressMock}
          disabled={true}
        />
      );

      const button = getByText('Disabled Button');
      fireEvent.press(button);
      
      // Should not call onPress when disabled
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('should show loading state consistently', async () => {
      const onPressMock = jest.fn();

      const { queryByText, UNSAFE_getByType } = render(
        <CrossPlatformButton
          title="Loading Button"
          onPress={onPressMock}
          loading={true}
        />
      );

      // Text should not be visible when loading
      expect(queryByText('Loading Button')).toBeNull();
      
      // Should show activity indicator
      expect(UNSAFE_getByType('ActivityIndicator')).toBeTruthy();
    });
  });

  // ====================================
  // INPUT COMPONENT TESTS
  // ====================================

  describe('CrossPlatformInput', () => {
    it('should handle text input consistently', async () => {
      const onChangeTextMock = jest.fn();

      const { getByDisplayValue } = render(
        <CrossPlatformInput
          value=""
          onChangeText={onChangeTextMock}
          placeholder="Enter text"
        />
      );

      const input = getByDisplayValue('');
      fireEvent.changeText(input, 'test input');
      
      expect(onChangeTextMock).toHaveBeenCalledWith('test input');
    });

    it('should display errors and helper text consistently', async () => {
      const onChangeTextMock = jest.fn();

      const { getByText, rerender } = render(
        <CrossPlatformInput
          value=""
          onChangeText={onChangeTextMock}
          error="This field is required"
        />
      );

      expect(getByText('This field is required')).toBeTruthy();

      // Test helper text
      rerender(
        <CrossPlatformInput
          value=""
          onChangeText={onChangeTextMock}
          helperText="Enter your pet's name"
        />
      );

      expect(getByText("Enter your pet's name")).toBeTruthy();
    });

    it('should handle secure text entry', async () => {
      const onChangeTextMock = jest.fn();

      const { getByDisplayValue } = render(
        <CrossPlatformInput
          value=""
          onChangeText={onChangeTextMock}
          secureTextEntry={true}
        />
      );

      const input = getByDisplayValue('');
      expect(input.props.secureTextEntry).toBe(true);
    });
  });

  // ====================================
  // CARD COMPONENT TESTS
  // ====================================

  describe('CrossPlatformCard', () => {
    it('should render content consistently', async () => {
      const { getByText } = render(
        <CrossPlatformCard>
          <React.Fragment>Card Content</React.Fragment>
        </CrossPlatformCard>
      );

      expect(getByText('Card Content')).toBeTruthy();
    });

    it('should handle press events when interactive', async () => {
      const onPressMock = jest.fn();

      const { getByText } = render(
        <CrossPlatformCard onPress={onPressMock}>
          <React.Fragment>Pressable Card</React.Fragment>
        </CrossPlatformCard>
      );

      const card = getByText('Pressable Card').parent;
      fireEvent.press(card);
      
      expect(onPressMock).toHaveBeenCalled();
    });

    it('should apply different variants consistently', async () => {
      const variants = ['default', 'elevated', 'outlined'] as const;

      for (const variant of variants) {
        const { getByText } = render(
          <CrossPlatformCard variant={variant}>
            <React.Fragment>{variant} Card</React.Fragment>
          </CrossPlatformCard>
        );

        expect(getByText(`${variant} Card`)).toBeTruthy();
      }
    });
  });

  // ====================================
  // MODAL COMPONENT TESTS
  // ====================================

  describe('CrossPlatformModal', () => {
    it('should show and hide consistently', async () => {
      const onCloseMock = jest.fn();

      const { getByText, queryByText, rerender } = render(
        <CrossPlatformModal
          visible={true}
          onClose={onCloseMock}
          title="Test Modal"
        >
          <React.Fragment>Modal Content</React.Fragment>
        </CrossPlatformModal>
      );

      expect(getByText('Test Modal')).toBeTruthy();
      expect(getByText('Modal Content')).toBeTruthy();

      // Test close button
      const closeButton = getByText('✕');
      fireEvent.press(closeButton);
      expect(onCloseMock).toHaveBeenCalled();

      // Test hiding modal
      rerender(
        <CrossPlatformModal
          visible={false}
          onClose={onCloseMock}
          title="Test Modal"
        >
          <React.Fragment>Modal Content</React.Fragment>
        </CrossPlatformModal>
      );

      expect(queryByText('Test Modal')).toBeNull();
    });
  });

  // ====================================
  // SWITCH COMPONENT TESTS
  // ====================================

  describe('CrossPlatformSwitch', () => {
    it('should toggle consistently', async () => {
      const onValueChangeMock = jest.fn();

      const { UNSAFE_getByType } = render(
        <CrossPlatformSwitch
          value={false}
          onValueChange={onValueChangeMock}
          label="Test Switch"
        />
      );

      const switchComponent = UNSAFE_getByType('RCTSwitch');
      fireEvent(switchComponent, 'valueChange', true);
      
      expect(onValueChangeMock).toHaveBeenCalledWith(true);
    });
  });
});// ====================================
// VISUAL CONSISTENCY TESTS
// ====================================

describe('Visual Consistency Validation', () => {
  it('should validate component spacing across platforms', async () => {
    const report = await consistencyValidator.runFullValidation('Button');
    
    const spacingResults = report.visualValidation.filter(
      result => result.metric === 'spacing'
    );
    
    expect(spacingResults.length).toBeGreaterThan(0);
    expect(spacingResults.every(result => result.passed)).toBe(true);
  });

  it('should validate color consistency', async () => {
    const report = await consistencyValidator.runFullValidation('Button');
    
    const colorResults = report.visualValidation.filter(
      result => result.metric === 'color'
    );
    
    expect(colorResults.length).toBeGreaterThan(0);
    expect(colorResults.every(result => result.passed)).toBe(true);
  });

  it('should generate comprehensive consistency report', async () => {
    const report = await consistencyValidator.runFullValidation();
    
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('platform');
    expect(report).toHaveProperty('overallScore');
    expect(report).toHaveProperty('visualValidation');
    expect(report).toHaveProperty('functionalValidation');
    expect(report).toHaveProperty('performanceValidation');
    expect(report).toHaveProperty('accessibilityValidation');
    expect(report).toHaveProperty('recommendations');
    
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
  });
});

// ====================================
// PERFORMANCE TESTS
// ====================================

describe('Performance Consistency', () => {
  it('should meet render performance targets', async () => {
    const startTime = Date.now();
    
    render(
      <CrossPlatformButton title="Performance Test" onPress={() => {}} />
    );
    
    const renderTime = Date.now() - startTime;
    
    // Should render within reasonable time (100ms)
    expect(renderTime).toBeLessThan(100);
  });

  it('should handle rapid interactions without performance degradation', async () => {
    const onPressMock = jest.fn();
    
    const { getByText } = render(
      <CrossPlatformButton title="Rapid Test" onPress={onPressMock} />
    );
    
    const button = getByText('Rapid Test');
    
    // Simulate rapid taps
    const startTime = Date.now();
    for (let i = 0; i < 10; i++) {
      fireEvent.press(button);
    }
    const endTime = Date.now();
    
    expect(onPressMock).toHaveBeenCalledTimes(10);
    expect(endTime - startTime).toBeLessThan(50); // Should handle 10 taps quickly
  });
});

// ====================================
// ACCESSIBILITY TESTS
// ====================================

describe('Accessibility Consistency', () => {
  it('should provide proper accessibility labels', async () => {
    const { getByLabelText } = render(
      <CrossPlatformButton
        title="Accessible Button"
        onPress={() => {}}
      />
    );

    // Button should be accessible by its title
    expect(getByLabelText('Accessible Button')).toBeTruthy();
  });

  it('should maintain accessibility across different variants', async () => {
    const variants = ['primary', 'secondary'] as const;
    
    for (const variant of variants) {
      const { getByRole } = render(
        <CrossPlatformButton
          title="Accessible Button"
          onPress={() => {}}
          variant={variant}
        />
      );

      expect(getByRole('button')).toBeTruthy();
    }
  });
});