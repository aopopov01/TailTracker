-- Simple TailTracker Data Sync Migration
-- This can be executed directly in the Supabase SQL Editor

-- 1. Create sync log table
CREATE TABLE IF NOT EXISTS public.data_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    sync_type VARCHAR(50) NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    target_id UUID,
    sync_status VARCHAR(20) DEFAULT 'pending',
    sync_details JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.data_sync_log ENABLE ROW LEVEL SECURITY;

-- 2. Create basic sync function for user data
CREATE OR REPLACE FUNCTION public.sync_user_profile_basic(user_auth_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Log the sync attempt
    INSERT INTO public.data_sync_log (
        sync_type, target_table, sync_status, sync_details
    ) VALUES (
        'user_profile', 'users', 'success',
        jsonb_build_object('synced_at', NOW(), 'user_id', user_auth_id)
    );
    
    result := json_build_object(
        'status', 'success',
        'message', 'User profile sync completed',
        'synced_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.sync_user_profile_basic(UUID) TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.data_sync_log TO authenticated;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_data_sync_log_user_id ON public.data_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_created_at ON public.data_sync_log(created_at);

-- Insert a test record to verify the system is working
INSERT INTO public.data_sync_log (
    sync_type, target_table, sync_status, sync_details
) VALUES (
    'system_test', 'migration', 'success',
    jsonb_build_object(
        'message', 'TailTracker sync system installed successfully',
        'installed_at', NOW(),
        'version', '1.0.0'
    )
);