-- Migration 004: Security, RLS Policies, and HIPAA Compliance
-- Comprehensive security framework for sensitive pet health data
-- Version: 2.0.0-wellness
-- Date: 2025-01-01

BEGIN;

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
ALTER TABLE emergency_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_recommendations ENABLE ROW LEVEL SECURITY;

-- ================================================================================================
-- CORE USER AND FAMILY ACCESS POLICIES
-- ================================================================================================

-- Core user policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Service role can manage users" ON users
  FOR ALL TO service_role USING (true);

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

CREATE POLICY "Service role can manage families" ON families
  FOR ALL TO service_role USING (true);

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

CREATE POLICY "Family owners can manage family members" ON family_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families f
      JOIN users u ON f.owner_id = u.id
      WHERE f.id = family_members.family_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage family members" ON family_members
  FOR ALL TO service_role USING (true);

-- ================================================================================================
-- PET ACCESS POLICIES - COMPREHENSIVE FAMILY-BASED ACCESS
-- ================================================================================================

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

CREATE POLICY "Service role can manage pets" ON pets
  FOR ALL TO service_role USING (true);

-- ================================================================================================
-- HEALTH DATA POLICIES - HIGHLY SENSITIVE INFORMATION
-- ================================================================================================

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

CREATE POLICY "Service role can manage health metrics" ON health_metrics
  FOR ALL TO service_role USING (true);

-- Behavioral observations policies
CREATE POLICY "Family members can view behavioral observations" ON behavioral_observations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = behavioral_observations.pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can manage behavioral observations" ON behavioral_observations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = behavioral_observations.pet_id
      AND u.auth_user_id = auth.uid()
      AND fm.role IN ('owner', 'caregiver', 'veterinarian')
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

CREATE POLICY "Service role can manage medical records" ON medical_records
  FOR ALL TO service_role USING (true);

-- Vaccination policies
CREATE POLICY "Family members can view vaccinations" ON vaccinations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = vaccinations.pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can manage vaccinations" ON vaccinations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = vaccinations.pet_id
      AND u.auth_user_id = auth.uid()
      AND (fm.role IN ('owner', 'caregiver', 'veterinarian') OR fm.can_manage_health_records = true)
    )
  );

-- Medication policies
CREATE POLICY "Family members can view medications" ON medications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = medications.pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can manage medications" ON medications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = medications.pet_id
      AND u.auth_user_id = auth.uid()
      AND (fm.role IN ('owner', 'caregiver', 'veterinarian') OR fm.can_manage_health_records = true)
    )
  );

-- Medication administration policies
CREATE POLICY "Family members can view medication administrations" ON medication_administrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM medications m
      JOIN pets p ON m.pet_id = p.id
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE m.id = medication_administrations.medication_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can record medication administrations" ON medication_administrations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications m
      JOIN pets p ON m.pet_id = p.id
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE m.id = medication_administrations.medication_id
      AND u.auth_user_id = auth.uid()
      AND fm.role IN ('owner', 'caregiver')
    )
  );

-- ================================================================================================
-- CARE COORDINATION POLICIES
-- ================================================================================================

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

CREATE POLICY "Family members can create care tasks" ON care_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = care_tasks.family_id 
      AND u.auth_user_id = auth.uid()
      AND fm.role IN ('owner', 'caregiver')
    )
  );

CREATE POLICY "Assigned users and task creators can update care tasks" ON care_tasks
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

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = notifications.user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage notifications" ON notifications
  FOR ALL TO service_role USING (true);

-- Family updates policies
CREATE POLICY "Family members can view family updates" ON family_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = family_updates.family_id 
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create family updates" ON family_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = family_updates.family_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Files policies
CREATE POLICY "Family members can view family files" ON files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = files.family_id 
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can upload files" ON files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = files.family_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Emergency protocols policies
CREATE POLICY "Family members can view emergency protocols" ON emergency_protocols
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = emergency_protocols.pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Family caregivers can manage emergency protocols" ON emergency_protocols
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = emergency_protocols.pet_id
      AND u.auth_user_id = auth.uid()
      AND (fm.role IN ('owner', 'caregiver') OR fm.can_manage_health_records = true)
    )
  );

