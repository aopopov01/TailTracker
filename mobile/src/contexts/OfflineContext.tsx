import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { OfflineManager } from '../services/OfflineManager';
import { offlineDataLayer } from '../services/OfflineDataLayer';
import { PriorityLostPetService } from '../services/PriorityLostPetService';

interface OfflineContextValue {
  // Manager and Services
  manager: OfflineManager | null;
  dataLayer: any | null;
  lostPetService: PriorityLostPetService | null;

  // State
  isInitialized: boolean;
  isInitializing: boolean;
  initializationError: string | null;

  // Sync State
  isSyncing: boolean;

  // Network State
  networkState: {
    isConnected: boolean;
    type: string;
    isInternetReachable: boolean;
  };

  // Actions
  forceSync: () => Promise<void>;

  // Utilities
  isReady: boolean;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({
  children
}) => {
  const [manager, setManager] = useState<OfflineManager | null>(null);
  const [dataLayer, setDataLayer] = useState<any>(null);
  const [lostPetService, setLostPetService] = useState<PriorityLostPetService | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  
  const [networkState, setNetworkState] = useState({
    isConnected: false,
    type: 'none',
    isInternetReachable: false
  });

  // Initialize offline manager
  useEffect(() => {
    const initializeManager = async () => {
      if (manager || isInitializing) return;

      setIsInitializing(true);
      setInitializationError(null);

      try {
        const newManager = OfflineManager.getInstance();
        const lostPetServiceInstance = PriorityLostPetService.getInstance();

        setManager(newManager);
        setDataLayer(offlineDataLayer);
        setLostPetService(lostPetServiceInstance);
        setIsInitialized(true);

      } catch (error) {
        console.error('Failed to initialize offline manager:', error);
        setInitializationError(error instanceof Error ? error.message : 'Initialization failed');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeManager();
  }, [isInitializing, manager]);

  // Action functions
  const forceSync = async () => {
    if (!manager) throw new Error('Offline manager not initialized');
    try {
      setIsSyncing(true);
      await manager.syncOfflineQueue();
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const contextValue: OfflineContextValue = {
    // Manager and Services
    manager,
    dataLayer,
    lostPetService,

    // State
    isInitialized,
    isInitializing,
    initializationError,

    // Sync State
    isSyncing,

    // Network State
    networkState,

    // Actions
    forceSync,

    // Utilities
    isReady: isInitialized && manager !== null,
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
    forceSync, 
    networkState
  } = useOffline();

  return {
    isSyncing,
    forceSync,
    canSync: networkState.isConnected,
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
      // Use available method from OfflineDataLayer
      const petsData = await dataLayer.getPets();
      setPets(petsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pets');
    } finally {
      setLoading(false);
    }
  }, [isReady, dataLayer]);

  useEffect(() => {
    if (isReady) {
      loadPets();
    }
  }, [isReady, loadPets]);

  return {
    pets,
    loading,
    error,
    loadPets,
    isReady,
  };
};

export const useOfflineLostPets = () => {
  const { lostPetService, isReady } = useOffline();

  const getEmergencyContacts = async () => {
    if (!isReady || !lostPetService) return [];
    return await lostPetService.getEmergencyContacts();
  };

  return {
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
    networkState
  } = useOffline();

  return {
    isInitialized,
    isInitializing,
    initializationError,
    isReady,
    networkState,
  };
};