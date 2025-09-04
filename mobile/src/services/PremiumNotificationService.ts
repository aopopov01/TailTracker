/**
 * TailTracker Premium Notification Service
 * 
 * This service acts as a wrapper around the UnifiedNotificationService
 * to enforce premium restrictions on push notifications. All notification
 * requests are validated against the user's subscription status.
 */

import {
  unifiedNotificationService,
  UnifiedNotification,
  NotificationType,
  TailTrackerNotifications,
} from './UnifiedNotificationService';
import { StripePaymentService } from './StripePaymentService';
import { PremiumGate } from '../components/Payment/PremiumGate';
import { router } from 'expo-router';
import { Alert } from 'react-native';

// Notification types that require premium access
const PREMIUM_NOTIFICATION_TYPES: NotificationType[] = [
  'lost_pet_alert',
  'pet_found',
  'vaccination_reminder',
  'medication_reminder',
  'appointment_reminder',
  'location_alert',
  'emergency_alert',
  'family_invite',
];

// Notification types that are always free (system notifications)
const FREE_NOTIFICATION_TYPES: NotificationType[] = [
  'system_update',
];

export interface PremiumNotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
  requiresPremium?: boolean;
  blockedFeature?: string;
}

export class PremiumNotificationService {
  private static instance: PremiumNotificationService;
  private paymentService: StripePaymentService;

  private constructor() {
    this.paymentService = StripePaymentService.getInstance();
  }

  static getInstance(): PremiumNotificationService {
    if (!PremiumNotificationService.instance) {
      PremiumNotificationService.instance = new PremiumNotificationService();
    }
    return PremiumNotificationService.instance;
  }

  /**
   * Initialize the premium notification service
   */
  async initialize(): Promise<boolean> {
    try {
      // Initialize the underlying unified notification service
      const unifiedInitialized = await unifiedNotificationService.initialize();
      
      if (!unifiedInitialized) {
        console.error('Failed to initialize UnifiedNotificationService');
        return false;
      }

      console.log('Premium Notification Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Premium Notification Service:', error);
      return false;
    }
  }

  /**
   * Check if a notification type requires premium access
   */
  private requiresPremium(notificationType: NotificationType): boolean {
    return PREMIUM_NOTIFICATION_TYPES.includes(notificationType);
  }

  /**
   * Check if user has premium access for notifications
   */
  private async checkPremiumAccess(): Promise<{
    hasPremium: boolean;
    subscriptionStatus?: any;
  }> {
    try {
      const subscriptionStatus = await this.paymentService.getSubscriptionStatus();
      
      return {
        hasPremium: subscriptionStatus.isPremium,
        subscriptionStatus,
      };
    } catch (error) {
      console.error('Error checking premium access:', error);
      return { hasPremium: false };
    }
  }

  /**
   * Send notification with premium access validation
   */
  async sendNotification(notification: UnifiedNotification): Promise<PremiumNotificationResult> {
    try {
      // Check if this notification type requires premium
      if (this.requiresPremium(notification.type)) {
        const { hasPremium, subscriptionStatus } = await this.checkPremiumAccess();
        
        if (!hasPremium) {
          console.log(`Blocking premium notification: ${notification.type}`);
          
          return {
            success: false,
            error: 'Premium subscription required for push notifications',
            requiresPremium: true,
            blockedFeature: 'push_notifications',
          };
        }
      }

      // If we reach here, either the notification is free or user has premium
      const result = await unifiedNotificationService.sendNotification(notification);
      
      return {
        success: result.success,
        notificationId: result.notificationId,
        error: result.error,
        requiresPremium: false,
      };
    } catch (error) {
      console.error('Error sending premium notification:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to send notification',
        requiresPremium: false,
      };
    }
  }

  /**
   * Show premium upgrade prompt for blocked notifications
   */
  showPremiumPrompt(feature: string = 'push_notifications'): void {
    Alert.alert(
      'Premium Feature',
      'Push notifications are only available for Premium subscribers. Upgrade now to receive important alerts about your pets.',
      [
        {
          text: 'Not Now',
          style: 'cancel',
        },
        {
          text: 'Learn More',
          onPress: () => {
            router.push('/subscription');
          },
        },
      ]
    );
  }

  /**
   * Send lost pet alert with premium check
   */
  async sendLostPetAlert(petData: Parameters<typeof TailTrackerNotifications.createLostPetAlert>[0]): Promise<PremiumNotificationResult> {
    const notification = TailTrackerNotifications.createLostPetAlert(petData);
    const result = await this.sendNotification(notification);
    
    if (result.requiresPremium) {
      this.showPremiumPrompt('lost_pet_alerts');
    }
    
    return result;
  }

  /**
   * Send vaccination reminder with premium check
   */
  async sendVaccinationReminder(petData: Parameters<typeof TailTrackerNotifications.createVaccinationReminder>[0]): Promise<PremiumNotificationResult> {
    const notification = TailTrackerNotifications.createVaccinationReminder(petData);
    const result = await this.sendNotification(notification);
    
    if (result.requiresPremium) {
      this.showPremiumPrompt('vaccination_reminders');
    }
    
    return result;
  }

  /**
   * Send emergency alert with premium check
   */
  async sendEmergencyAlert(petData: Parameters<typeof TailTrackerNotifications.createEmergencyAlert>[0]): Promise<PremiumNotificationResult> {
    const notification = TailTrackerNotifications.createEmergencyAlert(petData);
    const result = await this.sendNotification(notification);
    
    if (result.requiresPremium) {
      this.showPremiumPrompt('emergency_alerts');
    }
    
    return result;
  }

