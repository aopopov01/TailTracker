/**
 * TailTracker Unified Cross-Platform Notification Service
 * 
 * This service provides consistent push notification functionality across iOS and Android,
 * addressing the QA issues identified in the master report:
 * - Inconsistent delivery between platforms
 * - Different UX patterns
 * - Missing deep linking
 * - Permission handling inconsistencies
 * - Background processing issues
 * - Rich content support
 */

import { Platform, AppState, AppStateStatus, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { supabase } from './supabase';
import { androidNotificationService, NotificationChannelId } from './AndroidNotificationService';
import { iOSNotificationService } from './iOSNotificationService';

// Storage keys
const STORAGE_KEYS = {
  PUSH_TOKEN: '@TailTracker:unified_push_token',
  PERMISSION_STATE: '@TailTracker:notification_permission_state',
  DELIVERY_ANALYTICS: '@TailTracker:notification_analytics',
  USER_PREFERENCES: '@TailTracker:notification_preferences',
  DEEP_LINK_QUEUE: '@TailTracker:deep_link_queue',
} as const;

// Background task name
const BACKGROUND_NOTIFICATION_TASK = 'background-notification-sync';

// Notification types for TailTracker
export type NotificationType = 
  | 'lost_pet_alert'
  | 'pet_found'
  | 'vaccination_reminder'
  | 'medication_reminder'
  | 'appointment_reminder'
  | 'location_alert'
  | 'emergency_alert'
  | 'social_interaction'
  | 'family_invite'
  | 'system_update';

// Priority levels
export type NotificationPriority = 'low' | 'default' | 'high' | 'critical';

// Delivery channels
export type DeliveryChannel = 'push' | 'in_app' | 'badge' | 'sound' | 'vibration';

// Deep link routes
export type DeepLinkRoute = 
  | '/pets/[id]'
  | '/lost-pets'
  | '/lost-pets/[id]'
  | '/health/vaccinations'
  | '/health/medications'
  | '/appointments'
  | '/family'
  | '/settings/notifications'
  | '/emergency/[petId]';

// Core notification interface
export interface UnifiedNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  subtitle?: string;
  priority: NotificationPriority;
  channels: DeliveryChannel[];
  data: {
    petId?: string;
    userId?: string;
    actionUrl?: string;
    deepLinkRoute?: DeepLinkRoute;
    routeParams?: Record<string, any>;
    customData?: Record<string, any>;
  };
  rich?: {
    imageUrl?: string;
    thumbnailUrl?: string;
    actions?: NotificationAction[];
    category?: string;
  };
  scheduling?: {
    scheduledFor?: Date;
    repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
    timezone?: string;
  };
  analytics?: {
    campaignId?: string;
    source?: string;
    tags?: string[];
  };
}

// Action button interface
export interface NotificationAction {
  id: string;
  title: string;
  destructive?: boolean;
  requiresAuth?: boolean;
  opensApp?: boolean;
  deepLinkRoute?: DeepLinkRoute;
  routeParams?: Record<string, any>;
}

// Permission state interface
export interface PermissionState {
  granted: boolean;
  requestedAt?: Date;
  deniedCount: number;
  shouldShowRationale: boolean;
  criticalAlertsEnabled?: boolean; // iOS specific
}

// User preferences interface
export interface NotificationPreferences {
  enabled: boolean;
  types: {
    [K in NotificationType]: {
      enabled: boolean;
      channels: DeliveryChannel[];
      quietHours?: {
        enabled: boolean;
        startHour: number;
        endHour: number;
      };
    };
  };
  globalSettings: {
    quietHoursEnabled: boolean;
    quietHoursStart: string; // "22:00"
    quietHoursEnd: string; // "07:00"
    locationBasedEnabled: boolean;
    emergencyOverride: boolean;
    groupByPet: boolean;
    summaryMode: boolean;
  };
}

// Analytics interface
export interface NotificationAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  dismissed: number;
  actionClicked: number;
  errors: number;
  lastUpdated: Date;
  platformBreakdown: {
    ios: { sent: number; delivered: number; opened: number };
    android: { sent: number; delivered: number; opened: number };
  };
}

