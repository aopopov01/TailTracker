/**
 * PhysicalDetailsStep - Physical characteristics collection
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import type { StepProps } from './BasicInfoStep';

const PhysicalDetailsStep: React.FC<StepProps> = ({
  profile,
  onUpdate,
  onNext,
  onPrevious,
}) => {
  return (
    <View style={styles.container} testID='physical-details-step'>
      <Text style={styles.title}>Physical Details</Text>

      <TextInput
        style={styles.input}
        testID='breed-input'
        placeholder='Breed'
        value={profile.breed || ''}
        onChangeText={text => onUpdate({ breed: text })}
      />

      <TextInput
        style={styles.input}
        testID='weight-input'
        placeholder='Weight (kg)'
        value={profile.weight?.toString() || ''}
        onChangeText={text => onUpdate({ weight: text })}
        keyboardType='numeric'
      />

      <TextInput
        style={styles.input}
        testID='color-input'
        placeholder='Color/Markings'
        value={profile.colorMarkings || ''}
        onChangeText={text => onUpdate({ colorMarkings: text })}
      />

      <View style={styles.navigationButtons}>
        <TouchableOpacity testID='back-button' onPress={onPrevious}>
          <Text>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID='next-button' onPress={onNext}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
});

export default PhysicalDetailsStep;
