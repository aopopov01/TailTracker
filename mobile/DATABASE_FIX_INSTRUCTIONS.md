# TailTracker Database Fix: User Profiles Table

## Problem
The TailTracker app is encountering the error: "Could not find the table 'public.user_profiles' in the schema cache". This indicates that the `user_profiles` table is missing from the Supabase database, even though the subscription service expects it to exist.

## Solution
The database schema exists in the migration files but hasn't been applied to the remote Supabase database. Here's how to fix it:

### Option 1: Using Supabase Dashboard (Recommended)

1. **Log into your Supabase Dashboard**
   - Go to https://app.supabase.com
   - Navigate to your project: `tkcajpwdlsavqfqhdawy`

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Fix Script**
   - Copy the entire contents of `/home/he_reat/Desktop/Projects/TailTracker/mobile/fix_user_profiles_table.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

### Option 2: Using Supabase CLI

1. **Link to your remote project**
   ```bash
   npx supabase link --project-ref tkcajpwdlsavqfqhdawy
   ```

2. **Apply all migrations**
   ```bash
   npx supabase db push
   ```

### Option 3: Manual Migration Application

If the above doesn't work, apply each migration file manually in the Supabase SQL Editor in this order:

1. `20250903000001_create_tailtracker_schema.sql`
2. `20250903000002_setup_rls_policies.sql`
3. `20250903000003_setup_auth_triggers.sql`
4. `20250907000001_add_user_profiles_indexes.sql`

## What the Fix Does

### 1. Creates the `user_profiles` table with:
- `id` (UUID, primary key)
- `user_id` (UUID, references auth.users)
- `subscription_status` (enum: 'active', 'inactive', 'canceled', 'past_due')
- `subscription_expires_at` (timestamp)
- `created_at` and `updated_at` (timestamps)
- All other required fields for user profile management

### 2. Sets up Row Level Security (RLS) policies:
- Users can only view, insert, and update their own profiles
- Proper access control for data security

### 3. Creates performance indexes:
- `idx_user_profiles_user_id` - For fast user lookups
- `idx_user_profiles_email` - For email-based queries  
- `idx_user_profiles_subscription_status` - For subscription filtering
- `idx_user_profiles_subscription_active` - Composite index for active subscription queries

### 4. Sets up automatic triggers:
- `handle_new_user()` - Automatically creates user profile when user signs up
- `update_updated_at_column()` - Updates timestamp on profile changes

### 5. Creates helper functions:
- `has_active_subscription()` - Check if user has active subscription
- `get_user_subscription_status()` - Get detailed subscription information

### 6. Ensures data consistency:
- Creates profiles for existing users who don't have them
- Sets default subscription status to 'inactive' for existing users

## Verification

After running the fix, verify it worked by:

1. **Check table exists:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'user_profiles';
   ```

2. **Check your user profile:**
   ```sql
   SELECT * FROM user_profiles WHERE user_id = auth.uid();
   ```

3. **Test subscription status:**
   ```sql
   SELECT has_active_subscription();
   ```

## App Integration

The subscription service in `/src/services/subscriptionService.ts` is already configured to work with this table structure. Once the table is created, the app should work correctly with:

- User authentication and profile creation
- Subscription status checking
- Feature access control based on subscription tier
- Free/Premium/Pro tier system

## Expected Results

After applying the fix:
- ✅ User authentication will work
- ✅ User profiles will be automatically created
- ✅ Subscription status will be properly tracked
- ✅ The error "Could not find the table 'public.user_profiles'" will be resolved
- ✅ The Free/Premium/Pro tier system will function correctly

## Troubleshooting

If you still see errors after applying the fix:

1. **Check if all migrations were applied:**
   ```sql
   SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;
   ```

2. **Verify RLS is enabled:**
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'user_profiles';
   ```

3. **Check user profile exists:**
   ```sql
   SELECT COUNT(*) FROM user_profiles WHERE user_id = auth.uid();
   ```

4. **Restart the app** to clear any cached database schema information.

## Contact

If you continue to experience issues after following these steps, the problem may be related to:
- Network connectivity to Supabase
- API key configuration
- User authentication setup

Please verify your environment variables in `.env.development` are correct and the Supabase project is accessible.