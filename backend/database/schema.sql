-- TailTracker PostgreSQL Database Schema with Stripe Payment Integration
-- Designed for 150K+ users with multi-tenant architecture and GDPR compliance
-- 
-- Stripe Integration Features:
-- - Customer management with Stripe customer IDs
-- - Subscription tracking with billing periods
-- - Payment history with Stripe payment intents
-- - Webhook event logging for reliable payment processing
-- - Premium tier at €5.99/month with enhanced features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types for Stripe payment integration
CREATE TYPE user_role AS ENUM ('owner', 'member', 'viewer');
CREATE TYPE access_level AS ENUM ('read', 'read_write');
CREATE TYPE subscription_status AS ENUM ('free', 'premium', 'pro', 'cancelled', 'expired', 'past_due', 'unpaid');
CREATE TYPE pet_status AS ENUM ('active', 'deceased', 'lost', 'found');
CREATE TYPE notification_type AS ENUM ('lost_pet_alert', 'family_invite', 'payment_failed', 'subscription_renewed');
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
    max_members INTEGER DEFAULT 1, -- Free: 1, Premium: 2, Pro: 4+ members
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family members junction table with QR code access control
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'member',
    access_level access_level DEFAULT 'read',
    invited_by UUID REFERENCES users(id),
    invite_token VARCHAR(255) UNIQUE, -- QR code token for secure invitation
    invite_expires_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(family_id, user_id)
);

