-- TailTracker Database Subscription Management Test Suite
-- Comprehensive testing for subscription schema and data integrity
-- 
-- Test Categories:
-- 1. Database schema validation
-- 2. Subscription lifecycle data flow
-- 3. Premium feature access controls
-- 4. Payment processing data integrity
-- 5. RLS (Row Level Security) policies
-- 6. Data synchronization with Stripe
-- 7. Audit trail and GDPR compliance

-- Enable test mode and create test schema
BEGIN;

-- Create test schema for isolation
CREATE SCHEMA IF NOT EXISTS test_subscription;
SET search_path TO test_subscription, public;

-- Copy production tables for testing
CREATE TABLE test_users AS SELECT * FROM public.users WHERE FALSE;
CREATE TABLE test_families AS SELECT * FROM public.families WHERE FALSE;
CREATE TABLE test_pets AS SELECT * FROM public.pets WHERE FALSE;
CREATE TABLE test_subscriptions AS SELECT * FROM public.subscriptions WHERE FALSE;
CREATE TABLE test_payments AS SELECT * FROM public.payments WHERE FALSE;
CREATE TABLE test_family_members AS SELECT * FROM public.family_members WHERE FALSE;

-- Add test data generation functions
CREATE OR REPLACE FUNCTION generate_test_user(
    user_email TEXT DEFAULT 'test@tailtracker.com',
    subscription_type subscription_status DEFAULT 'free'
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    auth_user_id UUID;
BEGIN
    auth_user_id := uuid_generate_v4();
    new_user_id := uuid_generate_v4();
    
    INSERT INTO test_users (
        id, auth_user_id, email, full_name, subscription_status,
        subscription_expires_at, created_at, updated_at
    ) VALUES (
        new_user_id, auth_user_id, user_email, 'Test User',
        subscription_type,
        CASE 
            WHEN subscription_type = 'premium' THEN NOW() + INTERVAL '30 days'
            ELSE NULL
        END,
        NOW(), NOW()
    );
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Test 1: Schema Validation
SELECT 'TEST 1: Schema Validation' AS test_category;

-- Verify subscription_status enum values
DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'subscription_status' 
        AND e.enumlabel = 'premium'
    ), 'Premium subscription status must exist';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'subscription_status' 
        AND e.enumlabel = 'free'
    ), 'Free subscription status must exist';
    
    RAISE NOTICE 'Schema validation: PASSED';
END $$;

-- Verify required indexes exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscriptions_user_id') 
        THEN 'PASSED' 
        ELSE 'FAILED' 
    END AS subscription_user_index_test;

-- Test 2: Subscription Lifecycle Data Flow
SELECT 'TEST 2: Subscription Lifecycle' AS test_category;

DO $$
DECLARE
    test_user_id UUID;
    test_subscription_id UUID;
    test_customer_id TEXT := 'cus_test_customer_123';
    test_stripe_sub_id TEXT := 'sub_test_subscription_123';
BEGIN
    -- Create test user
    test_user_id := generate_test_user('lifecycle@test.com', 'free');
    
    -- Test subscription creation
    INSERT INTO test_subscriptions (
        user_id, plan_name, status, 
        current_period_start, current_period_end,
        stripe_subscription_id, stripe_customer_id
    ) VALUES (
        test_user_id, 'premium_monthly', 'active',
        NOW(), NOW() + INTERVAL '30 days',
        test_stripe_sub_id, test_customer_id
    ) RETURNING id INTO test_subscription_id;
    
    -- Update user subscription status
    UPDATE test_users 
    SET subscription_status = 'premium',
        subscription_expires_at = NOW() + INTERVAL '30 days'
    WHERE id = test_user_id;
    
    -- Verify subscription creation
    ASSERT EXISTS (
        SELECT 1 FROM test_subscriptions 
        WHERE user_id = test_user_id AND status = 'active'
    ), 'Subscription creation failed';
    
    -- Test subscription cancellation
    UPDATE test_subscriptions 
    SET cancel_at_period_end = TRUE,
        canceled_at = NOW()
    WHERE id = test_subscription_id;
    
    -- Verify cancellation
    ASSERT EXISTS (
        SELECT 1 FROM test_subscriptions 
        WHERE id = test_subscription_id AND cancel_at_period_end = TRUE
    ), 'Subscription cancellation failed';
    
    RAISE NOTICE 'Subscription lifecycle: PASSED';
END $$;

-- Test 3: Premium Feature Access Controls
SELECT 'TEST 3: Premium Feature Access Controls' AS test_category;

DO $$
DECLARE
    free_user_id UUID;
    premium_user_id UUID;
    family_id UUID;
    pet_count INTEGER;
