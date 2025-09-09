-- TailTracker Database Verification Script
-- Run this after applying the fix to verify everything is working correctly

-- 1. Check if user_profiles table exists
SELECT 
    'user_profiles table exists' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 2. Check if subscription_status enum exists
SELECT 
    'subscription_status enum exists' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'subscription_status'
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 3. Check if required columns exist
SELECT 
    'Required columns exist' as check_name,
    CASE WHEN (
        SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name IN ('id', 'user_id', 'subscription_status', 'subscription_expires_at', 'created_at', 'updated_at')
    ) = 6 THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 4. Check if indexes exist
SELECT 
    'Performance indexes exist' as check_name,
    CASE WHEN (
        SELECT COUNT(*) FROM pg_indexes 
        WHERE tablename = 'user_profiles' 
        AND indexname IN ('idx_user_profiles_user_id', 'idx_user_profiles_email', 'idx_user_profiles_subscription_status')
    ) >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 5. Check if RLS is enabled
SELECT 
    'Row Level Security enabled' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'user_profiles' AND rowsecurity = true
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 6. Check if RLS policies exist
SELECT 
    'RLS policies exist' as check_name,
    CASE WHEN (
        SELECT COUNT(*) FROM pg_policies 
        WHERE tablename = 'user_profiles'
    ) >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 7. Check if trigger functions exist
SELECT 
    'Trigger functions exist' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name IN ('handle_new_user', 'update_updated_at_column')
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 8. Check if helper functions exist
SELECT 
    'Helper functions exist' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name IN ('has_active_subscription', 'get_user_subscription_status')
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 9. Test user profile access (if authenticated)
SELECT 
    'User profile accessible' as check_name,
    CASE WHEN auth.uid() IS NOT NULL THEN
        CASE WHEN EXISTS (
            SELECT 1 FROM user_profiles WHERE user_id = auth.uid()
        ) THEN '✅ PASS - Profile exists' 
        ELSE '⚠️  WARN - No profile (will be created on next login)' END
    ELSE '⚠️  WARN - Not authenticated' END as status;

-- 10. Show current user's subscription status (if authenticated)
SELECT 
    user_id,
    subscription_status,
    subscription_expires_at,
    is_expired,
    days_until_expiry
FROM get_user_subscription_status()
WHERE auth.uid() IS NOT NULL
UNION ALL
SELECT 
    NULL::uuid as user_id,
    NULL::subscription_status,
    NULL::timestamptz,
    NULL::boolean,
    NULL::integer
WHERE auth.uid() IS NULL;

-- Summary: Count of checks passed
SELECT 
    'SUMMARY' as check_name,
    'Database setup ' || 
    CASE WHEN (
        -- Count successful checks
        (CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN 1 ELSE 0 END) +
        (CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN 1 ELSE 0 END) +
        (CASE WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name IN ('id', 'user_id', 'subscription_status', 'subscription_expires_at', 'created_at', 'updated_at')) = 6 THEN 1 ELSE 0 END) +
        (CASE WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'user_profiles') >= 3 THEN 1 ELSE 0 END) +
        (CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true) THEN 1 ELSE 0 END) +
        (CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_profiles') >= 3 THEN 1 ELSE 0 END) +
        (CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name IN ('handle_new_user', 'update_updated_at_column')) THEN 1 ELSE 0 END) +
        (CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name IN ('has_active_subscription', 'get_user_subscription_status')) THEN 1 ELSE 0 END)
    ) >= 7 THEN '✅ COMPLETE' ELSE '❌ INCOMPLETE' END as status;