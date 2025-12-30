import React, { useState } from 'react';
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

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  value: boolean;
  isRequired?: boolean;
}

export default function PrivacySettingsScreen() {
  const navigation = useNavigation();

  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    {
      id: 'location_tracking',
      title: 'Location Tracking',
      description:
        "Allow TailTracker to track your pet's location for safety features",
      value: true,
      isRequired: false,
    },
    {
      id: 'data_analytics',
      title: 'Anonymous Analytics',
      description: 'Help us improve the app by sharing anonymous usage data',
      value: false,
      isRequired: false,
    },
    {
      id: 'marketing_communications',
      title: 'Marketing Communications',
      description: 'Receive newsletters and promotional content',
      value: false,
      isRequired: false,
    },
    {
      id: 'personalized_ads',
      title: 'Personalized Advertising',
      description: 'Show ads based on your app usage and preferences',
      value: false,
      isRequired: false,
    },
    {
      id: 'data_sharing_vets',
      title: 'Veterinarian Data Sharing',
      description: 'Allow sharing pet data with authorized veterinarians',
      value: true,
      isRequired: false,
    },
    {
      id: 'emergency_contacts',
      title: 'Emergency Contact Access',
      description:
        'Allow emergency contacts to access pet information in crises',
      value: true,
      isRequired: false,
    },
  ]);

  const updateSetting = (settingId: string, newValue: boolean) => {
    if (settingId === 'location_tracking' && !newValue) {
      Alert.alert(
        'Disable Location Tracking',
        'Disabling location tracking will limit lost pet alert functionality. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              setPrivacySettings(prev =>
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

    setPrivacySettings(prev =>
      prev.map(setting =>
        setting.id === settingId ? { ...setting, value: newValue } : setting
      )
    );
  };

  const requestDataExport = () => {
    Alert.alert(
      'Data Export Request',
      'We will prepare your data export and email it to you within 30 days as required by GDPR.',
      [{ text: 'OK' }]
    );
  };

  const requestDataDeletion = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your pet data, account information, and cannot be undone. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Last chance - this will delete everything permanently.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete All Data', style: 'destructive' },
              ]
            );
          },
        },
      ]
    );
  };

  const renderPrivacySetting = (setting: PrivacySetting) => (
    <View key={setting.id} style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{setting.title}</Text>
        <Text style={styles.settingDescription}>{setting.description}</Text>
        {setting.isRequired && (
          <Text style={styles.requiredText}>
            Required for app functionality
          </Text>
        )}
      </View>
      <Switch
        value={setting.value}
        onValueChange={value => updateSetting(setting.id, value)}
        disabled={setting.isRequired}
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
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Controls Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy Controls</Text>
          <View style={styles.settingsContainer}>
            {privacySettings.map(renderPrivacySetting)}
          </View>
        </View>

        {/* Data Rights Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data Rights</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={requestDataExport}
          >
            <Ionicons
              name='download-outline'
              size={20}
              color={colors.primary}
            />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Export My Data</Text>
              <Text style={styles.actionDescription}>
                Download all your personal data in a portable format
              </Text>
            </View>
            <Ionicons name='chevron-forward' size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={requestDataDeletion}
          >
            <Ionicons name='trash-outline' size={20} color={colors.error} />
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.error }]}>
                Delete All My Data
              </Text>
              <Text style={styles.actionDescription}>
                Permanently remove all your data from our servers
              </Text>
            </View>
            <Ionicons name='chevron-forward' size={16} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Information</Text>

          <View style={styles.infoCard}>
            <Ionicons
              name='shield-checkmark'
              size={24}
              color={colors.success}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Your Data is Protected</Text>
              <Text style={styles.infoDescription}>
                We use industry-standard encryption and never sell your personal
                information. All pet data is stored securely and only shared
                with your explicit consent.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name='eye-off' size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Data Minimization</Text>
              <Text style={styles.infoDescription}>
                We only collect data necessary for app functionality and your
                pet's safety. You can control what information is shared and
                with whom.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name='time' size={24} color={colors.warning} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Data Retention</Text>
              <Text style={styles.infoDescription}>
                Pet medical records are kept for 7 years for veterinary
                purposes. Other data is deleted after 2 years of account
                inactivity.
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
  requiredText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primary,
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
  infoCard: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
