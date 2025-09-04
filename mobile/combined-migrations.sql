-- TailTracker Complete Database Setup
-- Generated: 2025-09-03T14:26:41.019Z
-- Execute this entire script in Supabase SQL Editor

-- IMPORTANT: This script should be run with superuser privileges
-- Go to Supabase Dashboard > SQL Editor > New Query
-- Paste this entire content and click RUN


-- ============================================================
-- MIGRATION 1: 20250903000001_create_tailtracker_schema.sql
-- ============================================================

-- TailTracker Complete Database Schema
-- This migration creates all necessary tables, indexes, and policies for TailTracker

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE pet_species AS ENUM ('dog', 'cat', 'bird', 'other');
CREATE TYPE pet_gender AS ENUM ('male', 'female', 'unknown');
CREATE TYPE exercise_level AS ENUM ('low', 'moderate', 'high');
CREATE TYPE pet_status AS ENUM ('active', 'lost', 'found', 'inactive', 'deceased');
CREATE TYPE notification_type AS ENUM ('lost_pet', 'vaccination', 'medication', 'appointment', 'health_reminder');
CREATE TYPE alert_urgency AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'canceled', 'past_due');

-- User Profiles Table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  emergency_contact JSONB,
  preferences JSONB DEFAULT '{}',
  subscription_status subscription_status DEFAULT 'inactive',
  subscription_expires_at TIMESTAMPTZ,
  location_sharing_enabled BOOLEAN DEFAULT false,
  notification_preferences JSONB DEFAULT '{
    "push_notifications": true,
    "email_notifications": true,
    "sms_notifications": false,
    "lost_pet_alerts": true,
    "health_reminders": true
  }',
  privacy_settings JSONB DEFAULT '{
    "profile_visibility": "private",
    "pet_sharing": "family_only",
    "location_sharing": false
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pets Table
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species pet_species NOT NULL,
  breed TEXT,
  date_of_birth DATE,
  approximate_age TEXT,
  use_approximate_age BOOLEAN DEFAULT false,
  gender pet_gender,
  color_markings TEXT,
  weight DECIMAL(5,2),
  weight_unit TEXT DEFAULT 'kg',
  height DECIMAL(5,2),
  height_unit TEXT DEFAULT 'cm',
  photos TEXT[] DEFAULT '{}',
  microchip_id TEXT UNIQUE,
  registration_number TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  medical_conditions TEXT[] DEFAULT '{}',
  current_medications JSONB DEFAULT '[]',
  allergies TEXT[] DEFAULT '{}',
  last_vet_visit DATE,
  veterinarian JSONB,
  emergency_contact JSONB,
  personality_traits TEXT[] DEFAULT '{}',
  food_preferences JSONB DEFAULT '{}',
  favorite_activities TEXT[] DEFAULT '{}',
  exercise_needs exercise_level DEFAULT 'moderate',
  feeding_schedule TEXT,
  special_notes TEXT,
  status pet_status DEFAULT 'active',
  profile_completeness INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  sharing_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical Records Table
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  record_type TEXT NOT NULL, -- 'vaccination', 'checkup', 'surgery', 'medication', 'test_result'
  title TEXT NOT NULL,
  description TEXT,
  date_administered DATE NOT NULL,
  veterinarian JSONB,
  attachments TEXT[] DEFAULT '{}',
  notes TEXT,
  next_due_date DATE,
  reminder_enabled BOOLEAN DEFAULT true,
  cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vaccinations Table
CREATE TABLE vaccinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  vaccine_name TEXT NOT NULL,
  date_administered DATE NOT NULL,
  batch_number TEXT,
  veterinarian JSONB,
  next_due_date DATE,
  reminder_enabled BOOLEAN DEFAULT true,
  side_effects TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lost Pet Reports Table
