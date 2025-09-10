/**
 * Pet Onboarding Wizard - 7-Step Pet Profile Creation
 * Step 6 dynamically shows favorite activities based on selected pet species
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Button, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PetProfile, usePetProfile } from '../../contexts/PetProfileContext';
import PetPersonalityService from '../../services/PetPersonalityService';

// Step Components
import BasicInfoStep from './steps/BasicInfoStep';
import PhysicalDetailsStep from './steps/PhysicalDetailsStep';
import HealthInfoStep from './steps/HealthInfoStep';
import PersonalityStep from './steps/PersonalityStep';
import CarePreferencesStep from './steps/CarePreferencesStep';
import FavoriteActivitiesStep from './steps/FavoriteActivitiesStep';
import ReviewStep from './steps/ReviewStep';

const { width } = Dimensions.get('window');

export interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  component: React.ComponentType<StepProps>;
}

export interface StepProps {
  profile: PetProfile;
  onUpdate: (updates: Partial<PetProfile>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

interface Props {
  onComplete: (profile: PetProfile) => void;
  onCancel: () => void;
  initialProfile?: Partial<PetProfile>;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Basic Information',
    subtitle: 'Tell us about your pet',
    icon: 'paw',
    component: BasicInfoStep,
  },
  {
    id: 2,
    title: 'Physical Details',
    subtitle: 'Size, breed, and appearance',
    icon: 'tape-measure',
    component: PhysicalDetailsStep,
  },
  {
    id: 3,
    title: 'Health Information',
    subtitle: 'Medical conditions and care',
    icon: 'medical-bag',
    component: HealthInfoStep,
  },
  {
    id: 4,
    title: 'Personality',
    subtitle: 'Character traits and temperament',
    icon: 'heart-multiple',
    component: PersonalityStep,
  },
  {
    id: 5,
    title: 'Care Preferences',
    subtitle: 'Daily care and requirements',
    icon: 'account-heart',
    component: CarePreferencesStep,
  },
  {
    id: 6,
    title: 'Favorite Activities',
    subtitle: 'What does your pet love to do?',
    icon: 'run-fast',
    component: FavoriteActivitiesStep,
  },
  {
    id: 7,
    title: 'Review & Save',
    subtitle: 'Confirm your pet\'s profile',
    icon: 'check-circle',
    component: ReviewStep,
  },
];

export const PetOnboardingWizard: React.FC<Props> = ({
  onComplete,
  onCancel,
  initialProfile = {},
}) => {
  const theme = useTheme();
  const { profile, updateBasicInfo, resetProfile } = usePetProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardProfile, setWizardProfile] = useState<PetProfile>({
    ...initialProfile,
    ...profile,
  });

  // Calculate progress
  const progress = (currentStep + 1) / ONBOARDING_STEPS.length;

  // Get species-specific data for current step
  const speciesData = useMemo(() => {
    if (wizardProfile.species) {
      return PetPersonalityService.getPersonalityProfile(wizardProfile.species);
    }
    return null;
  }, [wizardProfile.species]);

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const CurrentStepComponent = currentStepData.component;

  const handleStepUpdate = (updates: Partial<PetProfile>) => {
    setWizardProfile(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Validate required fields
    if (!wizardProfile.name?.trim()) {
      Alert.alert('Missing Information', 'Please enter your pet\'s name.');
      setCurrentStep(0); // Go back to basic info
      return;
    }

    if (!wizardProfile.species) {
      Alert.alert('Missing Information', 'Please select your pet\'s species.');
      setCurrentStep(0); // Go back to basic info
      return;
    }

    onComplete(wizardProfile);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Pet Setup',
      'Are you sure you want to cancel? Your progress will be lost.',
      [
        { text: 'Continue Setup', style: 'cancel' },
        { 
          text: 'Cancel Setup', 
          style: 'destructive',
          onPress: () => {
            resetProfile();
            onCancel();
          }
        },
      ]
    );
  };

  const handleStepNavigation = (stepIndex: number) => {
    if (stepIndex <= currentStep || stepIndex === 0) {
      setCurrentStep(stepIndex);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.cancelButton}
        >
          <Icon name="close" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.stepTitle, { color: theme.colors.primary }]}>
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </Text>
          <Text style={[styles.stepHeading, { color: theme.colors.onSurface }]}>
            {currentStepData.title}
          </Text>
          <Text style={[styles.stepSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {currentStepData.subtitle}
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Icon 
            name={currentStepData.icon} 
            size={32} 
            color={theme.colors.primary} 
          />
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progress}
          color={theme.colors.primary}
          style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
        />
        <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
          {Math.round(progress * 100)}% Complete
        </Text>
      </View>

      {/* Step Navigator */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepNavigator}
      >
        {ONBOARDING_STEPS.map((step, index) => (
          <TouchableOpacity
            key={step.id}
            onPress={() => handleStepNavigation(index)}
            style={[
              styles.stepNavItem,
              {
                backgroundColor: index === currentStep 
                  ? theme.colors.primary 
                  : index < currentStep 
                    ? theme.colors.primaryContainer
                    : theme.colors.surfaceVariant,
              },
            ]}
            disabled={index > currentStep}
          >
            <Icon
              name={step.icon}
              size={20}
              color={
                index === currentStep
                  ? theme.colors.onPrimary
                  : index < currentStep
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.stepNavText,
                {
                  color: index === currentStep
                    ? theme.colors.onPrimary
                    : index < currentStep
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {step.id}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Step Content */}
      <View style={styles.stepContent}>
        <CurrentStepComponent
          profile={wizardProfile}
          onUpdate={handleStepUpdate}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === ONBOARDING_STEPS.length - 1}
        />
      </View>

      {/* Navigation Buttons */}
      <View style={[styles.navigationBar, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="outlined"
          onPress={handlePrevious}
          disabled={currentStep === 0}
          style={[
            styles.navButton,
            { borderColor: theme.colors.outline },
          ]}
          icon="chevron-left"
        >
          Previous
        </Button>

        <Button
          mode="contained"
          onPress={handleNext}
          style={[
            styles.navButton,
            styles.nextButton,
            { backgroundColor: theme.colors.primary },
          ]}
          icon={currentStep === ONBOARDING_STEPS.length - 1 ? "plus" : "chevron-right"}
          contentStyle={{ 
            flexDirection: currentStep === ONBOARDING_STEPS.length - 1 ? 'row' : 'row-reverse' 
          }}
        >
          {currentStep === ONBOARDING_STEPS.length - 1 ? 'Create' : 'Next'}
        </Button>
      </View>

      {/* Species Debug Info (Development) */}
      {__DEV__ && wizardProfile.species && (
        <View style={[styles.debugInfo, { backgroundColor: theme.colors.errorContainer }]}>
          <Text style={[styles.debugText, { color: theme.colors.onErrorContainer }]}>
            DEBUG: Species = {wizardProfile.species} | Activities Available = {speciesData?.favoriteActivities.length || 0}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepHeading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  headerIcon: {
    marginLeft: 12,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  stepNavigator: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stepNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    minWidth: 60,
  },
  stepNavText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  stepContent: {
    flex: 1,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  nextButton: {
    flex: 1,
    marginLeft: 16,
  },
  debugInfo: {
    padding: 8,
    margin: 4,
    borderRadius: 4,
  },
  debugText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default PetOnboardingWizard;