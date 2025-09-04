import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { supabase } from '../../config/supabase';

interface ProfileForm {
  full_name: string;
  phone: string;
  location: string;
  bio: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  preferred_vet_clinic: string;
  preferred_language: string;
  timezone: string;
}

export const ProfileSettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetch } = useUserProfile();
  
  const [formData, setFormData] = useState<ProfileForm>({
    full_name: '',
    phone: '',
    location: '',
    bio: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    preferred_vet_clinic: '',
    preferred_language: 'en',
    timezone: 'America/New_York',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        location: profile.location_text || '',
        bio: profile.bio || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        preferred_vet_clinic: profile.preferred_vet_clinic || '',
        preferred_language: profile.preferred_language || 'en',
        timezone: profile.timezone || 'America/New_York',
      });
      setProfileImage(profile.avatar_url || null);
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openImagePicker('camera') },
        { text: 'Photo Library', onPress: () => openImagePicker('library') },
        ...(profileImage ? [{ text: 'Remove Photo', style: 'destructive', onPress: removeProfileImage }] : []),
      ]
    );
  };

  const openImagePicker = async (source: 'camera' | 'library') => {
    try {
      let result;
      
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Camera access is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Photo library access is required to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    setUploadingImage(true);
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile-${user?.id}-${Date.now()}.jpg`,
      } as any);

      // Upload to Supabase Storage
      const fileName = `profiles/${user?.id}/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('pet-photos')
        .upload(fileName, formData, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(fileName);

      const avatarUrl = publicUrlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      setProfileImage(avatarUrl);
      setHasChanges(true);
      
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeProfileImage = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      setProfileImage(null);
      setHasChanges(true);
      
      Alert.alert('Success', 'Profile photo removed successfully!');
    } catch (error) {
      console.error('Error removing image:', error);
      Alert.alert('Error', 'Failed to remove profile photo. Please try again.');
    }
  };

  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed to set your current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode[0]) {
        const address = reverseGeocode[0];
        const formattedLocation = [
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ');
        
        handleInputChange('location', formattedLocation);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      const updateData = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        location_text: formData.location.trim(),
        bio: formData.bio.trim(),
        emergency_contact_name: formData.emergency_contact_name.trim(),
        emergency_contact_phone: formData.emergency_contact_phone.trim(),
        preferred_vet_clinic: formData.preferred_vet_clinic.trim(),
        preferred_language: formData.preferred_language,
        timezone: formData.timezone,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      setHasChanges(false);
      await refetch();
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              if (profile) {
                setFormData({
                  full_name: profile.full_name || '',
                  phone: profile.phone || '',
                  location: profile.location_text || '',
                  bio: profile.bio || '',
                  emergency_contact_name: profile.emergency_contact_name || '',
                  emergency_contact_phone: profile.emergency_contact_phone || '',
                  preferred_vet_clinic: profile.preferred_vet_clinic || '',
                  preferred_language: profile.preferred_language || 'en',
                  timezone: profile.timezone || 'America/New_York',
                });
                setProfileImage(profile.avatar_url || null);
              }
              setHasChanges(false);
            },
          },
        ]
      );
    }
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, hasChanges && styles.cancelText]}>
            {hasChanges ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Profile Settings</Text>
        
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.headerButton, (!hasChanges || isSaving) && styles.disabledButton]}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[
              styles.headerButtonText,
              styles.saveText,
              (!hasChanges || isSaving) && styles.disabledText
            ]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity 
            onPress={handleImagePicker}
            style={styles.photoContainer}
            disabled={uploadingImage}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.defaultPhoto}>
                <Ionicons name="person" size={40} color="#8E8E93" />
              </View>
            )}
            
            <View style={styles.photoOverlay}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="camera" size={20} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>
          
          <Text style={styles.photoHint}>Tap to change profile photo</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.full_name}
              onChangeText={(text) => handleInputChange('full_name', text)}
              placeholder="Enter your full name"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput]}
              value={user?.email || ''}
              editable={false}
              placeholderTextColor="#C7C7CC"
            />
            <Text style={styles.inputHint}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              placeholder="Enter your phone number"
              placeholderTextColor="#C7C7CC"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelWithButton}>
              <Text style={styles.inputLabel}>Location</Text>
              <TouchableOpacity 
                onPress={getCurrentLocation}
                style={styles.locationButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <>
                    <Ionicons name="location" size={16} color="#007AFF" />
                    <Text style={styles.locationButtonText}>Current</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              placeholder="Enter your location"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.bio}
              onChangeText={(text) => handleInputChange('bio', text)}
              placeholder="Tell us about yourself and your pets"
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <Text style={styles.sectionDescription}>
            This person will be contacted in case of emergency with your pets
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contact Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.emergency_contact_name}
              onChangeText={(text) => handleInputChange('emergency_contact_name', text)}
              placeholder="Enter contact name"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contact Phone</Text>
            <TextInput
              style={styles.textInput}
              value={formData.emergency_contact_phone}
              onChangeText={(text) => handleInputChange('emergency_contact_phone', text)}
              placeholder="Enter contact phone number"
              placeholderTextColor="#C7C7CC"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Preferred Vet Clinic</Text>
            <TextInput
              style={styles.textInput}
              value={formData.preferred_vet_clinic}
              onChangeText={(text) => handleInputChange('preferred_vet_clinic', text)}
              placeholder="Enter your preferred veterinary clinic"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Language</Text>
            <TouchableOpacity style={styles.selectInput}>
              <Text style={styles.selectText}>
                {formData.preferred_language === 'en' ? 'English' : 
                 formData.preferred_language === 'es' ? 'Spanish' : 
                 formData.preferred_language === 'fr' ? 'French' : 'English'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Timezone</Text>
            <TouchableOpacity style={styles.selectInput}>
              <Text style={styles.selectText}>
                {formData.timezone.replace('_', ' ')}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#C7C7CC" />
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    minWidth: 60,
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  cancelText: {
    color: '#FF3B30',
  },
  saveText: {
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#C7C7CC',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  photoHint: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 6,
  },
  labelWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
  },
  locationButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  textInput: {
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  disabledInput: {
    backgroundColor: '#F2F2F7',
    color: '#8E8E93',
  },
  inputHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  selectText: {
    fontSize: 16,
    color: '#000',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ProfileSettingsScreen;