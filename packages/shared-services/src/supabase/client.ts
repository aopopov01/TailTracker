/**
 * Supabase Client Factory
 * Creates platform-agnostic Supabase client with injectable storage adapter
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { StorageAdapter } from '@tailtracker/shared-types';

export type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FlexibleClient = SupabaseClient<any, 'public', any>;

let supabaseInstance: FlexibleClient | null = null;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  storage: StorageAdapter;
}

/**
 * Creates a Supabase client with the provided configuration
 * Uses singleton pattern to ensure single instance per application
 */
export const createSupabaseClient = (config: SupabaseConfig): FlexibleClient => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient(config.url, config.anonKey, {
    auth: {
      storage: config.storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: typeof window !== 'undefined',
    },
  });

  return supabaseInstance;
};

/**
 * Get the existing Supabase client instance
 * Throws if client hasn't been initialized
 */
export const getSupabaseClient = (): FlexibleClient => {
  if (!supabaseInstance) {
    throw new Error(
      'Supabase client not initialized. Call createSupabaseClient() first.'
    );
  }
  return supabaseInstance;
};

/**
 * Reset the Supabase client (useful for testing)
 */
export const resetSupabaseClient = (): void => {
  supabaseInstance = null;
};

/**
 * Check if client is initialized
 */
export const isClientInitialized = (): boolean => {
  return supabaseInstance !== null;
};

/**
 * Browser localStorage adapter for web platforms
 */
export const browserStorageAdapter: StorageAdapter = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

/**
 * In-memory storage adapter for SSR/testing
 */
export const createMemoryStorageAdapter = (): StorageAdapter => {
  const storage = new Map<string, string>();

  return {
    getItem: async (key: string) => storage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: async (key: string) => {
      storage.delete(key);
    },
  };
};
