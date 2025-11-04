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