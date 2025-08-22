import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
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
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingItem
          icon="person-outline"
          title="Profile"
          subtitle="Manage your account details"
        />
        <SettingItem
          icon="card-outline"
          title="Subscription"
          subtitle="Manage your premium plan"
        />
        <SettingItem
          icon="people-outline"
          title="Family Sharing"
          subtitle="Share pet access with family"
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          icon="notifications-outline"
          title="Push Notifications"
          subtitle="Configure alert preferences"
        />
        <SettingItem
          icon="location-outline"
          title="Location Alerts"
          subtitle="Safe zone and tracking alerts"
        />
        <SettingItem
          icon="heart-outline"
          title="Health Reminders"
          subtitle="Vet appointments and medications"
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Safety</Text>
        <SettingItem
          icon="shield-outline"
          title="Privacy Settings"
          subtitle="Control data sharing and visibility"
        />
        <SettingItem
          icon="lock-closed-outline"
          title="Security"
          subtitle="Password and biometric settings"
        />
        <SettingItem
          icon="document-text-outline"
          title="Terms & Privacy Policy"
          subtitle="Legal information and policies"
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <SettingItem
          icon="help-circle-outline"
          title="Help Center"
          subtitle="FAQs and support articles"
        />
        <SettingItem
          icon="chatbubble-outline"
          title="Contact Support"
          subtitle="Get help from our team"
        />
        <SettingItem
          icon="star-outline"
          title="Rate TailTracker"
          subtitle="Share your experience"
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <SettingItem
          icon="information-circle-outline"
          title="About"
          subtitle="Version 1.0.0"
        />
        <SettingItem
          icon="refresh-outline"
          title="Reset App Data"
          subtitle="Clear all local data"
        />
      </View>
      
      <TouchableOpacity style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
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