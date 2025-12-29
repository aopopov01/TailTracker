/**
 * Pet Onboarding Wizard Types
 * Type definitions for the onboarding wizard
 */

import type { PetSpecies, ExerciseLevel } from '@tailtracker/shared-types';

export interface WizardStep {
  id: number;
  title: string;
  description: string;
}

export const ONBOARDING_STEPS: WizardStep[] = [
  { id: 0, title: 'Basic Info', description: 'Name and species' },
  { id: 1, title: 'Physical Details', description: 'Breed, size, appearance' },
  { id: 2, title: 'Health Info', description: 'Medical conditions' },
  { id: 3, title: 'Personality', description: 'Character traits' },
  { id: 4, title: 'Care Preferences', description: 'Exercise and care needs' },
  { id: 5, title: 'Favorite Activities', description: 'What they love' },
  { id: 6, title: 'Review', description: 'Confirm and save' },
];

export interface PetOnboardingData {
  // Step 1: Basic Info
  name: string;
  species: PetSpecies | '';

  // Step 2: Physical Details
  breed?: string;
  gender?: 'male' | 'female' | 'unknown';
  dateOfBirth?: string;
  weightKg?: number;
  height?: string;
  color?: string;
  colorMarkings?: string;
  microchipNumber?: string;

  // Step 3: Health Info
  medicalConditions?: string[];
  allergies?: string[];
  currentMedications?: string[];

  // Emergency Contact (optional)
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;

  // Step 4: Personality
  personalityTraits?: string[];

  // Step 5: Care Preferences
  exerciseNeeds?: ExerciseLevel;
  specialNotes?: string;

  // Step 6: Favorite Activities
  favoriteActivities?: string[];
}

export interface StepProps {
  data: PetOnboardingData;
  onUpdate: (updates: Partial<PetOnboardingData>) => void;
  hideHeader?: boolean;
}

export const INITIAL_PET_DATA: PetOnboardingData = {
  name: '',
  species: '',
};

export interface PersonalityTrait {
  id: string;
  label: string;
  description: string;
  category: 'social' | 'behavior' | 'temperament' | 'energy';
}

export interface FavoriteActivity {
  id: string;
  label: string;
  description: string;
  species?: string[];
}

export interface ExerciseOption {
  id: string;
  label: string;
  value: ExerciseLevel;
  description: string;
}
