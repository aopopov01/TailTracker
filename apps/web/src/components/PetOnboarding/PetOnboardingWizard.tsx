/**
 * PetOnboardingWizard
 * Main orchestrator for the 7-step pet onboarding wizard
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { createPet } from '@tailtracker/shared-services';
import type { PetData } from '@tailtracker/shared-types';

import { WizardProgress } from './WizardProgress';
import { ONBOARDING_STEPS, INITIAL_PET_DATA } from './types';
import type { PetOnboardingData } from './types';

// Step Components
import { BasicInfoStep } from './steps/BasicInfoStep';
import { PhysicalDetailsStep } from './steps/PhysicalDetailsStep';
import { HealthInfoStep } from './steps/HealthInfoStep';
import { PersonalityStep } from './steps/PersonalityStep';
import { CarePreferencesStep } from './steps/CarePreferencesStep';
import { FavoriteActivitiesStep } from './steps/FavoriteActivitiesStep';
import { ReviewStep } from './steps/ReviewStep';

export const PetOnboardingWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [petData, setPetData] = useState<PetOnboardingData>(INITIAL_PET_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePetData = (updates: Partial<PetOnboardingData>) => {
    setPetData((prev) => ({ ...prev, ...updates }));
  };

  // Validate current step
  const isCurrentStepValid = useMemo(() => {
    switch (currentStep) {
      case 0: // Basic Info
        return Boolean(petData.name?.trim() && petData.species);
      case 1: // Physical Details - optional
      case 2: // Health Info - optional
      case 3: // Personality - optional
      case 4: // Care Preferences - optional
      case 5: // Favorite Activities - optional
        return true;
      case 6: // Review
        return Boolean(petData.name?.trim() && petData.species);
      default:
        return true;
    }
  }, [currentStep, petData.name, petData.species]);

  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (!isCurrentStepValid) return;

    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!petData.name || !petData.species) {
      setError('Please provide pet name and species');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Map wizard data to PetData format
      const submitData: PetData = {
        name: petData.name,
        species: petData.species,
        breed: petData.breed,
        gender: petData.gender,
        dateOfBirth: petData.dateOfBirth,
        weightKg: petData.weightKg,
        height: petData.height,
        color: petData.color,
        colorMarkings: petData.colorMarkings,
        microchipNumber: petData.microchipNumber,
        medicalConditions: petData.medicalConditions,
        allergies: petData.allergies,
        currentMedications: petData.currentMedications,
        personalityTraits: petData.personalityTraits,
        exerciseNeeds: petData.exerciseNeeds,
        specialNotes: petData.specialNotes,
        favoriteActivities: petData.favoriteActivities,
        emergencyContactName: petData.emergencyContactName,
        emergencyContactPhone: petData.emergencyContactPhone,
        emergencyContactEmail: petData.emergencyContactEmail,
      };

      const result = await createPet(submitData);

      if (result.success && result.data) {
        // Navigate to the new pet's profile
        navigate(`/pets/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to create pet profile');
      }
    } catch (err) {
      console.error('Error creating pet:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step
  const renderStep = () => {
    const stepProps = { data: petData, onUpdate: updatePetData };

    switch (currentStep) {
      case 0:
        return <BasicInfoStep {...stepProps} />;
      case 1:
        return <PhysicalDetailsStep {...stepProps} />;
      case 2:
        return <HealthInfoStep {...stepProps} />;
      case 3:
        return <PersonalityStep {...stepProps} />;
      case 4:
        return <CarePreferencesStep {...stepProps} />;
      case 5:
        return <FavoriteActivitiesStep {...stepProps} />;
      case 6:
        return <ReviewStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <WizardProgress currentStep={currentStep} />

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {renderStep()}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={isFirstStep || isSubmitting}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
            ${
              isFirstStep || isSubmitting
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
            }
          `}
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!isCurrentStepValid || isSubmitting}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors
            ${
              !isCurrentStepValid || isSubmitting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : isLastStep ? (
            'Create'
          ) : (
            <>
              Next
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
