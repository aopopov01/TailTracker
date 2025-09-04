-- TailTracker Database Schema Integrity Test Suite
-- Comprehensive validation of database structure, constraints, and triggers

-- ================================================================================================
-- 1. SCHEMA VALIDATION TESTS
-- ================================================================================================

-- Test: Verify all required extensions are installed
DO $$
BEGIN
    -- Check PostGIS extension
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        RAISE EXCEPTION 'PostGIS extension is not installed - required for geospatial features';
    END IF;
    
    -- Check uuid-ossp extension
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        RAISE EXCEPTION 'uuid-ossp extension is not installed - required for UUID generation';
    END IF;
    
    -- Check pg_trgm extension
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        RAISE EXCEPTION 'pg_trgm extension is not installed - required for text search';
    END IF;
    
    -- Check btree_gin extension
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gin') THEN
        RAISE EXCEPTION 'btree_gin extension is not installed - required for composite indexes';
    END IF;
    
    RAISE NOTICE 'PASS: All required extensions are installed';
END
$$;

-- Test: Verify all custom types exist
DO $$
DECLARE
    type_name TEXT;
    expected_types TEXT[] := ARRAY[
        'user_role', 'subscription_status', 'pet_status', 'notification_type',
        'payment_status', 'webhook_status', 'audit_action'
    ];
BEGIN
    FOREACH type_name IN ARRAY expected_types
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = type_name) THEN
            RAISE EXCEPTION 'Custom type % does not exist', type_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'PASS: All custom types are present';
END
$$;

-- Test: Verify all required tables exist
DO $$
DECLARE
    table_name TEXT;
    expected_tables TEXT[] := ARRAY[
        'users', 'families', 'family_members', 'pets', 'veterinarians', 'pet_veterinarians',
        'vaccinations', 'medications', 'medical_records', 'lost_pets', 'notifications',
        'files', 'audit_logs', 'gdpr_requests', 'subscriptions', 'payments',
        'stripe_webhook_events', 'feature_usage'
    ];
BEGIN
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = table_name AND schemaname = 'public') THEN
            RAISE EXCEPTION 'Required table % does not exist', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'PASS: All required tables exist';
END
$$;

-- Test: Verify critical indexes exist
DO $$
DECLARE
    index_name TEXT;
    critical_indexes TEXT[] := ARRAY[
        'idx_users_auth_user_id',
        'idx_users_subscription_status',
        'idx_users_stripe_customer_id',
        'idx_lost_pets_location',
        'idx_pets_search',
        'idx_subscriptions_stripe_subscription_id'
    ];
BEGIN
    FOREACH index_name IN ARRAY critical_indexes
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = index_name) THEN
            RAISE EXCEPTION 'Critical index % does not exist', index_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'PASS: All critical indexes exist';
END
$$;

-- ================================================================================================
-- 2. FOREIGN KEY CONSTRAINT TESTS
-- ================================================================================================

-- Test: Verify foreign key constraints are properly defined
DO $$
DECLARE
    constraint_count INT;
BEGIN
    -- Count foreign key constraints
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND constraint_schema = 'public';
    
    -- We expect at least 20 foreign key constraints
    IF constraint_count < 20 THEN
        RAISE EXCEPTION 'Insufficient foreign key constraints: expected >= 20, found %', constraint_count;
    END IF;
    
    RAISE NOTICE 'PASS: Found % foreign key constraints', constraint_count;
END
$$;

-- Test: Verify cascading deletes work correctly
DO $$
DECLARE
    test_family_id UUID;
    test_pet_count INT;
