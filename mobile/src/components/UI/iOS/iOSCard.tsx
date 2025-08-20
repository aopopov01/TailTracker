import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
  ColorSchemeName,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';

interface iOSCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurred?: boolean;
  elevated?: boolean;
  bordered?: boolean;
  backgroundColor?: string;
  cornerRadius?: number;
}

export const iOSCard: React.FC<iOSCardProps> = ({
  children,
  style,
  blurred = false,
  elevated = true,
  bordered = false,
  backgroundColor,
  cornerRadius = 12,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: cornerRadius,
      overflow: 'hidden',
    };

    if (elevated && Platform.OS === 'ios') {
      return {
        ...baseStyle,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      };
    }

    return baseStyle;
  };

  const getContentStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      padding: 16,
      borderRadius: cornerRadius,
    };

    if (blurred) {
      return baseStyle;
    }

    const defaultBgColor = isDark ? '#1C1C1E' : '#FFFFFF';

    return {
      ...baseStyle,
      backgroundColor: backgroundColor || defaultBgColor,
      ...(bordered && {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: isDark ? '#3A3A3C' : '#C6C6C8',
      }),
    };
  };

  if (blurred && Platform.OS === 'ios') {
    return (
      <View style={[getCardStyle(), style]}>
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={getContentStyle()}
        >
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[getCardStyle(), getContentStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({});