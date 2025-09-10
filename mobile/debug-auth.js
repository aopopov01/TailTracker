#!/usr/bin/env node

/**
 * Debug Supabase Auth Issues
 * Focused test to identify why signup is failing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tkcajpwdlsavqfqhdawy.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY2FqcHdkbHNhdnFmcWhkYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTgwMTUsImV4cCI6MjA3MjAzNDAxNX0.PcjbQzW5SMVZ0U5pM-mX8xbqS8gDY4WlB4HHLdP3DCE';

// Create client with detailed logging
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
    flowType: 'pkce',
    debug: true // Enable debug mode
  },
  global: {
    headers: {
      'X-Client-Info': 'tailtracker-debug'
    }
  }
});

async function debugAuth() {
  console.log('🔍 Debugging Supabase Auth Configuration');
  console.log('==========================================');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
  console.log('');

  // Test 1: Simple connection test
  console.log('1. Testing basic connection...');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Connection successful');
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return;
  }

  // Test 2: Check current session
  console.log('\n2. Checking session...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Session error:', error.message);
    } else {
      console.log('✅ Session check:', session ? 'Active session found' : 'No active session');
    }
  } catch (err) {
    console.error('❌ Session check failed:', err.message);
  }

  // Test 3: Try signup with detailed error logging
  const testEmail = `debug+${Date.now()}@example.com`;
  console.log(`\n3. Testing signup with: ${testEmail}`);
  
  try {
    console.log('Calling supabase.auth.signUp...');
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          full_name: 'Debug User'
        }
      }
    });

    console.log('Signup response received');
    console.log('Data:', JSON.stringify(data, null, 2));
    
    if (error) {
      console.error('❌ Signup error details:');
      console.error('  Message:', error.message || 'No message');
      console.error('  Code:', error.code || 'No code');
      console.error('  Details:', error.details || 'No details');
      console.error('  Hint:', error.hint || 'No hint');
      console.error('  Status:', error.status || 'No status');
      console.error('  Full error object:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Signup successful!');
      if (data.user) {
        console.log('  User ID:', data.user.id);
        console.log('  Email:', data.user.email);
        console.log('  Confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
      }
      if (data.session) {
        console.log('  Session created:', 'Yes');
      } else {
        console.log('  Session created:', 'No (email confirmation required)');
      }
    }
  } catch (err) {
    console.error('❌ Signup exception:', err.message);
    console.error('Full exception:', err);
  }

  // Test 4: Try a simple sign in to see if auth is working at all
  console.log('\n4. Testing with a known email (should fail but show auth is working)...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    
    if (error) {
      console.log('✅ Auth is working (got expected error):', error.message);
    } else {
      console.log('⚠️  Unexpected success with test credentials');
    }
  } catch (err) {
    console.error('❌ Sign in test failed:', err.message);
  }

  // Test 5: Check if we can access auth admin functions
  console.log('\n5. Testing auth admin access...');
  try {
    // This should fail with anon key, but tells us about permissions
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      if (error.message.includes('JWT') || error.message.includes('permission')) {
        console.log('✅ Auth admin properly restricted (expected)');
      } else {
        console.log('⚠️  Unexpected admin error:', error.message);
      }
    } else {
      console.log('⚠️  Unexpected admin access granted');
    }
  } catch (err) {
    console.log('✅ Auth admin access properly restricted');
  }

  console.log('\n🔧 Diagnosis Complete');
  console.log('====================');
  console.log('Check the output above for specific error details.');
  console.log('Common issues:');
  console.log('• Signup disabled in Supabase Dashboard');
  console.log('• Email domain restrictions');
  console.log('• SMTP configuration issues');
  console.log('• Incorrect API keys');
  console.log('• Auth flow type mismatches');
}

debugAuth().catch(console.error);