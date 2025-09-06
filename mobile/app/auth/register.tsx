import React from 'react';
import { useRouter } from 'expo-router';
import RegisterScreen from '../../src/components/Auth/RegisterScreen';

export default function RegisterRoute() {
  const router = useRouter();
  
  return (
    <RegisterScreen 
      onNavigateToLogin={() => router.push('/auth/login' as any)}
      onRegistrationSuccess={() => router.push('/onboarding/welcome' as any)}
    />
  );
}