-- Pending family invites table for QR code confirmations
CREATE TABLE family_invites_pending (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    potential_member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    status pet_status DEFAULT 'active',
    
    -- Basic information (all tiers)
    personality_traits TEXT,
    behavioral_notes TEXT,
    
    -- Emergency contacts (Free: basic, Premium/Pro: multiple)
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_email VARCHAR(255),
    emergency_contact_2_name VARCHAR(255), -- Premium/Pro only
    emergency_contact_2_phone VARCHAR(20), -- Premium/Pro only
    emergency_contact_2_email VARCHAR(255), -- Premium/Pro only
    
    -- Pet insurance (Premium/Pro only)
    insurance_provider VARCHAR(255), -- Premium/Pro only
    insurance_policy_number VARCHAR(100), -- Premium/Pro only
    insurance_contact_phone VARCHAR(20), -- Premium/Pro only
    insurance_coverage_details TEXT, -- Premium/Pro only
    
    -- Breeding information (Pro only)
    breeding_status VARCHAR(50), -- Pro only: 'not_applicable', 'intact', 'neutered', 'breeding'
    breeding_notes TEXT, -- Pro only
    sire_name VARCHAR(255), -- Pro only
    dam_name VARCHAR(255), -- Pro only
    registration_number VARCHAR(100), -- Pro only
    registration_organization VARCHAR(100), -- Pro only
    
    -- Health and special needs (all tiers)
    special_needs TEXT,
    allergies TEXT,
    medical_conditions TEXT[],
    
    -- Dietary information as simple notes (all tiers)
    dietary_notes TEXT, -- Combined food allergies and dietary preferences as simple text
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Pet photos table (with subscription limits)
CREATE TABLE pet_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    file_size_bytes BIGINT,
    is_profile_photo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simplified veterinarian info (no complex integration)
CREATE TABLE veterinarians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    clinic_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic health records (simplified, no complex scheduling)
CREATE TABLE health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    record_type VARCHAR(100) NOT NULL, -- 'vaccination', 'medication', 'vet_visit', 'general'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date_recorded DATE NOT NULL,
    veterinarian_name VARCHAR(255), -- Simple text field instead of FK
    clinic_name VARCHAR(255),
    document_urls TEXT[],
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic pet measurements (weight, size tracking)
CREATE TABLE pet_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    measurement_type VARCHAR(50) NOT NULL, -- 'weight', 'height', 'length'
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- 'kg', 'cm', 'lbs', 'in'
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lost pets table (community feature)
CREATE TABLE lost_pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'lost',
    last_seen_location POINT,
    last_seen_address TEXT,
    last_seen_date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    photo_urls TEXT[],
    search_radius_km INTEGER DEFAULT 10,
    found_date TIMESTAMP WITH TIME ZONE,
    found_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table (basic system notifications only)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    pet_id UUID REFERENCES pets(id),
    related_id UUID, -- Generic reference to related records
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    push_sent BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
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
    plan_name VARCHAR(100) NOT NULL, -- 'premium_monthly', 'pro_monthly'
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

CREATE INDEX idx_health_records_pet_id ON health_records(pet_id);
CREATE INDEX idx_health_records_date ON health_records(date_recorded);
CREATE INDEX idx_health_records_type ON health_records(record_type);

CREATE INDEX idx_pet_measurements_pet_id ON pet_measurements(pet_id);
CREATE INDEX idx_pet_measurements_type ON pet_measurements(measurement_type);
CREATE INDEX idx_pet_measurements_date ON pet_measurements(created_at);

CREATE INDEX idx_lost_pets_pet_id ON lost_pets(pet_id);
CREATE INDEX idx_lost_pets_status ON lost_pets(status);
CREATE INDEX idx_lost_pets_location ON lost_pets USING GIST(last_seen_location);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
-- Removed scheduled_for index as scheduling features are not included
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
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_measurements ENABLE ROW LEVEL SECURITY;
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
    
    -- Check if user has active premium or pro subscription
    RETURN status IN ('premium', 'pro') AND (expires_at IS NULL OR expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enhanced pet limit function with tiered subscription support
CREATE OR REPLACE FUNCTION check_pet_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    owner_auth_id UUID;
    user_subscription_status subscription_status;
BEGIN
    -- Get family owner's auth ID and subscription status
    SELECT u.auth_user_id, u.subscription_status INTO owner_auth_id, user_subscription_status
    FROM families f
    JOIN users u ON f.owner_id = u.id
    WHERE f.id = NEW.family_id;
    
    -- Count current pets in family
    SELECT COUNT(*) INTO current_count
    FROM pets p
    WHERE p.family_id = NEW.family_id
    AND p.deleted_at IS NULL;
    
    -- Apply limits based on subscription tier
    IF user_subscription_status = 'free' AND current_count >= 1 THEN
        RAISE EXCEPTION 'Free tier allows only 1 pet. Upgrade to Premium for 2 pets or Pro for unlimited pets.';
    ELSIF user_subscription_status = 'premium' AND current_count >= 2 THEN
        RAISE EXCEPTION 'Premium tier allows up to 2 pets. Upgrade to Pro for unlimited pets.';
    -- Pro tier has unlimited pets (no limit check needed)
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
    
    -- Apply limits based on subscription tier
    -- Get subscription status directly
    DECLARE
        user_subscription_status subscription_status;
    BEGIN
        SELECT u.subscription_status INTO user_subscription_status
        FROM pets p
        JOIN families f ON p.family_id = f.id
        JOIN users u ON f.owner_id = u.id
        WHERE p.id = NEW.pet_id;
        
        -- Apply photo limits: Free = 1 photo, Premium/Pro = 12 photos
        IF user_subscription_status = 'free' AND current_count >= 1 THEN
            RAISE EXCEPTION 'Free tier allows only 1 photo per pet. Upgrade to Premium for 12 photos per pet.';
        ELSIF user_subscription_status IN ('premium', 'pro') AND current_count >= 12 THEN
            RAISE EXCEPTION 'Premium and Pro tiers allow up to 12 photos per pet.';
        END IF;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_photo_limit
    BEFORE INSERT ON files
    FOR EACH ROW
    EXECUTE FUNCTION check_photo_limit();

-- Function to check family member limits based on subscription tier
CREATE OR REPLACE FUNCTION check_family_member_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    owner_auth_id UUID;
    user_subscription_status subscription_status;
BEGIN
    -- Get family owner's auth ID and subscription status
    SELECT u.auth_user_id, u.subscription_status INTO owner_auth_id, user_subscription_status
    FROM families f
    JOIN users u ON f.owner_id = u.id
    WHERE f.id = NEW.family_id;
    
    -- Count current family members (excluding owner)
    SELECT COUNT(*) INTO current_count
    FROM family_members fm
    WHERE fm.family_id = NEW.family_id
    AND fm.user_id != (SELECT f.owner_id FROM families f WHERE f.id = NEW.family_id);
    
    -- Apply limits based on subscription tier
    IF user_subscription_status = 'free' AND current_count >= 1 THEN
        RAISE EXCEPTION 'Free tier allows main user + 1 additional family member (2 total). Upgrade to Premium for main user + 2 additional members (3 total) or Pro for main user + 4 additional members (5 total).';
    ELSIF user_subscription_status = 'premium' AND current_count >= 2 THEN
        RAISE EXCEPTION 'Premium tier allows main user + 2 additional family members (3 total). Upgrade to Pro for main user + 4 additional members (5 total).';
    ELSIF user_subscription_status = 'pro' AND current_count >= 4 THEN
        RAISE EXCEPTION 'Pro tier allows main user + 4 additional family members (5 total maximum).';
    -- Pro tier has unlimited family members (no limit check needed)
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce family member limits
CREATE TRIGGER enforce_family_member_limit
    BEFORE INSERT ON family_members
    FOR EACH ROW
    EXECUTE FUNCTION check_family_member_limit();

-- Premium features are now available at premium and pro tiers
-- Lost pet alerts: Free/Premium users receive notifications (10km radius), Pro users can create alerts
-- No complex scheduling or vaccination reminders

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
        WHEN NEW.status = 'premium' THEN 2
        WHEN NEW.status = 'pro' THEN 100 -- Effectively unlimited
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

-- Health Records and Vaccination Tracking Tables

-- Veterinarians table
CREATE TABLE veterinarians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  clinic_name VARCHAR(200),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health records table
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  record_date DATE NOT NULL,
  veterinarian_id UUID REFERENCES veterinarians(id),
  weight DECIMAL(5,2),
  temperature DECIMAL(4,1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health record photos table (with subscription limits)
CREATE TABLE health_record_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_record_id UUID REFERENCES health_records(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User events table (replaces automatic vaccination tracking)
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'vaccination', 'vet_visit', 'medication', 'reminder'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  reminder_date DATE, -- Optional future reminder date set by user
  veterinarian_name VARCHAR(255),
  notes TEXT,
  is_reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health notifications table (for Premium/Pro users)
CREATE TABLE health_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'vaccination_reminder', 'custom_reminder'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  notification_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  event_id UUID REFERENCES user_events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE pet_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE veterinarians ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_record_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pet_photos
CREATE POLICY "Users can view pet photos for own pets" ON pet_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR fm.user_id = u.id)
      WHERE p.id = pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pet photos for own pets with write access" ON pet_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR (fm.user_id = u.id AND fm.access_level = 'read_write'))
      WHERE p.id = pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pet photos for own pets with write access" ON pet_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR (fm.user_id = u.id AND fm.access_level = 'read_write'))
      WHERE p.id = pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for veterinarians
CREATE POLICY "Users can view own veterinarians" ON veterinarians
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own veterinarians" ON veterinarians
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own veterinarians" ON veterinarians
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own veterinarians" ON veterinarians
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for health records
CREATE POLICY "Users can view own pet health records" ON health_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR fm.user_id = u.id)
      WHERE p.id = pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert health records for own pets" ON health_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR (fm.user_id = u.id AND fm.access_level = 'read_write'))
      WHERE p.id = pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update health records for own pets with write access" ON health_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR (fm.user_id = u.id AND fm.access_level = 'read_write'))
      WHERE p.id = pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete health records for own pets with write access" ON health_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR (fm.user_id = u.id AND fm.access_level = 'read_write'))
      WHERE p.id = pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for health record photos
CREATE POLICY "Users can view health record photos for own pets" ON health_record_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM health_records hr
      JOIN pets p ON hr.pet_id = p.id
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR fm.user_id = u.id)
      WHERE hr.id = health_record_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert health record photos for own pets with write access" ON health_record_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_records hr
      JOIN pets p ON hr.pet_id = p.id
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR (fm.user_id = u.id AND fm.access_level = 'read_write'))
      WHERE hr.id = health_record_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete health record photos for own pets with write access" ON health_record_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM health_records hr
      JOIN pets p ON hr.pet_id = p.id
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR (fm.user_id = u.id AND fm.access_level = 'read_write'))
      WHERE hr.id = health_record_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for user_events (replaces vaccination policies)
