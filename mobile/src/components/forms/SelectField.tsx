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

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  required?: boolean;
  error?: string;
}

/**
 * Reusable select field component with multiple choice options
 * Provides consistent styling for option selection
 */
export function SelectField({
  label,
  value,
  options,
  onSelect,
  required = false,
  error,
}: SelectFieldProps) {
  const hasError = Boolean(error);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.requiredIndicator}> *</Text>}
      </Text>
      
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
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
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    backgroundColor: colors.gray50,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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