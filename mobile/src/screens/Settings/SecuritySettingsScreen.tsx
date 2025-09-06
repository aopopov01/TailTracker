import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../contexts/AuthContext';

interface SecuritySettings {
  biometricEnabled: boolean;
  appLockEnabled: boolean;
  autoLockTimeout: number; // minutes
  sessionTimeout: number; // hours
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  deviceTrust: boolean;
  dataEncryption: boolean;
}

interface BiometricInfo {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export const SecuritySettingsScreen: React.FC = () => {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<SecuritySettings>({
    biometricEnabled: false,
    appLockEnabled: false,
    autoLockTimeout: 5,
    sessionTimeout: 24,
    twoFactorEnabled: false,
    loginNotifications: true,
    deviceTrust: false,
    dataEncryption: true,
  });

  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo>({
    isAvailable: false,
    isEnrolled: false,
    supportedTypes: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    initializeSecuritySettings();
  }, [initializeSecuritySettings]);

  const initializeSecuritySettings = useCallback(async () => {
    try {
      // Check biometric availability
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setBiometricInfo({
        isAvailable,
        isEnrolled,
        supportedTypes,
      });

      // Load saved settings
      await loadSecuritySettings();
    } catch (error) {
      console.error('Error initializing security settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadSecuritySettings]);

  const loadSecuritySettings = useCallback(async () => {
    try {
      const savedSettings = await SecureStore.getItemAsync('security_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  }, []);

  const saveSecuritySettings = async (newSettings: SecuritySettings) => {
    try {
      await SecureStore.setItemAsync('security_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving security settings:', error);
      throw error;
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled && !biometricInfo.isEnrolled) {
      Alert.alert(
        'Biometric Authentication Not Set Up',
        'Please set up Face ID, Touch ID, or fingerprint authentication in your device settings first.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (enabled) {
      // Test biometric authentication first
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enable biometric authentication for TailTracker',
          fallbackLabel: 'Use passcode',
          disableDeviceFallback: false,
        });

        if (!result.success) {
          Alert.alert('Authentication Failed', 'Biometric authentication is required to enable this feature.');
          return;
        }
      } catch (error) {
        console.error('Biometric authentication error:', error);
        Alert.alert('Error', 'Failed to authenticate. Please try again.');
        return;
      }
    }

    const newSettings = { ...settings, biometricEnabled: enabled };
    setSettings(newSettings);
    
    try {
      await saveSecuritySettings(newSettings);
      
      Alert.alert(
        'Biometric Authentication',
        enabled 
          ? 'Biometric authentication has been enabled. You can now unlock TailTracker with your fingerprint or face.'
          : 'Biometric authentication has been disabled.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save security settings.');
      setSettings(settings); // Revert on error
    }
  };

  const handleAppLockToggle = async (enabled: boolean) => {
    if (enabled && !settings.biometricEnabled && !biometricInfo.isEnrolled) {
      Alert.alert(
        'App Lock Requirements',
        'App lock requires biometric authentication to be available. Please enable biometric authentication first.',
        [{ text: 'OK' }]
      );
      return;
    }

    const newSettings = { ...settings, appLockEnabled: enabled };
    setSettings(newSettings);
    
    try {
      await saveSecuritySettings(newSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to save security settings.');
      setSettings(settings);
    }
  };

  const handleSettingToggle = async (key: keyof SecuritySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await saveSecuritySettings(newSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to save security settings.');
      setSettings(settings);
    }
  };

  const handleTimeoutChange = (key: 'autoLockTimeout' | 'sessionTimeout', value: number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSecuritySettings(newSettings).catch(() => {
      Alert.alert('Error', 'Failed to save security settings.');
      setSettings(settings);
    });
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'You will be redirected to change your password. This requires re-authentication.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // In a real app, this would navigate to a password change flow
            // For now, we'll show a placeholder
            Alert.alert('Feature Coming Soon', 'Password change functionality will be available in a future update.');
          },
        },
      ]
    );
  };

  const handleSetup2FA = () => {
    Alert.alert(
      'Two-Factor Authentication',
      'Two-factor authentication adds an extra layer of security to your account. Would you like to set it up?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Setup 2FA',
          onPress: () => {
            // Navigate to 2FA setup flow
            Alert.alert('Feature Coming Soon', 'Two-factor authentication setup will be available in a future update.');
          },
        },
      ]
    );
  };

  const handleViewActiveDevices = () => {
    Alert.alert(
      'Active Devices',
      'View and manage devices that have access to your TailTracker account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Devices',
          onPress: () => {
            Alert.alert('Feature Coming Soon', 'Device management will be available in a future update.');
          },
        },
      ]
    );
  };

