import React from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '../../src/components/Auth/LoginScreen';

export default function LoginRoute() {
  const router = useRouter();
  
  return (
    <LoginScreen 
      onNavigateToRegister={() => router.push('/auth/register')}
      onLoginSuccess={() => router.push('/(tabs)/dashboard')}
    />
  );
}