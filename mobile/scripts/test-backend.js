#!/usr/bin/env node

/**
 * TailTracker Backend Connectivity Test
 * This script tests the Supabase connection and basic functionality
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

console.log('🚀 TailTracker Backend Connectivity Test');
console.log('=' .repeat(50));

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('\n📡 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Connection successful, but table not found (migrations needed)');
      console.log('   Error:', error.message);
      return false;
    }
    
    console.log('✅ Successfully connected to Supabase');
    console.log('✅ Database tables are accessible');
    return true;
  } catch (err) {
    console.error('❌ Failed to connect to Supabase:', err.message);
    return false;
  }
}

async function testAuth() {
  console.log('\n🔐 Testing authentication system...');
  
  try {
    // Test if auth is properly configured
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth configuration error:', error.message);
      return false;
    }
    
    console.log('✅ Authentication system is configured');
    console.log('   Current session:', data.session ? 'Active' : 'None (expected)');
    return true;
  } catch (err) {
    console.error('❌ Auth test failed:', err.message);
    return false;
  }
}

async function testMigrations() {
  console.log('\n📋 Checking migration status...');
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found');
    return false;
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log('📁 Found migrations:');
  migrationFiles.forEach(file => {
    console.log(`   • ${file}`);
  });
  
  // Test if we can query the database structure
  try {
    const { data, error } = await supabase
      .rpc('pg_get_tabledef', { tablename: 'user_profiles' });
    
    if (error) {
      console.log('⚠️  Migrations not yet applied - database structure missing');
      console.log('   Run: supabase db push to apply migrations');
      return false;
    }
    
    console.log('✅ Database structure appears to be in place');
    return true;
  } catch (err) {
    console.log('⚠️  Could not verify database structure');
    console.log('   This is expected if migrations haven\'t been run yet');
    return false;
  }
}

async function testBasicOperations() {
  console.log('\n🧪 Testing basic database operations...');
  
  try {
    // Test user profile operations
    console.log('   Testing user profiles table...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, created_at')
      .limit(1);
    
    if (profileError) {
      console.log('⚠️  User profiles table not accessible:', profileError.message);
    } else {
      console.log('✅ User profiles table accessible');
      console.log(`   Found ${profiles?.length || 0} profiles`);
    }
    
    // Test pets table
    console.log('   Testing pets table...');
    const { data: pets, error: petError } = await supabase
      .from('pets')
      .select('id, name, species')
      .limit(1);
    
    if (petError) {
      console.log('⚠️  Pets table not accessible:', petError.message);
    } else {
      console.log('✅ Pets table accessible');
      console.log(`   Found ${pets?.length || 0} pets`);
    }
    
    return !profileError && !petError;
  } catch (err) {
    console.error('❌ Database operation test failed:', err.message);
    return false;
  }
}

async function testStorageSetup() {
  console.log('\n💾 Testing storage configuration...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('⚠️  Storage not accessible:', error.message);
      return false;
    }
    
    console.log('✅ Storage is accessible');
    console.log('📦 Available buckets:');
    
    const expectedBuckets = ['pet-photos', 'documents', 'qr-codes'];
    
    buckets.forEach(bucket => {
      const isExpected = expectedBuckets.includes(bucket.name);
      console.log(`   ${isExpected ? '✅' : '📁'} ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Check if all expected buckets exist
    const missingBuckets = expectedBuckets.filter(
      expected => !buckets.find(bucket => bucket.name === expected)
    );
    
    if (missingBuckets.length > 0) {
      console.log('⚠️  Missing expected buckets:', missingBuckets.join(', '));
      console.log('   These will be created automatically when first used');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Storage test failed:', err.message);
    return false;
  }
}

async function generateReport() {
  console.log('\n📊 Generating connectivity report...');
  
  const tests = [
    { name: 'Connection', fn: testConnection },
    { name: 'Authentication', fn: testAuth },
    { name: 'Migrations', fn: testMigrations },
    { name: 'Basic Operations', fn: testBasicOperations },
    { name: 'Storage Setup', fn: testStorageSetup }
  ];
  
  const results = {};
  
  for (const test of tests) {
    try {
      results[test.name] = await test.fn();
    } catch (err) {
      console.error(`❌ ${test.name} test crashed:`, err.message);
      results[test.name] = false;
    }
  }
  
  console.log('\n📋 FINAL REPORT');
  console.log('=' .repeat(30));
  
  let passedCount = 0;
  const totalCount = Object.keys(results).length;
  
  Object.entries(results).forEach(([testName, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${testName}`);
    if (passed) passedCount++;
  });
  
  console.log('\n📈 SUMMARY');
  console.log(`Passed: ${passedCount}/${totalCount} tests`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All tests passed! Backend is fully configured.');
  } else if (passedCount >= totalCount - 1) {
    console.log('⚠️  Almost ready! Check the warnings above.');
  } else {
    console.log('🔧 Backend needs configuration. See errors above.');
  }
  
  console.log('\n🔧 NEXT STEPS:');
  if (!results.Connection) {
    console.log('   1. Verify Supabase URL and API key in .env file');
  }
  if (!results.Migrations) {
    console.log('   2. Run migrations: supabase db push');
  }
  if (!results['Basic Operations']) {
    console.log('   3. Check database permissions and RLS policies');
  }
  if (!results['Storage Setup']) {
    console.log('   4. Configure storage buckets in Supabase dashboard');
  }
  
  return passedCount === totalCount;
}

// Run the test suite
generateReport()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('💥 Test suite crashed:', err);
    process.exit(1);
  });