import { Platform } from 'react-native';

// Types for Firebase messaging
export interface NotificationMessage {
  messageId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  sound?: string;
  badge?: number;
  clickAction?: string;
  priority: 'high' | 'normal';
  ttl?: number; // Time to live in seconds
}

export interface PushNotificationPermission {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined' | 'provisional';
}

export interface FCMToken {
  token: string;
  timestamp: number;
}

// Notification types for TailTracker
export const NOTIFICATION_TYPES = {
  PET_ALERT: 'pet_alert',
  SAFE_ZONE_EXIT: 'safe_zone_exit',
  SAFE_ZONE_ENTRY: 'safe_zone_entry',
  LOW_BATTERY: 'low_battery',
  DEVICE_OFFLINE: 'device_offline',
  HEALTH_REMINDER: 'health_reminder',
  LOCATION_UPDATE: 'location_update',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  GENERAL: 'general',
} as const;

export const NOTIFICATION_CHANNELS = {
  ALERTS: {
    id: 'pet_alerts',
    name: 'Pet Alerts',
    description: 'Critical alerts about your pets',
    importance: 'high' as const,
    sound: 'alert.mp3',
    vibrate: true,
    lights: true,
  },
  LOCATION: {
    id: 'location_updates',
    name: 'Location Updates',
    description: 'Location and movement notifications',
    importance: 'normal' as const,
    sound: 'notification.mp3',
    vibrate: false,
    lights: false,
  },
  REMINDERS: {
    id: 'reminders',
    name: 'Health Reminders',
    description: 'Medication and appointment reminders',
    importance: 'normal' as const,
    sound: 'reminder.mp3',
    vibrate: true,
    lights: false,
  },
  GENERAL: {
    id: 'general',
    name: 'General Notifications',
    description: 'General app notifications',
    importance: 'normal' as const,
    sound: 'notification.mp3',
    vibrate: false,
    lights: false,
  },
} as const;

class FirebaseMessagingService {
  private fcmToken: string | null = null;
  private isInitialized = false;
  private messageHandlers: Map<string, (message: NotificationMessage) => void> = new Map();

