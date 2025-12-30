import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';

interface SecuritySetting {
  id: string;
  title: string;
  description: string;
  value: boolean;
  icon: string;
  isAvailable?: boolean;
}

export default function SecuritySettingsScreen() {
  const navigation = useNavigation();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([
    {
      id: 'biometric_auth',
      title: 'Biometric Authentication',
      description: 'Use Face ID, Touch ID, or fingerprint to unlock the app',
      value: false,
      icon: 'finger-print',
      isAvailable: false,
    },
    {
      id: 'app_lock',
      title: 'App Lock',
      description: 'Require authentication to open the app',
      value: true,
      icon: 'lock-closed',
      isAvailable: true,
    },
    {
      id: 'auto_lock',
      title: 'Auto Lock',
      description: 'Lock the app automatically after 5 minutes of inactivity',
      value: true,
      icon: 'time',
      isAvailable: true,
    },
    {
      id: 'secure_sharing',
      title: 'Secure Data Sharing',
      description: 'Require authentication before sharing pet data',
      value: true,
      icon: 'share',
      isAvailable: true,
    },
    {
      id: 'login_alerts',
      title: 'Login Notifications',
      description: 'Get notified about new device logins',
      value: true,
      icon: 'notifications',
      isAvailable: true,
    },
  ]);

  const checkBiometricAvailability = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (hasHardware && isEnrolled) {
        setBiometricAvailable(true);

        // Determine biometric type
        if (
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          setBiometricType('Face ID');
        } else if (
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FINGERPRINT
          )
        ) {
          setBiometricType('Touch ID');
        } else {
          setBiometricType('Biometric Authentication');
        }

        // Update settings to show biometric as available
        setSecuritySettings(prev =>
          prev.map(setting =>
            setting.id === 'biometric_auth'
              ? { ...setting, isAvailable: true, title: biometricType }
              : setting
          )
        );
      }
    } catch (error) {
      console.warn('Error checking biometric availability:', error);
    }
  }, [biometricType]);

  useEffect(() => {
    checkBiometricAvailability();
  }, [checkBiometricAvailability]);

  const updateSetting = async (settingId: string, newValue: boolean) => {
    if (settingId === 'biometric_auth' && newValue && biometricAvailable) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable biometric login',
          fallbackLabel: 'Use passcode',
          disableDeviceFallback: false,
        });

        if (result.success) {
          setSecuritySettings(prev =>
            prev.map(setting =>
              setting.id === settingId
                ? { ...setting, value: newValue }
                : setting
            )
          );
          Alert.alert(
            'Success',
            'Biometric authentication enabled successfully.'
          );
        } else {
          Alert.alert(
            'Authentication Failed',
            'Please try again to enable biometric authentication.'
          );
        }
      } catch (error) {
        console.error('Biometric authentication error:', error);
        Alert.alert(
          'Error',
          'Unable to set up biometric authentication. Please try again.'
        );
      }
      return;
    }

    if (settingId === 'app_lock' && !newValue) {
      Alert.alert(
        'Disable App Lock',
        'Disabling app lock will make your pet data less secure. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              setSecuritySettings(prev =>
                prev.map(setting =>
                  setting.id === settingId
                    ? { ...setting, value: newValue }
                    : setting
                )
              );
            },
          },
        ]
      );
      return;
    }

    setSecuritySettings(prev =>
      prev.map(setting =>
        setting.id === settingId ? { ...setting, value: newValue } : setting
      )
    );
  };

  const changePassword = () => {
    Alert.alert(
      'Change Password',
      'You will be redirected to change your account password securely.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to password change screen or web view
            console.log('Navigate to password change');
          },
        },
      ]
    );
  };

  const viewActiveSessions = () => {
    Alert.alert(
      'Active Sessions',
      'View and manage devices that have access to your TailTracker account.',
      [{ text: 'OK' }]
    );
  };

  const enableTwoFactor = () => {
    Alert.alert(
      'Two-Factor Authentication',
      'Add an extra layer of security to your account with 2FA.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Setup 2FA',
          onPress: () => {
            console.log('Setup 2FA');
          },
        },
      ]
    );
  };

  const renderSecuritySetting = (setting: SecuritySetting) => (
    <View key={setting.id} style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons
          name={setting.icon as any}
          size={20}
          color={setting.isAvailable ? colors.primary : colors.gray400}
        />
      </View>
      <View style={styles.settingInfo}>
        <Text
          style={[
            styles.settingTitle,
            !setting.isAvailable && styles.disabledText,
          ]}
        >
          {setting.title}
        </Text>
        <Text style={styles.settingDescription}>{setting.description}</Text>
        {!setting.isAvailable && (
          <Text style={styles.unavailableText}>
            Not available on this device
          </Text>
        )}
      </View>
      <Switch
        value={setting.value}
        onValueChange={value => updateSetting(setting.id, value)}
        disabled={!setting.isAvailable}
        trackColor={{ false: colors.gray300, true: colors.primary }}
        thumbColor={setting.value ? colors.white : colors.gray400}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name='chevron-back' size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Authentication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication & Access</Text>
          <View style={styles.settingsContainer}>
            {securitySettings.map(renderSecuritySetting)}
          </View>
        </View>

        {/* Account Security Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={changePassword}
          >
            <Ionicons name='key-outline' size={20} color={colors.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Change Password</Text>
              <Text style={styles.actionDescription}>
                Update your account password securely
              </Text>
            </View>
            <Ionicons name='chevron-forward' size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={enableTwoFactor}
          >
            <Ionicons name='shield-outline' size={20} color={colors.success} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Two-Factor Authentication</Text>
              <Text style={styles.actionDescription}>
                Add an extra layer of security to your account
              </Text>
            </View>
            <Ionicons name='chevron-forward' size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={viewActiveSessions}
          >
            <Ionicons
              name='phone-portrait-outline'
              size={20}
              color={colors.primary}
            />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Active Sessions</Text>
              <Text style={styles.actionDescription}>
                Manage devices with access to your account
              </Text>
            </View>
            <Ionicons name='chevron-forward' size={16} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Security Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Status</Text>

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons
                name='checkmark-circle'
                size={24}
                color={colors.success}
              />
              <Text style={styles.statusTitle}>Account is Secure</Text>
            </View>
            <Text style={styles.statusDescription}>
              Your account has strong security settings enabled. Keep your
              password safe and enable two-factor authentication for maximum
              protection.
            </Text>
          </View>

          <View style={styles.securityTips}>
            <Text style={styles.tipsTitle}>Security Tips</Text>
            <View style={styles.tipItem}>
              <Ionicons name='checkmark' size={16} color={colors.success} />
              <Text style={styles.tipText}>Use a unique, strong password</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name='checkmark' size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Enable biometric authentication
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name='checkmark' size={16} color={colors.success} />
              <Text style={styles.tipText}>Keep the app updated</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name='checkmark' size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Review active sessions regularly
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  settingsContainer: {
    backgroundColor: colors.white,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  disabledText: {
    color: colors.gray400,
  },
  unavailableText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  actionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  actionDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success + '20',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.success,
    marginLeft: spacing.sm,
  },
  statusDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  securityTips: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
