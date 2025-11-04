/**
 * DataSyncContext - Data synchronization state management
 */

import React, { createContext, useContext, ReactNode } from 'react';

interface DataSyncContextType {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  syncData: () => Promise<void>;
  forcSync: () => Promise<void>;
  getFieldValue: (fieldName: string) => any;
  setFieldValue: (fieldName: string, value: any) => void;
  isLoading: boolean;
  lastSync: Date | null;
  updateUserData: (data: any) => Promise<void>;
  updatePetData: (data: any) => Promise<void>;
  updateMedicalData: (data: any) => Promise<void>;
}

const DataSyncContext = createContext<DataSyncContextType | undefined>(
  undefined
);

interface DataSyncProviderProps {
  children: ReactNode;
}

export const DataSyncProvider: React.FC<DataSyncProviderProps> = ({
  children,
}) => {
  const value: DataSyncContextType = {
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    syncData: async () => {},
    forcSync: async () => {},
    getFieldValue: (fieldName: string) => null,
    setFieldValue: (fieldName: string, value: any) => {},
    isLoading: false,
    lastSync: null,
    updateUserData: async (data: any) => {},
    updatePetData: async (data: any) => {},
    updateMedicalData: async (data: any) => {},
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
};

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (context === undefined) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};

export const useAutoPopulateField = (fieldName: string, contextParam?: any) => {
  const context = useDataSync();
  const value = context.getFieldValue(fieldName);
  return {
    value,
    setValue: (value: any) => context.setFieldValue(fieldName, value),
    isLoading: context.isLoading,
    hasValue: value !== null && value !== undefined && value !== '',
  };
};

// Alias for compatibility
export const usePetDataSync = useDataSync;

export { DataSyncContext };
