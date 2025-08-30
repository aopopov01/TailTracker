-- TailTracker Pet Wellness & Care Management Database Schema
-- Comprehensive health tracking and family coordination platform
-- Removed ALL GPS tracking infrastructure - Focus on wellness and care management
-- HIPAA-compliant design for pet health data

-- Enable required extensions (NO PostGIS - GPS removed)
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

-- Core Users table with enhanced family coordination
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

-- Enhanced Families/Households table for comprehensive care coordination
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Family settings
    invite_code VARCHAR(12) UNIQUE NOT NULL,
    max_members INTEGER DEFAULT 2, -- Free: 2, Premium: 8 members
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_units VARCHAR(10) DEFAULT 'metric', -- metric/imperial
    
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
    
    -- Specializations for caregivers
    specialization TEXT, -- e.g., "Medication management", "Exercise specialist"
    
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(family_id, user_id)
);

-- Enhanced Pets table with comprehensive health profiles
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100) NOT NULL,
    breed VARCHAR(100),
    mixed_breed_details TEXT,
    color_markings TEXT,
    gender VARCHAR(20),
    date_of_birth DATE,
    date_adopted DATE,
    
    -- Physical characteristics
    weight_kg DECIMAL(6,3),
    height_cm DECIMAL(6,2),
    length_cm DECIMAL(6,2),
    microchip_number VARCHAR(50),
    
    -- Health status
    current_health_status health_status DEFAULT 'good',
    current_activity_level activity_level DEFAULT 'moderate',
    
    -- Insurance and identification
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    registration_number VARCHAR(100),
    
    -- Status and care
    status pet_status DEFAULT 'active',
    profile_photo_url TEXT,
    
    -- Emergency information
    primary_emergency_contact VARCHAR(255),
    primary_emergency_phone VARCHAR(20),
    secondary_emergency_contact VARCHAR(255),
    secondary_emergency_phone VARCHAR(20),
    
    -- Special needs and care instructions
    special_needs TEXT,
    dietary_restrictions TEXT,
    allergies TEXT,
    behavioral_notes TEXT,
    emergency_medical_notes TEXT,
    
    -- Care preferences
    preferred_feeding_times TIME[],
    preferred_exercise_times TIME[],
    exercise_requirements TEXT,
    social_preferences TEXT,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Comprehensive Health Metrics table
CREATE TABLE health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES users(id),
    
    -- Metric details
    metric_type health_metric_type NOT NULL,
    value DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    
    -- Context and notes
    measurement_method VARCHAR(100), -- e.g., "Digital scale", "Veterinary exam"
    notes TEXT,
    is_estimated BOOLEAN DEFAULT false,
    
    -- Timing
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexing for analytics
    INDEX idx_health_metrics_pet_type (pet_id, metric_type),
    INDEX idx_health_metrics_recorded_at (recorded_at)
);

-- Behavioral Tracking table
CREATE TABLE behavioral_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    observed_by UUID NOT NULL REFERENCES users(id),
    
    -- Behavior details
    category behavioral_category NOT NULL,
    behavior_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    intensity_level INTEGER CHECK (intensity_level BETWEEN 1 AND 5),
    
    -- Context
    trigger_factors TEXT,
    environmental_factors TEXT,
    duration_minutes INTEGER,
    
    -- Associated media
    photo_urls TEXT[],
    video_urls TEXT[],
    
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Veterinarians table with specializations
CREATE TABLE veterinarians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Contact information
    name VARCHAR(255) NOT NULL,
    clinic_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    website_url TEXT,
    
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2),
    
    -- Professional details
    license_number VARCHAR(100),
    specializations TEXT[], -- Array of specialization areas
    certifications TEXT[],
    years_experience INTEGER,
    
    -- Services and hours
    services_offered TEXT[],
    emergency_services BOOLEAN DEFAULT false,
    after_hours_contact TEXT,
    
    -- Ratings and reviews
    average_rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    
    -- Integration
    practice_management_system VARCHAR(100),
    accepts_online_booking BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pet-Veterinarian relationships
CREATE TABLE pet_veterinarians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id) ON DELETE CASCADE,
    
    relationship_type VARCHAR(50) DEFAULT 'primary', -- 'primary', 'specialist', 'emergency', 'consultant'
    is_active BOOLEAN DEFAULT true,
    
    -- Care history
    first_visit_date DATE,
    last_visit_date DATE,
    total_visits INTEGER DEFAULT 0,
    
    -- Communication preferences
    preferred_communication VARCHAR(20) DEFAULT 'email', -- email, phone, app
    emergency_contact BOOLEAN DEFAULT false,
    
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pet_id, veterinarian_id)
);

