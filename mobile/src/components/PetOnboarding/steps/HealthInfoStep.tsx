/**
 * Step 3: Health Information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { StepProps } from '../PetOnboardingWizard';

const HealthInfoStep: React.FC<StepProps> = ({
  profile,
  onUpdate,
}) => {
  const theme = useTheme();
  const [medicalConditions, setMedicalConditions] = useState(
    profile.medicalConditions?.join(', ') || ''
  );
  const [allergies, setAllergies] = useState(
    profile.allergies?.join(', ') || ''
  );

  const handleMedicalChange = (text: string) => {
    setMedicalConditions(text);
    onUpdate({ 
      medicalConditions: text.trim() ? text.split(',').map(s => s.trim()) : []
    });
  };

  const handleAllergiesChange = (text: string) => {
    setAllergies(text);
    onUpdate({ 
      allergies: text.trim() ? text.split(',').map(s => s.trim()) : []
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Health Information
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Help us keep {profile.name || 'your pet'} healthy (all optional).
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.onBackground }]}>
          Medical Conditions (optional)
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.onSurface,
              borderColor: theme.colors.outline,
            },
          ]}
          value={medicalConditions}
          onChangeText={handleMedicalChange}
          placeholder="e.g., Arthritis, Hip dysplasia (separate with commas)"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.onBackground }]}>
          Allergies (optional)
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.onSurface,
              borderColor: theme.colors.outline,
            },
          ]}
          value={allergies}
          onChangeText={handleAllergiesChange}
          placeholder="e.g., Chicken, Grass, Dust (separate with commas)"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default HealthInfoStep;