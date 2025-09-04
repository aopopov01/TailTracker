import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { modalService } from '../utils/modalService';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometryType?: 'TouchID' | 'FaceID' | 'Optic' | 'Fingerprint' | 'Face' | 'Iris';
  warning?: string;
}

export interface KeychainOptions {
  service?: string;
  accessGroup?: string;
  accessControl?: 'BiometryAny' | 'BiometryCurrentSet' | 'BiometryTouchID' | 'BiometryFaceID';
  authenticatePrompt?: string;
}

export class AndroidBiometricsService {
  private static instance: AndroidBiometricsService;
  private readonly DEFAULT_SERVICE = 'TailTracker';
  private readonly SECURE_STORE_OPTIONS = {
    requireAuthentication: true,
    authenticationPrompt: 'Authenticate to access TailTracker',
  };

  private constructor() {}

  static getInstance(): AndroidBiometricsService {
    if (!AndroidBiometricsService.instance) {
      AndroidBiometricsService.instance = new AndroidBiometricsService();
    }
    return AndroidBiometricsService.instance;
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get supported biometric types
   */
  async getSupportedBiometrics(): Promise<LocalAuthentication.AuthenticationType[]> {
    if (Platform.OS !== 'android') {
      return [];
    }

    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Error getting supported biometrics:', error);
      return [];
    }
  }

