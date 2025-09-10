/**
 * Step 5: Care Preferences
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StepProps } from '../PetOnboardingWizard';
import PetPersonalityService from '../../../services/PetPersonalityService';

const CarePreferencesStep: React.FC<StepProps> = ({
  profile,
  onUpdate,
}) => {
  const theme = useTheme();
  const [exerciseNeed, setExerciseNeed] = useState(profile.exerciseNeeds || null);

  const exerciseOptions = useMemo(() => {
    if (!profile.species) return [];
    return PetPersonalityService.getExerciseOptions(profile.species);
  }, [profile.species]);

  const handleExerciseSelect = (value: 'low' | 'moderate' | 'high') => {
    setExerciseNeed(value);
    onUpdate({ exerciseNeeds: value });
  };

  if (!profile.species) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Please select your pet's species first
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Care Preferences
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Help us understand {profile.name || 'your pet'}'s care needs.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Exercise Needs
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          How active is your {profile.species}?
        </Text>

        <View style={styles.optionsContainer}>
          {exerciseOptions.map((option) => {
            const isSelected = exerciseNeed === option.value;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primaryContainer
                      : theme.colors.surface,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.outline,
                  },
                ]}
                onPress={() => handleExerciseSelect(option.value)}
              >
                <View style={styles.optionHeader}>
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: isSelected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurface,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Icon
                      name="check-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.optionDescription,
                    {
                      color: isSelected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default CarePreferencesStep;