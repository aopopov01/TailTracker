/**
 * TailTracker Notification Settings Screen
 * 
 * This component provides a comprehensive interface for users to manage their
 * notification preferences, addressing the UX consistency issues identified
 * in the QA report.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  useNotificationService,
  useNotificationPermissions,
  useNotificationPreferences,
  useNotificationAnalytics,
} from '../../hooks/useNotifications';
import { 
  NotificationType,
  DeliveryChannel,
  NotificationPreferences,
} from '../../services/UnifiedNotificationService';

interface NotificationSettingsScreenProps {
  onBack?: () => void;
}

interface NotificationTypeInfo {
  type: NotificationType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  critical?: boolean;
  defaultEnabled?: boolean;
}

const NOTIFICATION_TYPES: NotificationTypeInfo[] = [
  {
    type: 'lost_pet_alert',
    title: 'Lost Pet Alerts',
    description: 'Urgent notifications when pets go missing in your area',
    icon: 'alert-circle',
    critical: true,
    defaultEnabled: true,
  },
  {
    type: 'pet_found',
    title: 'Pet Found Notifications',
    description: 'Good news when your lost pet is found',
    icon: 'heart',
    critical: true,
    defaultEnabled: true,
  },
  {
    type: 'emergency_alert',
    title: 'Emergency Alerts',
    description: 'Critical emergency notifications about your pets',
    icon: 'warning',
    critical: true,
    defaultEnabled: true,
  },
  {
    type: 'vaccination_reminder',
    title: 'Vaccination Reminders',
    description: 'Reminders for upcoming vaccinations',
    icon: 'medical',
    defaultEnabled: true,
  },
  {
    type: 'medication_reminder',
    title: 'Medication Reminders',
    description: 'Daily medication and treatment reminders',
    icon: 'medical-outline',
    defaultEnabled: true,
  },
  {
    type: 'appointment_reminder',
    title: 'Appointment Reminders',
    description: 'Upcoming vet and grooming appointments',
    icon: 'calendar',
    defaultEnabled: true,
  },
  {
    type: 'location_alert',
    title: 'Location Alerts',
    description: 'Geofence and location-based safety notifications',
    icon: 'location',
    defaultEnabled: true,
  },
  {
    type: 'family_invite',
    title: 'Family Invitations',
    description: 'Invitations to join pet families',
    icon: 'people',
    defaultEnabled: true,
  },
  {
    type: 'social_interaction',
    title: 'Social Interactions',
    description: 'Likes, comments, and community interactions',
    icon: 'chatbubble',
    defaultEnabled: false,
  },
  {
    type: 'system_update',
    title: 'System Updates',
    description: 'App updates and important announcements',
    icon: 'information-circle',
    defaultEnabled: true,
  },
];

const DELIVERY_CHANNELS: Array<{ 
  channel: DeliveryChannel; 
  title: string; 
  icon: keyof typeof Ionicons.glyphMap 
}> = [
  { channel: 'push', title: 'Push Notifications', icon: 'notifications' },
  { channel: 'sound', title: 'Sound', icon: 'volume-high' },
  { channel: 'vibration', title: 'Vibration', icon: 'phone-portrait' },
  { channel: 'badge', title: 'Badge Count', icon: 'radio-button-on' },
  { channel: 'in_app', title: 'In-App Banners', icon: 'banner' },
];

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  onBack,
}) => {
  const { hasPermission, isLoading: serviceLoading } = useNotificationService();
  const { 
    requestPermissions, 
    openSettings, 
    hasPermission: permissionGranted,
    isLoading: permissionLoading,
  } = useNotificationPermissions();
  const {
    preferences,
    isDirty,
    isSaving,
    updatePreferences,
    savePreferences,
    resetPreferences,
  } = useNotificationPreferences();
  const { metrics, refreshAnalytics } = useNotificationAnalytics();

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Refresh analytics when screen loads
    refreshAnalytics();
  }, [refreshAnalytics]);

  const handlePermissionRequest = async () => {
    try {
      const result = await requestPermissions('settings_change', {
        criticalAlerts: true,
      });
      
      if (!result.granted && result.needsSettings) {
        Alert.alert(
          'Enable in Settings',
          'Please enable notifications in your device settings to receive important pet alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions.');
    }
  };

  const handleGlobalToggle = (enabled: boolean) => {
    if (!preferences) return;

    updatePreferences({
      enabled,
    });
  };

  const handleTypeToggle = (type: NotificationType, enabled: boolean) => {
    if (!preferences) return;

    updatePreferences({
      types: {
        ...preferences.types,
        [type]: {
          ...preferences.types[type],
          enabled,
        },
      },
    });
  };

  const handleChannelToggle = (type: NotificationType, channel: DeliveryChannel, enabled: boolean) => {
    if (!preferences) return;

    const currentChannels = preferences.types[type].channels;
    const newChannels = enabled
      ? [...currentChannels, channel]
      : currentChannels.filter(c => c !== channel);

    updatePreferences({
      types: {
        ...preferences.types,
        [type]: {
          ...preferences.types[type],
          channels: newChannels,
        },
      },
    });
  };

  const handleGlobalSettingToggle = (setting: keyof NotificationPreferences['globalSettings'], value: boolean) => {
    if (!preferences) return;

    updatePreferences({
      globalSettings: {
        ...preferences.globalSettings,
        [setting]: value,
      },
    });
  };

  const handleQuietHoursChange = (start: string, end: string) => {
    if (!preferences) return;

    updatePreferences({
      globalSettings: {
        ...preferences.globalSettings,
        quietHoursStart: start,
        quietHoursEnd: end,
      },
    });
  };

  const handleSave = async () => {
    try {
      await savePreferences();
      Alert.alert('Success', 'Notification settings saved successfully.');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save notification settings.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all notification settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetPreferences,
        },
      ]
    );
  };

  if (serviceLoading || !preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Notification Settings</Text>
        <View style={styles.headerActions}>
          {isDirty && (
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, isSaving && styles.savingButton]}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        {!permissionGranted && (
          <View style={styles.permissionCard}>
            <View style={styles.permissionHeader}>
              <Ionicons name="warning" size={24} color="#FF9500" />
              <Text style={styles.permissionTitle}>Notifications Disabled</Text>
            </View>
            <Text style={styles.permissionDescription}>
              Enable notifications to receive important pet alerts and reminders.
            </Text>
            <TouchableOpacity
              onPress={handlePermissionRequest}
              style={styles.enableButton}
              disabled={permissionLoading}
            >
              {permissionLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.enableButtonText}>Enable Notifications</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Global Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Master switch for all notifications
              </Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={handleGlobalToggle}
              disabled={!permissionGranted}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Quiet Hours</Text>
              <Text style={styles.settingDescription}>
                Silence non-emergency notifications during quiet hours
              </Text>
            </View>
            <Switch
              value={preferences.globalSettings.quietHoursEnabled}
              onValueChange={(value) => handleGlobalSettingToggle('quietHoursEnabled', value)}
              disabled={!preferences.enabled}
            />
          </View>

          {preferences.globalSettings.quietHoursEnabled && (
            <View style={styles.quietHoursContainer}>
              <Text style={styles.quietHoursLabel}>
                {preferences.globalSettings.quietHoursStart} - {preferences.globalSettings.quietHoursEnd}
              </Text>
              <TouchableOpacity style={styles.changeTimeButton}>
                <Text style={styles.changeTimeText}>Change Times</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Emergency Override</Text>
              <Text style={styles.settingDescription}>
                Allow emergency alerts during quiet hours
              </Text>
            </View>
            <Switch
              value={preferences.globalSettings.emergencyOverride}
              onValueChange={(value) => handleGlobalSettingToggle('emergencyOverride', value)}
              disabled={!preferences.enabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Location-Based Alerts</Text>
              <Text style={styles.settingDescription}>
                Receive notifications based on your location
              </Text>
            </View>
            <Switch
              value={preferences.globalSettings.locationBasedEnabled}
              onValueChange={(value) => handleGlobalSettingToggle('locationBasedEnabled', value)}
              disabled={!preferences.enabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Group by Pet</Text>
              <Text style={styles.settingDescription}>
                Group notifications by individual pets
              </Text>
            </View>
            <Switch
              value={preferences.globalSettings.groupByPet}
              onValueChange={(value) => handleGlobalSettingToggle('groupByPet', value)}
              disabled={!preferences.enabled}
            />
          </View>
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          {NOTIFICATION_TYPES.map((typeInfo) => (
            <View key={typeInfo.type} style={styles.notificationTypeContainer}>
              <View style={styles.notificationTypeHeader}>
                <View style={styles.notificationTypeInfo}>
                  <View style={styles.notificationTypeIcon}>
                    <Ionicons
                      name={typeInfo.icon}
                      size={20}
                      color={typeInfo.critical ? '#FF3B30' : '#007AFF'}
                    />
                  </View>
                  <View style={styles.notificationTypeText}>
                    <Text style={styles.notificationTypeTitle}>
                      {typeInfo.title}
                      {typeInfo.critical && (
                        <Text style={styles.criticalLabel}> • Critical</Text>
                      )}
                    </Text>
                    <Text style={styles.notificationTypeDescription}>
                      {typeInfo.description}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.types[typeInfo.type]?.enabled || false}
                  onValueChange={(value) => handleTypeToggle(typeInfo.type, value)}
                  disabled={!preferences.enabled}
                />
              </View>

              {/* Delivery Channels */}
              {preferences.types[typeInfo.type]?.enabled && showAdvanced && (
                <View style={styles.channelsContainer}>
                  <Text style={styles.channelsTitle}>Delivery Methods</Text>
                  {DELIVERY_CHANNELS.map((channelInfo) => (
                    <View key={channelInfo.channel} style={styles.channelRow}>
                      <View style={styles.channelInfo}>
                        <Ionicons
                          name={channelInfo.icon}
                          size={16}
                          color="#666"
                          style={styles.channelIcon}
                        />
                        <Text style={styles.channelTitle}>{channelInfo.title}</Text>
                      </View>
                      <Switch
                        value={preferences.types[typeInfo.type]?.channels.includes(channelInfo.channel) || false}
                        onValueChange={(value) => handleChannelToggle(typeInfo.type, channelInfo.channel, value)}
                        disabled={!preferences.enabled}
                        style={styles.channelSwitch}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => setShowAdvanced(!showAdvanced)}
            style={styles.advancedToggle}
          >
            <Text style={styles.advancedToggleText}>Advanced Settings</Text>
            <Ionicons
              name={showAdvanced ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#007AFF"
            />
          </TouchableOpacity>

          {showAdvanced && (
            <>
              {/* Analytics */}
              {metrics && (
                <View style={styles.analyticsContainer}>
                  <Text style={styles.analyticsTitle}>Notification Statistics</Text>
                  <View style={styles.analyticsGrid}>
                    <View style={styles.analyticsItem}>
                      <Text style={styles.analyticsValue}>{metrics.deliveryRate}%</Text>
                      <Text style={styles.analyticsLabel}>Delivery Rate</Text>
                    </View>
                    <View style={styles.analyticsItem}>
                      <Text style={styles.analyticsValue}>{metrics.openRate}%</Text>
                      <Text style={styles.analyticsLabel}>Open Rate</Text>
                    </View>
                    <View style={styles.analyticsItem}>
                      <Text style={styles.analyticsValue}>{metrics.actionRate}%</Text>
                      <Text style={styles.analyticsLabel}>Action Rate</Text>
                    </View>
                    <View style={styles.analyticsItem}>
                      <Text style={styles.analyticsValue}>{metrics.errorRate}%</Text>
                      <Text style={styles.analyticsLabel}>Error Rate</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Reset Button */}
              <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                <Ionicons name="refresh" size={20} color="#FF3B30" />
                <Text style={styles.resetButtonText}>Reset to Defaults</Text>
              </TouchableOpacity>
            </>
          )}
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
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  permissionCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  enableButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  enableButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    padding: 16,
    paddingBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    color: '#666',
    lineHeight: 18,
  },
  quietHoursContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quietHoursLabel: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  changeTimeButton: {
    alignSelf: 'flex-start',
  },
  changeTimeText: {
    fontSize: 14,
    color: '#007AFF',
  },
  notificationTypeContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  notificationTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notificationTypeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationTypeText: {
    flex: 1,
  },
  notificationTypeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  criticalLabel: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  notificationTypeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  channelsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  channelsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  channelInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelIcon: {
    marginRight: 8,
  },
  channelTitle: {
    fontSize: 14,
    color: '#333',
  },
  channelSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  advancedToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  analyticsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  resetButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
});