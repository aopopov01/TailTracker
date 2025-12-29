/**
 * Supabase Database Types
 * Auto-generated from Supabase schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_user_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          subscription_status: Database['public']['Enums']['subscription_status'];
          subscription_tier: string | null;
          subscription_expires_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          subscription_status?: Database['public']['Enums']['subscription_status'];
          subscription_tier?: string | null;
          subscription_expires_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          subscription_status?: Database['public']['Enums']['subscription_status'];
          subscription_tier?: string | null;
          subscription_expires_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      pets: {
        Row: {
          id: string;
          name: string;
          species: string;
          breed: string | null;
          gender: string | null;
          date_of_birth: string | null;
          weight_kg: number | null;
          height: string | null;
          color: string | null;
          color_markings: string | null;
          microchip_number: string | null;
          status: Database['public']['Enums']['pet_status'] | null;
          profile_photo_url: string | null;
          personality_traits: string[] | null;
          favorite_activities: string[] | null;
          exercise_needs: string | null;
          feeding_schedule: string | null;
          favorite_food: string | null;
          special_diet_notes: string | null;
          medical_conditions: string[] | null;
          current_medications: string[] | null;
          allergies: string | null;
          special_notes: string | null;
          emergency_contact: Json | null;
          is_public: boolean | null;
          user_id: string | null;
          anonymous_session_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          species: string;
          breed?: string | null;
          gender?: string | null;
          date_of_birth?: string | null;
          weight_kg?: number | null;
          height?: string | null;
          color?: string | null;
          color_markings?: string | null;
          microchip_number?: string | null;
          status?: Database['public']['Enums']['pet_status'] | null;
          profile_photo_url?: string | null;
          personality_traits?: string[] | null;
          favorite_activities?: string[] | null;
          exercise_needs?: string | null;
          feeding_schedule?: string | null;
          favorite_food?: string | null;
          special_diet_notes?: string | null;
          medical_conditions?: string[] | null;
          current_medications?: string[] | null;
          allergies?: string | null;
          special_notes?: string | null;
          emergency_contact?: Json | null;
          is_public?: boolean | null;
          user_id?: string | null;
          anonymous_session_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          species?: string;
          breed?: string | null;
          gender?: string | null;
          date_of_birth?: string | null;
          weight_kg?: number | null;
          height?: string | null;
          color?: string | null;
          color_markings?: string | null;
          microchip_number?: string | null;
          status?: Database['public']['Enums']['pet_status'] | null;
          profile_photo_url?: string | null;
          personality_traits?: string[] | null;
          favorite_activities?: string[] | null;
          exercise_needs?: string | null;
          feeding_schedule?: string | null;
          favorite_food?: string | null;
          special_diet_notes?: string | null;
          medical_conditions?: string[] | null;
          current_medications?: string[] | null;
          allergies?: string | null;
          special_notes?: string | null;
          emergency_contact?: Json | null;
          is_public?: boolean | null;
          user_id?: string | null;
          anonymous_session_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Enums: {
      pet_status: 'active' | 'deceased' | 'lost' | 'found';
      subscription_status: 'free' | 'premium' | 'family' | 'cancelled' | 'expired';
      user_role: 'owner' | 'member' | 'viewer';
      audit_action: 'create' | 'update' | 'delete' | 'view' | 'export';
      notification_type:
        | 'vaccination_due'
        | 'medication_due'
        | 'appointment'
        | 'lost_pet_alert'
        | 'family_invite'
        | 'trial_ending'
        | 'payment_failed';
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
