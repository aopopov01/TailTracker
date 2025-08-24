import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  AccessibilityRole
} from 'react-native';

interface AccessibleTextInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorMessage?: string;
  required?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

export const AccessibleTextInput: React.FC<AccessibleTextInputProps> = ({
  label,
  value,
  onChangeText,
  containerStyle,
  inputStyle,
  labelStyle,
  errorMessage,
  required = false,
  accessibilityHint,
  testID,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const inputId = testID || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const labelId = `${inputId}-label`;
  const errorId = `${inputId}-error`;
  
  const accessibilityLabel = required ? `${label}, required field` : label;
  
  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        style={[styles.label, isFocused && styles.labelFocused, labelStyle]}
        nativeID={labelId}
        accessibilityRole="text"
      >
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          errorMessage && styles.inputError,
          inputStyle
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityLabelledBy={labelId}
        testID={testID}
        {...textInputProps}
      />
      
      {errorMessage && (
        <Text
          style={styles.errorText}
          nativeID={errorId}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          {errorMessage}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  labelFocused: {
    color: '#007AFF',
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 44, // Accessibility minimum
  },
  inputFocused: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
});

export default AccessibleTextInput;