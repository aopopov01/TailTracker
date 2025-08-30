-- Migration 003: Care Coordination and Family Communication System
-- Task management, schedules, notifications, and family collaboration
-- Version: 2.0.0-wellness
-- Date: 2025-01-01

BEGIN;

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
    recurrence_pattern VARCHAR(100),
    recurrence_interval INTEGER,
    recurrence_days INTEGER[],
    
    -- Status tracking
    status care_task_status DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id),
    
    -- Task-specific data
    task_data JSONB,
    
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
    
    is_system_template BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    schedule_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Timing
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Days and times
    days_of_week INTEGER[],
    times TIME[],
    
    -- Associated tasks
    associated_tasks UUID[],
    
    -- Notifications
    notification_enabled BOOLEAN DEFAULT true,
    notification_advance_minutes INTEGER DEFAULT 30,
    
    -- Responsibility
    default_assignee UUID REFERENCES users(id),
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Family Communication and Updates
CREATE TABLE family_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    posted_by UUID NOT NULL REFERENCES users(id),
    pet_id UUID REFERENCES pets(id),
    
    -- Update details
    update_type VARCHAR(50) NOT NULL,
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

-- Likes on family updates
CREATE TABLE family_update_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    update_id UUID NOT NULL REFERENCES family_updates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(update_id, user_id)
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
    file_category VARCHAR(50),
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

-- Shared calendars for family coordination
CREATE TABLE family_calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    pet_id UUID REFERENCES pets(id),
    
    -- Event details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- 'vet_appointment', 'grooming', 'medication', 'feeding', 'exercise', 'other'
    
    -- Timing
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE,
    all_day_event BOOLEAN DEFAULT false,
    timezone VARCHAR(50),
    
    -- Attendees and assignments
    assigned_to UUID REFERENCES users(id),
    attendees UUID[], -- Array of user IDs
    
    -- Reminders
    reminder_minutes_before INTEGER[],
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- iCal RRULE format
    
    -- Location and notes
    location_name VARCHAR(255),
    location_address TEXT,
    
    -- Related records
    related_task_id UUID REFERENCES care_tasks(id),
    related_appointment_id UUID,
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Care task completion tracking
CREATE TABLE care_task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES care_tasks(id) ON DELETE CASCADE,
    completed_by UUID NOT NULL REFERENCES users(id),
    pet_id UUID REFERENCES pets(id),
    
    -- Completion details
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    notes TEXT,
    
    -- Quality metrics
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    
    -- Media evidence
    completion_photos TEXT[],
    completion_videos TEXT[],
    
    -- Follow-up
    follow_up_needed BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification preferences per user
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    
    -- Channel preferences
    push_notifications_enabled BOOLEAN DEFAULT true,
    email_notifications_enabled BOOLEAN DEFAULT true,
    sms_notifications_enabled BOOLEAN DEFAULT false,
    
    -- Type preferences
    health_alerts BOOLEAN DEFAULT true,
    medication_reminders BOOLEAN DEFAULT true,
    feeding_reminders BOOLEAN DEFAULT true,
    exercise_reminders BOOLEAN DEFAULT true,
    vet_appointments BOOLEAN DEFAULT true,
    vaccination_due BOOLEAN DEFAULT true,
    weight_milestones BOOLEAN DEFAULT true,
    behavioral_notes BOOLEAN DEFAULT true,
    care_task_assignments BOOLEAN DEFAULT true,
    care_task_overdue BOOLEAN DEFAULT true,
    family_updates BOOLEAN DEFAULT true,
    wellness_insights BOOLEAN DEFAULT true,
    
    -- Timing preferences
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    preferred_reminder_advance_minutes INTEGER DEFAULT 30,
    
    -- Frequency limits
    max_daily_notifications INTEGER DEFAULT 20,
    batch_notifications BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, family_id)
);

-- System-generated care recommendations
CREATE TABLE care_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    generated_for_user UUID REFERENCES users(id),
    
    -- Recommendation details
    recommendation_type VARCHAR(100) NOT NULL, -- 'health_check', 'exercise_increase', 'diet_adjustment', 'behavioral_training'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reasoning TEXT,
    
    -- Priority and timing
    priority_score INTEGER DEFAULT 5 CHECK (priority_score BETWEEN 1 AND 10),
    urgency_level emergency_level DEFAULT 'low',
    recommended_completion_date DATE,
    
    -- Data sources
    based_on_data_sources TEXT[],
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    
    -- User interaction
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed', 'completed'
    user_response TEXT,
    actioned_at TIMESTAMP WITH TIME ZONE,
    
    -- Related actions
    created_task_id UUID REFERENCES care_tasks(id),
    created_calendar_event_id UUID REFERENCES family_calendar_events(id),
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Function to automatically update care task status based on due date
CREATE OR REPLACE FUNCTION update_overdue_care_tasks()
RETURNS void AS $$
BEGIN
    UPDATE care_tasks
    SET status = 'overdue'
    WHERE status IN ('pending', 'in_progress')
      AND due_date < CURRENT_DATE
      AND status != 'overdue';
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for overdue tasks
CREATE OR REPLACE FUNCTION notify_overdue_tasks()
RETURNS void AS $$
BEGIN
    INSERT INTO notifications (
        user_id,
        family_id,
        pet_id,
        type,
        title,
        message,
        priority,
        is_urgent,
        related_id,
        related_table
    )
    SELECT 
        ct.assigned_to,
        ct.family_id,
        ct.pet_id,
        'care_task_overdue'::notification_type,
        'Care Task Overdue: ' || ct.title,
        'The care task "' || ct.title || '" is overdue. Please complete it as soon as possible.',
        8,
        true,
        ct.id,
        'care_tasks'
    FROM care_tasks ct
    WHERE ct.status = 'overdue'
      AND ct.assigned_to IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.related_id = ct.id
            AND n.related_table = 'care_tasks'
            AND n.type = 'care_task_overdue'
            AND n.created_at > CURRENT_DATE
      );
END;
$$ LANGUAGE plpgsql;

COMMIT;