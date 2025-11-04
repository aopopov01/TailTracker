-- TailTracker Database Schema and Initial Data
-- This file sets up the complete database structure for TailTracker

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  push_token TEXT,
  location GEOGRAPHY(POINT, 4326),
  notification_preferences JSONB DEFAULT '{
    "lost_pet_alerts": true,
    "care_reminders": true,
    "family_updates": true,
    "marketing": false
  }'::jsonb,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'family')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pets table
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50) NOT NULL,
  breed VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'unknown')),
  weight DECIMAL(5,2),
  color VARCHAR(50),
  microchip_id VARCHAR(50) UNIQUE,
  photos TEXT[] DEFAULT '{}',
  medical_conditions TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  special_needs TEXT,
  status VARCHAR(20) DEFAULT 'safe' CHECK (status IN ('safe', 'lost', 'found', 'deceased')),
  last_seen_location GEOGRAPHY(POINT, 4326),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vaccinations table
CREATE TABLE vaccinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  vaccine_name VARCHAR(100) NOT NULL,
  administered_date DATE NOT NULL,
  next_due_date DATE,
  veterinarian_name VARCHAR(100),
  veterinarian_clinic VARCHAR(150),
  batch_number VARCHAR(50),
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Care reminders table
CREATE TABLE care_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('vaccination', 'medication', 'grooming', 'vet_checkup', 'custom')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  repeat_interval VARCHAR(20) CHECK (repeat_interval IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lost pet alerts table
CREATE TABLE lost_pet_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  pet_name VARCHAR(100) NOT NULL,
  species VARCHAR(50) NOT NULL,
  breed VARCHAR(100),
  last_seen_location GEOGRAPHY(POINT, 4326) NOT NULL,
  last_seen_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT NOT NULL,
  contact_phone VARCHAR(20),
  reward_amount DECIMAL(10,2),
  reward_currency VARCHAR(3) DEFAULT 'USD',
  photo_url TEXT,
  is_found BOOLEAN DEFAULT false,
  created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  found_at TIMESTAMP WITH TIME ZONE
);

-- Sharing tokens table for QR code sharing
CREATE TABLE sharing_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(64) UNIQUE NOT NULL,
  owner_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared access table to track who accessed what
CREATE TABLE shared_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID REFERENCES sharing_tokens(id) ON DELETE CASCADE NOT NULL,
  guest_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  owner_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(token_id, guest_user_id)
);

-- Notifications table for tracking sent notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  recipients UUID[] NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'partial_failure')),
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family connections table
CREATE TABLE family_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  family_member_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  relationship VARCHAR(50), -- 'spouse', 'child', 'parent', 'other'
  permissions JSONB DEFAULT '{
    "view_pets": true,
    "edit_pets": false,
    "manage_care": false,
    "emergency_contact": true
  }'::jsonb,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(primary_user_id, family_member_id)
);

-- Storage buckets (configured in Supabase Storage)
-- pet-photos: Public bucket for pet profile photos
-- documents: Private bucket for vaccination records, medical documents
-- qr-codes: Public bucket for generated QR codes

-- Indexes for performance
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX idx_vaccinations_next_due ON vaccinations(next_due_date);
CREATE INDEX idx_care_reminders_pet_id ON care_reminders(pet_id);
CREATE INDEX idx_care_reminders_user_id ON care_reminders(user_id);
CREATE INDEX idx_care_reminders_due_date ON care_reminders(due_date);
CREATE INDEX idx_lost_pets_location ON lost_pet_alerts USING GIST(last_seen_location);
CREATE INDEX idx_lost_pets_created_by ON lost_pet_alerts(created_by);
CREATE INDEX idx_sharing_tokens_token ON sharing_tokens(token);
CREATE INDEX idx_sharing_tokens_owner ON sharing_tokens(owner_user_id);
CREATE INDEX idx_notifications_recipients ON notifications USING GIN(recipients);
CREATE INDEX idx_user_profiles_location ON user_profiles USING GIST(location);

-- Row Level Security Policies

-- User profiles: Users can only see and edit their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Pets: Users can only see their own pets
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pets" ON pets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pets" ON pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pets" ON pets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pets" ON pets
  FOR DELETE USING (auth.uid() = user_id);

-- Allow viewing public pets for lost pet alerts
CREATE POLICY "Anyone can view lost pets" ON pets
  FOR SELECT USING (status = 'lost' OR is_public = true);

-- Vaccinations: Users can only see vaccinations for their pets
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pet vaccinations" ON vaccinations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM pets WHERE pets.id = vaccinations.pet_id
    )
  );

CREATE POLICY "Users can insert own pet vaccinations" ON vaccinations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM pets WHERE pets.id = vaccinations.pet_id
    )
  );

