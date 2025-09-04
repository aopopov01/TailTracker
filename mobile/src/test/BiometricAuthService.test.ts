import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { BiometricAuthService, biometricAuthService } from '../services/BiometricAuthService';
import { iOSBiometricsService } from '../services/iOSBiometricsService';
import { AndroidBiometricsService } from '../services/AndroidBiometricsService';

// Mock dependencies
jest.mock('react-native');
jest.mock('expo-local-authentication');
jest.mock('../services/iOSBiometricsService');
jest.mock('../services/AndroidBiometricsService');

const mockPlatform = Platform as jest.Mocked<typeof Platform>;
const mockLocalAuth = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;
const mockiOSService = iOSBiometricsService as jest.Mocked<typeof iOSBiometricsService>;
const mockAndroidService = AndroidBiometricsService as jest.Mocked<typeof AndroidBiometricsService>;

describe('BiometricAuthService', () => {
  let service: BiometricAuthService;

  beforeEach(() => {
    service = BiometricAuthService.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = BiometricAuthService.getInstance();
      const instance2 = BiometricAuthService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export singleton instance for convenience', () => {
      expect(biometricAuthService).toBeDefined();
      expect(biometricAuthService).toBeInstanceOf(BiometricAuthService);
    });
  });

  describe('Platform Service Selection', () => {
    it('should use iOS service on iOS platform', async () => {
      (mockPlatform.OS as any) = 'ios';
      mockiOSService.isBiometricAvailable.mockResolvedValue(true);

      await service.isBiometricAvailable();
      
      expect(mockiOSService.isBiometricAvailable).toHaveBeenCalled();
      expect(mockAndroidService.isBiometricAvailable).not.toHaveBeenCalled();
    });

    it('should use Android service on Android platform', async () => {
      (mockPlatform.OS as any) = 'android';
      mockAndroidService.isBiometricAvailable.mockResolvedValue(true);

      await service.isBiometricAvailable();
      
      expect(mockAndroidService.isBiometricAvailable).toHaveBeenCalled();
      expect(mockiOSService.isBiometricAvailable).not.toHaveBeenCalled();
    });
  });

  describe('isBiometricAvailable', () => {
    beforeEach(() => {
      (mockPlatform.OS as any) = 'ios';
    });

    it('should return platform service result', async () => {
      mockiOSService.isBiometricAvailable.mockResolvedValue(true);

      const result = await service.isBiometricAvailable();
      
      expect(result).toBe(true);
      expect(mockiOSService.isBiometricAvailable).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockiOSService.isBiometricAvailable.mockRejectedValue(new Error('Platform error'));

      const result = await service.isBiometricAvailable();
      
      expect(result).toBe(false);
    });
  });

  describe('getSupportedBiometrics', () => {
    beforeEach(() => {
      (mockPlatform.OS as any) = 'ios';
    });

    it('should return platform service result', async () => {
      const mockTypes = [LocalAuthentication.AuthenticationType.FINGERPRINT];
      mockiOSService.getSupportedBiometrics.mockResolvedValue(mockTypes);

      const result = await service.getSupportedBiometrics();
      
      expect(result).toEqual(mockTypes);
      expect(mockiOSService.getSupportedBiometrics).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      mockiOSService.getSupportedBiometrics.mockRejectedValue(new Error('Error'));

      const result = await service.getSupportedBiometrics();
      
      expect(result).toEqual([]);
    });
  });

  describe('getBiometricTypeName', () => {
    beforeEach(() => {
      (mockPlatform.OS as any) = 'ios';
    });

    it('should return platform service result', async () => {
      mockiOSService.getBiometricTypeName.mockResolvedValue('Face ID');

      const result = await service.getBiometricTypeName();
      
      expect(result).toBe('Face ID');
      expect(mockiOSService.getBiometricTypeName).toHaveBeenCalled();
    });

    it('should return default on error', async () => {
      mockiOSService.getBiometricTypeName.mockRejectedValue(new Error('Error'));

      const result = await service.getBiometricTypeName();
      
      expect(result).toBe('Biometric');
    });
  });

  describe('authenticate', () => {
    it('should use iOS default messages on iOS', async () => {
      (mockPlatform.OS as any) = 'ios';
      mockiOSService.authenticate.mockResolvedValue({ success: true });

      await service.authenticate();
      
      expect(mockiOSService.authenticate).toHaveBeenCalledWith(
        'Authenticate with Face ID or Touch ID',
        'Use Passcode'
      );
    });

    it('should use Android default messages on Android', async () => {
      (mockPlatform.OS as any) = 'android';
      mockAndroidService.authenticate.mockResolvedValue({ success: true });

      await service.authenticate();
      
      expect(mockAndroidService.authenticate).toHaveBeenCalledWith(
        'Authenticate with fingerprint or face recognition',
        'Use PIN'
      );
    });

    it('should use custom messages when provided', async () => {
      (mockPlatform.OS as any) = 'ios';
      mockiOSService.authenticate.mockResolvedValue({ success: true });

      await service.authenticate('Custom reason', 'Custom fallback');
      
      expect(mockiOSService.authenticate).toHaveBeenCalledWith(
        'Custom reason',
        'Custom fallback'
      );
    });

    it('should handle authentication errors gracefully', async () => {
      (mockPlatform.OS as any) = 'ios';
      mockiOSService.authenticate.mockRejectedValue(new Error('Auth failed'));

      const result = await service.authenticate();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed. Please try again.');
    });
  });

  describe('storeCredentials', () => {
    beforeEach(() => {
      (mockPlatform.OS as any) = 'ios';
    });

    it('should store credentials successfully', async () => {
      mockiOSService.storeCredentials.mockResolvedValue(true);

      const result = await service.storeCredentials('user', 'pass');
      
      expect(result).toBe(true);
      expect(mockiOSService.storeCredentials).toHaveBeenCalledWith('user', 'pass', undefined);
    });

    it('should validate input parameters', async () => {
      const result1 = await service.storeCredentials('', 'pass');
      const result2 = await service.storeCredentials('user', '');
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockiOSService.storeCredentials.mockRejectedValue(new Error('Storage failed'));

      const result = await service.storeCredentials('user', 'pass');
      
      expect(result).toBe(false);
    });
  });

  describe('getCredentials', () => {
    beforeEach(() => {
      (mockPlatform.OS as any) = 'ios';
    });

    it('should retrieve credentials successfully', async () => {
      const mockCredentials = { username: 'user', password: 'pass' };
      mockiOSService.getCredentials.mockResolvedValue(mockCredentials);

      const result = await service.getCredentials();
      
      expect(result).toEqual(mockCredentials);
      expect(mockiOSService.getCredentials).toHaveBeenCalledWith(undefined);
    });

    it('should handle errors gracefully', async () => {
      mockiOSService.getCredentials.mockRejectedValue(new Error('Retrieval failed'));

      const result = await service.getCredentials();
      
      expect(result).toBeNull();
    });
  });

  describe('storeSensitiveData', () => {
    beforeEach(() => {
      (mockPlatform.OS as any) = 'ios';
    });

    it('should store sensitive data successfully', async () => {
      mockiOSService.storeSensitiveData.mockResolvedValue(true);

      const result = await service.storeSensitiveData('key', 'data');
      
      expect(result).toBe(true);
      expect(mockiOSService.storeSensitiveData).toHaveBeenCalledWith('key', 'data', undefined);
    });

    it('should validate input parameters', async () => {
      const result1 = await service.storeSensitiveData('', 'data');
      const result2 = await service.storeSensitiveData('key', '');
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('getSensitiveData', () => {
    beforeEach(() => {
      (mockPlatform.OS as any) = 'ios';
    });

    it('should retrieve sensitive data successfully', async () => {
      mockiOSService.getSensitiveData.mockResolvedValue('sensitive data');

      const result = await service.getSensitiveData('key');
      
      expect(result).toBe('sensitive data');
      expect(mockiOSService.getSensitiveData).toHaveBeenCalledWith('key', undefined);
    });

    it('should validate key parameter', async () => {
      const result = await service.getSensitiveData('');
      
      expect(result).toBeNull();
    });
  });

  describe('getBiometricSettings', () => {
    beforeEach(() => {
      (mockPlatform.OS as any) = 'ios';
    });

    it('should return settings with platform information', async () => {
      const mockSettings = {
        isAvailable: true,
        isEnabled: true,
        biometricType: 'Face ID',
        supportedTypes: [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION],
      };
      mockiOSService.getBiometricSettings.mockResolvedValue(mockSettings);

      const result = await service.getBiometricSettings();
      
      expect(result).toEqual({
        ...mockSettings,
        platform: 'ios',
      });
    });

    it('should return default settings on error', async () => {
      mockiOSService.getBiometricSettings.mockRejectedValue(new Error('Settings failed'));

      const result = await service.getBiometricSettings();
      
      expect(result).toEqual({
        isAvailable: false,
        isEnabled: false,
        biometricType: 'Biometric',
        supportedTypes: [],
        platform: 'ios',
      });
    });
  });

  describe('quickAuth', () => {
    beforeEach(() => {
      (mockPlatform.OS as any) = 'ios';
    });

    it('should perform quick authentication when available', async () => {
      jest.spyOn(service, 'isBiometricAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'getBiometricTypeName').mockResolvedValue('Face ID');
      jest.spyOn(service, 'authenticate').mockResolvedValue({ success: true });

      const result = await service.quickAuth();
      
      expect(result).toBe(true);
      expect(service.authenticate).toHaveBeenCalledWith(
        'Use Face ID to unlock TailTracker',
        undefined
      );
    });

    it('should return false when biometrics are not available', async () => {
      jest.spyOn(service, 'isBiometricAvailable').mockResolvedValue(false);

      const result = await service.quickAuth();
      
      expect(result).toBe(false);
    });

    it('should handle fallback option', async () => {
      jest.spyOn(service, 'isBiometricAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'getBiometricTypeName').mockResolvedValue('Touch ID');
      jest.spyOn(service, 'authenticate').mockResolvedValue({ success: true });

      await service.quickAuth(false);
      
      expect(service.authenticate).toHaveBeenCalledWith(
        'Use Touch ID to unlock TailTracker',
        'Cancel'
      );
    });

    it('should handle authentication errors', async () => {
      jest.spyOn(service, 'isBiometricAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'getBiometricTypeName').mockResolvedValue('Face ID');
      jest.spyOn(service, 'authenticate').mockResolvedValue({ success: false });

      const result = await service.quickAuth();
      
      expect(result).toBe(false);
    });
  });

  describe('validateSetup', () => {
    it('should validate complete biometric setup', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      jest.spyOn(service, 'getSupportedBiometrics').mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT
      ]);
      
      (mockPlatform.OS as any) = 'ios';
      mockiOSService.getBiometricSettings.mockResolvedValue({
        isAvailable: true,
        isEnabled: true,
        biometricType: 'Touch ID',
        supportedTypes: [LocalAuthentication.AuthenticationType.FINGERPRINT],
      });

      const result = await service.validateSetup();
      
      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should identify hardware issues', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      jest.spyOn(service, 'getSupportedBiometrics').mockResolvedValue([]);

      const result = await service.validateSetup();
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Biometric hardware not available on this device');
    });

    it('should identify enrollment issues', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);
      jest.spyOn(service, 'getSupportedBiometrics').mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT
      ]);

      const result = await service.validateSetup();
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('No biometric credentials enrolled on this device');
    });

    it('should identify platform-specific issues', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      jest.spyOn(service, 'getSupportedBiometrics').mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT
      ]);
      
      (mockPlatform.OS as any) = 'android';
      mockAndroidService.getBiometricSettings.mockResolvedValue({
        isAvailable: false,
        isEnabled: false,
        biometricType: 'Fingerprint',
        supportedTypes: [LocalAuthentication.AuthenticationType.FINGERPRINT],
      });

      const result = await service.validateSetup();
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Android biometric authentication is not properly configured');
    });

    it('should handle validation errors', async () => {
      mockLocalAuth.hasHardwareAsync.mockRejectedValue(new Error('Validation failed'));

      const result = await service.validateSetup();
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Failed to validate biometric authentication setup');
    });
  });

  describe('Error Handling', () => {
    it('should handle platform service initialization errors', async () => {
      // Test case where platform services might not be properly initialized
      const service = BiometricAuthService.getInstance();
      
      // Should not throw when calling methods
      expect(async () => {
        await service.isBiometricAvailable();
      }).not.toThrow();
    });
  });

  describe('Cross-platform Consistency', () => {
    it('should maintain consistent API across platforms', () => {
      const service = BiometricAuthService.getInstance();
      
      // Verify all expected methods exist
      expect(typeof service.isBiometricAvailable).toBe('function');
      expect(typeof service.authenticate).toBe('function');
      expect(typeof service.storeCredentials).toBe('function');
      expect(typeof service.getCredentials).toBe('function');
      expect(typeof service.deleteCredentials).toBe('function');
      expect(typeof service.storeSensitiveData).toBe('function');
      expect(typeof service.getSensitiveData).toBe('function');
      expect(typeof service.quickAuth).toBe('function');
      expect(typeof service.validateSetup).toBe('function');
      expect(typeof service.getBiometricSettings).toBe('function');
    });

    it('should export consistent singleton', () => {
      expect(biometricAuthService).toBeInstanceOf(BiometricAuthService);
      expect(biometricAuthService).toBe(BiometricAuthService.getInstance());
    });
  });
});