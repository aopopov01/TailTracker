-- TailTracker PostgreSQL Database Schema with Stripe Payment Integration
-- Designed for 150K+ users with multi-tenant architecture and GDPR compliance
-- 
-- Stripe Integration Features:
-- - Customer management with Stripe customer IDs
-- - Subscription tracking with billing periods
-- - Payment history with Stripe payment intents
-- - Webhook event logging for reliable payment processing
-- - Premium tier at €7.99/month with enhanced features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types for Stripe payment integration
CREATE TYPE user_role AS ENUM ('owner', 'member', 'viewer');
CREATE TYPE subscription_status AS ENUM ('free', 'premium', 'family', 'cancelled', 'expired', 'past_due', 'unpaid');
CREATE TYPE pet_status AS ENUM ('active', 'deceased', 'lost', 'found');
CREATE TYPE notification_type AS ENUM ('vaccination_due', 'medication_due', 'appointment', 'lost_pet_alert', 'family_invite', 'payment_failed', 'subscription_renewed');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'canceled');
CREATE TYPE webhook_status AS ENUM ('pending', 'processed', 'failed', 'ignored');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'view', 'export');

-- Users table (Supabase auth integration) with Stripe customer data
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL, -- References auth.users
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    country_code VARCHAR(2),
    subscription_status subscription_status DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255) UNIQUE, -- Stripe customer ID for payment processing
    gdpr_consent_date TIMESTAMP WITH TIME ZONE,
    marketing_consent BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Families table (sharing groups) with premium features
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(12) UNIQUE NOT NULL,
    max_members INTEGER DEFAULT 1, -- Free: 1, Premium: 6 members
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family members junction table
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'member',
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(family_id, user_id)
);

-- Pets table with premium features (unlimited pets and photos for premium)
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100) NOT NULL,
    breed VARCHAR(100),
    color VARCHAR(100),
    gender VARCHAR(20),
    date_of_birth DATE,
    weight_kg DECIMAL(5,2),
    microchip_number VARCHAR(50),
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    status pet_status DEFAULT 'active',
    profile_photo_url TEXT, -- Free: 1 photo, Premium: unlimited
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    special_needs TEXT,
    allergies TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Veterinarians table
CREATE TABLE veterinarians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    clinic_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2),
    specialization VARCHAR(255),
    license_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pet veterinarians junction table
CREATE TABLE pet_veterinarians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pet_id, veterinarian_id)
);

-- Vaccinations table (basic tracking only in free tier)
CREATE TABLE vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(100),
    administered_date DATE NOT NULL,
    next_due_date DATE,
    veterinarian_id UUID REFERENCES veterinarians(id),
    notes TEXT,
    certificate_url TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medications table (basic tracking only)
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    prescribed_by UUID REFERENCES veterinarians(id),
    instructions TEXT,
    side_effects TEXT,
    active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical records table
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    record_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date_of_record DATE NOT NULL,
    veterinarian_id UUID REFERENCES veterinarians(id),
    cost DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    diagnosis TEXT,
    treatment TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    document_urls TEXT[],
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lost pets table (PREMIUM FEATURE)
CREATE TABLE lost_pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'lost',
    last_seen_location POINT,
    last_seen_address TEXT,
    last_seen_date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    reward_amount DECIMAL(10,2),
    reward_currency VARCHAR(3) DEFAULT 'EUR',
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    photo_urls TEXT[],
    search_radius_km INTEGER DEFAULT 10,
    found_date TIMESTAMP WITH TIME ZONE,
    found_by UUID REFERENCES users(id),
    is_premium_feature BOOLEAN DEFAULT true, -- Marks this as premium-only
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table with premium features
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    pet_id UUID REFERENCES pets(id),
    related_id UUID, -- Generic reference to related records
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    push_sent BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    is_premium_feature BOOLEAN DEFAULT false, -- Vaccination reminders are premium
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table (for photo and document storage) with premium features
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    pet_id UUID REFERENCES pets(id), -- Link files to specific pets for limit enforcement
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    content_type VARCHAR(100),
    file_size BIGINT,
    storage_path TEXT NOT NULL,
    bucket_name VARCHAR(100) NOT NULL,
    checksum VARCHAR(64),
    is_public BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for GDPR compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action audit_action NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GDPR data requests