CREATE POLICY "Users can update own pet vaccinations" ON vaccinations
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM pets WHERE pets.id = vaccinations.pet_id
    )
  );

CREATE POLICY "Users can delete own pet vaccinations" ON vaccinations
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM pets WHERE pets.id = vaccinations.pet_id
    )
  );

-- Care reminders: Users can only see their own reminders
ALTER TABLE care_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own care reminders" ON care_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own care reminders" ON care_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own care reminders" ON care_reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own care reminders" ON care_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Lost pet alerts: Public read access for community alerts
ALTER TABLE lost_pet_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lost pet alerts" ON lost_pet_alerts
  FOR SELECT USING (true);

CREATE POLICY "Users can create alerts for own pets" ON lost_pet_alerts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own alerts" ON lost_pet_alerts
  FOR UPDATE USING (auth.uid() = created_by);

-- Sharing tokens: Users can only see their own tokens
ALTER TABLE sharing_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sharing tokens" ON sharing_tokens
  FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create own sharing tokens" ON sharing_tokens
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

-- Shared access: Users can see access they granted or received
ALTER TABLE shared_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shared access they granted or received" ON shared_access
  FOR SELECT USING (auth.uid() = owner_user_id OR auth.uid() = guest_user_id);

-- Notifications: Users can see notifications sent to them
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications sent to them" ON notifications
  FOR SELECT USING (auth.uid() = ANY(recipients));

-- Family connections: Users can see their own connections
ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own family connections" ON family_connections
  FOR SELECT USING (auth.uid() = primary_user_id OR auth.uid() = family_member_id);

CREATE POLICY "Users can create family connections" ON family_connections
  FOR INSERT WITH CHECK (auth.uid() = primary_user_id);

CREATE POLICY "Users can update own family connections" ON family_connections
  FOR UPDATE USING (auth.uid() = primary_user_id OR auth.uid() = family_member_id);

-- Functions for geolocation queries
CREATE OR REPLACE FUNCTION find_nearby_users(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_meters INTEGER
)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR,
  push_token TEXT,
  distance_km FLOAT
)
LANGUAGE SQL
AS $$
  SELECT 
    up.id,
    up.full_name,
    up.push_token,
    ST_Distance(
      up.location::geometry,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geometry
    ) / 1000 AS distance_km
  FROM user_profiles up
  WHERE up.location IS NOT NULL
    AND up.push_token IS NOT NULL
    AND ST_DWithin(
      up.location::geometry,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geometry,
      radius_meters
    )
  ORDER BY distance_km;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vaccinations_updated_at
  BEFORE UPDATE ON vaccinations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_reminders_updated_at
  BEFORE UPDATE ON care_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_connections_updated_at
  BEFORE UPDATE ON family_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Initial seed data (optional for development)
-- Note: In production, this would be handled by user registration

-- Sample pet species and breeds for reference
CREATE TABLE IF NOT EXISTS species_breeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  species VARCHAR(50) NOT NULL,
  breed VARCHAR(100) NOT NULL,
  UNIQUE(species, breed)
);

-- Common dog breeds
INSERT INTO species_breeds (species, breed) VALUES
  ('Dog', 'Golden Retriever'),
  ('Dog', 'Labrador Retriever'),
  ('Dog', 'German Shepherd'),
  ('Dog', 'Bulldog'),
  ('Dog', 'Poodle'),
  ('Dog', 'Beagle'),
  ('Dog', 'Rottweiler'),
  ('Dog', 'Yorkshire Terrier'),
  ('Dog', 'Dachshund'),
  ('Dog', 'Siberian Husky'),
  ('Dog', 'Mixed Breed');

-- Common cat breeds
INSERT INTO species_breeds (species, breed) VALUES
  ('Cat', 'Persian'),
  ('Cat', 'Maine Coon'),
  ('Cat', 'British Shorthair'),
  ('Cat', 'Ragdoll'),
  ('Cat', 'Bengal'),
  ('Cat', 'Abyssinian'),
  ('Cat', 'Birman'),
  ('Cat', 'Oriental Shorthair'),
  ('Cat', 'American Shorthair'),
  ('Cat', 'Scottish Fold'),
  ('Cat', 'Domestic Shorthair'),
  ('Cat', 'Domestic Longhair');

-- Other common pets
INSERT INTO species_breeds (species, breed) VALUES
  ('Bird', 'Parakeet'),
  ('Bird', 'Cockatiel'),
  ('Bird', 'Canary'),
  ('Bird', 'Lovebird'),
  ('Rabbit', 'Holland Lop'),
  ('Rabbit', 'Netherland Dwarf'),
  ('Rabbit', 'Rex'),
  ('Guinea Pig', 'American'),
  ('Guinea Pig', 'Peruvian'),
  ('Hamster', 'Syrian'),
  ('Hamster', 'Dwarf');