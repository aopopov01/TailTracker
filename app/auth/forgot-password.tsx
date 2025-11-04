import React from 'react';
import { useRouter } from 'expo-router';
import ForgotPasswordScreen from '../../src/components/Auth/ForgotPasswordScreen';

export default function ForgotPasswordRoute() {
  const router = useRouter();

  return (
    <ForgotPasswordScreen
      onNavigateBack={() => router.back()}
      onNavigateToLogin={() => router.push('/auth/login' as any)}
    />
  );
}
