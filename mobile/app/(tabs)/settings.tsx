import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TailTrackerModal } from '../../src/components/UI/TailTrackerModal';

export default function SettingsScreen() {
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    actions?: {
      text: string;
      style?: 'default' | 'destructive' | 'primary';
      onPress: () => void;
    }[];
    icon?: keyof typeof Ionicons.glyphMap;
  }>({
    visible: false,
    title: '',
    actions: []
  });

  const showModal = (config: typeof modalConfig) => {
    setModalConfig({ ...config, visible: true });
  };

  const hideModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  // Handler functions for each setting
  const handleProfile = () => {
    router.push('/profile' as any);
  };

  const handleSubscription = () => {
    router.push('/subscription' as any);
  };

  const handleFamilySharing = () => {
    showModal({
      visible: true,
      title: 'Family Sharing',
      message: 'Family sharing features will be available soon!',
      type: 'info',
      icon: 'people',
      actions: [{ text: 'Got it', style: 'primary', onPress: hideModal }]
    });
  };

  const handleNotifications = () => {
    router.push('/notifications' as any);
  };

  const handleLocationAlerts = () => {
    showModal({
      visible: true,
      title: 'Location Alerts',
      message: 'Location alert settings coming soon!',
      type: 'info',
      icon: 'location',
      actions: [{ text: 'Got it', style: 'primary', onPress: hideModal }]
    });
  };

  const handleHealthReminders = () => {
    showModal({
      visible: true,
      title: 'Health Reminders',
      message: 'Health reminder configuration will be available soon!',
      type: 'info',
      icon: 'heart',
      actions: [{ text: 'Got it', style: 'primary', onPress: hideModal }]
    });
  };

  const handlePrivacySettings = () => {
    router.push('/privacy' as any);
  };

  const handleSecurity = () => {
    router.push('/security' as any);
  };

  const handleTermsPrivacy = () => {
    router.push('/legal' as any);
  };

  const handleHelpCenter = () => {
    router.push('/help' as any);
  };

  const handleContactSupport = () => {
    showModal({
      visible: true,
      title: 'Contact Support',
      message: 'For support, please email: support@tailtracker.app',
      type: 'info',
      icon: 'chatbubble',
      actions: [{ text: 'Got it', style: 'primary', onPress: hideModal }]
    });
  };

  const handleRateApp = () => {
    showModal({
      visible: true,
      title: 'Rate TailTracker',
      message: 'App store rating functionality will be available after release!',
      type: 'info',
      icon: 'star',
      actions: [{ text: 'Got it', style: 'primary', onPress: hideModal }]
    });
  };

  const handleAbout = () => {
    showModal({
      visible: true,
      title: 'About TailTracker',
      message: 'TailTracker v1.0.0\n\nA comprehensive pet management app for loving pet owners.\n\nDeveloped with ❤️ for pets everywhere.',
      type: 'info',
      icon: 'information-circle',
      actions: [{ text: 'Got it', style: 'primary', onPress: hideModal }]
    });
  };

  const handleResetData = () => {
    showModal({
      visible: true,
      title: 'Reset App Data',
      message: 'This will permanently delete all your data. Are you sure?',
      type: 'warning',
      icon: 'warning',
      actions: [
        { text: 'Cancel', style: 'default', onPress: hideModal },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            hideModal();
            setTimeout(() => {
              showModal({
                visible: true,
                title: 'Data Reset',
                message: 'Data reset functionality will be available in the next update!',
                type: 'info',
                icon: 'refresh',
                actions: [{ text: 'Got it', style: 'primary', onPress: hideModal }]
              });
            }, 300);
          }
        }
      ]
    });
  };

  const handleSignOut = () => {
    showModal({
      visible: true,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      type: 'warning',
      icon: 'log-out',
      actions: [
        { text: 'Cancel', style: 'default', onPress: hideModal },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            hideModal();
            setTimeout(() => {
              showModal({
                visible: true,
                title: 'Sign Out',
                message: 'Sign out functionality will be available in the next update!',
                type: 'info',
                icon: 'log-out',
                actions: [{ text: 'Got it', style: 'primary', onPress: hideModal }]
              });
            }, 300);
          }
        }
      ]
    });
  };

  const SettingItem = ({ icon, title, subtitle, onPress }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color="#2196F3" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingItem
            icon="person-outline"
            title="Profile"
            subtitle="Manage your account details"
            onPress={handleProfile}
          />
          <SettingItem
            icon="card-outline"
            title="Subscription"
            subtitle="Manage your premium plan"
            onPress={handleSubscription}
          />
          <SettingItem
            icon="people-outline"
            title="Family Sharing"
            subtitle="Share pet access with family"
            onPress={handleFamilySharing}
          />
          <SettingItem
            icon="qr-code-outline"
            title="QR Code Sharing"
            subtitle="Manage pet information sharing"
            onPress={() => router.push('/sharing' as any)}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Configure alert preferences"
            onPress={handleNotifications}
          />
          <SettingItem
            icon="location-outline"
            title="Location Alerts"
            subtitle="Safe zone and tracking alerts"
            onPress={handleLocationAlerts}
          />
          <SettingItem
            icon="heart-outline"
            title="Health Reminders"
            subtitle="Vet appointments and medications"
            onPress={handleHealthReminders}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Safety</Text>
          <SettingItem
            icon="shield-outline"
            title="Privacy Settings"
            subtitle="Control data sharing and visibility"
            onPress={handlePrivacySettings}
          />
          <SettingItem
            icon="lock-closed-outline"
            title="Security"
            subtitle="Password and biometric settings"
            onPress={handleSecurity}
          />
          <SettingItem
            icon="document-text-outline"
            title="Terms & Privacy Policy"
            subtitle="Legal information and policies"
            onPress={handleTermsPrivacy}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingItem
            icon="help-circle-outline"
            title="Help Center"
            subtitle="FAQs and support articles"
            onPress={handleHelpCenter}
          />
          <SettingItem
            icon="chatbubble-outline"
            title="Contact Support"
            subtitle="Get help from our team"
            onPress={handleContactSupport}
          />
          <SettingItem
            icon="star-outline"
            title="Rate TailTracker"
            subtitle="Share your experience"
            onPress={handleRateApp}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <SettingItem
            icon="information-circle-outline"
            title="About"
            subtitle="Version 1.0.0"
            onPress={handleAbout}
          />
          <SettingItem
            icon="refresh-outline"
            title="Reset App Data"
            subtitle="Clear all local data"
            onPress={handleResetData}
          />
        </View>
        
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        actions={modalConfig.actions}
        icon={modalConfig.icon}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 20,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: '#F44336',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});