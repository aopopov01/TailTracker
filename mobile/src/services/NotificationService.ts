import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

export interface PushNotificationData {
  type: 'lost_pet_alert' | 'pet_found' | 'general';
  petId?: string;
  lostPetId?: string;
  location?: {
    lat: number;
    lng: number;
  };
  distance?: number;
  ownerName?: string;
  petName?: string;
  species?: string;
  breed?: string;
  reward?: number;
  contactPhone?: string;
}

export interface LostPetNotification {
  title: string;
  body: string;
  data: PushNotificationData;
  sound?: string;
  priority?: 'default' | 'high';
}

class NotificationService {
  private pushToken: string | null = null;

  constructor() {
    this.configurePushNotifications();
  }

  /**
   * Configure push notification settings
   */
  private configurePushNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data as PushNotificationData;
        
        // Handle different notification types
        if (data.type === 'lost_pet_alert') {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          };
        }

        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });

    // Listen for notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as PushNotificationData;
      this.handleNotificationReceived(notification, data);
    });

    // Listen for notification tapped/clicked
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as PushNotificationData;
      this.handleNotificationResponse(response, data);
    });
  }

  /**
   * Request push notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('lost-pet-alerts', {
          name: 'Lost Pet Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF9800',
          sound: 'notification.wav',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'You won\'t receive lost pet alerts without notification permissions. You can enable them in your device settings.'
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get push token for the device
   */
  async getPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      });

      this.pushToken = token.data;
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Update user's push token in database
   */
  async updateUserPushToken(userId: string): Promise<void> {
    try {
      const token = await this.getPushToken();
      if (!token) return;

      const { error } = await supabase
        .from('users')
        .update({ 
          push_token: token,
          push_notifications_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating push token:', error);
      }
    } catch (error) {
      console.error('Error updating user push token:', error);
    }
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(notification: LostPetNotification, delaySeconds: number = 0) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: notification.sound || 'default',
        },
        trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return null;
    }
  }

  /**
   * Handle notification received in foreground
   */
  private handleNotificationReceived(notification: Notifications.Notification, data: PushNotificationData) {
    if (data.type === 'lost_pet_alert') {
      // Show in-app alert for lost pet notifications
      Alert.alert(
        notification.request.content.title || 'Lost Pet Alert',
        notification.request.content.body || 'A pet is missing in your area',
        [
          { text: 'Dismiss', style: 'cancel' },
          { 
            text: 'View Details', 
            onPress: () => this.navigateToLostPetDetails(data)
          },
        ]
      );
    }
  }

  /**
   * Handle notification tapped/clicked
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse, data: PushNotificationData) {
    if (data.type === 'lost_pet_alert') {
      this.navigateToLostPetDetails(data);
    } else if (data.type === 'pet_found') {
      // Navigate to pet profile or celebration screen
      if (data.petId) {
        this.navigateToPetProfile(data.petId);
      }
    }
  }

  /**
   * Navigate to lost pet details
   */
  private navigateToLostPetDetails(data: PushNotificationData) {
    // This would typically use React Navigation
    // For now, we'll just log the navigation intent
    console.log('Navigate to lost pet details:', data);
    
    // In a real app:
    // NavigationService.navigate('NearbyLostPets', { 
    //   highlightId: data.lostPetId,
    //   location: data.location 
    // });
  }

  /**
   * Navigate to pet profile
   */
  private navigateToPetProfile(petId: string) {
    console.log('Navigate to pet profile:', petId);
    
    // In a real app:
    // NavigationService.navigate('PetProfile', { petId });
  }

  /**
   * Create notification for lost pet alert
   */
  createLostPetNotification(
    petName: string,
    species: string,
    distance: number,
    ownerName: string,
    lostPetId: string,
    location?: { lat: number; lng: number },
    reward?: number
  ): LostPetNotification {
    const distanceText = distance < 1 
      ? `${Math.round(distance * 1000)}m away`
      : `${distance.toFixed(1)}km away`;

    const rewardText = reward ? ` • $${reward} reward` : '';

    return {
      title: `Lost Pet Alert: ${petName}`,
      body: `${species} missing ${distanceText}${rewardText}. Help bring ${petName} home!`,
      data: {
        type: 'lost_pet_alert',
        lostPetId,
        petName,
        species,
        distance,
        ownerName,
        reward,
        location,
      },
      sound: 'notification.wav',
      priority: 'high',
    };
  }

  /**
   * Create notification for pet found
   */
  createPetFoundNotification(
    petName: string,
    species: string,
    petId: string
  ): LostPetNotification {
    return {
      title: `Great News! ${petName} is Safe`,
      body: `${species} ${petName} has been found and is safely home! 🎉`,
      data: {
        type: 'pet_found',
        petId,
        petName,
        species,
      },
      sound: 'celebration.wav',
      priority: 'high',
    };
  }

  /**
   * Disable push notifications for user
   */
  async disablePushNotifications(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          push_notifications_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error disabling push notifications:', error);
      }
    } catch (error) {
      console.error('Error disabling push notifications:', error);
    }
  }

  /**
   * Get current push token
   */
  getCurrentPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Test notification functionality
   */
  async testNotification(): Promise<void> {
    const testNotification = this.createLostPetNotification(
      'Max',
      'Golden Retriever',
      2.5,
      'John Doe',
      'test-123',
      { lat: 40.7128, lng: -74.0060 },
      100
    );

    await this.scheduleLocalNotification(testNotification, 5);
    
    Alert.alert(
      'Test Notification',
      'A test lost pet notification will appear in 5 seconds.',
      [{ text: 'OK' }]
    );
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export helper functions for components
export const NotificationHelpers = {
  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Open device notification settings
   */
  async openNotificationSettings(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Notifications.openSettingsAsync();
    } else {
      // For Android, we'd need to open the app's notification settings
      Alert.alert(
        'Notification Settings',
        'Please enable notifications for TailTracker in your device settings to receive lost pet alerts.',
        [
          { text: 'OK' }
        ]
      );
    }
  },

  /**
   * Format notification text for display
   */
  formatNotificationPreview(notification: LostPetNotification): string {
    return `${notification.title}\n${notification.body}`;
  },
};