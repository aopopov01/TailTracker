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
  lastSyncTime: string | null;
  syncInProgress: boolean;
  pendingUpdates: number;
  cacheSize: number;
  storageUsage: {
    totalKeys: number;
    cacheKeys: number;
    queueItems: number;
    estimatedSizeKB: number;
  };
}

export const useOfflineData = (
  dataLayer: OfflineDataLayer,
  config: Partial<OfflineDataConfig> = {}
) => {
  const { networkStatus } = useNetworkStatus();
  const [state, setState] = useState<OfflineDataState>({
    isLoading: false,
    error: null,
    lastSyncTime: null,
    syncInProgress: false,
    pendingUpdates: 0,
    cacheSize: 0,
    storageUsage: {
      totalKeys: 0,
      cacheKeys: 0,
      queueItems: 0,
      estimatedSizeKB: 0,
    },
  });
  
  const configRef = useRef<OfflineDataConfig>({
    enableOptimisticUpdates: true,
    enableRealTimeUpdates: true,
    cacheSize: 100,
    syncOnConnectionRestore: true,
    ...config,
  });

  // Update state from data layer using actual available methods
  const updateState = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const [lastSyncTime, queue, storageUsage] = await Promise.all([
        dataLayer.getLastSyncTimestamp(),
        dataLayer.getOfflineQueue(),
        dataLayer.getStorageUsage(),
      ]);

      setState(prev => ({
        ...prev,
        isLoading: false,
        lastSyncTime,
        syncInProgress: false, // Default to false since we don't have sync status
        pendingUpdates: queue.filter(item => item.syncStatus === 'pending').length,
        cacheSize: storageUsage.cacheKeys,
        storageUsage,
      }));
    } catch (error) {
      console.warn('Failed to update offline data state:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to update state' 
      }));
    }
  }, [dataLayer]);

  // Clean up expired cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dataLayer.clearExpiredCache().catch(console.error);
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => clearInterval(interval);
  }, [dataLayer]);

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
          updateState();
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [networkStatus.isConnected, networkStatus.canSync, state.pendingUpdates, updateState]);

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