CREATE TABLE gdpr_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    request_type VARCHAR(20) NOT NULL, -- 'export', 'delete'
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    data_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Subscriptions table for Stripe integration
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL, -- Stripe subscription ID
    stripe_customer_id VARCHAR(255) NOT NULL, -- Should match users.stripe_customer_id
    plan_name VARCHAR(100) NOT NULL, -- 'premium_monthly', 'family_monthly'
    status subscription_status NOT NULL DEFAULT 'free',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    price_amount DECIMAL(10,2), -- Amount in EUR (e.g., 7.99)
    price_currency VARCHAR(3) DEFAULT 'EUR',
    billing_cycle_anchor TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure customer ID consistency
    CONSTRAINT fk_stripe_customer_consistency 
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT check_stripe_customer_match 
        CHECK (stripe_customer_id = (SELECT stripe_customer_id FROM users WHERE id = user_id))
);

-- Payments table for Stripe payment tracking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) UNIQUE, -- Stripe payment intent ID
    stripe_invoice_id VARCHAR(255), -- Stripe invoice ID
    stripe_charge_id VARCHAR(255), -- Stripe charge ID
    amount DECIMAL(10,2) NOT NULL, -- Amount in EUR
    currency VARCHAR(3) DEFAULT 'EUR',
    status payment_status NOT NULL,
    payment_method VARCHAR(100), -- 'card', 'sepa_debit', etc.
    payment_method_details JSONB, -- Additional payment method info
    description TEXT,
    invoice_url TEXT,
    receipt_url TEXT,
    failure_code VARCHAR(100), -- Stripe failure code if payment failed
    failure_message TEXT, -- Human readable failure message
    processed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe webhook events table for idempotency and debugging
CREATE TABLE stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL, -- Stripe event ID for idempotency
    event_type VARCHAR(100) NOT NULL, -- e.g., 'invoice.payment_succeeded'
    object_type VARCHAR(50), -- e.g., 'subscription', 'payment_intent'
    object_id VARCHAR(255), -- Stripe object ID
    status webhook_status DEFAULT 'pending',
    processing_attempts INTEGER DEFAULT 0,
    last_processing_error TEXT,
    event_data JSONB NOT NULL, -- Full Stripe event payload
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for efficient event processing
    CONSTRAINT idx_stripe_event_idempotency UNIQUE (stripe_event_id)
);

-- Premium feature usage tracking
CREATE TABLE feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL, -- 'lost_pet_alerts', 'vaccination_reminders', etc.
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    reset_at TIMESTAMP WITH TIME ZONE, -- For monthly/periodic limits
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, feature_name)
);

