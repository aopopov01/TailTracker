import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';

interface AuthNavigatorProps {
  onAuthSuccess?: () => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess }) => {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register'>('login');

  const navigateToLogin = () => setCurrentScreen('login');
  const navigateToRegister = () => setCurrentScreen('register');

  return (
    <View style={styles.container}>
      {currentScreen === 'login' ? (
        <LoginScreen
          onNavigateToRegister={navigateToRegister}
          onLoginSuccess={onAuthSuccess}
        />
      ) : (
        <RegisterScreen
          onNavigateToLogin={navigateToLogin}
          onRegistrationSuccess={onAuthSuccess}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});