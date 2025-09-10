import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { databaseService } from '../services/databaseService';

// Overlapping field mappings identified across all screens
interface SharedPetData {
  // Basic Pet Information (used in AddPetModal, EditPetScreen, PetProfileScreen, QRCodeShareScreen, LostPetAlert)
  id?: string;
  name: string;
  species: string;
  breed?: string;
  color?: string;
  weight?: number;
  birth_date?: string;
  microchip_id?: string;
  photo_url?: string;
  
  // Health Information (used in EditPetScreen, MedicalRecordsScreen, AddMedicalRecordScreen)
  medical_conditions?: string[];
  dietary_restrictions?: string[];
  
  // Emergency Information (used in ReportLostPetScreen, LostPetAlertScreen, QRCodeShareScreen)
  is_lost?: boolean;
  last_seen_location?: string;
  last_seen_date?: string;
}

interface SharedUserData {
  // Contact Information (used in ProfileSettingsScreen, QRCodeShareScreen, ReportLostPetScreen)
  full_name?: string;
  email?: string;
  phone?: string;
  
  // Location Information (used in ProfileSettingsScreen, ReportLostPetScreen, LostPetAlert)
  location?: string;
  
  // Emergency Contacts (used in ProfileSettingsScreen, QRCodeShareScreen, ReportLostPetScreen)
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  
  // Veterinary Information (used in ProfileSettingsScreen, AddMedicalRecordScreen, AddVaccinationScreen)
  preferred_vet_clinic?: string;
}

interface SharedMedicalData {
  // Veterinarian Information (used in AddMedicalRecordScreen, AddVaccinationScreen, MedicalRecordsScreen, VaccinationListScreen)
  veterinarian?: string;
  
  // Medical Notes (used in AddMedicalRecordScreen, AddVaccinationScreen)
  notes?: string;
  
  // Date Information (used in all medical screens)
  date?: string;
}

interface DataSyncContextType {
  sharedPetData: SharedPetData;
  sharedUserData: SharedUserData;
  sharedMedicalData: SharedMedicalData;
  
  // Pet data methods
  updatePetData: (petId: string, data: Partial<SharedPetData>) => void;
  getPetData: (petId: string) => SharedPetData | null;
  loadPetData: (petId: string) => Promise<void>;
  
  // User data methods
  updateUserData: (data: Partial<SharedUserData>) => void;
  loadUserData: () => Promise<void>;
  
  // Medical data methods
  updateMedicalData: (data: Partial<SharedMedicalData>) => void;
  
  // Auto-population methods
  getFieldValue: (fieldPath: string, context?: 'pet' | 'user' | 'medical') => any;
  setFieldValue: (fieldPath: string, value: any, context?: 'pet' | 'user' | 'medical') => void;
  
  // Synchronization status
  isLoading: boolean;
  lastSync: Date | null;
}

const DataSyncContext = createContext<DataSyncContextType | null>(null);

interface DataSyncProviderProps {
  children: React.ReactNode;
}

