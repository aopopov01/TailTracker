import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

/**
 * Form section wrapper with consistent styling
 * Provides visual grouping for related form fields
 */
export function FormSection({ title, children }: FormSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
});