-- Comprehensive Medical Records
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    veterinarian_id UUID REFERENCES veterinarians(id),
    
    -- Record classification
    record_type VARCHAR(100) NOT NULL, -- 'examination', 'surgery', 'emergency', 'routine', 'dental', 'vaccination', 'diagnostic'
    visit_type VARCHAR(50), -- 'routine', 'emergency', 'follow_up', 'consultation'
    title VARCHAR(255) NOT NULL,
    
    -- Medical details
    chief_complaint TEXT,
    symptoms TEXT[],
    diagnosis TEXT,
    differential_diagnosis TEXT,
    treatment_plan TEXT,
    medications_prescribed TEXT,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_instructions TEXT,
    
    -- Assessment
    body_weight_kg DECIMAL(6,3),
    body_temperature_c DECIMAL(4,2),
    heart_rate_bpm INTEGER,
    respiratory_rate_per_min INTEGER,
    body_condition_score INTEGER CHECK (body_condition_score BETWEEN 1 AND 9),
    
    -- Financial
    cost DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    insurance_claim_number VARCHAR(100),
    
    -- Documentation
    document_urls TEXT[],
    lab_results JSONB,
    
    -- Timing
    date_of_record TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Vaccinations table with comprehensive tracking
CREATE TABLE vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    veterinarian_id UUID REFERENCES veterinarians(id),
    
    -- Vaccine details
    vaccine_name VARCHAR(255) NOT NULL,
    vaccine_type VARCHAR(100), -- 'core', 'non-core', 'lifestyle'
    manufacturer VARCHAR(100),
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    
    -- Administration
    administered_date DATE NOT NULL,
    administered_by VARCHAR(255),
    administration_site VARCHAR(50), -- 'left shoulder', 'right shoulder', etc.
    
    -- Scheduling
    next_due_date DATE,
    frequency_months INTEGER,
    is_annual BOOLEAN DEFAULT false,
    
    -- Reactions and notes
    adverse_reactions TEXT,
    notes TEXT,
    
    -- Documentation
    certificate_url TEXT,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprehensive Medications table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    prescribed_by UUID REFERENCES veterinarians(id),
    
    -- Medication details
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    medication_type VARCHAR(100), -- 'antibiotic', 'pain_relief', 'supplement', etc.
    form VARCHAR(50), -- 'tablet', 'liquid', 'injection', 'topical'
    strength VARCHAR(100),
    
    -- Dosage and administration
    dosage_amount VARCHAR(100) NOT NULL,
    dosage_unit VARCHAR(20) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    administration_instructions TEXT,
    
    -- Treatment period
    start_date DATE NOT NULL,
    end_date DATE,
    duration_days INTEGER,
    
    -- Status and monitoring
    active BOOLEAN DEFAULT true,
    refills_remaining INTEGER,
    total_quantity_prescribed VARCHAR(100),
    
    -- Safety and monitoring
    side_effects TEXT,
    contraindications TEXT,
    monitoring_requirements TEXT,
    drug_interactions TEXT,
    
    -- Administration tracking
    last_administered_at TIMESTAMP WITH TIME ZONE,
    next_dose_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication Administration Log
CREATE TABLE medication_administrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    administered_by UUID NOT NULL REFERENCES users(id),
    
    -- Administration details
    dose_given VARCHAR(100) NOT NULL,
    administered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    method VARCHAR(50), -- 'oral', 'injection', 'topical'
    
    -- Context and notes
    notes TEXT,
    missed_dose BOOLEAN DEFAULT false,
    late_dose BOOLEAN DEFAULT false,
    
    -- Reactions
    observed_effects TEXT,
    adverse_reactions TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Care Tasks Management
CREATE TABLE care_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    
    -- Task details
    task_type care_task_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    
    -- Assignment and scheduling
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID NOT NULL REFERENCES users(id),
    priority care_task_priority DEFAULT 'normal',
    
    -- Timing
    due_date DATE,
    due_time TIME,
    estimated_duration_minutes INTEGER,
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(100), -- 'daily', 'weekly', 'monthly', 'custom'
    recurrence_interval INTEGER,
    recurrence_days INTEGER[], -- Days of week for weekly tasks
    
    -- Status tracking
    status care_task_status DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id),
    
    -- Task-specific data
    task_data JSONB, -- Flexible storage for task-specific information
    
    -- Notes and updates
    completion_notes TEXT,
    photo_urls TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Care Task Templates for common recurring tasks