export const DataSyncProvider: React.FC<DataSyncProviderProps> = ({ children }) => {
  const [sharedPetData, setSharedPetData] = useState<SharedPetData>({
    name: '',
    species: '',
  });
  
  const [sharedUserData, setSharedUserData] = useState<SharedUserData>({});
  const [sharedMedicalData, setSharedMedicalData] = useState<SharedMedicalData>({});
  const [petDataCache, setPetDataCache] = useState<Map<string, SharedPetData>>(new Map());
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get current user from database service
      const user = await databaseService.getUserByAuthId('current'); // This would need to be implemented
      if (user) {
        const userData: SharedUserData = {
          full_name: user.full_name,
          email: user.email,
          phone: (user as any).phone || '',
          location: (user as any).location || '',
          emergency_contact_name: (user as any).emergency_contact_name || '',
          emergency_contact_phone: (user as any).emergency_contact_phone || '',
          preferred_vet_clinic: (user as any).preferred_vet_clinic || '',
        };
        
        setSharedUserData(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user data on context initialization
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const updatePetData = useCallback((petId: string, data: Partial<SharedPetData>) => {
    setPetDataCache(prev => {
      const newCache = new Map(prev);
      const existingData = newCache.get(petId) || { name: '', species: '' };
      newCache.set(petId, { ...existingData, ...data, id: petId });
      return newCache;
    });
    
    // Update current shared data if it's the same pet
    if (sharedPetData.id === petId) {
      setSharedPetData(prev => ({ ...prev, ...data }));
    }
    
    setLastSync(new Date());
  }, [sharedPetData.id]);

  const getPetData = useCallback((petId: string): SharedPetData | null => {
    return petDataCache.get(petId) || null;
  }, [petDataCache]);

  const loadPetData = useCallback(async (petId: string) => {
    setIsLoading(true);
    try {
      const pet = await databaseService.getPetById(petId);
      if (pet) {
        const petData: SharedPetData = {
          id: petId,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          color: pet.color,
          weight: pet.weight_kg,
          birth_date: pet.date_of_birth,
          microchip_id: pet.microchip_number,
          photo_url: pet.profile_photo_url,
          medical_conditions: pet.allergies ? [pet.allergies] : undefined,
          dietary_restrictions: pet.special_needs ? [pet.special_needs] : undefined,
          is_lost: pet.status === 'lost',
        };
        
        updatePetData(petId, petData);
        setSharedPetData(petData);
      }
    } catch (error) {
      console.error('Error loading pet data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [updatePetData]);

  const updateUserData = useCallback((data: Partial<SharedUserData>) => {
    setSharedUserData(prev => ({ ...prev, ...data }));
    setLastSync(new Date());
  }, []);

  const updateMedicalData = useCallback((data: Partial<SharedMedicalData>) => {
    setSharedMedicalData(prev => ({ ...prev, ...data }));
    setLastSync(new Date());
  }, []);

  // Advanced field access methods
  const getFieldValue = useCallback((fieldPath: string, context: 'pet' | 'user' | 'medical' = 'pet'): any => {
    const pathParts = fieldPath.split('.');
    let data: any;
    
    switch (context) {
      case 'pet':
        data = sharedPetData;
        break;
      case 'user':
        data = sharedUserData;
        break;
      case 'medical':
        data = sharedMedicalData;
        break;
      default:
        data = sharedPetData;
    }
    
    // Navigate through nested path
    let value = data;
    for (const part of pathParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }, [sharedPetData, sharedUserData, sharedMedicalData]);

  const setFieldValue = useCallback((fieldPath: string, value: any, context: 'pet' | 'user' | 'medical' = 'pet') => {
    const pathParts = fieldPath.split('.');
    
    switch (context) {
      case 'pet':
        if (pathParts.length === 1) {
          const updatedData = { [pathParts[0]]: value };
          setSharedPetData(prev => ({ ...prev, ...updatedData }));
          if (sharedPetData.id) {
            updatePetData(sharedPetData.id, updatedData);
          }
        }
        break;
      case 'user':
        if (pathParts.length === 1) {
          updateUserData({ [pathParts[0]]: value });
        }
        break;
      case 'medical':
        if (pathParts.length === 1) {
          updateMedicalData({ [pathParts[0]]: value });
        }
        break;
    }
  }, [sharedPetData, updatePetData, updateUserData, updateMedicalData]);

  const value: DataSyncContextType = {
    sharedPetData,
    sharedUserData,
    sharedMedicalData,
    updatePetData,
    getPetData,
    loadPetData,
    updateUserData,
    loadUserData,
    updateMedicalData,
    getFieldValue,
    setFieldValue,
    isLoading,
    lastSync,
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
};

export const useDataSync = (): DataSyncContextType => {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};

// Hook for auto-populating form fields
export const useAutoPopulateField = (fieldPath: string, context?: 'pet' | 'user' | 'medical') => {
  const { getFieldValue, setFieldValue, isLoading } = useDataSync();
  
  const value = getFieldValue(fieldPath, context);
  const setValue = useCallback((newValue: any) => {
    setFieldValue(fieldPath, newValue, context);
  }, [fieldPath, context, setFieldValue]);
  
  return {
    value: value || '',
    setValue,
    isLoading,
    hasValue: value !== undefined && value !== null && value !== '',
  };
};

// Hook for syncing specific pet data
export const usePetDataSync = (petId?: string) => {
  const { loadPetData, getPetData, updatePetData, sharedPetData } = useDataSync();
  
  useEffect(() => {
    if (petId && petId !== sharedPetData.id) {
      loadPetData(petId);
    }
  }, [petId, loadPetData, sharedPetData.id]);
  
  const petData = petId ? getPetData(petId) : sharedPetData;
  
  return {
    petData,
    updatePetData: useCallback((data: Partial<SharedPetData>) => {
      if (petId) {
        updatePetData(petId, data);
      }
    }, [petId, updatePetData]),
    isLoading: false, // This would come from the main context
  };
};

export default DataSyncProvider;