CREATE TABLE lost_pet_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'found', 'canceled'
  last_seen_date TIMESTAMPTZ NOT NULL,
  last_seen_location GEOGRAPHY(POINT, 4326) NOT NULL,
  last_seen_address TEXT,
  description TEXT NOT NULL,
  additional_info TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  reward_amount DECIMAL(10,2),
  urgency alert_urgency DEFAULT 'medium',
  alert_radius INTEGER DEFAULT 5000, -- meters
  photos TEXT[] DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  found_date TIMESTAMPTZ,
  found_location GEOGRAPHY(POINT, 4326),
  found_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pet Sightings Table
CREATE TABLE pet_sightings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lost_pet_report_id UUID REFERENCES lost_pet_reports(id) ON DELETE CASCADE NOT NULL,
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sighting_date TIMESTAMPTZ NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT,
  description TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  contact_info JSONB,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family Sharing Table
CREATE TABLE family_sharing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permissions JSONB DEFAULT '{
    "view": true,
    "edit": false,
    "medical_records": true,
    "sharing": false
  }',
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'revoked'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pet_id, shared_with_user_id)
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  send_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Reminders Table
CREATE TABLE health_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL, -- 'vaccination', 'medication', 'checkup', 'grooming'
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  frequency_days INTEGER, -- for recurring reminders
  is_recurring BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  advance_notice_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Transactions Table
CREATE TABLE subscription_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  provider TEXT NOT NULL, -- 'revenuecat', 'stripe'
  provider_transaction_id TEXT,
  subscription_period_start TIMESTAMPTZ,
  subscription_period_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs Table (for audit trail)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_pets_microchip_id ON pets(microchip_id) WHERE microchip_id IS NOT NULL;
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_name_trgm ON pets USING gin(name gin_trgm_ops);

CREATE INDEX idx_medical_records_pet_id ON medical_records(pet_id);
CREATE INDEX idx_medical_records_date ON medical_records(date_administered);
CREATE INDEX idx_medical_records_type ON medical_records(record_type);
CREATE INDEX idx_medical_records_next_due ON medical_records(next_due_date) WHERE reminder_enabled = true;

CREATE INDEX idx_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX idx_vaccinations_next_due ON vaccinations(next_due_date) WHERE reminder_enabled = true;

CREATE INDEX idx_lost_pet_reports_status ON lost_pet_reports(status);
CREATE INDEX idx_lost_pet_reports_location ON lost_pet_reports USING gist(last_seen_location);
CREATE INDEX idx_lost_pet_reports_date ON lost_pet_reports(last_seen_date);
CREATE INDEX idx_lost_pet_reports_active ON lost_pet_reports(status) WHERE status = 'active';

CREATE INDEX idx_pet_sightings_report_id ON pet_sightings(lost_pet_report_id);
CREATE INDEX idx_pet_sightings_location ON pet_sightings USING gist(location);
CREATE INDEX idx_pet_sightings_date ON pet_sightings(sighting_date);