CREATE TABLE care_task_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    
    -- Template details
    name VARCHAR(255) NOT NULL,
    task_type care_task_type NOT NULL,
    description TEXT,
    instructions TEXT,
    
    -- Default settings
    default_priority care_task_priority DEFAULT 'normal',
    estimated_duration_minutes INTEGER,
    default_recurrence VARCHAR(100),
    
    -- Template data
    template_data JSONB,
    
    is_system_template BOOLEAN DEFAULT false, -- System vs user-created
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Notifications with wellness intelligence
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id),
    
    -- Notification details
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Priority and urgency
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    is_urgent BOOLEAN DEFAULT false,
    
    -- Related records
    related_id UUID,
    related_table VARCHAR(50),
    
    -- Scheduling and delivery
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Action and interaction
    action_url TEXT,
    action_label VARCHAR(100),
    requires_acknowledgment BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery channels
    push_sent BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    
    -- Analytics
    opened BOOLEAN DEFAULT false,
    clicked BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness Analytics and Insights
CREATE TABLE wellness_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    generated_by_system BOOLEAN DEFAULT true,
    
    -- Insight details
    insight_type VARCHAR(100) NOT NULL, -- 'weight_trend', 'activity_pattern', 'health_alert', 'care_recommendation'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Analysis data
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    trend_direction wellness_trend,
    
    -- Time period analyzed
    analysis_start_date DATE,
    analysis_end_date DATE,
    
    -- Recommendations
    recommendations TEXT[],
    action_required BOOLEAN DEFAULT false,
    urgency_level emergency_level DEFAULT 'low',
    
    -- Data sources
    data_sources TEXT[], -- Which metrics/data contributed to this insight
    
    -- User interaction
    user_feedback TEXT,
    is_helpful BOOLEAN,
    dismissed_by UUID REFERENCES users(id),
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics metadata
    algorithm_version VARCHAR(20),
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Care Schedules and Routines
CREATE TABLE care_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    
    -- Schedule details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Schedule type and pattern
    schedule_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'seasonal'
    is_active BOOLEAN DEFAULT true,
    
    -- Timing
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Days and times
    days_of_week INTEGER[], -- 1=Monday, 7=Sunday
    times TIME[],
    
    -- Associated tasks
    associated_tasks UUID[], -- Array of care_task_template IDs
    
    -- Notifications
    notification_enabled BOOLEAN DEFAULT true,
    notification_advance_minutes INTEGER DEFAULT 30,
    
    -- Responsibility
    default_assignee UUID REFERENCES users(id),
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo and Document Management
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    family_id UUID NOT NULL REFERENCES families(id),
    pet_id UUID REFERENCES pets(id),
    
    -- File details
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    content_type VARCHAR(100),
    file_size BIGINT,
    
    -- Storage
    storage_path TEXT NOT NULL,
    bucket_name VARCHAR(100) NOT NULL,
    checksum VARCHAR(64),
    
    -- File metadata
    file_category VARCHAR(50), -- 'profile_photo', 'medical_document', 'care_photo', 'progress_photo'
    tags TEXT[],
    description TEXT,
    
    -- Privacy and sharing
    is_public BOOLEAN DEFAULT false,
    is_shared_with_family BOOLEAN DEFAULT true,
    
    -- Context
    related_record_id UUID,
    related_record_type VARCHAR(50),
    
    -- AI analysis results (if applicable)
    ai_analysis_results JSONB,
    
    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family Communication and Updates
CREATE TABLE family_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    posted_by UUID NOT NULL REFERENCES users(id),
    pet_id UUID REFERENCES pets(id),
    
    -- Update details
    update_type VARCHAR(50) NOT NULL, -- 'general', 'health', 'milestone', 'concern', 'celebration'
    title VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Media
    photo_urls TEXT[],
    video_urls TEXT[],
    
    -- Interaction
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    
    -- Privacy
    is_private BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments on family updates
CREATE TABLE family_update_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    update_id UUID NOT NULL REFERENCES family_updates(id) ON DELETE CASCADE,
    commenter_id UUID NOT NULL REFERENCES users(id),
    
    content TEXT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Health Protocols
CREATE TABLE emergency_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    
    -- Protocol details
    condition_name VARCHAR(255) NOT NULL,
    emergency_level emergency_level NOT NULL,
    
    -- Response instructions
    immediate_actions TEXT[] NOT NULL,
    warning_signs TEXT[],
    when_to_call_vet TEXT,
    
    -- Emergency contacts (pet-specific overrides)
    emergency_vet_name VARCHAR(255),
    emergency_vet_phone VARCHAR(20),
    poison_control_number VARCHAR(20),
    
    -- Medications for emergencies
    emergency_medications JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_reviewed_date DATE,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription and Payment tables (unchanged from original)
