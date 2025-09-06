import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { ApiClient } from '../services/ApiClient';
import { OfflineDataLayer } from '../services/OfflineDataLayer';
import { OfflineManager, OfflineManagerConfig } from '../services/OfflineManager';
import { OfflineSyncEngine, ConflictResolution } from '../services/OfflineSyncEngine';
import { PriorityLostPetService } from '../services/PriorityLostPetService';

interface OfflineContextValue {
  // Manager and Services
  manager: OfflineManager | null;
  dataLayer: OfflineDataLayer | null;
  lostPetService: PriorityLostPetService | null;
  syncEngine: OfflineSyncEngine | null;

  // State
  isInitialized: boolean;
  isInitializing: boolean;
  initializationError: string | null;

  // Sync State
  isSyncing: boolean;
  syncProgress: {
    total: number;
    completed: number;
    failed: number;
    current: string;
    percentage: number;
    estimatedTimeRemaining: number;
  } | null;

  // Conflicts
  conflicts: ConflictResolution[];
  resolveConflict: (conflictId: string, resolution: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE', mergedData?: any) => Promise<void>;

  // Network State
  networkState: {
    isConnected: boolean;
    type: string;
    isWifiEnabled: boolean;
    canSync: boolean;
  };

  // Actions
  forceSync: () => Promise<void>;
  pauseSync: () => void;
  resumeSync: () => void;
  clearCache: () => Promise<void>;
  exportData: () => Promise<any>;
  getStatus: () => Promise<any>;
  updateSettings: (settings: Partial<OfflineManagerConfig>) => Promise<void>;

  // Utilities
  isReady: boolean;
  healthCheck: () => Promise<any>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

interface OfflineProviderProps {
  children: ReactNode;
  apiClient: ApiClient;
  config?: Partial<OfflineManagerConfig>;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({
  children,
  apiClient,
  config
}) => {
  const [manager, setManager] = useState<OfflineManager | null>(null);
  const [dataLayer, setDataLayer] = useState<OfflineDataLayer | null>(null);
  const [lostPetService, setLostPetService] = useState<PriorityLostPetService | null>(null);
  const [syncEngine, setSyncEngine] = useState<OfflineSyncEngine | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<any>(null);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  
  const [networkState, setNetworkState] = useState({
    isConnected: false,
    type: 'none',
    isWifiEnabled: false,
    canSync: false
  });

  // Initialize offline manager
  useEffect(() => {
    const initializeManager = async () => {
      if (manager || isInitializing) return;

      setIsInitializing(true);
      setInitializationError(null);

      try {
        const newManager = new OfflineManager(apiClient, config);
        
        // Set up event listeners before initialization
        setupManagerEventListeners(newManager);

        await newManager.initialize();

        setManager(newManager);
        setDataLayer(newManager.getDataLayer());
        setLostPetService(newManager.getLostPetService());
        setSyncEngine(newManager.getSyncEngine());
        setIsInitialized(true);

      } catch (error) {
        console.error('Failed to initialize offline manager:', error);
        setInitializationError(error instanceof Error ? error.message : 'Initialization failed');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeManager();
  }, [apiClient, config, isInitializing, manager]); // Only run when these change

  // Set up event listeners for the manager
  const setupManagerEventListeners = (offlineManager: OfflineManager) => {
    // Sync events
    offlineManager.on('syncStarted', () => {
      setIsSyncing(true);
      setSyncProgress(null);
    });

    offlineManager.on('syncProgress', (progress) => {
      setSyncProgress(progress);
    });

    offlineManager.on('syncCompleted', (progress) => {
      setIsSyncing(false);
      setSyncProgress(progress);
      setTimeout(() => setSyncProgress(null), 3000); // Clear after 3 seconds
    });

    offlineManager.on('syncFailed', (error) => {
      setIsSyncing(false);
      setSyncProgress(null);
      console.error('Sync failed:', error);
    });

    // Conflict events
    offlineManager.on('conflictsDetected', (detectedConflicts) => {
      setConflicts(detectedConflicts);
    });

    // Network events
    offlineManager.on('networkStateChanged', (state) => {
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type,
        isWifiEnabled: state.isWifiEnabled,
        canSync: state.isConnected && state.isInternetReachable !== false
      });
    });

    // Connection restored event
    offlineManager.on('connectionRestored', () => {
      console.log('Connection restored, sync will begin automatically');
    });
  };

  // Action functions
  const forceSync = async () => {
    if (!manager) throw new Error('Offline manager not initialized');
    await manager.forceSync();
  };

  const pauseSync = () => {
    if (manager) manager.pauseSync();
  };

  const resumeSync = () => {
    if (manager) manager.resumeSync();
  };

  const clearCache = async () => {
    if (!manager) throw new Error('Offline manager not initialized');
    await manager.clearCache();
  };

  const exportData = async () => {
    if (!manager) throw new Error('Offline manager not initialized');
    return await manager.exportData();
  };

  const getStatus = async () => {
    if (!manager) throw new Error('Offline manager not initialized');
    return await manager.getStatus();
  };

  const updateSettings = async (settings: Partial<OfflineManagerConfig>) => {
    if (!manager) throw new Error('Offline manager not initialized');
    await manager.updateSettings(settings);
  };

  const resolveConflict = async (
    conflictId: string, 
    resolution: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE', 
    mergedData?: any
  ) => {
    if (!manager) throw new Error('Offline manager not initialized');
    await manager.resolveConflict(conflictId, resolution, mergedData);
    
    // Remove resolved conflict from state
    setConflicts(prev => prev.filter(c => c.recordId !== conflictId));
  };

  const healthCheck = async () => {
    if (!manager) throw new Error('Offline manager not initialized');
    return await manager.healthCheck();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (manager) {
        manager.destroy().catch(console.error);
      }
    };
  }, [manager]);

  const contextValue: OfflineContextValue = {
    // Manager and Services
    manager,
    dataLayer,
    lostPetService,
    syncEngine,

    // State
    isInitialized,
    isInitializing,
    initializationError,

    // Sync State
    isSyncing,
    syncProgress,

    // Conflicts
    conflicts,
    resolveConflict,

    // Network State
    networkState,

    // Actions
    forceSync,
    pauseSync,
    resumeSync,
    clearCache,
    exportData,
    getStatus,
    updateSettings,

    // Utilities
    isReady: isInitialized && manager?.isReady() === true,
    healthCheck,
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
};

// Hook to use the offline context
export const useOffline = (): OfflineContextValue => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

// Specialized hooks for common use cases

export const useOfflineSync = () => {
  const { 
    isSyncing, 
    syncProgress, 
    forceSync, 
    pauseSync, 
    resumeSync, 
    networkState,
    conflicts,
    resolveConflict 
  } = useOffline();

  return {
    isSyncing,
    syncProgress,
    forceSync,
    pauseSync,
    resumeSync,
    canSync: networkState.canSync,
    hasConflicts: conflicts.length > 0,
    conflicts,
    resolveConflict,
  };
};

export const useOfflinePets = () => {
  const { dataLayer, isReady } = useOffline();

  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPets = useCallback(async () => {
    if (!isReady || !dataLayer) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const petsData = await dataLayer.getAllPets();
      setPets(petsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pets');
    } finally {
      setLoading(false);
    }
  }, [isReady, dataLayer]);

  const createPet = async (petData: any) => {
    if (!isReady || !dataLayer) throw new Error('Offline not ready');
    return await dataLayer.createPet(petData);
  };

  const updatePet = async (id: string, updates: any) => {
    if (!isReady || !dataLayer) throw new Error('Offline not ready');
    await dataLayer.updatePet(id, updates);
  };

  const deletePet = async (id: string) => {
    if (!isReady || !dataLayer) throw new Error('Offline not ready');
    await dataLayer.deletePet(id);
  };

  useEffect(() => {
    if (isReady) {
      loadPets();
    }
  }, [isReady, loadPets]);

  // Listen for pet events
  useEffect(() => {
    if (!dataLayer) return;

    const handlePetCreated = (pet: any) => {
      setPets(prev => [pet, ...prev]);
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

  return {
    pets,
    loading,
    error,
    loadPets,
    createPet,
    updatePet,
    deletePet,
    isReady,
  };
};

export const useOfflineLostPets = () => {
  const { lostPetService, isReady } = useOffline();

  const createLostPetReport = async (petId: string, reportData: any) => {
    if (!isReady || !lostPetService) throw new Error('Offline not ready');
    return await lostPetService.createLostPetReport(petId, reportData);
  };

  const updateLostPetStatus = async (reportId: string, status: any, notes?: string) => {
    if (!isReady || !lostPetService) throw new Error('Offline not ready');
    await lostPetService.updateLostPetReportStatus(reportId, status, notes);
  };

  const reportSighting = async (reportId: string, sightingData: any) => {
    if (!isReady || !lostPetService) throw new Error('Offline not ready');
    return await lostPetService.reportSighting(reportId, sightingData);
  };

  const getNearbyAlerts = async (location: any, radius?: number) => {
    if (!isReady || !lostPetService) throw new Error('Offline not ready');
    return await lostPetService.getNearbyLostPetAlerts(location, radius);
  };

  const addEmergencyContact = async (contact: any) => {
    if (!isReady || !lostPetService) throw new Error('Offline not ready');
    return await lostPetService.addEmergencyContact(contact);
  };

  const getEmergencyContacts = async () => {
    if (!isReady || !lostPetService) return [];
    return await lostPetService.getEmergencyContacts();
  };

  return {
    createLostPetReport,
    updateLostPetStatus,
    reportSighting,
    getNearbyAlerts,
    addEmergencyContact,
    getEmergencyContacts,
    isReady,
  };
};

export const useOfflineStatus = () => {
  const { 
    isInitialized, 
    isInitializing, 
    initializationError, 
    isReady, 
    networkState,
    getStatus,
    healthCheck 
  } = useOffline();

  const [status, setStatus] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);

  const refreshStatus = useCallback(async () => {
    if (isReady) {
      try {
        const [statusData, healthData] = await Promise.all([
          getStatus(),
          healthCheck()
        ]);
        setStatus(statusData);
        setHealth(healthData);
      } catch (error) {
        console.error('Failed to refresh status:', error);
      }
    }
  }, [isReady, getStatus, healthCheck]);

  useEffect(() => {
    if (isReady) {
      refreshStatus();
      // Refresh every 30 seconds
      const interval = setInterval(refreshStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isReady, refreshStatus]);

  return {
    isInitialized,
    isInitializing,
    initializationError,
    isReady,
    networkState,
    status,
    health,
    refreshStatus,
  };
};