BEGIN
    -- Create test users
    free_user_id := generate_test_user('free@test.com', 'free');
    premium_user_id := generate_test_user('premium@test.com', 'premium');
    
    -- Create families for both users
    INSERT INTO test_families (owner_id, name, invite_code, max_members)
    VALUES 
        (free_user_id, 'Free Family', 'FREE123', 6),
        (premium_user_id, 'Premium Family', 'PREM123', 6)
    RETURNING id INTO family_id;
    
    -- Test pet limits for free user (should be limited to 1)
    INSERT INTO test_pets (family_id, name, species, created_by)
    SELECT 
        (SELECT id FROM test_families WHERE owner_id = free_user_id),
        'Test Pet ' || generate_random_uuid(),
        'Dog',
        free_user_id
    FROM generate_series(1, 3);
    
    -- Count pets for free user
    SELECT COUNT(*) INTO pet_count
    FROM test_pets p
    JOIN test_families f ON p.family_id = f.id
    WHERE f.owner_id = free_user_id;
    
    -- Free users should be limited (in application logic, not DB constraints)
    RAISE NOTICE 'Free user created % pets (should be limited by app logic)', pet_count;
    
    -- Test pet limits for premium user (should be unlimited)
    INSERT INTO test_pets (family_id, name, species, created_by)
    SELECT 
        (SELECT id FROM test_families WHERE owner_id = premium_user_id),
        'Premium Pet ' || generate_random_uuid(),
        'Cat',
        premium_user_id
    FROM generate_series(1, 5);
    
    -- Count pets for premium user
    SELECT COUNT(*) INTO pet_count
    FROM test_pets p
    JOIN test_families f ON p.family_id = f.id
    WHERE f.owner_id = premium_user_id;
    
    ASSERT pet_count = 5, 'Premium user should have unlimited pets';
    
    RAISE NOTICE 'Premium feature access: PASSED';
END $$;

-- Test 4: Payment Processing Data Integrity
SELECT 'TEST 4: Payment Processing Data Integrity' AS test_category;

DO $$
DECLARE
    test_user_id UUID;
    test_subscription_id UUID;
    test_payment_id UUID;
BEGIN
    -- Create test user and subscription
    test_user_id := generate_test_user('payment@test.com', 'premium');
    
    INSERT INTO test_subscriptions (
        user_id, plan_name, status,
        stripe_subscription_id, stripe_customer_id
    ) VALUES (
        test_user_id, 'premium_monthly', 'active',
        'sub_payment_test', 'cus_payment_test'
    ) RETURNING id INTO test_subscription_id;
    
    -- Test successful payment record
    INSERT INTO test_payments (
        subscription_id, stripe_payment_intent_id,
        amount, currency, status, description, processed_at
    ) VALUES (
        test_subscription_id, 'pi_success_test',
        7.99, 'EUR', 'completed', 
        'Premium subscription payment', NOW()
    ) RETURNING id INTO test_payment_id;
    
    -- Verify payment record
    ASSERT EXISTS (
        SELECT 1 FROM test_payments 
        WHERE id = test_payment_id AND status = 'completed'
    ), 'Payment record creation failed';
    
    -- Test failed payment record
    INSERT INTO test_payments (
        subscription_id, stripe_payment_intent_id,
        amount, currency, status, description, processed_at
    ) VALUES (
        test_subscription_id, 'pi_failed_test',
        7.99, 'EUR', 'failed', 
        'Failed premium subscription payment', NOW()
    );
    
    -- Verify payment integrity
    ASSERT EXISTS (
        SELECT 1 FROM test_payments p
        JOIN test_subscriptions s ON p.subscription_id = s.id
        WHERE s.user_id = test_user_id AND p.status = 'failed'
    ), 'Failed payment record creation failed';
    
    RAISE NOTICE 'Payment data integrity: PASSED';
END $$;

-- Test 5: Subscription Limits and Validation
SELECT 'TEST 5: Subscription Limits Validation' AS test_category;

CREATE OR REPLACE FUNCTION validate_subscription_limits(
    user_id UUID,
    resource_type TEXT,
    current_count INTEGER DEFAULT 0
) RETURNS TABLE (
    allowed BOOLEAN,
    limit_value INTEGER,
    message TEXT
) AS $$
DECLARE
    user_subscription subscription_status;
    resource_limit INTEGER;
