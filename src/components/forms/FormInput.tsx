import React, { forwardRef } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text, useTheme, TextInput, HelperText } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  maxLength?: number;
  style?: any;
  testID?: string;
}

export const FormInput = forwardRef<RNTextInput, FormInputProps>(
  (
    {
      label,
      value,
      onChangeText,
      placeholder,
      error,
      required = false,
      disabled = false,
      multiline = false,
      numberOfLines = 1,
      keyboardType = 'default',
      autoCapitalize = 'sentences',
      secureTextEntry = false,
      leftIcon,
      rightIcon,
      onRightIconPress,
      maxLength,
      style,
      testID,
    },
    ref
  ) => {
    const theme = useTheme();

    const renderLeftIcon = () => {
      if (!leftIcon) return undefined;
      return <TextInput.Icon icon={leftIcon} />;
    };

    const renderRightIcon = () => {
      if (!rightIcon) return undefined;
      return (
        <TextInput.Icon
          icon={rightIcon}
          onPress={onRightIconPress}
          disabled={!onRightIconPress}
        />
      );
    };

    return (
      <View style={[styles.container, style]}>
        <TextInput
          ref={ref}
          label={
            <Text>
              {label}
              {required && (
                <Text style={{ color: theme.colors.error }}> *</Text>
              )}
            </Text>
          }
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          mode='outlined'
          disabled={disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          error={!!error}
          left={renderLeftIcon()}
          right={renderRightIcon()}
          style={styles.input}
          testID={testID}
          theme={{
            colors: {
              outline: error ? theme.colors.error : theme.colors.outline,
            },
          }}
        />
        {error && (
          <HelperText type='error' visible={!!error}>
            {error}
          </HelperText>
        )}
        {maxLength && (
          <HelperText type='info' visible={!error}>
            {value.length}/{maxLength} characters
          </HelperText>
        )}
      </View>
    );
  }
);

FormInput.displayName = 'FormInput';

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
});
