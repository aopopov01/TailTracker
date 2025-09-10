#!/usr/bin/env node

/**
 * Test Mobile App SMTP Timeout Handling
 * Simulates how the mobile app would handle auth timeouts
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
});

// Simulate the mobile app's authService.register method
async function simulateMobileRegister(userData) {
  try {
    console.log(`📱 Simulating mobile app registration for: ${userData.email}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: userData.email.toLowerCase(),
      password: userData.password,
      options: {
        data: {
          firstName: userData.firstName.trim(),
          lastName: userData.lastName.trim(),
          full_name: `${userData.firstName.trim()} ${userData.lastName.trim()}`
        },
        emailRedirectTo: 'tailtracker://auth/verify'
      }
    });

    if (error) {
      // Handle 504 timeout gracefully - this is the new logic
      if (error.status === 504 || error.name === 'AuthRetryableFetchError') {
        console.log('⏱️ SMTP timeout detected - treating as successful signup with delayed email');
        return {
          success: true,
          user: {
            id: 'pending',
            email: userData.email.toLowerCase(),
            firstName: userData.firstName.trim(),
            lastName: userData.lastName.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          requiresEmailVerification: true,
          smtpDelay: true // Flag to indicate timeout occurred
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Failed to create user account'
      };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at,
      },
      requiresEmailVerification: true
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Registration failed. Please try again.'
    };
  }
}

// Test function
async function testTimeoutHandling() {
  console.log('🧪 Testing SMTP Timeout Handling');
  console.log('=================================');
  
  const testEmail = `timeout_test+${Date.now()}@example.com`;
  
  const result = await simulateMobileRegister({
    email: testEmail,
    password: 'TestPassword123!',
    firstName: 'Timeout',
    lastName: 'Test'
  });
  
  console.log('\n📱 Mobile App Registration Result:');
  console.log('Success:', result.success);
  
  if (result.success) {
    console.log('✅ Registration handled successfully!');
    console.log('User ID:', result.user.id);
    console.log('Email verification required:', result.requiresEmailVerification);
    
    if (result.smtpDelay) {
      console.log('⏱️ SMTP delay detected and handled gracefully');
      console.log('');
      console.log('📱 Mobile app should show:');
      console.log('   "Account created! Please check your email for verification."');
      console.log('   "Email delivery may take a few minutes."');
      console.log('   [Resend Email] button');
    } else {
      console.log('📧 Email sent successfully');
      console.log('');
      console.log('📱 Mobile app should show:');
      console.log('   "Account created! Please check your email for verification."');
      console.log('   [Resend Email] button');
    }
    
  } else {
    console.log('❌ Registration failed:', result.error);
  }
  
  console.log('\n🎯 Summary:');
  console.log('===========');
  
  if (result.success && result.smtpDelay) {
    console.log('✅ SMTP timeout handling is working correctly!');
    console.log('');
    console.log('The mobile app will now:');
    console.log('• Show success message even on timeout');
    console.log('• Inform user about potential email delay');
    console.log('• Provide resend option');
    console.log('• Allow user to proceed to email verification screen');
  } else if (result.success) {
    console.log('✅ Registration completed without timeout');
  } else {
    console.log('❌ Registration failed - check SMTP configuration');
  }
}

testTimeoutHandling().catch(console.error);