-- Create indexes for performance optimization
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_users_subscription_expires ON users(subscription_expires_at) WHERE subscription_expires_at IS NOT NULL;
CREATE INDEX idx_users_trial_ends ON users(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_families_owner_id ON families(owner_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);

CREATE INDEX idx_pets_family_id ON pets(family_id);
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_pets_created_by ON pets(created_by);

CREATE INDEX idx_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX idx_vaccinations_next_due_date ON vaccinations(next_due_date) WHERE next_due_date IS NOT NULL;

CREATE INDEX idx_medications_pet_id ON medications(pet_id);
CREATE INDEX idx_medications_active ON medications(active) WHERE active = true;

CREATE INDEX idx_medical_records_pet_id ON medical_records(pet_id);
CREATE INDEX idx_medical_records_date ON medical_records(date_of_record);

CREATE INDEX idx_lost_pets_pet_id ON lost_pets(pet_id);
CREATE INDEX idx_lost_pets_status ON lost_pets(status);
CREATE INDEX idx_lost_pets_location ON lost_pets USING GIST(last_seen_location);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_pet_id ON files(pet_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Stripe payment and subscription indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end) WHERE current_period_end IS NOT NULL;
CREATE INDEX idx_subscriptions_trial_end ON subscriptions(trial_end) WHERE trial_end IS NOT NULL;
CREATE INDEX idx_subscriptions_canceled_at ON subscriptions(canceled_at) WHERE canceled_at IS NOT NULL;

CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX idx_payments_stripe_invoice_id ON payments(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_processed_at ON payments(processed_at) WHERE processed_at IS NOT NULL;
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_stripe_webhook_events_stripe_event_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_stripe_webhook_events_event_type ON stripe_webhook_events(event_type);
CREATE INDEX idx_stripe_webhook_events_status ON stripe_webhook_events(status);
CREATE INDEX idx_stripe_webhook_events_object_type_id ON stripe_webhook_events(object_type, object_id);
CREATE INDEX idx_stripe_webhook_events_created_at ON stripe_webhook_events(created_at);

CREATE INDEX idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE INDEX idx_feature_usage_last_used ON feature_usage(last_used_at) WHERE last_used_at IS NOT NULL;
CREATE INDEX idx_feature_usage_reset_at ON feature_usage(reset_at) WHERE reset_at IS NOT NULL;

-- Full-text search indexes
CREATE INDEX idx_pets_search ON pets USING gin(to_tsvector('english', name || ' ' || COALESCE(breed, '') || ' ' || COALESCE(color, '')));
CREATE INDEX idx_veterinarians_search ON veterinarians USING gin(to_tsvector('english', name || ' ' || COALESCE(clinic_name, '')));

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data isolation
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can view own family pets" ON pets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN families f ON fm.family_id = f.id 
      WHERE f.id = pets.family_id 
      AND fm.user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage pets in their families" ON pets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN families f ON fm.family_id = f.id 
      WHERE f.id = pets.family_id 
      AND fm.user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
      AND fm.role IN ('owner', 'member')
    )
  );

-- Premium feature management and subscription controls
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

CREATE TRIGGER enforce_pet_limit
    BEFORE INSERT ON pets
    FOR EACH ROW
    EXECUTE FUNCTION check_pet_limit();

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

CREATE TRIGGER enforce_photo_limit
    BEFORE INSERT ON files
    FOR EACH ROW
    EXECUTE FUNCTION check_photo_limit();

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

CREATE TRIGGER prevent_premium_lost_pets
    BEFORE INSERT ON lost_pets
    FOR EACH ROW
    EXECUTE FUNCTION check_premium_features();

CREATE TRIGGER prevent_premium_notifications
    BEFORE INSERT ON notifications
    FOR EACH ROW
    WHEN (NEW.type = 'vaccination_due')
    EXECUTE FUNCTION check_premium_features();

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

-- Basic RLS policies for new payment tables
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = subscription_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage payments" ON payments
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage webhook events" ON stripe_webhook_events
  FOR ALL TO service_role USING (true);

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

-- Comments for future enhancements
/*
  STRIPE INTEGRATION NOTES:
  
  1. Webhook Security:
     - All webhook events are logged in stripe_webhook_events table
     - Use Stripe signature verification before processing
     - Implement idempotency using stripe_event_id
  
  2. Subscription Management:
     - Premium tier: €7.99/month (unlimited pets, photos, lost pet alerts, vaccination reminders)
     - Family tier: €12.99/month (up to 6 family members, all premium features)
     - Free tier: 1 pet, 1 photo per pet, basic features only
  
  3. Payment Processing:
     - All amounts stored in EUR cents (multiply by 100)
     - Support for SEPA, cards, and other EU payment methods
     - Automatic retry logic for failed payments
     - Proper refund handling
  
  4. Feature Access Control:
     - Premium features are enforced at database level via triggers
     - Feature usage is tracked for analytics and limit enforcement
     - Subscription status is synced automatically from Stripe webhooks
*/