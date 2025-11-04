import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { modalService } from '../../src/services/modalService';

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        console.log('🔍 Verification params received:', params);
        console.log('🔍 All available params:', Object.keys(params));

        // Extract tokens from URL parameters - handle different possible formats
        let accessToken = params.access_token as string;
        let refreshToken = params.refresh_token as string;

        // Also check for alternative parameter formats
        if (!accessToken) {
          accessToken =
            (params['access-token'] as string) || (params.token as string);
        }
        if (!refreshToken) {
          refreshToken = params['refresh-token'] as string;
        }

        // Check for confirmation token (some Supabase setups use this)
        const confirmationToken =
          (params.token as string) || (params.confirmation_token as string);

        console.log('🔑 Tokens found:', {
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          confirmationToken: confirmationToken ? 'present' : 'missing',
        });

        // Handle confirmation token flow (alternative to access/refresh tokens)
        if (confirmationToken && !accessToken) {
          console.log('📧 Using confirmation token flow');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: confirmationToken,
            type: 'signup',
          });

          if (error) {
            console.error('Confirmation token verification failed:', error);
            modalService.showError(
              'Verification Failed',
              error.message || 'Invalid verification link. Please try again.'
            );
            router.replace('/auth/login');
            return;
          }

          if (data.user && data.user.email_confirmed_at) {
            console.log(
              '✅ Email verification successful via confirmation token'
            );
            modalService.showSuccess(
              'Email Verified!',
              'Your email has been successfully verified. You can now use all features of TailTracker.',
              'checkmark-circle'
            );

            // Navigate to the main app
            router.replace('/(tabs)' as any);
            return;
          }
        }

        // Handle access/refresh token flow
        if (!accessToken || !refreshToken) {
          console.error(
            'Missing verification tokens - all params:',
            Object.keys(params)
          );
          modalService.showError(
            'Verification Failed',
            'Invalid verification link. Please try again or request a new verification email.'
          );
          router.replace('/auth/login');
          return;
        }

        console.log('🔐 Using access/refresh token flow');
        // Set the session with the tokens from the email link
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Verification error:', error);
          modalService.showError(
            'Verification Failed',
            error.message || 'Failed to verify your email. Please try again.'
          );
          router.replace('/auth/login');
          return;
        }

        if (data.user && data.user.email_confirmed_at) {
          console.log('✅ Email verification successful');
          modalService.showSuccess(
            'Email Verified!',
            'Your email has been successfully verified. You can now use all features of TailTracker.',
            'checkmark-circle'
          );

          // Navigate to the main app
          router.replace('/(tabs)' as any);
        } else {
          console.error('User not confirmed after verification');
          modalService.showError(
            'Verification Incomplete',
            'Email verification was not completed. Please try again.'
          );
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Unexpected error during verification:', error);
        modalService.showError(
          'Verification Error',
          'An unexpected error occurred. Please try again.'
        );
        router.replace('/auth/login');
      } finally {
        setIsVerifying(false);
      }
    };

    // Add a small delay to ensure params are properly loaded
    const timer = setTimeout(handleEmailVerification, 500);
    return () => clearTimeout(timer);
  }, [params, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size='large' color='#007AFF' />
      <Text style={styles.text}>
        {isVerifying ? 'Verifying your email...' : 'Redirecting...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