CREATE INDEX idx_family_sharing_pet_id ON family_sharing(pet_id);
CREATE INDEX idx_family_sharing_shared_with ON family_sharing(shared_with_user_id);
CREATE INDEX idx_family_sharing_status ON family_sharing(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_send_at ON notifications(send_at) WHERE is_sent = false;

CREATE INDEX idx_health_reminders_pet_id ON health_reminders(pet_id);
CREATE INDEX idx_health_reminders_due_date ON health_reminders(due_date) WHERE is_active = true AND is_completed = false;
CREATE INDEX idx_health_reminders_user_id ON health_reminders(user_id);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_pet_id ON activity_logs(pet_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vaccinations_updated_at BEFORE UPDATE ON vaccinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lost_pet_reports_updated_at BEFORE UPDATE ON lost_pet_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_family_sharing_updated_at BEFORE UPDATE ON family_sharing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_reminders_updated_at BEFORE UPDATE ON health_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate pet profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness(pet_record pets)
RETURNS INTEGER AS $$
DECLARE
    completeness INTEGER := 0;
    total_fields INTEGER := 20;
BEGIN
    -- Basic information (required fields)
    IF pet_record.name IS NOT NULL AND pet_record.name != '' THEN completeness := completeness + 5; END IF;
    IF pet_record.species IS NOT NULL THEN completeness := completeness + 5; END IF;
    
    -- Physical details
    IF pet_record.breed IS NOT NULL AND pet_record.breed != '' THEN completeness := completeness + 3; END IF;
    IF pet_record.date_of_birth IS NOT NULL OR (pet_record.approximate_age IS NOT NULL AND pet_record.approximate_age != '') THEN completeness := completeness + 4; END IF;
    IF pet_record.gender IS NOT NULL THEN completeness := completeness + 2; END IF;
    IF pet_record.color_markings IS NOT NULL AND pet_record.color_markings != '' THEN completeness := completeness + 3; END IF;
    IF pet_record.weight IS NOT NULL THEN completeness := completeness + 3; END IF;
    
    -- Photos
    IF array_length(pet_record.photos, 1) > 0 THEN completeness := completeness + 8; END IF;
    
    -- Official records
    IF pet_record.microchip_id IS NOT NULL AND pet_record.microchip_id != '' THEN completeness := completeness + 5; END IF;
    IF pet_record.registration_number IS NOT NULL AND pet_record.registration_number != '' THEN completeness := completeness + 3; END IF;
    
    -- Health information
    IF pet_record.veterinarian IS NOT NULL THEN completeness := completeness + 4; END IF;
    IF pet_record.emergency_contact IS NOT NULL THEN completeness := completeness + 3; END IF;
    IF array_length(pet_record.medical_conditions, 1) > 0 OR array_length(pet_record.allergies, 1) > 0 THEN completeness := completeness + 3; END IF;
    
    -- Personality and care
    IF array_length(pet_record.personality_traits, 1) > 0 THEN completeness := completeness + 2; END IF;
    IF pet_record.exercise_needs IS NOT NULL THEN completeness := completeness + 2; END IF;
    IF pet_record.feeding_schedule IS NOT NULL AND pet_record.feeding_schedule != '' THEN completeness := completeness + 2; END IF;
    
    -- Additional details
    IF array_length(pet_record.favorite_activities, 1) > 0 THEN completeness := completeness + 2; END IF;
    IF pet_record.special_notes IS NOT NULL AND pet_record.special_notes != '' THEN completeness := completeness + 2; END IF;
    
    -- Insurance information
    IF pet_record.insurance_provider IS NOT NULL AND pet_record.insurance_provider != '' THEN completeness := completeness + 3; END IF;
    
    -- Last vet visit
    IF pet_record.last_vet_visit IS NOT NULL THEN completeness := completeness + 2; END IF;

    RETURN LEAST(completeness, 100);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update profile completeness
CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completeness := calculate_profile_completeness(NEW);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_completeness
    BEFORE INSERT OR UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION update_profile_completeness();

-- END OF 20250903000001_create_tailtracker_schema.sql
-- ============================================================


-- ============================================================
-- MIGRATION 2: 20250903000002_setup_rls_policies.sql
-- ============================================================

-- TailTracker Row Level Security Policies
-- This migration creates comprehensive RLS policies for all tables

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_pet_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- USER PROFILES POLICIES
-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- PETS POLICIES
-- Users can access their own pets and pets shared with them
CREATE POLICY "Users can view own pets" ON pets
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM family_sharing 
      WHERE family_sharing.pet_id = pets.id 
      AND family_sharing.shared_with_user_id = auth.uid() 
      AND family_sharing.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own pets" ON pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pets" ON pets
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM family_sharing 
      WHERE family_sharing.pet_id = pets.id 
      AND family_sharing.shared_with_user_id = auth.uid() 
      AND family_sharing.status = 'accepted'
      AND (family_sharing.permissions->>'edit')::boolean = true
    )
  );

CREATE POLICY "Users can delete own pets" ON pets
  FOR DELETE USING (auth.uid() = user_id);

-- Public access to lost pets for community search
CREATE POLICY "Public can view lost pets" ON pets
  FOR SELECT USING (status = 'lost' AND is_public = true);

