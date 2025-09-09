import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';
import { supabase } from '@/services/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - spacing.md * 4) / 3;

interface PhotoItem {
  id: string;
  url: string;
  filename: string;
  created_at: string;
  size?: number;
}

export default function PhotoGalleryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const petId = (route.params as any)?.petId;
  const petName = (route.params as any)?.petName || 'Pet';

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Animation values for photo viewer
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const loadPhotos = useCallback(async () => {
    try {
      const { data: photoList, error } = await supabase.storage
        .from('pet-photos')
        .list(`pets/${petId}`, { 
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const photoItems: PhotoItem[] = await Promise.all(
        (photoList || []).map(async (photo) => {
          const { data } = supabase.storage
            .from('pet-photos')
            .getPublicUrl(`pets/${petId}/${photo.name}`);
          
          return {
            id: photo.name,
            url: data.publicUrl,
            filename: photo.name,
            created_at: photo.created_at || new Date().toISOString(),
            size: photo.metadata?.size,
          };
        })
      );

      setPhotos(photoItems);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [petId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPhotos();
  };

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [loadPhotos])
  );

  const addPhotos = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please grant photo library access to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: undefined,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        setUploading(true);
        
        for (const asset of result.assets) {
          const fileExt = asset.uri.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          const filePath = `pets/${petId}/${fileName}`;

          // Create FormData for upload
          const formData = new FormData();
          formData.append('file', {
            uri: asset.uri,
            name: fileName,
            type: `image/${fileExt}`,
          } as any);

          const { error } = await supabase.storage
            .from('pet-photos')
            .upload(filePath, formData, {
              contentType: `image/${fileExt}`,
              upsert: false,
            });

          if (error) {
            console.error('Upload error:', error);
          }
        }

        // Reload photos after upload
        loadPhotos();
        Alert.alert('Success', `${result.assets.length} photo(s) added successfully!`);
      }
    } catch (error) {
      console.error('Error adding photos:', error);
      Alert.alert('Error', 'Failed to add photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please grant camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const asset = result.assets[0];
        
        const fileExt = asset.uri.split('.').pop();
        const fileName = `${Date.now()}-camera.${fileExt}`;
        const filePath = `pets/${petId}/${fileName}`;

        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: fileName,
          type: `image/${fileExt}`,
        } as any);

        const { error } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, formData, {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (error) throw error;

        loadPhotos();
        Alert.alert('Success', 'Photo captured and saved!');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to save photo.');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photo: PhotoItem) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.storage
                .from('pet-photos')
                .remove([`pets/${petId}/${photo.filename}`]);

              if (error) throw error;
              
              setPhotos(prev => prev.filter(p => p.id !== photo.id));
              setIsViewerOpen(false);
              Alert.alert('Success', 'Photo deleted.');
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo.');
            }
          },
        },
      ]
    );
  };


  const saveToDevice = async (photo: PhotoItem) => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please grant photo library access to save photos.');
        return;
      }

      // Download and save photo
      const asset = await MediaLibrary.createAssetAsync(photo.url);
      await MediaLibrary.createAlbumAsync(`TailTracker - ${petName}`, asset, false);
      
      Alert.alert('Success', 'Photo saved to your photo library!');
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo to device.');
    }
  };

  const openPhotoViewer = (photo: PhotoItem) => {
    setSelectedPhoto(photo);
    setIsViewerOpen(true);
    // Reset animation values
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
  };

  const closePhotoViewer = () => {
    setIsViewerOpen(false);
    setSelectedPhoto(null);
  };

  const pinchHandler = useAnimatedGestureHandler({
    onStart: () => {
      // No specific start action needed
    },
    onActive: (event) => {
      scale.value = Math.max(1, Math.min((event as any).scale, 3));
    },
    onEnd: () => {
      if (scale.value < 1.2) {
        scale.value = withSpring(1);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color={colors.white} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>{petName}'s Photos</Text>
      
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton} onPress={takePhoto}>
          <Ionicons name="camera" size={20} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={addPhotos}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPhotoItem = ({ item }: { item: PhotoItem }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => openPhotoViewer(item)}
    >
      <Image source={{ uri: item.url }} style={styles.photoThumbnail} />
      <View style={styles.photoOverlay}>
        <Text style={styles.photoDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="images" size={64} color={colors.gray300} />
      <Text style={styles.emptyTitle}>No Photos Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start building {petName}'s photo collection!
      </Text>
      <View style={styles.emptyActions}>
        <TouchableOpacity style={styles.emptyActionButton} onPress={takePhoto}>
          <Ionicons name="camera" size={20} color={colors.white} />
          <Text style={styles.emptyActionButtonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.emptyActionButton, styles.secondaryButton]} 
          onPress={addPhotos}
        >
          <Ionicons name="images" size={20} color={colors.primary} />
          <Text style={[styles.emptyActionButtonText, styles.secondaryButtonText]}>
            Add Photos
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPhotoViewer = () => (
    <Modal
      visible={isViewerOpen}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <View style={styles.viewerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
        
        <View style={styles.viewerHeader}>
          <TouchableOpacity style={styles.viewerButton} onPress={closePhotoViewer}>
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.viewerTitle}>
            {selectedPhoto && new Date(selectedPhoto.created_at).toLocaleDateString()}
          </Text>
        </View>

        {selectedPhoto && (
          <PinchGestureHandler onGestureEvent={pinchHandler as any}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <Image source={{ uri: selectedPhoto.url }} style={styles.fullscreenImage} />
            </Animated.View>
          </PinchGestureHandler>
        )}

        <View style={styles.viewerActions}>
          <TouchableOpacity 
            style={styles.viewerActionButton} 
            onPress={() => selectedPhoto && saveToDevice(selectedPhoto)}
          >
            <Ionicons name="download" size={20} color={colors.white} />
            <Text style={styles.viewerActionText}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.viewerActionButton, styles.deleteActionButton]} 
            onPress={() => selectedPhoto && deletePhoto(selectedPhoto)}
          >
            <Ionicons name="trash" size={20} color={colors.error} />
            <Text style={[styles.viewerActionText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.gradient}
      >
        {renderHeader()}
      </LinearGradient>

      <View style={styles.content}>
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.uploadingText}>Uploading photos...</Text>
          </View>
        )}

        {photos.length > 0 ? (
          <>
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <FlatList
              data={photos}
              renderItem={renderPhotoItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.photoGrid}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
          </>
        ) : (
          <FlatList
            data={[]}
            renderItem={() => null}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>

      {renderPhotoViewer()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  gradient: {
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  uploadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  uploadingText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  statsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  statsText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  photoGrid: {
    padding: spacing.md,
    paddingTop: 0,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  photoDate: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['6xl'],
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  emptyActionButtonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.primaryContainer,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  // Photo Viewer Styles
  viewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  viewerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    resizeMode: 'contain',
  },
  viewerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: 40,
  },
  viewerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  viewerActionText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  deleteActionButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
});