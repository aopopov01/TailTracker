/**
 * Simple test script to verify password reset functionality with Supabase
 * Run with: node test-password-reset.js
 */

// Import required dependencies (we'll use Node.js compatible versions)
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset Functionality');
  console.log('=====================================');

  // Test email (use a real email you can access)
  const testEmail = 'test@tailtracker.app'; // Replace with your email
  
  console.log(`📧 Testing password reset for: ${testEmail}`);
  
  try {
    // Test the password reset functionality
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'tailtracker://reset-password', // Your app's deep link
    });

    if (error) {
      console.error('❌ Password reset failed:', error.message);
      return false;
    }

    console.log('✅ Password reset email sent successfully!');
    console.log('📬 Check your email inbox for the reset link');
    console.log('📱 The reset link should open your app with the reset token');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase Connection');
  console.log('===============================');

  try {
    // Test basic connection by getting the current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error && error.message !== 'Auth session missing!') {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');
    console.log('📊 Current session:', session ? 'Active' : 'None (normal for logged out)');
    return true;

  } catch (error) {
    console.error('❌ Connection error:', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 TailTracker Password Reset Test Suite');
  console.log('=========================================\n');

  // Test 1: Connection
  const connectionOK = await testSupabaseConnection();
  console.log('');

  if (!connectionOK) {
    console.log('❌ Connection failed - stopping tests');
    return;
  }

  // Test 2: Password Reset
  const resetOK = await testPasswordReset();
  console.log('');

  // Results
  console.log('📋 Test Results Summary');
  console.log('=======================');
  console.log('Connection:', connectionOK ? '✅ PASS' : '❌ FAIL');
  console.log('Password Reset:', resetOK ? '✅ PASS' : '❌ FAIL');
  
  if (connectionOK && resetOK) {
    console.log('\n🎉 All tests passed! Password reset is working correctly.');
    console.log('\n📝 Next Steps:');
    console.log('1. Check the test email inbox for the reset email');
    console.log('2. Verify the email contains a reset link');
    console.log('3. Test the complete reset flow in your app');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
  }
}

// Run the tests
runTests().catch(console.error);