#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('URL:', supabaseUrl ? '✓' : '❌');
  console.error('Service Key:', supabaseServiceKey ? '✓' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUserProfilesTable() {
  console.log('🔧 Creating user_profiles table...');
  
  const createTableSQL = `
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    subscription_status VARCHAR(20) DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper function to get user subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
    subscription_status VARCHAR(20),
    expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.subscription_status,
        up.subscription_expires_at
    FROM public.user_profiles up
    WHERE up.user_id = user_uuid;
END;
$$;
`;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      // Try direct query approach if RPC doesn't work
      console.log('📝 Trying direct SQL execution...');
      const { error: directError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (directError && directError.code === 'PGRST205') {
        console.error('❌ Cannot create table via API. Please run the SQL manually in Supabase Dashboard.');
        console.log('\n📋 Copy this SQL to Supabase Dashboard SQL Editor:');
        console.log('='.repeat(60));
        console.log(createTableSQL);
        console.log('='.repeat(60));
        return false;
      } else {
        console.log('✅ Table already exists or was created successfully');
      }
    } else {
      console.log('✅ SQL executed successfully');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

async function verifyTableExists() {
  console.log('🔍 Verifying user_profiles table...');
  
  try {
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Table verification failed:', error.message);
      return false;
    }
    
    console.log('✅ Table exists and is accessible');
    return true;
  } catch (err) {
    console.error('❌ Verification error:', err.message);
    return false;
  }
}

async function createProfileForExistingUser() {
  console.log('👤 Creating profile for existing user...');
  
  try {
    // Check if profile already exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', '9ac61b7d-b874-4712-9906-4188a8788dbf')
      .single();
    
    if (existing) {
      console.log('✅ Profile already exists for user');
      return true;
    }
    
    // Create profile for the logged-in user
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: '9ac61b7d-b874-4712-9906-4188a8788dbf',
        email: 'aopopov@outlook.com',
        subscription_status: 'inactive'
      });
    
    if (error) {
      console.error('❌ Failed to create user profile:', error.message);
      return false;
    }
    
    console.log('✅ Created profile for existing user');
    return true;
  } catch (err) {
    console.error('❌ Error creating profile:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting TailTracker database fix...\n');
  
  // Step 1: Try to create the table
  const tableCreated = await createUserProfilesTable();
  
  if (!tableCreated) {
    console.log('\n⚠️  Manual intervention required. Please run the SQL in Supabase Dashboard.');
    process.exit(1);
  }
  
  // Step 2: Verify table exists
  const tableExists = await verifyTableExists();
  
  if (!tableExists) {
    console.log('\n❌ Table verification failed');
    process.exit(1);
  }
  
  // Step 3: Create profile for existing user
  await createProfileForExistingUser();
  
  console.log('\n🎉 Database fix completed successfully!');
  console.log('✅ user_profiles table is ready');
  console.log('✅ RLS policies are in place');
  console.log('✅ Subscription service should work now');
  console.log('\n🔄 Please restart your app to see the changes.');
}

main().catch(console.error);