-- MEDICAL RECORDS POLICIES
CREATE POLICY "Users can view medical records for accessible pets" ON medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = medical_records.pet_id 
      AND (
        pets.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM family_sharing 
          WHERE family_sharing.pet_id = pets.id 
          AND family_sharing.shared_with_user_id = auth.uid() 
          AND family_sharing.status = 'accepted'
          AND (family_sharing.permissions->>'medical_records')::boolean = true
        )
      )
    )
  );

CREATE POLICY "Users can insert medical records for own pets" ON medical_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = medical_records.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update medical records for accessible pets" ON medical_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = medical_records.pet_id 
      AND (
        pets.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM family_sharing 
          WHERE family_sharing.pet_id = pets.id 
          AND family_sharing.shared_with_user_id = auth.uid() 
          AND family_sharing.status = 'accepted'
          AND (family_sharing.permissions->>'edit')::boolean = true
        )
      )
    )
  );

CREATE POLICY "Users can delete medical records for own pets" ON medical_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = medical_records.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

-- VACCINATIONS POLICIES
CREATE POLICY "Users can view vaccinations for accessible pets" ON vaccinations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = vaccinations.pet_id 
      AND (
        pets.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM family_sharing 
          WHERE family_sharing.pet_id = pets.id 
          AND family_sharing.shared_with_user_id = auth.uid() 
          AND family_sharing.status = 'accepted'
          AND (family_sharing.permissions->>'medical_records')::boolean = true
        )
      )
    )
  );

CREATE POLICY "Users can insert vaccinations for own pets" ON vaccinations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = vaccinations.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vaccinations for accessible pets" ON vaccinations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = vaccinations.pet_id 
      AND (
        pets.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM family_sharing 
          WHERE family_sharing.pet_id = pets.id 
          AND family_sharing.shared_with_user_id = auth.uid() 
          AND family_sharing.status = 'accepted'
          AND (family_sharing.permissions->>'edit')::boolean = true
        )
      )
    )
  );

CREATE POLICY "Users can delete vaccinations for own pets" ON vaccinations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = vaccinations.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

-- LOST PET REPORTS POLICIES
CREATE POLICY "Users can view own lost pet reports" ON lost_pet_reports
  FOR SELECT USING (user_id = auth.uid());

-- Public can view active lost pet reports for community assistance
CREATE POLICY "Public can view active lost pet reports" ON lost_pet_reports
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can insert own lost pet reports" ON lost_pet_reports
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = lost_pet_reports.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own lost pet reports" ON lost_pet_reports
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own lost pet reports" ON lost_pet_reports
  FOR DELETE USING (user_id = auth.uid());

-- PET SIGHTINGS POLICIES
-- Anyone can view sightings for active lost pet reports
CREATE POLICY "Public can view sightings for active reports" ON pet_sightings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lost_pet_reports 
      WHERE lost_pet_reports.id = pet_sightings.lost_pet_report_id 
      AND lost_pet_reports.status = 'active'
    )
  );

-- Users can report sightings for any active lost pet
CREATE POLICY "Users can report sightings" ON pet_sightings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lost_pet_reports 
      WHERE lost_pet_reports.id = pet_sightings.lost_pet_report_id 
      AND lost_pet_reports.status = 'active'
    )
  );

-- Pet owners can verify sightings of their pets
CREATE POLICY "Pet owners can update sightings" ON pet_sightings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lost_pet_reports 
      JOIN pets ON pets.id = lost_pet_reports.pet_id
      WHERE lost_pet_reports.id = pet_sightings.lost_pet_report_id 
      AND pets.user_id = auth.uid()
    )
  );

-- FAMILY SHARING POLICIES
CREATE POLICY "Users can view sharing involving them" ON family_sharing
  FOR SELECT USING (
    owner_user_id = auth.uid() 
    OR shared_with_user_id = auth.uid()
  );

