import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import {
  Text,
  useTheme,
  Card,
  Avatar,
  Button,
  Divider,
  Switch,
  ActivityIndicator
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  location?: string;
  joinDate: Date;
  preferences: {
    notifications: boolean;
    locationSharing: boolean;
    emailUpdates: boolean;
    biometricAuth: boolean;
  };
}

interface ProfileStat {
  label: string;
  value: string | number;
  icon: string;
}

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Mock profile data - replace with actual API call
      const mockProfile: UserProfile = {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        avatar: undefined,
        location: 'San Francisco, CA',
        joinDate: new Date('2024-01-15'),
        preferences: {
          notifications: true,
          locationSharing: true,
          emailUpdates: false,
          biometricAuth: true,
        },
      };

      // Load any saved preferences
      const savedPreferences = await AsyncStorage.getItem('userPreferences');
      if (savedPreferences) {
        mockProfile.preferences = { ...mockProfile.preferences, ...JSON.parse(savedPreferences) };
      }

      setProfile(mockProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof UserProfile['preferences'], value: boolean) => {
    if (!profile) return;

    setSavingPreferences(true);
    
    const updatedPreferences = {
      ...profile.preferences,
      [key]: value,
    };

    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));
      
      // Update state
      setProfile({
        ...profile,
        preferences: updatedPreferences,
      });

      // Show confirmation for critical settings
      if (key === 'biometricAuth' && value) {
        Alert.alert(
          'Biometric Authentication',
          'Biometric authentication has been enabled for added security.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to update preference:', error);
      Alert.alert('Error', 'Failed to update preference');
    } finally {
      setSavingPreferences(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && profile) {
      setProfile({
        ...profile,
        avatar: result.assets[0].uri,
      });
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userAvatar', result.assets[0].uri);
    }
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Profile editing feature coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            // Clear user data
            await AsyncStorage.clear();
            // Navigate to auth screen - implement navigation logic
            console.log('User signed out');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="account-off" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Failed to load profile
          </Text>
          <Button mode="contained" onPress={loadProfile} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const stats: ProfileStat[] = [
    { label: 'Pets', value: 3, icon: 'paw' },
    { label: 'Days Active', value: Math.ceil((Date.now() - profile.joinDate.getTime()) / (1000 * 60 * 60 * 24)), icon: 'calendar' },
    { label: 'Vaccinations', value: 12, icon: 'medical-bag' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <Avatar.Icon 
                size={80} 
                icon="account" 
                style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]} 
              />
            )}
            <View style={[styles.avatarBadge, { backgroundColor: theme.colors.secondary }]}>
              <Icon name="camera" size={16} color={theme.colors.onSecondary} />
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.name, { color: theme.colors.onPrimary }]}>
            {profile.name}
          </Text>
          <Text style={[styles.email, { color: theme.colors.onPrimary }]}>
            {profile.email}
          </Text>
          
          <Button 
            mode="contained-tonal" 
            onPress={handleEditProfile}
            style={styles.editButton}
            labelStyle={{ color: theme.colors.primary }}
          >
            Edit Profile
          </Button>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
              <Icon name={stat.icon} size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Profile Information */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Profile Information
            </Text>
            
            <View style={styles.infoRow}>
              <Icon name="phone" size={20} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                Phone
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                {profile.phone || 'Not provided'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Icon name="map-marker" size={20} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                Location
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                {profile.location || 'Not set'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Icon name="calendar-plus" size={20} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                Joined
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                {profile.joinDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Preferences */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Preferences
            </Text>
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLabel}>
                <Icon name="bell" size={20} color={theme.colors.onSurfaceVariant} />
                <View style={styles.preferenceText}>
                  <Text style={[styles.preferenceTitle, { color: theme.colors.onSurface }]}>
                    Push Notifications
                  </Text>
                  <Text style={[styles.preferenceSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Receive alerts about your pets
                  </Text>
                </View>
              </View>
              <Switch
                value={profile.preferences.notifications}
                onValueChange={(value) => updatePreference('notifications', value)}
                disabled={savingPreferences}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLabel}>
                <Icon name="map-marker-radius" size={20} color={theme.colors.onSurfaceVariant} />
                <View style={styles.preferenceText}>
                  <Text style={[styles.preferenceTitle, { color: theme.colors.onSurface }]}>
                    Location Sharing
                  </Text>
                  <Text style={[styles.preferenceSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Help find lost pets in your area
                  </Text>
                </View>
              </View>
              <Switch
                value={profile.preferences.locationSharing}
                onValueChange={(value) => updatePreference('locationSharing', value)}
                disabled={savingPreferences}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLabel}>
                <Icon name="email" size={20} color={theme.colors.onSurfaceVariant} />
                <View style={styles.preferenceText}>
                  <Text style={[styles.preferenceTitle, { color: theme.colors.onSurface }]}>
                    Email Updates
                  </Text>
                  <Text style={[styles.preferenceSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Receive newsletters and updates
                  </Text>
                </View>
              </View>
              <Switch
                value={profile.preferences.emailUpdates}
                onValueChange={(value) => updatePreference('emailUpdates', value)}
                disabled={savingPreferences}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLabel}>
                <Icon name="fingerprint" size={20} color={theme.colors.onSurfaceVariant} />
                <View style={styles.preferenceText}>
                  <Text style={[styles.preferenceTitle, { color: theme.colors.onSurface }]}>
                    Biometric Authentication
                  </Text>
                  <Text style={[styles.preferenceSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Use fingerprint or Face ID
                  </Text>
                </View>
              </View>
              <Switch
                value={profile.preferences.biometricAuth}
                onValueChange={(value) => updatePreference('biometricAuth', value)}
                disabled={savingPreferences}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Help', 'Help center coming soon!')}
            style={[styles.actionButton, { borderColor: theme.colors.outline }]}
            icon="help-circle-outline"
          >
            Help & Support
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon!')}
            style={[styles.actionButton, { borderColor: theme.colors.outline }]}
            icon="shield-account"
          >
            Privacy & Security
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSignOut}
            style={[styles.actionButton, styles.signOutButton, { backgroundColor: theme.colors.error }]}
            labelStyle={{ color: theme.colors.onError }}
            icon="logout"
          >
            Sign Out
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 16,
  },
  editButton: {
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    minWidth: (width - 64) / 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  preferenceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceText: {
    marginLeft: 12,
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  preferenceSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    marginVertical: 12,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  actionButton: {
    marginVertical: 8,
  },
  signOutButton: {
    marginTop: 16,
  },
});