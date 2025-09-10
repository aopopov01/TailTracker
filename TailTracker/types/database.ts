export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          country_code: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          email_verified_at: string | null
          full_name: string | null
          gdpr_consent_date: string | null
          id: string
          language: string | null
          last_seen_at: string | null
          marketing_consent: boolean | null
          mfa_enabled: boolean | null
          mfa_methods: Json | null
          phone: string | null
          phone_verified: boolean | null
          phone_verified_at: string | null
          subscription_expires_at: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"] | null
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          email_verified_at?: string | null
          full_name?: string | null
          gdpr_consent_date?: string | null
          id?: string
          language?: string | null
          last_seen_at?: string | null
          marketing_consent?: boolean | null
          mfa_enabled?: boolean | null
          mfa_methods?: Json | null
          phone?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          subscription_expires_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"] | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          email_verified_at?: string | null
          full_name?: string | null
          gdpr_consent_date?: string | null
          id?: string
          language?: string | null
          last_seen_at?: string | null
          marketing_consent?: boolean | null
          mfa_enabled?: boolean | null
          mfa_methods?: Json | null
          phone?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          subscription_expires_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"] | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
      }
      families: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          invite_code: string
          max_members: number | null
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          invite_code: string
          max_members?: number | null
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          invite_code?: string
          max_members?: number | null
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
      }
      pets: {
        Row: {
          allergies: string | null
          breed: string | null
          color: string | null
          created_at: string | null
          created_by: string
          date_of_birth: string | null
          deleted_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          family_id: string
          gender: string | null
          id: string
          insurance_policy_number: string | null
          insurance_provider: string | null
          microchip_number: string | null
          name: string
          profile_photo_url: string | null
          special_needs: string | null
          species: string
          status: Database["public"]["Enums"]["pet_status"] | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          allergies?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string | null
          created_by: string
          date_of_birth?: string | null
          deleted_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          family_id: string
          gender?: string | null
          id?: string
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          microchip_number?: string | null
          name: string
          profile_photo_url?: string | null
          special_needs?: string | null
          species: string
          status?: Database["public"]["Enums"]["pet_status"] | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          allergies?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          family_id?: string
          gender?: string | null
          id?: string
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          microchip_number?: string | null
          name?: string
          profile_photo_url?: string | null
          special_needs?: string | null
          species?: string
          status?: Database["public"]["Enums"]["pet_status"] | null
          updated_at?: string | null
          weight_kg?: number | null
        }
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          email_sent: boolean | null
          id: string
          message: string
          pet_id: string | null
          push_sent: boolean | null
          read_at: string | null
          related_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          sms_sent: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          message: string
          pet_id?: string | null
          push_sent?: boolean | null
          read_at?: string | null
          related_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sms_sent?: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          message?: string
          pet_id?: string | null
          push_sent?: boolean | null
          read_at?: string | null
          related_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sms_sent?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
      }
    }
    Enums: {
      subscription_status: "free" | "premium" | "family" | "cancelled" | "expired"
      pet_status: "active" | "deceased" | "lost" | "found"
      notification_type: "vaccination_due" | "medication_due" | "appointment" | "lost_pet_alert" | "family_invite" | "trial_ending" | "payment_failed"
      user_role: "owner" | "member" | "viewer"
      audit_action: "create" | "update" | "delete" | "view" | "export"
      payment_status: "pending" | "completed" | "failed" | "refunded"
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]