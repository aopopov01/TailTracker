import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { petService, PetPhoto } from '@/services/PetService';

interface PetPhotoGalleryProps {
  petId: string;
  onRefresh?: () => void;
}

export const PetPhotoGallery: React.FC<PetPhotoGalleryProps> = ({
  petId,
  onRefresh,
}) => {
  const [photos, setPhotos] = useState<PetPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PetPhoto | null>(null);
  const [photoLimits, setPhotoLimits] = useState({
    current: 0,
    max: 1,
    canUpload: false,
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    status: 'free',
    canUsePremiumFeatures: false,
  });

  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      const petPhotos = await petService.getPetPhotos(petId);
      setPhotos(petPhotos);
      setPhotoLimits(prev => ({ ...prev, current: petPhotos.length }));
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  const loadPhotoLimits = async () => {
    try {
      const limits = await petService.getPetPhotoLimits();
      setPhotoLimits(limits);
    } catch (error) {
      console.error('Error loading photo limits:', error);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const status = await petService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  const pickImage = async () => {
    try {
      // Check if user has reached photo limit
      if (photos.length >= photoLimits.max) {
        const upgradeMessage =
          photoLimits.max === 1
            ? 'Free tier allows 1 photo per pet. Upgrade to Premium for 12 photos per pet.'
            : 'You have reached the maximum of 12 photos per pet.';

        Alert.alert('Photo Limit Reached', upgradeMessage);
        return;
      }

      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Camera roll permission is needed to add photos'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      // Check if user has reached photo limit
      if (photos.length >= photoLimits.max) {
        const upgradeMessage =
          photoLimits.max === 1
            ? 'Free tier allows 1 photo per pet. Upgrade to Premium for 12 photos per pet.'
            : 'You have reached the maximum of 12 photos per pet.';

        Alert.alert('Photo Limit Reached', upgradeMessage);
        return;
      }

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Camera permission is needed to take photos'
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadPhoto = async (imageUri: string) => {
    try {
      setIsUploading(true);

      const result = await petService.uploadPetPhoto(petId, imageUri);

      if (!result.success) {
        Alert.alert('Upload Failed', result.error || 'Failed to upload photo');
        return;
      }

      // Refresh photos list
      await loadPhotos();
      onRefresh?.();

      Alert.alert('Success', 'Photo uploaded successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const setAsProfilePhoto = async (photo: PetPhoto) => {
    try {
      const result = await petService.setProfilePhoto(petId, photo.id);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to set profile photo');
        return;
      }

      // Refresh photos to update UI
      await loadPhotos();
      onRefresh?.();

      Alert.alert('Success', 'Profile photo updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set profile photo');
    }
  };

  const deletePhoto = async (photo: PetPhoto) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await petService.deletePetPhoto(photo.id);

            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to delete photo');
              return;
            }

            // Refresh photos list
            await loadPhotos();
            onRefresh?.();

            Alert.alert('Success', 'Photo deleted successfully');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete photo');
          }
        },
      },
    ]);
  };

  const showPhotoOptions = () => {
    Alert.alert('Add Photo', 'Choose an option', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
    ]);
  };

  const showPhotoActions = (photo: PetPhoto) => {
    const actions: {
      text: string;
      onPress?: () => void;
      style?: 'cancel' | 'default' | 'destructive';
    }[] = [{ text: 'Cancel', style: 'cancel' }];

    if (!photo.is_profile_photo) {
      actions.push({
        text: 'Set as Profile Photo',
        onPress: () => setAsProfilePhoto(photo),
      });
    }

    actions.push({
      text: 'Delete Photo',
      style: 'destructive',
      onPress: () => deletePhoto(photo),
    });

    Alert.alert('Photo Options', 'Choose an action', actions);
  };

  useEffect(() => {
    loadPhotos();
    loadPhotoLimits();
    loadSubscriptionStatus();
  }, [petId, loadPhotos]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#007AFF' />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos</Text>
        <View style={styles.photoCounter}>
          <Text style={styles.photoCountText}>
            {photos.length} of {photoLimits.max}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.photoScroll}
        contentContainerStyle={styles.photoScrollContent}
      >
        {/* Add photo button */}
        {photos.length < photoLimits.max && (
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={showPhotoOptions}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color='#007AFF' />
            ) : (
              <>
                <Text style={styles.addPhotoIcon}>+</Text>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Photo grid */}
        {photos.map(photo => (
          <TouchableOpacity
            key={photo.id}
            style={styles.photoContainer}
            onPress={() => setSelectedPhoto(photo)}
            onLongPress={() => showPhotoActions(photo)}
          >
            <Image source={{ uri: photo.photo_url }} style={styles.photo} />
            {photo.is_profile_photo && (
              <View style={styles.profileBadge}>
                <Text style={styles.profileBadgeText}>Profile</Text>
              </View>
            )}
            {photo.caption && (
              <Text style={styles.photoCaption} numberOfLines={2}>
                {photo.caption}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Free tier upgrade prompt */}
      {!subscriptionStatus.canUsePremiumFeatures &&
        photos.length >= photoLimits.max && (
          <View style={styles.upgradePrompt}>
            <Text style={styles.upgradeTitle}>📸 Want more photos?</Text>
            <Text style={styles.upgradeText}>
              Upgrade to Premium to add up to 12 photos per pet!
            </Text>
          </View>
        )}

      {/* Photo viewer modal */}
      <Modal
        visible={!!selectedPhoto}
        animationType='fade'
        transparent={true}
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setSelectedPhoto(null)}
          />
          {selectedPhoto && (
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedPhoto.photo_url }}
                style={styles.modalPhoto}
                resizeMode='contain'
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    showPhotoActions(selectedPhoto);
                    setSelectedPhoto(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Options</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCloseButton]}
                  onPress={() => setSelectedPhoto(null)}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  photoCounter: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoCountText: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C757D',
  },
  photoScroll: {
    marginBottom: 16,
  },
  photoScrollContent: {
    paddingHorizontal: 16,
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addPhotoIcon: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    textAlign: 'center',
  },
  photoContainer: {
    width: 120,
    marginRight: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  profileBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  photoCaption: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
    lineHeight: 16,
  },
  upgradePrompt: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCC02',
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: '#EF6C00',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalPhoto: {
    width: '100%',
    height: 300,
    backgroundColor: '#F8F9FA',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  modalCloseButton: {
    backgroundColor: '#6C757D',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
