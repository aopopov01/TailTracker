/**
 * TailTracker Supabase Service Integration
 * Centralized Supabase client and database operations with full type safety
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '../types/database.types';

// Environment configuration
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://tkcajpwdlsavqfqhdawy.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY2FqcHdkbHNhdnFmcWhkYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTgwMTUsImV4cCI6MjA3MjAzNDAxNX0.Xz4Lu5PsRmk9aPDQGzmQXSd7lmfzaZklXC8QD0tMCvI';

// Create fully typed Supabase client with AsyncStorage for session persistence
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce', // Use PKCE flow for mobile
    },
  }
);

// Database helper functions
export const supabaseHelpers = {
  // User operations
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: undefined, // Disable email verification
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resendVerificationEmail(email: string) {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        // Email verification disabled for better UX
      },
    });
    if (error) throw error;
    return data;
  },

  // Pet operations
  async getPets(userId: string) {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPetsBySession(sessionId: string) {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('anonymous_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createPet(petData: any) {
    const { data, error } = await supabase
      .from('pets')
      .insert([petData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePet(petId: string, updates: any) {
    const { data, error } = await supabase
      .from('pets')
      .update(updates)
      .eq('id', petId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePet(petId: string) {
    const { error } = await supabase.from('pets').delete().eq('id', petId);

    if (error) throw error;
  },

  // Medical records (health records)
  async getHealthRecords(petId: string) {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createHealthRecord(recordData: any) {
    const { data, error } = await supabase
      .from('medical_records')
      .insert([recordData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Vaccination records
  async getVaccinations(petId: string) {
    const { data, error } = await supabase
      .from('vaccinations')
      .select('*')
      .eq('pet_id', petId)
      .order('administered_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createVaccination(vaccinationData: any) {
    const { data, error } = await supabase
      .from('vaccinations')
      .insert([vaccinationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Lost pet alerts
  async getLostPetAlerts(
    location?: { latitude: number; longitude: number },
    radius: number = 10
  ) {
    if (location) {
      // Use find_nearby_users for location-based search
      // Note: This returns nearby users, not lost pets directly
      // You may need to join with lost_pets table in production
      const { data, error } = await supabase.rpc('find_nearby_users', {
        center_lat: location.latitude,
        center_lng: location.longitude,
        radius_meters: radius * 1000, // Convert km to meters
      });
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('lost_pets')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  },

  // File upload
  async uploadFile(bucket: string, path: string, file: File | Blob) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  },

  async getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return data.publicUrl;
  },

  // Realtime subscriptions
  subscribeToTable(
    table: string,
    callback: (payload: any) => void,
    filters?: any
  ) {
    let subscription = supabase.channel(`public:${table}`).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...filters,
      },
      callback
    );

    if (filters) {
      subscription = subscription.subscribe();
    } else {
      subscription = subscription.subscribe();
    }

    return subscription;
  },

  // Helper for handling errors
  handleError(error: any) {
    console.error('Supabase error:', error);

    if (error.code === 'PGRST301') {
      throw new Error('Resource not found');
    } else if (error.code === 'PGRST116') {
      throw new Error('Access denied');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('An unexpected database error occurred');
    }
  },
};

// Export default client
export default supabase;