  const getBiometricTypeText = () => {
    if (biometricInfo.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    } else if (biometricInfo.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID / Fingerprint';
    } else if (biometricInfo.supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Recognition';
    }
    return 'Biometric Authentication';
  };

  const renderTimeoutSelector = (
    title: string,
    value: number,
    options: { label: string; value: number }[],
    onChange: (value: number) => void
  ) => (
    <View style={styles.settingContainer}>
      <Text style={styles.settingTitle}>{title}</Text>
      <View style={styles.timeoutOptions}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.timeoutOption,
              value === option.value && styles.selectedTimeoutOption,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                styles.timeoutOptionText,
                value === option.value && styles.selectedTimeoutOptionText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading security settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Authentication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>
                {getBiometricTypeText()}
              </Text>
              <Text style={styles.settingDescription}>
                {biometricInfo.isEnrolled 
                  ? 'Use biometric authentication to unlock the app'
                  : 'Set up biometric authentication in device settings first'
                }
              </Text>
            </View>
            <Switch
              value={settings.biometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!biometricInfo.isAvailable || !biometricInfo.isEnrolled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>App Lock</Text>
              <Text style={styles.settingDescription}>
                Require authentication when opening the app
              </Text>
            </View>
            <Switch
              value={settings.appLockEnabled}
              onValueChange={handleAppLockToggle}
              disabled={!biometricInfo.isAvailable}
            />
          </View>

          <TouchableOpacity style={styles.actionRow} onPress={handleChangePassword}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Change Password</Text>
              <Text style={styles.settingDescription}>
                Update your account password
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Auto-Lock Settings */}
        {settings.appLockEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Auto-Lock</Text>
            
            {renderTimeoutSelector(
              'Auto-Lock Timeout',
              settings.autoLockTimeout,
              [
                { label: 'Immediately', value: 0 },
                { label: '1 min', value: 1 },
                { label: '5 min', value: 5 },
                { label: '15 min', value: 15 },
                { label: '30 min', value: 30 },
              ],
              (value) => handleTimeoutChange('autoLockTimeout', value)
            )}
          </View>
        )}

        {/* Session Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Management</Text>
          
          {renderTimeoutSelector(
            'Session Timeout',
            settings.sessionTimeout,
            [
              { label: '1 hour', value: 1 },
              { label: '6 hours', value: 6 },
              { label: '24 hours', value: 24 },
              { label: '7 days', value: 168 },
              { label: 'Never', value: -1 },
            ],
            (value) => handleTimeoutChange('sessionTimeout', value)
          )}

          <TouchableOpacity style={styles.actionRow} onPress={handleViewActiveDevices}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Active Devices</Text>
              <Text style={styles.settingDescription}>
                Manage devices with access to your account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Two-Factor Authentication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
              <Text style={styles.settingDescription}>
                Add extra security with 2FA authentication
              </Text>
            </View>
            <View style={styles.actionContainer}>
              {settings.twoFactorEnabled ? (
                <View style={styles.enabledBadge}>
                  <Text style={styles.enabledBadgeText}>Enabled</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={handleSetup2FA} style={styles.setupButton}>
                  <Text style={styles.setupButtonText}>Setup</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Security Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Login Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified of new logins to your account
              </Text>
            </View>
            <Switch
              value={settings.loginNotifications}
              onValueChange={(value) => handleSettingToggle('loginNotifications', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Device Trust</Text>
              <Text style={styles.settingDescription}>
                Remember this device for faster authentication
              </Text>
            </View>
            <Switch
              value={settings.deviceTrust}
              onValueChange={(value) => handleSettingToggle('deviceTrust', value)}
            />
          </View>
        </View>

        {/* Data Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Data Encryption</Text>
              <Text style={styles.settingDescription}>
                Encrypt sensitive data stored on this device
              </Text>
            </View>
            <Switch
              value={settings.dataEncryption}
              onValueChange={(value) => handleSettingToggle('dataEncryption', value)}
            />
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color="#34C759" />
            <Text style={styles.infoText}>
              Your data is protected with end-to-end encryption both in transit and at rest.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  settingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  timeoutOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  timeoutOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedTimeoutOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeoutOptionText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  selectedTimeoutOptionText: {
    color: '#FFF',
  },
  actionContainer: {
    alignItems: 'center',
  },
  setupButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  setupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  enabledBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enabledBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9F9F9',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 12,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SecuritySettingsScreen;