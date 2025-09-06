import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { databaseService, StoredPetProfile } from '../services/database';
import { useAuth } from '../src/contexts/AuthContext';

export interface PetProfile {
  // Basic Info
  name?: string;
  species?: 'dog' | 'cat' | 'bird' | 'other';
  photos?: string[];
  
  // Physical Details
  breed?: string;
  dateOfBirth?: Date;
  approximateAge?: string;
  useApproximateAge?: boolean;
  gender?: 'male' | 'female' | 'unknown';
  colorMarkings?: string;
  weight?: string;
  weightUnit?: 'kg' | 'lbs';
  height?: string;
  heightUnit?: 'cm' | 'ft';
  
  // Official Records
  registrationNumber?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  
  // Health Profile
  medicalConditions?: string[];
  medications?: string[];
  allergies?: string[];
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  
  // Personality & Care
  personalityTraits?: string[];
  favoriteToys?: string[];
  favoriteActivities?: string[];
  exerciseNeeds?: 'low' | 'medium' | 'high';
  feedingSchedule?: string;
  specialNotes?: string;
}

interface PetProfileState {
  profile: PetProfile;
  pets: StoredPetProfile[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

type PetProfileAction =
  | { type: 'UPDATE_BASIC_INFO'; payload: Partial<PetProfile> }
  | { type: 'UPDATE_PHYSICAL_DETAILS'; payload: Partial<PetProfile> }
  | { type: 'UPDATE_OFFICIAL_RECORDS'; payload: Partial<PetProfile> }
  | { type: 'UPDATE_HEALTH_PROFILE'; payload: Partial<PetProfile> }
  | { type: 'UPDATE_PERSONALITY_CARE'; payload: Partial<PetProfile> }
  | { type: 'RESET_PROFILE' }
  | { type: 'SET_PROFILE'; payload: PetProfile }
  | { type: 'SET_PETS'; payload: StoredPetProfile[] }
  | { type: 'ADD_PET'; payload: StoredPetProfile }
  | { type: 'UPDATE_PET'; payload: { id: number; updates: Partial<PetProfile> } }
  | { type: 'REMOVE_PET'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

interface PetProfileContextType {
  // Current profile state
  profile: PetProfile;
  pets: StoredPetProfile[];
  
  // Profile management
  updateBasicInfo: (data: Partial<PetProfile>) => void;
  updatePhysicalDetails: (data: Partial<PetProfile>) => void;
  updateOfficialRecords: (data: Partial<PetProfile>) => void;
  updateHealthProfile: (data: Partial<PetProfile>) => void;
  updatePersonalityCare: (data: Partial<PetProfile>) => void;
  resetProfile: () => void;
  setProfile: (profile: PetProfile) => void;
  
  // Database operations
  savePetProfile: (profile: PetProfile) => Promise<number>;
  updatePetProfile: (id: number, profile: Partial<PetProfile>) => Promise<void>;
  deletePet: (id: number) => Promise<void>;
  loadPets: () => Promise<void>;
  loadPetById: (id: number) => Promise<StoredPetProfile | null>;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Actions
  clearError: () => void;
}

const PetProfileContext = createContext<PetProfileContextType | undefined>(undefined);

const petProfileReducer = (state: PetProfileState, action: PetProfileAction): PetProfileState => {
  switch (action.type) {
    case 'UPDATE_BASIC_INFO':
    case 'UPDATE_PHYSICAL_DETAILS':
    case 'UPDATE_OFFICIAL_RECORDS':
    case 'UPDATE_HEALTH_PROFILE':
    case 'UPDATE_PERSONALITY_CARE':
      return { 
        ...state, 
        profile: { ...state.profile, ...action.payload },
        error: null
      };
    case 'SET_PROFILE':
      return { 
        ...state, 
        profile: action.payload,
        error: null
      };
    case 'RESET_PROFILE':
      return { 
        ...state, 
        profile: {},
        error: null
      };
    case 'SET_PETS':
      return { 
        ...state, 
        pets: action.payload,
        isLoading: false,
        error: null
      };
    case 'ADD_PET':
      return { 
        ...state, 
        pets: [action.payload, ...state.pets],
        error: null
      };
    case 'UPDATE_PET':
      return { 
        ...state, 
        pets: state.pets.map(pet => 
          pet.id === action.payload.id 
            ? { ...pet, ...action.payload.updates }
            : pet
        ),
        error: null
      };
    case 'REMOVE_PET':
      return { 
        ...state, 
        pets: state.pets.filter(pet => pet.id !== action.payload),
        error: null
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isSaving: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState: PetProfileState = {
  profile: {},
  pets: [],
  isLoading: false,
  isSaving: false,
  error: null
};

export const PetProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(petProfileReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Profile management actions
  const updateBasicInfo = (data: Partial<PetProfile>) => {
    dispatch({ type: 'UPDATE_BASIC_INFO', payload: data });
  };

  const updatePhysicalDetails = (data: Partial<PetProfile>) => {
    dispatch({ type: 'UPDATE_PHYSICAL_DETAILS', payload: data });
  };

  const updateOfficialRecords = (data: Partial<PetProfile>) => {
    dispatch({ type: 'UPDATE_OFFICIAL_RECORDS', payload: data });
  };

  const updateHealthProfile = (data: Partial<PetProfile>) => {
    dispatch({ type: 'UPDATE_HEALTH_PROFILE', payload: data });
  };

  const updatePersonalityCare = (data: Partial<PetProfile>) => {
    dispatch({ type: 'UPDATE_PERSONALITY_CARE', payload: data });
  };

  const resetProfile = () => {
    dispatch({ type: 'RESET_PROFILE' });
  };

  const setProfile = (profile: PetProfile) => {
    dispatch({ type: 'SET_PROFILE', payload: profile });
  };

  // Database operations
  const loadPets = useCallback(async (): Promise<void> => {
    if (!user) {
      dispatch({ type: 'SET_PETS', payload: [] });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const pets = await databaseService.getAllPets(parseInt(user.id, 10));
      dispatch({ type: 'SET_PETS', payload: pets });
    } catch (error) {
      console.error('Load pets error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pets';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  const savePetProfile = useCallback(async (profile: PetProfile): Promise<number> => {
    if (!user) {
      throw new Error('User must be authenticated to save pet profile');
    }

    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const petId = await databaseService.savePetProfile(profile, parseInt(user.id, 10));
      
      // Reload pets to get the updated list
      await loadPets();
      
      return petId;
    } catch (error) {
      console.error('Save pet profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save pet profile';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [user, loadPets]);

  const updatePetProfile = useCallback(async (id: number, profile: Partial<PetProfile>): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update pet profile');
    }

    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await databaseService.updatePetProfile(id, profile, parseInt(user.id, 10));
      
      // Update local state
      dispatch({ type: 'UPDATE_PET', payload: { id, updates: profile } });
    } catch (error) {
      console.error('Update pet profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update pet profile';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [user]);

  const deletePet = useCallback(async (id: number): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to delete pet');
    }

    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await databaseService.deletePet(id, parseInt(user.id, 10));
      
      // Update local state
      dispatch({ type: 'REMOVE_PET', payload: id });
    } catch (error) {
      console.error('Delete pet error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete pet';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [user]);

  const loadPetById = useCallback(async (id: number): Promise<StoredPetProfile | null> => {
    if (!user) {
      throw new Error('User must be authenticated to load pet');
    }

    try {
      dispatch({ type: 'CLEAR_ERROR' });
      return await databaseService.getPetById(id, parseInt(user.id, 10));
    } catch (error) {
      console.error('Load pet by ID error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pet';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [user]);

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Load pets when user changes
  React.useEffect(() => {
    if (isAuthenticated && user) {
      loadPets();
    } else {
      dispatch({ type: 'SET_PETS', payload: [] });
      resetProfile();
    }
  }, [isAuthenticated, user, loadPets]);

  const contextValue: PetProfileContextType = {
    // State
    profile: state.profile,
    pets: state.pets,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,

    // Profile management
    updateBasicInfo,
    updatePhysicalDetails,
    updateOfficialRecords,
    updateHealthProfile,
    updatePersonalityCare,
    resetProfile,
    setProfile,

    // Database operations
    savePetProfile,
    updatePetProfile,
    deletePet,
    loadPets,
    loadPetById,

    // Actions
    clearError
  };

  return (
    <PetProfileContext.Provider value={contextValue}>
      {children}
    </PetProfileContext.Provider>
  );
};

export const usePetProfile = (): PetProfileContextType => {
  const context = useContext(PetProfileContext);
  if (context === undefined) {
    throw new Error('usePetProfile must be used within a PetProfileProvider');
  }
  return context;
};