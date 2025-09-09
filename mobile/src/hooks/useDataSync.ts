/**
 * React Hooks for TailTracker Data Synchronization
 * 
 * These hooks provide easy integration with the DataSyncService
 * for React Native components.
 */

import { useState, useEffect, useCallback } from 'react';
import { dataSyncService, SyncProgress, SyncOperation } from '@/services/DataSyncService';

// =====================================================
// MAIN SYNC HOOK
// =====================================================

/**
 * Main hook for data synchronization functionality
 */
export const useDataSync = () => {
  const [syncStatus, setSyncStatus] = useState({
    inProgress: false,
    queueSize: 0,
    pendingOperations: [] as SyncOperation[],
    failedOperations: [] as SyncOperation[]
  });

  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  // Update sync status
  const updateSyncStatus = useCallback(() => {
    const status = dataSyncService.getSyncStatus();
    setSyncStatus(status);
  }, []);

  // Handle sync progress updates
  const handleSyncProgress = useCallback((progress: SyncProgress) => {
    setSyncProgress(progress);
    
    // Clear progress when sync completes
    if (progress.percentage === 100) {
      setTimeout(() => {
        setSyncProgress(null);
        updateSyncStatus();
      }, 1000);
    }
  }, [updateSyncStatus]);

  useEffect(() => {
    // Initial status update
    updateSyncStatus();

    // Add progress listener
    dataSyncService.addSyncProgressListener(handleSyncProgress);

    // Periodic status updates
    const interval = setInterval(updateSyncStatus, 5000);

    return () => {
      clearInterval(interval);
      dataSyncService.removeSyncProgressListener(handleSyncProgress);
    };
  }, [handleSyncProgress, updateSyncStatus]);

  // Sync methods
  const queueUserProfileSync = useCallback((authUserId: string) => {
    dataSyncService.queueUserProfileSync(authUserId);
    updateSyncStatus();
  }, [updateSyncStatus]);

  const queuePetDataSync = useCallback((petId: string) => {
    dataSyncService.queuePetDataSync(petId);
    updateSyncStatus();
  }, [updateSyncStatus]);

  const queueVeterinarianSync = useCallback((vetId: string) => {
    dataSyncService.queueVeterinarianSync(vetId);
    updateSyncStatus();
  }, [updateSyncStatus]);

  const queueFullSync = useCallback(async () => {
    await dataSyncService.queueFullSync();
    updateSyncStatus();
  }, [updateSyncStatus]);

  const clearFailedSyncs = useCallback(() => {
    dataSyncService.clearFailedSyncs();
    updateSyncStatus();
  }, [updateSyncStatus]);

  const retryFailedSyncs = useCallback(async () => {
    await dataSyncService.retryFailedSyncs();
    updateSyncStatus();
  }, [updateSyncStatus]);

  return {
    // Status
    syncStatus,
    syncProgress,
    isLoading: syncStatus.inProgress,
    hasErrors: syncStatus.failedOperations.length > 0,
    
    // Actions
    queueUserProfileSync,
    queuePetDataSync,
    queueVeterinarianSync,
    queueFullSync,
    clearFailedSyncs,
    retryFailedSyncs,
    
    // Manual refresh
    refreshStatus: updateSyncStatus
  };
};

// =====================================================
// AUTOMATIC SYNC HOOKS
// =====================================================

/**
 * Hook that automatically syncs user profile when data changes
 */
