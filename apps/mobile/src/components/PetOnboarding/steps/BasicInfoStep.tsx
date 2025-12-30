/**
 * BasicInfoStep - First step of pet onboarding
 * Collects pet name, species, and photo
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { PetOnboardingData } from '../../../utils/petFieldMapper';

export interface StepProps {
  profile: PetOnboardingData;
  onUpdate: (data: Partial<PetOnboardingData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const BasicInfoStep: React.FC<StepProps> = ({
  profile,
  onUpdate,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
}) => {
  return (
    <View style={styles.container} testID='basic-info-step'>
      <Text style={styles.title}>Basic Information</Text>

      <TextInput
        style={styles.input}
        testID='pet-name-input'
        placeholder='Pet Name'
        value={profile.name || ''}
        onChangeText={text => onUpdate({ name: text })}
      />

      <View testID='species-selector'>
        <Text style={styles.label}>Species</Text>
        {['dog', 'cat', 'bird', 'other'].map(species => (
          <TouchableOpacity
            key={species}
            testID={`species-${species}`}
            style={[
              styles.speciesButton,
              profile.species === species && styles.speciesButtonSelected,
            ]}
            onPress={() =>
              onUpdate({ species: species as PetOnboardingData['species'] })
            }
          >
            <Text>{species.charAt(0).toUpperCase() + species.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity testID='photo-button' style={styles.photoButton}>
        <Text>Add Photo</Text>
      </TouchableOpacity>

      <View style={styles.navigationButtons}>
        {!isFirstStep && (
          <TouchableOpacity testID='back-button' onPress={onPrevious}>
            <Text>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity testID='next-button' onPress={onNext}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  speciesButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
  },
  speciesButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  photoButton: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
});

export default BasicInfoStep;
