import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';

interface BooleanFieldProps {
  label: string;
  value: boolean | undefined;
  onSelect: (value: boolean | undefined) => void;
  required?: boolean;
  error?: string;
}

/**
 * Boolean selection field with Yes/No/Unknown options
 * Handles tri-state boolean values (true/false/undefined)
 */
export function BooleanField({
  label,
  value,
  onSelect,
  required = false,
  error,
}: BooleanFieldProps) {
  const hasError = Boolean(error);
  
  const options = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
    { label: 'Unknown', value: undefined },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.requiredIndicator}> *</Text>}
      </Text>
      
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.label}
            style={[
              styles.option,
              value === option.value && styles.selectedOption,
              hasError && styles.optionError,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                value === option.value && styles.selectedOptionText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {hasError && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}const styles = StyleSheet.create({
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
  optionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  selectedOption: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionError: {
    borderColor: colors.error,
  },
  optionText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  selectedOptionText: {
    color: colors.primary,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.error,
    marginTop: spacing.xs,
  },
});