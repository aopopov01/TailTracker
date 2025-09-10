/**
 * Step 2: Physical Details - Breed, Size, and Appearance
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

const PhysicalDetailsStep: React.FC<StepProps> = ({
  profile,
  onUpdate,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
}) => {
  const theme = useTheme();
  const [breed, setBreed] = useState(profile.breed || '');
  const [weight, setWeight] = useState(profile.weight || '');
  const [colorMarkings, setColorMarkings] = useState(profile.colorMarkings || '');

  const handleBreedChange = (text: string) => {
    setBreed(text);
    onUpdate({ breed: text.trim() });
  };

  const handleWeightChange = (text: string) => {
    setWeight(text);
    onUpdate({ weight: text.trim() });
  };

  const handleColorChange = (text: string) => {
    setColorMarkings(text);
    onUpdate({ colorMarkings: text.trim() });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Tell us about {profile.name || 'your pet'}'s appearance
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Help us build a complete profile (all fields optional).
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.onBackground }]}>
          Breed (optional)
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
          value={breed}
          onChangeText={handleBreedChange}
          placeholder="e.g., Golden Retriever, Persian, Canary"
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.onBackground }]}>
          Weight (optional)
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
          value={weight}
          onChangeText={handleWeightChange}
          placeholder="e.g., 25 lbs, 5 kg"
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.onBackground }]}>
          Color & Markings (optional)
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
          value={colorMarkings}
          onChangeText={handleColorChange}
          placeholder="e.g., Brown with white chest, Orange tabby"
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

export default PhysicalDetailsStep;