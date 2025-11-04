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
  ActivityIndicator,
} from 'react-native';
import { AuthService } from '../../services/authService';
import { useTailTrackerModal } from '../../hooks/useTailTrackerModal';
import { CryptoService } from '../../services/cryptoService';
import { TailTrackerModal } from '../UI/TailTrackerModal';

interface ForgotPasswordScreenProps {
  onNavigateBack: () => void;
  onNavigateToLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onNavigateBack,
  onNavigateToLogin,
}) => {
  const { modalConfig, showSuccess, showError } = useTailTrackerModal();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [resetSent, setResetSent] = useState(false);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!email.trim()) {
      errors.push('Email is required');
    } else if (!CryptoService.validateEmail(email)) {
      errors.push('Please enter a valid email address');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.resetPassword(email.trim());

      if (result.success) {
        setResetSent(true);
        showSuccess(
          'Reset Email Sent',
          `We've sent password reset instructions to ${email}. Please check your email and follow the link to reset your password.`,
          'mail'
        );
      } else {
        showError(
          'Reset Failed',
          result.error ||
            'Unable to send reset email. Please check your email address and try again.',
          'alert-circle'
        );
      }
    } catch {
      showError(
        'Error',
        'An unexpected error occurred. Please try again.',
        'alert-circle'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleBackToLogin = () => {
    if (resetSent) {
      showSuccess(
        'Check Your Email',
        "Don't forget to check your email for the password reset link!",
        'mail'
      );
    }
    onNavigateToLogin();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {resetSent
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive reset instructions'}
          </Text>
        </View>

        {!resetSent ? (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  validationErrors.length > 0 && styles.inputError,
                ]}
                value={email}
                onChangeText={handleEmailChange}
                placeholder='Enter your email address'
                placeholderTextColor='#999'
                keyboardType='email-address'
                autoCapitalize='none'
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {validationErrors.length > 0 && (
              <View style={styles.errorContainer}>
                {validationErrors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.resetButton,
                isLoading && styles.resetButtonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color='#fff' />
              ) : (
                <Text style={styles.resetButtonText}>Send Reset Email</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity
                onPress={handleBackToLogin}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.linkText,
                    isLoading && styles.linkTextDisabled,
                  ]}
                >
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.successEmoji}>📧</Text>
            </View>
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successMessage}>
              We've sent password reset instructions to:
            </Text>
            <Text style={styles.emailDisplay}>{email}</Text>
            <Text style={styles.successInstructions}>
              Check your email (including spam folder) and click the reset link
              to create a new password.
            </Text>

            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <Text style={styles.backButtonText}>Back to Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setResetSent(false);
                setEmail('');
              }}
            >
              <Text style={styles.resendButtonText}>
                Send to Different Email
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingHorizontal: 20,
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
  resetButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonDisabled: {
    backgroundColor: '#ccc',
  },
  resetButtonText: {
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
  successContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIcon: {
    marginBottom: 20,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
    marginBottom: 16,
  },
  successInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
