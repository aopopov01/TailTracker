/**
 * Platform Sync Utility
 * Clears all cached data and refreshes from database
 * Used by admin to ensure all changes are reflected across the app
 */

import { QueryClient } from '@tanstack/react-query';
import { clearSubscriptionCache, getCurrentUser } from '@tailtracker/shared-services';
import type { User } from '@tailtracker/shared-types';

const AUTH_STORAGE_KEY = 'auth-storage';

/**
 * Comprehensive platform sync - clears all caches and refreshes data
 *
 * @param queryClient - React Query client instance
 * @returns Promise<boolean> - true if sync was successful
 */
export const syncPlatform = async (queryClient: QueryClient): Promise<boolean> => {
  try {
    console.log('[syncPlatform] Starting comprehensive platform sync...');

    // 1. Clear all React Query caches
    queryClient.clear();
    console.log('[syncPlatform] Cleared React Query cache');

    // 2. Clear subscription cache (stored in localStorage)
    await clearSubscriptionCache();
    console.log('[syncPlatform] Cleared subscription cache');

    // 3. Fetch fresh user data from database
    const freshUser = await getCurrentUser();

    if (freshUser) {
      // 4. Update auth store localStorage with fresh data
      updateAuthStorage(freshUser);
      console.log('[syncPlatform] Updated auth storage with fresh user data');
    }

    // 5. Invalidate all queries to force refetch on next access
    await queryClient.invalidateQueries();
    console.log('[syncPlatform] Invalidated all queries');

    console.log('[syncPlatform] Platform sync completed successfully');
    return true;
  } catch (error) {
    console.error('[syncPlatform] Error during platform sync:', error);
    return false;
  }
};

/**
 * Update auth storage localStorage with fresh user data
 */
const updateAuthStorage = (user: User): void => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return;

    const parsed = JSON.parse(stored);

    if (parsed.state?.user) {
      // Merge fresh user data with existing storage
      parsed.state.user = {
        ...parsed.state.user,
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subscriptionTier: (user as { subscriptionTier?: string }).subscriptionTier,
        updatedAt: user.updatedAt,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch (error) {
    console.warn('[updateAuthStorage] Failed to update auth storage:', error);
  }
};

/**
 * Quick sync - just invalidates queries without clearing cache
 * Use for less aggressive refreshes
 */
export const quickSync = async (queryClient: QueryClient): Promise<void> => {
  await queryClient.invalidateQueries();
};

/**
 * Sync specific query keys
 */
export const syncQueries = async (
  queryClient: QueryClient,
  queryKeys: string[]
): Promise<void> => {
  for (const key of queryKeys) {
    await queryClient.invalidateQueries({ queryKey: [key] });
  }
};
