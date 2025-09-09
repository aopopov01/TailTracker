-- TailTracker User Profiles Table Fix
-- This script ensures the user_profiles table exists with all required fields and indexes
-- Run this in your Supabase SQL Editor or via Supabase CLI

-- First, ensure the subscription_status enum exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'canceled', 'past_due');
    END IF;
END $$;

-- Create the user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
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

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles if they don't exist
DO $$ 
BEGIN
    -- Drop existing policies if they exist to avoid conflicts
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    
    -- Create policies
    CREATE POLICY "Users can view own profile" ON user_profiles
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own profile" ON user_profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own profile" ON user_profiles
        FOR UPDATE USING (auth.uid() = user_id);
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_expires_at ON user_profiles(subscription_expires_at) WHERE subscription_status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_active ON user_profiles(user_id, subscription_status, subscription_expires_at) WHERE subscription_status = 'active';

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create user profile on signup
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper functions for subscription management

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    is_active BOOLEAN := false;
BEGIN
    SELECT 
        up.subscription_status = 'active' AND 
        (up.subscription_expires_at IS NULL OR up.subscription_expires_at > NOW())
    INTO is_active
    FROM user_profiles up
    WHERE up.user_id = user_uuid;
    
    RETURN COALESCE(is_active, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    user_id UUID,
    subscription_status subscription_status,
    subscription_expires_at TIMESTAMPTZ,
    is_expired BOOLEAN,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.subscription_status,
        up.subscription_expires_at,
        CASE 
            WHEN up.subscription_expires_at IS NULL THEN false
            ELSE up.subscription_expires_at < NOW()
        END as is_expired,
        CASE 
            WHEN up.subscription_expires_at IS NULL THEN NULL
            ELSE EXTRACT(days FROM (up.subscription_expires_at - NOW()))::INTEGER
        END as days_until_expiry
    FROM user_profiles up
    WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON user_profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON user_profiles TO authenticated;

-- Ensure any existing users without profiles get them created
INSERT INTO user_profiles (user_id, email, full_name, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    au.created_at,
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Update any NULL subscription status to 'inactive'
UPDATE user_profiles 
SET subscription_status = 'inactive'::subscription_status 
WHERE subscription_status IS NULL;