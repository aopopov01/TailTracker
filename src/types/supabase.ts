export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      app_reset_audit: {
        Row: {
          app_version: string | null;
          created_at: string | null;
          device_info: Json | null;
          error_message: string | null;
          id: string;
          initiated_by: string | null;
          items_cleared: string[] | null;
          reset_timestamp: string | null;
          reset_type: string;
          success: boolean | null;
          user_id: string | null;
        };
        Insert: {
          app_version?: string | null;
          created_at?: string | null;
          device_info?: Json | null;
          error_message?: string | null;
          id?: string;
          initiated_by?: string | null;
          items_cleared?: string[] | null;
          reset_timestamp?: string | null;
          reset_type: string;
          success?: boolean | null;
          user_id?: string | null;
        };
        Update: {
          app_version?: string | null;
          created_at?: string | null;
          device_info?: Json | null;
          error_message?: string | null;
          id?: string;
          initiated_by?: string | null;
          items_cleared?: string[] | null;
          reset_timestamp?: string | null;
          reset_type?: string;
          success?: boolean | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: Database['public']['Enums']['audit_action'];
          created_at: string | null;
          id: string;
          ip_address: unknown | null;
          new_values: Json | null;
          old_values: Json | null;
          record_id: string | null;
          table_name: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: Database['public']['Enums']['audit_action'];
          created_at?: string | null;
          id?: string;
          ip_address?: unknown | null;
          new_values?: Json | null;
          old_values?: Json | null;
          record_id?: string | null;
          table_name: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: Database['public']['Enums']['audit_action'];
          created_at?: string | null;
          id?: string;
          ip_address?: unknown | null;
          new_values?: Json | null;
          old_values?: Json | null;
          record_id?: string | null;
          table_name?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      auth_audit_log: {
        Row: {
          created_at: string | null;
          event_type: string;
          failure_reason: string | null;
          id: string;
          ip_address: unknown | null;
          metadata: Json | null;
          success: boolean | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_type: string;
          failure_reason?: string | null;
          id?: string;
          ip_address?: unknown | null;
          metadata?: Json | null;
          success?: boolean | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_type?: string;
          failure_reason?: string | null;
          id?: string;
          ip_address?: unknown | null;
          metadata?: Json | null;
          success?: boolean | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'auth_audit_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      developer_mode_activations: {
        Row: {
          activated_at: string | null;
          app_version: string | null;
          created_at: string | null;
          device_info: Json | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          activated_at?: string | null;
          app_version?: string | null;
          created_at?: string | null;
          device_info?: Json | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          activated_at?: string | null;
          app_version?: string | null;
          created_at?: string | null;
          device_info?: Json | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      families: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          invite_code: string;
          max_members: number | null;
          max_pets: number | null;
          name: string;
          owner_id: string;
          subscription_status:
            | Database['public']['Enums']['subscription_status']
            | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          invite_code: string;
          max_members?: number | null;
          max_pets?: number | null;
          name: string;
          owner_id: string;
          subscription_status?:
            | Database['public']['Enums']['subscription_status']
            | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          invite_code?: string;
          max_members?: number | null;
          max_pets?: number | null;
          name?: string;
          owner_id?: string;
          subscription_status?:
            | Database['public']['Enums']['subscription_status']
            | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'families_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      family_members: {
        Row: {
          family_id: string;
          id: string;
          invited_by: string | null;
          joined_at: string | null;
          role: Database['public']['Enums']['user_role'] | null;
          user_id: string;
        };
        Insert: {
          family_id: string;
          id?: string;
          invited_by?: string | null;
          joined_at?: string | null;
          role?: Database['public']['Enums']['user_role'] | null;
          user_id: string;
        };
        Update: {
          family_id?: string;
          id?: string;
          invited_by?: string | null;
          joined_at?: string | null;
          role?: Database['public']['Enums']['user_role'] | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'family_members_family_id_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'families';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'family_members_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'family_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      feature_usage: {
        Row: {
          created_at: string | null;
          feature_name: string;
          id: string;
          last_used_at: string | null;
          metadata: Json | null;
          usage_count: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          feature_name: string;
          id?: string;
          last_used_at?: string | null;
          metadata?: Json | null;
          usage_count?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          feature_name?: string;
          id?: string;
          last_used_at?: string | null;
          metadata?: Json | null;
          usage_count?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feature_usage_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      files: {
        Row: {
          bucket_name: string;
          checksum: string | null;
          content_type: string | null;
          created_at: string | null;
          expires_at: string | null;
          file_size: number | null;
          filename: string;
          id: string;
          is_public: boolean | null;
          original_filename: string | null;
          storage_path: string;
          user_id: string;
        };
        Insert: {
          bucket_name: string;
          checksum?: string | null;
          content_type?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          file_size?: number | null;
          filename: string;
          id?: string;
          is_public?: boolean | null;
          original_filename?: string | null;
          storage_path: string;
          user_id: string;
        };
        Update: {
          bucket_name?: string;
          checksum?: string | null;
          content_type?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          file_size?: number | null;
          filename?: string;
          id?: string;
          is_public?: boolean | null;
          original_filename?: string | null;
          storage_path?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'files_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      gdpr_requests: {
        Row: {
          data_url: string | null;
          expires_at: string | null;
          id: string;
          processed_at: string | null;
          request_type: string;
          requested_at: string | null;
          status: string | null;
          user_id: string;
        };
        Insert: {
          data_url?: string | null;
          expires_at?: string | null;
          id?: string;
          processed_at?: string | null;
          request_type: string;
          requested_at?: string | null;
          status?: string | null;
          user_id: string;
        };
        Update: {
          data_url?: string | null;
          expires_at?: string | null;
          id?: string;
          processed_at?: string | null;
          request_type?: string;
          requested_at?: string | null;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'gdpr_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      lost_pets: {
        Row: {
          alert_sent_count: number | null;
          anonymous_session_id: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string | null;
          description: string | null;
          found_by: string | null;
          found_date: string | null;
          id: string;
          last_seen_address: string | null;
          last_seen_date: string | null;
          pet_id: string;
          photo_urls: string[] | null;
          reported_by: string;
          reward_amount: number | null;
          reward_currency: string | null;
          search_radius_km: number | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          alert_sent_count?: number | null;
          anonymous_session_id?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          description?: string | null;
          found_by?: string | null;
          found_date?: string | null;
          id?: string;
          last_seen_address?: string | null;
          last_seen_date?: string | null;
          pet_id: string;
          photo_urls?: string[] | null;
          reported_by: string;
          reward_amount?: number | null;
          reward_currency?: string | null;
          search_radius_km?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          alert_sent_count?: number | null;
          anonymous_session_id?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          description?: string | null;
          found_by?: string | null;
          found_date?: string | null;
          id?: string;
          last_seen_address?: string | null;
          last_seen_date?: string | null;
          pet_id?: string;
          photo_urls?: string[] | null;
          reported_by?: string;
          reward_amount?: number | null;
          reward_currency?: string | null;
          search_radius_km?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lost_pets_found_by_fkey';
            columns: ['found_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lost_pets_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lost_pets_reported_by_fkey';
            columns: ['reported_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      medical_records: {
        Row: {
          anonymous_session_id: string | null;
          cost: number | null;
          created_at: string | null;
          created_by: string | null;
          currency: string | null;
          date_of_record: string;
          description: string | null;
          diagnosis: string | null;
          document_urls: string[] | null;
          follow_up_date: string | null;
          follow_up_required: boolean | null;
          id: string;
          pet_id: string;
          record_type: string;
          title: string;
          treatment: string | null;
          updated_at: string | null;
          veterinarian_id: string | null;
        };
        Insert: {
          anonymous_session_id?: string | null;
          cost?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          date_of_record: string;
          description?: string | null;
          diagnosis?: string | null;
          document_urls?: string[] | null;
          follow_up_date?: string | null;
          follow_up_required?: boolean | null;
          id?: string;
          pet_id: string;
          record_type: string;
          title: string;
          treatment?: string | null;
          updated_at?: string | null;
          veterinarian_id?: string | null;
        };
        Update: {
          anonymous_session_id?: string | null;
          cost?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          date_of_record?: string;
          description?: string | null;
          diagnosis?: string | null;
          document_urls?: string[] | null;
          follow_up_date?: string | null;
          follow_up_required?: boolean | null;
          id?: string;
          pet_id?: string;
          record_type?: string;
          title?: string;
          treatment?: string | null;
          updated_at?: string | null;
          veterinarian_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'medical_records_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medical_records_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      medications: {
        Row: {
          active: boolean | null;
          anonymous_session_id: string | null;
          created_at: string | null;
          created_by: string | null;
          dosage: string | null;
          end_date: string | null;
          frequency: string | null;
          id: string;
          instructions: string | null;
          medication_name: string;
          pet_id: string;
          prescribed_by: string | null;
          side_effects: string | null;
          start_date: string;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          anonymous_session_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          dosage?: string | null;
          end_date?: string | null;
          frequency?: string | null;
          id?: string;
          instructions?: string | null;
          medication_name: string;
          pet_id: string;
          prescribed_by?: string | null;
          side_effects?: string | null;
          start_date: string;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          anonymous_session_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          dosage?: string | null;
          end_date?: string | null;
          frequency?: string | null;
          id?: string;
          instructions?: string | null;
          medication_name?: string;
          pet_id?: string;
          prescribed_by?: string | null;
          side_effects?: string | null;
          start_date?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'medications_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medications_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          action_url: string | null;
          created_at: string | null;
          email_sent: boolean | null;
          id: string;
          message: string;
          pet_id: string | null;
          push_sent: boolean | null;
          read_at: string | null;
          related_id: string | null;
          scheduled_for: string | null;
          sent_at: string | null;
          sms_sent: boolean | null;
          title: string;
          type: Database['public']['Enums']['notification_type'];
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string | null;
          email_sent?: boolean | null;
          id?: string;
          message: string;
          pet_id?: string | null;
          push_sent?: boolean | null;
          read_at?: string | null;
          related_id?: string | null;
          scheduled_for?: string | null;
          sent_at?: string | null;
          sms_sent?: boolean | null;
          title: string;
          type: Database['public']['Enums']['notification_type'];
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string | null;
          email_sent?: boolean | null;
          id?: string;
          message?: string;
          pet_id?: string | null;
          push_sent?: boolean | null;
          read_at?: string | null;
          related_id?: string | null;
          scheduled_for?: string | null;
          sent_at?: string | null;
          sms_sent?: boolean | null;
          title?: string;
          type?: Database['public']['Enums']['notification_type'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          id: string;
          invoice_url: string | null;
          payment_method: string | null;
          processed_at: string | null;
          status: Database['public']['Enums']['payment_status'];
          stripe_payment_intent_id: string | null;
          subscription_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          invoice_url?: string | null;
          payment_method?: string | null;
          processed_at?: string | null;
          status: Database['public']['Enums']['payment_status'];
          stripe_payment_intent_id?: string | null;
          subscription_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          invoice_url?: string | null;
          payment_method?: string | null;
          processed_at?: string | null;
          status?: Database['public']['Enums']['payment_status'];
          stripe_payment_intent_id?: string | null;
          subscription_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      pets: {
        Row: {
          allergies: string | null;
          anonymous_session_id: string | null;
          breed: string | null;
          color_markings: string | null;
          created_at: string | null;
          current_medications: string[] | null;
          date_of_birth: string | null;
          deleted_at: string | null;
          exercise_needs: string | null;
          favorite_activities: string[] | null;
          favorite_food: string | null;
          feeding_schedule: string | null;
          gender: string | null;
          height: string | null;
          id: string;
          is_public: boolean | null;
          medical_conditions: string[] | null;
          microchip_number: string | null;
          name: string;
          personality_traits: string[] | null;
          profile_photo_url: string | null;
          special_diet_notes: string | null;
          special_notes: string | null;
          species: string;
          status: Database['public']['Enums']['pet_status'] | null;
          updated_at: string | null;
          user_id: string | null;
          weight_kg: number | null;
        };
        Insert: {
          allergies?: string | null;
          anonymous_session_id?: string | null;
          breed?: string | null;
          color_markings?: string | null;
          created_at?: string | null;
          current_medications?: string[] | null;
          date_of_birth?: string | null;
          deleted_at?: string | null;
          exercise_needs?: string | null;
          favorite_activities?: string[] | null;
          favorite_food?: string | null;
          feeding_schedule?: string | null;
          gender?: string | null;
          height?: string | null;
          id?: string;
          is_public?: boolean | null;
          medical_conditions?: string[] | null;
          microchip_number?: string | null;
          name: string;
          personality_traits?: string[] | null;
          profile_photo_url?: string | null;
          special_diet_notes?: string | null;
          special_notes?: string | null;
          species: string;
          status?: Database['public']['Enums']['pet_status'] | null;
          updated_at?: string | null;
          user_id?: string | null;
          weight_kg?: number | null;
        };
        Update: {
          allergies?: string | null;
          anonymous_session_id?: string | null;
          breed?: string | null;
          color_markings?: string | null;
          created_at?: string | null;
          current_medications?: string[] | null;
          date_of_birth?: string | null;
          deleted_at?: string | null;
          exercise_needs?: string | null;
          favorite_activities?: string[] | null;
          favorite_food?: string | null;
          feeding_schedule?: string | null;
          gender?: string | null;
          height?: string | null;
          id?: string;
          is_public?: boolean | null;
          medical_conditions?: string[] | null;
          microchip_number?: string | null;
          name?: string;
          personality_traits?: string[] | null;
          profile_photo_url?: string | null;
          special_diet_notes?: string | null;
          special_notes?: string | null;
          species?: string;
          status?: Database['public']['Enums']['pet_status'] | null;
          updated_at?: string | null;
          user_id?: string | null;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      security_status: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          issue_type: string;
          remediation_notes: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          issue_type: string;
          remediation_notes?: string | null;
          status: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          issue_type?: string;
          remediation_notes?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          event_type: string;
          id: string;
          payload: Json;
          processed: boolean | null;
          processed_at: string | null;
          stripe_event_id: string;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          event_type: string;
          id?: string;
          payload: Json;
          processed?: boolean | null;
          processed_at?: string | null;
          stripe_event_id: string;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          event_type?: string;
          id?: string;
          payload?: Json;
          processed?: boolean | null;
          processed_at?: string | null;
          stripe_event_id?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          canceled_at: string | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          plan_name: string;
          revenuecat_user_id: string | null;
          status: Database['public']['Enums']['subscription_status'];
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_end: string | null;
          trial_start: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_name: string;
          revenuecat_user_id?: string | null;
          status: Database['public']['Enums']['subscription_status'];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_name?: string;
          revenuecat_user_id?: string | null;
          status?: Database['public']['Enums']['subscription_status'];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          auth_user_id: string;
          created_at: string | null;
          deleted_at: string | null;
          email: string;
          full_name: string | null;
          gdpr_consent_date: string | null;
          id: string;
          last_seen_at: string | null;
          marketing_consent: boolean | null;
          mfa_enabled: boolean | null;
          mfa_methods: Json | null;
          subscription_expires_at: string | null;
          subscription_status:
            | Database['public']['Enums']['subscription_status']
            | null;
          trial_ends_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          auth_user_id: string;
          created_at?: string | null;
          deleted_at?: string | null;
          email: string;
          full_name?: string | null;
          gdpr_consent_date?: string | null;
          id?: string;
          last_seen_at?: string | null;
          marketing_consent?: boolean | null;
          mfa_enabled?: boolean | null;
          mfa_methods?: Json | null;
          subscription_expires_at?: string | null;
          subscription_status?:
            | Database['public']['Enums']['subscription_status']
            | null;
          trial_ends_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          auth_user_id?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          email?: string;
          full_name?: string | null;
          gdpr_consent_date?: string | null;
          id?: string;
          last_seen_at?: string | null;
          marketing_consent?: boolean | null;
          mfa_enabled?: boolean | null;
          mfa_methods?: Json | null;
          subscription_expires_at?: string | null;
          subscription_status?:
            | Database['public']['Enums']['subscription_status']
            | null;
          trial_ends_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      vaccinations: {
        Row: {
          administered_date: string;
          anonymous_session_id: string | null;
          batch_number: string | null;
          certificate_url: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          next_due_date: string | null;
          notes: string | null;
          pet_id: string;
          reminder_sent: boolean | null;
          updated_at: string | null;
          vaccine_name: string;
          veterinarian_id: string | null;
        };
        Insert: {
          administered_date: string;
          anonymous_session_id?: string | null;
          batch_number?: string | null;
          certificate_url?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          next_due_date?: string | null;
          notes?: string | null;
          pet_id: string;
          reminder_sent?: boolean | null;
          updated_at?: string | null;
          vaccine_name: string;
          veterinarian_id?: string | null;
        };
        Update: {
          administered_date?: string;
          anonymous_session_id?: string | null;
          batch_number?: string | null;
          certificate_url?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          next_due_date?: string | null;
          notes?: string | null;
          pet_id?: string;
          reminder_sent?: boolean | null;
          updated_at?: string | null;
          vaccine_name?: string;
          veterinarian_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vaccinations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vaccinations_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_family_member_limit: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      check_pet_limit: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      cleanup_incomplete_pets: {
        Args: { older_than?: unknown };
        Returns: number;
      };
      find_nearby_users: {
        Args:
          | { center_lat: number; center_lng: number; radius_meters?: number }
          | { center_lat: number; center_lng: number; radius_meters?: number };
        Returns: {
          distance_meters: number;
          user_id: string;
        }[];
      };
      find_potential_duplicate_pets: {
        Args: { pet_breed?: string; pet_name: string; pet_species: string };
        Returns: {
          breed: string;
          id: string;
          name: string;
          similarity_score: number;
          species: string;
        }[];
      };
      generate_anonymous_session_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      generate_invite_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_complete_pet_data: {
        Args: { pet_id: string };
        Returns: Json;
      };
      get_spatial_reference_system: {
        Args: { srid_input: number };
        Returns: {
          auth_name: string;
          auth_srid: number;
          proj4text: string;
          srid: number;
          srtext: string;
        }[];
      };
      get_user_subscription_tier: {
        Args: { user_uuid: string };
        Returns: string;
      };
      merge_duplicate_pets: {
        Args: { duplicate_pet_id: string; primary_pet_id: string };
        Returns: boolean;
      };
      sync_pet_after_onboarding: {
        Args: { onboarding_data: Json };
        Returns: string;
      };
      update_subscription_limits: {
        Args: { new_tier: string; user_uuid: string };
        Returns: boolean;
      };
      upsert_pet_data: {
        Args:
          | {
              p_birth_date: string;
              p_breed: string;
              p_color: string;
              p_gender: string;
              p_microchip_number: string;
              p_name: string;
              p_notes: string;
              p_pet_id: string;
              p_photo_url: string;
              p_species: string;
              p_weight: number;
            }
          | { pet_data: Json; pet_id: string };
        Returns: string;
      };
      user_can_access_family: {
        Args: { family_uuid: string };
        Returns: boolean;
      };
    };
    Enums: {
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
      pet_status: 'active' | 'deceased' | 'lost' | 'found';
      subscription_status:
        | 'free'
        | 'premium'
        | 'family'
        | 'cancelled'
        | 'expired';
      user_role: 'owner' | 'member' | 'viewer';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      audit_action: ['create', 'update', 'delete', 'view', 'export'],
      notification_type: [
        'vaccination_due',
        'medication_due',
        'appointment',
        'lost_pet_alert',
        'family_invite',
        'trial_ending',
        'payment_failed',
      ],
      payment_status: ['pending', 'completed', 'failed', 'refunded'],
      pet_status: ['active', 'deceased', 'lost', 'found'],
      subscription_status: [
        'free',
        'premium',
        'family',
        'cancelled',
        'expired',
      ],
      user_role: ['owner', 'member', 'viewer'],
    },
  },
} as const;