  /**
   * Send pet found notification with premium check
   */
  async sendPetFoundNotification(petData: Parameters<typeof TailTrackerNotifications.createPetFoundNotification>[0]): Promise<PremiumNotificationResult> {
    const notification = TailTrackerNotifications.createPetFoundNotification(petData);
    const result = await this.sendNotification(notification);
    
    if (result.requiresPremium) {
      this.showPremiumPrompt('lost_pet_alerts');
    }
    
    return result;
  }

  /**
   * Request notification permissions with premium context
   */
  async requestPermissions(options?: {
    showPremiumInfo?: boolean;
    criticalAlerts?: boolean;
  }): Promise<{
    granted: boolean;
    requiresPremium?: boolean;
    permissionState?: any;
  }> {
    try {
      // Show premium info if requested
      if (options?.showPremiumInfo) {
        const { hasPremium } = await this.checkPremiumAccess();
        
        if (!hasPremium) {
          Alert.alert(
            'Premium Push Notifications',
            'Push notifications for pet alerts, reminders, and emergencies are available with Premium subscription. You can still grant permission now and upgrade later.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Grant Permission',
                onPress: async () => {
                  const permissionState = await unifiedNotificationService.requestPermissions(options);
                  return {
                    granted: permissionState.granted,
                    requiresPremium: !hasPremium,
                    permissionState,
                  };
                }
              },
            ]
          );
          
          return { granted: false, requiresPremium: true };
        }
      }

      // Request permissions normally
      const permissionState = await unifiedNotificationService.requestPermissions(options);
      
      return {
        granted: permissionState.granted,
        requiresPremium: false,
        permissionState,
      };
    } catch (error) {
      console.error('Error requesting premium notification permissions:', error);
      return { granted: false, requiresPremium: false };
    }
  }

  /**
   * Get premium notification status summary
   */
  async getNotificationStatus(): Promise<{
    permissionsGranted: boolean;
    hasPremium: boolean;
    canSendNotifications: boolean;
    blockedNotificationTypes: NotificationType[];
  }> {
    try {
      const permissionState = unifiedNotificationService.getPermissionState();
      const { hasPremium } = await this.checkPremiumAccess();
      
      const blockedNotificationTypes = hasPremium 
        ? [] 
        : PREMIUM_NOTIFICATION_TYPES;

      return {
        permissionsGranted: permissionState?.granted || false,
        hasPremium,
        canSendNotifications: (permissionState?.granted || false) && hasPremium,
        blockedNotificationTypes,
      };
    } catch (error) {
      console.error('Error getting notification status:', error);
      return {
        permissionsGranted: false,
        hasPremium: false,
        canSendNotifications: false,
        blockedNotificationTypes: PREMIUM_NOTIFICATION_TYPES,
      };
    }
  }

  /**
   * Test premium notification (for premium users only)
   */
  async testPremiumNotification(): Promise<PremiumNotificationResult> {
    const { hasPremium } = await this.checkPremiumAccess();
    
    if (!hasPremium) {
      return {
        success: false,
        error: 'Premium subscription required',
        requiresPremium: true,
        blockedFeature: 'push_notifications',
      };
    }

    // Create test notification for premium users
    const testNotification: UnifiedNotification = {
      id: 'premium-test-' + Date.now(),
      type: 'lost_pet_alert',
      title: 'Premium Notifications Active! 🎉',
      body: 'You will now receive push notifications for pet alerts, reminders, and emergencies.',
      priority: 'default',
      channels: ['push', 'sound', 'badge'],
      data: {
        deepLinkRoute: '/settings/notifications',
      },
    };

    return await this.sendNotification(testNotification);
  }

  /**
   * Forward other methods to the underlying service
   */
  
  // Delegate permission-related methods
  getPermissionState() {
    return unifiedNotificationService.getPermissionState();
  }

  getPushToken() {
    return unifiedNotificationService.getPushToken();
  }

  getUserPreferences() {
    return unifiedNotificationService.getUserPreferences();
  }

  async updateUserPreferences(preferences: any) {
    return await unifiedNotificationService.updateUserPreferences(preferences);
  }

  async clearAllNotifications() {
    return await unifiedNotificationService.clearAllNotifications();
  }

  addEventListener(event: any, listener: any) {
    return unifiedNotificationService.addEventListener(event, listener);
  }

  getAnalytics() {
    return unifiedNotificationService.getAnalytics();
  }
}

// Export singleton instance
export const premiumNotificationService = PremiumNotificationService.getInstance();

// Helper functions for checking premium status
export const NotificationPremiumUtils = {
  /**
   * Check if notification type requires premium
   */
  isPremiumNotification: (type: NotificationType): boolean => {
    return PREMIUM_NOTIFICATION_TYPES.includes(type);
  },

  /**
   * Get list of premium notification features
   */
  getPremiumNotificationFeatures: (): string[] => {
    return [
      'Push notifications for lost pet alerts',
      'Vaccination and medication reminders',
      'Emergency pet alerts',
      'Family sharing notifications',
      'Location-based alerts',
      'Appointment reminders',
    ];
  },

  /**
   * Get notification feature description for premium gate
   */
  getNotificationFeatureDescription: (type: NotificationType): string => {
    const descriptions = {
      lost_pet_alert: 'Receive instant alerts when pets go missing in your area',
      pet_found: 'Get notified when lost pets are found safely',
      vaccination_reminder: 'Never miss important vaccination dates',
      medication_reminder: 'Stay on track with pet medication schedules',
      appointment_reminder: 'Get reminded about upcoming vet appointments',
      location_alert: 'Receive location-based safety alerts',
      emergency_alert: 'Get critical emergency notifications',
      family_invite: 'Share pet profiles with family members',
    };

    return descriptions[type] || 'Premium push notification feature';
  },
};