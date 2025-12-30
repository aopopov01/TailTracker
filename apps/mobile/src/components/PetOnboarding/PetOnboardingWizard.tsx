/**
 * Pet Onboarding Wizard - Simplified Implementation
 *
 * Note: This is a minimal implementation to satisfy tests.
 * Full 7-step wizard implementation is pending.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PetPersonalityService } from '../../services/PetPersonalityService';
import { usePetProfile } from '../../hooks/usePetProfile';

// Define the wizard steps
const STEPS = [
  'Basic Information',
  'Physical Details',
  'Health Information',
  'Personality',
  'Care Preferences',
  'Favorite Activities',
  'Review & Save',
];

interface PetOnboardingWizardProps {
  onComplete?: (profile?: any) => void;
  onCancel?: () => void;
  initialProfile?: any;
}

export const PetOnboardingWizard: React.FC<PetOnboardingWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const {
    currentProfile,
    setCurrentProfile,
    isLoading,
    handleSave,
    resetProfile,
  } = usePetProfile();
  const [validationError, setValidationError] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');
  const [offlineMessage, setOfflineMessage] = useState<string>('');

  // Get species-specific activities
  const speciesActivities = useMemo(() => {
    if (!currentProfile.species) return [];
    return PetPersonalityService.getAllFavoriteActivities(
      currentProfile.species
    );
  }, [currentProfile.species]);

  const handleNext = async () => {
    // Validate required fields for step 1
    if (currentStep === 0) {
      if (!currentProfile.name) {
        Alert.alert('Required Field', 'Pet name is required');
        return;
      }
      if (!currentProfile.species) {
        Alert.alert('Required Field', 'Please select a species');
        return;
      }
    }

    setValidationError('');
    setSaveError('');
    setOfflineMessage('');

    // If on last step, save and complete
    if (currentStep === STEPS.length - 1) {
      try {
        const result: any = await handleSave();

        // Check if saved offline
        if (result?.offline) {
          setOfflineMessage(
            result.message || 'Saved offline. Will sync when connected.'
          );
          // Don't call onComplete for offline saves - stay on review screen
        } else if (onComplete && result?.pet) {
          // Call onComplete callback with saved pet (includes id)
          onComplete(result.pet);
        }
      } catch (error) {
        setSaveError('Error creating pet profile');
        console.error('Error saving pet:', error);
      }
    } else {
      // Move to next step
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setValidationError('');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSpeciesChange = (species: string) => {
    setCurrentProfile(prev => ({ ...prev, species }));
    // Clear validation error when species is selected
    setValidationError('');
  };

  const handleCancel = () => {
    resetProfile();
    if (onCancel) {
      onCancel();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <TextInput
              style={styles.input}
              placeholder='Pet Name'
              value={currentProfile.name}
              onChangeText={name =>
                setCurrentProfile({ ...currentProfile, name })
              }
              testID='pet-name-input'
              accessible={true}
              accessibilityLabel='Pet name'
              accessibilityHint="Enter your pet's name here"
            />
            <View
              style={styles.speciesContainer}
              accessible={true}
              accessibilityLabel='Select pet species'
              accessibilityHint="Choose your pet's species from the options below"
            >
              <Text style={styles.label}>Select Species:</Text>
              <TouchableOpacity
                style={[
                  styles.speciesButton,
                  currentProfile.species === 'dog' && styles.selectedSpecies,
                ]}
                onPress={() => handleSpeciesChange('dog')}
                testID='species-dog'
              >
                <Text>Dog</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.speciesButton,
                  currentProfile.species === 'cat' && styles.selectedSpecies,
                ]}
                onPress={() => handleSpeciesChange('cat')}
                testID='species-cat'
              >
                <Text>Cat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.speciesButton,
                  currentProfile.species === 'bird' && styles.selectedSpecies,
                ]}
                onPress={() => handleSpeciesChange('bird')}
                testID='species-bird'
              >
                <Text>Bird</Text>
              </TouchableOpacity>
            </View>
            {validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}
          </View>
        );

      case 1: // Physical Details
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Physical Details</Text>
            <TextInput
              style={styles.input}
              placeholder='Breed'
              value={currentProfile.breed}
              onChangeText={breed =>
                setCurrentProfile({ ...currentProfile, breed })
              }
              testID='breed-input'
            />
            <TextInput
              style={styles.input}
              placeholder='Weight (kg)'
              value={currentProfile.weight_kg?.toString() || ''}
              onChangeText={weight_kg =>
                setCurrentProfile({
                  ...currentProfile,
                  weight_kg: weight_kg ? parseFloat(weight_kg) : undefined,
                })
              }
              keyboardType='numeric'
              testID='weight-input'
            />
            <TextInput
              style={styles.input}
              placeholder='Height (cm)'
              value={currentProfile.height || ''}
              onChangeText={height =>
                setCurrentProfile({ ...currentProfile, height })
              }
              keyboardType='numeric'
              testID='height-input'
            />
            <TextInput
              style={styles.input}
              placeholder='Color and Markings'
              value={currentProfile.color_markings}
              onChangeText={color_markings =>
                setCurrentProfile({ ...currentProfile, color_markings })
              }
              testID='color-markings-input'
            />
          </View>
        );

      case 2: // Health Information
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Health Information</Text>
            <TextInput
              style={styles.input}
              placeholder='Medical Conditions (e.g., Hip dysplasia)'
              value={currentProfile.medical_conditions?.join(', ') || ''}
              onChangeText={text =>
                setCurrentProfile({
                  ...currentProfile,
                  medical_conditions: text
                    ? text.split(',').map(s => s.trim())
                    : [],
                })
              }
              testID='medical-conditions-input'
            />
            <TextInput
              style={styles.input}
              placeholder='Allergies (e.g., Chicken)'
              value={currentProfile.allergies?.join(', ') || ''}
              onChangeText={text =>
                setCurrentProfile({
                  ...currentProfile,
                  allergies: text ? text.split(',').map(s => s.trim()) : [],
                })
              }
              testID='allergies-input'
            />
            <TextInput
              style={styles.input}
              placeholder='Medications (e.g., Joint supplements)'
              value={currentProfile.medications?.join(', ') || ''}
              onChangeText={text =>
                setCurrentProfile({
                  ...currentProfile,
                  medications: text ? text.split(',').map(s => s.trim()) : [],
                })
              }
              testID='medications-input'
            />
          </View>
        );

      case 3: // Personality
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Personality</Text>
            <Text style={styles.stepDescription}>
              Help us understand your pet's unique character and preferences
            </Text>
            <ScrollView style={styles.activitiesContainer}>
              {['friendly', 'energetic', 'calm', 'playful', 'shy'].map(
                trait => {
                  const isSelected =
                    currentProfile.personality_traits?.includes(trait);
                  return (
                    <TouchableOpacity
                      key={trait}
                      style={[
                        styles.activityButton,
                        isSelected && styles.selectedActivity,
                      ]}
                      onPress={() => {
                        const traits = currentProfile.personality_traits || [];
                        if (isSelected) {
                          setCurrentProfile({
                            ...currentProfile,
                            personality_traits: traits.filter(t => t !== trait),
                          });
                        } else {
                          setCurrentProfile({
                            ...currentProfile,
                            personality_traits: [...traits, trait],
                          });
                        }
                      }}
                      testID={`trait-${trait}`}
                    >
                      <Text>
                        {trait.charAt(0).toUpperCase() + trait.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>
          </View>
        );

      case 4: // Care Preferences
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Care Preferences</Text>
            <Text style={styles.label}>Exercise Needs:</Text>
            <View style={styles.exerciseContainer}>
              <TouchableOpacity
                style={[
                  styles.speciesButton,
                  currentProfile.exercise_needs === 'low' &&
                    styles.selectedSpecies,
                ]}
                onPress={() =>
                  setCurrentProfile({
                    ...currentProfile,
                    exercise_needs: 'low',
                  })
                }
                testID='exercise-low'
              >
                <Text>Low</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.speciesButton,
                  currentProfile.exercise_needs === 'moderate' &&
                    styles.selectedSpecies,
                ]}
                onPress={() =>
                  setCurrentProfile({
                    ...currentProfile,
                    exercise_needs: 'moderate',
                  })
                }
                testID='exercise-moderate'
              >
                <Text>Moderate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.speciesButton,
                  currentProfile.exercise_needs === 'high' &&
                    styles.selectedSpecies,
                ]}
                onPress={() =>
                  setCurrentProfile({
                    ...currentProfile,
                    exercise_needs: 'high',
                  })
                }
                testID='exercise-high'
              >
                <Text>High</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder='Special Notes or Care Instructions'
              value={currentProfile.special_notes}
              onChangeText={special_notes =>
                setCurrentProfile({ ...currentProfile, special_notes })
              }
              multiline
              numberOfLines={4}
              testID='special-notes-input'
            />
          </View>
        );

      case 5: // Favorite Activities
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Favorite Activities</Text>
            <ScrollView style={styles.activitiesContainer}>
              {speciesActivities.map(activity => {
                const activityKey =
                  activity?.id || activity?.label || 'unknown';
                const activityLabel = activity?.label || String(activity);
                const isSelected =
                  currentProfile.favorite_activities?.includes(activityLabel);
                return (
                  <TouchableOpacity
                    key={activityKey}
                    style={[
                      styles.activityButton,
                      isSelected && styles.selectedActivity,
                    ]}
                    onPress={() => {
                      const activities =
                        currentProfile.favorite_activities || [];
                      if (isSelected) {
                        setCurrentProfile({
                          ...currentProfile,
                          favorite_activities: activities.filter(
                            a => a !== activityLabel
                          ),
                        });
                      } else {
                        setCurrentProfile({
                          ...currentProfile,
                          favorite_activities: [...activities, activityLabel],
                        });
                      }
                    }}
                    testID={`activity-${activityKey}`}
                  >
                    <Text>{activityLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        );

      case 6: // Review & Save
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Save</Text>
            <ScrollView>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Name:</Text>
                <Text style={styles.reviewValue}>{currentProfile.name}</Text>
              </View>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Species:</Text>
                <Text style={styles.reviewValue}>
                  {currentProfile.species?.charAt(0).toUpperCase() +
                    currentProfile.species?.slice(1)}
                </Text>
              </View>
              {currentProfile.breed && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>Breed:</Text>
                  <Text style={styles.reviewValue}>{currentProfile.breed}</Text>
                </View>
              )}
              {currentProfile.weight_kg && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>Weight:</Text>
                  <Text style={styles.reviewValue}>
                    {currentProfile.weight_kg} kg
                  </Text>
                </View>
              )}
              {currentProfile.height && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>Height:</Text>
                  <Text style={styles.reviewValue}>
                    {currentProfile.height} cm
                  </Text>
                </View>
              )}
              {currentProfile.color_markings && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>Color & Markings:</Text>
                  <Text style={styles.reviewValue}>
                    {currentProfile.color_markings}
                  </Text>
                </View>
              )}
              {currentProfile.medical_conditions &&
                currentProfile.medical_conditions.length > 0 && (
                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Medical Conditions:</Text>
                    <Text style={styles.reviewValue}>
                      {currentProfile.medical_conditions.join(', ')}
                    </Text>
                  </View>
                )}
              {currentProfile.allergies &&
                currentProfile.allergies.length > 0 && (
                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Allergies:</Text>
                    <Text style={styles.reviewValue}>
                      {currentProfile.allergies.join(', ')}
                    </Text>
                  </View>
                )}
              {currentProfile.medications &&
                currentProfile.medications.length > 0 && (
                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Medications:</Text>
                    <Text style={styles.reviewValue}>
                      {currentProfile.medications.join(', ')}
                    </Text>
                  </View>
                )}
              {currentProfile.personality_traits &&
                currentProfile.personality_traits.length > 0 && (
                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Personality:</Text>
                    <Text style={styles.reviewValue}>
                      {currentProfile.personality_traits.join(', ')}
                    </Text>
                  </View>
                )}
              {currentProfile.exercise_needs && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>Exercise Needs:</Text>
                  <Text style={styles.reviewValue}>
                    {currentProfile.exercise_needs.charAt(0).toUpperCase() +
                      currentProfile.exercise_needs.slice(1)}
                  </Text>
                </View>
              )}
              {currentProfile.special_notes && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>Special Notes:</Text>
                  <Text style={styles.reviewValue}>
                    {currentProfile.special_notes}
                  </Text>
                </View>
              )}
              {currentProfile.favorite_activities &&
                currentProfile.favorite_activities.length > 0 && (
                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Favorite Activities:</Text>
                    <Text style={styles.reviewValue}>
                      {currentProfile.favorite_activities.join(', ')}
                    </Text>
                  </View>
                )}
            </ScrollView>
          </View>
        );

      default:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{STEPS[currentStep]}</Text>
            <Text>Step {currentStep + 1} content (pending implementation)</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onCancel && (
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.cancelButton}
            testID='cancel-button'
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerText}>
          Step {currentStep + 1} of {STEPS.length}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>{renderStep()}</View>

      {saveError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{saveError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleNext}
            testID='retry-button'
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {offlineMessage && (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineMessage}>{offlineMessage}</Text>
        </View>
      )}

      <View style={styles.navigation}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.navButton, isLoading && styles.disabledButton]}
            onPress={handleBack}
            testID='back-button'
            disabled={isLoading}
          >
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={handleNext}
          testID={
            currentStep === STEPS.length - 1
              ? 'create-pet-button'
              : 'next-button'
          }
          disabled={isLoading}
          accessible={true}
          accessibilityRole='button'
          accessibilityLabel={
            currentStep === STEPS.length - 1
              ? 'Create pet profile'
              : 'Next step'
          }
          accessibilityHint={
            currentStep === STEPS.length - 1
              ? "Double tap to save your pet's profile"
              : 'Double tap to go to the next step'
          }
        >
          {isLoading && currentStep === STEPS.length - 1 ? (
            <>
              <ActivityIndicator
                size='small'
                color='#fff'
                testID='loading-indicator'
              />
              <Text style={[styles.navButtonText, styles.loadingText]}>
                Creating...
              </Text>
            </>
          ) : (
            <Text style={styles.navButtonText}>
              {currentStep === STEPS.length - 1 ? 'Create' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerSpacer: {
    width: 60, // Match the width of cancel button to center the title
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  speciesContainer: {
    marginTop: 16,
  },
  speciesButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedSpecies: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  exerciseContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  activitiesContainer: {
    flex: 1,
  },
  activityButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedActivity: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  reviewSection: {
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    color: '#000',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingText: {
    marginLeft: 8,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    minWidth: 100,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#fee',
    borderTopWidth: 1,
    borderTopColor: '#fcc',
    alignItems: 'center',
  },
  errorMessage: {
    color: '#c00',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineContainer: {
    padding: 16,
    backgroundColor: '#fff3cd',
    borderTopWidth: 1,
    borderTopColor: '#ffc107',
    alignItems: 'center',
  },
  offlineMessage: {
    color: '#856404',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PetOnboardingWizard;
export type { StepProps } from './steps/BasicInfoStep';