  /**
   * Get biometric type name for display
   */
  async getBiometricTypeName(): Promise<string> {
    const supportedTypes = await this.getSupportedBiometrics();
    
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face Recognition';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    } else {
      return 'Biometric';
    }
  }

  /**
   * Authenticate with biometrics
   */
  async authenticate(
    reason: string = 'Authenticate to access TailTracker',
    fallbackTitle?: string
  ): Promise<BiometricAuthResult> {
    if (Platform.OS !== 'android') {
      return {
        success: false,
        error: 'Biometric authentication is only available on Android',
      };
    }

    try {
      const isAvailable = await this.isBiometricAvailable();
      
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: fallbackTitle || 'Use PIN',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        const biometricType = await this.getBiometricTypeName();
        return {
          success: true,
          biometryType: biometricType as any,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: 'Authentication error occurred',
      };
    }
  }

  /**
   * Store credentials in secure store with biometric protection
   */
  async storeCredentials(
    username: string,
    password: string,
    options: KeychainOptions = {}
  ): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('Secure storage is optimized for Android');
      return false;
    }

    try {
      const service = options.service || this.DEFAULT_SERVICE;
      const credentialsKey = `${service}_credentials`;
      const credentials = JSON.stringify({ username, password });

      const storeOptions = {
        ...this.SECURE_STORE_OPTIONS,
        authenticationPrompt: options.authenticatePrompt || 'Authenticate to save your credentials',
      };

      await SecureStore.setItemAsync(credentialsKey, credentials, storeOptions);
      return true;
    } catch (error) {
      console.error('Error storing credentials:', error);
      return false;
    }
  }

  /**
   * Retrieve credentials from secure store with biometric authentication
   */
  async getCredentials(
    options: KeychainOptions = {}
  ): Promise<{ username: string; password: string } | null> {
    if (Platform.OS !== 'android') {
      console.warn('Secure storage is optimized for Android');
      return null;
    }

    try {
      const service = options.service || this.DEFAULT_SERVICE;
      const credentialsKey = `${service}_credentials`;

      const storeOptions = {
        ...this.SECURE_STORE_OPTIONS,
        authenticationPrompt: options.authenticatePrompt || 'Authenticate to access your credentials',
      };

      const credentialsJson = await SecureStore.getItemAsync(credentialsKey, storeOptions);
      
      if (credentialsJson) {
        const credentials = JSON.parse(credentialsJson);
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }

      return null;
    } catch (error) {
      if (error.message.includes('UserCancel') || error.message.includes('Authentication was canceled')) {
        console.log('User cancelled biometric authentication');
        return null;
      }
      
      console.error('Error retrieving credentials:', error);
      return null;
    }
  }

  /**
   * Delete credentials from secure store
   */
  async deleteCredentials(service?: string): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const serviceKey = service || this.DEFAULT_SERVICE;
      const credentialsKey = `${serviceKey}_credentials`;
      
      await SecureStore.deleteItemAsync(credentialsKey);
      return true;
    } catch (error) {
      console.error('Error deleting credentials:', error);
      return false;
    }
  }

  /**
   * Check if credentials exist in secure store
   */
  async hasCredentials(service?: string): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const serviceKey = service || this.DEFAULT_SERVICE;
      const credentialsKey = `${serviceKey}_credentials`;
      
      const credentials = await SecureStore.getItemAsync(credentialsKey);
      return credentials !== null;
    } catch (error) {
      // If we can't access without authentication, assume they exist
      if (error.message.includes('requireAuthentication')) {
        return true;
      }
      
      console.error('Error checking credentials:', error);
      return false;
    }
  }

  /**
   * Store sensitive data with biometric protection
   */
  async storeSensitiveData(
    key: string,
    data: string,
    options: KeychainOptions = {}
  ): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const storeOptions = {
        ...this.SECURE_STORE_OPTIONS,
        authenticationPrompt: options.authenticatePrompt || 'Authenticate to save data',
      };

      await SecureStore.setItemAsync(key, data, storeOptions);
      return true;
    } catch (error) {
      console.error('Error storing sensitive data:', error);
      return false;
    }
  }

  /**
   * Retrieve sensitive data with biometric authentication
   */
  async getSensitiveData(
    key: string,
    options: KeychainOptions = {}
  ): Promise<string | null> {
    if (Platform.OS !== 'android') {
      return null;
    }

    try {
      const storeOptions = {
        ...this.SECURE_STORE_OPTIONS,
        authenticationPrompt: options.authenticatePrompt || 'Authenticate to access data',
      };

      const data = await SecureStore.getItemAsync(key, storeOptions);
      return data;
    } catch (error) {
      if (error.message.includes('UserCancel') || error.message.includes('Authentication was canceled')) {
        console.log('User cancelled biometric authentication');
        return null;
      }
      
      console.error('Error retrieving sensitive data:', error);
      return null;
    }
  }

  /**
   * Show biometric prompt with custom options
   */
  async promptBiometric(
    title: string,
    subtitle?: string,
    description?: string,
    fallbackTitle?: string
  ): Promise<BiometricAuthResult> {
    const biometricType = await this.getBiometricTypeName();
    
    const message = title || `Use ${biometricType} to authenticate`;
    
    return this.authenticate(message, fallbackTitle);
  }

  /**
   * Enable biometric authentication for the app
   */
  async enableBiometricAuth(): Promise<boolean> {
    const isAvailable = await this.isBiometricAvailable();
    
    if (!isAvailable) {
      const biometricType = await this.getBiometricTypeName();
      
      modalService.showModal({
        title: 'Biometric Authentication Unavailable',
        message: `${biometricType} is not set up on this device. Please set it up in Settings to use this feature.`,
        type: 'warning',
        icon: 'finger-print-outline',
        actions: [{ text: 'OK', style: 'primary', onPress: () => {} }]
      });
      
      return false;
    }

    const result = await this.authenticate(
      'Enable biometric authentication for TailTracker',
      'Use PIN'
    );

    return result.success;
  }

  /**
   * Get biometric authentication settings
   */
  async getBiometricSettings(): Promise<{
    isAvailable: boolean;
    isEnabled: boolean;
    biometricType: string;
    supportedTypes: LocalAuthentication.AuthenticationType[];
  }> {
    const isAvailable = await this.isBiometricAvailable();
    const hasCredentials = await this.hasCredentials();
    const biometricType = await this.getBiometricTypeName();
    const supportedTypes = await this.getSupportedBiometrics();

    return {
      isAvailable,
      isEnabled: hasCredentials,
      biometricType,
      supportedTypes,
    };
  }
}