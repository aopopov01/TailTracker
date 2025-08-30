import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Supabase configuration - TailTracker Production Project
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tkcajpwdlsavqfqhdawy.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY2FqcHdkbHNhdnFmcWhkYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTgwMTUsImV4cCI6MjA3MjAzNDAxNX0.Xz4Lu5PsRmk9aPDQGzmQXSd7lmfzaZklXC8QD0tMCvI';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Create Supabase client with enhanced configuration for React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'tailtracker-mobile',
    },
  },
});

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      pets: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          species: string | null;
          photos: string[] | null;
          breed: string | null;
          date_of_birth: string | null;
          approximate_age: string | null;
          use_approximate_age: boolean;
          gender: string | null;
          color_markings: string | null;
          weight: string | null;
          weight_unit: string | null;
          height: string | null;
          height_unit: string | null;
          microchip_id: string | null;
          registration_number: string | null;
          insurance_provider: string | null;
          insurance_policy_number: string | null;
          medical_conditions: string[] | null;
          medications: string[] | null;
          allergies: string[] | null;
          veterinarian: any | null;
          emergency_contact: any | null;
          personality_traits: string[] | null;
          favorite_toys: string[] | null;
          favorite_activities: string[] | null;
          exercise_needs: string | null;
          feeding_schedule: string | null;
          special_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          species?: string | null;
          photos?: string[] | null;
          breed?: string | null;
          date_of_birth?: string | null;
          approximate_age?: string | null;
          use_approximate_age?: boolean;
          gender?: string | null;
          color_markings?: string | null;
          weight?: string | null;
          weight_unit?: string | null;
          height?: string | null;
          height_unit?: string | null;
          microchip_id?: string | null;
          registration_number?: string | null;
          insurance_provider?: string | null;
          insurance_policy_number?: string | null;
          medical_conditions?: string[] | null;
          medications?: string[] | null;
          allergies?: string[] | null;
          veterinarian?: any | null;
          emergency_contact?: any | null;
          personality_traits?: string[] | null;
          favorite_toys?: string[] | null;
          favorite_activities?: string[] | null;
          exercise_needs?: string | null;
          feeding_schedule?: string | null;
          special_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string | null;
          species?: string | null;
          photos?: string[] | null;
          breed?: string | null;
          date_of_birth?: string | null;
          approximate_age?: string | null;
          use_approximate_age?: boolean;
          gender?: string | null;
          color_markings?: string | null;
          weight?: string | null;
          weight_unit?: string | null;
          height?: string | null;
          height_unit?: string | null;
          microchip_id?: string | null;
          registration_number?: string | null;
          insurance_provider?: string | null;
          insurance_policy_number?: string | null;
          medical_conditions?: string[] | null;
          medications?: string[] | null;
          allergies?: string[] | null;
          veterinarian?: any | null;
          emergency_contact?: any | null;
          personality_traits?: string[] | null;
          favorite_toys?: string[] | null;
          favorite_activities?: string[] | null;
          exercise_needs?: string | null;
          feeding_schedule?: string | null;
          special_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          email: string;
          phone: string | null;
          emergency_contact: any | null;
          preferences: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          email: string;
          phone?: string | null;
          emergency_contact?: any | null;
          preferences?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          email?: string;
          phone?: string | null;
          emergency_contact?: any | null;
          preferences?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}