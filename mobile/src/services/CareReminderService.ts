import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addMinutes, isBefore, isAfter } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { CareTask, ReminderSettings, WellnessAlert } from '../types/Wellness';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface ScheduledReminder {
  id: string;
  taskId: string;
  notificationId: string;
  scheduledTime: string;
  type: 'initial' | 'repeat';
  repeatCount: number;
}

interface NotificationTemplate {
  title: string;
  body: string;
  categoryId?: string;
  sound?: string;
  priority?: 'default' | 'high' | 'low';
}

class CareReminderService {
  private scheduledReminders: Map<string, ScheduledReminder[]> = new Map();
  private notificationTemplates: Map<string, NotificationTemplate> = new Map();
  private isInitialized = false;

  private readonly REMINDERS_STORAGE_KEY = 'tailtracker_scheduled_reminders';

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Request notification permissions
      await this.requestNotificationPermissions();
      
      // Set up notification categories
      await this.setupNotificationCategories();
      
      // Load stored reminders
      await this.loadStoredReminders();
      
      // Setup notification templates
      this.setupNotificationTemplates();
      
      // Clean up expired reminders
      await this.cleanupExpiredReminders();
      
      this.isInitialized = true;
      console.log('CareReminderService initialized successfully');
    } catch (error) {
      console.error('Error initializing CareReminderService:', error);
    }
  }

  private async requestNotificationPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidNotificationChannels();
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  private async setupAndroidNotificationChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('care-reminders', {
      name: 'Care Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: 'default',
      description: 'Notifications for pet care tasks and reminders',
    });

    await Notifications.setNotificationChannelAsync('health-alerts', {
      name: 'Health Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#F44336',
      sound: 'default',
      description: 'Important health alerts and emergency notifications',
    });

    await Notifications.setNotificationChannelAsync('wellness-insights', {
      name: 'Wellness Insights',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#2196F3',
      sound: 'default',
      description: 'Wellness insights and recommendations',
    });
  }

  private async setupNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync('CARE_TASK', [
        {
          identifier: 'COMPLETE_TASK',
          buttonTitle: 'Mark Complete',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'SNOOZE_TASK',
          buttonTitle: 'Snooze 15m',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('HEALTH_ALERT', [
        {
          identifier: 'VIEW_ALERT',
          buttonTitle: 'View Details',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'ACKNOWLEDGE_ALERT',
          buttonTitle: 'Acknowledge',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    } catch (error) {
      console.error('Error setting up notification categories:', error);
    }
  }

  private setupNotificationTemplates(): void {
    this.notificationTemplates.set('feeding', {
      title: '🍽️ Feeding Time',
      body: 'Time to feed {petName}!',
      categoryId: 'CARE_TASK',
      priority: 'high',
    });

    this.notificationTemplates.set('medication', {
      title: '💊 Medication Reminder',
      body: 'Give {petName} their {medicationName} medication',
      categoryId: 'CARE_TASK',
      priority: 'high',
    });

    this.notificationTemplates.set('grooming', {
      title: '✂️ Grooming Time',
      body: 'Time for {petName}\'s grooming session',
      categoryId: 'CARE_TASK',
      priority: 'default',
    });

    this.notificationTemplates.set('exercise', {
      title: '🏃 Exercise Time',
      body: 'Time for {petName}\'s exercise or walk',
      categoryId: 'CARE_TASK',
      priority: 'default',
    });

    this.notificationTemplates.set('vet_appointment', {
      title: '🏥 Vet Appointment',
      body: '{petName} has a vet appointment soon',
      categoryId: 'CARE_TASK',
      priority: 'high',
    });

    this.notificationTemplates.set('vaccination', {
      title: '💉 Vaccination Due',
      body: '{petName} needs their vaccination',
      categoryId: 'CARE_TASK',
      priority: 'high',
    });

    this.notificationTemplates.set('weight_check', {
      title: '⚖️ Weight Check',
      body: 'Time to check {petName}\'s weight',
      categoryId: 'CARE_TASK',
      priority: 'default',
    });

    this.notificationTemplates.set('health_alert', {
      title: '🚨 Health Alert',
      body: '{alertMessage}',
      categoryId: 'HEALTH_ALERT',
      priority: 'high',
    });
  }

  async scheduleTaskReminder(task: CareTask, petName: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.warn('CareReminderService not initialized');
        return false;
      }

      if (!task.reminderSettings.enabled) {
        return true; // No reminder needed
      }

      const dueDate = new Date(task.dueDate);
      const reminderTime = addMinutes(dueDate, -task.reminderSettings.advanceNotice);

      // Don't schedule if reminder time is in the past
      if (isBefore(reminderTime, new Date())) {
        console.log(`Reminder time is in the past for task: ${task.title}`);
        return false;
      }

      const template = this.notificationTemplates.get(task.type) || 
                      this.notificationTemplates.get('default') || 
                      { title: 'Care Reminder', body: 'You have a care task due' };

      const notificationContent = {
        title: template.title,
        body: this.formatNotificationBody(template.body, { 
          petName, 
          medicationName: task.title.includes('medication') ? task.title : undefined 
        }),
        data: {
          taskId: task.id,
          type: 'care_task',
          petName,
        },
        categoryIdentifier: template.categoryId,
        priority: template.priority as any,
        sound: Platform.OS === 'android' ? 'default' : undefined,
      };

      // Schedule initial reminder
      const initialNotificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          date: reminderTime,
        },
      });

      const initialReminder: ScheduledReminder = {
        id: `${task.id}_initial`,
        taskId: task.id,
        notificationId: initialNotificationId,
        scheduledTime: reminderTime.toISOString(),
        type: 'initial',
        repeatCount: 0,
      };

      // Schedule repeat reminders if configured
      const reminders: ScheduledReminder[] = [initialReminder];
      
      if (task.reminderSettings.repeatInterval && task.reminderSettings.maxRepeats) {
        for (let i = 1; i <= task.reminderSettings.maxRepeats; i++) {
          const repeatTime = addMinutes(reminderTime, task.reminderSettings.repeatInterval * i);
          
          if (isAfter(repeatTime, dueDate)) {
            break; // Don't repeat after due time
          }

          const repeatNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              ...notificationContent,
              title: `🔔 Reminder: ${template.title}`,
            },
            trigger: {
              date: repeatTime,
            },
          });

          reminders.push({
            id: `${task.id}_repeat_${i}`,
            taskId: task.id,
            notificationId: repeatNotificationId,
            scheduledTime: repeatTime.toISOString(),
            type: 'repeat',
            repeatCount: i,
          });
        }
      }

      this.scheduledReminders.set(task.id, reminders);
      await this.saveScheduledReminders();

      console.log(`Scheduled ${reminders.length} reminders for task: ${task.title}`);
      return true;
    } catch (error) {
      console.error('Error scheduling task reminder:', error);
      return false;
    }
  }

  async cancelTaskReminders(taskId: string): Promise<boolean> {
    try {
      const reminders = this.scheduledReminders.get(taskId);
      if (!reminders) {
        return true; // No reminders to cancel
      }

      // Cancel all scheduled notifications
      const notificationIds = reminders.map(r => r.notificationId);
      await Promise.all(
        notificationIds.map(id => 
          Notifications.cancelScheduledNotificationAsync(id).catch(err => 
            console.warn(`Failed to cancel notification ${id}:`, err)
          )
        )
      );

      this.scheduledReminders.delete(taskId);
      await this.saveScheduledReminders();

      console.log(`Cancelled ${reminders.length} reminders for task: ${taskId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling task reminders:', error);
      return false;
    }
  }

  async scheduleHealthAlert(alert: WellnessAlert, petName: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.warn('CareReminderService not initialized');
        return false;
      }

      const template = this.notificationTemplates.get('health_alert') || 
                      { title: 'Health Alert', body: '{alertMessage}' };

      const channelId = this.getChannelForSeverity(alert.severity);

      const notificationContent = {
        title: template.title,
        body: this.formatNotificationBody(template.body, { 
          alertMessage: alert.message,
          petName 
        }),
        data: {
          alertId: alert.id,
          type: 'health_alert',
          severity: alert.severity,
          petName,
        },
        categoryIdentifier: template.categoryId,
        priority: this.getPriorityForSeverity(alert.severity),
        sound: Platform.OS === 'android' ? 'default' : undefined,
      };

      // Add Android-specific channel
      if (Platform.OS === 'android') {
        (notificationContent as any).channelId = channelId;
      }

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Send immediately
      });

      console.log(`Scheduled health alert notification: ${alert.title}`);
      return true;
    } catch (error) {
      console.error('Error scheduling health alert:', error);
      return false;
    }
  }

  async snoozeTaskReminder(taskId: string, snoozeMinutes: number = 15): Promise<boolean> {
    try {
      // Cancel existing reminders
      await this.cancelTaskReminders(taskId);

      // Schedule new reminder after snooze period
      const snoozeTime = addMinutes(new Date(), snoozeMinutes);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Snoozed Reminder',
          body: 'You have a snoozed care task',
          data: {
            taskId,
            type: 'snoozed_task',
          },
          categoryIdentifier: 'CARE_TASK',
        },
        trigger: {
          date: snoozeTime,
        },
      });

      const snoozeReminder: ScheduledReminder = {
        id: `${taskId}_snooze`,
        taskId,
        notificationId,
        scheduledTime: snoozeTime.toISOString(),
        type: 'repeat',
        repeatCount: 0,
      };

      this.scheduledReminders.set(taskId, [snoozeReminder]);
      await this.saveScheduledReminders();

      console.log(`Snoozed task reminder for ${snoozeMinutes} minutes: ${taskId}`);
      return true;
    } catch (error) {
      console.error('Error snoozing task reminder:', error);
      return false;
    }
  }

  async getScheduledRemindersCount(): Promise<number> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      return scheduledNotifications.length;
    } catch (error) {
      console.error('Error getting scheduled reminders count:', error);
      return 0;
    }
  }

  async getUpcomingReminders(hours: number = 24): Promise<ScheduledReminder[]> {
    const now = new Date();
    const cutoff = addMinutes(now, hours * 60);
    const upcoming: ScheduledReminder[] = [];

    for (const reminders of this.scheduledReminders.values()) {
      for (const reminder of reminders) {
        const reminderTime = new Date(reminder.scheduledTime);
        if (isAfter(reminderTime, now) && isBefore(reminderTime, cutoff)) {
          upcoming.push(reminder);
        }
      }
    }

    return upcoming.sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }

  private formatNotificationBody(template: string, variables: Record<string, any>): string {
    let formatted = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      if (value !== undefined) {
        formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      }
    });

    return formatted;
  }

  private getChannelForSeverity(severity: string): string {
    switch (severity) {
      case 'critical':
      case 'emergency':
        return 'health-alerts';
      case 'warning':
        return 'care-reminders';
      default:
        return 'wellness-insights';
    }
  }

  private getPriorityForSeverity(severity: string): 'default' | 'high' | 'low' {
    switch (severity) {
      case 'critical':
      case 'emergency':
        return 'high';
      case 'warning':
        return 'high';
      default:
        return 'default';
    }
  }

  private async loadStoredReminders(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.REMINDERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.scheduledReminders = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error loading stored reminders:', error);
    }
  }

  private async saveScheduledReminders(): Promise<void> {
    try {
      const data = Object.fromEntries(this.scheduledReminders);
      await AsyncStorage.setItem(this.REMINDERS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving scheduled reminders:', error);
    }
  }

  private async cleanupExpiredReminders(): Promise<void> {
    try {
      const now = new Date();
      let cleaned = 0;

      for (const [taskId, reminders] of this.scheduledReminders) {
        const activeReminders = reminders.filter(reminder => 
          isAfter(new Date(reminder.scheduledTime), now)
        );

        if (activeReminders.length === 0) {
          this.scheduledReminders.delete(taskId);
          cleaned++;
        } else if (activeReminders.length !== reminders.length) {
          this.scheduledReminders.set(taskId, activeReminders);
        }
      }

      if (cleaned > 0) {
        await this.saveScheduledReminders();
        console.log(`Cleaned up ${cleaned} expired reminder sets`);
      }
    } catch (error) {
      console.error('Error cleaning up expired reminders:', error);
    }
  }

  // Public utility methods
  async updateNotificationSettings(settings: {
    enabled: boolean;
    quietHours?: { start: string; end: string };
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
  }): Promise<boolean> {
    try {
      // This would integrate with user preferences
      console.log('Updated notification settings:', settings);
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }

  async testNotification(title: string = 'Test Notification', body: string = 'This is a test'): Promise<boolean> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { test: true },
        },
        trigger: null,
      });
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  getNotificationStats(): {
    totalScheduled: number;
    byType: Record<string, number>;
  } {
    let totalScheduled = 0;
    const byType: Record<string, number> = {};

    for (const reminders of this.scheduledReminders.values()) {
      totalScheduled += reminders.length;
      for (const reminder of reminders) {
        byType[reminder.type] = (byType[reminder.type] || 0) + 1;
      }
    }

    return { totalScheduled, byType };
  }
}

// Export singleton instance
export const careReminderService = new CareReminderService();

// Helper functions for notification handling
export const NotificationHelpers = {
  /**
   * Handle notification received while app is active
   */
  handleNotificationReceived: (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    
    const { data } = notification.request.content;
    
    switch (data?.type) {
      case 'care_task':
        // Navigate to task details or show in-app alert
        console.log('Care task notification:', data.taskId);
        break;
      case 'health_alert':
        // Show health alert modal
        console.log('Health alert notification:', data.alertId);
        break;
      default:
        console.log('Unknown notification type:', data?.type);
    }
  },

  /**
   * Handle notification tap (when app is opened via notification)
   */
  handleNotificationResponse: (response: Notifications.NotificationResponse) => {
    const { notification, actionIdentifier } = response;
    const { data } = notification.request.content;

    console.log('Notification response:', actionIdentifier, data);

    switch (actionIdentifier) {
      case 'COMPLETE_TASK':
        // Mark task as complete
        console.log('Complete task action:', data?.taskId);
        break;
      case 'SNOOZE_TASK':
        // Snooze task for 15 minutes
        if (data?.taskId) {
          careReminderService.snoozeTaskReminder(data.taskId, 15);
        }
        break;
      case 'VIEW_ALERT':
        // Navigate to alert details
        console.log('View alert action:', data?.alertId);
        break;
      case 'ACKNOWLEDGE_ALERT':
        // Mark alert as acknowledged
        console.log('Acknowledge alert action:', data?.alertId);
        break;
      default:
        // Default tap - navigate to relevant screen
        console.log('Default notification tap');
    }
  },

  /**
   * Format time for display in reminders
   */
  formatReminderTime: (dateString: string): string => {
    return format(new Date(dateString), 'MMM dd, h:mm a');
  },

  /**
   * Get reminder status color
   */
  getReminderStatusColor: (scheduledTime: string): string => {
    const now = new Date();
    const reminderTime = new Date(scheduledTime);
    
    if (isBefore(reminderTime, now)) {
      return '#999'; // Past
    } else if (isBefore(reminderTime, addMinutes(now, 60))) {
      return '#F44336'; // Within 1 hour
    } else if (isBefore(reminderTime, addMinutes(now, 24 * 60))) {
      return '#FF9800'; // Within 24 hours
    } else {
      return '#4CAF50'; // Future
    }
  },
};