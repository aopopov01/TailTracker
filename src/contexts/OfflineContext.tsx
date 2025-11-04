/**
 * OfflineContext - Offline state management
 */

import React, { createContext, useContext, ReactNode } from 'react';

interface OfflineContextType {
  isOnline: boolean;
  isOfflineMode: boolean;
  pendingChanges: number;
  error: string | null;
  setOfflineMode: (enabled: boolean) => void;
  syncPendingChanges: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({
  children,
}) => {
  const value: OfflineContextType = {
    isOnline: true,
    isOfflineMode: false,
    pendingChanges: 0,
    error: null,
    setOfflineMode: () => {},
    syncPendingChanges: async () => {},
  };

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export { OfflineContext };
