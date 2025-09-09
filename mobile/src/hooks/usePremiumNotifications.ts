/**
 * TailTracker Premium Notification Hooks
 * 
 * React hooks for managing premium notification functionality,
 * providing premium-aware notification sending with appropriate
 * user feedback and upgrade prompts.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  premiumNotificationService,
  PremiumNotificationResult,
  NotificationPremiumUtils,
} from '../services/PremiumNotificationService';
import {
  NotificationType,
  NotificationPreferences,
  NotificationAnalytics,
  NotificationEvent,
  NotificationEventListener,
  PermissionState,
  TailTrackerNotifications,
} from '../services/UnifiedNotificationService';
import { usePremiumAccess } from './usePremiumAccess';

// Hook for managing premium notification service
export const usePremiumNotificationService = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<{
    permissionsGranted: boolean;
    hasPremium: boolean;
    canSendNotifications: boolean;
    blockedNotificationTypes: NotificationType[];
  } | null>(null);

  const { hasPremiumAccess } = usePremiumAccess();

  // Define functions first to avoid hoisting issues
  const updateNotificationStatus = useCallback(async () => {
    try {
      const status = await premiumNotificationService.getNotificationStatus();
      setNotificationStatus(status);
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  }, []);

  const initializeService = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize the premium notification service
      const success = await premiumNotificationService.initialize();
      
      if (success) {
        setIsInitialized(true);
        
        // Load current state
        setPushToken(premiumNotificationService.getPushToken());
        setPermissionState(premiumNotificationService.getPermissionState());
        setPreferences(premiumNotificationService.getUserPreferences());
        setAnalytics(premiumNotificationService.getAnalyticsData());
        
        // Load notification status
        await updateNotificationStatus();
        
        // Set up event listeners
        const removePermissionListener = premiumNotificationService.addEventListener(
          'permission_changed',
          (_: string, state: PermissionState) => {
            setPermissionState(state);
            if (state.granted) {
              setPushToken(premiumNotificationService.getPushToken());
            }
            updateNotificationStatus();
          }
        );

        return removePermissionListener;
      } else {
        setError('Failed to initialize premium notification service');
      }
    } catch (err) {
      console.error('Error initializing premium notification service:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [updateNotificationStatus]);

  const sendNotification = useCallback(async (notification: any): Promise<PremiumNotificationResult> => {
    if (!isInitialized) {
      throw new Error('Premium notification service not initialized');
    }
    return await premiumNotificationService.sendNotification(notification);
  }, [isInitialized]);

  const requestPermissions = useCallback(async (options?: {
    showPremiumInfo?: boolean;
    criticalAlerts?: boolean;
  }) => {
    if (!isInitialized) {
      throw new Error('Premium notification service not initialized');
    }
    
    const result = await premiumNotificationService.requestPermissions(options);
    
    // Update local state
    setPermissionState(premiumNotificationService.getPermissionState());
    await updateNotificationStatus();
    
    return result;
  }, [isInitialized, updateNotificationStatus]);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!isInitialized) return;
    
    try {
      await premiumNotificationService.updateUserPreferences(newPreferences);
      setPreferences(premiumNotificationService.getUserPreferences());
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }, [isInitialized]);

  const clearAllNotifications = useCallback(async () => {
    if (!isInitialized) return;
    await premiumNotificationService.clearAllNotifications();
  }, [isInitialized]);

  const testPremiumNotification = useCallback(async () => {
    if (!isInitialized) return { success: false, error: 'Service not initialized' };
    return await premiumNotificationService.testPremiumNotification();
  }, [isInitialized]);

  // Effects placed after function declarations to avoid hoisting issues
  // Initialize the premium notification service
  useEffect(() => {
    initializeService();
  }, [initializeService]);

  // Update notification status when premium access changes
  useEffect(() => {
    if (isInitialized) {
      updateNotificationStatus();
    }
  }, [hasPremiumAccess, isInitialized, updateNotificationStatus]);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    pushToken,
    permissionState,
    preferences,
    analytics,
    notificationStatus,
    hasPermission: permissionState?.granted || false,
    hasPremium: hasPremiumAccess,
    canSendNotifications: notificationStatus?.canSendNotifications || false,
    
    // Actions
    sendNotification,
    requestPermissions,
    updatePreferences,
    clearAllNotifications,
    testPremiumNotification,
    reinitialize: initializeService,
  };
};

// Hook for sending TailTracker-specific premium notifications
export const usePremiumTailTrackerNotifications = () => {
  const { isInitialized } = usePremiumNotificationService();

  const sendLostPetAlert = useCallback(async (
    petData: Parameters<typeof TailTrackerNotifications.createLostPetAlert>[0]
  ): Promise<PremiumNotificationResult> => {
    if (!isInitialized) {
      throw new Error('Premium notification service not initialized');
    }
    return await premiumNotificationService.sendLostPetAlert(petData);
  }, [isInitialized]);

  const sendPetFoundNotification = useCallback(async (
    petData: Parameters<typeof TailTrackerNotifications.createPetFoundNotification>[0]
  ): Promise<PremiumNotificationResult> => {
    if (!isInitialized) {
      throw new Error('Premium notification service not initialized');
    }
    return await premiumNotificationService.sendPetFoundNotification(petData);
  }, [isInitialized]);

  const sendVaccinationReminder = useCallback(async (
    petData: Parameters<typeof TailTrackerNotifications.createVaccinationReminder>[0]
  ): Promise<PremiumNotificationResult> => {
    if (!isInitialized) {
      throw new Error('Premium notification service not initialized');
    }
    return await premiumNotificationService.sendVaccinationReminder(petData);
  }, [isInitialized]);

  const sendEmergencyAlert = useCallback(async (
    petData: Parameters<typeof TailTrackerNotifications.createEmergencyAlert>[0]
  ): Promise<PremiumNotificationResult> => {
    if (!isInitialized) {
      throw new Error('Premium notification service not initialized');
    }
    return await premiumNotificationService.sendEmergencyAlert(petData);
  }, [isInitialized]);

  return {
    sendLostPetAlert,
    sendPetFoundNotification,
    sendVaccinationReminder,
    sendEmergencyAlert,
  };
};

// Hook for notification events with premium context
export const usePremiumNotificationEvents = (events: NotificationEvent[]) => {
  const [eventData, setEventData] = useState<Record<NotificationEvent, any>>({} as any);
  const [premiumBlockedEvents, setPremiumBlockedEvents] = useState<any[]>([]);
  const listenersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Remove existing listeners
    listenersRef.current.forEach(removeListener => removeListener());
    listenersRef.current = [];

    // Add new listeners
    events.forEach(event => {
      const removeListener = premiumNotificationService.addEventListener(
        event,
        (eventName: string, data: any) => {
          setEventData(prev => ({
            ...prev,
            [event]: { eventName, data, timestamp: new Date() },
          }));
          
          // Track premium-blocked events
          if (data.requiresPremium) {
            setPremiumBlockedEvents(prev => [...prev, {
              event: eventName,
              data,
              timestamp: new Date(),
            }]);
          }
        }
      );
      
      listenersRef.current.push(removeListener);
    });

    // Cleanup on unmount
    return () => {
      listenersRef.current.forEach(removeListener => removeListener());
      listenersRef.current = [];
    };
  }, [events]);

  const clearEventData = useCallback(() => {
    setEventData({} as any);
    setPremiumBlockedEvents([]);
  }, []);

  return {
    eventData,
    premiumBlockedEvents,
    clearEventData,
  };
};

// Hook for managing premium notification preferences
export const usePremiumNotificationPreferences = () => {
  const { preferences: globalPreferences, updatePreferences: updateGlobalPreferences, hasPremium } = usePremiumNotificationService();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (globalPreferences && !localPreferences) {
      // Filter preferences based on premium status
      const filteredPreferences = filterPreferencesForPremium(globalPreferences, hasPremium);
      setLocalPreferences(filteredPreferences);
    }
  }, [globalPreferences, localPreferences, hasPremium]);

  const filterPreferencesForPremium = (prefs: NotificationPreferences, isPremium: boolean): NotificationPreferences => {
    if (isPremium) {
      return prefs;
    }

    // Disable premium notification types for non-premium users
    return {
      ...prefs,
      lostPetAlerts: false, // Premium feature
    };
  };

  const updateLocalPreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    if (localPreferences) {
      // Prevent enabling premium features for non-premium users
      const safeUpdates = { ...updates };
      
      if (!hasPremium && safeUpdates.lostPetAlerts) {
        // Show premium prompt if trying to enable premium notification
        premiumNotificationService.showPremiumPrompt('lost_pet_alerts');
        // Reset to disabled
        safeUpdates.lostPetAlerts = false;
      }
      
      setLocalPreferences(prev => ({
        ...prev!,
        ...safeUpdates,
      }));
      setIsDirty(true);
    }
  }, [localPreferences, hasPremium]);

  const savePreferences = useCallback(async () => {
    if (!localPreferences || !isDirty || !updateGlobalPreferences) return;

    try {
      setIsSaving(true);
      await updateGlobalPreferences(localPreferences);
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [localPreferences, isDirty, updateGlobalPreferences]);

  const resetPreferences = useCallback(() => {
    if (globalPreferences) {
      const filteredPreferences = filterPreferencesForPremium(globalPreferences, hasPremium);
      setLocalPreferences(filteredPreferences);
      setIsDirty(false);
    }
  }, [globalPreferences, hasPremium]);

  return {
    preferences: localPreferences,
    isDirty,
    isSaving,
    hasPremium,
    updatePreferences: updateLocalPreferences,
    savePreferences,
    resetPreferences,
    premiumNotificationTypes: ['lost_pet_alerts'].filter(type => 
      NotificationPremiumUtils.isPremiumNotification(type as NotificationType)
    ),
  };
};

// Hook for premium notification analytics
export const usePremiumNotificationAnalytics = () => {
  const { analytics } = usePremiumNotificationService();
  const [premiumBlockedCount, setPremiumBlockedCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track premium blocked notifications
  useEffect(() => {
    // This would be updated by the service when notifications are blocked
    // For now, we'll just initialize to 0
    setPremiumBlockedCount(0);
  }, []);

  const refreshAnalytics = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log('Refreshing premium notification analytics...');
      
      // Wait a moment to simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing premium analytics:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const getDeliveryRate = useCallback(() => {
    if (!analytics || analytics.sent === 0) return 0;
    return Math.round((analytics.delivered / analytics.sent) * 100);
  }, [analytics]);

  const getOpenRate = useCallback(() => {
    if (!analytics || analytics.delivered === 0) return 0;
    return Math.round((analytics.opened / analytics.delivered) * 100);
  }, [analytics]);

  const getPremiumConversionRate = useCallback(() => {
    if (premiumBlockedCount === 0) return 0;
    // This would calculate how many premium blocks led to subscriptions
    // For now, return a placeholder
    return 0;
  }, [premiumBlockedCount]);

  return {
    analytics,
    isRefreshing,
    premiumBlockedCount,
    refreshAnalytics,
    metrics: {
      deliveryRate: getDeliveryRate(),
      openRate: getOpenRate(),
      premiumConversionRate: getPremiumConversionRate(),
    },
  };
};