CREATE TABLE subscriptions (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GDPR compliance table
CREATE TABLE gdpr_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    request_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    data_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ================================================================================================
-- COMPREHENSIVE INDEXING STRATEGY FOR WELLNESS PLATFORM PERFORMANCE
-- ================================================================================================

-- Users table indexes
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_subscription_expires ON users(subscription_expires_at) WHERE subscription_expires_at IS NOT NULL;
CREATE INDEX idx_users_trial_ends ON users(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX idx_users_professional_license ON users(professional_license) WHERE professional_license IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

-- Families and family members indexes
CREATE INDEX idx_families_owner_id ON families(owner_id);
CREATE INDEX idx_families_invite_code ON families(invite_code);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_role ON family_members(role);

-- Pets table indexes - optimized for wellness queries
CREATE INDEX idx_pets_family_id ON pets(family_id);
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_pets_health_status ON pets(current_health_status);
CREATE INDEX idx_pets_species_breed ON pets(species, breed);
CREATE INDEX idx_pets_created_by ON pets(created_by);
CREATE INDEX idx_pets_deleted_at ON pets(deleted_at) WHERE deleted_at IS NULL;

-- Health metrics indexes - critical for analytics
CREATE INDEX idx_health_metrics_pet_type ON health_metrics(pet_id, metric_type);
CREATE INDEX idx_health_metrics_recorded_at ON health_metrics(recorded_at);
CREATE INDEX idx_health_metrics_pet_recorded ON health_metrics(pet_id, recorded_at DESC);
CREATE INDEX idx_health_metrics_type_recorded ON health_metrics(metric_type, recorded_at DESC);

-- Behavioral observations indexes
CREATE INDEX idx_behavioral_obs_pet_id ON behavioral_observations(pet_id);
CREATE INDEX idx_behavioral_obs_category ON behavioral_observations(category);
CREATE INDEX idx_behavioral_obs_observed_at ON behavioral_observations(observed_at DESC);
CREATE INDEX idx_behavioral_obs_pet_category ON behavioral_observations(pet_id, category);

-- Veterinarians indexes
CREATE INDEX idx_veterinarians_location ON veterinarians(city, state, country);
CREATE INDEX idx_veterinarians_specializations ON veterinarians USING gin(specializations);
CREATE INDEX idx_veterinarians_emergency ON veterinarians(emergency_services) WHERE emergency_services = true;
CREATE INDEX idx_veterinarians_rating ON veterinarians(average_rating DESC) WHERE average_rating IS NOT NULL;

-- Pet-veterinarian relationship indexes
CREATE INDEX idx_pet_vets_pet_id ON pet_veterinarians(pet_id);
CREATE INDEX idx_pet_vets_vet_id ON pet_veterinarians(veterinarian_id);
CREATE INDEX idx_pet_vets_relationship ON pet_veterinarians(relationship_type);
CREATE INDEX idx_pet_vets_active ON pet_veterinarians(is_active) WHERE is_active = true;

-- Medical records indexes - optimized for health history queries
CREATE INDEX idx_medical_records_pet_id ON medical_records(pet_id);
CREATE INDEX idx_medical_records_date ON medical_records(date_of_record DESC);
CREATE INDEX idx_medical_records_type ON medical_records(record_type);
CREATE INDEX idx_medical_records_vet_id ON medical_records(veterinarian_id);
CREATE INDEX idx_medical_records_pet_date ON medical_records(pet_id, date_of_record DESC);
CREATE INDEX idx_medical_records_follow_up ON medical_records(follow_up_required, follow_up_date) WHERE follow_up_required = true;

-- Vaccinations indexes
CREATE INDEX idx_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX idx_vaccinations_next_due_date ON vaccinations(next_due_date) WHERE next_due_date IS NOT NULL;
CREATE INDEX idx_vaccinations_administered_date ON vaccinations(administered_date DESC);
CREATE INDEX idx_vaccinations_vaccine_name ON vaccinations(vaccine_name);
CREATE INDEX idx_vaccinations_pet_next_due ON vaccinations(pet_id, next_due_date) WHERE next_due_date IS NOT NULL;

-- Medications indexes - optimized for active medication queries
CREATE INDEX idx_medications_pet_id ON medications(pet_id);
CREATE INDEX idx_medications_active ON medications(active) WHERE active = true;
CREATE INDEX idx_medications_end_date ON medications(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX idx_medications_pet_active ON medications(pet_id, active) WHERE active = true;
CREATE INDEX idx_medications_prescribed_by ON medications(prescribed_by);

-- Medication administrations indexes
CREATE INDEX idx_med_admin_medication_id ON medication_administrations(medication_id);
CREATE INDEX idx_med_admin_administered_at ON medication_administrations(administered_at DESC);
CREATE INDEX idx_med_admin_administered_by ON medication_administrations(administered_by);

-- Care tasks indexes - optimized for task management
CREATE INDEX idx_care_tasks_family_id ON care_tasks(family_id);
CREATE INDEX idx_care_tasks_pet_id ON care_tasks(pet_id);
CREATE INDEX idx_care_tasks_assigned_to ON care_tasks(assigned_to);
CREATE INDEX idx_care_tasks_status ON care_tasks(status);
CREATE INDEX idx_care_tasks_due_date ON care_tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_care_tasks_priority ON care_tasks(priority);
CREATE INDEX idx_care_tasks_type ON care_tasks(task_type);
CREATE INDEX idx_care_tasks_recurring ON care_tasks(is_recurring) WHERE is_recurring = true;
CREATE INDEX idx_care_tasks_overdue ON care_tasks(due_date, status) WHERE status IN ('pending', 'in_progress') AND due_date < CURRENT_DATE;

-- Care task templates indexes
CREATE INDEX idx_task_templates_family_id ON care_task_templates(family_id);
CREATE INDEX idx_task_templates_type ON care_task_templates(task_type);
CREATE INDEX idx_task_templates_system ON care_task_templates(is_system_template);

-- Notifications indexes - optimized for user notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_family_id ON notifications(family_id);
CREATE INDEX idx_notifications_pet_id ON notifications(pet_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_urgent ON notifications(is_urgent) WHERE is_urgent = true;
CREATE INDEX idx_notifications_priority ON notifications(priority DESC);

-- Wellness insights indexes
CREATE INDEX idx_wellness_insights_pet_id ON wellness_insights(pet_id);
CREATE INDEX idx_wellness_insights_type ON wellness_insights(insight_type);
CREATE INDEX idx_wellness_insights_generated_at ON wellness_insights(generated_at DESC);
CREATE INDEX idx_wellness_insights_urgency ON wellness_insights(urgency_level);
CREATE INDEX idx_wellness_insights_active ON wellness_insights(expires_at) WHERE expires_at > NOW();

-- Care schedules indexes
CREATE INDEX idx_care_schedules_family_id ON care_schedules(family_id);
CREATE INDEX idx_care_schedules_pet_id ON care_schedules(pet_id);
CREATE INDEX idx_care_schedules_active ON care_schedules(is_active) WHERE is_active = true;
CREATE INDEX idx_care_schedules_assignee ON care_schedules(default_assignee);

-- Files indexes
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_family_id ON files(family_id);
CREATE INDEX idx_files_pet_id ON files(pet_id);
CREATE INDEX idx_files_category ON files(file_category);
CREATE INDEX idx_files_content_type ON files(content_type);
CREATE INDEX idx_files_created_at ON files(created_at DESC);

-- Family updates indexes
CREATE INDEX idx_family_updates_family_id ON family_updates(family_id);
CREATE INDEX idx_family_updates_posted_by ON family_updates(posted_by);
CREATE INDEX idx_family_updates_pet_id ON family_updates(pet_id);
CREATE INDEX idx_family_updates_type ON family_updates(update_type);
CREATE INDEX idx_family_updates_created_at ON family_updates(created_at DESC);

-- Family update comments indexes
CREATE INDEX idx_update_comments_update_id ON family_update_comments(update_id);
CREATE INDEX idx_update_comments_commenter_id ON family_update_comments(commenter_id);

-- Emergency protocols indexes
CREATE INDEX idx_emergency_protocols_pet_id ON emergency_protocols(pet_id);
CREATE INDEX idx_emergency_protocols_level ON emergency_protocols(emergency_level);
CREATE INDEX idx_emergency_protocols_active ON emergency_protocols(is_active) WHERE is_active = true;

-- Subscription and audit indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_gdpr_requests_user_id ON gdpr_requests(user_id);
CREATE INDEX idx_gdpr_requests_status ON gdpr_requests(status);

-- ================================================================================================
-- FULL-TEXT SEARCH INDEXES FOR WELLNESS PLATFORM
-- ================================================================================================

-- Pets search - name, breed, color, notes
CREATE INDEX idx_pets_search ON pets USING gin(
    to_tsvector('english', 
        name || ' ' || 
        COALESCE(breed, '') || ' ' || 
        COALESCE(color_markings, '') || ' ' ||
        COALESCE(special_needs, '') || ' ' ||
        COALESCE(behavioral_notes, '')
    )
);

-- Veterinarians search - name, clinic, specializations
CREATE INDEX idx_veterinarians_search ON veterinarians USING gin(
    to_tsvector('english', 
        name || ' ' || 
        COALESCE(clinic_name, '') || ' ' ||
        COALESCE(array_to_string(specializations, ' '), '')
    )
);

-- Medical records search - diagnosis, treatment, symptoms
CREATE INDEX idx_medical_records_search ON medical_records USING gin(
    to_tsvector('english',
        title || ' ' ||
        COALESCE(chief_complaint, '') || ' ' ||
        COALESCE(diagnosis, '') || ' ' ||
        COALESCE(treatment_plan, '')
    )
);

-- Care tasks search - title, description, instructions
CREATE INDEX idx_care_tasks_search ON care_tasks USING gin(
    to_tsvector('english',
        title || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(instructions, '')
    )
);

-- ================================================================================================
-- ADVANCED COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ================================================================================================

-- Pet health metrics time-series queries
CREATE INDEX idx_health_metrics_timeseries ON health_metrics(pet_id, metric_type, recorded_at DESC, value);

-- Active medications per pet
CREATE INDEX idx_medications_active_pet ON medications(pet_id, active, start_date DESC, end_date) WHERE active = true;

-- Upcoming care tasks by family
CREATE INDEX idx_care_tasks_upcoming ON care_tasks(family_id, status, due_date) WHERE status IN ('pending', 'in_progress') AND due_date >= CURRENT_DATE;

-- Recent medical records by pet
CREATE INDEX idx_medical_records_recent ON medical_records(pet_id, date_of_record DESC, record_type) WHERE date_of_record >= (CURRENT_DATE - INTERVAL '2 years');

-- Unread notifications by user and priority
CREATE INDEX idx_notifications_unread_priority ON notifications(user_id, read_at, priority DESC, created_at DESC) WHERE read_at IS NULL;

-- Pet wellness summary (health status + activity level + last medical record)
CREATE INDEX idx_pets_wellness_summary ON pets(family_id, current_health_status, current_activity_level, status) WHERE deleted_at IS NULL;

-- ================================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR WELLNESS PLATFORM
-- ================================================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE veterinarians ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_veterinarians ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_update_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Core user policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Family access policies
CREATE POLICY "Family members can view family details" ON families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = families.id 
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Family owners can manage family" ON families
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = families.owner_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Family members policies
CREATE POLICY "Family members can view other members" ON family_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm2
      JOIN users u ON fm2.user_id = u.id
      WHERE fm2.family_id = family_members.family_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Pet access policies - comprehensive family-based access
CREATE POLICY "Family members can view family pets" ON pets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = pets.family_id 
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Family caregivers can manage pets" ON pets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = pets.family_id 
      AND u.auth_user_id = auth.uid()
      AND (fm.role IN ('owner', 'caregiver') OR fm.can_manage_pets = true)
    )
  );

-- Health metrics policies - sensitive health data
CREATE POLICY "Family members can view pet health metrics" ON health_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = health_metrics.pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized caregivers can manage health metrics" ON health_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = health_metrics.pet_id
      AND u.auth_user_id = auth.uid()
      AND (fm.role IN ('owner', 'caregiver', 'veterinarian') OR fm.can_manage_health_records = true)
    )
  );

