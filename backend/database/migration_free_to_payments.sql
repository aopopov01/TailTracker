-- Migration script: Upgrade from free-tier to Stripe payment integration
-- Run this script to add payment features to existing TailTracker database
-- 
-- IMPORTANT: This migration is designed to be run on a database created from
-- the original free-tier schema.sql file. It adds all payment-related tables
-- and updates existing structures to support premium features.

-- ==============================================================================
-- STEP 1: Update existing types and add new payment-related types
-- ==============================================================================

-- Update subscription_status enum to include payment statuses
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'premium';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'family';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'past_due';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'unpaid';

-- Add new payment-related types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'canceled');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhook_status') THEN
        CREATE TYPE webhook_status AS ENUM ('pending', 'processed', 'failed', 'ignored');
    END IF;
END $$;

-- Update notification_type enum to include payment notifications
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_failed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'subscription_renewed';

-- ==============================================================================
-- STEP 2: Add Stripe customer fields to users table
-- ==============================================================================

-- Add Stripe-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

-- Create index for Stripe customer ID lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires ON users(subscription_expires_at) WHERE subscription_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_trial_ends ON users(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

-- ==============================================================================
-- STEP 3: Update families table for premium member limits
-- ==============================================================================

-- Update families table to support premium member limits
COMMENT ON COLUMN families.max_members IS 'Free: 1, Premium: 6 members';

-- ==============================================================================
-- STEP 4: Create new payment-related tables
-- ==============================================================================

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    status subscription_status NOT NULL DEFAULT 'free',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    price_amount DECIMAL(10,2),
    price_currency VARCHAR(3) DEFAULT 'EUR',
    billing_cycle_anchor TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_stripe_customer_consistency 
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT check_stripe_customer_match 
        CHECK (stripe_customer_id = (SELECT stripe_customer_id FROM users WHERE id = user_id))
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_invoice_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status payment_status NOT NULL,
    payment_method VARCHAR(100),
    payment_method_details JSONB,
    description TEXT,
    invoice_url TEXT,
    receipt_url TEXT,
    failure_code VARCHAR(100),
    failure_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Stripe webhook events table
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    object_type VARCHAR(50),
    object_id VARCHAR(255),
    status webhook_status DEFAULT 'pending',
    processing_attempts INTEGER DEFAULT 0,
    last_processing_error TEXT,
    event_data JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT idx_stripe_event_idempotency UNIQUE (stripe_event_id)
);

-- Create feature usage tracking table
CREATE TABLE IF NOT EXISTS feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    reset_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, feature_name)
);

