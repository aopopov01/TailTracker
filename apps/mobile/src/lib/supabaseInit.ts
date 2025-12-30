/**
 * Supabase Initialization for React Native
 * Initializes the shared Supabase client with native AsyncStorage adapter
 */

import {
  createSupabaseClient,
  getSupabaseClient,
  isClientInitialized,
  setSubscriptionStorageAdapter,
} from '@tailtracker/shared-services';
import { nativeStorageAdapter } from './nativeStorageAdapter';

// Environment configuration
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://tkcajpwdlsavqfqhdawy.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY2FqcHdkbHNhdnFmcWhkYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTgwMTUsImV4cCI6MjA3MjAzNDAxNX0.Xz4Lu5PsRmk9aPDQGzmQXSd7lmfzaZklXC8QD0tMCvI';

/**
 * Initialize the Supabase client with native storage
 * Call this once at app startup (e.g., in App.tsx or a root provider)
 */
export const initializeSupabase = () => {
  if (isClientInitialized()) {
    return getSupabaseClient();
  }

  // Initialize Supabase with native storage
  const client = createSupabaseClient({
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    storage: nativeStorageAdapter,
  });

  // Also set storage adapter for subscription service
  setSubscriptionStorageAdapter(nativeStorageAdapter);

  return client;
};

/**
 * Get the initialized Supabase client
 * Will auto-initialize if not already done
 */
export const getSupabase = () => {
  if (!isClientInitialized()) {
    return initializeSupabase();
  }
  return getSupabaseClient();
};

// Export for convenience
export { getSupabaseClient, isClientInitialized };
