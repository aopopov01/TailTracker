import React from 'react';
import { render } from '@testing-library/react-native';
import { Button, View, Text } from 'react-native';
import { AccessibilityTestUtils } from './accessibility-setup';

describe('Basic Accessibility Tests', () => {
  it('should pass basic accessibility checks for buttons', () => {
    const { getByTestId } = render(
      <Button
        testID="test-button"
        title="Test Button"
        onPress={() => {}}
        accessibilityLabel="Test button for accessibility"
        accessibilityHint="Tap to test functionality"
        accessibilityRole="button"
      />
    );

    const button = getByTestId('test-button');
    expect(button.props.accessibilityLabel).toBe('Test button for accessibility');
  });

  it('should validate color contrast ratios', () => {
    const goodContrast = AccessibilityTestUtils.hasGoodColorContrast('#000000', '#FFFFFF');
    const badContrast = AccessibilityTestUtils.hasGoodColorContrast('#FFFFFF', '#F0F0F0');
    
    expect(goodContrast).toBe(true);
    expect(badContrast).toBe(false);
  });

  it('should validate minimum touch target sizes', () => {
    const { getByTestId } = render(
      <View
        testID="test-touch-target"
        style={{
          minHeight: 48,
          minWidth: 48,
          backgroundColor: '#007AFF',
        }}
        accessibilityRole="button"
        accessibilityLabel="Touch target test"
      >
        <Text>Touch me</Text>
      </View>
    );

    const touchTarget = getByTestId('test-touch-target');
    expect(AccessibilityTestUtils.hasMinimumTouchTarget(touchTarget, 'android')).toBe(true);
  });

  it('should validate text readability', () => {
    const { getByTestId } = render(
      <Text
        testID="readable-text"
        style={{ fontSize: 16 }}
        accessibilityRole="text"
      >
        This is readable text
      </Text>
    );

    const text = getByTestId('readable-text');
    expect(AccessibilityTestUtils.hasReadableTextSize(text)).toBe(true);
  });

  it('should test urgency chip accessibility requirements', () => {
    const mockChipProps = {
      style: [
        {
          minHeight: 48,
          minWidth: 88,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }
      ],
      accessibilityRole: 'radio',
      accessibilityLabel: 'High urgency, 5 kilometer radius',
      accessibilityState: { selected: false, checked: false },
    };

    // Test touch target size
    expect(AccessibilityTestUtils.hasMinimumTouchTarget(mockChipProps, 'android')).toBe(true);
    expect(AccessibilityTestUtils.hasMinimumTouchTarget(mockChipProps, 'ios')).toBe(true);
    
    // Test accessibility label
    expect(AccessibilityTestUtils.hasAccessibilityLabel(mockChipProps)).toBe(true);
    
    // Test accessibility role
    expect(AccessibilityTestUtils.hasAccessibilityRole(mockChipProps, 'radio')).toBe(true);
    
    // Test accessibility state
    expect(AccessibilityTestUtils.hasAccessibilityState(mockChipProps)).toBe(true);
  });

  it('should generate accessibility audit reports', () => {
    const goodElement = {
      props: {
        accessibilityLabel: 'Good button',
        accessibilityRole: 'button',
        style: { minHeight: 48, minWidth: 48 },
      }
    };

    const badElement = {
      props: {
        style: { minHeight: 20, minWidth: 20 },
      }
    };

    const goodAudit = AccessibilityTestUtils.auditElement(goodElement, 'Good Button');
    const badAudit = AccessibilityTestUtils.auditElement(badElement, 'Bad Button');

    expect(goodAudit.passed).toBe(true);
    expect(goodAudit.issues).toHaveLength(0);
    expect(goodAudit.score).toBeGreaterThan(80);

    expect(badAudit.passed).toBe(false);
    expect(badAudit.issues.length).toBeGreaterThan(0);
    expect(badAudit.score).toBeLessThan(100);
  });
});