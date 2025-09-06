import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { AndroidBiometricsService } from './AndroidBiometricsService';
import { iOSBiometricsService, BiometricAuthResult, KeychainOptions } from './iOSBiometricsService';

/**
 * Unified Biometric Authentication Service
 * 
 * Provides cross-platform biometric authentication with automatic
 * platform detection and fallback to appropriate native services.
 * 
 * Features:
 * - Cross-platform biometric authentication
 * - Secure credential storage
 * - Automatic platform detection
 * - Consistent API across iOS and Android
 * - Comprehensive error handling
 */
export class BiometricAuthService {
  private static instance: BiometricAuthService;
  private iosService: iOSBiometricsService;
  private androidService: AndroidBiometricsService;

  private constructor() {
    this.iosService = iOSBiometricsService.getInstance();
    this.androidService = AndroidBiometricsService.getInstance();
  }

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  /**
   * Get the appropriate platform service
   */
  private getPlatformService() {
    return Platform.OS === 'ios' ? this.iosService : this.androidService;
  }

  /**
   * Check if biometric authentication is available on this device
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      return await this.getPlatformService().isBiometricAvailable();
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get supported biometric authentication types
   */
  async getSupportedBiometrics(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await this.getPlatformService().getSupportedBiometrics();
    } catch (error) {
      console.error('Error getting supported biometrics:', error);
      return [];
    }
  }

  /**
   * Get human-readable biometric type name for UI display
   */
  async getBiometricTypeName(): Promise<string> {
    try {
      return await this.getPlatformService().getBiometricTypeName();
    } catch (error) {
      console.error('Error getting biometric type name:', error);
      return 'Biometric';
    }
  }

  /**
   * Authenticate user with biometrics
   * 
   * @param reason - Reason for authentication shown to user
   * @param fallbackTitle - Title for fallback authentication method
   * @returns Promise<BiometricAuthResult> - Authentication result
   */
  async authenticate(
    reason?: string,
    fallbackTitle?: string
  ): Promise<BiometricAuthResult> {
    try {
      // Platform-specific default messages
      const defaultReason = Platform.OS === 'ios' 
        ? 'Authenticate with Face ID or Touch ID'
        : 'Authenticate with fingerprint or face recognition';
      
      const defaultFallback = Platform.OS === 'ios'
        ? 'Use Passcode'
        : 'Use PIN';

      return await this.getPlatformService().authenticate(
        reason || defaultReason,
        fallbackTitle || defaultFallback
      );
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      };
    }
  }

  /**
   * Store user credentials with biometric protection
   * 
   * @param username - Username to store
   * @param password - Password to store
   * @param options - Platform-specific storage options
   * @returns Promise<boolean> - Success status
   */
  async storeCredentials(
    username: string,
    password: string,
    options?: KeychainOptions
  ): Promise<boolean> {
    try {
      if (!username || !password) {
        console.error('Username and password are required');
        return false;
      }

      return await this.getPlatformService().storeCredentials(
        username,
        password,
        options
      );
    } catch (error) {
      console.error('Error storing credentials:', error);
      return false;
    }
  }

  /**
   * Retrieve stored credentials with biometric authentication
   * 
   * @param options - Platform-specific retrieval options
   * @returns Promise<{username: string, password: string} | null>
   */
  async getCredentials(
    options?: KeychainOptions
  ): Promise<{ username: string; password: string } | null> {
    try {
      return await this.getPlatformService().getCredentials(options);
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return null;
    }
  }

  /**
   * Delete stored credentials
   * 
   * @param service - Service identifier for credentials
   * @returns Promise<boolean> - Success status
   */
  async deleteCredentials(service?: string): Promise<boolean> {
    try {
      return await this.getPlatformService().deleteCredentials(service);
    } catch (error) {
      console.error('Error deleting credentials:', error);
      return false;
    }
  }

  /**
   * Check if credentials are stored
   * 
   * @param service - Service identifier for credentials
   * @returns Promise<boolean> - Whether credentials exist
   */
  async hasCredentials(service?: string): Promise<boolean> {
    try {
      return await this.getPlatformService().hasCredentials(service);
    } catch (error) {
      console.error('Error checking credentials:', error);
      return false;
    }
  }

  /**
   * Store sensitive data with biometric protection
   * 
   * @param key - Storage key
   * @param data - Data to store
   * @param options - Platform-specific storage options
   * @returns Promise<boolean> - Success status
   */
  async storeSensitiveData(
    key: string,
    data: string,
    options?: KeychainOptions
  ): Promise<boolean> {
    try {
      if (!key || !data) {
        console.error('Key and data are required');
        return false;
      }

      return await this.getPlatformService().storeSensitiveData(
        key,
        data,
        options
      );
    } catch (error) {
      console.error('Error storing sensitive data:', error);
      return false;
    }
  }

  /**
   * Retrieve sensitive data with biometric authentication
   * 
   * @param key - Storage key
   * @param options - Platform-specific retrieval options
   * @returns Promise<string | null> - Retrieved data or null
   */
  async getSensitiveData(
    key: string,
    options?: KeychainOptions
  ): Promise<string | null> {
    try {
      if (!key) {
        console.error('Key is required');
        return null;
      }

      return await this.getPlatformService().getSensitiveData(key, options);
    } catch (error) {
      console.error('Error retrieving sensitive data:', error);
      return null;
    }
  }

  /**
   * Show biometric authentication prompt with custom UI
   * 
   * @param title - Authentication prompt title
   * @param subtitle - Authentication prompt subtitle
   * @param description - Authentication prompt description
   * @param fallbackTitle - Fallback authentication method title
   * @returns Promise<BiometricAuthResult> - Authentication result
   */
  async promptBiometric(
    title: string,
    subtitle?: string,
    description?: string,
    fallbackTitle?: string
  ): Promise<BiometricAuthResult> {
    try {
      return await this.getPlatformService().promptBiometric(
        title,
        subtitle,
        description,
        fallbackTitle
      );
    } catch (error) {
      console.error('Error showing biometric prompt:', error);
      return {
        success: false,
        error: 'Authentication prompt failed',
      };
    }
  }

  /**
   * Enable biometric authentication for the application
   * 
   * @returns Promise<boolean> - Success status
   */
  async enableBiometricAuth(): Promise<boolean> {
    try {
      return await this.getPlatformService().enableBiometricAuth();
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      return false;
    }
  }

  /**
   * Get comprehensive biometric authentication settings
   * 
   * @returns Promise<BiometricSettings> - Current biometric settings
   */
  async getBiometricSettings(): Promise<{
    isAvailable: boolean;
    isEnabled: boolean;
    biometricType: string;
    supportedTypes: LocalAuthentication.AuthenticationType[];
    platform: 'ios' | 'android';
  }> {
    try {
      const platformSettings = await this.getPlatformService().getBiometricSettings();
      
      return {
        ...platformSettings,
        platform: Platform.OS as 'ios' | 'android',
      };
    } catch (error) {
      console.error('Error getting biometric settings:', error);
      return {
        isAvailable: false,
        isEnabled: false,
        biometricType: 'Biometric',
        supportedTypes: [],
        platform: Platform.OS as 'ios' | 'android',
      };
    }
  }

  /**
   * Quick biometric authentication for app access
   * 
   * @param allowFallback - Allow device passcode fallback
   * @returns Promise<boolean> - Authentication success
   */
  async quickAuth(allowFallback: boolean = true): Promise<boolean> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      
      if (!isAvailable) {
        return false;
      }

      const biometricType = await this.getBiometricTypeName();
      const result = await this.authenticate(
        `Use ${biometricType} to unlock TailTracker`,
        allowFallback ? undefined : 'Cancel'
      );

      return result.success;
    } catch (error) {
      console.error('Error during quick auth:', error);
      return false;
    }
  }

  /**
   * Validate biometric authentication setup
   * 
   * @returns Promise<{valid: boolean, issues: string[]}> - Validation result
   */
  async validateSetup(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check hardware availability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        issues.push('Biometric hardware not available on this device');
      }

      // Check enrollment
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        issues.push('No biometric credentials enrolled on this device');
      }

      // Check supported types
      const supportedTypes = await this.getSupportedBiometrics();
      if (supportedTypes.length === 0) {
        issues.push('No supported biometric authentication types found');
      }

      // Platform-specific checks
      if (Platform.OS === 'ios') {
        // iOS-specific validation
        const settings = await this.iosService.getBiometricSettings();
        if (!settings.isAvailable) {
          issues.push('iOS biometric authentication is not properly configured');
        }
      } else if (Platform.OS === 'android') {
        // Android-specific validation
        const settings = await this.androidService.getBiometricSettings();
        if (!settings.isAvailable) {
          issues.push('Android biometric authentication is not properly configured');
        }
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      console.error('Error validating biometric setup:', error);
      return {
        valid: false,
        issues: ['Failed to validate biometric authentication setup'],
      };
    }
  }
}

// Export singleton instance for convenience
export const biometricAuthService = BiometricAuthService.getInstance();

// Export types for external use
export { BiometricAuthResult, KeychainOptions };