// Event listener types
export type NotificationEvent = 'received' | 'opened' | 'dismissed' | 'action_clicked' | 'permission_changed';
export type NotificationEventListener = (event: string, data: any) => void;

export class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private pushToken: string | null = null;
  private permissionState: PermissionState | null = null;
  private preferences: NotificationPreferences | null = null;
  private analytics: NotificationAnalytics | null = null;
  private eventListeners: Map<NotificationEvent, Set<NotificationEventListener>> = new Map();
  private deepLinkQueue: Array<{ route: DeepLinkRoute; params?: Record<string, any> }> = [];
  private isInitialized = false;
  private appStateListener: any = null;

  private constructor() {
    this.initializeEventListeners();
  }

  static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }

  /**
   * Initialize the unified notification service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log('Initializing Unified Notification Service...');
      
      // Load stored data
      await Promise.all([
        this.loadPermissionState(),
        this.loadUserPreferences(),
        this.loadAnalytics(),
        this.loadDeepLinkQueue(),
      ]);

      // Configure platform-specific handlers
      await this.configurePlatformHandlers();

      // Setup background processing
      await this.setupBackgroundProcessing();

      // Setup deep linking
      this.setupDeepLinking();

      // Setup app state monitoring
      this.setupAppStateMonitoring();

      this.isInitialized = true;
      console.log('Unified Notification Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Unified Notification Service:', error);
      return false;
    }
  }

  /**
   * Request notification permissions with platform-specific handling
   */
  async requestPermissions(options?: {
    showRationale?: boolean;
    criticalAlerts?: boolean;
  }): Promise<PermissionState> {
    try {
      let granted = false;
      let criticalAlertsEnabled = false;

      if (Platform.OS === 'ios') {
        const iosService = iOSNotificationService.getInstance();
        granted = await iosService.requestPermissions();
        
        if (options?.criticalAlerts) {
          // Critical alerts require special entitlement
          try {
            await iosService.sendCriticalAlert({
              title: 'Critical Alerts Enabled',
              body: 'You will now receive critical pet emergency alerts.',
            });
            criticalAlertsEnabled = true;
          } catch (error) {
            console.warn('Critical alerts not available:', error);
          }
        }
      } else {
        granted = await androidNotificationService.requestNotificationPermissions();
      }

      // Update permission state
      this.permissionState = {
        granted,
        requestedAt: new Date(),
        deniedCount: granted ? 0 : (this.permissionState?.deniedCount || 0) + 1,
        shouldShowRationale: !granted && (this.permissionState?.deniedCount || 0) > 0,
        criticalAlertsEnabled,
      };

      // Store permission state
      await AsyncStorage.setItem(
        STORAGE_KEYS.PERMISSION_STATE,
        JSON.stringify(this.permissionState)
      );

      // Emit permission changed event
      this.emitEvent('permission_changed', this.permissionState);

      // Register for push notifications if granted
      if (granted) {
        await this.registerForPushNotifications();
      }

      return this.permissionState;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    }
  }

  /**
   * Register for push notifications
   */
  private async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications require a physical device');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      });

      this.pushToken = token.data;
      
      // Store token
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token.data);
      
      // Update user profile with token
      await this.updateUserPushToken(token.data);

      console.log('Push notification token registered:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Send notification through unified interface
   */
  async sendNotification(notification: UnifiedNotification): Promise<{
    success: boolean;
    notificationId?: string;
    error?: string;
  }> {
    try {
      // Check permissions
      if (!this.permissionState?.granted) {
        return { success: false, error: 'Permissions not granted' };
      }

      // Check user preferences
      if (!this.isNotificationAllowed(notification)) {
        return { success: false, error: 'Notification blocked by user preferences' };
      }

      // Check quiet hours
      if (this.isInQuietHours(notification)) {
        return { success: false, error: 'Notification blocked by quiet hours' };
      }

      let notificationId: string | null = null;

      if (Platform.OS === 'ios') {
        notificationId = await this.sendIOSNotification(notification);
      } else {
        notificationId = await this.sendAndroidNotification(notification);
      }

      if (notificationId) {
        // Update analytics
        await this.updateAnalytics('sent', notification);
        
        // Store notification for delivery tracking
        await this.storeNotificationForTracking(notificationId, notification);

        return { success: true, notificationId };
      } else {
        await this.updateAnalytics('errors', notification);
        return { success: false, error: 'Failed to send notification' };
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      await this.updateAnalytics('errors', notification);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send iOS notification
   */
  private async sendIOSNotification(notification: UnifiedNotification): Promise<string | null> {
    const iosService = iOSNotificationService.getInstance();
    
    const options = {
      title: notification.title,
      body: notification.body,
      subtitle: notification.subtitle,
      categoryIdentifier: this.mapTypeToIOSCategory(notification.type),
      threadIdentifier: notification.data.petId,
      interruptionLevel: this.mapPriorityToIOSLevel(notification.priority),
      relevanceScore: this.calculateRelevanceScore(notification),
      sound: notification.channels.includes('sound'),
      badge: notification.channels.includes('badge') ? 1 : undefined,
      attachments: notification.rich?.imageUrl ? [{
        url: notification.rich.imageUrl,
      }] : undefined,
    };

    if (notification.priority === 'critical') {
      return await iosService.sendCriticalAlert(options);
    } else if (notification.priority === 'high') {
      return await iosService.sendTimeSensitiveNotification(options);
    } else {
      return await iosService.sendLocalNotification(options);
    }
  }

  /**
   * Send Android notification
   */
  private async sendAndroidNotification(notification: UnifiedNotification): Promise<string | null> {
    const channelId = this.mapTypeToAndroidChannel(notification.type);
    
    return await androidNotificationService.sendNotification({
      title: notification.title,
      body: notification.body,
      channelId,
      priority: this.mapPriorityToAndroid(notification.priority),
      data: {
        type: notification.type,
        ...notification.data,
      },
      imageUrl: notification.rich?.imageUrl,
      actions: notification.rich?.actions?.map(action => ({
        id: action.id,
        title: action.title,
        destructive: action.destructive,
        authenticationRequired: action.requiresAuth,
        foreground: action.opensApp,
      })),
      sticky: notification.priority === 'critical',
      autoCancel: notification.priority !== 'critical',
      badge: notification.channels.includes('badge') ? 1 : undefined,
    });
  }

  /**
   * Handle notification received (foreground)
   */
  private handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    
    // Update analytics
    this.updateAnalytics('delivered', null);
    
    // Emit event
    this.emitEvent('received', notification);
    
    // Show in-app notification if app is active
    if (AppState.currentState === 'active') {
      this.showInAppNotification(notification);
    }
  };

  /**
   * Handle notification response (tapped/clicked)
   */
  private handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('Notification response:', response);
    
    const data = response.notification.request.content.data;
    const actionIdentifier = response.actionIdentifier;
    
    // Update analytics
    if (actionIdentifier && actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      this.updateAnalytics('actionClicked', null);
    } else {
      this.updateAnalytics('opened', null);
    }
    
    // Handle deep linking
    this.handleDeepLinking(data, actionIdentifier);
    
    // Emit event
    this.emitEvent(actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER ? 'opened' : 'action_clicked', {
      notification: response.notification,
      action: actionIdentifier,
    });
  };

  /**
   * Handle deep linking from notifications
   */
  private handleDeepLinking(data: any, actionIdentifier?: string) {
    try {
      let route: DeepLinkRoute | undefined;
      let params: Record<string, any> = {};

      // Determine route based on notification data or action
      if (actionIdentifier && actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // Handle specific actions
        switch (actionIdentifier) {
          case 'VIEW_PET':
          case 'view_pet':
            route = '/pets/[id]';
            params = { id: data.petId };
            break;
          case 'OPEN_MAP':
          case 'open_map':
            route = '/lost-pets';
            params = data.location ? { lat: data.location.lat, lng: data.location.lng } : {};
            break;
          case 'MARK_DONE':
          case 'mark_done':
            // Handle in background, no navigation needed
            this.handleMarkDoneAction(data);
            return;
          case 'EMERGENCY_RESPONSE':
          case 'emergency_response':
            route = '/emergency/[petId]';
            params = { petId: data.petId };
            break;
        }
      } else {
        // Handle default notification tap
        route = data.deepLinkRoute;
        params = data.routeParams || {};
        
        if (!route) {
          // Infer route from notification type
          switch (data.type) {
            case 'lost_pet_alert':
              route = '/lost-pets';
              break;
            case 'pet_found':
            case 'vaccination_reminder':
            case 'medication_reminder':
              route = '/pets/[id]';
              params = { id: data.petId };
              break;
            case 'appointment_reminder':
              route = '/appointments';
              break;
            case 'family_invite':
              route = '/family';
              break;
            case 'emergency_alert':
              route = '/emergency/[petId]';
              params = { petId: data.petId };
              break;
            default:
              route = '/';
              break;
          }
        }
      }

      if (route) {
        this.navigateToRoute(route, params);
      }
    } catch (error) {
      console.error('Error handling deep linking:', error);
    }
  }

  /**
   * Navigate to a route using Expo Router
   */
  private navigateToRoute(route: DeepLinkRoute, params: Record<string, any> = {}) {
    try {
      // If app is not ready, queue the navigation
      if (AppState.currentState !== 'active') {
        this.deepLinkQueue.push({ route, params });
        this.saveDeepLinkQueue();
        return;
      }

      // Build the route with parameters
      let finalRoute = route;
      
      // Replace dynamic segments
      Object.entries(params).forEach(([key, value]) => {
        finalRoute = finalRoute.replace(`[${key}]`, String(value)) as DeepLinkRoute;
      });

      // Add query parameters
      const queryParams = Object.entries(params)
        .filter(([key]) => !route.includes(`[${key}]`))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      console.log('Navigating to:', finalRoute, queryParams);
      
      // Navigate using Expo Router
      if (Object.keys(queryParams).length > 0) {
        router.push({ pathname: finalRoute, params: queryParams });
      } else {
        router.push(finalRoute);
      }
    } catch (error) {
      console.error('Error navigating to route:', error);
    }
  }

  /**
   * Process queued deep links when app becomes active
   */
  private processDeepLinkQueue() {
    if (this.deepLinkQueue.length === 0) return;

    const queuedLink = this.deepLinkQueue.shift();
    if (queuedLink) {
      this.navigateToRoute(queuedLink.route, queuedLink.params);
      this.saveDeepLinkQueue();
    }
  }

  /**
   * Show in-app notification overlay
   */
  private showInAppNotification(notification: Notifications.Notification) {
    // This would integrate with your in-app notification system
    // For now, we'll just log it
    console.log('Would show in-app notification:', notification.request.content.title);
    
    // You could dispatch to a global state manager or show a toast/banner
    // Example: GlobalNotificationStore.showInApp(notification);
  }

  /**
   * Handle mark done action in background
   */
  private async handleMarkDoneAction(data: any) {
    try {
      // Mark the reminder/task as completed in the database
      if (data.reminderId) {
        await supabase
          .from('reminders')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', data.reminderId);
      }
      
      console.log('Marked reminder as done:', data.reminderId);
    } catch (error) {
      console.error('Error marking reminder as done:', error);
    }
  }

  /**
   * Check if notification is allowed based on user preferences
   */
  private isNotificationAllowed(notification: UnifiedNotification): boolean {
    if (!this.preferences?.enabled) return false;
    
    const typePrefs = this.preferences.types[notification.type];
    if (!typePrefs?.enabled) return false;
    
    // Check if any of the requested channels are enabled
    const allowedChannels = notification.channels.filter(channel => 
      typePrefs.channels.includes(channel)
    );
    
    return allowedChannels.length > 0;
  }

  /**
   * Check if notification should be blocked by quiet hours
   */
  private isInQuietHours(notification: UnifiedNotification): boolean {
    if (!this.preferences?.globalSettings.quietHoursEnabled) return false;
    
    // Emergency notifications always override quiet hours
    if (notification.priority === 'critical' && this.preferences.globalSettings.emergencyOverride) {
      return false;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + currentMinute / 60;
    
    const startTime = this.parseTimeString(this.preferences.globalSettings.quietHoursStart);
    const endTime = this.parseTimeString(this.preferences.globalSettings.quietHoursEnd);
    
    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  /**
   * Parse time string (e.g., "22:00") to decimal hours
   */
  private parseTimeString(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
  }

  // Utility methods for platform mapping
  private mapTypeToIOSCategory(type: NotificationType): string {
    switch (type) {
      case 'lost_pet_alert':
      case 'location_alert':
        return 'LOCATION_ALERT';
      case 'vaccination_reminder':
      case 'medication_reminder':
      case 'appointment_reminder':
        return 'REMINDER';
      default:
        return 'PET_ALERT';
    }
  }

  private mapTypeToAndroidChannel(type: NotificationType): NotificationChannelId {
    switch (type) {
      case 'lost_pet_alert':
      case 'location_alert':
        return 'PET_ALERTS';
      case 'emergency_alert':
        return 'EMERGENCY';
      case 'vaccination_reminder':
      case 'medication_reminder':
      case 'appointment_reminder':
        return 'HEALTH_REMINDERS';
      case 'social_interaction':
      case 'family_invite':
        return 'SOCIAL_FEATURES';
      default:
        return 'ACTIVITY_UPDATES';
    }
  }

  private mapPriorityToIOSLevel(priority: NotificationPriority): 'passive' | 'active' | 'timeSensitive' | 'critical' {
    switch (priority) {
      case 'low':
        return 'passive';
      case 'high':
        return 'timeSensitive';
      case 'critical':
        return 'critical';
      default:
        return 'active';
    }
  }

  private mapPriorityToAndroid(priority: NotificationPriority): 'min' | 'low' | 'default' | 'high' | 'max' {
    switch (priority) {
      case 'low':
        return 'low';
      case 'high':
        return 'high';
      case 'critical':
        return 'max';
      default:
        return 'default';
    }
  }

  private calculateRelevanceScore(notification: UnifiedNotification): number {
    // Calculate iOS relevance score based on notification importance
    switch (notification.priority) {
      case 'critical':
        return 1.0;
      case 'high':
        return 0.8;
      case 'default':
        return 0.5;
      case 'low':
        return 0.2;
      default:
        return 0.5;
    }
  }

  /**
   * Configure platform-specific notification handlers
   */
  private async configurePlatformHandlers() {
    // Set up unified notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const content = notification.request.content;
        const priority = content.data?.priority as NotificationPriority || 'default';
        
        return {
          shouldShowAlert: true,
          shouldPlaySound: content.data?.channels?.includes('sound') !== false,
          shouldSetBadge: content.data?.channels?.includes('badge') !== false,
          priority: this.mapPriorityToExpoAndroid(priority),
        };
      },
    });

    // Add notification listeners
    Notifications.addNotificationReceivedListener(this.handleNotificationReceived);
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);
  }

  private mapPriorityToExpoAndroid(priority: NotificationPriority): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'low':
        return Notifications.AndroidNotificationPriority.LOW;
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      case 'critical':
        return Notifications.AndroidNotificationPriority.MAX;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  /**
   * Setup background processing for notification sync
   */
  private async setupBackgroundProcessing() {
    try {
      // Register background task
      TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
        try {
          await this.syncPendingNotifications();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Background notification sync failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register background fetch
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('Background notification processing configured');
    } catch (error) {
      console.error('Failed to setup background processing:', error);
    }
  }

  /**
   * Sync pending notifications from server
   */
  private async syncPendingNotifications() {
    try {
      if (!this.pushToken) return;

      // Fetch pending notifications from server
      const { data: pendingNotifications, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('push_token', this.pushToken)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) throw error;

      // Process pending notifications
      for (const notification of pendingNotifications || []) {
        try {
          const result = await this.sendNotification(notification.payload);
          
          // Update notification status
          await supabase
            .from('notification_queue')
            .update({
              status: result.success ? 'sent' : 'failed',
              sent_at: result.success ? new Date().toISOString() : null,
              error_message: result.error || null,
            })
            .eq('id', notification.id);
        } catch (error) {
          console.error('Failed to process pending notification:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing pending notifications:', error);
    }
  }

  /**
   * Setup deep linking handlers
   */
  private setupDeepLinking() {
    // Handle initial URL when app is launched
    Linking.getInitialURL().then(url => {
      if (url) {
        this.handleDeepLinkURL(url);
      }
    });

    // Handle URLs when app is already running
    Linking.addEventListener('url', ({ url }) => {
      this.handleDeepLinkURL(url);
    });
  }

  /**
   * Handle deep link URLs
   */
  private handleDeepLinkURL(url: string) {
    try {
      const parsedUrl = new URL(url);
      const route = parsedUrl.pathname as DeepLinkRoute;
      const params: Record<string, any> = {};
      
      parsedUrl.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      this.navigateToRoute(route, params);
    } catch (error) {
      console.error('Error handling deep link URL:', error);
    }
  }

  /**
   * Setup app state monitoring
   */
  private setupAppStateMonitoring() {
    this.appStateListener = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Process any queued deep links
        this.processDeepLinkQueue();
      }
    });
  }

  /**
   * Initialize event listeners map
   */
  private initializeEventListeners() {
    const events: NotificationEvent[] = ['received', 'opened', 'dismissed', 'action_clicked', 'permission_changed'];
    events.forEach(event => {
      this.eventListeners.set(event, new Set());
    });
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: NotificationEvent, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event, data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event: NotificationEvent, listener: NotificationEventListener): () => void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
    return () => {};
  }

  /**
   * Update user push token in database
   */
  private async updateUserPushToken(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_devices')
        .upsert({
          user_id: user.id,
          push_token: token,
          device_type: Platform.OS,
          device_info: {
            platform: Platform.OS,
            version: Platform.Version,
            isDevice: Device.isDevice,
            brand: Device.brand,
            modelName: Device.modelName,
          },
          last_used: new Date().toISOString(),
        }, { onConflict: 'push_token' });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating push token in database:', error);
    }
  }

  /**
   * Update notification analytics
   */
  private async updateAnalytics(action: 'sent' | 'delivered' | 'opened' | 'dismissed' | 'actionClicked' | 'errors', notification?: UnifiedNotification | null) {
    try {
      if (!this.analytics) {
        this.analytics = {
          sent: 0,
          delivered: 0,
          opened: 0,
          dismissed: 0,
          actionClicked: 0,
          errors: 0,
          lastUpdated: new Date(),
          platformBreakdown: {
            ios: { sent: 0, delivered: 0, opened: 0 },
            android: { sent: 0, delivered: 0, opened: 0 },
          },
        };
      }

      // Update overall stats
      this.analytics[action]++;
      
      // Update platform-specific stats
      const platform = Platform.OS as 'ios' | 'android';
      if (action === 'sent' || action === 'delivered' || action === 'opened') {
        this.analytics.platformBreakdown[platform][action]++;
      }

      this.analytics.lastUpdated = new Date();

      // Store analytics
      await AsyncStorage.setItem(
        STORAGE_KEYS.DELIVERY_ANALYTICS,
        JSON.stringify(this.analytics)
      );

      // Send to backend for aggregation (fire and forget)
      this.sendAnalyticsToBackend(action, notification).catch(console.error);
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  /**
   * Send analytics to backend
   */
  private async sendAnalyticsToBackend(action: string, notification?: UnifiedNotification | null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notification_analytics')
        .insert({
          user_id: user.id,
          action,
          notification_type: notification?.type,
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
          campaign_id: notification?.analytics?.campaignId,
          source: notification?.analytics?.source,
          tags: notification?.analytics?.tags,
        });
    } catch (error) {
      // Silently fail analytics to not impact user experience
      console.warn('Failed to send analytics to backend:', error);
    }
  }

  /**
   * Store notification for delivery tracking
   */
  private async storeNotificationForTracking(notificationId: string, notification: UnifiedNotification) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notification_tracking')
        .insert({
          notification_id: notificationId,
          user_id: user.id,
          type: notification.type,
          platform: Platform.OS,
          sent_at: new Date().toISOString(),
          payload: notification,
        });
    } catch (error) {
      console.error('Error storing notification for tracking:', error);
    }
  }

  // Storage methods
  private async loadPermissionState() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSION_STATE);
      if (stored) {
        this.permissionState = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading permission state:', error);
    }
  }

  private async loadUserPreferences() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) {
        this.preferences = JSON.parse(stored);
      } else {
        // Set default preferences
        this.preferences = this.getDefaultPreferences();
        await this.saveUserPreferences();
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      this.preferences = this.getDefaultPreferences();
    }
  }

  private async loadAnalytics() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DELIVERY_ANALYTICS);
      if (stored) {
        this.analytics = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  private async loadDeepLinkQueue() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DEEP_LINK_QUEUE);
      if (stored) {
        this.deepLinkQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading deep link queue:', error);
    }
  }

  private async saveDeepLinkQueue() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.DEEP_LINK_QUEUE,
        JSON.stringify(this.deepLinkQueue)
      );
    } catch (error) {
      console.error('Error saving deep link queue:', error);
    }
  }

  private async saveUserPreferences() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      types: {
        lost_pet_alert: {
          enabled: true,
          channels: ['push', 'sound', 'vibration', 'badge'],
        },
        pet_found: {
          enabled: true,
          channels: ['push', 'sound', 'badge'],
        },
        vaccination_reminder: {
          enabled: true,
          channels: ['push', 'sound', 'badge'],
        },
        medication_reminder: {
          enabled: true,
          channels: ['push', 'sound', 'badge'],
        },
        appointment_reminder: {
          enabled: true,
          channels: ['push', 'sound', 'badge'],
        },
        location_alert: {
          enabled: true,
          channels: ['push', 'sound', 'vibration', 'badge'],
        },
        emergency_alert: {
          enabled: true,
          channels: ['push', 'sound', 'vibration', 'badge'],
        },
        social_interaction: {
          enabled: false,
          channels: ['push', 'badge'],
        },
        family_invite: {
          enabled: true,
          channels: ['push', 'sound', 'badge'],
        },
        system_update: {
          enabled: true,
          channels: ['push', 'badge'],
        },
      },
      globalSettings: {
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        locationBasedEnabled: true,
        emergencyOverride: true,
        groupByPet: true,
        summaryMode: false,
      },
    };
  }

  // Public API methods
  
  /**
   * Get current permission state
   */
  getPermissionState(): PermissionState | null {
    return this.permissionState;
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): NotificationPreferences | null {
    return this.preferences;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(preferences: Partial<NotificationPreferences>) {
    if (this.preferences) {
      this.preferences = { ...this.preferences, ...preferences };
      await this.saveUserPreferences();
    }
  }

  /**
   * Get analytics
   */
  getAnalytics(): NotificationAnalytics | null {
    return this.analytics;
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Test notification functionality
   */
  async testNotification() {
    const testNotification: UnifiedNotification = {
      id: 'test-' + Date.now(),
      type: 'lost_pet_alert',
      title: 'Test Notification',
      body: 'This is a test notification from TailTracker',
      priority: 'high',
      channels: ['push', 'sound', 'badge'],
      data: {
        petId: 'test-pet',
        deepLinkRoute: '/pets/[id]',
        routeParams: { id: 'test-pet' },
      },
      rich: {
        actions: [
          { id: 'view_pet', title: 'View Pet', opensApp: true },
          { id: 'dismiss', title: 'Dismiss', opensApp: false },
        ],
      },
    };

    return await this.sendNotification(testNotification);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.appStateListener) {
      this.appStateListener.remove();
    }
    
    this.eventListeners.clear();
    
    // Unregister background task
    TaskManager.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(console.error);
  }
}

