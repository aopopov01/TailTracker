// Unified Notification Service - Stub implementation for simplified feature set

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  importance: 'low' | 'default' | 'high' | 'max';
  sound?: string;
  vibration?: boolean;
}

export interface UnifiedNotification {
  id: string;
  title: string;
  body: string;
  channelId: string;
  priority: 'low' | 'default' | 'high' | 'max';
  data?: Record<string, any>;
  scheduledTime?: Date;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  vaccinationReminders: boolean;
  lostPetAlerts: boolean;
  marketingUpdates: boolean;
}

export interface NotificationAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  actionClicked: number;
  errors: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export type NotificationEvent = 'permission_changed' | 'notification_received' | 'notification_opened' | 'notification_dismissed';

export type NotificationEventListener = (eventName: string, data: any) => void;

export type NotificationType = 'lost_pet_alerts' | 'emergency_alerts' | 'vaccination_reminders' | 'appointment_reminders' | 'health_updates' | 'community_updates' | 'marketing_updates';

export interface PermissionState {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface TailTrackerNotificationContext {
  service: UnifiedNotificationService;
  preferences: NotificationPreferences;
  analytics: NotificationAnalytics;
}

export class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private pushToken: string | null = null;
  private permissionState: PermissionState = { granted: false, canAskAgain: true, status: 'undetermined' };
  private preferences: NotificationPreferences = {
    pushEnabled: true,
    emailEnabled: false,
    smsEnabled: false,
    vaccinationReminders: true,
    lostPetAlerts: true,
    marketingUpdates: false,
  };
  private analytics: NotificationAnalytics = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    actionClicked: 0,
    errors: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
  };

  public static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }

  // Create notification channel (stub)
  async createChannel(channel: NotificationChannel): Promise<void> {
    console.log('UnifiedNotificationService: Creating channel (stub)', channel);
  }

  // Send notification (stub)
  async sendNotification(notification: UnifiedNotification): Promise<string> {
    console.log('UnifiedNotificationService: Sending notification (stub)', notification);
    return `notification_${Date.now()}`;
  }

  // Schedule notification (stub)
  async scheduleNotification(notification: UnifiedNotification): Promise<string> {
    console.log('UnifiedNotificationService: Scheduling notification (stub)', notification);
    return `scheduled_${Date.now()}`;
  }

  // Cancel notification (stub)
  async cancelNotification(notificationId: string): Promise<void> {
    console.log('UnifiedNotificationService: Canceling notification (stub)', { notificationId });
  }

  // Get notification history (stub)
  async getNotificationHistory(userId: string): Promise<UnifiedNotification[]> {
    console.log('UnifiedNotificationService: Getting notification history (stub)', { userId });
    return [];
  }

  // Request permissions (stub)
  async requestPermissions(): Promise<boolean> {
    console.log('UnifiedNotificationService: Requesting permissions (stub)');
    return true;
  }

  // Get permission state (stub) - returns status string  
  async getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    console.log('UnifiedNotificationService: Getting permission status (stub)');
    return 'granted';
  }

  // Open settings (stub)
  async openSettingsAsync(): Promise<void> {
    console.log('UnifiedNotificationService: Opening settings (stub)');
  }

  // Initialize service (stub)
  async initialize(): Promise<boolean> {
    console.log('UnifiedNotificationService: Initializing (stub)');
    return true;
  }

  // Get push token (stub)
  getPushToken(): string | null {
    return this.pushToken;
  }

  // Get permission state (stub)
  getPermissionState(): PermissionState {
    return this.permissionState;
  }

  // Get user preferences (stub)
  getUserPreferences(): NotificationPreferences {
    return this.preferences;
  }

  // Get analytics (stub)
  getAnalytics(): NotificationAnalytics {
    return this.analytics;
  }

  // Update user preferences (stub)
  async updateUserPreferences(newPreferences: Partial<NotificationPreferences>): Promise<void> {
    console.log('UnifiedNotificationService: Updating preferences (stub)', newPreferences);
    this.preferences = { ...this.preferences, ...newPreferences };
  }

  // Clear all notifications (stub)
  async clearAllNotifications(): Promise<void> {
    console.log('UnifiedNotificationService: Clearing all notifications (stub)');
  }

  // Test notification (stub)
  async testNotification(): Promise<string> {
    console.log('UnifiedNotificationService: Sending test notification (stub)');
    return `test_${Date.now()}`;
  }

  // Add event listener (stub) - returns removal function
  addEventListener(event: NotificationEvent, listener: NotificationEventListener): () => void {
    console.log('UnifiedNotificationService: Adding event listener (stub)', { event });
    return () => {
      console.log('UnifiedNotificationService: Removing event listener (stub)', { event });
    };
  }
}

// TailTracker-specific notification builders
export const TailTrackerNotifications = {
  createLostPetAlert: (petData: any): UnifiedNotification => ({
    id: `lost_pet_${Date.now()}`,
    title: `Lost Pet Alert: ${petData.name}`,
    body: `${petData.name} is missing in your area`,
    channelId: 'lost_pets',
    priority: 'high',
    data: { type: 'lost_pet_alert', ...petData },
  }),

  createPetFoundNotification: (petData: any): UnifiedNotification => ({
    id: `found_pet_${Date.now()}`,
    title: `Pet Found: ${petData.name}`,
    body: `Great news! ${petData.name} has been found`,
    channelId: 'pet_updates',
    priority: 'high',
    data: { type: 'pet_found', ...petData },
  }),

  createVaccinationReminder: (petData: any): UnifiedNotification => ({
    id: `vaccination_${Date.now()}`,
    title: `Vaccination Reminder for ${petData.name}`,
    body: `${petData.vaccineName} is due for ${petData.name}`,
    channelId: 'health_reminders',
    priority: 'default',
    data: { type: 'vaccination_reminder', ...petData },
  }),

  createEmergencyAlert: (petData: any): UnifiedNotification => ({
    id: `emergency_${Date.now()}`,
    title: `Emergency Alert: ${petData.name}`,
    body: `Urgent attention needed for ${petData.name}`,
    channelId: 'emergency',
    priority: 'max',
    data: { type: 'emergency_alert', ...petData },
  }),
};

// Create singleton instance for export
export const unifiedNotificationService = UnifiedNotificationService.getInstance();

export default UnifiedNotificationService;