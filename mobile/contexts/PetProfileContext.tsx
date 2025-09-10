import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { databaseService, StoredPetProfile } from '../services/database';
import { supabaseSyncService, SyncResult } from '../src/services/SupabaseSyncService';
import { bidirectionalSyncService } from '../src/services/BidirectionalSyncService';
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
  isSyncing: boolean;
  error: string | null;
  syncStatus: {
    lastSync: string | null;
    hasPendingSync: boolean;
    isAuthenticated: boolean;
  } | null;
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
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_SYNC_STATUS'; payload: { lastSync: string | null; hasPendingSync: boolean; isAuthenticated: boolean } }
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
  savePetProfileWithSync: (profile: PetProfile) => Promise<{ localId: number; syncResult?: SyncResult }>;
  updatePetProfile: (id: number, profile: Partial<PetProfile>) => Promise<void>;
  updatePetProfileField: (id: number, field: string, value: any) => Promise<void>;
  deletePet: (id: number) => Promise<void>;
  loadPets: () => Promise<void>;
  loadPetById: (id: number) => Promise<StoredPetProfile | null>;
  
  // Enhanced sync operations
  syncPetToSupabase: (localPetId: number) => Promise<SyncResult>;
  retryPendingSyncs: () => Promise<SyncResult[]>;
  getSyncStatus: () => Promise<void>;
  startRealTimeSync: (localPetId: number, supabasePetId: string) => Promise<void>;
  stopRealTimeSync: () => void;
  performFullSync: (localPetId: number, supabasePetId: string) => Promise<SyncResult>;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isSyncing: boolean;
  error: string | null;
  syncStatus: {
    lastSync: string | null;
    hasPendingSync: boolean;
    isAuthenticated: boolean;
  } | null;
  
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
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isSaving: false, isSyncing: false };
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
  isSyncing: false,
  error: null,
  syncStatus: null
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

  // Supabase sync operations
  const savePetProfileWithSync = useCallback(async (profile: PetProfile): Promise<{ localId: number; syncResult?: SyncResult }> => {
    if (!user) {
      throw new Error('User must be authenticated to save pet profile');
    }

    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Save to local database first
      const localId = await databaseService.savePetProfile(profile, parseInt(user.id, 10));
      
      // Reload pets to get the updated list
      await loadPets();

      // Try to sync to Supabase if user is authenticated
      const canSync = await supabaseSyncService.isSyncAvailable();
      if (canSync) {
        try {
          dispatch({ type: 'SET_SYNCING', payload: true });
          const syncResult = await supabaseSyncService.syncOnboardingProfile(localId);
          
          // Update sync status
          await getSyncStatus();
          
          return { localId, syncResult };
        } catch (syncError) {
          console.error('Sync error (non-blocking):', syncError);
          
          // Log specific sync error types for debugging
          if (syncError instanceof Error) {
            if (syncError.message.includes('Email verification required')) {
              console.log('📧 Sync deferred - email verification pending');
            } else if (syncError.message.includes('User not authenticated')) {
              console.log('🔒 Sync deferred - authentication required');
            } else {
              console.log('⚠️ Sync failed - will retry later:', syncError.message);
            }
          }
          
          // Don't throw sync errors - local save was successful
          return { localId };
        } finally {
          dispatch({ type: 'SET_SYNCING', payload: false });
        }
      }
      
      return { localId };
    } catch (error) {
      console.error('Save pet profile with sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save pet profile';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [user, loadPets]);

  const syncPetToSupabase = useCallback(async (localPetId: number): Promise<SyncResult> => {
    if (!user) {
      throw new Error('User must be authenticated to sync pet');
    }

    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const syncResult = await supabaseSyncService.syncOnboardingProfile(localPetId);
      
      // Update sync status
      await getSyncStatus();
      
      return syncResult;
    } catch (error) {
      console.error('Sync pet to Supabase error:', error);
      
      let errorMessage = 'Failed to sync pet';
      if (error instanceof Error) {
        if (error.message.includes('Email verification required')) {
          errorMessage = 'Please verify your email before syncing';
          console.log('📧 Sync deferred due to pending email verification');
          // Don't treat this as a critical error
        } else if (error.message.includes('User not authenticated')) {
          errorMessage = 'Please log in to sync your pet data';
          console.log('🔒 Sync requires authentication');
        } else {
          errorMessage = error.message;
        }
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, [user]);

  const retryPendingSyncs = useCallback(async (): Promise<SyncResult[]> => {
    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const results = await supabaseSyncService.retryPendingSyncs();
      
      // Update sync status
      await getSyncStatus();
      
      return results;
    } catch (error) {
      console.error('Retry pending syncs error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry syncs';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, []);

  const getSyncStatus = useCallback(async (): Promise<void> => {
    try {
      const status = await supabaseSyncService.getSyncStatus();
      dispatch({ type: 'SET_SYNC_STATUS', payload: status });
    } catch (error) {
      console.error('Get sync status error:', error);
      // Don't throw error for status check
    }
  }, []);

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Enhanced sync methods for bidirectional sync
  const updatePetProfileField = useCallback(async (id: number, field: string, value: any): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update pet profile field');
    }

    try {
      dispatch({ type: 'CLEAR_ERROR' });

      // Update local database
      await databaseService.updatePetProfile(id, { [field]: value }, parseInt(user.id, 10));
      
      // Update local state
      dispatch({ type: 'UPDATE_PET', payload: { id, updates: { [field]: value } } });
      
      // Trigger bidirectional sync if available (for now, we'll need to check sync metadata)
      // TODO: Add supabase_id field to local database schema
      const pet = await databaseService.getPetById(id, parseInt(user.id, 10));
      // For now, we'll rely on sync metadata to find the supabase pet ID
      // This will be improved when we add the field to the database schema
      console.log(`Field update completed for pet ${id}: ${field} = ${value}`);
    } catch (error) {
      console.error('Update pet profile field error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update pet profile field';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [user]);

  const startRealTimeSync = useCallback(async (localPetId: number, supabasePetId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to start real-time sync');
    }

    try {
      dispatch({ type: 'CLEAR_ERROR' });
      console.log(`🔄 Starting real-time sync for pet ${localPetId} -> ${supabasePetId}`);
      
      await bidirectionalSyncService.startRealTimeSync(localPetId, supabasePetId);
    } catch (error) {
      console.error('Start real-time sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start real-time sync';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [user]);

  const stopRealTimeSync = useCallback((): void => {
    console.log('⏹️ Stopping real-time sync');
    bidirectionalSyncService.stopRealTimeSync();
  }, []);

  const performFullSync = useCallback(async (localPetId: number, supabasePetId: string): Promise<SyncResult> => {
    if (!user) {
      throw new Error('User must be authenticated to perform full sync');
    }

    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      console.log(`🔄 Performing full sync for pet ${localPetId} -> ${supabasePetId}`);
      
      const result = await bidirectionalSyncService.performFullSync(
        localPetId, 
        supabasePetId, 
        user.id
      );

      if (result.success) {
        // Reload pets to reflect sync changes
        await loadPets();
        console.log(`✅ Full sync completed: ${result.fieldsUpdated.length} fields updated`);
      }

      return result;
    } catch (error) {
      console.error('Perform full sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform full sync';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, [user, loadPets]);

  // Load pets when user changes
  React.useEffect(() => {
    if (isAuthenticated && user) {
      loadPets();
      getSyncStatus(); // Check sync status when user loads
    } else {
      dispatch({ type: 'SET_PETS', payload: [] });
      resetProfile();
    }
  }, [isAuthenticated, user, loadPets, getSyncStatus]);

  // Check for pending syncs when app becomes active
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const checkPendingSyncs = async () => {
        const status = await supabaseSyncService.getSyncStatus();
        if (status.hasPendingSync) {
          console.log('Pending syncs detected, will retry automatically');
          // Could auto-retry here or show user notification
        }
      };
      checkPendingSyncs();
    }
  }, [isAuthenticated, user]);

  const contextValue: PetProfileContextType = {
    // State
    profile: state.profile,
    pets: state.pets,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    isSyncing: state.isSyncing,
    error: state.error,
    syncStatus: state.syncStatus,

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
    savePetProfileWithSync,
    updatePetProfile,
    updatePetProfileField,
    deletePet,
    loadPets,
    loadPetById,

    // Supabase sync operations
    syncPetToSupabase,
    retryPendingSyncs,
    getSyncStatus,

    // Enhanced sync operations
    startRealTimeSync,
    stopRealTimeSync,
    performFullSync,

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