-- =====================================================
-- TailTracker Unified Data Sync System
-- =====================================================
-- This migration creates a comprehensive system to sync common fields 
-- across all tables so users never have to enter the same data twice.
--
-- Key Features:
-- 1. Automatic user profile sync across all tables
-- 2. Pet information consistency across health records
-- 3. Veterinarian contact sync across all references
-- 4. Contact information consistency
-- 5. Real-time sync triggers and functions
-- =====================================================

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER PROFILE SYNC SYSTEM
-- =====================================================

-- Function to sync user profile data across all related tables
CREATE OR REPLACE FUNCTION sync_user_profile_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Update related tables when user profile changes
    IF TG_OP = 'UPDATE' AND (
        OLD.email != NEW.email OR 
        OLD.full_name != NEW.full_name OR 
        OLD.phone != NEW.phone OR
        OLD.avatar_url != NEW.avatar_url
    ) THEN
        
        -- Update lost pets contact information
        UPDATE lost_pets 
        SET 
            contact_phone = NEW.phone,
            contact_email = NEW.email,
            updated_at = NOW()
        WHERE reported_by = NEW.id;
        
        -- Update emergency contacts in pets table where user is emergency contact
        UPDATE pets 
        SET 
            emergency_contact_name = NEW.full_name,
            emergency_contact_phone = NEW.phone,
            emergency_contact_email = NEW.email,
            updated_at = NOW()
        WHERE emergency_contact_email = OLD.email;
        
        -- Update secondary emergency contacts
        UPDATE pets 
        SET 
            emergency_contact_2_name = NEW.full_name,
            emergency_contact_2_phone = NEW.phone,
            emergency_contact_2_email = NEW.email,
            updated_at = NOW()
        WHERE emergency_contact_2_email = OLD.email;
        
        -- Update veterinarian information if user is a vet
        UPDATE veterinarians 
        SET 
            name = NEW.full_name,
            phone = NEW.phone,
            email = NEW.email,
            updated_at = NOW()
        WHERE email = OLD.email;
        
        -- Log sync action
        INSERT INTO audit_logs (
            user_id, table_name, record_id, action, 
            old_values, new_values, created_at
        ) VALUES (
            NEW.id, 'users', NEW.id, 'update',
            jsonb_build_object(
                'email', OLD.email, 
                'full_name', OLD.full_name, 
                'phone', OLD.phone
            ),
            jsonb_build_object(
                'email', NEW.email, 
                'full_name', NEW.full_name, 
                'phone', NEW.phone
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user profile sync
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON users;
CREATE TRIGGER sync_user_profile_trigger
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_profile_data();

-- =====================================================
-- 2. PET INFORMATION SYNC SYSTEM
-- =====================================================

-- Function to sync pet basic information across all related tables
CREATE OR REPLACE FUNCTION sync_pet_basic_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Update related tables when pet basic info changes
    IF TG_OP = 'UPDATE' AND (
        OLD.name != NEW.name OR 
        OLD.weight_kg != NEW.weight_kg OR 
        OLD.microchip_number != NEW.microchip_number OR
        OLD.breed != NEW.breed OR
        OLD.color != NEW.color OR
        OLD.gender != NEW.gender OR
        OLD.date_of_birth != NEW.date_of_birth
    ) THEN
        
        -- Update lost pets information
        UPDATE lost_pets 
        SET updated_at = NOW()
        WHERE pet_id = NEW.id;
        
        -- Update latest health records with new weight if changed
        IF OLD.weight_kg != NEW.weight_kg AND NEW.weight_kg IS NOT NULL THEN
            UPDATE health_records 
            SET 
                weight = NEW.weight_kg,
                updated_at = NOW()
            WHERE pet_id = NEW.id 
            AND record_date = CURRENT_DATE;
            
            -- Create a new measurement record for weight change
            INSERT INTO pet_measurements (
                pet_id, measurement_type, value, unit, 
                notes, recorded_by, created_at
            ) VALUES (
                NEW.id, 'weight', NEW.weight_kg, 'kg',
                'Auto-synced from pet profile update',
                NEW.created_by, NOW()
            ) ON CONFLICT DO NOTHING;
        END IF;
        
        -- Log sync action
        INSERT INTO audit_logs (
            user_id, table_name, record_id, action, 
            old_values, new_values, created_at
        ) VALUES (
            NEW.created_by, 'pets', NEW.id, 'update',
            jsonb_build_object(
                'name', OLD.name, 
                'weight_kg', OLD.weight_kg, 
                'microchip_number', OLD.microchip_number
            ),
            jsonb_build_object(
                'name', NEW.name, 
                'weight_kg', NEW.weight_kg, 
                'microchip_number', NEW.microchip_number
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for pet basic info sync
DROP TRIGGER IF EXISTS sync_pet_basic_info_trigger ON pets;
CREATE TRIGGER sync_pet_basic_info_trigger
    AFTER UPDATE ON pets
    FOR EACH ROW
    EXECUTE FUNCTION sync_pet_basic_info();

-- =====================================================
-- 3. VETERINARIAN INFORMATION SYNC SYSTEM
-- =====================================================

-- Function to sync veterinarian information across all references
CREATE OR REPLACE FUNCTION sync_veterinarian_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Update related tables when veterinarian info changes
    IF TG_OP = 'UPDATE' AND (
        OLD.name != NEW.name OR 
        OLD.clinic_name != NEW.clinic_name OR 
        OLD.phone != NEW.phone OR 
        OLD.email != NEW.email OR
        OLD.address != NEW.address
    ) THEN
        
        -- Update health records that reference this veterinarian
        UPDATE health_records 
        SET 
            veterinarian_name = NEW.name,
            clinic_name = NEW.clinic_name,
            updated_at = NOW()
        WHERE veterinarian_id = NEW.id;
        
        -- Update user events that reference this veterinarian
        UPDATE user_events 
        SET 
            veterinarian_name = NEW.name,
            updated_at = NOW()
        WHERE veterinarian_name = OLD.name;
        
        -- Log sync action
        INSERT INTO audit_logs (
            user_id, table_name, record_id, action, 
            old_values, new_values, created_at
        ) VALUES (
            NEW.user_id, 'veterinarians', NEW.id, 'update',
            jsonb_build_object(
                'name', OLD.name, 
                'clinic_name', OLD.clinic_name, 
                'phone', OLD.phone,
                'email', OLD.email
            ),
            jsonb_build_object(
                'name', NEW.name, 
                'clinic_name', NEW.clinic_name, 
                'phone', NEW.phone,
                'email', NEW.email
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for veterinarian info sync
DROP TRIGGER IF EXISTS sync_veterinarian_info_trigger ON veterinarians;
CREATE TRIGGER sync_veterinarian_info_trigger
    AFTER UPDATE ON veterinarians
    FOR EACH ROW
    EXECUTE FUNCTION sync_veterinarian_info();

-- =====================================================
-- 4. HEALTH RECORD WEIGHT SYNC SYSTEM
-- =====================================================

-- Function to sync weight from health records back to pet profile
CREATE OR REPLACE FUNCTION sync_weight_to_pet_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Update pet weight when health record contains weight measurement
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.weight IS NOT NULL THEN
            UPDATE pets 
            SET 
                weight_kg = NEW.weight,
                updated_at = NOW()
            WHERE id = NEW.pet_id
            AND (weight_kg IS NULL OR weight_kg != NEW.weight);
            
            -- Also create a measurement record
            INSERT INTO pet_measurements (
                pet_id, measurement_type, value, unit, 
                notes, recorded_by, created_at
            ) VALUES (
                NEW.pet_id, 'weight', NEW.weight, 'kg',
                'Synced from health record: ' || NEW.title,
                (SELECT created_by FROM pets WHERE id = NEW.pet_id),
                NOW()
            ) ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for health record weight sync
DROP TRIGGER IF EXISTS sync_weight_to_pet_trigger ON health_records;
CREATE TRIGGER sync_weight_to_pet_trigger
    AFTER INSERT OR UPDATE ON health_records
    FOR EACH ROW
    EXECUTE FUNCTION sync_weight_to_pet_profile();

-- =====================================================
-- 5. CONTACT INFORMATION SYNC SYSTEM
-- =====================================================

-- Function to sync contact information across all tables
CREATE OR REPLACE FUNCTION sync_contact_information()
RETURNS TRIGGER AS $$
DECLARE
    updated_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- This function handles contact info changes from any table
    -- and propagates them to related tables
    
    IF TG_TABLE_NAME = 'users' THEN
        -- Already handled in sync_user_profile_data function
        NULL;
        
    ELSIF TG_TABLE_NAME = 'veterinarians' THEN
        -- Already handled in sync_veterinarian_info function
        NULL;
        
    ELSIF TG_TABLE_NAME = 'lost_pets' THEN
        -- Sync contact info back to user profile if it's the owner
        IF TG_OP = 'UPDATE' AND (OLD.contact_phone != NEW.contact_phone OR OLD.contact_email != NEW.contact_email) THEN
            UPDATE users 
            SET 
                phone = COALESCE(NEW.contact_phone, phone),
                email = COALESCE(NEW.contact_email, email),
                updated_at = NOW()
            WHERE id = NEW.reported_by;
            updated_tables := array_append(updated_tables, 'users');
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. UNIFIED SYNC FUNCTIONS FOR APPLICATION USE
-- =====================================================

-- Function to manually sync all data for a user
CREATE OR REPLACE FUNCTION sync_all_user_data(user_auth_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    sync_results JSONB := '{}';
    updated_count INTEGER;
BEGIN
    -- Get user record
    SELECT * INTO user_record FROM users WHERE auth_user_id = user_auth_id;
    
    IF user_record IS NULL THEN
        RETURN jsonb_build_object('error', 'User not found');
    END IF;
    
    -- Sync user profile data across all tables
    -- Update lost pets
    UPDATE lost_pets 
    SET 
        contact_phone = user_record.phone,
        contact_email = user_record.email,
        updated_at = NOW()
    WHERE reported_by = user_record.id;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    sync_results := jsonb_set(sync_results, '{lost_pets}', updated_count::text::jsonb);
    
    -- Update emergency contacts in pets
    UPDATE pets 
    SET 
        emergency_contact_name = user_record.full_name,
        emergency_contact_phone = user_record.phone,
        emergency_contact_email = user_record.email,
        updated_at = NOW()
    WHERE emergency_contact_email = user_record.email;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    sync_results := jsonb_set(sync_results, '{pets_emergency_contact}', updated_count::text::jsonb);
    
    -- Update veterinarian records if user is a vet
    UPDATE veterinarians 
    SET 
        name = user_record.full_name,
        phone = user_record.phone,
        email = user_record.email,
        updated_at = NOW()
    WHERE email = user_record.email AND user_id = user_record.id;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    sync_results := jsonb_set(sync_results, '{veterinarians}', updated_count::text::jsonb);
    
    sync_results := jsonb_set(sync_results, '{status}', '"success"');
    sync_results := jsonb_set(sync_results, '{synced_at}', to_jsonb(NOW()));
    
    RETURN sync_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync pet data across all related tables
CREATE OR REPLACE FUNCTION sync_all_pet_data(pet_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    pet_record RECORD;
    sync_results JSONB := '{}';
    updated_count INTEGER;
BEGIN
    -- Get pet record
    SELECT * INTO pet_record FROM pets WHERE id = pet_uuid;
    
    IF pet_record IS NULL THEN
        RETURN jsonb_build_object('error', 'Pet not found');
    END IF;
    
    -- Sync weight to latest health records
    UPDATE health_records 
    SET 
        weight = pet_record.weight_kg,
        updated_at = NOW()
    WHERE pet_id = pet_record.id 
    AND record_date >= CURRENT_DATE - INTERVAL '7 days'
    AND (weight IS NULL OR weight != pet_record.weight_kg);
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    sync_results := jsonb_set(sync_results, '{health_records}', updated_count::text::jsonb);
    
    -- Create measurement record for current weight if not exists
    INSERT INTO pet_measurements (
        pet_id, measurement_type, value, unit, 
        notes, recorded_by, created_at
    ) 
    SELECT 
        pet_record.id, 'weight', pet_record.weight_kg, 'kg',
        'Auto-synced from pet profile',
        pet_record.created_by, NOW()
    WHERE pet_record.weight_kg IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM pet_measurements 
        WHERE pet_id = pet_record.id 
        AND measurement_type = 'weight' 
        AND value = pet_record.weight_kg 
        AND created_at::date = CURRENT_DATE
    );
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    sync_results := jsonb_set(sync_results, '{measurements}', updated_count::text::jsonb);
    
    sync_results := jsonb_set(sync_results, '{status}', '"success"');
    sync_results := jsonb_set(sync_results, '{synced_at}', to_jsonb(NOW()));
    
    RETURN sync_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync veterinarian data across all references
CREATE OR REPLACE FUNCTION sync_all_veterinarian_data(vet_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    vet_record RECORD;
    sync_results JSONB := '{}';
    updated_count INTEGER;
BEGIN
    -- Get veterinarian record
    SELECT * INTO vet_record FROM veterinarians WHERE id = vet_uuid;
    
    IF vet_record IS NULL THEN
        RETURN jsonb_build_object('error', 'Veterinarian not found');
    END IF;
    
    -- Update health records
    UPDATE health_records 
    SET 
        veterinarian_name = vet_record.name,
        clinic_name = vet_record.clinic_name,
        updated_at = NOW()
    WHERE veterinarian_id = vet_record.id;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    sync_results := jsonb_set(sync_results, '{health_records}', updated_count::text::jsonb);
    
    -- Update user events
    UPDATE user_events 
    SET 
        veterinarian_name = vet_record.name,
        updated_at = NOW()
    WHERE veterinarian_name = vet_record.name;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    sync_results := jsonb_set(sync_results, '{user_events}', updated_count::text::jsonb);
    
    sync_results := jsonb_set(sync_results, '{status}', '"success"');
    sync_results := jsonb_set(sync_results, '{synced_at}', to_jsonb(NOW()));
    
    RETURN sync_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. SYNC STATUS TRACKING TABLE
-- =====================================================

-- Table to track sync operations and their status
CREATE TABLE IF NOT EXISTS data_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'user_profile', 'pet_data', 'veterinarian', 'full_sync'
    target_table VARCHAR(100) NOT NULL,
    target_id UUID,
    sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
    sync_details JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for sync log
ALTER TABLE data_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS policy for sync log
CREATE POLICY "Users can view own sync logs" ON data_sync_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = user_id
            AND u.auth_user_id = auth.uid()
        )
    );

-- Function to log sync operations
CREATE OR REPLACE FUNCTION log_sync_operation(
    user_uuid UUID,
    sync_type_param VARCHAR(50),
    target_table_param VARCHAR(100),
    target_id_param UUID,
    sync_details_param JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO data_sync_log (
        user_id, sync_type, target_table, target_id, sync_details, created_at
    ) VALUES (
        user_uuid, sync_type_param, target_table_param, target_id_param, sync_details_param, NOW()
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete sync operation
CREATE OR REPLACE FUNCTION complete_sync_operation(
    log_uuid UUID,
    success BOOLEAN,
    details JSONB DEFAULT NULL,
    error_msg TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE data_sync_log 
    SET 
        sync_status = CASE WHEN success THEN 'success' ELSE 'failed' END,
        sync_details = COALESCE(details, sync_details),
        error_message = error_msg,
        completed_at = NOW()
    WHERE id = log_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. COMPREHENSIVE SYNC FUNCTION
-- =====================================================

-- Main function to sync all data for a user
CREATE OR REPLACE FUNCTION sync_all_user_data_comprehensive(user_auth_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    sync_log_id UUID;
    final_results JSONB := '{}';
    user_sync_result JSONB;
    pet_record RECORD;
    pet_sync_result JSONB;
    vet_record RECORD;
    vet_sync_result JSONB;
BEGIN
    -- Get user record
    SELECT * INTO user_record FROM users WHERE auth_user_id = user_auth_id;
    
    IF user_record IS NULL THEN
        RETURN jsonb_build_object('error', 'User not found');
    END IF;
    
    -- Log the comprehensive sync operation
    sync_log_id := log_sync_operation(
        user_record.id, 'full_sync', 'all_tables', user_record.id,
        jsonb_build_object('started_at', NOW())
    );
    
    BEGIN
        -- 1. Sync user profile data
        user_sync_result := sync_all_user_data(user_auth_id);
        final_results := jsonb_set(final_results, '{user_profile}', user_sync_result);
        
        -- 2. Sync all pet data for this user's pets
        FOR pet_record IN 
            SELECT p.* FROM pets p 
            JOIN families f ON p.family_id = f.id 
            WHERE f.owner_id = user_record.id
        LOOP
            pet_sync_result := sync_all_pet_data(pet_record.id);
            final_results := jsonb_set(
                final_results, 
                ARRAY['pets', pet_record.id::text], 
                pet_sync_result
            );
        END LOOP;
        
        -- 3. Sync all veterinarian data for this user
        FOR vet_record IN 
            SELECT * FROM veterinarians WHERE user_id = user_record.id
        LOOP
            vet_sync_result := sync_all_veterinarian_data(vet_record.id);
            final_results := jsonb_set(
                final_results, 
                ARRAY['veterinarians', vet_record.id::text], 
                vet_sync_result
            );
        END LOOP;
        
        -- Complete sync log as success
        PERFORM complete_sync_operation(
            sync_log_id, true, 
            jsonb_build_object(
                'total_synced_tables', jsonb_object_keys(final_results),
                'completed_at', NOW()
            )
        );
        
        final_results := jsonb_set(final_results, '{status}', '"success"');
        final_results := jsonb_set(final_results, '{sync_log_id}', to_jsonb(sync_log_id));
        
    EXCEPTION WHEN others THEN
        -- Complete sync log as failed
        PERFORM complete_sync_operation(
            sync_log_id, false, NULL, SQLERRM
        );
        
        final_results := jsonb_build_object(
            'status', 'error',
            'error', SQLERRM,
            'sync_log_id', sync_log_id
        );
    END;
    
    RETURN final_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. INDEXES FOR SYNC PERFORMANCE
-- =====================================================

-- Indexes to improve sync performance
CREATE INDEX IF NOT EXISTS idx_data_sync_log_user_id ON data_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_sync_type ON data_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_sync_status ON data_sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_created_at ON data_sync_log(created_at);

-- Composite indexes for common sync queries
CREATE INDEX IF NOT EXISTS idx_health_records_pet_vet ON health_records(pet_id, veterinarian_id);
CREATE INDEX IF NOT EXISTS idx_user_events_pet_date ON user_events(pet_id, event_date);
CREATE INDEX IF NOT EXISTS idx_pet_measurements_pet_type_date ON pet_measurements(pet_id, measurement_type, created_at);

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions for sync functions
GRANT EXECUTE ON FUNCTION sync_all_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_pet_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_veterinarian_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_user_data_comprehensive(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_sync_operation(UUID, VARCHAR, VARCHAR, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_sync_operation(UUID, BOOLEAN, JSONB, TEXT) TO authenticated;

-- =====================================================
-- SYNC SYSTEM COMPLETE
-- =====================================================

-- Comments explaining the sync system
/*
  UNIFIED DATA SYNC SYSTEM OVERVIEW:
  
  This system ensures that when a user enters data once, it automatically
  syncs across all relevant tables in the database. Key features:
  
  1. AUTOMATIC TRIGGERS:
     - User profile changes sync to all related tables
     - Pet information syncs to health records and measurements
     - Veterinarian info syncs across all references
     - Weight updates sync bidirectionally between pets and health records
  
  2. MANUAL SYNC FUNCTIONS:
     - sync_all_user_data(user_auth_id) - Sync user profile data
     - sync_all_pet_data(pet_uuid) - Sync specific pet data
     - sync_all_veterinarian_data(vet_uuid) - Sync vet information
     - sync_all_user_data_comprehensive(user_auth_id) - Full sync
  
  3. SYNC LOGGING:
     - All sync operations are logged in data_sync_log table
     - Success/failure tracking for debugging
     - Performance monitoring capabilities
  
  4. REAL-TIME UPDATES:
     - Triggers fire automatically on data changes
     - Immediate consistency across all tables
     - No user intervention required
  
  5. APPLICATION INTEGRATION:
     - Call sync functions from your app when needed
     - Use sync logs to show users sync status
     - Handle sync errors gracefully
     
  USAGE EXAMPLES:
  
  -- Sync all data for current user
  SELECT sync_all_user_data_comprehensive(auth.uid());
  
  -- Sync specific pet data
  SELECT sync_all_pet_data('pet-uuid-here');
  
  -- Check sync status
  SELECT * FROM data_sync_log WHERE user_id = current_user_id ORDER BY created_at DESC;
*/