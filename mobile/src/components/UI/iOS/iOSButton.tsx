import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export enum iOSButtonType {
  Primary = 'primary',
  Secondary = 'secondary',
  Destructive = 'destructive',
  Plain = 'plain',
  Filled = 'filled',
  FilledGray = 'filled-gray',
  BorderedProminent = 'bordered-prominent',
  Bordered = 'bordered',
}

export enum iOSButtonSize {
  Large = 'large',
  Medium = 'medium',
  Small = 'small',
  Mini = 'mini',
}

interface iOSButtonProps {
  title: string;
  onPress: () => void;
  type?: iOSButtonType;
  size?: iOSButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  fullWidth?: boolean;
}

export const iOSButton: React.FC<iOSButtonProps> = ({
  title,
  onPress,
  type = iOSButtonType.Primary,
  size = iOSButtonSize.Medium,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  hapticFeedback = true,
  fullWidth = false,
}) => {
  const handlePress = async () => {
    if (disabled || loading) return;

    if (hapticFeedback && Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: size === iOSButtonSize.Mini ? 8 : size === iOSButtonSize.Small ? 10 : 12,
      paddingHorizontal: size === iOSButtonSize.Mini ? 12 : size === iOSButtonSize.Small ? 16 : 20,
      paddingVertical: size === iOSButtonSize.Mini ? 6 : size === iOSButtonSize.Small ? 8 : 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      minHeight: size === iOSButtonSize.Mini ? 28 : size === iOSButtonSize.Small ? 36 : size === iOSButtonSize.Medium ? 44 : 50,
      opacity: disabled ? 0.6 : 1,
      ...(fullWidth && { width: '100%' }),
    };

    switch (type) {
      case iOSButtonType.Primary:
        return {
          ...baseStyle,
          backgroundColor: '#007AFF',
          shadowColor: '#007AFF',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        };
      case iOSButtonType.Secondary:
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#007AFF',
        };
      case iOSButtonType.Destructive:
        return {
          ...baseStyle,
          backgroundColor: '#FF3B30',
          shadowColor: '#FF3B30',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        };
      case iOSButtonType.Plain:
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case iOSButtonType.Filled:
        return {
          ...baseStyle,
          backgroundColor: '#007AFF',
        };
      case iOSButtonType.FilledGray:
        return {
          ...baseStyle,
          backgroundColor: '#8E8E93',
        };
      case iOSButtonType.BorderedProminent:
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: '#007AFF',
        };
      case iOSButtonType.Bordered:
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#C7C7CC',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
      fontSize: size === iOSButtonSize.Mini ? 14 : size === iOSButtonSize.Small ? 16 : size === iOSButtonSize.Medium ? 17 : 18,
    };

    switch (type) {
      case iOSButtonType.Primary:
      case iOSButtonType.Filled:
        return { ...baseTextStyle, color: '#FFFFFF' };
      case iOSButtonType.Secondary:
      case iOSButtonType.BorderedProminent:
        return { ...baseTextStyle, color: '#007AFF' };
      case iOSButtonType.Destructive:
        return { ...baseTextStyle, color: '#FFFFFF' };
      case iOSButtonType.Plain:
        return { ...baseTextStyle, color: '#007AFF', fontWeight: '400' };
      case iOSButtonType.FilledGray:
        return { ...baseTextStyle, color: '#FFFFFF' };
      case iOSButtonType.Bordered:
        return { ...baseTextStyle, color: '#000000', fontWeight: '400' };
      default:
        return baseTextStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            type === iOSButtonType.Primary ||
            type === iOSButtonType.Destructive ||
            type === iOSButtonType.Filled ||
            type === iOSButtonType.FilledGray
              ? '#FFFFFF'
              : '#007AFF'
          }
          size="small"
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[getTextStyle(), textStyle, icon && { marginLeft: 8 }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({});