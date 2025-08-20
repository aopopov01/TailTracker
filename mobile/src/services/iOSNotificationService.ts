import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export interface iOSNotificationOptions {
  title: string;
  body: string;
  categoryIdentifier?: string;
  threadIdentifier?: string;
  targetContentIdentifier?: string;
  interruptionLevel?: 'passive' | 'active' | 'timeSensitive' | 'critical';
  relevanceScore?: number; // 0.0 to 1.0
  filterCriteria?: string;
  sound?: string | boolean;
  badge?: number;
  subtitle?: string;
  launchImageName?: string;
  attachments?: Array<{
    url: string;
    options?: {
      typeHint?: string;
      thumbnailHidden?: boolean;
      thumbnailClippingRect?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      thumbnailTime?: number;
    };
  }>;
}

export interface NotificationAction {
  identifier: string;
  title: string;
  options?: {
    foreground?: boolean;
    destructive?: boolean;
    authenticationRequired?: boolean;
  };
}

export interface NotificationCategory {
  identifier: string;
  actions: NotificationAction[];
  options?: {
    customDismissAction?: boolean;
    allowInCarPlay?: boolean;
    allowAnnouncement?: boolean;
    hiddenPreviewsBodyPlaceholder?: string;
    hiddenPreviewsShowTitle?: boolean;
    hiddenPreviewsShowSubtitle?: boolean;
  };
}

export class iOSNotificationService {
  private static instance: iOSNotificationService;
  private categories: NotificationCategory[] = [];

  private constructor() {
    this.setupNotificationHandler();
    this.setupDefaultCategories();
  }

  static getInstance(): iOSNotificationService {
    if (!iOSNotificationService.instance) {
      iOSNotificationService.instance = new iOSNotificationService();
    }
    return iOSNotificationService.instance;
  }

  /**
   * Setup notification handler with iOS-specific behavior
   */
  private setupNotificationHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const content = notification.request.content;
        
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          priority: content.interruptionLevel === 'critical' 
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.DEFAULT,
        };
      },
    });
  }

  /**
   * Setup default notification categories for TailTracker
   */
  private setupDefaultCategories(): void {
    this.categories = [
      {
        identifier: 'PET_ALERT',
        actions: [
          {
            identifier: 'VIEW_PET',
            title: 'View Pet',
            options: { foreground: true },
          },
          {
            identifier: 'DISMISS',
            title: 'Dismiss',
            options: { foreground: false },
          },
        ],
        options: {
          hiddenPreviewsBodyPlaceholder: 'Pet Alert',
        },
      },
      {
        identifier: 'LOCATION_ALERT',
        actions: [
          {
            identifier: 'OPEN_MAP',
            title: 'Open Map',
            options: { foreground: true },
          },
          {
            identifier: 'CALL_OWNER',
            title: 'Call Owner',
            options: { foreground: true },
          },
          {
            identifier: 'DISMISS',
            title: 'Dismiss',
            options: { foreground: false },
          },
        ],
        options: {
          hiddenPreviewsBodyPlaceholder: 'Location Update',
        },
      },
      {
        identifier: 'REMINDER',
        actions: [
          {
            identifier: 'MARK_DONE',
            title: 'Mark Done',
            options: { foreground: false },
          },
          {
            identifier: 'SNOOZE',
            title: 'Remind Later',
            options: { foreground: false },
          },
          {
            identifier: 'VIEW_DETAILS',
            title: 'View Details',
            options: { foreground: true },
          },
        ],
        options: {
          hiddenPreviewsBodyPlaceholder: 'Pet Reminder',
        },
      },
    ];
  }

  /**
   * Request iOS-specific notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice || Platform.OS !== 'ios') {
      console.warn('iOS notifications are only available on physical iOS devices');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: true,
            allowProvisional: false,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        await this.registerCategories();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register notification categories with iOS
   */
  private async registerCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(
        'PET_ALERT',
        this.categories.find(cat => cat.identifier === 'PET_ALERT')?.actions || [],
        this.categories.find(cat => cat.identifier === 'PET_ALERT')?.options || {}
      );

      await Notifications.setNotificationCategoryAsync(
        'LOCATION_ALERT',
        this.categories.find(cat => cat.identifier === 'LOCATION_ALERT')?.actions || [],
        this.categories.find(cat => cat.identifier === 'LOCATION_ALERT')?.options || {}
      );

      await Notifications.setNotificationCategoryAsync(
        'REMINDER',
        this.categories.find(cat => cat.identifier === 'REMINDER')?.actions || [],
        this.categories.find(cat => cat.identifier === 'REMINDER')?.options || {}
      );
    } catch (error) {
      console.error('Error registering notification categories:', error);
    }
  }

  /**
   * Send local notification with iOS-specific options
   */
  async sendLocalNotification(options: iOSNotificationOptions): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          subtitle: options.subtitle,
          categoryIdentifier: options.categoryIdentifier,
          threadIdentifier: options.threadIdentifier,
          targetContentIdentifier: options.targetContentIdentifier,
          interruptionLevel: options.interruptionLevel || 'active',
          relevanceScore: options.relevanceScore,
          filterCriteria: options.filterCriteria,
          sound: options.sound === false ? false : options.sound || 'default',
          badge: options.badge,
          launchImageName: options.launchImageName,
          attachments: options.attachments,
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification with iOS-specific timing
   */
  async scheduleNotification(
    options: iOSNotificationOptions,
    trigger: {
      type: 'time' | 'timeInterval' | 'calendar';
      seconds?: number;
      date?: Date;
      repeats?: boolean;
      hour?: number;
      minute?: number;
      weekday?: number;
    }
  ): Promise<string | null> {
    try {
      let notificationTrigger: any = null;

      switch (trigger.type) {
        case 'timeInterval':
          notificationTrigger = {
            seconds: trigger.seconds || 60,
            repeats: trigger.repeats || false,
          };
          break;
        case 'time':
          notificationTrigger = trigger.date || new Date(Date.now() + 60000);
          break;
        case 'calendar':
          notificationTrigger = {
            hour: trigger.hour,
            minute: trigger.minute,
            weekday: trigger.weekday,
            repeats: trigger.repeats || false,
          };
          break;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          subtitle: options.subtitle,
          categoryIdentifier: options.categoryIdentifier,
          threadIdentifier: options.threadIdentifier,
          targetContentIdentifier: options.targetContentIdentifier,
          interruptionLevel: options.interruptionLevel || 'active',
          relevanceScore: options.relevanceScore,
          filterCriteria: options.filterCriteria,
          sound: options.sound === false ? false : options.sound || 'default',
          badge: options.badge,
          launchImageName: options.launchImageName,
          attachments: options.attachments,
        },
        trigger: notificationTrigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Send critical alert (requires special entitlement)
   */
  async sendCriticalAlert(options: iOSNotificationOptions): Promise<string | null> {
    return this.sendLocalNotification({
      ...options,
      interruptionLevel: 'critical',
      sound: options.sound || 'default',
    });
  }

  /**
   * Send time-sensitive notification
   */
  async sendTimeSensitiveNotification(options: iOSNotificationOptions): Promise<string | null> {
    return this.sendLocalNotification({
      ...options,
      interruptionLevel: 'timeSensitive',
      relevanceScore: options.relevanceScore || 1.0,
    });
  }

  /**
   * Update app badge number
   */
  async updateBadge(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.updateBadge(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
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
   * Cancel specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Handle notification response (when user interacts with notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Handle received notifications (when app is in foreground)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }
}