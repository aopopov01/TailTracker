import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

/**
 * Reusable form field component with consistent styling
 * Supports validation, error states, and required field indicators
 */
export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  error,
  multiline = false,
  keyboardType = 'default',
  ...textInputProps
}: FormFieldProps) {
  const hasError = Boolean(error);
  const displayPlaceholder = placeholder || `Enter ${label.toLowerCase()}`;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.requiredIndicator}> *</Text>}
      </Text>
      
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          hasError && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={displayPlaceholder}
        placeholderTextColor={colors.gray400}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...textInputProps}
      />
      
      {hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  requiredIndicator: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.gray200,
    minHeight: 50,
  },
  multilineInput: {
    height: 80,
    paddingTop: spacing.md,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.error,
    marginLeft: spacing.xs,
    flex: 1,
  },
});