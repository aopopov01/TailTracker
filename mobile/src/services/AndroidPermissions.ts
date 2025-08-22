import React from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { 
  PERMISSIONS, 
  RESULTS, 
  Permission, 
  PermissionStatus as RNPermissionStatus,
  request as requestPermission,
  requestMultiple,
  check,
  openSettings,
} from 'react-native-permissions';

// Permission types for Android
export type PermissionType = 
  | 'camera'
  | 'location'
  | 'locationAlways'
  | 'storage'
  | 'notification'
  | 'microphone'
  | 'contacts'
  | 'phone';

export type PermissionStatus = 
  | 'granted'
  | 'denied'
  | 'never_ask_again'
  | 'undetermined'
  | 'blocked'
  | 'unavailable'
  | 'limited';

export interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

export interface PermissionRequest {
  type: PermissionType;
  title: string;
  message: string;
  buttonPositive?: string;
  buttonNegative?: string;
  buttonNeutral?: string;
}

// Android permission mappings
const ANDROID_PERMISSIONS: Record<PermissionType, Permission> = {
  camera: PERMISSIONS.ANDROID.CAMERA,
  location: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  locationAlways: PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
  storage: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  notification: PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
  microphone: PERMISSIONS.ANDROID.RECORD_AUDIO,
  contacts: PERMISSIONS.ANDROID.READ_CONTACTS,
  phone: PERMISSIONS.ANDROID.CALL_PHONE,
} as const;

class AndroidPermissionsService {
  /**
   * Convert react-native-permissions status to our status type
   */
  private convertPermissionStatus(status: RNPermissionStatus): PermissionStatus {
    switch (status) {
      case RESULTS.GRANTED:
        return 'granted';
      case RESULTS.DENIED:
        return 'denied';
      case RESULTS.NEVER_ASK_AGAIN:
        return 'never_ask_again';
      case RESULTS.BLOCKED:
        return 'blocked';
      case RESULTS.UNAVAILABLE:
        return 'unavailable';
      case RESULTS.LIMITED:
        return 'limited';
      default:
        return 'undetermined';
    }
  }

  /**
   * Check if permission is granted
   */
  async checkPermission(permission: PermissionType): Promise<PermissionResult> {
    if (Platform.OS !== 'android') {
      throw new Error('AndroidPermissions is only available on Android');
    }

    try {
      const androidPermission = ANDROID_PERMISSIONS[permission];
      if (!androidPermission) {
        throw new Error(`Unknown permission type: ${permission}`);
      }

      const status = await check(androidPermission);
      const convertedStatus = this.convertPermissionStatus(status);
      
      return {
        status: convertedStatus,
        canAskAgain: convertedStatus !== 'never_ask_again' && convertedStatus !== 'blocked',
      };
    } catch (error) {
      console.error(`Error checking permission ${permission}:`, error);
      return {
        status: 'undetermined',
        canAskAgain: true,
      };
    }
  }

  /**
   * Request a specific permission
   */
  async requestPermission(request: PermissionRequest): Promise<PermissionResult> {
    if (Platform.OS !== 'android') {
      throw new Error('AndroidPermissions is only available on Android');
    }

    try {
      // Check current status first
      const currentStatus = await this.checkPermission(request.type);
      
      if (currentStatus.status === 'granted') {
        return currentStatus;
      }

      if (currentStatus.status === 'never_ask_again' || currentStatus.status === 'blocked') {
        // Show alert to go to settings
        this.showSettingsAlert(request);
        return currentStatus;
      }

      // Show rationale if needed
      if (currentStatus.status === 'denied') {
        await this.showPermissionRationale(request);
      }

      // Request permission
      const androidPermission = ANDROID_PERMISSIONS[request.type];
      if (!androidPermission) {
        throw new Error(`Unknown permission type: ${request.type}`);
      }

      const status = await requestPermission(androidPermission);
      const convertedStatus = this.convertPermissionStatus(status);
      
      return {
        status: convertedStatus,
        canAskAgain: convertedStatus !== 'never_ask_again' && convertedStatus !== 'blocked',
      };
    } catch (error) {
      console.error(`Error requesting permission ${request.type}:`, error);
      return {
        status: 'denied',
        canAskAgain: false,
      };
    }
  }