// Export singleton instance and helper functions
export const unifiedNotificationService = UnifiedNotificationService.getInstance();

// TailTracker-specific notification builders
export const TailTrackerNotifications = {
  /**
   * Create lost pet alert notification
   */
  createLostPetAlert(petData: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    imageUrl?: string;
    location?: { lat: number; lng: number; address?: string };
    distance?: number;
    reward?: number;
    ownerName?: string;
    contactPhone?: string;
  }): UnifiedNotification {
    const distanceText = petData.distance 
      ? petData.distance < 1 
        ? `${Math.round(petData.distance * 1000)}m away`
        : `${petData.distance.toFixed(1)}km away`
      : 'in your area';

    const rewardText = petData.reward ? ` • $${petData.reward} reward` : '';

    return {
      id: `lost_pet_${petData.id}_${Date.now()}`,
      type: 'lost_pet_alert',
      title: `Lost Pet Alert: ${petData.name}`,
      body: `${petData.species} missing ${distanceText}${rewardText}. Help bring ${petData.name} home!`,
      priority: 'high',
      channels: ['push', 'sound', 'vibration', 'badge'],
      data: {
        petId: petData.id,
        deepLinkRoute: '/lost-pets/[id]',
        routeParams: { id: petData.id },
        customData: {
          location: petData.location,
          contactPhone: petData.contactPhone,
          ownerName: petData.ownerName,
        },
      },
      rich: {
        imageUrl: petData.imageUrl,
        actions: [
          { id: 'open_map', title: 'View Map', opensApp: true },
          { id: 'call_owner', title: 'Call Owner', opensApp: false },
          { id: 'share', title: 'Share', opensApp: false },
        ],
        category: 'lost_pet',
      },
      analytics: {
        source: 'lost_pet_system',
        tags: ['emergency', 'location_based'],
      },
    };
  },

  /**
   * Create pet found notification
   */
  createPetFoundNotification(petData: {
    id: string;
    name: string;
    species: string;
    imageUrl?: string;
  }): UnifiedNotification {
    return {
      id: `pet_found_${petData.id}_${Date.now()}`,
      type: 'pet_found',
      title: `Great News! ${petData.name} is Safe`,
      body: `${petData.species} ${petData.name} has been found and is safely home! 🎉`,
      priority: 'high',
      channels: ['push', 'sound', 'badge'],
      data: {
        petId: petData.id,
        deepLinkRoute: '/pets/[id]',
        routeParams: { id: petData.id },
      },
      rich: {
        imageUrl: petData.imageUrl,
        actions: [
          { id: 'view_pet', title: 'View Pet', opensApp: true },
          { id: 'celebrate', title: 'Celebrate', opensApp: false },
        ],
      },
      analytics: {
        source: 'found_pet_system',
        tags: ['celebration', 'resolved'],
      },
    };
  },

  /**
   * Create vaccination reminder
   */
  createVaccinationReminder(petData: {
    id: string;
    name: string;
    vaccineName: string;
    dueDate: Date;
    vetName?: string;
    imageUrl?: string;
  }): UnifiedNotification {
    const daysUntil = Math.ceil((petData.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const dueDateText = daysUntil === 0 ? 'today' : 
                       daysUntil === 1 ? 'tomorrow' : 
                       `in ${daysUntil} days`;

    return {
      id: `vaccination_${petData.id}_${Date.now()}`,
      type: 'vaccination_reminder',
      title: `💉 Vaccination Due: ${petData.name}`,
      body: `${petData.vaccineName} vaccination is due ${dueDateText}${petData.vetName ? ` at ${petData.vetName}` : ''}`,
      priority: 'default',
      channels: ['push', 'sound', 'badge'],
      data: {
        petId: petData.id,
        deepLinkRoute: '/health/vaccinations',
        routeParams: { petId: petData.id },
      },
      rich: {
        imageUrl: petData.imageUrl,
        actions: [
          { id: 'schedule_appointment', title: 'Schedule', opensApp: true },
          { id: 'mark_done', title: 'Mark Done', opensApp: false },
          { id: 'remind_later', title: 'Remind Later', opensApp: false },
        ],
      },
      analytics: {
        source: 'health_system',
        tags: ['health', 'vaccination', 'reminder'],
      },
    };
  },

  /**
   * Create emergency alert
   */
  createEmergencyAlert(petData: {
    id: string;
    name: string;
    emergencyType: string;
    location?: { lat: number; lng: number };
    message?: string;
  }): UnifiedNotification {
    return {
      id: `emergency_${petData.id}_${Date.now()}`,
      type: 'emergency_alert',
      title: `🚨 EMERGENCY: ${petData.name}`,
      body: petData.message || `${petData.emergencyType} emergency reported for ${petData.name}`,
      priority: 'critical',
      channels: ['push', 'sound', 'vibration', 'badge'],
      data: {
        petId: petData.id,
        deepLinkRoute: '/emergency/[petId]',
        routeParams: { petId: petData.id },
        customData: {
          location: petData.location,
          emergencyType: petData.emergencyType,
        },
      },
      rich: {
        actions: [
          { id: 'emergency_response', title: 'Respond Now', opensApp: true },
          { id: 'call_emergency', title: 'Call Emergency', opensApp: false },
        ],
      },
      analytics: {
        source: 'emergency_system',
        tags: ['emergency', 'critical'],
        campaignId: 'emergency_alerts',
      },
    };
  },
};