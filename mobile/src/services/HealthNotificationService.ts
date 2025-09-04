// TailTracker Health Notification Service for Premium/Pro Users
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { healthRecordsService, HealthNotification } from './HealthRecordsService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class HealthNotificationService {
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if user can create notifications (Premium/Pro only)
   */
  private async checkNotificationPermission(): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data: userRecord } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('auth_user_id', user.user.id)
        .single();

      return userRecord?.subscription_status === 'premium' || userRecord?.subscription_status === 'pro';
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }

  /**
   * Schedule a custom health reminder notification
   * Premium/Pro users only
   */
  async scheduleCustomReminder(
    petId: string,
    title: string,
    description: string,
    notificationDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has permission to create notifications
      const hasPermission = await this.checkNotificationPermission();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Health notifications are available in Premium and Pro tiers only.'
        };
      }

      // Check device notification permissions
      const devicePermission = await this.requestPermissions();
      if (!devicePermission) {
        return {
          success: false,
          error: 'Notification permission is required to set reminders.'
        };
      }

      // Create notification record in database
      const result = await healthRecordsService.createHealthNotification({
        pet_id: petId,
        notification_type: 'custom_reminder',
        title,
        description,
        notification_date: notificationDate.toISOString()
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Schedule local notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🐾 ${title}`,
          body: description,
          data: {
            type: 'health_reminder',
            petId,
            notificationId: result.notification?.id
          }
        },
        trigger: {
          date: notificationDate,
        }
      });

      return { success: true };

    } catch (error: any) {
      console.error('Error scheduling custom reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule vaccination reminder notification
   * Premium/Pro users only
   */
  async scheduleVaccinationReminder(
    petId: string,
    vaccinationId: string,
    vaccineName: string,
    dueDate: Date,
    daysBefore: number = 7
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has permission to create notifications
      const hasPermission = await this.checkNotificationPermission();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Health notifications are available in Premium and Pro tiers only.'
        };
      }

      // Check device notification permissions
      const devicePermission = await this.requestPermissions();
      if (!devicePermission) {
        return {
          success: false,
          error: 'Notification permission is required to set reminders.'
        };
      }

      // Calculate reminder date
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - daysBefore);

      // Skip if reminder date is in the past
      if (reminderDate <= new Date()) {
        return {
          success: false,
          error: `Vaccination is due too soon to set a ${daysBefore}-day reminder.`
        };
      }

      // Create notification record in database
      const result = await healthRecordsService.createHealthNotification({
        pet_id: petId,
        notification_type: 'vaccination_reminder',
        title: `${vaccineName} Vaccination Due`,
        description: `Don't forget to schedule the ${vaccineName} vaccination appointment.`,
        notification_date: reminderDate.toISOString(),
        vaccination_id: vaccinationId
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Schedule local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💉 Vaccination Reminder',
          body: `${vaccineName} vaccination is due in ${daysBefore} days`,
          data: {
            type: 'vaccination_reminder',
            petId,
            vaccinationId,
            notificationId: result.notification?.id
          }
        },
        trigger: {
          date: reminderDate,
        }
      });

      return { success: true };

    } catch (error: any) {
      console.error('Error scheduling vaccination reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<{ success: boolean }> {
    try {
      // Cancel local notification
      await Notifications.cancelScheduledNotificationAsync(notificationId);

      // Delete from database
      await healthRecordsService.deleteHealthNotification(notificationId);

      return { success: true };

    } catch (error) {
      console.error('Error canceling notification:', error);
      return { success: false };
    }
  }

  /**
   * Get all pending notifications for the user
   */
  async getPendingNotifications(): Promise<HealthNotification[]> {
    try {
      return await healthRecordsService.getHealthNotifications();
    } catch (error) {
      console.error('Error fetching pending notifications:', error);
      return [];
    }
  }

  /**
   * Cancel all scheduled notifications for the user
   */
  async cancelAllNotifications(): Promise<{ success: boolean }> {
    try {
      // Get all pending notifications
      const notifications = await this.getPendingNotifications();

      // Cancel each notification
      for (const notification of notifications) {
        await this.cancelNotification(notification.id);
      }

      return { success: true };

    } catch (error) {
      console.error('Error canceling all notifications:', error);
      return { success: false };
    }
  }

  /**
   * Handle received notification (when user taps it)
   */
  async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
    try {
      const data = notification.request.content.data;
      
      if (data?.notificationId) {
        // Mark notification as sent in database
        await healthRecordsService.markNotificationSent(data.notificationId);
      }

      // Handle different notification types
      switch (data?.type) {
        case 'vaccination_reminder':
          // Navigate to vaccination details or schedule appointment
          console.log('Handle vaccination reminder tap');
          break;
        case 'health_reminder':
          // Navigate to health records or show reminder details
          console.log('Handle health reminder tap');
          break;
        default:
          console.log('Unknown notification type:', data?.type);
      }

    } catch (error) {
      console.error('Error handling notification received:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners(): () => void {
    // Listen for notifications while app is foregrounded
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // Listen for user tapping on notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      this.handleNotificationReceived(response.notification);
    });

    // Return cleanup function
    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }

  /**
   * Get notification statistics for analytics
   */
  async getNotificationStats(): Promise<{
    totalScheduled: number;
    totalSent: number;
    pendingCount: number;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { totalScheduled: 0, totalSent: 0, pendingCount: 0 };
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) {
        return { totalScheduled: 0, totalSent: 0, pendingCount: 0 };
      }

      // Get all notifications
      const { data: allNotifications } = await supabase
        .from('health_notifications')
        .select('is_sent')
        .eq('user_id', userRecord.id);

      if (!allNotifications) {
        return { totalScheduled: 0, totalSent: 0, pendingCount: 0 };
      }

      const totalScheduled = allNotifications.length;
      const totalSent = allNotifications.filter(n => n.is_sent).length;
      const pendingCount = totalScheduled - totalSent;

      return { totalScheduled, totalSent, pendingCount };

    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { totalScheduled: 0, totalSent: 0, pendingCount: 0 };
    }
  }
}

export const healthNotificationService = new HealthNotificationService();