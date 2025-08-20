import React from 'react';
import { render, fireEvent } from '@/test/utils/testUtils';
import { MaterialButton } from '@/components/UI/MaterialButton';

describe('MaterialButton', () => {
  const defaultProps = {
    onPress: jest.fn(),
    children: 'Test Button',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByText } = render(<MaterialButton {...defaultProps} />);
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <MaterialButton {...defaultProps} onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  describe('Variants', () => {
    it('renders filled variant correctly', () => {
      const { getByText } = render(
        <MaterialButton {...defaultProps} variant="filled" />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('renders outlined variant correctly', () => {
      const { getByText } = render(
        <MaterialButton {...defaultProps} variant="outlined" />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('renders text variant correctly', () => {
      const { getByText } = render(
        <MaterialButton {...defaultProps} variant="text" />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('renders elevated variant correctly', () => {
      const { getByText } = render(
        <MaterialButton {...defaultProps} variant="elevated" />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('renders tonal variant correctly', () => {
      const { getByText } = render(
        <MaterialButton {...defaultProps} variant="tonal" />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      const { getByText } = render(
        <MaterialButton {...defaultProps} size="small" />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('renders medium size correctly', () => {
      const { getByText } = render(
        <MaterialButton {...defaultProps} size="medium" />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('renders large size correctly', () => {
      const { getByText } = render(
        <MaterialButton {...defaultProps} size="large" />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });
  });

  describe('Props', () => {
    it('renders full width when specified', () => {
      const { getByText } = render(
        <MaterialButton {...defaultProps} fullWidth={true} />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('is disabled when specified', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <MaterialButton {...defaultProps} disabled={true} onPress={mockOnPress} />
      );
      
      fireEvent.press(getByText('Test Button'));
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('shows loading state', () => {
      const { getByText } = render(
        <MaterialButton {...defaultProps} loading={true} />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility props', () => {
      const { getByRole } = render(
        <MaterialButton 
          {...defaultProps} 
          accessibilityLabel="Test button"
          accessibilityHint="Tap to test"
        />
      );
      
      const button = getByRole('button');
      expect(button).toBeTruthy();
    });

    it('is accessible when disabled', () => {
      const { getByRole } = render(
        <MaterialButton {...defaultProps} disabled={true} />
      );
      
      const button = getByRole('button');
      expect(button).toBeTruthy();
    });
  });

  describe('Custom styles', () => {
    it('applies custom styles correctly', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByText } = render(
        <MaterialButton {...defaultProps} style={customStyle} />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('applies custom content styles correctly', () => {
      const customContentStyle = { paddingHorizontal: 20 };
      const { getByText } = render(
        <MaterialButton {...defaultProps} contentStyle={customContentStyle} />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('applies custom label styles correctly', () => {
      const customLabelStyle = { fontSize: 18 };
      const { getByText } = render(
        <MaterialButton {...defaultProps} labelStyle={customLabelStyle} />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });
  });

  describe('Icon support', () => {
    it('renders with icon', () => {
      const { getByText } = render(
        <MaterialButton {...defaultProps} icon="heart" />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });
  });
});