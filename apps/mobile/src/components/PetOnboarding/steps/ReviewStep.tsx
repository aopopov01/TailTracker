/**
 * ReviewStep - Final review before submission
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

const ReviewStep: React.FC<StepProps> = ({ profile, onNext, onPrevious }) => {
  return (
    <ScrollView style={styles.container} testID='review-step'>
      <Text style={styles.title}>Review & Confirm</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <Text testID='review-name'>Name: {profile.name || 'Not provided'}</Text>
        <Text testID='review-species'>
          Species: {profile.species || 'Not provided'}
        </Text>
        {profile.breed && (
          <Text testID='review-breed'>Breed: {profile.breed}</Text>
        )}
      </View>

      {profile.weight && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Details</Text>
          <Text testID='review-weight'>
            Weight:{' '}
            {typeof profile.weight === 'object'
              ? `${profile.weight.value} ${profile.weight.unit}`
              : `${profile.weight} kg`}
          </Text>
        </View>
      )}

      {profile.personalityTraits &&
        (profile.personalityTraits as string[]).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personality</Text>
            <Text testID='review-personality'>
              {(profile.personalityTraits as string[]).join(', ')}
            </Text>
          </View>
        )}

      {profile.favoriteActivities &&
        (profile.favoriteActivities as string[]).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorite Activities</Text>
            <Text testID='review-activities'>
              {(profile.favoriteActivities as string[]).join(', ')}
            </Text>
          </View>
        )}

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          testID='back-button'
          onPress={onPrevious}
          style={styles.button}
        >
          <Text>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID='create-button'
          onPress={onNext}
          style={[styles.button, styles.createButton]}
        >
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 40,
  },
  button: { padding: 12, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  createButton: { backgroundColor: '#007AFF' },
  createButtonText: { color: '#fff', fontWeight: '600' },
});

export default ReviewStep;
