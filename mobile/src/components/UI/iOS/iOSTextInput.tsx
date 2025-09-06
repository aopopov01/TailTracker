import React, { useState, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
  useColorScheme,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface iOSTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  style?: ViewStyle;
  textInputStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  secureTextEntry?: boolean;
  editable?: boolean;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hapticFeedback?: boolean;
}

export const IOSTextInput: React.FC<iOSTextInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  helperText,
  style,
  textInputStyle,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  secureTextEntry = false,
  editable = true,
  maxLength,
  onFocus,
  onBlur,
  leftIcon,
  rightIcon,
  hapticFeedback = true,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const handleFocus = async () => {
    setIsFocused(true);
    onFocus?.();

    if (hapticFeedback && Platform.OS === 'ios') {
      await Haptics.selectionAsync();
    }

    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();

    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const getContainerStyle = (): ViewStyle => {
    const borderColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [
        error ? '#FF3B30' : isDark ? '#3A3A3C' : '#C6C6C8',
        error ? '#FF3B30' : '#007AFF',
      ],
    });

    return {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 10,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      paddingHorizontal: 12,
      paddingVertical: multiline ? 12 : 16,
      minHeight: multiline ? numberOfLines * 20 + 24 : 44,
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      borderColor: borderColor as any,
    };
  };

  const getTextInputStyle = (): TextStyle => {
    return {
      flex: 1,
      fontSize: 17,
      color: isDark ? '#FFFFFF' : '#000000',
      fontWeight: '400',
      ...(multiline && { textAlignVertical: 'top' }),
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#8E8E93' : '#6D6D70',
      marginBottom: 6,
    };
  };

  const getHelperTextStyle = (): TextStyle => {
    return {
      fontSize: 13,
      fontWeight: '400',
      color: error
        ? '#FF3B30'
        : isDark
        ? '#8E8E93'
        : '#6D6D70',
      marginTop: 6,
    };
  };

  return (
    <View style={style}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      
      <Animated.View style={getContainerStyle()}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#8E8E93' : '#C7C7CC'}
          style={[getTextInputStyle(), textInputStyle]}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete as any}
          secureTextEntry={secureTextEntry}
          editable={editable}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardAppearance={isDark ? 'dark' : 'light'}
          selectionColor="#007AFF"
        />
        
        {rightIcon && (
          <View style={styles.iconContainer}>
            {rightIcon}
          </View>
        )}
      </Animated.View>
      
      {(error || helperText) && (
        <Text style={getHelperTextStyle()}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});