-- Add missing indexes for user_profiles table
-- This migration ensures the user_profiles table has proper performance indexes

-- Create indexes for user_profiles table performance optimization
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_expires_at ON user_profiles(subscription_expires_at) WHERE subscription_status = 'active';

-- Create a composite index for subscription queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_active ON user_profiles(user_id, subscription_status, subscription_expires_at) WHERE subscription_status = 'active';

-- Ensure the subscription_status enum has all required values
DO $$ 
BEGIN 
    -- Check if subscription_status enum exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'canceled', 'past_due');
    END IF;
END $$;

-- Update any NULL subscription status to 'inactive' for data consistency
UPDATE user_profiles 
SET subscription_status = 'inactive'::subscription_status 
WHERE subscription_status IS NULL;

-- Add helpful functions for subscription management

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

-- Function to automatically expire subscriptions (to be called periodically)
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE user_profiles 
    SET 
        subscription_status = 'inactive'::subscription_status,
        updated_at = NOW()
    WHERE subscription_status = 'active'::subscription_status 
        AND subscription_expires_at IS NOT NULL 
        AND subscription_expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON user_profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON user_profiles TO authenticated;

-- Ensure RLS is enabled (should already be enabled from previous migrations)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;