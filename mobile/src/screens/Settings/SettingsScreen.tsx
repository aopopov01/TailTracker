import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useAuth } from '../../hooks/useAuth';
import { usePremiumStatus } from '../../hooks/usePremiumStatus';
import { useUserProfile } from '../../hooks/useUserProfile';

type RootStackParamList = {
  ProfileSettings: undefined;
  NotificationSettings: undefined;
  PrivacySettings: undefined;
  SecuritySettings: undefined;
  SubscriptionManagement: undefined;
  AppPreferences: undefined;
  DataManagement: undefined;
  Support: undefined;
  About: undefined;
};

interface SettingsSection {
  title: string;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  type: 'navigation' | 'toggle' | 'action' | 'info';
  screen?: keyof RootStackParamList;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  badge?: string | number;
  premium?: boolean;
  dangerous?: boolean;
}

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus();
  const { settings, updateSetting, loading: settingsLoading } = useAppSettings();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You will need to sign in again to access your pets.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your pet data, photos, and settings will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Navigate to delete account flow
            navigation.navigate('DataManagement');
          },
        },
      ]
    );
  };

  const handleUpgradeToPremium = () => {
    navigation.navigate('SubscriptionManagement');
  };

  const settingsSections: SettingsSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile Settings',
          description: 'Update your personal information',
          icon: 'person-circle',
          iconColor: '#007AFF',
          type: 'navigation',
          screen: 'ProfileSettings',
        },
        {
          id: 'subscription',
          title: isPremium ? 'Manage Subscription' : 'Upgrade to Premium',
          description: isPremium ? 'View billing and subscription details' : 'Unlock unlimited pets and premium features',
          icon: isPremium ? 'diamond' : 'diamond-outline',
          iconColor: isPremium ? '#FF9500' : '#34C759',
          type: 'navigation',
          screen: 'SubscriptionManagement',
          badge: !isPremium ? 'New' : undefined,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          description: 'Push notifications and alerts',
          icon: 'notifications',
          iconColor: '#FF9500',
          type: 'navigation',
          screen: 'NotificationSettings',
        },
        {
          id: 'app_preferences',
          title: 'App Preferences',
          description: 'Theme, language, and display options',
          icon: 'settings',
          iconColor: '#8E8E93',
          type: 'navigation',
          screen: 'AppPreferences',
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          id: 'privacy',
          title: 'Privacy Settings',
          description: 'Data collection and sharing preferences',
          icon: 'shield-checkmark',
          iconColor: '#34C759',
          type: 'navigation',
          screen: 'PrivacySettings',
        },
        {
          id: 'security',
          title: 'Security',
          description: 'Biometric authentication and security',
          icon: 'lock-closed',
          iconColor: '#FF3B30',
          type: 'navigation',
          screen: 'SecuritySettings',
        },
        {
          id: 'location_sharing',
          title: 'Location Sharing',
          description: 'Share location for lost pet alerts',
          icon: 'location',
          iconColor: '#007AFF',
          type: 'toggle',
          value: settings?.locationSharingEnabled || false,
          onToggle: (value) => updateSetting('locationSharingEnabled', value),
        },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        {
          id: 'data_management',
          title: 'Data Management',
          description: 'Export, backup, and delete data',
          icon: 'cloud-download',
          iconColor: '#007AFF',
          type: 'navigation',
          screen: 'DataManagement',
        },
        {
          id: 'offline_mode',
          title: 'Offline Mode',
          description: 'Access pet data without internet',
          icon: 'cloud-offline',
          iconColor: '#8E8E93',
          type: 'toggle',
          value: settings?.offlineMode || false,
          onToggle: (value) => updateSetting('offlineMode', value),
          premium: true,
        },
        {
          id: 'auto_sync',
          title: 'Auto Sync',
          description: 'Automatically sync data when connected',
          icon: 'sync',
          iconColor: '#34C759',
          type: 'toggle',
          value: settings?.autoSync !== false,
          onToggle: (value) => updateSetting('autoSync', value),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'about',
          title: 'About TailTracker',
          description: 'Version, terms, and privacy policy',
          icon: 'information-circle',
          iconColor: '#8E8E93',
          type: 'navigation',
          screen: 'About',
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          id: 'sign_out',
          title: 'Sign Out',
          description: 'Sign out of your account',
          icon: 'log-out',
          iconColor: '#FF9500',
          type: 'action',
          onPress: handleSignOut,
        },
        {
          id: 'delete_account',
          title: 'Delete Account',
          description: 'Permanently delete your account and data',
          icon: 'trash',
          iconColor: '#FF3B30',
          type: 'action',
          onPress: handleDeleteAccount,
          dangerous: true,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    const isPremiumFeature = item.premium && !isPremium;
    const isDisabled = isPremiumFeature || settingsLoading;

    const handlePress = () => {
      if (isPremiumFeature) {
        Alert.alert(
          'Premium Feature',
          'This feature is available with TailTracker Premium. Upgrade to unlock all features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: handleUpgradeToPremium },
          ]
        );
        return;
      }

      if (item.screen) {
        navigation.navigate(item.screen);
      } else if (item.onPress) {
        item.onPress();
      }
    };

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingItem,
          isDisabled && styles.settingItemDisabled,
          item.dangerous && styles.dangerousItem,
        ]}
        onPress={handlePress}
        disabled={isDisabled}
      >
        <View style={styles.settingItemContent}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: `${item.iconColor}20` }
          ]}>
            <Ionicons 
              name={item.icon} 
              size={22} 
              color={isDisabled ? '#C7C7CC' : item.iconColor} 
            />
            {isPremiumFeature && (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={12} color="#FF9500" />
              </View>
            )}
          </View>
          
          <View style={styles.settingTextContainer}>
            <View style={styles.settingTitleRow}>
              <Text style={[
                styles.settingTitle,
                isDisabled && styles.disabledText,
                item.dangerous && styles.dangerousText,
              ]}>
                {item.title}
              </Text>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </View>
            {item.description && (
              <Text style={[
                styles.settingDescription,
                isDisabled && styles.disabledText,
              ]}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.settingAction}>
          {item.type === 'toggle' ? (
            <Switch
              value={item.value || false}
              onValueChange={item.onToggle}
              disabled={isDisabled}
              trackColor={{ false: '#F2F2F7', true: '#007AFF20' }}
              thumbColor={item.value ? '#007AFF' : '#FFF'}
            />
          ) : (
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={isDisabled ? '#C7C7CC' : '#C7C7CC'} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (section: SettingsSection) => (
    <View key={section.title} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionContent}>
        {section.items.map(renderSettingItem)}
      </View>
    </View>
  );

  if (profileLoading || premiumLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {profile?.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.defaultProfileImage}>
                <Ionicons name="person" size={40} color="#8E8E93" />
              </View>
            )}
            {isPremium && (
              <View style={styles.premiumIndicator}>
                <Ionicons name="diamond" size={16} color="#FF9500" />
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {isPremium && (
              <View style={styles.premiumLabel}>
                <Ionicons name="diamond" size={12} color="#FF9500" />
                <Text style={styles.premiumText}>Premium Member</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('ProfileSettings')}
          >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {settingsSections.map(renderSection)}

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>TailTracker v1.0.0</Text>
          <Text style={styles.buildText}>Build 100</Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Sign Out Loading Overlay */}
      {isSigningOut && (
        <View style={styles.signOutOverlay}>
          <View style={styles.signOutContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.signOutText}>Signing out...</Text>
          </View>
        </View>
      )}
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
  profileHeader: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  premiumLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
    marginLeft: 4,
  },
  editProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F2F2F7',
  },
  settingItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  dangerousItem: {
    backgroundColor: '#FFF5F5',
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  dangerousText: {
    color: '#FF3B30',
  },
  disabledText: {
    color: '#C7C7CC',
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    lineHeight: 18,
  },
  badge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  settingAction: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  buildText: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  bottomSpacing: {
    height: 40,
  },
  signOutOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutContent: {
    backgroundColor: '#FFF',
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    marginTop: 12,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
});

export default SettingsScreen;