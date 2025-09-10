/**
 * TailTracker Onboarding Sync Hook
 * 
 * Custom hook for managing the sync of onboarding data to Supabase.
 * Provides sync status, error handling, and retry mechanisms.
 */

import { useState, useCallback, useEffect } from 'react';
import { usePetProfile } from '../../contexts/PetProfileContext';
import { supabaseSyncService, SyncResult } from '../services/SupabaseSyncService';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingSyncState {
  isInitialSyncComplete: boolean;
  isSyncing: boolean;
  syncError: string | null;
  syncResults: SyncResult[];
  lastSyncAttempt: Date | null;
  canRetrySync: boolean;
}

interface OnboardingSyncActions {
  completeOnboardingWithSync: (localPetId: number) => Promise<SyncResult>;
  retrySync: () => Promise<SyncResult[]>;
  clearSyncError: () => void;
  checkSyncStatus: () => Promise<void>;
}

export interface UseOnboardingSyncReturn extends OnboardingSyncState, OnboardingSyncActions {}

export const useOnboardingSync = (): UseOnboardingSyncReturn => {
  const { isAuthenticated } = useAuth();
  const { 
    syncPetToSupabase, 
    retryPendingSyncs, 
    getSyncStatus, 
    syncStatus, 
    isSyncing: contextIsSyncing 
  } = usePetProfile();

  const [state, setState] = useState<OnboardingSyncState>({
    isInitialSyncComplete: false,
    isSyncing: false,
    syncError: null,
    syncResults: [],
    lastSyncAttempt: null,
    canRetrySync: false,
  });

  // Sync with context syncing state
  useEffect(() => {
    setState(prev => ({ ...prev, isSyncing: contextIsSyncing }));
  }, [contextIsSyncing]);

  // Update sync status from context
  useEffect(() => {
    if (syncStatus) {
      setState(prev => ({
        ...prev,
        canRetrySync: syncStatus.hasPendingSync,
        isInitialSyncComplete: !syncStatus.hasPendingSync && !!syncStatus.lastSync,
      }));
    }
  }, [syncStatus]);

  /**
   * Complete onboarding with automatic sync to Supabase
   */
  const completeOnboardingWithSync = useCallback(async (localPetId: number): Promise<SyncResult> => {
    setState(prev => ({ 
      ...prev, 
      isSyncing: true, 
      syncError: null, 
      lastSyncAttempt: new Date() 
    }));

    try {
      console.log('Starting onboarding completion sync for pet ID:', localPetId);

      const syncResult = await syncPetToSupabase(localPetId);

      setState(prev => ({
        ...prev,
        syncResults: [...prev.syncResults, syncResult],
        isInitialSyncComplete: syncResult.success,
        canRetrySync: !syncResult.success,
        syncError: syncResult.success ? null : syncResult.error || 'Sync failed',
      }));

      if (syncResult.success) {
        console.log('Onboarding sync completed successfully:', syncResult.supabasePetId);
      } else {
        console.warn('Onboarding sync failed:', syncResult.error);
      }

      return syncResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      
      setState(prev => ({
        ...prev,
        syncError: errorMessage,
        canRetrySync: true,
        isInitialSyncComplete: false,
      }));

      console.error('Onboarding sync error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [syncPetToSupabase]);

  /**
   * Retry failed syncs
   */
  const retrySync = useCallback(async (): Promise<SyncResult[]> => {
    setState(prev => ({ 
      ...prev, 
      isSyncing: true, 
      syncError: null, 
      lastSyncAttempt: new Date() 
    }));

    try {
      const results = await retryPendingSyncs();

      const hasSuccessfulSync = results.some(r => r.success);
      const hasFailures = results.some(r => !r.success);

      setState(prev => ({
        ...prev,
        syncResults: [...prev.syncResults, ...results],
        isInitialSyncComplete: hasSuccessfulSync,
        canRetrySync: hasFailures,
        syncError: hasFailures ? 'Some syncs failed' : null,
      }));

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry sync failed';
      
      setState(prev => ({
        ...prev,
        syncError: errorMessage,
        canRetrySync: true,
      }));

      console.error('Retry sync error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [retryPendingSyncs]);

  /**
   * Clear sync error
   */
  const clearSyncError = useCallback(() => {
    setState(prev => ({ ...prev, syncError: null }));
  }, []);

  /**
   * Check current sync status
   */
  const checkSyncStatus = useCallback(async (): Promise<void> => {
    try {
      await getSyncStatus();
    } catch (error) {
      console.error('Check sync status error:', error);
    }
  }, [getSyncStatus]);

  // Auto-check sync status when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      checkSyncStatus();
    } else {
      setState(prev => ({
        ...prev,
        isInitialSyncComplete: false,
        canRetrySync: false,
        syncError: null,
      }));
    }
  }, [isAuthenticated, checkSyncStatus]);

  return {
    // State
    isInitialSyncComplete: state.isInitialSyncComplete,
    isSyncing: state.isSyncing,
    syncError: state.syncError,
    syncResults: state.syncResults,
    lastSyncAttempt: state.lastSyncAttempt,
    canRetrySync: state.canRetrySync,

    // Actions
    completeOnboardingWithSync,
    retrySync,
    clearSyncError,
    checkSyncStatus,
  };
};

export default useOnboardingSync;