-- Emergency incidents policies
CREATE POLICY "Family members can view emergency incidents" ON emergency_incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = emergency_incidents.pet_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can report emergency incidents" ON emergency_incidents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets p
      JOIN family_members fm ON p.family_id = fm.family_id
      JOIN users u ON fm.user_id = u.id
      WHERE p.id = emergency_incidents.pet_id
      AND u.auth_user_id = auth.uid()
      AND fm.role IN ('owner', 'caregiver')
    )
  );

-- ================================================================================================
-- SERVICE ROLE POLICIES FOR SYSTEM OPERATIONS
-- ================================================================================================

-- Allow service role to manage all wellness-related data
CREATE POLICY "Service role can manage wellness insights" ON wellness_insights
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage care schedules" ON care_schedules
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage care recommendations" ON care_recommendations
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage calendar events" ON family_calendar_events
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage task completions" ON care_task_completions
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage notification preferences" ON notification_preferences
  FOR ALL TO service_role USING (true);

-- ================================================================================================
-- SECURITY FUNCTIONS AND TRIGGERS
-- ================================================================================================

-- Function to validate family member access
CREATE OR REPLACE FUNCTION validate_family_member_access(
    p_user_auth_id UUID,
    p_family_id UUID,
    required_permissions TEXT[] DEFAULT '{}',
    required_roles TEXT[] DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    member_record RECORD;
BEGIN
    -- Get family member record
    SELECT fm.*, u.auth_user_id
    INTO member_record
    FROM family_members fm
    JOIN users u ON fm.user_id = u.id
    WHERE fm.family_id = p_family_id
    AND u.auth_user_id = p_user_auth_id;
    
    -- Check if user is a member of the family
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check role requirements
    IF array_length(required_roles, 1) > 0 THEN
        IF NOT (member_record.role = ANY(required_roles::user_role[])) THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Check specific permissions
    IF 'can_manage_pets' = ANY(required_permissions) AND NOT member_record.can_manage_pets THEN
        RETURN FALSE;
    END IF;
    
    IF 'can_manage_health_records' = ANY(required_permissions) AND NOT member_record.can_manage_health_records THEN
        RETURN FALSE;
    END IF;
    
    IF 'can_assign_tasks' = ANY(required_permissions) AND NOT member_record.can_assign_tasks THEN
        RETURN FALSE;
    END IF;
    
    IF 'can_manage_family' = ANY(required_permissions) AND NOT member_record.can_manage_family THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to log sensitive data access (HIPAA compliance)
CREATE OR REPLACE FUNCTION log_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log access to sensitive health data
    IF TG_TABLE_NAME IN ('medical_records', 'health_metrics', 'medications', 'vaccination', 'emergency_incidents') THEN
        INSERT INTO audit_logs (
            user_id,
            table_name,
            record_id,
            action,
            old_values,
            new_values,
            ip_address,
            user_agent
        ) VALUES (
            (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1),
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            TG_OP,
            CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
            inet_client_addr(),
            current_setting('request.headers', true)::jsonb->>'user-agent'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_medical_records_access
    AFTER INSERT OR UPDATE OR DELETE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_access();

CREATE TRIGGER audit_health_metrics_access
    AFTER INSERT OR UPDATE OR DELETE ON health_metrics
    FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_access();

CREATE TRIGGER audit_medications_access
    AFTER INSERT OR UPDATE OR DELETE ON medications
    FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_access();

CREATE TRIGGER audit_vaccinations_access
    AFTER INSERT OR UPDATE OR DELETE ON vaccinations
    FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_access();

CREATE TRIGGER audit_emergency_incidents_access
    AFTER INSERT OR UPDATE OR DELETE ON emergency_incidents
    FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_access();

COMMIT;