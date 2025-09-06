import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AdvancedImage } from '@/components/Performance/AdvancedImage';
import { GPUFadeIn, GPUScaleIn, GPUBouncyTouch } from '@/components/Performance/GPUAnimations';
import { VirtualizedPetGallery } from '@/components/Performance/VirtualizedPetGallery';
import { performanceMonitor } from '@/services/PerformanceMonitor';
import { petService, PetPhoto } from '@/services/PetService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OptimizedPetPhotoGalleryProps {
  petId: string;
  onRefresh?: () => void;
}

export const OptimizedPetPhotoGallery = memo<OptimizedPetPhotoGalleryProps>(({
  petId,
  onRefresh
}) => {
  const [photos, setPhotos] = useState<PetPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PetPhoto | null>(null);
  const [photoLimits, setPhotoLimits] = useState({ current: 0, max: 1, canUpload: false });
  const [subscriptionStatus, setSubscriptionStatus] = useState({ 
    status: 'free', 
    canUsePremiumFeatures: false 
  });

  // Performance monitoring
  const recordRenderTime = useCallback((componentName: string) => {
    const startTime = Date.now();
    return () => {
      const renderTime = Date.now() - startTime;
      performanceMonitor.recordRenderTiming(componentName, renderTime);
    };
  }, []);

  useEffect(() => {
    const endRenderTiming = recordRenderTime('OptimizedPetPhotoGallery');
    loadPhotos();
    loadPhotoLimits();
    loadSubscriptionStatus();
    return endRenderTiming;
  }, [petId, recordRenderTime, loadPhotos, loadPhotoLimits, loadSubscriptionStatus]);

  const loadPhotos = useCallback(async () => {
    const loadStartTime = Date.now();
    try {
      setIsLoading(true);
      const petPhotos = await petService.getPetPhotos(petId);
      setPhotos(petPhotos);
      setPhotoLimits(prev => ({ ...prev, current: petPhotos.length }));
      
      // Record network performance
      performanceMonitor.recordNetworkTiming(
        `getPetPhotos/${petId}`,
        Date.now() - loadStartTime,
        petPhotos.length * 100 // Estimated size
      );
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos');
      
      performanceMonitor.recordMetric({
        name: 'photo_load_error',
        value: 1,
        timestamp: Date.now(),
        category: 'network',
        metadata: { petId, error: error.message },
      });
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  const loadPhotoLimits = useCallback(async () => {
    try {
      const limits = await petService.getPetPhotoLimits();
      setPhotoLimits(limits);
    } catch (error) {
      console.error('Error loading photo limits:', error);
    }
  }, []);

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      const status = await petService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  }, []);

  const pickImage = useCallback(async () => {
    const interactionStart = Date.now();
    
    try {
      // Check photo limit
      if (photos.length >= photoLimits.max) {
        const upgradeMessage = photoLimits.max === 1 
          ? 'Free tier allows 1 photo per pet. Upgrade to Premium for 12 photos per pet.'
          : 'You have reached the maximum of 12 photos per pet.';
        
        Alert.alert('Photo Limit Reached', upgradeMessage);
        return;
      }

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permission is needed to add photos');
        return;
      }

      // Launch image picker with optimized settings
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Balanced quality for performance
        allowsMultipleSelection: false, // Prevent memory issues
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
      
      // Record interaction performance
      performanceMonitor.recordInteractionTiming(
        'pick_image',
        Date.now() - interactionStart,
        'photo_gallery'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  }, [photos.length, photoLimits.max, uploadPhoto]);

  const takePhoto = useCallback(async () => {
    const interactionStart = Date.now();
    
    try {
      // Check photo limit
      if (photos.length >= photoLimits.max) {
        const upgradeMessage = photoLimits.max === 1 
          ? 'Free tier allows 1 photo per pet. Upgrade to Premium for 12 photos per pet.'
          : 'You have reached the maximum of 12 photos per pet.';
        
        Alert.alert('Photo Limit Reached', upgradeMessage);
        return;
      }

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is needed to take photos');
        return;
      }

      // Launch camera with optimized settings
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
      
      // Record interaction performance
      performanceMonitor.recordInteractionTiming(
        'take_photo',
        Date.now() - interactionStart,
        'camera'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error('Camera error:', error);
    }
  }, [photos.length, photoLimits.max, uploadPhoto]);

  const uploadPhoto = useCallback(async (imageUri: string) => {
    const uploadStart = Date.now();
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
      
      // Record upload performance
      performanceMonitor.recordNetworkTiming(
        'uploadPetPhoto',
        Date.now() - uploadStart
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload photo');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [petId, loadPhotos, onRefresh]);

  const handlePhotoPress = useCallback((photo: PetPhoto, index: number) => {
    const interactionStart = Date.now();
    setSelectedPhoto(photo);
    
    performanceMonitor.recordInteractionTiming(
      'photo_press',
      Date.now() - interactionStart,
      'photo_modal'
    );
  }, []);

  const handlePhotoLongPress = useCallback((photo: PetPhoto, index: number) => {
    const actions = [
      { text: 'Cancel', style: 'cancel' as const },
    ];

    if (!photo.is_profile_photo) {
      actions.push({
        text: 'Set as Profile Photo',
        onPress: () => setAsProfilePhoto(photo),
      });
    }

    actions.push({
      text: 'Delete Photo',
      style: 'destructive' as const,
      onPress: () => deletePhoto(photo),
    });

    Alert.alert('Photo Options', 'Choose an action', actions);
  }, [deletePhoto, setAsProfilePhoto]);

  const setAsProfilePhoto = useCallback(async (photo: PetPhoto) => {
    try {
      const result = await petService.setProfilePhoto(petId, photo.id);
      
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to set profile photo');
        return;
      }

      await loadPhotos();
      onRefresh?.();
      
      Alert.alert('Success', 'Profile photo updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set profile photo');
    }
  }, [petId, loadPhotos, onRefresh]);

  const deletePhoto = useCallback(async (photo: PetPhoto) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
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

              await loadPhotos();
              onRefresh?.();
              
              Alert.alert('Success', 'Photo deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete photo');
            }
          }
        }
      ]
    );
  }, [loadPhotos, onRefresh]);

  const showPhotoOptions = useCallback(() => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
      ]
    );
  }, [takePhoto, pickImage]);

  // Memoized components for better performance
  const headerComponent = useMemo(() => (
    <View style={styles.header}>
      <GPUFadeIn delay={100}>
        <Text style={styles.title}>Photos</Text>
      </GPUFadeIn>
      <GPUFadeIn delay={200}>
        <View style={styles.photoCounter}>
          <Text style={styles.photoCountText}>
            {photos.length} of {photoLimits.max}
          </Text>
        </View>
      </GPUFadeIn>
    </View>
  ), [photos.length, photoLimits.max]);

  const addPhotoButton = useMemo(() => {
    if (photos.length >= photoLimits.max) return null;
    
    return (
      <GPUScaleIn delay={300}>
        <GPUBouncyTouch onPress={showPhotoOptions}>
          <View style={styles.addPhotoButton}>
            {isUploading ? (
              <Text style={styles.addPhotoText}>Uploading...</Text>
            ) : (
              <>
                <Text style={styles.addPhotoIcon}>+</Text>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </>
            )}
          </View>
        </GPUBouncyTouch>
      </GPUScaleIn>
    );
  }, [photos.length, photoLimits.max, isUploading, showPhotoOptions]);

  const upgradePrompt = useMemo(() => {
    if (subscriptionStatus.canUsePremiumFeatures || photos.length < photoLimits.max) {
      return null;
    }

    return (
      <GPUFadeIn delay={500}>
        <View style={styles.upgradePrompt}>
          <Text style={styles.upgradeTitle}>📸 Want more photos?</Text>
          <Text style={styles.upgradeText}>
            Upgrade to Premium to add up to 12 photos per pet!
          </Text>
        </View>
      </GPUFadeIn>
    );
  }, [subscriptionStatus.canUsePremiumFeatures, photos.length, photoLimits.max]);

  if (isLoading) {
    return (
      <GPUFadeIn>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      </GPUFadeIn>
    );
  }

  return (
    <View style={styles.container}>
      {headerComponent}
      
      <View style={styles.content}>
        {addPhotoButton}
        
        <VirtualizedPetGallery
          photos={photos}
          numColumns={2}
          itemHeight={180}
          spacing={12}
          onPhotoPress={handlePhotoPress}
          onPhotoLongPress={handlePhotoLongPress}
          keyExtractor={(item, index) => `photo-${item.id || index}`}
        />
      </View>

      {upgradePrompt}

      {/* Optimized Photo Viewer Modal */}
      <Modal
        visible={!!selectedPhoto}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setSelectedPhoto(null)}
          />
          {selectedPhoto && (
            <GPUScaleIn>
              <View style={styles.modalContent}>
                <AdvancedImage
                  source={{ uri: selectedPhoto.photo_url }}
                  style={styles.modalPhoto}
                  contentFit="contain"
                  priority="high"
                  progressive
                  fadeDuration={200}
                />
                <View style={styles.modalActions}>
                  <GPUBouncyTouch
                    onPress={() => {
                      handlePhotoLongPress(selectedPhoto, 0);
                      setSelectedPhoto(null);
                    }}
                  >
                    <View style={styles.modalButton}>
                      <Text style={styles.modalButtonText}>Options</Text>
                    </View>
                  </GPUBouncyTouch>
                  
                  <GPUBouncyTouch onPress={() => setSelectedPhoto(null)}>
                    <View style={[styles.modalButton, styles.modalCloseButton]}>
                      <Text style={styles.modalCloseText}>Close</Text>
                    </View>
                  </GPUBouncyTouch>
                </View>
              </View>
            </GPUScaleIn>
          )}
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addPhotoButton: {
    alignSelf: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    paddingVertical: 20,
    paddingHorizontal: 30,
    marginBottom: 16,
    alignItems: 'center',
  },
  addPhotoIcon: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  upgradePrompt: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginBottom: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 12,
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
    width: SCREEN_WIDTH * 0.9,
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
    alignItems: 'center',
  },
  modalCloseButton: {
    backgroundColor: '#6C757D',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

OptimizedPetPhotoGallery.displayName = 'OptimizedPetPhotoGallery';