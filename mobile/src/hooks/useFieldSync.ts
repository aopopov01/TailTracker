/**
 * TailTracker Field Sync Hook
 * 
 * Provides seamless field-level synchronization between local and cloud databases.
 * Ensures users only fill information once and it stays in sync everywhere.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { bidirectionalSyncService, SyncResult, ConflictResolution } from '../services/BidirectionalSyncService';
import { useAuth } from '../contexts/AuthContext';
import { usePetProfile } from '../../contexts/PetProfileContext';

interface FieldSyncState {
  isSyncing: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'conflict';
  lastSync: Date | null;
  error: string | null;
  conflicts: string[];
}

interface UseFieldSyncOptions {
  localPetId: number;
  supabasePetId?: string;
  debounceMs?: number;
  autoResolveConflicts?: boolean;
}

interface UseFieldSyncReturn extends FieldSyncState {
  syncField: (field: string, value: any) => Promise<void>;
  startRealTimeSync: () => Promise<void>;
  stopRealTimeSync: () => void;
  performFullSync: () => Promise<SyncResult>;
  resolveConflicts: (resolutions: ConflictResolution[]) => Promise<void>;
  clearSyncState: () => void;
}

export const useFieldSync = (options: UseFieldSyncOptions): UseFieldSyncReturn => {
  const { localPetId, supabasePetId, debounceMs = 1000, autoResolveConflicts = false } = options;
  const { user } = useAuth();
  const { getSyncStatus } = usePetProfile();
  
  const [state, setState] = useState<FieldSyncState>({
    isSyncing: false,
    syncStatus: 'idle',
    lastSync: null,
    error: null,
    conflicts: []
  });

  const debounceRef = useRef<Record<string, NodeJS.Timeout>>({});
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // Clear any pending debounced syncs
      Object.values(debounceRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  /**
   * Update state safely if component is still mounted
   */
  const safeSetState = useCallback((updates: Partial<FieldSyncState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  /**
   * Sync a single field with debouncing
   */
  const syncField = useCallback(async (field: string, value: any): Promise<void> => {
    if (!user?.id || !supabasePetId) {
      console.log('⏸️ Skipping sync - user not authenticated or no Supabase pet ID');
      return;
    }

    // Clear existing debounce for this field
    if (debounceRef.current[field]) {
      clearTimeout(debounceRef.current[field]);
    }

    // Debounce the sync
    debounceRef.current[field] = setTimeout(async () => {
      try {
        safeSetState({ isSyncing: true, syncStatus: 'syncing', error: null });

        console.log(`🔄 Syncing field '${field}': ${value}`);
        
        const result = await bidirectionalSyncService.syncFieldChange(
          localPetId,
          supabasePetId,
          field,
          value,
          user.id
        );

        if (result.success) {
          safeSetState({
            isSyncing: false,
            syncStatus: 'synced',
            lastSync: new Date(),
            conflicts: result.conflicts
          });
          console.log(`✅ Field '${field}' synced successfully`);
        } else {
          throw new Error(result.error || 'Sync failed');
        }

      } catch (error) {
        console.error(`❌ Failed to sync field '${field}':`, error);
        safeSetState({
          isSyncing: false,
          syncStatus: 'error',
          error: error instanceof Error ? error.message : 'Sync failed'
        });
      }

      // Clean up debounce reference
      delete debounceRef.current[field];
    }, debounceMs);

  }, [user?.id, supabasePetId, localPetId, debounceMs, safeSetState]);

  /**
   * Start real-time sync
   */
  const startRealTimeSync = useCallback(async (): Promise<void> => {
    if (!supabasePetId) {
      console.log('⏸️ Cannot start real-time sync - no Supabase pet ID');
      return;
    }

    try {
      await bidirectionalSyncService.startRealTimeSync(localPetId, supabasePetId);
      safeSetState({ syncStatus: 'synced' });
      console.log('🔄 Real-time sync started');
    } catch (error) {
      console.error('❌ Failed to start real-time sync:', error);
      safeSetState({ 
        syncStatus: 'error',
        error: error instanceof Error ? error.message : 'Failed to start real-time sync'
      });
    }
  }, [localPetId, supabasePetId, safeSetState]);

  /**
   * Stop real-time sync
   */
  const stopRealTimeSync = useCallback((): void => {
    bidirectionalSyncService.stopRealTimeSync();
    safeSetState({ syncStatus: 'idle' });
    console.log('⏹️ Real-time sync stopped');
  }, [safeSetState]);

  /**
   * Perform full profile sync
   */
  const performFullSync = useCallback(async (): Promise<SyncResult> => {
    if (!user?.id || !supabasePetId) {
      return {
        success: false,
        fieldsUpdated: [],
        conflicts: [],
        error: 'User not authenticated or no Supabase pet ID'
      };
    }

    try {
      safeSetState({ isSyncing: true, syncStatus: 'syncing', error: null });

      console.log('🔄 Performing full profile sync');
      
      const result = await bidirectionalSyncService.performFullSync(
        localPetId,
        supabasePetId,
        user.id
      );

      if (result.success) {
        safeSetState({
          isSyncing: false,
          syncStatus: result.conflicts.length > 0 ? 'conflict' : 'synced',
          lastSync: new Date(),
          conflicts: result.conflicts
        });
        console.log(`✅ Full sync completed: ${result.fieldsUpdated.length} fields updated`);
      } else {
        safeSetState({
          isSyncing: false,
          syncStatus: 'error',
          error: result.error || 'Full sync failed',
          conflicts: result.conflicts
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Full sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Full sync failed';
      safeSetState({
        isSyncing: false,
        syncStatus: 'error',
        error: errorMessage
      });

      return {
        success: false,
        fieldsUpdated: [],
        conflicts: [],
        error: errorMessage
      };
    }
  }, [user?.id, supabasePetId, localPetId, safeSetState]);

  /**
   * Resolve conflicts
   */
  const resolveConflicts = useCallback(async (resolutions: ConflictResolution[]): Promise<void> => {
    if (!user?.id || !supabasePetId) {
      console.log('⏸️ Cannot resolve conflicts - user not authenticated or no Supabase pet ID');
      return;
    }

    try {
      safeSetState({ isSyncing: true, syncStatus: 'syncing', error: null });

      console.log(`🔄 Resolving ${resolutions.length} conflicts`);
      
      const result = await bidirectionalSyncService.resolveConflicts(
        localPetId,
        supabasePetId,
        resolutions,
        user.id
      );

      if (result.success) {
        safeSetState({
          isSyncing: false,
          syncStatus: 'synced',
          lastSync: new Date(),
          conflicts: []
        });
        console.log(`✅ Conflicts resolved: ${result.fieldsUpdated.length} fields updated`);
      } else {
        throw new Error(result.error || 'Conflict resolution failed');
      }

    } catch (error) {
      console.error('❌ Conflict resolution failed:', error);
      safeSetState({
        isSyncing: false,
        syncStatus: 'error',
        error: error instanceof Error ? error.message : 'Conflict resolution failed'
      });
    }
  }, [user?.id, supabasePetId, localPetId, safeSetState]);

  /**
   * Clear sync state
   */
  const clearSyncState = useCallback((): void => {
    setState({
      isSyncing: false,
      syncStatus: 'idle',
      lastSync: null,
      error: null,
      conflicts: []
    });
  }, []);

  /**
   * Auto-resolve conflicts if enabled
   */
  useEffect(() => {
    if (autoResolveConflicts && state.conflicts.length > 0) {
      console.log('🔄 Auto-resolving conflicts using local values');
      const resolutions: ConflictResolution[] = state.conflicts.map(field => ({
        field,
        resolution: 'local' // Prefer local changes by default
      }));
      resolveConflicts(resolutions);
    }
  }, [state.conflicts, autoResolveConflicts, resolveConflicts]);

  /**
   * Start real-time sync when component mounts and we have necessary IDs
   */
  useEffect(() => {
    if (supabasePetId && user?.id) {
      startRealTimeSync();
    }

    return () => {
      stopRealTimeSync();
    };
  }, [supabasePetId, user?.id, startRealTimeSync, stopRealTimeSync]);

  return {
    ...state,
    syncField,
    startRealTimeSync,
    stopRealTimeSync,
    performFullSync,
    resolveConflicts,
    clearSyncState
  };
};

export default useFieldSync;