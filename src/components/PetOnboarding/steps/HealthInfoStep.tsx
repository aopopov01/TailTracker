/**
 * HealthInfoStep - Health information collection step
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

const HealthInfoStep: React.FC<StepProps> = ({
  profile,
  onUpdate,
  onNext,
  onPrevious,
}) => {
  return (
    <View style={styles.container} testID='health-info-step'>
      <Text style={styles.title}>Health Information</Text>

      <TextInput
        style={styles.input}
        testID='medical-conditions-input'
        placeholder='Medical Conditions (comma-separated)'
        value={
          Array.isArray(profile.medicalConditions)
            ? profile.medicalConditions.join(', ')
            : ''
        }
        onChangeText={text =>
          onUpdate({
            medicalConditions: text
              .split(',')
              .map(s => s.trim())
              .filter(s => s),
          })
        }
        multiline
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

export default HealthInfoStep;
