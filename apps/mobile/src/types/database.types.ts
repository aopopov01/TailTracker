export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      pets: {
        Row: {
          id: string
          name: string
          species: string
          breed: string | null
          gender: string | null
          date_of_birth: string | null
          weight_kg: number | null
          status: Database["public"]["Enums"]["pet_status"] | null
          profile_photo_url: string | null
          allergies: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          user_id: string | null
          personality_traits: string[] | null
          favorite_activities: string[] | null
          exercise_needs: string | null
          feeding_schedule: string | null
          special_notes: string | null
          color_markings: string | null
          medical_conditions: string[] | null
          favorite_food: string | null
          is_public: boolean | null
          special_diet_notes: string | null
          height: string | null
          microchip_number: string | null
          current_medications: string[] | null
          anonymous_session_id: string | null
        }
        Insert: {
          id?: string
          name: string
          species: string
          breed?: string | null
          gender?: string | null
          date_of_birth?: string | null
          weight_kg?: number | null
          status?: Database["public"]["Enums"]["pet_status"] | null
          profile_photo_url?: string | null
          allergies?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          user_id?: string | null
          personality_traits?: string[] | null
          favorite_activities?: string[] | null
          exercise_needs?: string | null
          feeding_schedule?: string | null
          special_notes?: string | null
          color_markings?: string | null
          medical_conditions?: string[] | null
          favorite_food?: string | null
          is_public?: boolean | null
          special_diet_notes?: string | null
          height?: string | null
          microchip_number?: string | null
          current_medications?: string[] | null
          anonymous_session_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          species?: string
          breed?: string | null
          gender?: string | null
          date_of_birth?: string | null
          weight_kg?: number | null
          status?: Database["public"]["Enums"]["pet_status"] | null
          profile_photo_url?: string | null
          allergies?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          user_id?: string | null
          personality_traits?: string[] | null
          favorite_activities?: string[] | null
          exercise_needs?: string | null
          feeding_schedule?: string | null
          special_notes?: string | null
          color_markings?: string | null
          medical_conditions?: string[] | null
          favorite_food?: string | null
          is_public?: boolean | null
          special_diet_notes?: string | null
          height?: string | null
          microchip_number?: string | null
          current_medications?: string[] | null
          anonymous_session_id?: string | null
        }
        Relationships: []
      }
    }
    Enums: {
      pet_status: "active" | "deceased" | "lost" | "found"
      subscription_status: "free" | "premium" | "family" | "cancelled" | "expired"
      user_role: "owner" | "member" | "viewer"
      audit_action: "create" | "update" | "delete" | "view" | "export"
      notification_type: "vaccination_due" | "medication_due" | "appointment" | "lost_pet_alert" | "family_invite" | "trial_ending" | "payment_failed"
      payment_status: "pending" | "completed" | "failed" | "refunded"
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]