CREATE POLICY "Users can view user events for own pets" ON user_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR fm.user_id = u.id)
      WHERE p.id = pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert user events for own pets with write access" ON user_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR (fm.user_id = u.id AND fm.access_level = 'read_write'))
      WHERE p.id = pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update user events for own pets with write access" ON user_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR (fm.user_id = u.id AND fm.access_level = 'read_write'))
      WHERE p.id = pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete user events for own pets with write access" ON user_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN families f ON p.family_id = f.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      JOIN users u ON (f.owner_id = u.id OR (fm.user_id = u.id AND fm.access_level = 'read_write'))
      WHERE p.id = pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for health notifications
CREATE POLICY "Users can view own health notifications" ON health_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own health notifications" ON health_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own health notifications" ON health_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own health notifications" ON health_notifications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Subscription limit triggers for health record photos (Free: 1 photo per record, Premium/Pro: 5 photos per record)
CREATE OR REPLACE FUNCTION check_health_record_photo_limit()
RETURNS TRIGGER AS $
DECLARE
    current_count INTEGER;
    owner_auth_id UUID;
    user_subscription_status subscription_status;
BEGIN
    -- Get health record owner's subscription status
    SELECT u.auth_user_id, u.subscription_status INTO owner_auth_id, user_subscription_status
    FROM health_records hr
    JOIN pets p ON hr.pet_id = p.id
    JOIN families f ON p.family_id = f.id
    JOIN users u ON f.owner_id = u.id
    WHERE hr.id = NEW.health_record_id;
    
    -- Count current photos for this health record
    SELECT COUNT(*) INTO current_count
    FROM health_record_photos hrp
    WHERE hrp.health_record_id = NEW.health_record_id;
    
    -- Apply limits based on subscription tier
    IF user_subscription_status = 'free' AND current_count >= 1 THEN
        RAISE EXCEPTION 'Free tier allows 1 photo per health record. Upgrade to Premium or Pro for 5 photos per health record.';
    ELSIF user_subscription_status IN ('premium', 'pro') AND current_count >= 5 THEN
        RAISE EXCEPTION 'Premium and Pro tiers allow 5 photos per health record.';
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER health_record_photo_limit_trigger
    BEFORE INSERT ON health_record_photos
    FOR EACH ROW
    EXECUTE FUNCTION check_health_record_photo_limit();

