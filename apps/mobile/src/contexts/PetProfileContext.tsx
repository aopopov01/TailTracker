/**
 * Pet Profile Context
 * Manages pet profile state during onboarding and editing
 */

import React, { createContext, useState, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { petService } from '../services/PetService';

export interface PetProfile {
  id?: string;
  name: string;
  species: string;
  breed?: string;
  personality_traits?: string[];
  favorite_activities?: string[];
  exercise_needs?: 'low' | 'moderate' | 'high';
  special_notes?: string;
  date_of_birth?: string;
  weight_kg?: number;
  height?: string;
  color?: string;
  color_markings?: string;
  medical_conditions?: string[];
  allergies?: string[];
  medications?: string[];
  photo_url?: string;
}

interface SaveResult {
  success: boolean;
  pet?: any;
  isExisting?: boolean;
  error?: string;
  offline?: boolean;
  message?: string;
}

interface PetProfileContextType {
  currentProfile: PetProfile;
  setCurrentProfile: (
    profile: PetProfile | ((prev: PetProfile) => PetProfile)
  ) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  handleSave: () => Promise<SaveResult>;
  resetProfile: () => void;
}

const defaultProfile: PetProfile = {
  name: '',
  species: '',
  breed: '',
  personality_traits: [],
  favorite_activities: [],
  exercise_needs: 'moderate',
  special_notes: '',
};

const PetProfileContext = createContext<PetProfileContextType | undefined>(
  undefined
);

export const PetProfileProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentProfile, setCurrentProfile] =
    useState<PetProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Call petService to save the profile
      const result = await petService.upsertPetFromOnboarding(currentProfile);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save pet profile');
      }

      console.log('Pet profile saved successfully:', result.pet);
      return result;
    } catch (error) {
      console.error('Error saving pet profile:', error);

      // Handle offline storage
      try {
        // Get existing offline pets
        const offlinePetsJson = await AsyncStorage.getItem('offline_pets');
        const offlinePets = offlinePetsJson ? JSON.parse(offlinePetsJson) : [];

        // Add current profile to offline pets
        offlinePets.push({
          name: currentProfile.name,
          species: currentProfile.species,
          breed: currentProfile.breed,
          personality_traits: currentProfile.personality_traits,
          favorite_activities: currentProfile.favorite_activities,
          exercise_needs: currentProfile.exercise_needs,
          special_notes: currentProfile.special_notes,
        });

        // Save to AsyncStorage
        await AsyncStorage.setItem('offline_pets', JSON.stringify(offlinePets));

        // Return a special result indicating offline save
        return {
          success: true,
          offline: true,
          pet: currentProfile,
          message: 'Saved offline. Will sync when connected.',
        };
      } catch (storageError) {
        console.error('Failed to save offline:', storageError);
        throw error; // Throw original error if offline save also fails
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetProfile = () => {
    setCurrentProfile(defaultProfile);
  };

  const value = {
    currentProfile,
    setCurrentProfile,
    isLoading,
    setIsLoading,
    handleSave,
    resetProfile,
  };

  return (
    <PetProfileContext.Provider value={value}>
      {children}
    </PetProfileContext.Provider>
  );
};

export const usePetProfile = () => {
  const context = useContext(PetProfileContext);
  if (!context) {
    throw new Error('usePetProfile must be used within a PetProfileProvider');
  }
  return context;
};

export default PetProfileContext;