  /**
   * Initialize Firebase Messaging
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing Firebase Messaging...');

      // Request notification permissions
      const permission = await this.requestPermission();
      if (!permission.granted) {
        console.warn('Notification permission not granted');
        return;
      }

      // Get FCM token
      await this.refreshToken();

      // Set up message handlers
      this.setupMessageHandlers();

      // Create notification channels for Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      this.isInitialized = true;
      console.log('Firebase Messaging initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Messaging:', error);
      throw error;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<PushNotificationPermission> {
    try {
      // Mock implementation - replace with actual FCM permission request
      console.log('Requesting notification permission...');
      
      if (Platform.OS === 'android') {
        // Android 13+ requires explicit notification permission
        // For older versions, permission is granted by default
        return {
          granted: true,
          canAskAgain: true,
          status: 'granted',
        };
      }

      // iOS permission handling would be different
      return {
        granted: true,
        canAskAgain: true,
        status: 'granted',
      };
    } catch (error) {
      console.error('Failed to request permission:', error);
      return {
        granted: false,
        canAskAgain: true,
        status: 'denied',
      };
    }
  }

  /**
   * Get or refresh FCM token
   */
  async refreshToken(): Promise<string> {
    try {
      // Mock token generation - replace with actual FCM token
      const token = `fcm_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.fcmToken = token;
      console.log('FCM Token refreshed:', token);

      // Send token to backend
      await this.sendTokenToBackend(token);

      return token;
    } catch (error) {
      console.error('Failed to refresh FCM token:', error);
      throw error;
    }
  }

  /**
   * Get current FCM token
   */
  async getToken(): Promise<string | null> {
    if (!this.fcmToken) {
      await this.refreshToken();
    }
    return this.fcmToken;
  }

  /**
   * Send token to backend
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      const response = await fetch('/api/fcm/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers here
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send token to backend');
      }
    } catch (error) {
      console.error('Error sending token to backend:', error);
      // Don't throw - token refresh shouldn't fail if backend is down
    }
  }

  /**
   * Setup message handlers
   */
  private setupMessageHandlers(): void {
    // Mock setup - replace with actual FCM message listeners
    console.log('Setting up FCM message handlers...');

    // Handle foreground messages
    this.onMessage((message) => {
      console.log('Received foreground message:', message);
      this.handleForegroundMessage(message);
    });

    // Handle background message interaction
    this.onNotificationOpenedApp((message) => {
      console.log('Notification opened app:', message);
      this.handleNotificationInteraction(message);
    });

    // Handle app opened from quit state
    this.getInitialNotification().then((message) => {
      if (message) {
        console.log('App opened from notification:', message);
        this.handleNotificationInteraction(message);
      }
    });
  }

  /**
   * Create notification channels for Android
   */
  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      // Mock implementation - replace with actual channel creation
      console.log('Creating notification channels...');
      
      Object.values(NOTIFICATION_CHANNELS).forEach((channel) => {
        console.log(`Creating channel: ${channel.id}`);
        // Actual implementation would use react-native-push-notification or similar
      });
    } catch (error) {
      console.error('Failed to create notification channels:', error);
    }
  }

  /**
   * Handle foreground messages
   */
  private handleForegroundMessage(message: NotificationMessage): void {
    // Show in-app notification or update UI
    const handler = this.messageHandlers.get(message.data?.type || 'general');
    if (handler) {
      handler(message);
    }

    // Show local notification if needed
    this.showLocalNotification(message);
  }

  /**
   * Handle notification interaction (tap)
   */
  private handleNotificationInteraction(message: NotificationMessage): void {
    const notificationType = message.data?.type;
    
    switch (notificationType) {
      case NOTIFICATION_TYPES.PET_ALERT:
      case NOTIFICATION_TYPES.SAFE_ZONE_EXIT:
        // Navigate to pet details or alert screen
        console.log('Navigate to pet alert:', message.data?.petId);
        break;
      
      case NOTIFICATION_TYPES.HEALTH_REMINDER:
        // Navigate to health section
        console.log('Navigate to health reminder:', message.data?.reminderId);
        break;
      
      case NOTIFICATION_TYPES.LOCATION_UPDATE:
        // Navigate to map view
        console.log('Navigate to map for location update');
        break;
      
      default:
        // Default navigation
        console.log('Handle general notification interaction');
    }
  }

  /**
   * Show local notification
   */
  private showLocalNotification(message: NotificationMessage): void {
    // Mock implementation - replace with actual local notification display
    console.log('Showing local notification:', message.title);
    
    // Determine channel based on message type
    let channelId = NOTIFICATION_CHANNELS.GENERAL.id;
    const messageType = message.data?.type;
    
    if (messageType === NOTIFICATION_TYPES.PET_ALERT || 
        messageType === NOTIFICATION_TYPES.SAFE_ZONE_EXIT) {
      channelId = NOTIFICATION_CHANNELS.ALERTS.id;
    } else if (messageType === NOTIFICATION_TYPES.LOCATION_UPDATE ||
               messageType === NOTIFICATION_TYPES.SAFE_ZONE_ENTRY) {
      channelId = NOTIFICATION_CHANNELS.LOCATION.id;
    } else if (messageType === NOTIFICATION_TYPES.HEALTH_REMINDER) {
      channelId = NOTIFICATION_CHANNELS.REMINDERS.id;
    }

    // Show notification using react-native-push-notification or similar
  }

  /**
   * Register message handler for specific type
   */
  onMessageType(type: string, handler: (message: NotificationMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Send notification to specific user
   */
  async sendToUser(userId: string, message: NotificationMessage): Promise<void> {
    try {
      const response = await fetch('/api/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers
        },
        body: JSON.stringify({
          userId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to topic
   */
  async sendToTopic(topic: string, message: NotificationMessage): Promise<void> {
    try {
      const response = await fetch('/api/fcm/send-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers
        },
        body: JSON.stringify({
          topic,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send topic notification');
      }
    } catch (error) {
      console.error('Error sending topic notification:', error);
      throw error;
    }
  }

  /**
   * Subscribe to topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No FCM token available');

      // Mock implementation - replace with actual topic subscription
      console.log(`Subscribing to topic: ${topic}`);
      
      const response = await fetch('/api/fcm/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          topic,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe to topic');
      }
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No FCM token available');

      console.log(`Unsubscribing from topic: ${topic}`);
      
      const response = await fetch('/api/fcm/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          topic,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe from topic');
      }
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  // Mock methods for actual FCM integration
  private onMessage(handler: (message: NotificationMessage) => void): void {
    // Replace with actual FCM onMessage listener
    console.log('Setting up onMessage listener');
  }

  private onNotificationOpenedApp(handler: (message: NotificationMessage) => void): void {
    // Replace with actual FCM onNotificationOpenedApp listener
    console.log('Setting up onNotificationOpenedApp listener');
  }

  private async getInitialNotification(): Promise<NotificationMessage | null> {
    // Replace with actual FCM getInitialNotification
    return null;
  }
}

// Export singleton instance
export const firebaseMessaging = new FirebaseMessagingService();

// Pet-specific notification helpers
export const PetNotificationHelpers = {
  /**
   * Send pet alert notification
   */
  async sendPetAlert(userId: string, petId: string, petName: string, alertType: string, location?: string): Promise<void> {
    const message: NotificationMessage = {
      messageId: `alert_${Date.now()}`,
      title: `🚨 ${petName} Alert!`,
      body: `${alertType}${location ? ` at ${location}` : ''}`,
      data: {
        type: NOTIFICATION_TYPES.PET_ALERT,
        petId,
        alertType,
        location: location || '',
      },
      priority: 'high',
      sound: 'alert.mp3',
    };

    await firebaseMessaging.sendToUser(userId, message);
  },

  /**
   * Send safe zone notification
   */
  async sendSafeZoneNotification(
    userId: string, 
    petId: string, 
    petName: string, 
    zoneName: string, 
    action: 'entered' | 'exited'
  ): Promise<void> {
    const message: NotificationMessage = {
      messageId: `safezone_${Date.now()}`,
      title: `${petName} ${action} ${zoneName}`,
      body: `Your pet has ${action} the safe zone "${zoneName}"`,
      data: {
        type: action === 'exited' ? NOTIFICATION_TYPES.SAFE_ZONE_EXIT : NOTIFICATION_TYPES.SAFE_ZONE_ENTRY,
        petId,
        zoneName,
        action,
      },
      priority: action === 'exited' ? 'high' : 'normal',
      sound: action === 'exited' ? 'alert.mp3' : 'notification.mp3',
    };

    await firebaseMessaging.sendToUser(userId, message);
  },

  /**
   * Send health reminder
   */
  async sendHealthReminder(userId: string, petId: string, petName: string, reminder: string): Promise<void> {
    const message: NotificationMessage = {
      messageId: `health_${Date.now()}`,
      title: `Health Reminder for ${petName}`,
      body: reminder,
      data: {
        type: NOTIFICATION_TYPES.HEALTH_REMINDER,
        petId,
        reminder,
      },
      priority: 'normal',
      sound: 'reminder.mp3',
    };

    await firebaseMessaging.sendToUser(userId, message);
  },

  /**
   * Send low battery alert
   */
  async sendLowBatteryAlert(userId: string, petId: string, petName: string, batteryLevel: number): Promise<void> {
    const message: NotificationMessage = {
      messageId: `battery_${Date.now()}`,
      title: `${petName}'s Tracker Battery Low`,
      body: `Battery level: ${batteryLevel}%. Please charge soon.`,
      data: {
        type: NOTIFICATION_TYPES.LOW_BATTERY,
        petId,
        batteryLevel: batteryLevel.toString(),
      },
      priority: 'normal',
      sound: 'notification.mp3',
    };

    await firebaseMessaging.sendToUser(userId, message);
  },
};