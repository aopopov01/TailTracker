import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { iOSButton, iOSButtonType, iOSButtonSize } from '../../components/UI/iOS/iOSButton';

// Mock haptic feedback
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Medium: 'medium',
    Light: 'light',
    Heavy: 'heavy',
  },
}));

// Mock platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn().mockImplementation((config) => config.ios),
}));

describe('iOSButton', () => {
  const mockOnPress = jest.fn();
  const mockHaptics = Haptics.impactAsync as jest.MockedFunction<typeof Haptics.impactAsync>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders correctly with title', () => {
      const { getByText } = render(
        <iOSButton title="Test Button" onPress={mockOnPress} />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('calls onPress when pressed', async () => {
      const { getByText } = render(
        <iOSButton title="Test Button" onPress={mockOnPress} />
      );
      
      fireEvent.press(getByText('Test Button'));
      
      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalledTimes(1);
      });
    });

    it('triggers haptic feedback by default', async () => {
      const { getByText } = render(
        <iOSButton title="Test Button" onPress={mockOnPress} />
      );
      
      fireEvent.press(getByText('Test Button'));
      
      await waitFor(() => {
        expect(mockHaptics).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
      });
    });

    it('does not trigger haptic feedback when disabled', async () => {
      const { getByText } = render(
        <iOSButton title="Test Button" onPress={mockOnPress} hapticFeedback={false} />
      );
      
      fireEvent.press(getByText('Test Button'));
      
      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalled();
        expect(mockHaptics).not.toHaveBeenCalled();
      });
    });
  });

  describe('Button Types', () => {
    it('renders primary button correctly', () => {
      const { getByText } = render(
        <iOSButton title="Primary" onPress={mockOnPress} type={iOSButtonType.Primary} />
      );
      
      const button = getByText('Primary').parent;
      expect(button?.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#007AFF',
        })
      );
    });

    it('renders secondary button correctly', () => {
      const { getByText } = render(
        <iOSButton title="Secondary" onPress={mockOnPress} type={iOSButtonType.Secondary} />
      );
      
      const button = getByText('Secondary').parent;
      expect(button?.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: 'transparent',
          borderColor: '#007AFF',
        })
      );
    });

    it('renders destructive button correctly', () => {
      const { getByText } = render(
        <iOSButton title="Delete" onPress={mockOnPress} type={iOSButtonType.Destructive} />
      );
      
      const button = getByText('Delete').parent;
      expect(button?.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#FF3B30',
        })
      );
    });

    it('renders plain button correctly', () => {
      const { getByText } = render(
        <iOSButton title="Plain" onPress={mockOnPress} type={iOSButtonType.Plain} />
      );
      
      const button = getByText('Plain').parent;
      expect(button?.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: 'transparent',
        })
      );
    });
  });

  describe('Button Sizes', () => {
    it('renders large button with correct dimensions', () => {
      const { getByText } = render(
        <iOSButton title="Large" onPress={mockOnPress} size={iOSButtonSize.Large} />
      );
      
      const button = getByText('Large').parent;
      expect(button?.props.style).toEqual(
        expect.objectContaining({
          minHeight: 50,
          paddingHorizontal: 20,
        })
      );
    });

    it('renders medium button with correct dimensions', () => {
      const { getByText } = render(
        <iOSButton title="Medium" onPress={mockOnPress} size={iOSButtonSize.Medium} />
      );
      
      const button = getByText('Medium').parent;
      expect(button?.props.style).toEqual(
        expect.objectContaining({
          minHeight: 44,
          paddingHorizontal: 20,
        })
      );
    });

    it('renders small button with correct dimensions', () => {
      const { getByText } = render(
        <iOSButton title="Small" onPress={mockOnPress} size={iOSButtonSize.Small} />
      );
      
      const button = getByText('Small').parent;
      expect(button?.props.style).toEqual(
        expect.objectContaining({
          minHeight: 36,
          paddingHorizontal: 16,
        })
      );
    });

    it('renders mini button with correct dimensions', () => {
      const { getByText } = render(
        <iOSButton title="Mini" onPress={mockOnPress} size={iOSButtonSize.Mini} />
      );
      
      const button = getByText('Mini').parent;
      expect(button?.props.style).toEqual(
        expect.objectContaining({
          minHeight: 28,
          paddingHorizontal: 12,
        })
      );
    });
  });

  describe('Button States', () => {
    it('renders disabled button correctly', () => {
      const { getByText } = render(
        <iOSButton title="Disabled" onPress={mockOnPress} disabled={true} />
      );
      
      const button = getByText('Disabled').parent;
      expect(button?.props.style).toEqual(
        expect.objectContaining({
          opacity: 0.6,
        })
      );
    });

    it('does not call onPress when disabled', async () => {
      const { getByText } = render(
        <iOSButton title="Disabled" onPress={mockOnPress} disabled={true} />
      );
      
      fireEvent.press(getByText('Disabled'));
      
      await waitFor(() => {
        expect(mockOnPress).not.toHaveBeenCalled();
      });
    });

    it('shows loading indicator when loading', () => {
      const { getByTestId } = render(
        <iOSButton title="Loading" onPress={mockOnPress} loading={true} />
      );
      
      expect(getByTestId('activity-indicator')).toBeTruthy();
    });

    it('does not call onPress when loading', async () => {
      const { getByText } = render(
        <iOSButton title="Loading" onPress={mockOnPress} loading={true} />
      );
      
      fireEvent.press(getByText('Loading'));
      
      await waitFor(() => {
        expect(mockOnPress).not.toHaveBeenCalled();
      });
    });
  });

  describe('Full Width Button', () => {
    it('renders full width button correctly', () => {
      const { getByText } = render(
        <iOSButton title="Full Width" onPress={mockOnPress} fullWidth={true} />
      );
      
      const button = getByText('Full Width').parent;
      expect(button?.props.style).toEqual(
        expect.objectContaining({
          width: '100%',
        })
      );
    });
  });

  describe('Custom Styling', () => {
    it('applies custom style prop', () => {
      const customStyle = { marginTop: 20 };
      const { getByText } = render(
        <iOSButton title="Custom" onPress={mockOnPress} style={customStyle} />
      );
      
      const button = getByText('Custom').parent;
      expect(button?.props.style).toEqual(
        expect.objectContaining(customStyle)
      );
    });

    it('applies custom text style prop', () => {
      const customTextStyle = { fontWeight: 'bold' };
      const { getByText } = render(
        <iOSButton title="Custom Text" onPress={mockOnPress} textStyle={customTextStyle} />
      );
      
      const text = getByText('Custom Text');
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customTextStyle)
        ])
      );
    });
  });

  describe('Platform Compatibility', () => {
    it('works on non-iOS platforms without haptic feedback', async () => {
      // Mock platform as Android
      (Platform.OS as any) = 'android';
      
      const { getByText } = render(
        <iOSButton title="Cross Platform" onPress={mockOnPress} />
      );
      
      fireEvent.press(getByText('Cross Platform'));
      
      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalled();
        expect(mockHaptics).not.toHaveBeenCalled();
      });
      
      // Reset platform
      (Platform.OS as any) = 'ios';
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility properties', () => {
      const { getByText } = render(
        <iOSButton title="Accessible" onPress={mockOnPress} />
      );
      
      const button = getByText('Accessible').parent;
      expect(button?.props.accessible).toBe(true);
      expect(button?.props.accessibilityRole).toBe('button');
    });

    it('is disabled for accessibility when disabled', () => {
      const { getByText } = render(
        <iOSButton title="Disabled" onPress={mockOnPress} disabled={true} />
      );
      
      const button = getByText('Disabled').parent;
      expect(button?.props.accessibilityState).toEqual(
        expect.objectContaining({
          disabled: true,
        })
      );
    });
  });
});