-- Subscription limit triggers for veterinarians (Free: 1 vet, Premium/Pro: 3 vets)
CREATE OR REPLACE FUNCTION check_veterinarian_limit()
RETURNS TRIGGER AS $
DECLARE
    current_count INTEGER;
    owner_auth_id UUID;
    user_subscription_status subscription_status;
BEGIN
    -- Get user's subscription status
    SELECT u.auth_user_id, u.subscription_status INTO owner_auth_id, user_subscription_status
    FROM users u
    WHERE u.id = NEW.user_id;
    
    -- Count current veterinarians for this user
    SELECT COUNT(*) INTO current_count
    FROM veterinarians v
    WHERE v.user_id = NEW.user_id;
    
    -- Apply limits based on subscription tier
    IF user_subscription_status = 'free' AND current_count >= 1 THEN
        RAISE EXCEPTION 'Free tier allows 1 veterinarian contact. Upgrade to Premium or Pro for 3 veterinarian contacts.';
    ELSIF user_subscription_status IN ('premium', 'pro') AND current_count >= 3 THEN
        RAISE EXCEPTION 'Premium and Pro tiers allow 3 veterinarian contacts.';
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER veterinarian_limit_trigger
    BEFORE INSERT ON veterinarians
    FOR EACH ROW
    EXECUTE FUNCTION check_veterinarian_limit();

