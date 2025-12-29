/**
 * Supabase Client Initialization for Web
 * Uses browser localStorage for session persistence
 * Handles missing environment variables gracefully
 */

import {
  createSupabaseClient,
  browserStorageAdapter,
} from '@tailtracker/shared-services';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Track initialization status
export let isSupabaseConfigured = false;
export let supabaseError: string | null = null;

// Initialize the Supabase client with browser storage
// Don't throw - handle missing config gracefully
export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

    supabaseError = `Missing Supabase environment variables: ${missingVars.join(', ')}`;
    console.warn(supabaseError);
    console.warn('Authentication features will not work until these are configured.');

    // Return null - auth functions will need to handle this
    return null;
  }

  try {
    isSupabaseConfigured = true;
    return createSupabaseClient({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      storage: browserStorageAdapter,
    });
  } catch (error) {
    supabaseError = error instanceof Error ? error.message : 'Failed to initialize Supabase';
    console.error('Supabase initialization error:', error);
    return null;
  }
})();
