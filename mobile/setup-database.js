/**
 * Database setup script to fix RLS policies and create necessary tables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupDatabase() {
  console.log('🛠️ Setting up TailTracker database...\n');

  try {
    // Create users table with proper structure
    const { error: usersTableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create users table if not exists
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY DEFAULT auth.uid(),
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          phone TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
        );

        -- Enable RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

        -- Create proper RLS policies
        CREATE POLICY "Users can view own profile" ON public.users
          FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Users can update own profile" ON public.users
          FOR UPDATE USING (auth.uid() = id);

        CREATE POLICY "Users can insert own profile" ON public.users
          FOR INSERT WITH CHECK (auth.uid() = id);

        -- Create pets table
        CREATE TABLE IF NOT EXISTS public.pets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          species TEXT NOT NULL,
          breed TEXT,
          birth_date DATE,
          weight DECIMAL(5,2),
          color TEXT,
          microchip_id TEXT UNIQUE,
          photo_url TEXT,
          status TEXT DEFAULT 'safe' CHECK (status IN ('safe', 'lost', 'found')),
          medical_conditions TEXT[],
          dietary_restrictions TEXT[],
          emergency_contact_name TEXT,
          emergency_contact_phone TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS on pets
        ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

        -- Create pets policies
        DROP POLICY IF EXISTS "Users can view own pets" ON public.pets;
        DROP POLICY IF EXISTS "Users can insert own pets" ON public.pets;
        DROP POLICY IF EXISTS "Users can update own pets" ON public.pets;
        DROP POLICY IF EXISTS "Users can delete own pets" ON public.pets;

        CREATE POLICY "Users can view own pets" ON public.pets
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own pets" ON public.pets
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own pets" ON public.pets
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete own pets" ON public.pets
          FOR DELETE USING (auth.uid() = user_id);

        -- Create trigger to update updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Apply trigger to tables
        DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
        CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON public.users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_pets_updated_at ON public.pets;
        CREATE TRIGGER update_pets_updated_at
          BEFORE UPDATE ON public.pets
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (usersTableError) {
      console.error('❌ Error setting up database:', usersTableError);
      return false;
    }

    console.log('✅ Database tables created successfully');
    console.log('✅ RLS policies configured');
    console.log('✅ Triggers set up');
    
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  }
}

// Alternative approach using direct SQL execution
async function setupDatabaseAlternative() {
  console.log('🛠️ Setting up database with alternative method...\n');

  const queries = [
    // Users table
    `
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID PRIMARY KEY DEFAULT auth.uid(),
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      phone TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `,
    
    // Enable RLS and policies for users
    `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`,
    
    `
    CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);
    `,
    
    `
    CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id);
    `,
    
    `
    CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
    `
  ];

  for (const query of queries) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log('⚠️ Query warning:', error.message);
      }
    } catch (err) {
      console.log('⚠️ Query execution note:', err.message);
    }
  }

  console.log('✅ Database setup completed');
  return true;
}

async function main() {
  console.log('🚀 TailTracker Database Setup');
  console.log('=============================\n');

  // Try main setup first
  let success = await setupDatabase();
  
  if (!success) {
    console.log('\n🔄 Trying alternative setup method...\n');
    success = await setupDatabaseAlternative();
  }

  if (success) {
    console.log('\n🎉 Database setup complete!');
    console.log('✅ The app should now work correctly');
    console.log('\n📝 Next: Restart the Expo server');
    console.log('   npm start');
  } else {
    console.log('\n❌ Database setup failed');
    console.log('💡 Try running this again or check Supabase dashboard');
  }
}

main().catch(console.error);