const useAutoUserProfileSync = (userId?: string) => {
  const { queueUserProfileSync } = useDataSync();

  useEffect(() => {
    if (userId) {
      // Debounce automatic syncing
      const timeoutId = setTimeout(() => {
        queueUserProfileSync(userId);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [userId, queueUserProfileSync]);
};

/**
 * Hook that automatically syncs pet data when pet changes
 */
const useAutoPetSync = (petId?: string) => {
  const { queuePetDataSync } = useDataSync();

  useEffect(() => {
    if (petId) {
      const timeoutId = setTimeout(() => {
        queuePetDataSync(petId);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [petId, queuePetDataSync]);
};

/**
 * Hook that automatically syncs veterinarian data when vet changes
 */
const useAutoVetSync = (vetId?: string) => {
  const { queueVeterinarianSync } = useDataSync();

  useEffect(() => {
    if (vetId) {
      const timeoutId = setTimeout(() => {
        queueVeterinarianSync(vetId);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [vetId, queueVeterinarianSync]);
};

// =====================================================
// SYNC HISTORY HOOK
// =====================================================

/**
 * Hook to fetch and display sync history
 */
const useSyncHistory = (limit: number = 50) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await dataSyncService.getSyncHistory(limit);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sync history');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refresh: fetchHistory
  };
};

// =====================================================
// FORCE SYNC HOOK
// =====================================================

/**
 * Hook for manual/forced synchronization
 */
const useForceSync = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const forceSync = useCallback(async (
    type: 'user_profile' | 'pet_data' | 'veterinarian' | 'full_sync',
    targetId: string
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const syncResult = await dataSyncService.forceSync(type, targetId);
      setResult(syncResult);
      return syncResult;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    forceSync,
    loading,
    result,
    error,
    clearError: () => setError(null),
    clearResult: () => setResult(null)
  };
};

// =====================================================
// SYNC NOTIFICATION HOOK
// =====================================================

/**
 * Hook to show sync notifications/toasts
 */
const useSyncNotifications = () => {
  const [notification, setNotification] = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
    visible: boolean;
  } | null>(null);

  const { syncProgress, syncStatus } = useDataSync();

  useEffect(() => {
    // Show sync progress notifications
    if (syncProgress) {
      setNotification({
        type: 'info',
        message: `${syncProgress.current} (${syncProgress.percentage}%)`,
        visible: true
      });
    }
  }, [syncProgress]);

  useEffect(() => {
    // Show sync completion notifications
    if (!syncStatus.inProgress && syncStatus.queueSize === 0 && notification?.type === 'info') {
      setNotification({
        type: 'success',
        message: 'Data synchronized successfully',
        visible: true
      });

      // Auto-hide success notification
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  }, [syncStatus, notification]);

  useEffect(() => {
    // Show error notifications
    if (syncStatus.failedOperations.length > 0) {
      setNotification({
        type: 'error',
        message: `${syncStatus.failedOperations.length} sync operation(s) failed`,
        visible: true
      });
    }
  }, [syncStatus.failedOperations]);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    hideNotification
  };
};

// =====================================================
// BATCH SYNC HOOK
// =====================================================

/**
 * Hook for batch synchronization operations
 */
const useBatchSync = () => {
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    completed: number;
    current: string;
    errors: string[];
  } | null>(null);

  const executeBatchSync = useCallback(async (operations: {
    type: 'user_profile' | 'pet_data' | 'veterinarian';
    targetId: string;
    label: string;
  }[]) => {
    const total = operations.length;
    let completed = 0;
    const errors: string[] = [];

    setBatchProgress({
      total,
      completed,
      current: 'Starting batch sync...',
      errors
    });

    for (const operation of operations) {
      try {
        setBatchProgress(prev => ({
          ...prev!,
          current: `Syncing ${operation.label}...`,
          completed
        }));

        await dataSyncService.forceSync(operation.type, operation.targetId);
        completed++;
        
        setBatchProgress(prev => ({
          ...prev!,
          completed,
          current: `Synced ${operation.label}`
        }));
        
      } catch (error) {
        const errorMsg = `Failed to sync ${operation.label}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        errors.push(errorMsg);
        
        setBatchProgress(prev => ({
          ...prev!,
          errors: [...prev!.errors, errorMsg]
        }));
      }
    }

    // Final update
    setBatchProgress(prev => ({
      ...prev!,
      completed,
      current: completed === total ? 'Batch sync completed' : 'Batch sync completed with errors'
    }));

    // Auto-clear after delay
    setTimeout(() => {
      setBatchProgress(null);
    }, 5000);

    return {
      totalOperations: total,
      successfulOperations: completed,
      failedOperations: total - completed,
      errors
    };
  }, []);

  return {
    batchProgress,
    executeBatchSync,
    clearBatchProgress: () => setBatchProgress(null)
  };
};

// =====================================================
// EXPORT ALL HOOKS
// =====================================================

export {
  useDataSync as default,
  useAutoUserProfileSync,
  useAutoPetSync,
  useAutoVetSync,
  useSyncHistory,
  useForceSync,
  useSyncNotifications,
  useBatchSync
};