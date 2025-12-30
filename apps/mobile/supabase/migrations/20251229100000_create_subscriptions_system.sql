-- =====================================================
-- TailTracker Subscription Management System
-- =====================================================
-- This migration creates a comprehensive subscription management system
-- with support for upgrades, downgrades, cancellations, and billing cycles.
--
-- Pricing (EUR):
--   Free: 0/month
--   Premium: 5.99/month or 60/year
--   Pro: 8.99/month or 90/year
-- =====================================================

-- =====================================================
-- 1. CREATE ENUMS
-- =====================================================

-- Create subscription_tier enum (different from existing subscription_status)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
        CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'pro');
    END IF;
END$$;

-- Create billing_cycle enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle') THEN
        CREATE TYPE billing_cycle AS ENUM ('monthly', 'annual');
    END IF;
END$$;

-- Create subscription_state enum for subscription status tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_state') THEN
        CREATE TYPE subscription_state AS ENUM ('active', 'cancelled', 'past_due', 'paused');
    END IF;
END$$;

-- =====================================================
-- 2. CREATE SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Subscription tier and billing
    tier subscription_tier NOT NULL DEFAULT 'free',
    billing_cycle billing_cycle,
    status subscription_state NOT NULL DEFAULT 'active',

    -- Period tracking
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,

    -- Change management
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    downgrade_to_tier subscription_tier,

    -- Payment provider integration
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT one_subscription_per_user UNIQUE (user_id)
);

-- =====================================================
-- 3. CREATE SUBSCRIPTION HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Action tracking
    action TEXT NOT NULL CHECK (action IN (
        'upgrade', 'downgrade', 'cancel', 'reactivate',
        'period_end', 'payment_failed', 'billing_cycle_change',
        'trial_start', 'trial_end'
    )),

    -- Change details
    from_tier subscription_tier,
    to_tier subscription_tier,
    from_billing_cycle billing_cycle,
    to_billing_cycle billing_cycle,

    -- Financial tracking
    proration_amount DECIMAL(10,2),

    -- Additional metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancel_at_period_end
    ON subscriptions(cancel_at_period_end) WHERE cancel_at_period_end = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscriptions_downgrade_pending
    ON subscriptions(downgrade_to_tier) WHERE downgrade_to_tier IS NOT NULL;

-- Subscription history indexes
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_action ON subscription_history(action);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at);

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Subscription history policies
CREATE POLICY "Users can view own subscription history" ON subscription_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription history" ON subscription_history
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 7. CREATE SYNC TRIGGER
-- =====================================================

-- Function to sync subscription tier to users table
CREATE OR REPLACE FUNCTION sync_subscription_tier_to_users()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the users table with the new subscription tier
    UPDATE users
    SET
        subscription_status = NEW.tier::text,
        subscription_expires_at = NEW.current_period_end,
        updated_at = NOW()
    WHERE auth_user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for sync
DROP TRIGGER IF EXISTS trigger_sync_subscription_tier ON subscriptions;
CREATE TRIGGER trigger_sync_subscription_tier
    AFTER INSERT OR UPDATE OF tier, current_period_end ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION sync_subscription_tier_to_users();

-- =====================================================
-- 8. CREATE INITIALIZATION FUNCTION
-- =====================================================