CREATE POLICY "Pet owners can create sharing invites" ON family_sharing
  FOR INSERT WITH CHECK (
    owner_user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = family_sharing.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Involved users can update sharing status" ON family_sharing
  FOR UPDATE USING (
    owner_user_id = auth.uid() 
    OR shared_with_user_id = auth.uid()
  );

CREATE POLICY "Pet owners can delete sharing" ON family_sharing
  FOR DELETE USING (owner_user_id = auth.uid());

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true); -- System service can create notifications

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- HEALTH REMINDERS POLICIES
CREATE POLICY "Users can view reminders for accessible pets" ON health_reminders
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = health_reminders.pet_id 
      AND pets.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM family_sharing 
      WHERE family_sharing.pet_id = health_reminders.pet_id 
      AND family_sharing.shared_with_user_id = auth.uid() 
      AND family_sharing.status = 'accepted'
      AND (family_sharing.permissions->>'medical_records')::boolean = true
    )
  );

CREATE POLICY "Users can create reminders for own pets" ON health_reminders
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = health_reminders.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own reminders" ON health_reminders
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reminders" ON health_reminders
  FOR DELETE USING (user_id = auth.uid());

-- SUBSCRIPTION TRANSACTIONS POLICIES
CREATE POLICY "Users can view own transactions" ON subscription_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert transactions" ON subscription_transactions
  FOR INSERT WITH CHECK (true); -- Payment system can create transactions

-- ACTIVITY LOGS POLICIES
-- Users can view logs related to their pets and activities
CREATE POLICY "Users can view relevant activity logs" ON activity_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = activity_logs.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true); -- System can log all activities