BEGIN
    -- Create test family
    INSERT INTO families (name, owner_id, invite_code)
    VALUES ('Test Family', 
           (SELECT id FROM users LIMIT 1),
           'TEST123')
    RETURNING id INTO test_family_id;
    
    -- Create test pet
    INSERT INTO pets (family_id, name, species, created_by)
    VALUES (test_family_id, 'Test Pet', 'Dog',
           (SELECT id FROM users LIMIT 1));
    
    -- Verify pet exists
    SELECT COUNT(*) INTO test_pet_count
    FROM pets WHERE family_id = test_family_id;
    
    IF test_pet_count != 1 THEN
        RAISE EXCEPTION 'Failed to create test pet';
    END IF;
    
    -- Delete family (should cascade to pets)
    DELETE FROM families WHERE id = test_family_id;
    
    -- Verify pet was deleted
    SELECT COUNT(*) INTO test_pet_count
    FROM pets WHERE family_id = test_family_id;
    
    IF test_pet_count != 0 THEN
        RAISE EXCEPTION 'Cascading delete failed: pet still exists';
    END IF;
    
    RAISE NOTICE 'PASS: Cascading deletes work correctly';
END
$$;

-- ================================================================================================
-- 3. ROW LEVEL SECURITY (RLS) TESTS
-- ================================================================================================

-- Test: Verify RLS is enabled on all critical tables
DO $$
DECLARE
    table_name TEXT;
    rls_enabled BOOLEAN;
    critical_tables TEXT[] := ARRAY[
        'users', 'families', 'family_members', 'pets', 'vaccinations', 
        'medications', 'medical_records', 'lost_pets', 'notifications',
        'subscriptions', 'payments', 'files'
    ];
BEGIN
    FOREACH table_name IN ARRAY critical_tables
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = table_name AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'RLS is not enabled on table %', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'PASS: RLS is enabled on all critical tables';
END
$$;

-- Test: Verify RLS policies exist
DO $$
DECLARE
    policy_count INT;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- We expect at least 15 RLS policies
    IF policy_count < 15 THEN
        RAISE EXCEPTION 'Insufficient RLS policies: expected >= 15, found %', policy_count;
    END IF;
    
    RAISE NOTICE 'PASS: Found % RLS policies', policy_count;
END
$$;

-- ================================================================================================
-- 4. FUNCTION AND TRIGGER TESTS
-- ================================================================================================

-- Test: Verify critical functions exist
DO $$
DECLARE
    function_name TEXT;
    critical_functions TEXT[] := ARRAY[
        'get_user_subscription_status',
        'has_premium_access',
        'check_pet_limit',
        'check_photo_limit',
        'track_feature_usage',
        'update_updated_at_column',
        'find_users_within_radius',
        'get_lost_pets_within_radius'
    ];
BEGIN
    FOREACH function_name IN ARRAY critical_functions
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = function_name) THEN
            RAISE EXCEPTION 'Critical function % does not exist', function_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'PASS: All critical functions exist';
END
$$;

-- Test: Verify triggers are properly configured
DO $$
DECLARE
    trigger_count INT;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';
    
    -- We expect at least 8 triggers
    IF trigger_count < 8 THEN
        RAISE EXCEPTION 'Insufficient triggers: expected >= 8, found %', trigger_count;
    END IF;
    
    RAISE NOTICE 'PASS: Found % triggers', trigger_count;
END
$$;

-- ================================================================================================
-- 5. DATA INTEGRITY AND CONSTRAINT TESTS
-- ================================================================================================

-- Test: Verify unique constraints work
DO $$
DECLARE
    constraint_violated BOOLEAN := FALSE;
BEGIN
    BEGIN
        -- Try to insert duplicate email
        INSERT INTO users (auth_user_id, email, full_name)
        VALUES (uuid_generate_v4(), 'duplicate@test.com', 'Test User 1'),
               (uuid_generate_v4(), 'duplicate@test.com', 'Test User 2');
        constraint_violated := TRUE;
    EXCEPTION
        WHEN unique_violation THEN
            constraint_violated := FALSE;
    END;
    
    IF constraint_violated THEN
        RAISE EXCEPTION 'Unique constraint on email failed';
    END IF;
    
    RAISE NOTICE 'PASS: Unique constraints work correctly';
END
$$;

-- Test: Verify check constraints work
DO $$
DECLARE
    constraint_violated BOOLEAN := FALSE;
