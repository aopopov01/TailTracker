/**
 * TailTracker Notification React Hooks
 * 
 * This file provides React hooks for managing notifications throughout the app,
 * providing a consistent interface for components to interact with the unified
 * notification system.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { 
  unifiedNotificationService,
  UnifiedNotification,
  NotificationPreferences,
  NotificationAnalytics,
  NotificationEvent,
  NotificationEventListener,
  PermissionState,
  TailTrackerNotifications,
} from '../services/UnifiedNotificationService';
import { 
  notificationPermissionManager,
  PermissionReason,
  PermissionFlowState,
  PermissionResult,
} from '../services/NotificationPermissionManager';

// Hook for managing notification service initialization and state
export const useNotificationService = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize the notification service
  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize the unified notification service
      const success = await unifiedNotificationService.initialize();
      
      if (success) {
        setIsInitialized(true);
        
        // Load current state
        setPushToken(unifiedNotificationService.getPushToken());
        setPermissionState(unifiedNotificationService.getPermissionState());
        setPreferences(unifiedNotificationService.getUserPreferences());
        setAnalytics(unifiedNotificationService.getAnalytics());
        
        // Set up event listeners
        const removePermissionListener = unifiedNotificationService.addEventListener(
          'permission_changed',
          (_, state: PermissionState) => {
            setPermissionState(state);
            if (state.granted) {
              setPushToken(unifiedNotificationService.getPushToken());
            }
          }
        );

        return removePermissionListener;
      } else {
        setError('Failed to initialize notification service');
      }
    } catch (err) {
      console.error('Error initializing notification service:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const sendNotification = useCallback(async (notification: UnifiedNotification) => {
    if (!isInitialized) {
      throw new Error('Notification service not initialized');
    }
    return await unifiedNotificationService.sendNotification(notification);
  }, [isInitialized]);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!isInitialized) return;
    
    try {
      await unifiedNotificationService.updateUserPreferences(newPreferences);
      setPreferences(unifiedNotificationService.getUserPreferences());
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }, [isInitialized]);

  const clearAllNotifications = useCallback(async () => {
    if (!isInitialized) return;
    await unifiedNotificationService.clearAllNotifications();
  }, [isInitialized]);

  const testNotification = useCallback(async () => {
    if (!isInitialized) return;
    return await unifiedNotificationService.testNotification();
  }, [isInitialized]);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    pushToken,
    permissionState,
    preferences,
    analytics,
    hasPermission: permissionState?.granted || false,
    
    // Actions
    sendNotification,
    updatePreferences,
    clearAllNotifications,
    testNotification,
    reinitialize: initializeService,
  };
};

// Hook for managing notification permissions with graceful flows
export const useNotificationPermissions = () => {
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [flowState, setFlowState] = useState<PermissionFlowState>('initial');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInitialState();
    
    // Listen for permission changes
    const removeListener = unifiedNotificationService.addEventListener(
      'permission_changed',
      (_, state: PermissionState) => {
        setPermissionState(state);
      }
    );

    return removeListener;
  }, []);

  const loadInitialState = async () => {
    try {
      setIsLoading(true);
      
      const currentPermissionState = unifiedNotificationService.getPermissionState();
      const currentFlowState = notificationPermissionManager.getFlowState();
      
      setPermissionState(currentPermissionState);
      setFlowState(currentFlowState);
    } catch (error) {
      console.error('Error loading initial permission state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = useCallback(async (
    reason: PermissionReason,
    options?: { criticalAlerts?: boolean; skipExplanation?: boolean }
  ): Promise<PermissionResult> => {
    try {
      setIsLoading(true);
      
      const result = await notificationPermissionManager.requestPermissions(reason, options);
      
      // Update local state
      setFlowState(result.flowState);
      const updatedPermissionState = unifiedNotificationService.getPermissionState();
      setPermissionState(updatedPermissionState);
      
      return result;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkPermissions = useCallback(async (reason: PermissionReason) => {
    return await notificationPermissionManager.checkAndExplainPermissions(reason);
  }, []);

  const openSettings = useCallback(async () => {
    return await notificationPermissionManager.openNotificationSettings();
  }, []);

  const showExplanation = useCallback(async (reason: PermissionReason) => {
    return await notificationPermissionManager.showPermissionExplanation(reason);
  }, []);

  const resetFlow = useCallback(async () => {
    try {
      setIsLoading(true);
      await notificationPermissionManager.resetPermissionFlow();
      setFlowState('initial');
    } catch (error) {
      console.error('Error resetting permission flow:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    permissionState,
    flowState,
    isLoading,
    hasPermission: permissionState?.granted || false,
    canPrompt: notificationPermissionManager.canPromptForPermissions(),
    requestPermissions,
    checkPermissions,
    openSettings,
    showExplanation,
    resetFlow,
  };
};

// Hook for listening to notification events
export const useNotificationEvents = (events: NotificationEvent[]) => {
  const [eventData, setEventData] = useState<Record<NotificationEvent, any>>({} as any);
  const listenersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Remove existing listeners
    listenersRef.current.forEach(removeListener => removeListener());
    listenersRef.current = [];

    // Add new listeners
    events.forEach(event => {
      const removeListener = unifiedNotificationService.addEventListener(
        event,
        (eventName: string, data: any) => {
          setEventData(prev => ({
            ...prev,
            [event]: { eventName, data, timestamp: new Date() },
          }));
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
  }, []);

  return {
    eventData,
    clearEventData,
  };
};

// Hook for creating TailTracker-specific notifications
export const useTailTrackerNotifications = () => {
  const { sendNotification } = useNotificationService();

  const sendLostPetAlert = useCallback(async (petData: Parameters<typeof TailTrackerNotifications.createLostPetAlert>[0]) => {
    const notification = TailTrackerNotifications.createLostPetAlert(petData);
    return await sendNotification(notification);
  }, [sendNotification]);

  const sendPetFoundNotification = useCallback(async (petData: Parameters<typeof TailTrackerNotifications.createPetFoundNotification>[0]) => {
    const notification = TailTrackerNotifications.createPetFoundNotification(petData);
    return await sendNotification(notification);
  }, [sendNotification]);

  const sendVaccinationReminder = useCallback(async (petData: Parameters<typeof TailTrackerNotifications.createVaccinationReminder>[0]) => {
    const notification = TailTrackerNotifications.createVaccinationReminder(petData);
    return await sendNotification(notification);
  }, [sendNotification]);

  const sendEmergencyAlert = useCallback(async (petData: Parameters<typeof TailTrackerNotifications.createEmergencyAlert>[0]) => {
    const notification = TailTrackerNotifications.createEmergencyAlert(petData);
    return await sendNotification(notification);
  }, [sendNotification]);

  return {
    sendLostPetAlert,
    sendPetFoundNotification,
    sendVaccinationReminder,
    sendEmergencyAlert,
    // Direct access to notification builders for custom modifications
    builders: TailTrackerNotifications,
  };
};

// Hook for managing notification preferences with local state
export const useNotificationPreferences = () => {
  const { preferences: globalPreferences, updatePreferences: updateGlobalPreferences } = useNotificationService();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (globalPreferences && !localPreferences) {
      setLocalPreferences(globalPreferences);
    }
  }, [globalPreferences, localPreferences]);

  const updateLocalPreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    if (localPreferences) {
      setLocalPreferences(prev => ({
        ...prev!,
        ...updates,
      }));
      setIsDirty(true);
    }
  }, [localPreferences]);

  const savePreferences = useCallback(async () => {
    if (!localPreferences || !isDirty) return;

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
      setLocalPreferences(globalPreferences);
      setIsDirty(false);
    }
  }, [globalPreferences]);

  return {
    preferences: localPreferences,
    isDirty,
    isSaving,
    updatePreferences: updateLocalPreferences,
    savePreferences,
    resetPreferences,
  };
};

// Hook for handling app state changes and queued notifications
export const useNotificationAppState = () => {
  const [appState, setAppState] = useState(AppState.currentState);
  const previousAppState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (previousAppState.current !== nextAppState) {
      console.log('App state changed:', previousAppState.current, '->', nextAppState);
      
      if (previousAppState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App became active - process any queued notifications or deep links
        console.log('App became active, processing queued notifications');
      }
      
      setAppState(nextAppState);
      previousAppState.current = nextAppState;
    }
  };

  return {
    appState,
    isActive: appState === 'active',
    isBackground: appState === 'background',
    isInactive: appState === 'inactive',
  };
};

// Hook for notification analytics and metrics
export const useNotificationAnalytics = () => {
  const { analytics } = useNotificationService();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshAnalytics = useCallback(async () => {
    try {
      setIsRefreshing(true);
      // Analytics are automatically updated, but we might want to trigger a refresh
      // from the backend or recalculate local metrics
      console.log('Refreshing notification analytics...');
      
      // Wait a moment to simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing analytics:', error);
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

  const getActionRate = useCallback(() => {
    if (!analytics || analytics.opened === 0) return 0;
    return Math.round((analytics.actionClicked / analytics.opened) * 100);
  }, [analytics]);

  const getErrorRate = useCallback(() => {
    if (!analytics || analytics.sent === 0) return 0;
    return Math.round((analytics.errors / analytics.sent) * 100);
  }, [analytics]);

  return {
    analytics,
    isRefreshing,
    refreshAnalytics,
    metrics: {
      deliveryRate: getDeliveryRate(),
      openRate: getOpenRate(),
      actionRate: getActionRate(),
      errorRate: getErrorRate(),
    },
  };
};