import React from 'react';
import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { androidPermissions } from './AndroidPermissions';

const NOTIFICATION_STORAGE_KEY = '@TailTracker:notification_settings';
const PUSH_TOKEN_STORAGE_KEY = '@TailTracker:push_token';

// Notification channel configurations for Android
export const NotificationChannels = {
  PET_ALERTS: {
    id: 'pet-alerts',
    name: 'Pet Alerts',
    description: 'Important alerts about your pets safety and location',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'pet_alert.wav',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B6B',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  },
  
  HEALTH_REMINDERS: {
    id: 'health-reminders',
    name: 'Health Reminders',
    description: 'Reminders for vet appointments, medications, and health checkups',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'health_reminder.wav',
    vibrationPattern: [0, 250, 250],
    lightColor: '#4CAF50',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  },
  
  ACTIVITY_UPDATES: {
    id: 'activity-updates',
    name: 'Activity Updates',
    description: 'Updates about your pets daily activities and milestones',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'activity_update.wav',
    vibrationPattern: [0, 200],
    lightColor: '#2196F3',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  },
  
  SOCIAL_FEATURES: {
    id: 'social-features',
    name: 'Social Features',
    description: 'Notifications from the pet community and social features',
    importance: Notifications.AndroidImportance.LOW,
    sound: 'social_notification.wav',
    vibrationPattern: [0, 100],
    lightColor: '#9C27B0',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  },
  
  BACKGROUND_SYNC: {
    id: 'background-sync',
    name: 'Background Sync',
    description: 'Background data synchronization notifications',
    importance: Notifications.AndroidImportance.MIN,
    sound: false,
    vibrationPattern: null,
    lightColor: '#607D8B',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.SECRET,
    showBadge: false,
  },
  
  EMERGENCY: {
    id: 'emergency',
    name: 'Emergency Alerts',
    description: 'Critical emergency alerts about your pets',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'emergency_alert.wav',
    vibrationPattern: [0, 300, 100, 300, 100, 300],
    lightColor: '#F44336',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    allowBubble: true,
  },
} as const;

export type NotificationChannelId = keyof typeof NotificationChannels;

export interface NotificationSettings {
  enabled: boolean;
  channels: {
    [K in NotificationChannelId]: {
      enabled: boolean;
      sound: boolean;
      vibration: boolean;
      badge: boolean;
    };
  };
}

export interface NotificationData {
  title: string;
  body: string;
  channelId: NotificationChannelId;
  data?: Record<string, any>;
  imageUrl?: string;
  actions?: NotificationAction[];
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
  sticky?: boolean;
  ongoing?: boolean;
  autoCancel?: boolean;
  category?: string;
  badge?: number;
  tag?: string;
  color?: string;
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  destructive?: boolean;
  authenticationRequired?: boolean;
  foreground?: boolean;
}

export interface ScheduledNotification {
  id: string;
  channelId: NotificationChannelId;
  title: string;
  body: string;
  trigger: Date | number; // Date for specific time, number for interval
  repeat?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
  data?: Record<string, any>;
}

class AndroidNotificationService {
  private settings: NotificationSettings | null = null;
  private expoPushToken: string | null = null;
  private notificationListeners: Set<(notification: Notifications.Notification) => void> = new Set();
  private responseListeners: Set<(response: Notifications.NotificationResponse) => void> = new Set();

  constructor() {
    this.initializeNotifications();
    this.loadNotificationSettings();
  }

  /**
   * Initialize notification system
   */
  private async initializeNotifications(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      // Set default notification handler
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          const channelId = notification.request.content.categoryIdentifier as NotificationChannelId;
          const channelSettings = this.settings?.channels[channelId];
          
          return {
            shouldShowAlert: channelSettings?.enabled ?? true,
            shouldPlaySound: channelSettings?.sound ?? true,
            shouldSetBadge: channelSettings?.badge ?? true,
          };
        },
      });

      // Create notification channels
      await this.createNotificationChannels();

      // Set up notification listeners
      this.setupNotificationListeners();

      // Request permissions
      await this.requestNotificationPermissions();

      // Register for push notifications
      await this.registerForPushNotificationsAsync();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  /**
   * Create notification channels for Android
   */
  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      for (const [channelKey, channelConfig] of Object.entries(NotificationChannels)) {
        await Notifications.setNotificationChannelAsync(channelConfig.id, {
          name: channelConfig.name,
          description: channelConfig.description,
          importance: channelConfig.importance,
          sound: channelConfig.sound ? channelConfig.sound : undefined,
          vibrationPattern: channelConfig.vibrationPattern || undefined,
          lightColor: channelConfig.lightColor,
          lockscreenVisibility: channelConfig.lockscreenVisibility,
          bypassDnd: channelConfig.bypassDnd || false,
          showBadge: channelConfig.showBadge !== false,
          enableLights: true,
          enableVibrate: true,
        });
      }
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners(): void {
    // Notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      this.notifyNotificationListeners(notification);
    });

    // Notification tapped/responded to
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      this.notifyResponseListeners(response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Request notification permissions
   */
  async requestNotificationPermissions(): Promise<boolean> {
    try {
      const result = await androidPermissions.requestPermission({
        type: 'notification',
        title: 'Notification Permission',
        message: 'TailTracker needs notification permission to send you important alerts about your pets.',
        buttonPositive: 'Grant Permission',
      });

      return result.status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications require a physical device');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const hasPermission = await this.requestNotificationPermissions();
        finalStatus = hasPermission ? 'granted' : 'denied';
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.expoPushToken = token.data;
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token.data);

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Send local notification
   */
  async sendNotification(notification: NotificationData): Promise<string | null> {
    try {
      const channel = NotificationChannels[notification.channelId];
      if (!channel) {
        console.error(`Unknown notification channel: ${notification.channelId}`);
        return null;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          categoryIdentifier: notification.channelId,
          badge: notification.badge,
          color: notification.color || channel.lightColor,
          sticky: notification.sticky,
          autoDismiss: notification.autoCancel !== false,
          priority: this.mapPriorityToAndroid(notification.priority),
        },
        trigger: null, // Immediate notification
      });

      return identifier;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(scheduledNotification: ScheduledNotification): Promise<string | null> {
    try {
      const channel = NotificationChannels[scheduledNotification.channelId];
      if (!channel) {
        console.error(`Unknown notification channel: ${scheduledNotification.channelId}`);
        return null;
      }

      let trigger: any;

      if (scheduledNotification.trigger instanceof Date) {
        trigger = scheduledNotification.trigger;
      } else if (typeof scheduledNotification.trigger === 'number') {
        trigger = {
          seconds: scheduledNotification.trigger / 1000,
          repeats: !!scheduledNotification.repeat,
        };
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: scheduledNotification.title,
          body: scheduledNotification.body,
          data: scheduledNotification.data || {},
          categoryIdentifier: scheduledNotification.channelId,
        },
        trigger,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Clear notification badge
   */
  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  /**
   * Set notification badge
   */
  async setBadge(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge:', error);
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    if (this.settings) {
      return this.settings;
    }

    return this.loadNotificationSettings();
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = {
        ...this.settings,
        ...settings,
      } as NotificationSettings;

      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  /**
   * Update channel settings
   */
  async updateChannelSettings(
    channelId: NotificationChannelId,
    settings: Partial<NotificationSettings['channels'][NotificationChannelId]>
  ): Promise<void> {
    try {
      if (!this.settings) {
        await this.loadNotificationSettings();
      }

      if (this.settings) {
        this.settings.channels[channelId] = {
          ...this.settings.channels[channelId],
          ...settings,
        };

        await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch (error) {
      console.error('Error updating channel settings:', error);
    }
  }

  /**
   * Add notification listener
   */
  addNotificationListener(listener: (notification: Notifications.Notification) => void): () => void {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }

  /**
   * Add response listener
   */
  addResponseListener(listener: (response: Notifications.NotificationResponse) => void): () => void {
    this.responseListeners.add(listener);
    return () => this.responseListeners.delete(listener);
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Private methods
   */

  private async loadNotificationSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      
      if (stored) {
        this.settings = JSON.parse(stored);
      } else {
        // Default settings
        this.settings = {
          enabled: true,
          channels: {
            PET_ALERTS: { enabled: true, sound: true, vibration: true, badge: true },
            HEALTH_REMINDERS: { enabled: true, sound: true, vibration: true, badge: true },
            ACTIVITY_UPDATES: { enabled: true, sound: false, vibration: false, badge: true },
            SOCIAL_FEATURES: { enabled: false, sound: false, vibration: false, badge: false },
            BACKGROUND_SYNC: { enabled: false, sound: false, vibration: false, badge: false },
            EMERGENCY: { enabled: true, sound: true, vibration: true, badge: true },
          },
        };
        
        await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(this.settings));
      }

      return this.settings;
    } catch (error) {
      console.error('Error loading notification settings:', error);
      
      // Return default settings on error
      this.settings = {
        enabled: true,
        channels: {
          PET_ALERTS: { enabled: true, sound: true, vibration: true, badge: true },
          HEALTH_REMINDERS: { enabled: true, sound: true, vibration: true, badge: true },
          ACTIVITY_UPDATES: { enabled: true, sound: false, vibration: false, badge: true },
          SOCIAL_FEATURES: { enabled: false, sound: false, vibration: false, badge: false },
          BACKGROUND_SYNC: { enabled: false, sound: false, vibration: false, badge: false },
          EMERGENCY: { enabled: true, sound: true, vibration: true, badge: true },
        },
      };
      
      return this.settings;
    }
  }

  private mapPriorityToAndroid(priority?: string): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'min':
        return Notifications.AndroidNotificationPriority.MIN;
      case 'low':
        return Notifications.AndroidNotificationPriority.LOW;
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      case 'max':
        return Notifications.AndroidNotificationPriority.MAX;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  private notifyNotificationListeners(notification: Notifications.Notification): void {
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  private notifyResponseListeners(response: Notifications.NotificationResponse): void {
    this.responseListeners.forEach(listener => {
      try {
        listener(response);
      } catch (error) {
        console.error('Error in response listener:', error);
      }
    });
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { notification, actionIdentifier } = response;
    const data = notification.request.content.data;

    // Handle different notification actions
    switch (actionIdentifier) {
      case 'view_pet':
        // Navigate to pet profile
        break;
      case 'mark_safe':
        // Mark pet as safe
        break;
      case 'emergency_response':
        // Handle emergency response
        break;
      default:
        // Default action - open app to relevant screen
        break;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.notificationListeners.clear();
    this.responseListeners.clear();
  }
}

// Export singleton instance
export const androidNotificationService = new AndroidNotificationService();

// TailTracker-specific notification helpers
export const TailTrackerNotifications = {
  /**
   * Send pet safety alert
   */
  async sendPetSafetyAlert(petName: string, message: string, data?: Record<string, any>): Promise<string | null> {
    return await androidNotificationService.sendNotification({
      title: `${petName} Safety Alert`,
      body: message,
      channelId: 'PET_ALERTS',
      priority: 'high',
      data: { type: 'safety_alert', petName, ...data },
      actions: [
        { id: 'view_pet', title: 'View Pet', foreground: true },
        { id: 'mark_safe', title: 'Mark Safe', foreground: false },
      ],
    });
  },

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(petName: string, message: string, data?: Record<string, any>): Promise<string | null> {
    return await androidNotificationService.sendNotification({
      title: `🚨 EMERGENCY: ${petName}`,
      body: message,
      channelId: 'EMERGENCY',
      priority: 'max',
      sticky: true,
      data: { type: 'emergency', petName, ...data },
      actions: [
        { id: 'emergency_response', title: 'Respond', foreground: true },
        { id: 'call_help', title: 'Call Help', foreground: true },
      ],
    });
  },

  /**
   * Send health reminder
   */
  async sendHealthReminder(petName: string, reminder: string, scheduledFor: Date): Promise<string | null> {
    return await androidNotificationService.scheduleNotification({
      id: `health_${petName}_${Date.now()}`,
      channelId: 'HEALTH_REMINDERS',
      title: `Health Reminder: ${petName}`,
      body: reminder,
      trigger: scheduledFor,
      data: { type: 'health_reminder', petName },
    });
  },

  /**
   * Send activity milestone
   */
  async sendActivityMilestone(petName: string, milestone: string): Promise<string | null> {
    return await androidNotificationService.sendNotification({
      title: `${petName} Achievement!`,
      body: milestone,
      channelId: 'ACTIVITY_UPDATES',
      priority: 'default',
      data: { type: 'milestone', petName },
    });
  },

  /**
   * Send geofence alert
   */
  async sendGeofenceAlert(petName: string, zoneName: string, eventType: 'entered' | 'exited'): Promise<string | null> {
    const action = eventType === 'entered' ? 'entered' : 'left';
    return await androidNotificationService.sendNotification({
      title: `${petName} ${action} ${zoneName}`,
      body: `Your pet has ${action} the ${zoneName} zone.`,
      channelId: 'PET_ALERTS',
      priority: 'high',
      data: { type: 'geofence', petName, zoneName, eventType },
    });
  },
};

// React hooks for notifications
export const useAndroidNotifications = () => {
  const [settings, setSettings] = React.useState<NotificationSettings | null>(null);
  const [pushToken, setPushToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    loadSettings();
    loadPushToken();

    // Add notification listeners
    const removeNotificationListener = androidNotificationService.addNotificationListener(
      (notification) => {
        console.log('Notification received in hook:', notification);
      }
    );

    const removeResponseListener = androidNotificationService.addResponseListener(
      (response) => {
        console.log('Notification response in hook:', response);
      }
    );

    return () => {
      removeNotificationListener();
      removeResponseListener();
    };
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const notificationSettings = await androidNotificationService.getNotificationSettings();
      setSettings(notificationSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPushToken = async () => {
    try {
      const token = androidNotificationService.getPushToken() || await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
      setPushToken(token);
    } catch (error) {
      console.error('Error loading push token:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      setIsLoading(true);
      await androidNotificationService.updateNotificationSettings(newSettings);
      await loadSettings();
    } catch (error) {
      console.error('Error updating notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChannelSettings = async (
    channelId: NotificationChannelId,
    channelSettings: Partial<NotificationSettings['channels'][NotificationChannelId]>
  ) => {
    try {
      setIsLoading(true);
      await androidNotificationService.updateChannelSettings(channelId, channelSettings);
      await loadSettings();
    } catch (error) {
      console.error('Error updating channel settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      setIsLoading(true);
      return await androidNotificationService.requestNotificationPermissions();
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    settings,
    pushToken,
    isLoading,
    updateSettings,
    updateChannelSettings,
    requestPermissions,
    sendNotification: androidNotificationService.sendNotification.bind(androidNotificationService),
    scheduleNotification: androidNotificationService.scheduleNotification.bind(androidNotificationService),
    cancelNotification: androidNotificationService.cancelNotification.bind(androidNotificationService),
    clearBadge: androidNotificationService.clearBadge.bind(androidNotificationService),
    setBadge: androidNotificationService.setBadge.bind(androidNotificationService),
    getPendingNotifications: androidNotificationService.getPendingNotifications.bind(androidNotificationService),
  };
};