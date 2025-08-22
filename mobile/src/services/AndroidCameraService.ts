import React from 'react';
import { Platform, Alert } from 'react-native';
import { 
  Camera, 
  CameraType, 
  FlashMode, 
  ImageType,
  MediaTypeOptions,
  launchCameraAsync,
  launchImageLibraryAsync,
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
  getMediaLibraryPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { androidPermissions } from './AndroidPermissions';

export interface PhotoOptions {
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
  base64?: boolean;
  exif?: boolean;
}

export interface VideoOptions {
  quality?: 'low' | 'medium' | 'high' | '4k';
  maxDuration?: number;
  allowsEditing?: boolean;
}

export interface CameraResult {
  uri: string;
  width: number;
  height: number;
  type: 'image' | 'video';
  base64?: string;
  exif?: any;
  fileSize?: number;
}

export interface CameraCapabilities {
  hasCamera: boolean;
  hasFrontCamera: boolean;
  hasBackCamera: boolean;
  hasFlash: boolean;
  supportedRatios: string[];
  supportedPreviewSizes: Array<{ width: number; height: number }>;
  supportedPictureSizes: Array<{ width: number; height: number }>;
}

class AndroidCameraService {
  private cameraRef: any = null;
  private isRecording = false;

  /**
   * Check camera capabilities
   */
  async getCameraCapabilities(): Promise<CameraCapabilities> {
    if (Platform.OS !== 'android') {
      throw new Error('AndroidCameraService is only available on Android');
    }

    try {
      const hasCamera = await Camera.isAvailableAsync();
      
      return {
        hasCamera,
        hasFrontCamera: hasCamera,
        hasBackCamera: hasCamera,
        hasFlash: hasCamera,
        supportedRatios: ['4:3', '16:9', '1:1'],
        supportedPreviewSizes: [
          { width: 1920, height: 1080 },
          { width: 1280, height: 720 },
          { width: 640, height: 480 },
        ],
        supportedPictureSizes: [
          { width: 4000, height: 3000 },
          { width: 3264, height: 2448 },
          { width: 2048, height: 1536 },
          { width: 1920, height: 1080 },
        ],
      };
    } catch (error) {
      console.error('Error getting camera capabilities:', error);
      return {
        hasCamera: false,
        hasFrontCamera: false,
        hasBackCamera: false,
        hasFlash: false,
        supportedRatios: [],
        supportedPreviewSizes: [],
        supportedPictureSizes: [],
      };
    }
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const cameraPermission = await androidPermissions.requestPermission({
        type: 'camera',
        title: 'Camera Permission',
        message: 'TailTracker needs camera access to take photos of your pets.',
        buttonPositive: 'Grant Permission',
      });

      return cameraPermission.status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const storagePermission = await androidPermissions.requestPermission({
        type: 'storage',
        title: 'Storage Permission',
        message: 'TailTracker needs storage access to save and select photos.',
        buttonPositive: 'Grant Permission',
      });

      return storagePermission.status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  /**
   * Launch camera to take photo
   */
  async takePicture(options: PhotoOptions = {}): Promise<CameraResult | null> {
    if (Platform.OS !== 'android') {
      throw new Error('AndroidCameraService is only available on Android');
    }

    try {
      // Check and request permissions
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Settings', 
              onPress: () => androidPermissions.openSettings() 
            },
          ]
        );
        return null;
      }

      const result = await launchCameraAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        base64: options.base64 ?? false,
        exif: options.exif ?? true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);

      return {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        type: 'image',
        base64: asset.base64,
        exif: asset.exif,
        fileSize: fileInfo.exists ? fileInfo.size : undefined,
      };
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
      return null;
    }
  }

  /**
   * Launch image picker to select from gallery
   */
  async pickImage(options: PhotoOptions = {}): Promise<CameraResult | null> {
    try {
      // Check and request permissions
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Storage permission is required to select photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Settings', 
              onPress: () => androidPermissions.openSettings() 
            },
          ]
        );
        return null;
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        base64: options.base64 ?? false,
        exif: options.exif ?? true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);

      return {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        type: 'image',
        base64: asset.base64,
        exif: asset.exif,
        fileSize: fileInfo.exists ? fileInfo.size : undefined,
      };
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      return null;
    }
  }

  /**
   * Record video
   */
  async recordVideo(options: VideoOptions = {}): Promise<CameraResult | null> {
    if (Platform.OS !== 'android') {
      throw new Error('AndroidCameraService is only available on Android');
    }

    try {
      // Check and request permissions
      const hasCameraPermission = await this.requestCameraPermissions();
      const hasMicrophonePermission = await androidPermissions.requestPermission({
        type: 'microphone',
        title: 'Microphone Permission',
        message: 'TailTracker needs microphone access to record videos with sound.',
        buttonPositive: 'Grant Permission',
      });

      if (!hasCameraPermission || hasMicrophonePermission.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone permissions are required to record videos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Settings', 
              onPress: () => androidPermissions.openSettings() 
            },
          ]
        );
        return null;
      }

      const result = await launchCameraAsync({
        mediaTypes: MediaTypeOptions.Videos,
        allowsEditing: options.allowsEditing ?? false,
        quality: this.getVideoQuality(options.quality),
        videoMaxDuration: options.maxDuration ?? 60,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);

      return {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        type: 'video',
        fileSize: fileInfo.exists ? fileInfo.size : undefined,
      };
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
      return null;
    }
  }

  /**
   * Select video from gallery
   */
  async pickVideo(options: VideoOptions = {}): Promise<CameraResult | null> {
    try {
      // Check and request permissions
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Storage permission is required to select videos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Settings', 
              onPress: () => androidPermissions.openSettings() 
            },
          ]
        );
        return null;
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Videos,
        allowsEditing: options.allowsEditing ?? false,
        quality: this.getVideoQuality(options.quality),
        videoMaxDuration: options.maxDuration ?? 60,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);

      return {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        type: 'video',
        fileSize: fileInfo.exists ? fileInfo.size : undefined,
      };
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
      return null;
    }
  }

  /**
   * Show action sheet for camera/gallery selection
   */
  async showImagePicker(options: PhotoOptions = {}): Promise<CameraResult | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Photo',
        'Choose how you would like to add a photo of your pet',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const result = await this.takePicture(options);
              resolve(result);
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const result = await this.pickImage(options);
              resolve(result);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  }

  /**
   * Show action sheet for video camera/gallery selection
   */
  async showVideoPicker(options: VideoOptions = {}): Promise<CameraResult | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Video',
        'Choose how you would like to add a video of your pet',
        [
          {
            text: 'Record Video',
            onPress: async () => {
              const result = await this.recordVideo(options);
              resolve(result);
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const result = await this.pickVideo(options);
              resolve(result);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  }

  /**
   * Convert video quality option to ImagePicker format
   */
  private getVideoQuality(quality?: string): number {
    switch (quality) {
      case 'low':
        return 0.3;
      case 'medium':
        return 0.7;
      case 'high':
        return 1.0;
      case '4k':
        return 1.0;
      default:
        return 0.8;
    }
  }

  /**
   * Optimize image for storage
   */
  async optimizeImage(
    uri: string, 
    maxWidth: number = 1024, 
    maxHeight: number = 1024, 
    quality: number = 0.8
  ): Promise<string> {
    try {
      // For Android, we can use expo-image-manipulator for optimization
      const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
      
      const result = await manipulateAsync(
        uri,
        [
          { resize: { width: maxWidth, height: maxHeight } },
        ],
        { 
          compress: quality, 
          format: SaveFormat.JPEG 
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return uri; // Return original if optimization fails
    }
  }

  /**
   * Get image/video metadata
   */
  async getMediaMetadata(uri: string): Promise<{
    fileSize: number;
    width?: number;
    height?: number;
    duration?: number;
    type: string;
  } | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        return null;
      }

      // Basic metadata - can be extended with EXIF data
      return {
        fileSize: fileInfo.size || 0,
        type: uri.includes('.mp4') ? 'video' : 'image',
      };
    } catch (error) {
      console.error('Error getting media metadata:', error);
      return null;
    }
  }

  /**
   * Delete temporary files
   */
  async cleanupTempFiles(uris: string[]): Promise<void> {
    try {
      for (const uri of uris) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists && uri.includes('ImagePicker') || uri.includes('Camera')) {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          }
        } catch (error) {
          console.warn(`Failed to delete temp file ${uri}:`, error);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

// Export singleton instance
export const androidCameraService = new AndroidCameraService();

// TailTracker-specific camera helpers
export const TailTrackerCamera = {
  /**
   * Take pet profile photo with optimized settings
   */
  async takePetProfilePhoto(): Promise<CameraResult | null> {
    return await androidCameraService.showImagePicker({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      base64: false,
      exif: true,
    });
  },

  /**
   * Take pet activity photo with standard settings
   */
  async takePetActivityPhoto(): Promise<CameraResult | null> {
    return await androidCameraService.showImagePicker({
      quality: 0.9,
      allowsEditing: false,
      aspect: [4, 3],
      base64: false,
      exif: true,
    });
  },

  /**
   * Record pet video with optimized settings
   */
  async recordPetVideo(): Promise<CameraResult | null> {
    return await androidCameraService.showVideoPicker({
      quality: 'high',
      maxDuration: 30,
      allowsEditing: false,
    });
  },

  /**
   * Take photo for lost pet alert (emergency mode)
   */
  async takeLostPetPhoto(): Promise<CameraResult | null> {
    return await androidCameraService.takePicture({
      quality: 0.7, // Faster processing for emergency
      allowsEditing: false,
      aspect: [4, 3],
      base64: false,
      exif: true,
    });
  },

  /**
   * Take vet document photo
   */
  async takeDocumentPhoto(): Promise<CameraResult | null> {
    return await androidCameraService.showImagePicker({
      quality: 0.9,
      allowsEditing: true,
      aspect: [4, 3],
      base64: false,
      exif: false, // Documents don't need EXIF
    });
  },
};

// React hooks for camera functionality
export const useAndroidCamera = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasPermissions, setHasPermissions] = React.useState(false);

  React.useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const cameraPermission = await androidPermissions.checkPermission('camera');
      const storagePermission = await androidPermissions.checkPermission('storage');
      
      setHasPermissions(
        cameraPermission.status === 'granted' && 
        storagePermission.status === 'granted'
      );
    } catch (error) {
      console.error('Error checking camera permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      setIsLoading(true);
      const cameraGranted = await androidCameraService.requestCameraPermissions();
      const storageGranted = await androidCameraService.requestMediaLibraryPermissions();
      
      const allGranted = cameraGranted && storageGranted;
      setHasPermissions(allGranted);
      return allGranted;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const takePicture = async (options?: PhotoOptions) => {
    try {
      setIsLoading(true);
      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) return null;
      }
      
      return await androidCameraService.takePicture(options);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async (options?: PhotoOptions) => {
    try {
      setIsLoading(true);
      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) return null;
      }
      
      return await androidCameraService.pickImage(options);
    } finally {
      setIsLoading(false);
    }
  };

  const showImagePicker = async (options?: PhotoOptions) => {
    try {
      setIsLoading(true);
      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) return null;
      }
      
      return await androidCameraService.showImagePicker(options);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    hasPermissions,
    checkPermissions,
    requestPermissions,
    takePicture,
    pickImage,
    showImagePicker,
    recordVideo: androidCameraService.recordVideo.bind(androidCameraService),
    pickVideo: androidCameraService.pickVideo.bind(androidCameraService),
    showVideoPicker: androidCameraService.showVideoPicker.bind(androidCameraService),
    optimizeImage: androidCameraService.optimizeImage.bind(androidCameraService),
    cleanupTempFiles: androidCameraService.cleanupTempFiles.bind(androidCameraService),
  };
};