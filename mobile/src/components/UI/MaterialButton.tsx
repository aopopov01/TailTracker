import React from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { MaterialComponentStyles, StateLayerOpacity } from '../../theme/materialDesign3Theme';
import { useMaterialTheme, useThemeAwareStyles } from '../../theme/MaterialThemeProvider';

type ButtonProps = ComponentProps<typeof Button>;

interface MaterialButtonProps extends Omit<ButtonProps, 'mode' | 'elevation'> {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  rippleColor?: string;
  elevation?: number;
}

export const MaterialButton: React.FC<MaterialButtonProps> = ({
  variant = 'filled',
  size = 'medium',
  fullWidth = false,
  loading = false,
  loadingText,
  rippleColor,
  elevation,
  style,
  contentStyle,
  labelStyle,
  children,
  disabled,
  ...props
}) => {
  const theme = useTheme();
  const materialTheme = useMaterialTheme();
  const isDarkMode = materialTheme.isDark;
  
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
    const baseStyle = (MaterialComponentStyles.button as any)[variant] || (MaterialComponentStyles.button as any).filled;
    switch (size) {
      case 'small':
        return { ...baseStyle, ...styles.small };
      case 'large':
        return { ...baseStyle, ...styles.large };
      default:
        return { ...baseStyle, ...styles.medium };
    }
  };

  const getLabelStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: 12, fontWeight: '500' as const };
      case 'large':
        return { fontSize: 16, fontWeight: '500' as const };
      default:
        return { fontSize: 14, fontWeight: '500' as const };
    }
  };

  const getRippleColor = () => {
    if (rippleColor) return rippleColor;
    
    switch (variant) {
      case 'filled':
        return `rgba(255, 255, 255, ${StateLayerOpacity.pressed})`;
      case 'outlined':
      case 'text':
        return `rgba(${theme.colors.primary}, ${StateLayerOpacity.pressed})`;
      case 'elevated':
      case 'tonal':
        return `rgba(${theme.colors.onSurface}, ${StateLayerOpacity.pressed})`;
      default:
        return `rgba(255, 255, 255, ${StateLayerOpacity.pressed})`;
    }
  };

  const getElevation = () => {
    if (elevation !== undefined) return elevation;
    
    switch (variant) {
      case 'elevated':
        return disabled ? 0 : 1;
      case 'filled':
      case 'tonal':
        return disabled ? 0 : 0;
      default:
        return 0;
    }
  };

  return (
    <Button
      mode={getMode()}
      loading={loading}
      disabled={disabled || loading}
      rippleColor={getRippleColor()}
      style={[
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        Platform.OS === 'android' && { elevation: getElevation() },
        style,
      ]}
      contentStyle={[
        getSizeStyles(),
        contentStyle,
      ]}
      labelStyle={[
        getLabelStyles(),
        labelStyle,
      ]}
      {...props}
    >
      {loading && loadingText ? loadingText : children}
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