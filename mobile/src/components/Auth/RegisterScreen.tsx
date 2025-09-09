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
import { useTailTrackerModal } from '../../hooks/useTailTrackerModal';
import { CryptoService } from '../../services/cryptoService';
import { TailTrackerModal } from '../UI/TailTrackerModal';
import { modalService } from '../../services/modalService';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onRegistrationSuccess?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ 
  onNavigateToLogin,
  onRegistrationSuccess 
}) => {
  const { modalConfig, hideModal, showError } = useTailTrackerModal();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);


  const { register, isLoading, error, clearError } = useAuth();

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Name validation
    if (!formData.firstName.trim()) {
      errors.push('First name is required');
    }

    if (!formData.lastName.trim()) {
      errors.push('Last name is required');
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!CryptoService.validateEmail(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    // Password validation
    const passwordValidation = CryptoService.validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Confirm password validation
    if (!formData.confirmPassword.trim()) {
      errors.push('Please confirm your password');
    } else if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleRegister = async () => {
    clearError();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (result.success) {
        // Registration successful - user will receive Supabase email verification
        modalService.showSuccess(
          'Registration Successful!',
          'Please check your email and click the verification link to complete your registration.',
          'mail-outline'
        );
        
        // Clear form after successful registration
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        if (onRegistrationSuccess) {
          onRegistrationSuccess();
        }
      } else {
        showError(
          'Registration Failed',
          result.error || 'Unable to create account. Please try again.',
          'alert-circle'
        );
      }
    } catch {
      showError(
        'Error',
        'An unexpected error occurred. Please try again.',
        'alert-circle'
      );
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (text: string) => {
    setFormData(prev => ({ ...prev, [field]: text }));
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    if (error) {
      clearError();
    }
  };

  const renderPasswordStrength = () => {
    if (!formData.password) return null;

    const validation = CryptoService.validatePasswordStrength(formData.password);
    const strength = validation.isValid ? 'Strong' : 'Weak';
    const strengthColor = validation.isValid ? '#28a745' : '#dc3545';

    return (
      <View style={styles.passwordStrength}>
        <Text style={[styles.strengthText, { color: strengthColor }]}>
          Password Strength: {strength}
        </Text>
        {!validation.isValid && (
          <View style={styles.strengthRequirements}>
            {validation.errors.map((error, index) => (
              <Text key={index} style={styles.requirementText}>• {error}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };





  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join TailTracker to manage your pet profiles</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.nameInput]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={[styles.input, validationErrors.length > 0 && styles.inputError]}
                value={formData.firstName}
                onChangeText={handleInputChange('firstName')}
                placeholder="First name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputContainer, styles.nameInput]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={[styles.input, validationErrors.length > 0 && styles.inputError]}
                value={formData.lastName}
                onChangeText={handleInputChange('lastName')}
                placeholder="Last name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, validationErrors.length > 0 && styles.inputError]}
              value={formData.email}
              onChangeText={handleInputChange('email')}
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
                value={formData.password}
                onChangeText={handleInputChange('password')}
                placeholder="Create a password"
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
            {renderPasswordStrength()}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, validationErrors.length > 0 && styles.inputError]}
                value={formData.confirmPassword}
                onChangeText={handleInputChange('confirmPassword')}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <Text style={styles.eyeText}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
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
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
              <Text style={[styles.linkText, isLoading && styles.linkTextDisabled]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={modalConfig.actions?.[0]?.onPress || hideModal}
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
    marginBottom: 30,
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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    flex: 1,
    marginRight: 10,
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
  passwordStrength: {
    marginTop: 8,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  strengthRequirements: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 1,
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
  registerButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
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

export default RegisterScreen;