  /**
   * Request multiple permissions
   */
  async requestMultiplePermissions(requests: PermissionRequest[]): Promise<Record<PermissionType, PermissionResult>> {
    if (Platform.OS !== 'android') {
      throw new Error('AndroidPermissions is only available on Android');
    }

    try {
      // Get all Android permissions to request
      const permissionsToRequest: Permission[] = [];
      const requestMap: Record<string, PermissionRequest> = {};

      for (const request of requests) {
        const androidPermission = ANDROID_PERMISSIONS[request.type];
        if (androidPermission) {
          permissionsToRequest.push(androidPermission);
          requestMap[androidPermission] = request;
        }
      }

      // Request all permissions at once
      const statuses = await requestMultiple(permissionsToRequest);
      
      // Convert results back to our format
      const results: Record<PermissionType, PermissionResult> = {} as any;
      
      for (const [permission, status] of Object.entries(statuses)) {
        const request = requestMap[permission];
        if (request) {
          const convertedStatus = this.convertPermissionStatus(status);
          results[request.type] = {
            status: convertedStatus,
            canAskAgain: convertedStatus !== 'never_ask_again' && convertedStatus !== 'blocked',
          };
        }
      }

      return results;
    } catch (error) {
      console.error('Error requesting multiple permissions:', error);
      
      // Fallback to individual requests
      const results: Record<PermissionType, PermissionResult> = {} as any;
      for (const request of requests) {
        results[request.type] = await this.requestPermission(request);
      }
      return results;
    }
  }

  /**
   * Check if should show permission rationale
   */
  private async shouldShowRequestPermissionRationale(permission: PermissionType): Promise<boolean> {
    // This is handled automatically by react-native-permissions
    // We show rationale when status is 'denied' before requesting
    return false;
  }

