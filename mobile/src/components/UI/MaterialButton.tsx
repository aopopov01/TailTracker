import React from 'react';
import { Button, ButtonProps } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

interface MaterialButtonProps extends Omit<ButtonProps, 'mode'> {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

export const MaterialButton: React.FC<MaterialButtonProps> = ({
  variant = 'filled',
  size = 'medium',
  fullWidth = false,
  style,
  contentStyle,
  labelStyle,
  children,
  ...props
}) => {
  const theme = useTheme();
  
  const getMode = (): ButtonProps['mode'] => {
    switch (variant) {
      case 'filled':
        return 'contained';
      case 'outlined':
        return 'outlined';
      case 'text':
        return 'text';
      case 'elevated':
        return 'elevated';
      case 'tonal':
        return 'contained-tonal';
      default:
        return 'contained';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'large':
        return styles.large;
      default:
        return styles.medium;
    }
  };

  const getLabelStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: 12 };
      case 'large':
        return { fontSize: 16 };
      default:
        return { fontSize: 14 };
    }
  };

  return (
    <Button
      mode={getMode()}
      style={[
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        style,
      ]}
      contentStyle={[
        getSizeStyles(),
        contentStyle,
      ]}
      labelStyle={[
        getLabelStyles(),
        { color: theme.colors.onPrimary },
        labelStyle,
      ]}
      {...props}
    >
      {children}
    </Button>
  );
};

const styles = StyleSheet.create({
  small: {
    minHeight: 32,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  medium: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  large: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  fullWidth: {
    width: '100%',
  },
});