-- ==============================================================================
-- STEP 5: Create indexes for payment tables
-- ==============================================================================

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end) WHERE current_period_end IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end ON subscriptions(trial_end) WHERE trial_end IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_canceled_at ON subscriptions(canceled_at) WHERE canceled_at IS NOT NULL;

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_stripe_invoice_id ON payments(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_processed_at ON payments(processed_at) WHERE processed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Webhook events indexes
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_event_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status ON stripe_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_object_type_id ON stripe_webhook_events(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_created_at ON stripe_webhook_events(created_at);

-- Feature usage indexes
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_last_used ON feature_usage(last_used_at) WHERE last_used_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feature_usage_reset_at ON feature_usage(reset_at) WHERE reset_at IS NOT NULL;

-- ==============================================================================
-- STEP 6: Enable RLS on new tables
-- ==============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 7: Create RLS policies for new tables
-- ==============================================================================

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL TO service_role USING (true);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = subscription_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage payments" ON payments
  FOR ALL TO service_role USING (true);

-- Webhook events policies (service role only)
CREATE POLICY "Service role can manage webhook events" ON stripe_webhook_events
  FOR ALL TO service_role USING (true);

-- Feature usage policies
CREATE POLICY "Users can view own feature usage" ON feature_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage feature usage" ON feature_usage
  FOR ALL TO service_role USING (true);

-- ==============================================================================
-- STEP 8: Update existing functions for premium support
-- ==============================================================================

-- Helper function to check user's subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_auth_id UUID)
RETURNS subscription_status AS $$
DECLARE
    status subscription_status;
BEGIN
    SELECT u.subscription_status INTO status
    FROM users u
    WHERE u.auth_user_id = user_auth_id;
    
    RETURN COALESCE(status, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user has premium features
CREATE OR REPLACE FUNCTION has_premium_access(user_auth_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    status subscription_status;
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT u.subscription_status, u.subscription_expires_at INTO status, expires_at
    FROM users u
    WHERE u.auth_user_id = user_auth_id;
    
    -- Check if user has active premium subscription
    RETURN status IN ('premium', 'family') AND (expires_at IS NULL OR expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- STEP 9: Update existing triggers to support premium features
-- ==============================================================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS enforce_pet_limit ON pets;
DROP TRIGGER IF EXISTS enforce_photo_limit ON files;
DROP TRIGGER IF EXISTS prevent_premium_lost_pets ON lost_pets;
DROP TRIGGER IF EXISTS prevent_premium_notifications ON notifications;

-- Enhanced pet limit function with premium support
CREATE OR REPLACE FUNCTION check_pet_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    owner_auth_id UUID;
    is_premium BOOLEAN;
BEGIN
    -- Get family owner's auth ID
    SELECT u.auth_user_id INTO owner_auth_id
    FROM families f
    JOIN users u ON f.owner_id = u.id
    WHERE f.id = NEW.family_id;
    
    -- Check if owner has premium access
    is_premium := has_premium_access(owner_auth_id);
    
    -- Count current pets in family
    SELECT COUNT(*) INTO current_count
    FROM pets p
    WHERE p.family_id = NEW.family_id
    AND p.deleted_at IS NULL;
    
    -- Apply limits based on subscription
    IF NOT is_premium AND current_count >= 1 THEN
        RAISE EXCEPTION 'Free tier allows only 1 pet. Upgrade to premium for unlimited pets.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enhanced photo limit function with premium support
CREATE OR REPLACE FUNCTION check_photo_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    family_owner_auth_id UUID;
    is_premium BOOLEAN;
BEGIN
    -- Only check limits for pet photos
    IF NEW.pet_id IS NULL OR NEW.content_type NOT LIKE 'image/%' THEN
        RETURN NEW;
    END IF;
    
    -- Get family owner's auth ID through pet -> family -> owner
    SELECT u.auth_user_id INTO family_owner_auth_id
    FROM pets p
    JOIN families f ON p.family_id = f.id
    JOIN users u ON f.owner_id = u.id
    WHERE p.id = NEW.pet_id;
    
    -- Check if owner has premium access
    is_premium := has_premium_access(family_owner_auth_id);
    
    -- Count current photos for this pet
    SELECT COUNT(*) INTO current_count
    FROM files
    WHERE pet_id = NEW.pet_id
    AND content_type LIKE 'image/%';
    
    -- Apply limits based on subscription
    IF NOT is_premium AND current_count >= 1 THEN
        RAISE EXCEPTION 'Free tier allows only 1 photo per pet. Upgrade to premium for unlimited photos.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce premium features
CREATE OR REPLACE FUNCTION check_premium_features()
RETURNS TRIGGER AS $$
DECLARE
    user_auth_id UUID;
    is_premium BOOLEAN;
BEGIN
    -- Get user's auth ID based on context
    IF TG_TABLE_NAME = 'lost_pets' THEN
        SELECT u.auth_user_id INTO user_auth_id
        FROM users u
        WHERE u.id = NEW.reported_by;
    ELSIF TG_TABLE_NAME = 'notifications' THEN
        SELECT u.auth_user_id INTO user_auth_id
        FROM users u
        WHERE u.id = NEW.user_id;
    END IF;
    
    -- Check if user has premium access
    is_premium := has_premium_access(user_auth_id);
    
    -- Enforce premium feature restrictions
    IF TG_TABLE_NAME = 'lost_pets' AND NOT is_premium THEN
        RAISE EXCEPTION 'Lost pet alerts are a premium feature. Upgrade to premium to use this feature.';
    END IF;
    
    IF TG_TABLE_NAME = 'notifications' AND NEW.type = 'vaccination_due' AND NOT is_premium THEN
        RAISE EXCEPTION 'Vaccination reminders are a premium feature. Upgrade to premium to use this feature.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with updated functions
CREATE TRIGGER enforce_pet_limit
    BEFORE INSERT ON pets
    FOR EACH ROW
    EXECUTE FUNCTION check_pet_limit();

CREATE TRIGGER enforce_photo_limit
    BEFORE INSERT ON files
    FOR EACH ROW
    EXECUTE FUNCTION check_photo_limit();

CREATE TRIGGER prevent_premium_lost_pets
    BEFORE INSERT ON lost_pets
    FOR EACH ROW
    EXECUTE FUNCTION check_premium_features();

CREATE TRIGGER prevent_premium_notifications
    BEFORE INSERT ON notifications
    FOR EACH ROW
    WHEN (NEW.type = 'vaccination_due')
    EXECUTE FUNCTION check_premium_features();

-- ==============================================================================
-- STEP 10: Add new triggers for subscription management
-- ==============================================================================

-- Function to update user subscription status from Stripe events
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's subscription status when subscription changes
    UPDATE users
    SET 
        subscription_status = NEW.status,
        subscription_expires_at = NEW.current_period_end,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Update family max_members based on subscription
    UPDATE families
    SET max_members = CASE 
        WHEN NEW.status IN ('premium', 'family') THEN 6
        ELSE 1
    END
    WHERE owner_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_subscription_status
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_status();

-- Function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(user_uuid UUID, feature_name TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO feature_usage (user_id, feature_name, usage_count, last_used_at)
    VALUES (user_uuid, feature_name, 1, NOW())
    ON CONFLICT (user_id, feature_name)
    DO UPDATE SET
        usage_count = feature_usage.usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_families_updated_at
    BEFORE UPDATE ON families
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at
    BEFORE UPDATE ON pets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_usage_updated_at
    BEFORE UPDATE ON feature_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- STEP 11: Grant permissions for new tables
-- ==============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Service role permissions (for background jobs, admin operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

-- Insert migration record
INSERT INTO audit_logs (user_id, table_name, action, new_values, created_at)
VALUES (
    NULL, 
    'schema_migration', 
    'create', 
    '{"migration": "free_to_payments", "version": "1.0", "stripe_integration": true}'::jsonb,
    NOW()
);

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Database now supports Stripe payment integration with:';
    RAISE NOTICE '- Premium subscriptions at €7.99/month';
    RAISE NOTICE '- Family subscriptions with up to 6 members';
    RAISE NOTICE '- Webhook event logging for reliable payment processing';
    RAISE NOTICE '- Feature usage tracking and premium access controls';
    RAISE NOTICE '- Enhanced security with proper RLS policies';
END $$;