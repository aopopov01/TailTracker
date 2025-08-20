import { Platform, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Keychain from 'react-native-keychain';

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

export class iOSBiometricsService {
  private static instance: iOSBiometricsService;
  private readonly DEFAULT_SERVICE = 'TailTracker';
  private readonly DEFAULT_ACCESS_GROUP = 'group.com.tailtracker.app';

  private constructor() {}

  static getInstance(): iOSBiometricsService {
    if (!iOSBiometricsService.instance) {
      iOSBiometricsService.instance = new iOSBiometricsService();
    }
    return iOSBiometricsService.instance;
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
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
    if (Platform.OS !== 'ios') {
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
      return 'Face ID';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
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
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: 'Biometric authentication is only available on iOS',
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
        fallbackLabel: fallbackTitle || 'Use Passcode',
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
   * Store credentials in keychain with biometric protection
   */
  async storeCredentials(
    username: string,
    password: string,
    options: KeychainOptions = {}
  ): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.warn('Keychain storage is optimized for iOS');
      return false;
    }

    try {
      const keychainOptions: Keychain.Options = {
        service: options.service || this.DEFAULT_SERVICE,
        accessGroup: options.accessGroup || this.DEFAULT_ACCESS_GROUP,
        accessControl: options.accessControl || 'BiometryAny',
        authenticatePrompt: options.authenticatePrompt || 'Authenticate to save your credentials',
        storage: Keychain.STORAGE_TYPE.KC,
      };

      await Keychain.setInternetCredentials(
        keychainOptions.service!,
        username,
        password,
        keychainOptions
      );

      return true;
    } catch (error) {
      console.error('Error storing credentials:', error);
      return false;
    }
  }

  /**
   * Retrieve credentials from keychain with biometric authentication
   */
  async getCredentials(
    options: KeychainOptions = {}
  ): Promise<{ username: string; password: string } | null> {
    if (Platform.OS !== 'ios') {
      console.warn('Keychain storage is optimized for iOS');
      return null;
    }

    try {
      const keychainOptions: Keychain.Options = {
        service: options.service || this.DEFAULT_SERVICE,
        accessGroup: options.accessGroup || this.DEFAULT_ACCESS_GROUP,
        authenticatePrompt: options.authenticatePrompt || 'Authenticate to access your credentials',
        storage: Keychain.STORAGE_TYPE.KC,
      };

      const credentials = await Keychain.getInternetCredentials(
        keychainOptions.service!,
        keychainOptions
      );

      if (credentials && credentials.password) {
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }

      return null;
    } catch (error) {
      if (error.message === 'UserCancel') {
        console.log('User cancelled biometric authentication');
        return null;
      }
      
      console.error('Error retrieving credentials:', error);
      return null;
    }
  }

  /**
   * Delete credentials from keychain
   */
  async deleteCredentials(service?: string): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      await Keychain.resetInternetCredentials(service || this.DEFAULT_SERVICE);
      return true;
    } catch (error) {
      console.error('Error deleting credentials:', error);
      return false;
    }
  }

  /**
   * Check if credentials exist in keychain
   */
  async hasCredentials(service?: string): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      const credentials = await Keychain.getInternetCredentials(service || this.DEFAULT_SERVICE);
      return credentials !== false;
    } catch (error) {
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
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      const keychainOptions: Keychain.Options = {
        service: options.service || this.DEFAULT_SERVICE,
        accessGroup: options.accessGroup || this.DEFAULT_ACCESS_GROUP,
        accessControl: options.accessControl || 'BiometryAny',
        authenticatePrompt: options.authenticatePrompt || 'Authenticate to save data',
        storage: Keychain.STORAGE_TYPE.KC,
      };

      await Keychain.setInternetCredentials(
        key,
        'data',
        data,
        keychainOptions
      );

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
    if (Platform.OS !== 'ios') {
      return null;
    }

    try {
      const keychainOptions: Keychain.Options = {
        service: options.service || this.DEFAULT_SERVICE,
        accessGroup: options.accessGroup || this.DEFAULT_ACCESS_GROUP,
        authenticatePrompt: options.authenticatePrompt || 'Authenticate to access data',
        storage: Keychain.STORAGE_TYPE.KC,
      };

      const result = await Keychain.getInternetCredentials(key, keychainOptions);
      
      if (result && result.password) {
        return result.password;
      }

      return null;
    } catch (error) {
      if (error.message === 'UserCancel') {
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
      
      Alert.alert(
        'Biometric Authentication Unavailable',
        `${biometricType} is not set up on this device. Please set it up in Settings to use this feature.`,
        [{ text: 'OK' }]
      );
      
      return false;
    }

    const result = await this.authenticate(
      'Enable biometric authentication for TailTracker',
      'Use Passcode'
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