  /**
   * Show permission rationale dialog
   */
  private async showPermissionRationale(request: PermissionRequest): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        request.title,
        request.message,
        [
          {
            text: request.buttonNegative || 'Cancel',
            style: 'cancel',
            onPress: () => resolve(),
          },
          {
            text: request.buttonPositive || 'OK',
            onPress: () => resolve(),
          },
        ]
      );
    });
  }

  /**
   * Show settings alert for blocked permissions
   */
  private showSettingsAlert(request: PermissionRequest): void {
    Alert.alert(
      'Permission Required',
      `${request.message}\n\nPlease enable this permission in the app settings.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  }

  /**
   * Open app settings
   */
  async openSettings(): Promise<void> {
    try {
      await openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
      // Fallback to React Native's openSettings
      try {
        await Linking.openSettings();
      } catch (fallbackError) {
        console.error('Fallback error opening settings:', fallbackError);
      }
    }
  }
}

// Export singleton instance
export const androidPermissions = new AndroidPermissionsService();

// TailTracker-specific permission helpers
export const TailTrackerPermissions = {
  /**
   * Request essential permissions for the app
   */
  async requestEssentialPermissions(): Promise<boolean> {
    const requests: PermissionRequest[] = [
      {
        type: 'location',
        title: 'Location Permission',
        message: 'TailTracker needs location access to track your pets and find them when they\'re lost.',
        buttonPositive: 'Grant Permission',
      },
      {
        type: 'camera',
        title: 'Camera Permission',
        message: 'TailTracker needs camera access to take photos of your pets for their profiles.',
        buttonPositive: 'Grant Permission',
      },
      {
        type: 'notification',
        title: 'Notification Permission',
        message: 'TailTracker needs to send notifications about your pets\' safety and health.',
        buttonPositive: 'Grant Permission',
      },
    ];

    const results = await androidPermissions.requestMultiplePermissions(requests);
    
    // Check if essential permissions are granted
    return results.location.status === 'granted' && 
           results.camera.status === 'granted' && 
           results.notification.status === 'granted';
  },

  /**
   * Request background location permission
   */
  async requestBackgroundLocation(): Promise<boolean> {
    // First ensure foreground location is granted
    const foregroundResult = await androidPermissions.checkPermission('location');
    
    if (foregroundResult.status !== 'granted') {
      const request: PermissionRequest = {
        type: 'location',
        title: 'Location Permission',
        message: 'TailTracker needs location access to track your pets.',
        buttonPositive: 'Grant Permission',
      };
      
      const result = await androidPermissions.requestPermission(request);
      if (result.status !== 'granted') {
        return false;
      }
    }

    // Now request background location
    const backgroundRequest: PermissionRequest = {
      type: 'locationAlways',
      title: 'Background Location',
      message: 'TailTracker needs background location access to monitor your pets even when the app is closed. This ensures you get alerts if your pet leaves their safe zone.',
      buttonPositive: 'Allow All The Time',
    };

    const result = await androidPermissions.requestPermission(backgroundRequest);
    return result.status === 'granted';
  },

  /**
   * Request storage permissions
   */
  async requestStoragePermissions(): Promise<boolean> {
    const request: PermissionRequest = {
      type: 'storage',
      title: 'Storage Permission',
      message: 'TailTracker needs storage access to save pet photos and documents.',
      buttonPositive: 'Grant Permission',
    };

    const result = await androidPermissions.requestPermission(request);
    return result.status === 'granted';
  },

  /**
   * Check if all required permissions are granted
   */
  async checkAllPermissions(): Promise<{
    location: boolean;
    backgroundLocation: boolean;
    camera: boolean;
    storage: boolean;
    notification: boolean;
  }> {
    const [location, locationAlways, camera, storage, notification] = await Promise.all([
      androidPermissions.checkPermission('location'),
      androidPermissions.checkPermission('locationAlways'),
      androidPermissions.checkPermission('camera'),
      androidPermissions.checkPermission('storage'),
      androidPermissions.checkPermission('notification'),
    ]);

    return {
      location: location.status === 'granted',
      backgroundLocation: locationAlways.status === 'granted',
      camera: camera.status === 'granted',
      storage: storage.status === 'granted',
      notification: notification.status === 'granted',
    };
  },

  /**
   * Get permission status summary
   */
  async getPermissionsSummary(): Promise<{
    essential: boolean;
    optional: boolean;
    backgroundLocation: boolean;
    allGranted: boolean;
  }> {
    const permissions = await this.checkAllPermissions();
    
    const essential = permissions.location && permissions.camera && permissions.notification;
    const optional = permissions.storage;
    const backgroundLocation = permissions.backgroundLocation;
    const allGranted = essential && optional && backgroundLocation;

    return {
      essential,
      optional,
      backgroundLocation,
      allGranted,
    };
  },
};

// React hooks for permissions
export const usePermissions = () => {
  const [permissions, setPermissions] = React.useState<{
    location: boolean;
    backgroundLocation: boolean;
    camera: boolean;
    storage: boolean;
    notification: boolean;
  }>({
    location: false,
    backgroundLocation: false,
    camera: false,
    storage: false,
    notification: false,
  });

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      setLoading(true);
      const result = await TailTrackerPermissions.checkAllPermissions();
      setPermissions(result);
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestEssential = async () => {
    try {
      setLoading(true);
      const granted = await TailTrackerPermissions.requestEssentialPermissions();
      await checkPermissions();
      return granted;
    } catch (error) {
      console.error('Error requesting essential permissions:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestBackgroundLocation = async () => {
    try {
      setLoading(true);
      const granted = await TailTrackerPermissions.requestBackgroundLocation();
      await checkPermissions();
      return granted;
    } catch (error) {
      console.error('Error requesting background location:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestStorage = async () => {
    try {
      setLoading(true);
      const granted = await TailTrackerPermissions.requestStoragePermissions();
      await checkPermissions();
      return granted;
    } catch (error) {
      console.error('Error requesting storage permission:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    permissions,
    loading,
    checkPermissions,
    requestEssential,
    requestBackgroundLocation,
    requestStorage,
    openSettings: androidPermissions.openSettings.bind(androidPermissions),
  };
};