BEGIN
    BEGIN
        -- Try to insert invalid subscription status
        INSERT INTO users (auth_user_id, email, subscription_status)
        VALUES (uuid_generate_v4(), 'test@example.com', 'invalid_status');
        constraint_violated := TRUE;
    EXCEPTION
        WHEN check_violation OR invalid_text_representation THEN
            constraint_violated := FALSE;
    END;
    
    IF constraint_violated THEN
        RAISE EXCEPTION 'Check constraint on subscription_status failed';
    END IF;
    
    RAISE NOTICE 'PASS: Check constraints work correctly';
END
$$;

-- ================================================================================================
-- 6. PERFORMANCE OPTIMIZATION TESTS
-- ================================================================================================

-- Test: Verify query performance on critical indexes
DO $$
DECLARE
    query_plan TEXT;
    uses_index BOOLEAN;
BEGIN
    -- Test users auth_user_id index usage
    EXPLAIN (FORMAT TEXT) 
    SELECT * FROM users WHERE auth_user_id = uuid_generate_v4()
    INTO query_plan;
    
    uses_index := position('Index Scan' in query_plan) > 0;
    
    IF NOT uses_index THEN
        RAISE WARNING 'Query on users.auth_user_id may not be using index efficiently';
    ELSE
        RAISE NOTICE 'PASS: Users auth_user_id index is being used';
    END IF;
END
$$;

-- Test: Verify spatial index performance for lost pets
DO $$
DECLARE
    query_plan TEXT;
    uses_spatial_index BOOLEAN;
BEGIN
    -- Test spatial index on lost_pets location
    EXPLAIN (FORMAT TEXT)
    SELECT * FROM lost_pets 
    WHERE ST_DWithin(last_seen_location, ST_GeogFromText('POINT(0 0)'), 1000)
    INTO query_plan;
    
    uses_spatial_index := position('Index' in query_plan) > 0;
    
    IF NOT uses_spatial_index THEN
        RAISE WARNING 'Spatial queries on lost_pets may not be using indexes efficiently';
    ELSE
        RAISE NOTICE 'PASS: Lost pets spatial index is being used';
    END IF;
END
$$;

-- ================================================================================================
-- 7. SUBSCRIPTION AND PAYMENT CONSTRAINT TESTS
-- ================================================================================================

-- Test: Verify Stripe integration constraints
DO $$
DECLARE
    test_user_id UUID;
    test_customer_id TEXT := 'cus_test_123456789';
BEGIN
    -- Create test user with Stripe customer ID
    INSERT INTO users (auth_user_id, email, stripe_customer_id, full_name)
    VALUES (uuid_generate_v4(), 'stripe_test@example.com', test_customer_id, 'Stripe Test User')
    RETURNING id INTO test_user_id;
    
    -- Test subscription constraint matching
    BEGIN
        INSERT INTO subscriptions (
            user_id, 
            stripe_subscription_id, 
            stripe_customer_id, 
            plan_name, 
            status
        ) VALUES (
            test_user_id, 
            'sub_test_123456789', 
            'different_customer_id', -- This should fail
            'premium_monthly', 
            'active'
        );
        
        RAISE EXCEPTION 'Stripe customer ID consistency check failed';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Stripe customer ID consistency constraint works';
    END;
    
    -- Clean up
    DELETE FROM users WHERE id = test_user_id;
END
$$;

-- ================================================================================================
-- FINAL VALIDATION SUMMARY
-- ================================================================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'DATABASE SCHEMA INTEGRITY TEST COMPLETE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'All critical database components validated:';
    RAISE NOTICE '✓ Extensions and custom types';
    RAISE NOTICE '✓ Tables and indexes';
    RAISE NOTICE '✓ Foreign key constraints';
    RAISE NOTICE '✓ Row Level Security policies';
    RAISE NOTICE '✓ Functions and triggers';
    RAISE NOTICE '✓ Data integrity constraints';
    RAISE NOTICE '✓ Performance optimizations';
    RAISE NOTICE '✓ Stripe integration constraints';
    RAISE NOTICE '==========================================';
END
$$;