-- Function to initialize subscription for new users (can be called by auth trigger)
CREATE OR REPLACE FUNCTION initialize_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a free subscription for new users
    INSERT INTO subscriptions (user_id, tier, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get current subscription for a user
CREATE OR REPLACE FUNCTION get_user_subscription(user_auth_id UUID)
RETURNS JSONB AS $$
DECLARE
    sub_record RECORD;
BEGIN
    SELECT * INTO sub_record FROM subscriptions WHERE user_id = user_auth_id;

    IF sub_record IS NULL THEN
        -- Return default free subscription info
        RETURN jsonb_build_object(
            'tier', 'free',
            'status', 'active',
            'billing_cycle', NULL,
            'current_period_start', NULL,
            'current_period_end', NULL,
            'cancel_at_period_end', FALSE,
            'downgrade_to_tier', NULL
        );
    END IF;

    RETURN jsonb_build_object(
        'id', sub_record.id,
        'tier', sub_record.tier,
        'status', sub_record.status,
        'billing_cycle', sub_record.billing_cycle,
        'current_period_start', sub_record.current_period_start,
        'current_period_end', sub_record.current_period_end,
        'cancel_at_period_end', sub_record.cancel_at_period_end,
        'downgrade_to_tier', sub_record.downgrade_to_tier,
        'created_at', sub_record.created_at,
        'updated_at', sub_record.updated_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate proration amount for upgrades
CREATE OR REPLACE FUNCTION calculate_proration(
    current_tier subscription_tier,
    target_tier subscription_tier,
    current_billing_cycle billing_cycle,
    period_end_date TIMESTAMPTZ
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    days_remaining INTEGER;
    current_daily_rate DECIMAL(10,4);
    target_daily_rate DECIMAL(10,4);
    proration DECIMAL(10,2);

    -- Monthly prices in EUR
    free_monthly DECIMAL(10,2) := 0.00;
    premium_monthly DECIMAL(10,2) := 5.99;
    pro_monthly DECIMAL(10,2) := 8.99;

    -- Annual prices in EUR
    premium_annual DECIMAL(10,2) := 60.00;
    pro_annual DECIMAL(10,2) := 90.00;
BEGIN
    -- Calculate days remaining in current period
    IF period_end_date IS NULL THEN
        RETURN 0.00;
    END IF;

    days_remaining := GREATEST(0, EXTRACT(DAY FROM (period_end_date - NOW())));

    IF days_remaining = 0 THEN
        RETURN 0.00;
    END IF;

    -- Calculate daily rates based on billing cycle
    IF current_billing_cycle = 'monthly' THEN
        current_daily_rate := CASE current_tier
            WHEN 'free' THEN free_monthly / 30.0
            WHEN 'premium' THEN premium_monthly / 30.0
            WHEN 'pro' THEN pro_monthly / 30.0
        END;
        target_daily_rate := CASE target_tier
            WHEN 'free' THEN free_monthly / 30.0
            WHEN 'premium' THEN premium_monthly / 30.0
            WHEN 'pro' THEN pro_monthly / 30.0
        END;
    ELSE -- annual
        current_daily_rate := CASE current_tier
            WHEN 'free' THEN 0.00
            WHEN 'premium' THEN premium_annual / 365.0
            WHEN 'pro' THEN pro_annual / 365.0
        END;
        target_daily_rate := CASE target_tier
            WHEN 'free' THEN 0.00
            WHEN 'premium' THEN premium_annual / 365.0
            WHEN 'pro' THEN pro_annual / 365.0
        END;
    END IF;

    -- Calculate proration (positive for upgrades)
    proration := days_remaining * (target_daily_rate - current_daily_rate);

    RETURN ROUND(proration, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to record subscription history
CREATE OR REPLACE FUNCTION record_subscription_change(
    p_subscription_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_from_tier subscription_tier,
    p_to_tier subscription_tier,
    p_from_billing_cycle billing_cycle,
    p_to_billing_cycle billing_cycle,
    p_proration_amount DECIMAL(10,2) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    INSERT INTO subscription_history (
        subscription_id, user_id, action,
        from_tier, to_tier,
        from_billing_cycle, to_billing_cycle,
        proration_amount, metadata
    ) VALUES (
        p_subscription_id, p_user_id, p_action,
        p_from_tier, p_to_tier,
        p_from_billing_cycle, p_to_billing_cycle,
        p_proration_amount, p_metadata
    ) RETURNING id INTO history_id;

    RETURN history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. CREATE UPDATED_AT TRIGGER
-- =====================================================

-- Trigger for subscriptions updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_proration(subscription_tier, subscription_tier, billing_cycle, TIMESTAMPTZ) TO authenticated;

-- =====================================================
-- 12. INITIALIZE EXISTING USERS
-- =====================================================

-- Create subscription records for existing users who don't have one
INSERT INTO subscriptions (user_id, tier, status, created_at)
SELECT
    u.auth_user_id,
    CASE
        WHEN u.subscription_status = 'pro' THEN 'pro'::subscription_tier
        WHEN u.subscription_status = 'premium' THEN 'premium'::subscription_tier
        ELSE 'free'::subscription_tier
    END,
    'active'::subscription_state,
    u.created_at
FROM users u
WHERE u.auth_user_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = u.auth_user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- SUBSCRIPTION MANAGEMENT SYSTEM COMPLETE
-- =====================================================

/*
  SUBSCRIPTION MANAGEMENT SYSTEM OVERVIEW:

  Tables:
  - subscriptions: Core subscription data for each user
  - subscription_history: Audit trail of all subscription changes

  Enums:
  - subscription_tier: 'free', 'premium', 'pro'
  - billing_cycle: 'monthly', 'annual'
  - subscription_state: 'active', 'cancelled', 'past_due', 'paused'

  Key Features:
  1. Automatic sync to users.subscription_status via trigger
  2. Proration calculation for upgrades
  3. Period-end change scheduling (downgrades/cancellations)
  4. Complete audit history
  5. RLS policies for security

  Edge Functions (to be created):
  - subscription-upgrade: Immediate upgrade with proration
  - subscription-downgrade: Schedule downgrade at period end
  - subscription-cancel: Schedule cancellation at period end
  - subscription-reactivate: Cancel pending changes
  - subscription-change-billing-cycle: Switch monthly/annual
  - subscription-period-processor: Daily cron for period transitions

  Pricing (EUR):
  - Free: 0/month
  - Premium: 5.99/month or 60/year
  - Pro: 8.99/month or 90/year
*/
