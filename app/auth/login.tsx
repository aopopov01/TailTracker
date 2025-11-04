import React from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '../../src/components/Auth/LoginScreen';

export default function LoginRoute() {
  const router = useRouter();

  return (
    <LoginScreen
      onNavigateToRegister={() => router.push('/auth/register' as any)}
      onNavigateToForgotPassword={() =>
        router.push('/auth/forgot-password' as any)
      }
      onLoginSuccess={() => router.push('/(tabs)/dashboard' as any)}
    />
  );
}
