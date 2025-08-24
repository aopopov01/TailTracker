import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { CryptoService } from '../../services/cryptoService';
import { useTailTrackerModal } from '../../hooks/useTailTrackerModal';
import { TailTrackerModal } from '../UI/TailTrackerModal';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onNavigateToRegister,
  onLoginSuccess 
}) => {
  const { modalConfig, showError } = useTailTrackerModal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { login, isLoading, error, clearError } = useAuth();

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!email.trim()) {
      errors.push('Email is required');
    } else if (!CryptoService.validateEmail(email)) {
      errors.push('Please enter a valid email address');
    }

    if (!password.trim()) {
      errors.push('Password is required');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleLogin = async () => {
    clearError();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await login({
        email: email.trim(),
        password
      });

      if (result.success) {
        onLoginSuccess?.();
      } else {
        showError(
          'Login Failed',
          result.error || 'Unable to log in. Please check your credentials and try again.',
          'alert-circle'
        );
      }
    } catch (error) {
      showError(
        'Error',
        'An unexpected error occurred. Please try again.',
        'alert-circle'
      );
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    if (error) {
      clearError();
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    if (error) {
      clearError();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to access your pet profiles</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, validationErrors.length > 0 && styles.inputError]}
              value={email}
              onChangeText={handleEmailChange}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, validationErrors.length > 0 && styles.inputError]}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {(validationErrors.length > 0 || error) && (
            <View style={styles.errorContainer}>
              {validationErrors.map((error, index) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
              {error && <Text style={styles.errorText}>• {error}</Text>}
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToRegister} disabled={isLoading}>
              <Text style={[styles.linkText, isLoading && styles.linkTextDisabled]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={modalConfig.actions?.[0]?.onPress || (() => {})}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        actions={modalConfig.actions}
        icon={modalConfig.icon}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  eyeText: {
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  errorText: {
    color: '#cc0000',
    fontSize: 14,
    marginVertical: 2,
  },
  loginButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  linkText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  linkTextDisabled: {
    color: '#ccc',
  },
});

export default LoginScreen;