-- Function to check if user can create notifications (Premium/Pro only)
CREATE OR REPLACE FUNCTION check_notification_permission()
RETURNS TRIGGER AS $
DECLARE
    user_subscription_status subscription_status;
BEGIN
    -- Get user's subscription status
    SELECT u.subscription_status INTO user_subscription_status
    FROM users u
    WHERE u.id = NEW.user_id;
    
    -- Only Premium and Pro users can create notifications
    IF user_subscription_status = 'free' THEN
        RAISE EXCEPTION 'Health notifications are available in Premium and Pro tiers only. Free tier users cannot set reminders.';
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER notification_permission_trigger
    BEFORE INSERT ON health_notifications
    FOR EACH ROW
    EXECUTE FUNCTION check_notification_permission();

-- Pet photos subscription limits trigger
CREATE OR REPLACE FUNCTION check_pet_photo_limits()
RETURNS TRIGGER AS $
DECLARE
    user_subscription_status subscription_status;
    user_id UUID;
    current_photo_count INTEGER;
    max_photos INTEGER;
BEGIN
    -- Get user ID and subscription status from pet
    SELECT p.user_id, u.subscription_status INTO user_id, user_subscription_status
    FROM pets p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = NEW.pet_id;
    
    -- Set photo limits based on subscription
    IF user_subscription_status = 'free' THEN
        max_photos := 1;
    ELSE -- Premium and Pro both get 12 photos
        max_photos := 12;
    END IF;
    
    -- Count current photos for this pet
    SELECT COUNT(*) INTO current_photo_count
    FROM pet_photos
    WHERE pet_id = NEW.pet_id;
    
    -- Check if adding this photo would exceed the limit
    IF current_photo_count >= max_photos THEN
        RAISE EXCEPTION 'Photo limit exceeded. % users can add up to % photos per pet. % for more photos.',
            CASE 
                WHEN user_subscription_status = 'free' THEN 'Free'
                WHEN user_subscription_status = 'premium' THEN 'Premium'
                ELSE 'Pro'
            END,
            max_photos,
            CASE 
                WHEN user_subscription_status = 'free' THEN 'Upgrade to Premium'
                ELSE 'Maximum photo limit reached'
            END;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER pet_photo_limits_trigger
    BEFORE INSERT ON pet_photos
    FOR EACH ROW
    EXECUTE FUNCTION check_pet_photo_limits();

-- Comments for future enhancements
/*
  STRIPE INTEGRATION NOTES:
  
  1. Webhook Security:
     - All webhook events are logged in stripe_webhook_events table
     - Use Stripe signature verification before processing
     - Implement idempotency using stripe_event_id
  
  2. Subscription Management:
     - Premium tier: €5.99/month (3 total family members, 2 pets, enhanced features)
     - Pro tier: €8.99/month (5 total family members, unlimited pets, CSV/PDF data export, lost pet reporting)
     - Free tier: 2 total family members, 1 photo per health record, 1 vet contact, no reminders, lost pet notifications only
  
  3. Payment Processing:
     - All amounts stored in EUR cents (multiply by 100)
     - Support for SEPA, cards, and other EU payment methods
     - Automatic retry logic for failed payments
     - Proper refund handling
  
  4. Feature Access Control:
     - Premium features are enforced at database level via triggers
     - Feature usage is tracked for analytics and limit enforcement
     - Subscription status is synced automatically from Stripe webhooks
     - Health notifications require Premium/Pro subscription
     - Health record photo limits: Free (1), Premium/Pro (5)
     - Veterinarian contact limits: Free (1), Premium/Pro (3)
*/