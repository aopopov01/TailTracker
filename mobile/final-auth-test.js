#!/usr/bin/env node

/**
 * Final Auth Test - Simple and Direct
 * Test signup and immediately verify user creation
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

async function finalTest() {
  console.log('🧪 Final Auth Test');
  console.log('==================');
  
  const testEmail = `finaltest+${Date.now()}@example.com`;
  console.log(`Test email: ${testEmail}`);
  console.log('');
  
  try {
    console.log('Attempting signup...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          full_name: 'Final Test User'
        }
      }
    });
    
    console.log('Signup response:');
    console.log('- Error:', error ? error.message : 'None');
    console.log('- User created:', data.user ? 'Yes' : 'No');
    console.log('- Session created:', data.session ? 'Yes' : 'No');
    
    if (data.user) {
      console.log('- User ID:', data.user.id);
      console.log('- Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
      
      if (!data.user.email_confirmed_at) {
        console.log('');
        console.log('✅ SUCCESS! User created, email verification required');
        console.log('📧 This means:');
        console.log('   - Signup is working');
        console.log('   - SMTP is configured (verification email sent)');
        console.log('   - Email verification flow is active');
        console.log('');
        console.log('🎯 Next step: Check your email for verification link');
        console.log('   The link should be: tailtracker://auth/verify?...');
        
        // Test resend functionality
        console.log('');
        console.log('Testing resend verification...');
        const { data: resendData, error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: testEmail,
          options: {
            emailRedirectTo: 'tailtracker://auth/verify'
          }
        });
        
        if (resendError) {
          console.log('❌ Resend failed:', resendError.message);
        } else {
          console.log('✅ Resend successful - another email sent');
        }
        
      } else {
        console.log('⚠️  Email was auto-confirmed (check Supabase settings)');
      }
    } else if (error) {
      console.log('❌ Signup failed:', error.message);
      
      if (error.status === 504) {
        console.log('');
        console.log('🔍 504 Timeout Analysis:');
        console.log('This usually means:');
        console.log('1. SMTP server is responding slowly');
        console.log('2. User might still be created (check manually)');
        console.log('3. Email might still be sent (just delayed)');
        console.log('');
        console.log('For production: Handle 504s as "check your email"');
      }
    } else {
      console.log('❌ No user created and no error - unexpected');
    }
    
  } catch (err) {
    console.error('❌ Exception during signup:', err.message);
  }
  
  console.log('');
  console.log('📋 Email Verification Checklist:');
  console.log('================================');
  console.log('☐ User signup working: Check above results');
  console.log('☐ SMTP configured: Check for verification email');
  console.log('☐ Email received: Check inbox/spam');
  console.log('☐ Link format: Should be tailtracker://auth/verify?...');
  console.log('☐ Mobile deep link: Test in app');
  console.log('');
  console.log('If all above work: Email verification is fully functional! ✨');
}

finalTest().catch(console.error);