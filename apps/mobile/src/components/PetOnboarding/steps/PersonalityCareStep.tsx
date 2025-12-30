/**
 * PersonalityCareStep - Personality and care preferences
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type { StepProps } from './BasicInfoStep';

const PersonalityCareStep: React.FC<StepProps> = ({
  profile,
  onUpdate,
  onNext,
  onPrevious,
}) => {
  const personalities = ['Friendly', 'Shy', 'Playful', 'Calm', 'Energetic'];
  const carePreferences = ['Low', 'Moderate', 'High'];

  const togglePersonality = (trait: string) => {
    const current = (profile.personalityTraits as string[]) || [];
    const updated = current.includes(trait)
      ? current.filter(t => t !== trait)
      : [...current, trait];
    onUpdate({ personalityTraits: updated });
  };

  return (
    <ScrollView style={styles.container} testID='personality-care-step'>
      <Text style={styles.title}>Personality & Care</Text>

      <Text style={styles.label}>Personality Traits</Text>
      <View style={styles.optionsContainer} testID='personality-traits'>
        {personalities.map(trait => (
          <TouchableOpacity
            key={trait}
            testID={`personality-${trait.toLowerCase()}`}
            style={[
              styles.optionButton,
              (profile.personalityTraits as string[])?.includes(trait) &&
                styles.optionSelected,
            ]}
            onPress={() => togglePersonality(trait)}
          >
            <Text>{trait}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Exercise Needs</Text>
      <View style={styles.optionsContainer} testID='exercise-needs'>
        {carePreferences.map(level => (
          <TouchableOpacity
            key={level}
            testID={`exercise-${level.toLowerCase()}`}
            style={[
              styles.optionButton,
              profile.exerciseNeeds === level.toLowerCase() &&
                styles.optionSelected,
            ]}
            onPress={() =>
              onUpdate({
                exerciseNeeds: level.toLowerCase() as
                  | 'low'
                  | 'moderate'
                  | 'high',
              })
            }
          >
            <Text>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity testID='back-button' onPress={onPrevious}>
          <Text>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID='next-button' onPress={onNext}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 15, marginBottom: 10 },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  optionSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
});

export default PersonalityCareStep;