// Hook for pet data operations using actual OfflineDataLayer methods
export const usePetData = (dataLayer: OfflineDataLayer, userId?: number) => {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state } = useOfflineData(dataLayer);

  // Load all pets from cache
  const loadPets = useCallback(async (useCache = true) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let petsData = null;
      if (useCache) {
        petsData = await dataLayer.getCachedPets(userId);
      }
      
      if (petsData) {
        setPets(petsData);
      } else {
        setPets([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pets');
    } finally {
      setLoading(false);
    }
  }, [dataLayer, userId]);

  // Create pet with offline queue support
  const createPet = useCallback(async (petData: any) => {
    setError(null);
    
    try {
      // Add to offline queue
      await dataLayer.addToOfflineQueue({
        type: 'pet',
        data: petData,
        syncStatus: 'pending',
        action: 'create',
      });
      
      // Optimistically update local state
      const newPet = { 
        ...petData, 
        id: `temp_${Date.now()}`, 
        createdAt: new Date().toISOString() 
      };
      setPets(prev => [newPet, ...prev]);
      
      return newPet.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pet');
      throw err;
    }
  }, [dataLayer]);

  // Update pet with offline queue support
  const updatePet = useCallback(async (id: string, updates: any) => {
    setError(null);
    
    try {
      // Add to offline queue
      await dataLayer.addToOfflineQueue({
        type: 'pet',
        data: { id, ...updates },
        syncStatus: 'pending',
        action: 'update',
      });
      
      // Optimistically update local state
      setPets(prev => prev.map(pet => 
        pet.id === id ? { ...pet, ...updates, updatedAt: new Date().toISOString() } : pet
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pet');
      throw err;
    }
  }, [dataLayer]);

  // Delete pet with offline queue support
  const deletePet = useCallback(async (id: string) => {
    setError(null);
    
    try {
      // Add to offline queue
      await dataLayer.addToOfflineQueue({
        type: 'pet',
        data: { id },
        syncStatus: 'pending',
        action: 'delete',
      });
      
      // Optimistically remove from local state
      setPets(prev => prev.filter(pet => pet.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pet');
      throw err;
    }
  }, [dataLayer]);

  // Get single pet from cache
  const getPet = useCallback(async (id: number) => {
    try {
      return await dataLayer.getCachedPet(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get pet');
      throw err;
    }
  }, [dataLayer]);

  // Cache pets helper
  const cachePets = useCallback(async (petsData: any[]) => {
    if (userId) {
      await dataLayer.cachePets(userId, petsData);
      setPets(petsData);
    }
  }, [dataLayer, userId]);

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
    cachePets,
    syncState: state,
  };
};

// Hook for health records using cache and offline queue
export const useHealthRecords = (dataLayer: OfflineDataLayer, petId?: number) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load health records for pet from cache
  const loadRecords = useCallback(async () => {
    if (!petId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to get cached records (this would need to be implemented in a real app)
      const recordsData = await dataLayer.getCache<any[]>(`health_records_${petId}`);
      setRecords(recordsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health records');
    } finally {
      setLoading(false);
    }
  }, [dataLayer, petId]);

  // Create health record with offline queue support
  const createRecord = useCallback(async (recordData: any) => {
    if (!petId) throw new Error('Pet ID required');
    
    setError(null);
    
    try {
      // Add to offline queue
      await dataLayer.addToOfflineQueue({
        type: 'health_record' as any, // Extended type
        data: { ...recordData, petId },
        syncStatus: 'pending',
        action: 'create',
      });
      
      // Optimistically update local state
      const newRecord = { 
        ...recordData, 
        id: `temp_${Date.now()}`, 
        petId, 
        createdAt: new Date().toISOString() 
      };
      setRecords(prev => [newRecord, ...prev]);
      
      return newRecord.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create health record');
      throw err;
    }
  }, [dataLayer, petId]);

  // Cache health records helper
  const cacheRecords = useCallback(async (recordsData: any[]) => {
    if (petId) {
      await dataLayer.setCache(`health_records_${petId}`, recordsData);
      setRecords(recordsData);
    }
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
    cacheRecords,
  };
};

// Hook for lost pet reports using cache and offline queue
export const useLostPetReports = (dataLayer: OfflineDataLayer) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { networkStatus } = useNetworkStatus();

  // Create lost pet report with immediate offline queue storage
  const createLostPetReport = useCallback(async (petId: string, reportData: any) => {
    setError(null);
    
    try {
      // Add to offline queue with high priority
      await dataLayer.addToOfflineQueue({
        type: 'lost_pet_report' as any, // Extended type
        data: { ...reportData, petId },
        syncStatus: 'pending',
        action: 'create',
      });
      
      // Optimistically add to state
      const newReport = { 
        ...reportData, 
        id: `temp_${Date.now()}`,
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
      
      return newReport.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lost pet report');
      throw err;
    }
  }, [dataLayer, networkStatus]);

  // Load reports from cache
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const cachedReports = await dataLayer.getCache<any[]>('lost_pet_reports');
      setReports(cachedReports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [dataLayer]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return {
    reports,
    loading,
    error,
    createLostPetReport,
    loadReports,
  };
};

// Hook for cache-based data management
export const useDataManagement = (dataLayer: OfflineDataLayer) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await dataLayer.exportOfflineData();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataLayer]);

  const importData = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      await dataLayer.importOfflineData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataLayer]);

  const clearCache = useCallback(async () => {
    try {
      await dataLayer.clearAllCache();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
      throw err;
    }
  }, [dataLayer]);

  const clearOfflineData = useCallback(async () => {
    try {
      await dataLayer.clearOfflineQueue();
      await dataLayer.clearAllCache();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear offline data');
      throw err;
    }
  }, [dataLayer]);

  const getStorageUsage = useCallback(async () => {
    try {
      return await dataLayer.getStorageUsage();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get storage usage');
      throw err;
    }
  }, [dataLayer]);

  const cleanupStorage = useCallback(async (options?: {
    clearExpiredCache?: boolean;
    clearFailedQueueItems?: boolean;
    maxQueueAge?: number;
  }) => {
    try {
      await dataLayer.cleanupStorage(options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup storage');
      throw err;
    }
  }, [dataLayer]);

  return {
    loading,
    error,
    exportData,
    importData,
    clearCache,
    clearOfflineData,
    getStorageUsage,
    cleanupStorage,
  };
};