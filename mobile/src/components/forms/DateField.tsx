import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';

interface DateFieldProps {
  label: string;
  value?: string;
  onDateSelect: (date: string) => void;
  required?: boolean;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

/**
 * Date selection field with platform-appropriate date picker
 * Handles date formatting and validation
 */
export function DateField({
  label,
  value,
  onDateSelect,
  required = false,
  error,
  maximumDate = new Date(),
  minimumDate,
}: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const hasError = Boolean(error);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      onDateSelect(selectedDate.toISOString().split('T')[0]);
    }
  };

  const displayDate = value ? new Date(value).toLocaleDateString() : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.requiredIndicator}> *</Text>}
      </Text>
      
      <TouchableOpacity
        style={[
          styles.dateButton,
          hasError && styles.dateButtonError,
        ]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {displayDate || `Select ${label.toLowerCase()}`}
        </Text>
        <Ionicons name="calendar" size={20} color={colors.primary} />
      </TouchableOpacity>
      
      {showPicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}
      
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    minHeight: 50,
  },
  dateButtonError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  dateText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  placeholder: {
    color: colors.gray400,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.error,
    marginTop: spacing.xs,
  },
});