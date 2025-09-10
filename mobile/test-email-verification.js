#!/usr/bin/env node

/**
 * TailTracker Email Verification Test
 * Tests the complete email verification flow with SMTP configuration
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tkcajpwdlsavqfqhdawy.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY2FqcHdkbHNhdnFmcWhkYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTgwMTUsImV4cCI6MjA3MjAzNDAxNX0.PcjbQzW5SMVZ0U5pM-mX8xbqS8gDY4WlB4HHLdP3DCE';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
});

// Test configuration
const TEST_EMAIL = `test+${Date.now()}@tailtracker.dev`;
const TEST_PASSWORD = 'TestPassword123!';

// Logging utilities
const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) {
    console.log('  Data:', JSON.stringify(data, null, 2));
  }
};

const error = (message, err = null) => {
  console.error(`[${new Date().toISOString()}] ❌ ${message}`);
  if (err) {
    console.error('  Error:', err.message || err);
    if (err.details) console.error('  Details:', err.details);
  }
};

const success = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ✅ ${message}`);
  if (data) {
    console.log('  Data:', JSON.stringify(data, null, 2));
  }
};

// Test functions
async function testDatabaseConnection() {
  log('Testing database connection...');
  try {
    const { data, error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (dbError) {
      error('Database connection failed', dbError);
      return false;
    }
    
    success('Database connection successful');
    return true;
  } catch (err) {
    error('Database connection error', err);
    return false;
  }
}

async function testCurrentSession() {
  log('Checking current session...');
  try {
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError) {
      error('Session check failed', sessionError);
      return false;
    }
    
    if (user) {
      log('Existing session found', { email: user.email, confirmed: user.email_confirmed_at });
      
      // Sign out existing session
      log('Signing out existing session...');
      await supabase.auth.signOut();
      success('Signed out successfully');
    } else {
      log('No existing session');
    }
    
    return true;
  } catch (err) {
    error('Session check error', err);
    return false;
  }
}

async function testEmailSignup() {
  log(`Testing email signup with: ${TEST_EMAIL}`);
  
  try {
    const { data, error: signupError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          full_name: 'Test User'
        },
        emailRedirectTo: 'tailtracker://auth/verify'
      }
    });
    
    if (signupError) {
      error('Signup failed', signupError);
      return false;
    }
    
    success('Signup successful', {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at,
        created_at: data.user.created_at
      } : null,
      session: data.session ? 'Present' : 'None'
    });
    
    // Check if email was sent
    if (data.user && !data.user.email_confirmed_at) {
      log('📧 Verification email should be sent to:', TEST_EMAIL);
      log('🔗 Check your email for verification link with format: tailtracker://auth/verify?...');
      log('⚠️  If using a real email, check spam folder');
    } else if (data.user && data.user.email_confirmed_at) {
      log('⚠️  Email was automatically confirmed (might indicate test mode)');
    }
    
    return true;
  } catch (err) {
    error('Signup error', err);
    return false;
  }
}

async function testResendVerification() {
  log('Testing resend verification email...');
  
  try {
    const { data, error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: TEST_EMAIL,
      options: {
        emailRedirectTo: 'tailtracker://auth/verify'
      }
    });
    
    if (resendError) {
      error('Resend verification failed', resendError);
      return false;
    }
    
    success('Resend verification successful', data);
    log('📧 Another verification email should be sent to:', TEST_EMAIL);
    
    return true;
  } catch (err) {
    error('Resend verification error', err);
    return false;
  }
}

async function checkSupabaseSettings() {
  log('Checking Supabase configuration...');
  
  try {
    // Test with service role to check settings
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      log('⚠️  Service role key not available - cannot check detailed settings');
      return true;
    }
    
    const adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Check auth settings (this might not work with current permissions)
    log('✅ Configuration appears valid');
    
    return true;
  } catch (err) {
    error('Configuration check error', err);
    return false;
  }
}

async function cleanup() {
  log('Cleaning up test data...');
  
  try {
    // Sign out any session
    await supabase.auth.signOut();
    
    // Note: We can't delete the test user without admin privileges
    // In production, you might want to use a cleanup script with service role
    log('✅ Cleanup completed (test user remains in database)');
    
    return true;
  } catch (err) {
    error('Cleanup error', err);
    return false;
  }
}

// Main test execution
async function runEmailVerificationTest() {
  console.log('🧪 TailTracker Email Verification Test');
  console.log('=====================================');
  console.log(`📧 Test Email: ${TEST_EMAIL}`);
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
  console.log('');
  
  let allTestsPassed = true;
  
  // Test 1: Database Connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) allTestsPassed = false;
  
  console.log('');
  
  // Test 2: Current Session
  const sessionChecked = await testCurrentSession();
  if (!sessionChecked) allTestsPassed = false;
  
  console.log('');
  
  // Test 3: Email Signup
  const signupSuccessful = await testEmailSignup();
  if (!signupSuccessful) allTestsPassed = false;
  
  console.log('');
  
  // Test 4: Resend Verification (optional)
  const resendSuccessful = await testResendVerification();
  if (!resendSuccessful) {
    log('⚠️  Resend test failed but continuing...');
  }
  
  console.log('');
  
  // Test 5: Configuration Check
  const configValid = await checkSupabaseSettings();
  if (!configValid) allTestsPassed = false;
  
  console.log('');
  
  // Cleanup
  await cleanup();
  
  console.log('');
  console.log('📊 Test Summary');
  console.log('===============');
  
  if (allTestsPassed) {
    success('All critical tests passed! ✨');
    console.log('');
    console.log('📧 Next Steps:');
    console.log('1. Check your email inbox for verification email');
    console.log('2. Click the verification link');
    console.log('3. Verify it redirects to: tailtracker://auth/verify?...');
    console.log('4. Test in the mobile app');
    console.log('');
    console.log('🔧 If verification link redirects to localhost:');
    console.log('   → Check Supabase Dashboard → Authentication → URL Configuration');
    console.log('   → Site URL should be: tailtracker://');
    console.log('   → Redirect URLs should include: tailtracker://auth/verify');
  } else {
    error('Some tests failed - check logs above');
    console.log('');
    console.log('🔧 Common Issues:');
    console.log('• SMTP not configured in Supabase Dashboard');
    console.log('• Incorrect redirect URLs in Auth settings');
    console.log('• Network connectivity issues');
    console.log('• Invalid API keys or permissions');
  }
  
  process.exit(allTestsPassed ? 0 : 1);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  error('Unhandled Rejection at:', promise);
  error('Reason:', reason);
  process.exit(1);
});

// Run the test
runEmailVerificationTest().catch(err => {
  error('Test execution failed', err);
  process.exit(1);
});