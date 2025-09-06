import { useState, useEffect, useCallback, useRef } from 'react';
import { OfflineDataLayer } from '../services/OfflineDataLayer';
import { useNetworkStatus } from './useNetworkStatus';

export interface OfflineDataConfig {
  enableOptimisticUpdates: boolean;
  enableRealTimeUpdates: boolean;
  cacheSize: number;
  syncOnConnectionRestore: boolean;
}

export interface OfflineDataState {
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number;
  syncInProgress: boolean;
  pendingUpdates: number;
  cacheSize: number;
}

export const useOfflineData = (
  dataLayer: OfflineDataLayer,
  config: Partial<OfflineDataConfig> = {}
) => {
  const { networkStatus } = useNetworkStatus();
  const [state, setState] = useState<OfflineDataState>({
    isLoading: false,
    error: null,
    lastSyncTime: 0,
    syncInProgress: false,
    pendingUpdates: 0,
    cacheSize: 0,
  });
  
  const configRef = useRef<OfflineDataConfig>({
    enableOptimisticUpdates: true,
    enableRealTimeUpdates: true,
    cacheSize: 100,
    syncOnConnectionRestore: true,
    ...config,
  });

  // Update state from data layer
  const updateState = useCallback(async () => {
    try {
      const status = await dataLayer.getStatus();
      setState(prev => ({
        ...prev,
        lastSyncTime: status.lastSyncTime,
        syncInProgress: status.syncInProgress,
        pendingUpdates: status.pendingUpdates,
        cacheSize: status.cacheSize,
      }));
    } catch (error) {
      console.warn('Failed to update offline data state:', error);
    }
  }, [dataLayer]);

  // Setup data layer event listeners
  useEffect(() => {
    const handleSyncStarted = () => {
      setState(prev => ({ ...prev, syncInProgress: true, error: null }));
    };

    const handleSyncCompleted = () => {
      setState(prev => ({ ...prev, syncInProgress: false, error: null }));
      updateState();
    };

    const handleSyncFailed = (error: any) => {
      setState(prev => ({ 
        ...prev, 
        syncInProgress: false, 
        error: error.message || 'Sync failed' 
      }));
    };

    const handleOptimisticUpdate = () => {
      updateState();
    };

    dataLayer.on('syncStarted', handleSyncStarted);
    dataLayer.on('syncCompleted', handleSyncCompleted);
    dataLayer.on('syncFailed', handleSyncFailed);
    dataLayer.on('optimisticUpdateApplied', handleOptimisticUpdate);
    dataLayer.on('optimisticUpdateSynced', handleOptimisticUpdate);

    return () => {
      dataLayer.off('syncStarted', handleSyncStarted);
      dataLayer.off('syncCompleted', handleSyncCompleted);
      dataLayer.off('syncFailed', handleSyncFailed);
      dataLayer.off('optimisticUpdateApplied', handleOptimisticUpdate);
      dataLayer.off('optimisticUpdateSynced', handleOptimisticUpdate);
    };
  }, [dataLayer, updateState]);

  // Sync on connection restore
  useEffect(() => {
    if (
      configRef.current.syncOnConnectionRestore && 
      networkStatus.isConnected && 
      networkStatus.canSync
    ) {
      // Small delay to allow connection to stabilize
      const timer = setTimeout(() => {
        if (state.pendingUpdates > 0) {
          console.log('Connection restored, triggering sync...');
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [networkStatus.isConnected, networkStatus.canSync, state.pendingUpdates, configRef]);

  // Initial state update
  useEffect(() => {
    updateState();
  }, [updateState]);

  return {
    state,
    updateState,
    networkStatus,
  };
};

// Hook for pet data operations
export const usePetData = (dataLayer: OfflineDataLayer) => {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state } = useOfflineData(dataLayer);

  // Load all pets
  const loadPets = useCallback(async (useCache = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const petsData = await dataLayer.getAllPets({ useCache });
      setPets(petsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pets');
    } finally {
      setLoading(false);
    }
  }, [dataLayer]);

  // Create pet with optimistic update
  const createPet = useCallback(async (petData: any) => {
    setError(null);
    
    try {
      const id = await dataLayer.createPet(petData);
      
      // Optimistically update local state
      const newPet = { ...petData, id, createdAt: new Date().toISOString() };
      setPets(prev => [newPet, ...prev]);
      
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pet');
      throw err;
    }
  }, [dataLayer]);

  // Update pet with optimistic update
  const updatePet = useCallback(async (id: string, updates: any) => {
    setError(null);
    
    try {
      // Optimistically update local state
      setPets(prev => prev.map(pet => 
        pet.id === id ? { ...pet, ...updates, updatedAt: new Date().toISOString() } : pet
      ));
      
      await dataLayer.updatePet(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pet');
      // Rollback optimistic update by reloading
      loadPets(false);
      throw err;
    }
  }, [dataLayer, loadPets]);

  // Delete pet with optimistic update
  const deletePet = useCallback(async (id: string) => {
    setError(null);
    
    try {
      // Optimistically remove from local state
      setPets(prev => prev.filter(pet => pet.id !== id));
      
      await dataLayer.deletePet(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pet');
      // Rollback optimistic update by reloading
      loadPets(false);
      throw err;
    }
  }, [dataLayer, loadPets]);

  // Get single pet
  const getPet = useCallback(async (id: string, useCache = true) => {
    try {
      return await dataLayer.getPet(id, { useCache });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get pet');
      throw err;
    }
  }, [dataLayer]);

  // Listen for data layer events
  useEffect(() => {
    const handlePetCreated = (pet: any) => {
      setPets(prev => {
        const exists = prev.some(p => p.id === pet.id);
        return exists ? prev : [pet, ...prev];
      });
    };

    const handlePetUpdated = (pet: any) => {
      setPets(prev => prev.map(p => p.id === pet.id ? pet : p));
    };

    const handlePetDeleted = ({ id }: { id: string }) => {
      setPets(prev => prev.filter(p => p.id !== id));
    };

    dataLayer.on('petCreated', handlePetCreated);
    dataLayer.on('petUpdated', handlePetUpdated);
    dataLayer.on('petDeleted', handlePetDeleted);

    return () => {
      dataLayer.off('petCreated', handlePetCreated);
      dataLayer.off('petUpdated', handlePetUpdated);
      dataLayer.off('petDeleted', handlePetDeleted);
    };
  }, [dataLayer]);

  // Initial load
  useEffect(() => {
    loadPets();
  }, [loadPets]);

  return {
    pets,
    loading: loading || state.isLoading,
    error,
    loadPets,
    createPet,
    updatePet,
    deletePet,
    getPet,
    syncState: state,
  };
};

// Hook for health records
export const useHealthRecords = (dataLayer: OfflineDataLayer, petId: string) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load health records for pet
  const loadRecords = useCallback(async (useCache = true) => {
    if (!petId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const recordsData = await dataLayer.getHealthRecords(petId, { useCache });
      setRecords(recordsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health records');
    } finally {
      setLoading(false);
    }
  }, [dataLayer, petId]);

  // Create health record
  const createRecord = useCallback(async (recordData: any) => {
    if (!petId) throw new Error('Pet ID required');
    
    setError(null);
    
    try {
      const id = await dataLayer.createHealthRecord(petId, recordData);
      
      // Optimistically update local state
      const newRecord = { ...recordData, id, petId, createdAt: new Date().toISOString() };
      setRecords(prev => [newRecord, ...prev]);
      
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create health record');
      throw err;
    }
  }, [dataLayer, petId]);

  // Listen for health record events
  useEffect(() => {
    const handleRecordCreated = (record: any) => {
      if (record.petId === petId) {
        setRecords(prev => {
          const exists = prev.some(r => r.id === record.id);
          return exists ? prev : [record, ...prev];
        });
      }
    };

    dataLayer.on('healthRecordCreated', handleRecordCreated);

    return () => {
      dataLayer.off('healthRecordCreated', handleRecordCreated);
    };
  }, [dataLayer, petId]);

  // Load records when petId changes
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return {
    records,
    loading,
    error,
    loadRecords,
    createRecord,
  };
};

// Hook for lost pet reports
export const useLostPetReports = (dataLayer: OfflineDataLayer) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { networkStatus } = useNetworkStatus();

  // Create lost pet report with immediate sync attempt
  const createLostPetReport = useCallback(async (petId: string, reportData: any) => {
    setError(null);
    
    try {
      const id = await dataLayer.createLostPetReport(petId, reportData);
      
      // Optimistically add to state
      const newReport = { 
        ...reportData, 
        id, 
        petId, 
        createdAt: new Date().toISOString(),
        status: 'ACTIVE',
        priority: 'CRITICAL'
      };
      setReports(prev => [newReport, ...prev]);
      
      // Show immediate feedback
      if (!networkStatus.isConnected) {
        console.log('Lost pet report saved offline. Will sync when connection is available.');
      } else if (!networkStatus.canSync) {
        console.log('Lost pet report created. Waiting for better connection to sync.');
      }
      
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lost pet report');
      throw err;
    }
  }, [dataLayer, networkStatus]);

  // Listen for lost pet report events
  useEffect(() => {
    const handleReportCreated = (report: any) => {
      setReports(prev => {
        const exists = prev.some(r => r.id === report.id);
        return exists ? prev : [report, ...prev];
      });
    };

    dataLayer.on('lostPetReportCreated', handleReportCreated);

    return () => {
      dataLayer.off('lostPetReportCreated', handleReportCreated);
    };
  }, [dataLayer]);

  return {
    reports,
    loading,
    error,
    createLostPetReport,
  };
};

// Hook for image operations
export const useImageData = (dataLayer: OfflineDataLayer) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save image with offline support
  const saveImage = useCallback(async (imageUri: string, metadata: any = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const id = await dataLayer.saveImage(imageUri, metadata);
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save image');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataLayer]);

  // Get image from offline storage
  const getImage = useCallback(async (id: string) => {
    try {
      return await dataLayer.getImage(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get image');
      throw err;
    }
  }, [dataLayer]);

  return {
    loading,
    error,
    saveImage,
    getImage,
  };
};

// Hook for batch operations
export const useBatchOperations = (dataLayer: OfflineDataLayer) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeBatch = useCallback(async (operations: (() => Promise<any>)[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await dataLayer.batch(operations);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch operation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataLayer]);

  return {
    loading,
    error,
    executeBatch,
  };
};

// Hook for data export/import
export const useDataManagement = (dataLayer: OfflineDataLayer) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await dataLayer.exportData();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataLayer]);

  const clearCache = useCallback(async () => {
    try {
      await dataLayer.clearCache();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
      throw err;
    }
  }, [dataLayer]);

  const clearOfflineData = useCallback(async () => {
    try {
      await dataLayer.clearOfflineData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear offline data');
      throw err;
    }
  }, [dataLayer]);

  return {
    loading,
    error,
    exportData,
    clearCache,
    clearOfflineData,
  };
};