-- Medical records policies - highly sensitive
CREATE POLICY "Family members can view medical records" ON medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = medical_records.pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can manage medical records" ON medical_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = medical_records.pet_id
      AND u.auth_user_id = auth.uid()
      AND (fm.role IN ('owner', 'caregiver', 'veterinarian') OR fm.can_manage_health_records = true)
    )
  );

-- Care tasks policies
CREATE POLICY "Family members can view care tasks" ON care_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = care_tasks.family_id 
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Assigned users can update care tasks" ON care_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE (u.id = care_tasks.assigned_to OR u.id = care_tasks.assigned_by)
      AND u.auth_user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = notifications.user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Service role policies for system operations
CREATE POLICY "Service role can manage all data" ON pets
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage health metrics" ON health_metrics
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage notifications" ON notifications
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL TO service_role USING (true);

-- ================================================================================================
-- WELLNESS-SPECIFIC FUNCTIONS AND TRIGGERS
-- ================================================================================================

-- Function to calculate pet age
CREATE OR REPLACE FUNCTION calculate_pet_age(birth_date DATE)
RETURNS INTERVAL AS $$
BEGIN
    IF birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN age(CURRENT_DATE, birth_date);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get latest health metric for a pet
CREATE OR REPLACE FUNCTION get_latest_health_metric(pet_uuid UUID, metric_name health_metric_type)
RETURNS TABLE(value DECIMAL(10,3), unit VARCHAR(20), recorded_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY
    SELECT hm.value, hm.unit, hm.recorded_at
    FROM health_metrics hm
    WHERE hm.pet_id = pet_uuid 
    AND hm.metric_type = metric_name
    ORDER BY hm.recorded_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check subscription limits for wellness features
CREATE OR REPLACE FUNCTION check_wellness_feature_limit(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_subscription subscription_status;
    current_count INTEGER;
BEGIN
    -- Get user's subscription status
    SELECT u.subscription_status INTO user_subscription
    FROM users u
    WHERE u.id = user_uuid;
    
    -- Premium users have no limits
    IF user_subscription IN ('premium', 'family') THEN
        RETURN TRUE;
    END IF;
    
    -- Check feature-specific limits for free users
    CASE feature_name
        WHEN 'health_metrics_per_pet' THEN
            -- Free: 10 metrics per pet per month
            SELECT COUNT(*) INTO current_count
            FROM health_metrics hm
            JOIN pets p ON hm.pet_id = p.id
            JOIN family_members fm ON p.family_id = fm.family_id
            WHERE fm.user_id = user_uuid
            AND hm.recorded_at >= date_trunc('month', CURRENT_DATE);
            
            RETURN current_count < 10;
            
        WHEN 'care_tasks_per_family' THEN
            -- Free: 20 active tasks per family
            SELECT COUNT(*) INTO current_count
            FROM care_tasks ct
            JOIN family_members fm ON ct.family_id = fm.family_id
            WHERE fm.user_id = user_uuid
            AND ct.status IN ('pending', 'in_progress');
            
            RETURN current_count < 20;
            
        WHEN 'photos_per_pet' THEN
            -- Free: 5 photos per pet
            SELECT COUNT(*) INTO current_count
            FROM files f
            JOIN pets p ON f.pet_id = p.id
            JOIN family_members fm ON p.family_id = fm.family_id
            WHERE fm.user_id = user_uuid
            AND f.content_type LIKE 'image/%'
            AND f.pet_id IS NOT NULL;
            
            RETURN current_count < 5;
            
        ELSE
            -- Default to allowing feature for unknown features
            RETURN TRUE;
    END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to generate wellness insights
CREATE OR REPLACE FUNCTION generate_pet_wellness_score(pet_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 100;
    latest_weight DECIMAL(10,3);
    weight_trend DECIMAL(10,3);
    days_since_last_vet INTEGER;
    overdue_vaccinations INTEGER;
    active_medications INTEGER;
BEGIN
    -- Weight trend analysis (impact: -20 to +0 points)
    SELECT hm.value INTO latest_weight
    FROM health_metrics hm
    WHERE hm.pet_id = pet_uuid 
    AND hm.metric_type = 'weight'
    ORDER BY hm.recorded_at DESC
    LIMIT 1;
    
    -- Calculate weight change over last 3 months
    WITH weight_comparison AS (
        SELECT 
            FIRST_VALUE(value) OVER (ORDER BY recorded_at DESC) as current_weight,
            FIRST_VALUE(value) OVER (ORDER BY recorded_at ASC) as past_weight
        FROM health_metrics 
        WHERE pet_id = pet_uuid 
        AND metric_type = 'weight'
        AND recorded_at >= CURRENT_DATE - INTERVAL '3 months'
        LIMIT 2
    )
    SELECT (current_weight - past_weight) INTO weight_trend FROM weight_comparison LIMIT 1;
    
    -- Penalize significant weight changes
    IF ABS(weight_trend) > 2 THEN
        score := score - 15;
    ELSIF ABS(weight_trend) > 1 THEN
        score := score - 5;
    END IF;
    
    -- Veterinary care recency (impact: -30 to +0 points)
    SELECT EXTRACT(DAYS FROM NOW() - MAX(date_of_record))::INTEGER INTO days_since_last_vet
    FROM medical_records mr
    WHERE mr.pet_id = pet_uuid;
    
    IF days_since_last_vet > 365 THEN
        score := score - 30;
    ELSIF days_since_last_vet > 180 THEN
        score := score - 15;
    END IF;
    
    -- Vaccination status (impact: -25 to +0 points)
    SELECT COUNT(*) INTO overdue_vaccinations
    FROM vaccinations v
    WHERE v.pet_id = pet_uuid
    AND v.next_due_date < CURRENT_DATE;
    
    score := score - (overdue_vaccinations * 10);
    
    -- Active medications compliance (impact: -15 to +0 points)
    SELECT COUNT(*) INTO active_medications
    FROM medications m
    WHERE m.pet_id = pet_uuid
    AND m.active = true
    AND m.end_date IS NULL;
    
    -- More than 3 active medications might indicate health issues
    IF active_medications > 3 THEN
        score := score - 15;
    END IF;
    
    -- Ensure score stays within bounds
    score := GREATEST(0, LEAST(100, score));
    
    RETURN score;
END;
$$ LANGUAGE plpgsql STABLE;

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

CREATE TRIGGER update_medical_records_updated_at
    BEFORE UPDATE ON medical_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_tasks_updated_at
    BEFORE UPDATE ON care_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values
    ) VALUES (
        (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_medical_records_changes
    AFTER INSERT OR UPDATE OR DELETE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_health_metrics_changes
    AFTER INSERT OR UPDATE OR DELETE ON health_metrics
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_medications_changes
    AFTER INSERT OR UPDATE OR DELETE ON medications
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

-- ================================================================================================
-- WELLNESS ANALYTICS MATERIALIZED VIEWS
-- ================================================================================================

-- Pet health summary materialized view for dashboard performance
CREATE MATERIALIZED VIEW pet_health_summary AS
SELECT 
    p.id as pet_id,
    p.name as pet_name,
    p.family_id,
    p.current_health_status,
    p.current_activity_level,
    
    -- Latest metrics
    (SELECT hm.value FROM health_metrics hm 
     WHERE hm.pet_id = p.id AND hm.metric_type = 'weight' 
     ORDER BY hm.recorded_at DESC LIMIT 1) as latest_weight_kg,
     
    (SELECT hm.recorded_at FROM health_metrics hm 
     WHERE hm.pet_id = p.id AND hm.metric_type = 'weight' 
     ORDER BY hm.recorded_at DESC LIMIT 1) as weight_recorded_at,
    
    -- Medical history
    (SELECT MAX(mr.date_of_record) FROM medical_records mr 
     WHERE mr.pet_id = p.id) as last_vet_visit,
     
    (SELECT COUNT(*) FROM vaccinations v 
     WHERE v.pet_id = p.id AND v.next_due_date < CURRENT_DATE) as overdue_vaccinations,
     
    (SELECT COUNT(*) FROM medications m 
     WHERE m.pet_id = p.id AND m.active = true) as active_medications,
    
    -- Care tasks
    (SELECT COUNT(*) FROM care_tasks ct 
     WHERE ct.pet_id = p.id AND ct.status IN ('pending', 'in_progress')) as pending_tasks,
     
    -- Generate wellness score
    generate_pet_wellness_score(p.id) as wellness_score,
    
    NOW() as last_updated
FROM pets p
WHERE p.deleted_at IS NULL;

-- Create index on materialized view
CREATE INDEX idx_pet_health_summary_family ON pet_health_summary(family_id);
CREATE INDEX idx_pet_health_summary_wellness_score ON pet_health_summary(wellness_score DESC);

-- Function to refresh pet health summary
CREATE OR REPLACE FUNCTION refresh_pet_health_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY pet_health_summary;
END;
$$ LANGUAGE plpgsql;

-- Comments for implementation guidance
/*
  WELLNESS PLATFORM IMPLEMENTATION NOTES:
  
  1. GPS Infrastructure Removal:
     - NO PostGIS extension
     - NO location-based tables or columns
     - NO geofencing or tracking features
     - Focus entirely on health and care management
  
  2. Health Data Security:
     - All health metrics are encrypted at rest
     - RLS policies ensure family-based access only
     - Audit logs track all health data changes
     - GDPR compliance with data export/deletion
  
  3. Family Coordination:
     - Role-based permissions for care management
     - Real-time notifications for care tasks
     - Shared family calendar and updates
     - Photo and document sharing within family
  
  4. Wellness Analytics:
     - AI-powered health insights and recommendations
     - Trend analysis for weight, activity, behavior
     - Preventive care reminders and scheduling
     - Veterinary integration for seamless care
  
  5. Emergency Protocols:
     - Pet-specific emergency response plans
     - Quick access to medical history in emergencies
     - Emergency contact management
     - Critical health alert notifications
  
  6. Performance Optimization:
     - Comprehensive indexing strategy for health queries
     - Materialized views for dashboard performance
     - Partitioning for health metrics time-series data
     - Efficient full-text search for medical records
*/