-- Migration 001: Initialize TailTracker Wellness Platform
-- Removes ALL GPS tracking infrastructure and creates comprehensive health & care management system
-- Version: 2.0.0-wellness
-- Date: 2025-01-01

BEGIN;

-- Drop any existing GPS-related tables and extensions (cleanup from GPS version)
DROP TABLE IF EXISTS lost_pets CASCADE;
DROP TABLE IF EXISTS geofences CASCADE;
DROP TABLE IF EXISTS location_history CASCADE;
DROP TABLE IF EXISTS safe_zones CASCADE;
DROP EXTENSION IF EXISTS postgis CASCADE;

-- Enable required extensions for wellness platform (NO PostGIS)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types for wellness platform
CREATE TYPE user_role AS ENUM ('owner', 'caregiver', 'viewer', 'veterinarian');
CREATE TYPE subscription_status AS ENUM ('free', 'premium', 'family', 'cancelled', 'expired', 'past_due', 'unpaid');
CREATE TYPE pet_status AS ENUM ('active', 'inactive', 'deceased', 'adopted_out');
CREATE TYPE health_status AS ENUM ('excellent', 'good', 'fair', 'concerning', 'critical');
CREATE TYPE activity_level AS ENUM ('very_low', 'low', 'moderate', 'high', 'very_high');
CREATE TYPE care_task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'cancelled');
CREATE TYPE care_task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE care_task_type AS ENUM ('feeding', 'medication', 'exercise', 'grooming', 'vet_visit', 'training', 'custom');
CREATE TYPE notification_type AS ENUM (
  'health_alert', 'medication_reminder', 'feeding_reminder', 'exercise_reminder', 
  'vet_appointment', 'vaccination_due', 'weight_milestone', 'behavioral_note',
  'care_task_assigned', 'care_task_overdue', 'family_update', 'wellness_insight'
);
CREATE TYPE health_metric_type AS ENUM ('weight', 'temperature', 'heart_rate', 'respiratory_rate', 'activity_minutes', 'sleep_hours', 'water_intake', 'food_intake');
CREATE TYPE behavioral_category AS ENUM ('feeding', 'sleeping', 'exercise', 'social', 'training', 'anxiety', 'aggression', 'other');
CREATE TYPE emergency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE wellness_trend AS ENUM ('improving', 'stable', 'declining', 'concerning');

-- Core Users table with enhanced wellness features
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    country_code VARCHAR(2),
    
    -- Subscription and permissions
    subscription_status subscription_status DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    
    -- Professional credentials (for veterinarians)
    professional_license VARCHAR(100),
    veterinary_specialization VARCHAR(255),
    clinic_affiliation VARCHAR(255),
    
    -- Privacy and compliance
    gdpr_consent_date TIMESTAMP WITH TIME ZONE,
    marketing_consent BOOLEAN DEFAULT false,
    data_sharing_consent BOOLEAN DEFAULT false,
    
    -- Activity tracking
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Families/Households table for comprehensive care coordination
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Family settings
    invite_code VARCHAR(12) UNIQUE NOT NULL,
    max_members INTEGER DEFAULT 2, -- Free: 2, Premium: 8 members
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_units VARCHAR(10) DEFAULT 'metric',
    
    -- Care coordination settings
    care_notifications_enabled BOOLEAN DEFAULT true,
    shared_calendar_enabled BOOLEAN DEFAULT true,
    photo_sharing_enabled BOOLEAN DEFAULT true,
    wellness_reports_enabled BOOLEAN DEFAULT true,
    
    -- Emergency contacts
    emergency_contact_1_name VARCHAR(255),
    emergency_contact_1_phone VARCHAR(20),
    emergency_contact_2_name VARCHAR(255),
    emergency_contact_2_phone VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family members with role-based permissions
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'caregiver',
    
    -- Permissions
    can_manage_pets BOOLEAN DEFAULT true,
    can_manage_health_records BOOLEAN DEFAULT true,
    can_assign_tasks BOOLEAN DEFAULT false,
    can_manage_family BOOLEAN DEFAULT false,
    can_view_analytics BOOLEAN DEFAULT true,
    
    -- Specializations
    specialization TEXT,
    
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(family_id, user_id)
);

-- Generate unique invite codes for families
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
    RETURN upper(substring(replace(uuid_generate_v4()::text, '-', ''), 1, 12));
END;
$$ LANGUAGE plpgsql;

-- Set default invite code for families
ALTER TABLE families ALTER COLUMN invite_code SET DEFAULT generate_invite_code();

COMMIT;