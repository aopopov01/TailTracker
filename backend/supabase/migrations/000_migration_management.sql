-- TailTracker Migration Management System
-- Timestamp: 2025-01-01T00:00:00Z
-- Description: Database migration tracking and version control

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS migration_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_by VARCHAR(100),
    checksum VARCHAR(64),
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    rollback_sql TEXT
);

-- Create migration metadata table
CREATE TABLE IF NOT EXISTS migration_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_version VARCHAR(50),
    last_migration_date TIMESTAMP WITH TIME ZONE,
    environment VARCHAR(20) DEFAULT 'development',
    database_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to record migration execution
CREATE OR REPLACE FUNCTION record_migration(
    p_version VARCHAR(50),
    p_name VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_applied_by VARCHAR(100) DEFAULT NULL,
    p_checksum VARCHAR(64) DEFAULT NULL,
    p_execution_time_ms INTEGER DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_rollback_sql TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    migration_id UUID;
BEGIN
    INSERT INTO migration_history (
        version, name, description, applied_by, checksum, 
        execution_time_ms, success, error_message, rollback_sql
    ) VALUES (
        p_version, p_name, p_description, p_applied_by, p_checksum,
        p_execution_time_ms, p_success, p_error_message, p_rollback_sql
    ) RETURNING id INTO migration_id;
    
    -- Update current version if successful
    IF p_success THEN
        INSERT INTO migration_metadata (current_version, last_migration_date, environment)
        VALUES (p_version, NOW(), COALESCE(current_setting('app.environment', true), 'development'))
        ON CONFLICT (environment) DO UPDATE SET
            current_version = p_version,
            last_migration_date = NOW(),
            updated_at = NOW();
    END IF;
    
    RETURN migration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get current migration version
CREATE OR REPLACE FUNCTION get_current_migration_version()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_ver VARCHAR(50);
BEGIN
    SELECT current_version INTO current_ver
    FROM migration_metadata
    WHERE environment = COALESCE(current_setting('app.environment', true), 'development')
    ORDER BY updated_at DESC
    LIMIT 1;
    
    RETURN COALESCE(current_ver, '000');
END;
$$ LANGUAGE plpgsql;

-- Function to check if migration exists
CREATE OR REPLACE FUNCTION migration_exists(p_version VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM migration_history 
        WHERE version = p_version AND success = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to rollback migration
CREATE OR REPLACE FUNCTION rollback_migration(p_version VARCHAR(50))
RETURNS BOOLEAN AS $$
DECLARE
    rollback_script TEXT;
    prev_version VARCHAR(50);
BEGIN
    -- Get rollback script for the migration
    SELECT rollback_sql INTO rollback_script
    FROM migration_history
    WHERE version = p_version AND success = TRUE;
    
    IF rollback_script IS NULL THEN
        RAISE EXCEPTION 'No rollback script found for migration %', p_version;
    END IF;
    
    -- Execute rollback script
    EXECUTE rollback_script;
    
    -- Mark migration as rolled back
    UPDATE migration_history
    SET success = FALSE,
        error_message = 'Rolled back manually',
        applied_at = NOW()
    WHERE version = p_version;
    
    -- Get previous version
    SELECT version INTO prev_version
    FROM migration_history
    WHERE version < p_version AND success = TRUE
    ORDER BY version DESC
    LIMIT 1;
    
    -- Update current version
    UPDATE migration_metadata
    SET current_version = COALESCE(prev_version, '000'),
        last_migration_date = NOW(),
        updated_at = NOW()
    WHERE environment = COALESCE(current_setting('app.environment', true), 'development');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate database schema
CREATE OR REPLACE FUNCTION validate_schema()
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    table_count INTEGER;
    function_count INTEGER;
    index_count INTEGER;
    constraint_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public';
    
    -- Count constraints
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public';
    
    result := jsonb_build_object(
        'tables', table_count,
        'functions', function_count,
        'indexes', index_count,
        'constraints', constraint_count,
        'validated_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for migration tables
CREATE INDEX IF NOT EXISTS idx_migration_history_version ON migration_history(version);
CREATE INDEX IF NOT EXISTS idx_migration_history_applied_at ON migration_history(applied_at);
CREATE INDEX IF NOT EXISTS idx_migration_history_success ON migration_history(success);
CREATE INDEX IF NOT EXISTS idx_migration_metadata_environment ON migration_metadata(environment);

-- Insert initial migration record
INSERT INTO migration_history (
    version, 
    name, 
    description, 
    applied_by, 
    success
) VALUES (
    '000', 
    'migration_management', 
    'Initialize migration tracking system', 
    'system',
    TRUE
) ON CONFLICT (version) DO NOTHING;

-- Initialize metadata
INSERT INTO migration_metadata (
    current_version,
    environment,
    database_version
) VALUES (
    '000',
    COALESCE(current_setting('app.environment', true), 'development'),
    current_setting('server_version')
) ON CONFLICT (environment) DO NOTHING;

-- Grant permissions
GRANT SELECT ON migration_history TO authenticated;
GRANT SELECT ON migration_metadata TO authenticated;
GRANT ALL ON migration_history TO service_role;
GRANT ALL ON migration_metadata TO service_role;
GRANT EXECUTE ON FUNCTION record_migration TO service_role;
GRANT EXECUTE ON FUNCTION get_current_migration_version TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION migration_exists TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rollback_migration TO service_role;
GRANT EXECUTE ON FUNCTION validate_schema TO authenticated, service_role;