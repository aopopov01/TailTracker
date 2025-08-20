-- Rollback script: Revert from Stripe payment integration to free-tier
-- WARNING: This script will remove all payment data and subscriptions!
-- Make sure to backup payment data before running this rollback.

-- ==============================================================================
-- STEP 1: Backup payment data (optional - uncomment if needed)
-- ==============================================================================

-- CREATE TABLE backup_subscriptions AS SELECT * FROM subscriptions;
-- CREATE TABLE backup_payments AS SELECT * FROM payments;
-- CREATE TABLE backup_stripe_webhook_events AS SELECT * FROM stripe_webhook_events;
-- CREATE TABLE backup_feature_usage AS SELECT * FROM feature_usage;

-- ==============================================================================
-- STEP 2: Reset all users to free tier
-- ==============================================================================

-- Reset all users to free tier subscription
UPDATE users 
SET 
    subscription_status = 'free',
    subscription_expires_at = NULL,
    trial_ends_at = NULL,
    stripe_customer_id = NULL,
    updated_at = NOW();

-- Reset family member limits to free tier
UPDATE families 
SET max_members = 1;

-- ==============================================================================
-- STEP 3: Drop payment-related triggers and functions
-- ==============================================================================

-- Drop subscription-related triggers
DROP TRIGGER IF EXISTS sync_subscription_status ON subscriptions;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_feature_usage_updated_at ON feature_usage;

-- Drop enhanced trigger functions (will recreate simpler versions)
DROP FUNCTION IF EXISTS update_subscription_status();
DROP FUNCTION IF EXISTS track_feature_usage(UUID, TEXT);
DROP FUNCTION IF EXISTS has_premium_access(UUID);
DROP FUNCTION IF EXISTS get_user_subscription_status(UUID);

-- ==============================================================================
-- STEP 4: Drop RLS policies for payment tables
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON payments;
DROP POLICY IF EXISTS "Service role can manage webhook events" ON stripe_webhook_events;
DROP POLICY IF EXISTS "Users can view own feature usage" ON feature_usage;
DROP POLICY IF EXISTS "Service role can manage feature usage" ON feature_usage;

-- ==============================================================================
-- STEP 5: Drop payment-related tables
-- ==============================================================================

-- Drop tables in correct order to handle foreign key constraints
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_webhook_events CASCADE;
DROP TABLE IF EXISTS feature_usage CASCADE;

-- ==============================================================================
-- STEP 6: Remove Stripe-related columns from users table
-- ==============================================================================

-- Remove Stripe customer fields from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS subscription_expires_at,
DROP COLUMN IF EXISTS trial_ends_at,
DROP COLUMN IF EXISTS stripe_customer_id;

-- Drop payment-related indexes
DROP INDEX IF EXISTS idx_users_stripe_customer_id;
DROP INDEX IF EXISTS idx_users_subscription_expires;
DROP INDEX IF EXISTS idx_users_trial_ends;

-- ==============================================================================
-- STEP 7: Revert to simple free-tier functions and triggers
-- ==============================================================================

-- Simple pet limit function (free tier only)
CREATE OR REPLACE FUNCTION check_pet_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has 1 pet (free tier limit)
  IF (
    SELECT COUNT(*) FROM pets p
    JOIN families f ON p.family_id = f.id
    WHERE f.id = NEW.family_id
    AND p.deleted_at IS NULL
  ) >= 1 THEN
    RAISE EXCEPTION 'Free tier allows only 1 pet. Upgrade to premium for unlimited pets.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Simple photo limit function (free tier only)
CREATE OR REPLACE FUNCTION check_photo_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if pet already has 1 photo (free tier limit)
  IF NEW.pet_id IS NOT NULL AND (
    SELECT COUNT(*) FROM files
    WHERE pet_id = NEW.pet_id
    AND content_type LIKE 'image/%'
  ) >= 1 THEN
    RAISE EXCEPTION 'Free tier allows only 1 photo per pet. Upgrade to premium for unlimited photos.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent premium features (free tier only)
CREATE OR REPLACE FUNCTION check_premium_features()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent lost pet alerts for free users
  IF TG_TABLE_NAME = 'lost_pets' THEN
    RAISE EXCEPTION 'Lost pet alerts are a premium feature. Upgrade to premium to use this feature.';
  END IF;
  
  -- Prevent vaccination reminders for free users
  IF TG_TABLE_NAME = 'notifications' AND NEW.type = 'vaccination_due' THEN
    RAISE EXCEPTION 'Vaccination reminders are a premium feature. Upgrade to premium to use this feature.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate simple triggers
DROP TRIGGER IF EXISTS enforce_pet_limit ON pets;
DROP TRIGGER IF EXISTS enforce_photo_limit ON files;
DROP TRIGGER IF EXISTS prevent_premium_lost_pets ON lost_pets;
DROP TRIGGER IF EXISTS prevent_premium_notifications ON notifications;

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
-- STEP 8: Revert enum types to free-tier only
-- ==============================================================================

-- Note: PostgreSQL doesn't allow removing enum values easily
-- These values will remain but won't be used
-- You may need to recreate the types if strict free-tier is required

-- Comment out the payment-related enum values for documentation
COMMENT ON TYPE subscription_status IS 'Free tier only - premium values exist but unused';
COMMENT ON TYPE notification_type IS 'Free tier only - payment notification values exist but unused';

-- ==============================================================================
-- STEP 9: Clean up any premium feature data
-- ==============================================================================

-- Delete any lost pet alerts (premium feature)
DELETE FROM lost_pets;

-- Delete any vaccination reminder notifications (premium feature)
DELETE FROM notifications WHERE type = 'vaccination_due';

-- Delete any payment-related notifications
DELETE FROM notifications WHERE type IN ('payment_failed', 'subscription_renewed');

-- ==============================================================================
-- STEP 10: Update comments and documentation
-- ==============================================================================

-- Update table comments to reflect free-tier status
COMMENT ON TABLE users IS 'Users table - free tier only, payment columns removed';
COMMENT ON TABLE families IS 'Families table - limited to 1 member in free tier';
COMMENT ON TABLE pets IS 'Pets table - limited to 1 pet per family in free tier';
COMMENT ON TABLE files IS 'Files table - limited to 1 photo per pet in free tier';

-- ==============================================================================
-- ROLLBACK COMPLETE
-- ==============================================================================

-- Insert rollback record
INSERT INTO audit_logs (user_id, table_name, action, new_values, created_at)
VALUES (
    NULL, 
    'schema_rollback', 
    'update', 
    '{"rollback": "payments_to_free", "version": "1.0", "stripe_integration_removed": true}'::jsonb,
    NOW()
);

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Rollback completed successfully!';
    RAISE NOTICE 'Database reverted to free-tier only with:';
    RAISE NOTICE '- All payment data removed (backup tables created if uncommented)';
    RAISE NOTICE '- Users reset to free subscription status';
    RAISE NOTICE '- Families limited to 1 member';
    RAISE NOTICE '- Pets limited to 1 per family';
    RAISE NOTICE '- Photos limited to 1 per pet';
    RAISE NOTICE '- Premium features disabled';
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: All payment and subscription data has been permanently deleted!';
    RAISE NOTICE 'Make sure this is what you intended.';
END $$;