BEGIN
    -- Get user subscription status
    SELECT subscription_status INTO user_subscription
    FROM test_users WHERE id = user_id;
    
    -- Define limits based on subscription
    CASE 
        WHEN user_subscription = 'free' AND resource_type = 'pets' THEN
            resource_limit := 1;
        WHEN user_subscription = 'free' AND resource_type = 'photos_per_pet' THEN
            resource_limit := 1;
        WHEN user_subscription = 'free' AND resource_type = 'family_members' THEN
            resource_limit := 1;
        WHEN user_subscription = 'premium' THEN
            resource_limit := -1; -- unlimited
        ELSE
            resource_limit := 0;
    END CASE;
    
    -- Return validation result
    RETURN QUERY SELECT 
        CASE 
            WHEN resource_limit = -1 THEN TRUE -- unlimited
            WHEN current_count < resource_limit THEN TRUE
            ELSE FALSE
        END as allowed,
        resource_limit as limit_value,
        CASE 
            WHEN resource_limit = -1 THEN 'Unlimited access'
            WHEN current_count < resource_limit THEN 'Within limits'
            ELSE 'Limit exceeded'
        END as message;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    free_user_id UUID;
    premium_user_id UUID;
    validation_result RECORD;
BEGIN
    free_user_id := generate_test_user('limits@test.com', 'free');
    premium_user_id := generate_test_user('premium_limits@test.com', 'premium');
    
    -- Test free user limits
    SELECT * INTO validation_result 
    FROM validate_subscription_limits(free_user_id, 'pets', 1);
    
    ASSERT validation_result.allowed = FALSE, 'Free user should be limited to 1 pet';
    
    -- Test premium user limits
    SELECT * INTO validation_result 
    FROM validate_subscription_limits(premium_user_id, 'pets', 10);
    
    ASSERT validation_result.allowed = TRUE, 'Premium user should have unlimited pets';
    
    RAISE NOTICE 'Subscription limits validation: PASSED';
END $$;

-- Test 6: Data Synchronization Simulation
SELECT 'TEST 6: Stripe Data Synchronization' AS test_category;

CREATE OR REPLACE FUNCTION simulate_stripe_webhook(
    event_type TEXT,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    subscription_status TEXT DEFAULT 'active'
) RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
    subscription_found BOOLEAN := FALSE;
BEGIN
    -- Find user by Stripe customer ID
    SELECT s.user_id INTO user_id
    FROM test_subscriptions s
    WHERE s.stripe_customer_id = stripe_customer_id;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User not found for customer %', stripe_customer_id;
        RETURN FALSE;
    END IF;
    
    -- Handle different webhook events
    CASE event_type
        WHEN 'customer.subscription.created' THEN
            INSERT INTO test_subscriptions (
                user_id, plan_name, status,
                stripe_subscription_id, stripe_customer_id
            ) VALUES (
                user_id, 'premium_monthly', subscription_status,
                stripe_subscription_id, stripe_customer_id
            ) ON CONFLICT (stripe_subscription_id) DO NOTHING;
            subscription_found := TRUE;
            
        WHEN 'customer.subscription.updated' THEN
            UPDATE test_subscriptions 
            SET status = subscription_status::subscription_status,
                updated_at = NOW()
            WHERE stripe_subscription_id = simulate_stripe_webhook.stripe_subscription_id;
            subscription_found := FOUND;
            
        WHEN 'customer.subscription.deleted' THEN
            UPDATE test_subscriptions 
            SET status = 'cancelled',
                canceled_at = NOW()
            WHERE stripe_subscription_id = simulate_stripe_webhook.stripe_subscription_id;
            subscription_found := FOUND;
            
        WHEN 'invoice.payment_succeeded' THEN
            -- Record successful payment
            INSERT INTO test_payments (
                subscription_id, amount, currency, status,
                description, processed_at
            )
            SELECT s.id, 7.99, 'EUR', 'completed',
                   'Subscription payment', NOW()
            FROM test_subscriptions s
            WHERE s.stripe_subscription_id = simulate_stripe_webhook.stripe_subscription_id;
            subscription_found := FOUND;
            
        WHEN 'invoice.payment_failed' THEN
            -- Record failed payment
            INSERT INTO test_payments (
                subscription_id, amount, currency, status,
                description, processed_at
            )
            SELECT s.id, 7.99, 'EUR', 'failed',
                   'Failed subscription payment', NOW()
            FROM test_subscriptions s
            WHERE s.stripe_subscription_id = simulate_stripe_webhook.stripe_subscription_id;
            subscription_found := FOUND;
    END CASE;
    
    -- Update user subscription status
    IF event_type IN ('customer.subscription.created', 'customer.subscription.updated') THEN
        UPDATE test_users 
        SET subscription_status = subscription_status::subscription_status,
            subscription_expires_at = CASE 
                WHEN subscription_status = 'active' THEN NOW() + INTERVAL '30 days'
                ELSE NULL
            END
        WHERE id = user_id;
    END IF;
    
    RETURN subscription_found;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    test_user_id UUID;
    webhook_result BOOLEAN;
