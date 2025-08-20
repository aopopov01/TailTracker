import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Keychain from 'react-native-keychain';
import { iOSBiometricsService } from '../../services/iOSBiometricsService';

// Mock dependencies
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
  STORAGE_TYPE: {
    KC: 'KC',
  },
}));

describe('iOSBiometricsService', () => {
  let service: iOSBiometricsService;
  
  const mockLocalAuth = {
    hasHardwareAsync: LocalAuthentication.hasHardwareAsync as jest.MockedFunction<typeof LocalAuthentication.hasHardwareAsync>,
    isEnrolledAsync: LocalAuthentication.isEnrolledAsync as jest.MockedFunction<typeof LocalAuthentication.isEnrolledAsync>,
    supportedAuthenticationTypesAsync: LocalAuthentication.supportedAuthenticationTypesAsync as jest.MockedFunction<typeof LocalAuthentication.supportedAuthenticationTypesAsync>,
    authenticateAsync: LocalAuthentication.authenticateAsync as jest.MockedFunction<typeof LocalAuthentication.authenticateAsync>,
  };

  const mockKeychain = {
    setInternetCredentials: Keychain.setInternetCredentials as jest.MockedFunction<typeof Keychain.setInternetCredentials>,
    getInternetCredentials: Keychain.getInternetCredentials as jest.MockedFunction<typeof Keychain.getInternetCredentials>,
    resetInternetCredentials: Keychain.resetInternetCredentials as jest.MockedFunction<typeof Keychain.resetInternetCredentials>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = iOSBiometricsService.getInstance();
    
    // Default successful mocks
    mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
    mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);
    mockLocalAuth.authenticateAsync.mockResolvedValue({
      success: true,
      error: undefined,
    });
  });

  describe('Singleton Pattern', () => {
    it('returns the same instance', () => {
      const instance1 = iOSBiometricsService.getInstance();
      const instance2 = iOSBiometricsService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Biometric Availability', () => {
    it('returns true when biometrics are available and enrolled', async () => {
      const isAvailable = await service.isBiometricAvailable();
      
      expect(isAvailable).toBe(true);
      expect(mockLocalAuth.hasHardwareAsync).toHaveBeenCalled();
      expect(mockLocalAuth.isEnrolledAsync).toHaveBeenCalled();
    });

    it('returns false when no hardware available', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);
      
      const isAvailable = await service.isBiometricAvailable();
      
      expect(isAvailable).toBe(false);
    });

    it('returns false when not enrolled', async () => {
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);
      
      const isAvailable = await service.isBiometricAvailable();
      
      expect(isAvailable).toBe(false);
    });

    it('returns false on non-iOS platforms', async () => {
      (Platform.OS as any) = 'android';
      
      const isAvailable = await service.isBiometricAvailable();
      
      expect(isAvailable).toBe(false);
      expect(mockLocalAuth.hasHardwareAsync).not.toHaveBeenCalled();
      
      (Platform.OS as any) = 'ios';
    });

    it('handles errors gracefully', async () => {
      mockLocalAuth.hasHardwareAsync.mockRejectedValue(new Error('Hardware error'));
      
      const isAvailable = await service.isBiometricAvailable();
      
      expect(isAvailable).toBe(false);
    });
  });

  describe('Supported Biometric Types', () => {
    it('returns supported authentication types', async () => {
      const expectedTypes = [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION];
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue(expectedTypes);
      
      const supportedTypes = await service.getSupportedBiometrics();
      
      expect(supportedTypes).toEqual(expectedTypes);
    });

    it('returns empty array on non-iOS platforms', async () => {
      (Platform.OS as any) = 'android';
      
      const supportedTypes = await service.getSupportedBiometrics();
      
      expect(supportedTypes).toEqual([]);
      
      (Platform.OS as any) = 'ios';
    });

    it('handles errors and returns empty array', async () => {
      mockLocalAuth.supportedAuthenticationTypesAsync.mockRejectedValue(new Error('Auth error'));
      
      const supportedTypes = await service.getSupportedBiometrics();
      
      expect(supportedTypes).toEqual([]);
    });
  });

  describe('Biometric Type Names', () => {
    it('returns Face ID for facial recognition', async () => {
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      
      const typeName = await service.getBiometricTypeName();
      
      expect(typeName).toBe('Face ID');
    });

    it('returns Touch ID for fingerprint', async () => {
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);
      
      const typeName = await service.getBiometricTypeName();
      
      expect(typeName).toBe('Touch ID');
    });

    it('returns Iris for iris recognition', async () => {
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.IRIS,
      ]);
      
      const typeName = await service.getBiometricTypeName();
      
      expect(typeName).toBe('Iris');
    });

    it('returns Biometric as fallback', async () => {
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([]);
      
      const typeName = await service.getBiometricTypeName();
      
      expect(typeName).toBe('Biometric');
    });
  });

  describe('Authentication', () => {
    it('authenticates successfully', async () => {
      const result = await service.authenticate('Test authentication');
      
      expect(result.success).toBe(true);
      expect(result.biometryType).toBe('Face ID');
      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'Test authentication',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });
    });

    it('fails authentication when biometrics unavailable', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);
      
      const result = await service.authenticate();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Biometric authentication is not available');
    });

    it('fails authentication when user cancels', async () => {
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: false,
        error: 'User cancelled',
      });
      
      const result = await service.authenticate();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User cancelled');
    });

    it('returns error on non-iOS platforms', async () => {
      (Platform.OS as any) = 'android';
      
      const result = await service.authenticate();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Biometric authentication is only available on iOS');
      
      (Platform.OS as any) = 'ios';
    });

    it('handles authentication errors', async () => {
      mockLocalAuth.authenticateAsync.mockRejectedValue(new Error('Auth failed'));
      
      const result = await service.authenticate();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication error occurred');
    });
  });

  describe('Credential Storage', () => {
    it('stores credentials successfully', async () => {
      mockKeychain.setInternetCredentials.mockResolvedValue(true);
      
      const result = await service.storeCredentials('user@test.com', 'password123');
      
      expect(result).toBe(true);
      expect(mockKeychain.setInternetCredentials).toHaveBeenCalledWith(
        'TailTracker',
        'user@test.com',
        'password123',
        expect.objectContaining({
          service: 'TailTracker',
          accessControl: 'BiometryAny',
        })
      );
    });

    it('handles storage errors', async () => {
      mockKeychain.setInternetCredentials.mockRejectedValue(new Error('Storage error'));
      
      const result = await service.storeCredentials('user@test.com', 'password123');
      
      expect(result).toBe(false);
    });

    it('returns false on non-iOS platforms', async () => {
      (Platform.OS as any) = 'android';
      
      const result = await service.storeCredentials('user@test.com', 'password123');
      
      expect(result).toBe(false);
      expect(mockKeychain.setInternetCredentials).not.toHaveBeenCalled();
      
      (Platform.OS as any) = 'ios';
    });
  });

  describe('Credential Retrieval', () => {
    it('retrieves credentials successfully', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'user@test.com',
        password: 'password123',
        service: 'TailTracker',
        storage: 'KC',
      });
      
      const credentials = await service.getCredentials();
      
      expect(credentials).toEqual({
        username: 'user@test.com',
        password: 'password123',
      });
    });

    it('returns null when no credentials found', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue(false);
      
      const credentials = await service.getCredentials();
      
      expect(credentials).toBeNull();
    });

    it('returns null when user cancels', async () => {
      const error = new Error('UserCancel');
      error.message = 'UserCancel';
      mockKeychain.getInternetCredentials.mockRejectedValue(error);
      
      const credentials = await service.getCredentials();
      
      expect(credentials).toBeNull();
    });

    it('handles retrieval errors', async () => {
      mockKeychain.getInternetCredentials.mockRejectedValue(new Error('Retrieval error'));
      
      const credentials = await service.getCredentials();
      
      expect(credentials).toBeNull();
    });

    it('returns null on non-iOS platforms', async () => {
      (Platform.OS as any) = 'android';
      
      const credentials = await service.getCredentials();
      
      expect(credentials).toBeNull();
      expect(mockKeychain.getInternetCredentials).not.toHaveBeenCalled();
      
      (Platform.OS as any) = 'ios';
    });
  });

  describe('Credential Management', () => {
    it('deletes credentials successfully', async () => {
      mockKeychain.resetInternetCredentials.mockResolvedValue(true);
      
      const result = await service.deleteCredentials();
      
      expect(result).toBe(true);
      expect(mockKeychain.resetInternetCredentials).toHaveBeenCalledWith('TailTracker');
    });

    it('handles deletion errors', async () => {
      mockKeychain.resetInternetCredentials.mockRejectedValue(new Error('Delete error'));
      
      const result = await service.deleteCredentials();
      
      expect(result).toBe(false);
    });

    it('checks if credentials exist', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'user@test.com',
        password: 'password123',
        service: 'TailTracker',
        storage: 'KC',
      });
      
      const hasCredentials = await service.hasCredentials();
      
      expect(hasCredentials).toBe(true);
    });

    it('returns false when no credentials exist', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue(false);
      
      const hasCredentials = await service.hasCredentials();
      
      expect(hasCredentials).toBe(false);
    });
  });

  describe('Sensitive Data Storage', () => {
    it('stores sensitive data successfully', async () => {
      mockKeychain.setInternetCredentials.mockResolvedValue(true);
      
      const result = await service.storeSensitiveData('pet-data', 'sensitive-info');
      
      expect(result).toBe(true);
      expect(mockKeychain.setInternetCredentials).toHaveBeenCalledWith(
        'pet-data',
        'data',
        'sensitive-info',
        expect.any(Object)
      );
    });

    it('retrieves sensitive data successfully', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'data',
        password: 'sensitive-info',
        service: 'pet-data',
        storage: 'KC',
      });
      
      const data = await service.getSensitiveData('pet-data');
      
      expect(data).toBe('sensitive-info');
    });
  });

  describe('Biometric Settings', () => {
    it('returns complete biometric settings', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'user',
        password: 'pass',
        service: 'TailTracker',
        storage: 'KC',
      });
      
      const settings = await service.getBiometricSettings();
      
      expect(settings).toEqual({
        isAvailable: true,
        isEnabled: true,
        biometricType: 'Face ID',
        supportedTypes: [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION],
      });
    });

    it('shows disabled when no credentials stored', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue(false);
      
      const settings = await service.getBiometricSettings();
      
      expect(settings.isEnabled).toBe(false);
    });
  });

  describe('Biometric Prompts', () => {
    it('shows custom biometric prompt', async () => {
      const result = await service.promptBiometric(
        'Custom Title',
        'Custom Subtitle',
        'Custom Description',
        'Custom Fallback'
      );
      
      expect(result.success).toBe(true);
      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'Custom Title',
        fallbackLabel: 'Custom Fallback',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });
    });

    it('uses default title when none provided', async () => {
      await service.promptBiometric('');
      
      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          promptMessage: 'Use Face ID to authenticate',
        })
      );
    });
  });
});