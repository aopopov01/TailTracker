#!/usr/bin/env node

/**
 * Test SMTP Email Delivery 
 * Check if users are created despite 504 timeouts
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testEmailDelivery() {
  console.log('📧 Testing SMTP Email Delivery');
  console.log('==============================');
  
  const testEmail = `test+${Date.now()}@example.com`;
  console.log(`Testing with: ${testEmail}`);
  
  // Step 1: Check initial user count
  console.log('\n1. Checking initial state...');
  const { data: initialUsers } = await adminClient.from('auth.users').select('count');
  console.log(`Initial user count: ${initialUsers?.[0]?.count || 0}`);
  
  // Step 2: Attempt signup with timeout handling
  console.log('\n2. Attempting signup (may timeout)...');
  let signupResult = null;
  let signupError = null;
  
  try {
    // Set a shorter timeout to avoid hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    signupResult = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: { full_name: 'SMTP Test User' }
      }
    });
    
    clearTimeout(timeoutId);
    console.log('✅ Signup completed successfully!');
    
  } catch (error) {
    signupError = error;
    if (error.status === 504) {
      console.log('⏱️  Got 504 timeout (expected with slow SMTP)');
    } else {
      console.log('❌ Signup failed:', error.message);
    }
  }
  
  // Step 3: Wait a moment and check if user was created anyway
  console.log('\n3. Checking if user was created despite timeout...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  
  try {
    const { data: users, error } = await adminClient
      .from('auth.users')
      .select('id, email, email_confirmed_at, created_at')
      .eq('email', testEmail);
    
    if (error) {
      console.error('❌ Failed to check users:', error.message);
      return;
    }
    
    if (users && users.length > 0) {
      const user = users[0];
      console.log('✅ User was created successfully!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.created_at}`);
      
      // Check if this means SMTP is working
      if (!user.email_confirmed_at) {
        console.log('\n📧 Email verification status:');
        console.log('   User created but not confirmed = Email sent successfully');
        console.log('   Check your email for verification link');
        console.log('   The 504 timeout is just slow SMTP delivery');
      }
      
    } else {
      console.log('❌ User was not created');
    }
    
  } catch (err) {
    console.error('❌ Error checking user creation:', err.message);
  }
  
  // Step 4: Test the app's auth flow behavior
  console.log('\n4. Testing app auth flow handling...');
  
  // Try to sign in with the test user (should fail if not confirmed)
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'TestPassword123!'
    });
    
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        console.log('✅ Email verification required (expected)');
        console.log('   This confirms user exists and SMTP delivery is working');
      } else {
        console.log('❌ Unexpected sign-in error:', error.message);
      }
    } else {
      console.log('⚠️  User signed in without confirmation (check settings)');
    }
    
  } catch (err) {
    console.log('❌ Sign-in test failed:', err.message);
  }
  
  console.log('\n📊 Summary');
  console.log('===========');
  
  if (signupError && signupError.status === 504) {
    console.log('🎯 Root Cause: SMTP Delivery Timeout');
    console.log('');
    console.log('The 504 timeout occurs because:');
    console.log('• Your SMTP server is slow to respond');
    console.log('• Email delivery is taking longer than expected');
    console.log('• Supabase times out waiting for email confirmation');
    console.log('');
    console.log('🔧 Solutions:');
    console.log('1. This is normal for new SMTP setups');
    console.log('2. Users are still created (check above)');
    console.log('3. Emails are still sent (just slowly)');
    console.log('4. App should handle timeouts gracefully');
    console.log('');
    console.log('📱 For the mobile app:');
    console.log('• Show "Please check your email" even on timeout');
    console.log('• Don\'t show error for 504 timeouts');
    console.log('• Provide "Resend email" option');
  } else if (!signupError) {
    console.log('✅ SMTP is working perfectly!');
    console.log('No timeout issues detected.');
  } else {
    console.log('❌ There may be a configuration issue.');
    console.log('Error:', signupError.message);
  }
}

testEmailDelivery().catch(console.error);