-- Create function to check if user is premium subscriber
CREATE OR REPLACE FUNCTION is_premium_user(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = user_uuid 
    AND subscription_status = 'active'
    AND subscription_expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check family sharing permissions
CREATE OR REPLACE FUNCTION has_pet_permission(pet_uuid UUID, permission_type TEXT DEFAULT 'view')
RETURNS BOOLEAN AS $$
DECLARE
  user_uuid UUID := auth.uid();
BEGIN
  -- Check if user owns the pet
  IF EXISTS (
    SELECT 1 FROM pets 
    WHERE id = pet_uuid AND user_id = user_uuid
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user has shared access with required permission
  RETURN EXISTS (
    SELECT 1 FROM family_sharing 
    WHERE pet_id = pet_uuid 
    AND shared_with_user_id = user_uuid 
    AND status = 'accepted'
    AND (permissions->>permission_type)::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to find nearby users for lost pet alerts
CREATE OR REPLACE FUNCTION find_nearby_users(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  user_id UUID,
  push_token TEXT,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    up.user_id,
    up.notification_preferences->>'push_token' as push_token,
    ST_Distance(
      ST_Point(center_lng, center_lat)::geography,
      ST_Point(
        (lpr.last_seen_location).longitude,
        (lpr.last_seen_location).latitude
      )::geography
    ) as distance_meters
  FROM user_profiles up
  JOIN pets p ON p.user_id = up.user_id
  JOIN lost_pet_reports lpr ON true -- Cross join to get all combinations
  WHERE up.location_sharing_enabled = true
    AND up.notification_preferences->>'lost_pet_alerts' = 'true'
    AND ST_DWithin(
      ST_Point(center_lng, center_lat)::geography,
      ST_Point(
        (lpr.last_seen_location).longitude,
        (lpr.last_seen_location).latitude
      )::geography,
      radius_meters
    )
    AND up.user_id != auth.uid() -- Exclude the pet owner
  ORDER BY distance_meters
  LIMIT 50; -- Limit to avoid spam
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log user activities
CREATE OR REPLACE FUNCTION log_user_activity(
  action_name TEXT,
  resource_type_name TEXT,
  resource_uuid UUID DEFAULT NULL,
  old_data JSONB DEFAULT NULL,
  new_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    pet_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    CASE WHEN resource_type_name = 'pet' THEN resource_uuid ELSE NULL END,
    action_name,
    resource_type_name,
    resource_uuid,
    old_data,
    new_data,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically log activities
CREATE OR REPLACE FUNCTION trigger_log_activity()
RETURNS TRIGGER AS $$
BEGIN
  CASE TG_OP
    WHEN 'INSERT' THEN
      PERFORM log_user_activity(
        'create',
        TG_TABLE_NAME,
        NEW.id,
        NULL,
        to_jsonb(NEW)
      );
      RETURN NEW;
    WHEN 'UPDATE' THEN
      PERFORM log_user_activity(
        'update',
        TG_TABLE_NAME,
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW)
      );
      RETURN NEW;
    WHEN 'DELETE' THEN
      PERFORM log_user_activity(
        'delete',
        TG_TABLE_NAME,
        OLD.id,
        to_jsonb(OLD),
        NULL
      );
      RETURN OLD;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Apply activity logging triggers to key tables
CREATE TRIGGER pets_activity_log 
  AFTER INSERT OR UPDATE OR DELETE ON pets
  FOR EACH ROW EXECUTE FUNCTION trigger_log_activity();

CREATE TRIGGER medical_records_activity_log 
  AFTER INSERT OR UPDATE OR DELETE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION trigger_log_activity();

CREATE TRIGGER lost_pet_reports_activity_log 
  AFTER INSERT OR UPDATE OR DELETE ON lost_pet_reports
  FOR EACH ROW EXECUTE FUNCTION trigger_log_activity();

CREATE TRIGGER family_sharing_activity_log 
  AFTER INSERT OR UPDATE OR DELETE ON family_sharing
  FOR EACH ROW EXECUTE FUNCTION trigger_log_activity();

-- END OF 20250903000002_setup_rls_policies.sql
-- ============================================================


-- ============================================================
-- MIGRATION 3: 20250903000003_setup_auth_triggers.sql
-- ============================================================

-- TailTracker Authentication Setup
-- This migration sets up automatic user profile creation and auth triggers

-- Function to create user profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    email,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  );
  
  -- Log the user creation activity
  INSERT INTO public.activity_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    new_values,
    created_at
  )
  VALUES (
    NEW.id,
    'create',
    'user_profile',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'signup_method', COALESCE(NEW.raw_user_meta_data->>'provider', 'email')
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user profile updates
CREATE OR REPLACE FUNCTION public.handle_user_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  -- Log profile completeness changes
  IF OLD.preferences IS DISTINCT FROM NEW.preferences 
     OR OLD.privacy_settings IS DISTINCT FROM NEW.privacy_settings
     OR OLD.notification_preferences IS DISTINCT FROM NEW.notification_preferences THEN
    
    INSERT INTO public.activity_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      created_at
    )
    VALUES (
      NEW.user_id,
      'update_preferences',
      'user_profile',
      NEW.id,
      jsonb_build_object(
        'preferences', OLD.preferences,
        'privacy_settings', OLD.privacy_settings,
        'notification_preferences', OLD.notification_preferences
      ),
      jsonb_build_object(
        'preferences', NEW.preferences,
        'privacy_settings', NEW.privacy_settings,
        'notification_preferences', NEW.notification_preferences
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user profile updates
CREATE TRIGGER on_user_profile_update
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_update();

-- Function to handle subscription status changes
CREATE OR REPLACE FUNCTION public.handle_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user profile subscription status
  UPDATE public.user_profiles 
  SET 
    subscription_status = CASE 
      WHEN NEW.status = 'completed' THEN 'active'::subscription_status
      WHEN NEW.status = 'failed' OR NEW.status = 'refunded' THEN 'inactive'::subscription_status
      ELSE OLD.subscription_status
    END,
    subscription_expires_at = CASE
      WHEN NEW.status = 'completed' THEN NEW.subscription_period_end
      ELSE subscription_expires_at
    END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Create notification for subscription changes
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    )
    VALUES (
      NEW.user_id,
      'subscription'::notification_type,
      'Premium Activated!',
      'Your TailTracker Premium subscription is now active. Enjoy all premium features!',
      jsonb_build_object(
        'subscription_id', NEW.id,
        'product_id', NEW.product_id,
        'expires_at', NEW.subscription_period_end
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for subscription transaction changes
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON public.subscription_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_subscription_change();

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS VOID AS $$
BEGIN
  -- Delete old notifications (older than 30 days)
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_read = true;
  
  -- Delete expired family sharing invitations (older than 7 days)
  DELETE FROM public.family_sharing 
  WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '7 days';
  
  -- Delete old activity logs (older than 90 days)
  DELETE FROM public.activity_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Update expired subscriptions
  UPDATE public.user_profiles 
  SET subscription_status = 'inactive'::subscription_status
  WHERE subscription_status = 'active'::subscription_status
  AND subscription_expires_at < NOW();
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible pets (for API)
CREATE OR REPLACE FUNCTION public.get_user_accessible_pets(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  name TEXT,
  species pet_species,
  breed TEXT,
  photos TEXT[],
  status pet_status,
  profile_completeness INTEGER,
  is_owner BOOLEAN,
  shared_permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.species,
    p.breed,
    p.photos,
    p.status,
    p.profile_completeness,
    (p.user_id = user_uuid) as is_owner,
    CASE 
      WHEN p.user_id = user_uuid THEN 
        '{"view": true, "edit": true, "medical_records": true, "sharing": true}'::jsonb
      ELSE 
        COALESCE(fs.permissions, '{}'::jsonb)
    END as shared_permissions
  FROM public.pets p
  LEFT JOIN public.family_sharing fs ON (
    fs.pet_id = p.id 
    AND fs.shared_with_user_id = user_uuid 
    AND fs.status = 'accepted'
  )
  WHERE p.user_id = user_uuid 
     OR fs.id IS NOT NULL
  ORDER BY 
    (p.user_id = user_uuid) DESC, -- Owner pets first
    p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get nearby lost pets for map view
CREATE OR REPLACE FUNCTION public.get_nearby_lost_pets(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_meters INTEGER DEFAULT 10000
)
RETURNS TABLE (
  id UUID,
  pet_id UUID,
  pet_name TEXT,
  pet_species pet_species,
  pet_photos TEXT[],
  last_seen_date TIMESTAMPTZ,
  last_seen_location GEOGRAPHY,
  last_seen_address TEXT,
  description TEXT,
  urgency alert_urgency,
  reward_amount DECIMAL,
  contact_phone TEXT,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lpr.id,
    lpr.pet_id,
    p.name as pet_name,
    p.species as pet_species,
    p.photos as pet_photos,
    lpr.last_seen_date,
    lpr.last_seen_location,
    lpr.last_seen_address,
    lpr.description,
    lpr.urgency,
    lpr.reward_amount,
    lpr.contact_phone,
    ST_Distance(
      ST_Point(center_lng, center_lat)::geography,
      lpr.last_seen_location
    ) as distance_meters
  FROM public.lost_pet_reports lpr
  JOIN public.pets p ON p.id = lpr.pet_id
  WHERE lpr.status = 'active'
    AND lpr.is_resolved = false
    AND ST_DWithin(
      ST_Point(center_lng, center_lat)::geography,
      lpr.last_seen_location,
      radius_meters
    )
  ORDER BY distance_meters ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform action on pet
CREATE OR REPLACE FUNCTION public.user_can_access_pet(
  pet_uuid UUID,
  required_permission TEXT DEFAULT 'view',
  user_uuid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN := false;
  has_permission BOOLEAN := false;
BEGIN
  -- Check if user owns the pet
  SELECT (user_id = user_uuid) INTO is_owner
  FROM public.pets 
  WHERE id = pet_uuid;
  
  -- Owner has all permissions
  IF is_owner THEN
    RETURN true;
  END IF;
  
  -- Check family sharing permissions
  SELECT (permissions->>required_permission)::boolean INTO has_permission
  FROM public.family_sharing 
  WHERE pet_id = pet_uuid 
    AND shared_with_user_id = user_uuid 
    AND status = 'accepted';
  
  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification to user
CREATE OR REPLACE FUNCTION public.send_notification(
  target_user_id UUID,
  notification_type_param notification_type,
  title_param TEXT,
  message_param TEXT,
  data_param JSONB DEFAULT '{}'::jsonb,
  send_at_param TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data,
    send_at,
    created_at
  )
  VALUES (
    target_user_id,
    notification_type_param,
    title_param,
    message_param,
    data_param,
    send_at_param,
    NOW()
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create family sharing invitation
CREATE OR REPLACE FUNCTION public.create_family_sharing_invite(
  pet_uuid UUID,
  target_email TEXT,
  permissions_param JSONB DEFAULT '{"view": true, "edit": false, "medical_records": true, "sharing": false}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  target_user_id UUID;
  sharing_id UUID;
  pet_name TEXT;
  owner_name TEXT;
BEGIN
  -- Get target user ID from email
  SELECT au.id INTO target_user_id
  FROM auth.users au
  WHERE au.email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;
  
  -- Get pet and owner information
  SELECT p.name, up.full_name INTO pet_name, owner_name
  FROM public.pets p
  JOIN public.user_profiles up ON up.user_id = p.user_id
  WHERE p.id = pet_uuid AND p.user_id = auth.uid();
  
  IF pet_name IS NULL THEN
    RAISE EXCEPTION 'Pet not found or access denied';
  END IF;
  
  -- Create family sharing record
  INSERT INTO public.family_sharing (
    pet_id,
    owner_user_id,
    shared_with_user_id,
    permissions,
    status,
    expires_at,
    created_at
  )
  VALUES (
    pet_uuid,
    auth.uid(),
    target_user_id,
    permissions_param,
    'pending',
    NOW() + INTERVAL '7 days', -- Invitation expires in 7 days
    NOW()
  )
  RETURNING id INTO sharing_id;
  
  -- Send notification to target user
  PERFORM public.send_notification(
    target_user_id,
    'family_sharing',
    'Pet Sharing Invitation',
    format('%s invited you to help manage %s', owner_name, pet_name),
    jsonb_build_object(
      'sharing_id', sharing_id,
      'pet_id', pet_uuid,
      'pet_name', pet_name,
      'owner_name', owner_name,
      'permissions', permissions_param
    )
  );
  
  RETURN sharing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to respond to family sharing invitation
CREATE OR REPLACE FUNCTION public.respond_to_sharing_invite(
  sharing_uuid UUID,
  response TEXT -- 'accepted' or 'declined'
)
RETURNS VOID AS $$
DECLARE
  pet_name TEXT;
  owner_user_id UUID;
  shared_user_name TEXT;
BEGIN
  -- Validate response
  IF response NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Invalid response. Must be "accepted" or "declined"';
  END IF;
  
  -- Get sharing information
  SELECT 
    p.name,
    fs.owner_user_id,
    up.full_name
  INTO pet_name, owner_user_id, shared_user_name
  FROM public.family_sharing fs
  JOIN public.pets p ON p.id = fs.pet_id
  JOIN public.user_profiles up ON up.user_id = fs.shared_with_user_id
  WHERE fs.id = sharing_uuid 
    AND fs.shared_with_user_id = auth.uid()
    AND fs.status = 'pending';
  
  IF pet_name IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;
  
  -- Update sharing status
  UPDATE public.family_sharing 
  SET 
    status = response,
    updated_at = NOW()
  WHERE id = sharing_uuid;
  
  -- Notify pet owner of response
  PERFORM public.send_notification(
    owner_user_id,
    'family_sharing',
    format('Sharing Invitation %s', CASE response WHEN 'accepted' THEN 'Accepted' ELSE 'Declined' END),
    format('%s %s your invitation to help manage %s', 
           shared_user_name, 
           CASE response WHEN 'accepted' THEN 'accepted' ELSE 'declined' END, 
           pet_name),
    jsonb_build_object(
      'sharing_id', sharing_uuid,
      'response', response,
      'pet_name', pet_name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- END OF 20250903000003_setup_auth_triggers.sql
-- ============================================================


-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Verify installation
SELECT 'TailTracker database setup complete!' as message;

-- Check table counts
SELECT 
  'user_profiles' as table_name,
  count(*) as record_count
FROM user_profiles
UNION ALL
SELECT 
  'pets' as table_name,
  count(*) as record_count  
FROM pets
UNION ALL
SELECT
  'medical_records' as table_name,
  count(*) as record_count
FROM medical_records;
