import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { AndroidBiometricsService } from '../../services/AndroidBiometricsService';
import { modalService } from '../../utils/modalService';

// Mock dependencies
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
}));

jest.mock('expo-local-authentication');
jest.mock('expo-secure-store');
jest.mock('../../utils/modalService');

const mockLocalAuth = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockModalService = modalService as jest.Mocked<typeof modalService>;

describe('AndroidBiometricsService', () => {
  let service: AndroidBiometricsService;

  beforeEach(() => {
    service = AndroidBiometricsService.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AndroidBiometricsService.getInstance();
      const instance2 = AndroidBiometricsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Platform Detection', () => {
    it('should work only on Android', () => {
      expect(Platform.OS).toBe('android');
    });

    it('should return false for iOS platform', async () => {
      (Platform as any).OS = 'ios';
      const result = await service.isBiometricAvailable();
      expect(result).toBe(false);
      
      // Reset to Android
      (Platform as any).OS = 'android';
    });
  });

  describe('isBiometricAvailable', () => {
    it('should return true when biometric hardware is available and enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);

      const result = await service.isBiometricAvailable();
      expect(result).toBe(true);
      expect(mockLocalAuth.hasHardwareAsync).toHaveBeenCalled();
      expect(mockLocalAuth.isEnrolledAsync).toHaveBeenCalled();
    });

    it('should return false when hardware is not available', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);

      const result = await service.isBiometricAvailable();
      expect(result).toBe(false);
    });

    it('should return false when biometrics are not enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);

      const result = await service.isBiometricAvailable();
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockLocalAuth.hasHardwareAsync.mockRejectedValue(new Error('Hardware error'));

      const result = await service.isBiometricAvailable();
      expect(result).toBe(false);
    });
  });

  describe('getSupportedBiometrics', () => {
    it('should return supported authentication types', async () => {
      const mockTypes = [
        LocalAuthentication.AuthenticationType.FINGERPRINT,
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
      ];
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue(mockTypes);

      const result = await service.getSupportedBiometrics();
      expect(result).toEqual(mockTypes);
      expect(mockLocalAuth.supportedAuthenticationTypesAsync).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      mockLocalAuth.supportedAuthenticationTypesAsync.mockRejectedValue(
        new Error('Support check failed')
      );

      const result = await service.getSupportedBiometrics();
      expect(result).toEqual([]);
    });
  });

  describe('getBiometricTypeName', () => {
    it('should return "Face Recognition" for facial recognition', async () => {
      jest.spyOn(service, 'getSupportedBiometrics').mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
      ]);

      const result = await service.getBiometricTypeName();
      expect(result).toBe('Face Recognition');
    });

    it('should return "Fingerprint" for fingerprint', async () => {
      jest.spyOn(service, 'getSupportedBiometrics').mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT
      ]);

      const result = await service.getBiometricTypeName();
      expect(result).toBe('Fingerprint');
    });

    it('should return "Iris" for iris recognition', async () => {
      jest.spyOn(service, 'getSupportedBiometrics').mockResolvedValue([
        LocalAuthentication.AuthenticationType.IRIS
      ]);

      const result = await service.getBiometricTypeName();
      expect(result).toBe('Iris');
    });

    it('should return "Biometric" for unknown types', async () => {
      jest.spyOn(service, 'getSupportedBiometrics').mockResolvedValue([]);

      const result = await service.getBiometricTypeName();
      expect(result).toBe('Biometric');
    });
  });

  describe('authenticate', () => {
    it('should authenticate successfully', async () => {
      jest.spyOn(service, 'isBiometricAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'getBiometricTypeName').mockResolvedValue('Fingerprint');
      
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: true,
      } as any);

      const result = await service.authenticate('Test reason', 'Use PIN');
      
      expect(result.success).toBe(true);
      expect(result.biometryType).toBe('Fingerprint');
      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'Test reason',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });
    });

    it('should fail when biometrics are not available', async () => {
      jest.spyOn(service, 'isBiometricAvailable').mockResolvedValue(false);

      const result = await service.authenticate();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Biometric authentication is not available');
    });

    it('should fail on authentication error', async () => {
      jest.spyOn(service, 'isBiometricAvailable').mockResolvedValue(true);
      
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: false,
        error: 'Authentication failed',
      } as any);

      const result = await service.authenticate();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });

    it('should use default messages when not provided', async () => {
      jest.spyOn(service, 'isBiometricAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'getBiometricTypeName').mockResolvedValue('Fingerprint');
      
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: true,
      } as any);

      await service.authenticate();
      
      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'Authenticate to access TailTracker',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });
    });
  });

  describe('storeCredentials', () => {
    it('should store credentials successfully', async () => {
      mockSecureStore.setItemAsync.mockResolvedValue();

      const result = await service.storeCredentials('testuser', 'testpass');
      
      expect(result).toBe(true);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'TailTracker_credentials',
        JSON.stringify({ username: 'testuser', password: 'testpass' }),
        {
          requireAuthentication: true,
          authenticationPrompt: 'Authenticate to save your credentials',
        }
      );
    });

    it('should use custom service name', async () => {
      mockSecureStore.setItemAsync.mockResolvedValue();

      await service.storeCredentials('testuser', 'testpass', { service: 'CustomService' });
      
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'CustomService_credentials',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should fail on storage error', async () => {
      mockSecureStore.setItemAsync.mockRejectedValue(new Error('Storage failed'));

      const result = await service.storeCredentials('testuser', 'testpass');
      expect(result).toBe(false);
    });
  });

  describe('getCredentials', () => {
    it('should retrieve credentials successfully', async () => {
      const mockCredentials = JSON.stringify({ username: 'testuser', password: 'testpass' });
      mockSecureStore.getItemAsync.mockResolvedValue(mockCredentials);

      const result = await service.getCredentials();
      
      expect(result).toEqual({ username: 'testuser', password: 'testpass' });
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
        'TailTracker_credentials',
        {
          requireAuthentication: true,
          authenticationPrompt: 'Authenticate to access your credentials',
        }
      );
    });

    it('should return null when no credentials exist', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const result = await service.getCredentials();
      expect(result).toBeNull();
    });

    it('should handle user cancellation', async () => {
      mockSecureStore.getItemAsync.mockRejectedValue(new Error('UserCancel'));

      const result = await service.getCredentials();
      expect(result).toBeNull();
    });

    it('should handle authentication cancellation', async () => {
      mockSecureStore.getItemAsync.mockRejectedValue(new Error('Authentication was canceled'));

      const result = await service.getCredentials();
      expect(result).toBeNull();
    });
  });

  describe('deleteCredentials', () => {
    it('should delete credentials successfully', async () => {
      mockSecureStore.deleteItemAsync.mockResolvedValue();

      const result = await service.deleteCredentials();
      
      expect(result).toBe(true);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('TailTracker_credentials');
    });

    it('should use custom service name', async () => {
      mockSecureStore.deleteItemAsync.mockResolvedValue();

      await service.deleteCredentials('CustomService');
      
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('CustomService_credentials');
    });

    it('should fail on deletion error', async () => {
      mockSecureStore.deleteItemAsync.mockRejectedValue(new Error('Deletion failed'));

      const result = await service.deleteCredentials();
      expect(result).toBe(false);
    });
  });

  describe('hasCredentials', () => {
    it('should return true when credentials exist', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('some credentials');

      const result = await service.hasCredentials();
      expect(result).toBe(true);
    });

    it('should return false when no credentials exist', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const result = await service.hasCredentials();
      expect(result).toBe(false);
    });

    it('should return true when authentication is required (credentials exist but protected)', async () => {
      const authError = new Error('requireAuthentication');
      mockSecureStore.getItemAsync.mockRejectedValue(authError);

      const result = await service.hasCredentials();
      expect(result).toBe(true);
    });

    it('should return false on other errors', async () => {
      mockSecureStore.getItemAsync.mockRejectedValue(new Error('Other error'));

      const result = await service.hasCredentials();
      expect(result).toBe(false);
    });
  });

  describe('storeSensitiveData', () => {
    it('should store sensitive data successfully', async () => {
      mockSecureStore.setItemAsync.mockResolvedValue();

      const result = await service.storeSensitiveData('testkey', 'testdata');
      
      expect(result).toBe(true);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'testkey',
        'testdata',
        {
          requireAuthentication: true,
          authenticationPrompt: 'Authenticate to save data',
        }
      );
    });

    it('should fail on storage error', async () => {
      mockSecureStore.setItemAsync.mockRejectedValue(new Error('Storage failed'));

      const result = await service.storeSensitiveData('testkey', 'testdata');
      expect(result).toBe(false);
    });
  });

  describe('getSensitiveData', () => {
    it('should retrieve sensitive data successfully', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('testdata');

      const result = await service.getSensitiveData('testkey');
      
      expect(result).toBe('testdata');
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
        'testkey',
        {
          requireAuthentication: true,
          authenticationPrompt: 'Authenticate to access data',
        }
      );
    });

    it('should handle user cancellation', async () => {
      mockSecureStore.getItemAsync.mockRejectedValue(new Error('UserCancel'));

      const result = await service.getSensitiveData('testkey');
      expect(result).toBeNull();
    });
  });

  describe('enableBiometricAuth', () => {
    it('should enable biometric auth when available', async () => {
      jest.spyOn(service, 'isBiometricAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'authenticate').mockResolvedValue({ success: true });

      const result = await service.enableBiometricAuth();
      
      expect(result).toBe(true);
      expect(service.authenticate).toHaveBeenCalledWith(
        'Enable biometric authentication for TailTracker',
        'Use PIN'
      );
    });

    it('should show modal when biometric auth is not available', async () => {
      jest.spyOn(service, 'isBiometricAvailable').mockResolvedValue(false);
      jest.spyOn(service, 'getBiometricTypeName').mockResolvedValue('Fingerprint');

      const result = await service.enableBiometricAuth();
      
      expect(result).toBe(false);
      expect(mockModalService.showModal).toHaveBeenCalledWith({
        title: 'Biometric Authentication Unavailable',
        message: 'Fingerprint is not set up on this device. Please set it up in Settings to use this feature.',
        type: 'warning',
        icon: 'finger-print-outline',
        actions: [{ text: 'OK', style: 'primary', onPress: expect.any(Function) }]
      });
    });
  });

  describe('getBiometricSettings', () => {
    it('should return comprehensive biometric settings', async () => {
      jest.spyOn(service, 'isBiometricAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'hasCredentials').mockResolvedValue(true);
      jest.spyOn(service, 'getBiometricTypeName').mockResolvedValue('Fingerprint');
      jest.spyOn(service, 'getSupportedBiometrics').mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT
      ]);

      const result = await service.getBiometricSettings();
      
      expect(result).toEqual({
        isAvailable: true,
        isEnabled: true,
        biometricType: 'Fingerprint',
        supportedTypes: [LocalAuthentication.AuthenticationType.FINGERPRINT],
      });
    });

    it('should return default settings when methods fail', async () => {
      jest.spyOn(service, 'isBiometricAvailable').mockRejectedValue(new Error('Failed'));
      jest.spyOn(service, 'hasCredentials').mockRejectedValue(new Error('Failed'));
      jest.spyOn(service, 'getBiometricTypeName').mockRejectedValue(new Error('Failed'));
      jest.spyOn(service, 'getSupportedBiometrics').mockRejectedValue(new Error('Failed'));

      const result = await service.getBiometricSettings();
      
      // Should not throw and return fallback values
      expect(result).toBeDefined();
      expect(result.isAvailable).toBeDefined();
      expect(result.isEnabled).toBeDefined();
    });
  });

  describe('promptBiometric', () => {
    it('should delegate to authenticate method', async () => {
      const mockResult = { success: true, biometryType: 'Fingerprint' as any };
      jest.spyOn(service, 'authenticate').mockResolvedValue(mockResult);

      const result = await service.promptBiometric('Test title', 'Test subtitle');
      
      expect(result).toEqual(mockResult);
      expect(service.authenticate).toHaveBeenCalledWith('Test title', undefined);
    });
  });
});