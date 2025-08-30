-- Migration 002: Pet Health and Medical System
-- Comprehensive health tracking, medical records, and wellness monitoring
-- Version: 2.0.0-wellness
-- Date: 2025-01-01

BEGIN;

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
    measurement_method VARCHAR(100),
    notes TEXT,
    is_estimated BOOLEAN DEFAULT false,
    
    -- Timing
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    specializations TEXT[],
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
    
    relationship_type VARCHAR(50) DEFAULT 'primary',
    is_active BOOLEAN DEFAULT true,
    
    -- Care history
    first_visit_date DATE,
    last_visit_date DATE,
    total_visits INTEGER DEFAULT 0,
    
    -- Communication preferences
    preferred_communication VARCHAR(20) DEFAULT 'email',
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
    record_type VARCHAR(100) NOT NULL,
    visit_type VARCHAR(50),
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
    vaccine_type VARCHAR(100),
    manufacturer VARCHAR(100),
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    
    -- Administration
    administered_date DATE NOT NULL,
    administered_by VARCHAR(255),
    administration_site VARCHAR(50),
    
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
    medication_type VARCHAR(100),
    form VARCHAR(50),
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
    method VARCHAR(50),
    
    -- Context and notes
    notes TEXT,
    missed_dose BOOLEAN DEFAULT false,
    late_dose BOOLEAN DEFAULT false,
    
    -- Reactions
    observed_effects TEXT,
    adverse_reactions TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness Analytics and Insights
CREATE TABLE wellness_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    generated_by_system BOOLEAN DEFAULT true,
    
    -- Insight details
    insight_type VARCHAR(100) NOT NULL,
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
    data_sources TEXT[],
    
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

-- Emergency incidents log
CREATE TABLE emergency_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES users(id),
    
    -- Incident details
    incident_type VARCHAR(100) NOT NULL,
    severity_level VARCHAR(20) NOT NULL,
    symptoms TEXT[],
    immediate_action_taken TEXT,
    incident_location VARCHAR(255),
    
    -- Response tracking
    emergency_protocol_used UUID REFERENCES emergency_protocols(id),
    veterinarian_contacted BOOLEAN DEFAULT false,
    family_notified BOOLEAN DEFAULT false,
    
    -- Outcome
    resolution TEXT,
    veterinary_treatment_required BOOLEAN,
    follow_up_required BOOLEAN,
    
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

COMMIT;