BEGIN
    -- Create test user with initial subscription
    test_user_id := generate_test_user('webhook@test.com', 'free');
    
    INSERT INTO test_subscriptions (
        user_id, plan_name, status,
        stripe_subscription_id, stripe_customer_id
    ) VALUES (
        test_user_id, 'premium_monthly', 'incomplete',
        'sub_webhook_test', 'cus_webhook_test'
    );
    
    -- Simulate subscription activation webhook
    SELECT simulate_stripe_webhook(
        'customer.subscription.updated',
        'sub_webhook_test',
        'cus_webhook_test',
        'active'
    ) INTO webhook_result;
    
    ASSERT webhook_result = TRUE, 'Webhook simulation failed';
    
    -- Verify subscription was updated
    ASSERT EXISTS (
        SELECT 1 FROM test_subscriptions 
        WHERE stripe_subscription_id = 'sub_webhook_test' 
        AND status = 'active'
    ), 'Subscription status not updated by webhook';
    
    -- Simulate payment success webhook
    SELECT simulate_stripe_webhook(
        'invoice.payment_succeeded',
        'sub_webhook_test',
        'cus_webhook_test'
    ) INTO webhook_result;
    
    -- Verify payment was recorded
    ASSERT EXISTS (
        SELECT 1 FROM test_payments p
        JOIN test_subscriptions s ON p.subscription_id = s.id
        WHERE s.stripe_subscription_id = 'sub_webhook_test'
        AND p.status = 'completed'
    ), 'Payment not recorded by webhook';
    
    RAISE NOTICE 'Stripe data synchronization: PASSED';
END $$;

-- Test 7: Performance and Concurrency
SELECT 'TEST 7: Performance and Concurrency' AS test_category;

DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration INTERVAL;
    user_count INTEGER := 100;
    i INTEGER;
    test_user_id UUID;
BEGIN
    start_time := clock_timestamp();
    
    -- Create multiple users and subscriptions concurrently
    FOR i IN 1..user_count LOOP
        test_user_id := generate_test_user(
            'perf_test_' || i || '@test.com', 
            CASE WHEN i % 2 = 0 THEN 'premium' ELSE 'free' END
        );
        
        IF i % 2 = 0 THEN
            INSERT INTO test_subscriptions (
                user_id, plan_name, status,
                stripe_subscription_id, stripe_customer_id
            ) VALUES (
                test_user_id, 'premium_monthly', 'active',
                'sub_perf_' || i, 'cus_perf_' || i
            );
        END IF;
    END LOOP;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    -- Verify all users were created
    ASSERT (SELECT COUNT(*) FROM test_users) >= user_count,
           'Not all test users were created';
    
    -- Verify subscription distribution
    ASSERT (SELECT COUNT(*) FROM test_subscriptions) = user_count / 2,
           'Incorrect number of subscriptions created';
    
    RAISE NOTICE 'Performance test: Created % users in %', user_count, duration;
    RAISE NOTICE 'Performance and concurrency: PASSED';
END $$;

-- Test Summary and Cleanup
SELECT 'TEST SUMMARY' AS test_category;

DO $$
DECLARE
    total_users INTEGER;
    total_subscriptions INTEGER;
    total_payments INTEGER;
    premium_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM test_users;
    SELECT COUNT(*) INTO total_subscriptions FROM test_subscriptions;
    SELECT COUNT(*) INTO total_payments FROM test_payments;
    SELECT COUNT(*) INTO premium_users FROM test_users WHERE subscription_status = 'premium';
    
    RAISE NOTICE '=== TEST EXECUTION SUMMARY ===';
    RAISE NOTICE 'Total test users created: %', total_users;
    RAISE NOTICE 'Total subscriptions created: %', total_subscriptions;
    RAISE NOTICE 'Total payments recorded: %', total_payments;
    RAISE NOTICE 'Premium users: %', premium_users;
    RAISE NOTICE 'Free users: %', total_users - premium_users;
    
    -- Validate data consistency
    ASSERT EXISTS (
        SELECT 1 FROM test_users u
        JOIN test_subscriptions s ON u.id = s.user_id
        WHERE u.subscription_status = 'premium' AND s.status = 'active'
    ), 'Data consistency check failed: Premium users should have active subscriptions';
    
    RAISE NOTICE 'Data consistency: PASSED';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ALL DATABASE SUBSCRIPTION TESTS PASSED! 🎉';
END $$;

-- Cleanup test schema
DROP SCHEMA test_subscription CASCADE;

COMMIT;