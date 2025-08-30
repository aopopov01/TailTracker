import { useState, useEffect, useCallback } from 'react';
import { AppState, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

import { 
  notificationService, 
  NotificationHelpers,
  PushNotificationData 
} from '../services/NotificationService';
import { supabase } from '../services/supabase';
import usePremiumAccess from './usePremiumAccess';

interface UseLostPetNotificationsHook {
  notificationsEnabled: boolean;
  pushToken: string | null;
  loading: boolean;
  error: string | null;
  pendingNotifications: number;
  requestPermissions: () => Promise<boolean>;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  testNotification: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export const useLostPetNotifications = (): UseLostPetNotificationsHook => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingNotifications, setPendingNotifications] = useState(0);

  const { subscriptionStatus } = usePremiumAccess();

  // Initialize notification status
  useEffect(() => {
    initializeNotifications();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshStatus();
        updateNotificationCount();
      }
    });

    return () => subscription?.remove();
  }, []);

  // Listen for incoming notifications
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as PushNotificationData;
      
      if (data.type === 'lost_pet_alert') {
        // Update pending notifications count
        updateNotificationCount();
        
        // Handle lost pet alert
        handleLostPetAlert(notification, data);
      }
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as PushNotificationData;
      
      if (data.type === 'lost_pet_alert') {
        handleNotificationTapped(data);
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check current status
      const enabled = await NotificationHelpers.areNotificationsEnabled();
      setNotificationsEnabled(enabled);

      if (enabled) {
        const token = await notificationService.getPushToken();
        setPushToken(token);

        // Update user's push token if authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (user && token) {
          await notificationService.updateUserPushToken(user.id);
        }
      }

      await updateNotificationCount();
    } catch (err) {
      setError('Failed to initialize notifications');
      console.error('Notification initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const granted = await notificationService.requestPermissions();
      setNotificationsEnabled(granted);

      if (granted) {
        const token = await notificationService.getPushToken();
        setPushToken(token);

        // Update user's push token
        const { data: { user } } = await supabase.auth.getUser();
        if (user && token) {
          await notificationService.updateUserPushToken(user.id);
        }
      }

      return granted;
    } catch (err) {
      setError('Failed to request permissions');
      console.error('Permission request error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const enableNotifications = async () => {
    const success = await requestPermissions();
    if (!success) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive lost pet alerts.',
        [
          { text: 'Cancel' },
          { text: 'Open Settings', onPress: NotificationHelpers.openNotificationSettings },
        ]
      );
    }
  };

  const disableNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await notificationService.disablePushNotifications(user.id);
      }
      
      setNotificationsEnabled(false);
      setPushToken(null);
      
      Alert.alert(
        'Notifications Disabled',
        'You will no longer receive lost pet alerts. You can re-enable them anytime in settings.'
      );
    } catch (err) {
      setError('Failed to disable notifications');
      console.error('Disable notification error:', err);
    }
  };

  const clearNotifications = async () => {
    try {
      await notificationService.clearAllNotifications();
      setPendingNotifications(0);
    } catch (err) {
      console.error('Clear notifications error:', err);
    }
  };

  const testNotification = async () => {
    try {
      await notificationService.testNotification();
    } catch (err) {
      Alert.alert('Test Failed', 'Unable to send test notification');
      console.error('Test notification error:', err);
    }
  };

  const refreshStatus = async () => {
    try {
      const enabled = await NotificationHelpers.areNotificationsEnabled();
      setNotificationsEnabled(enabled);

      if (enabled) {
        const token = notificationService.getCurrentPushToken();
        if (!token) {
          // Try to get new token
          const newToken = await notificationService.getPushToken();
          setPushToken(newToken);
        } else {
          setPushToken(token);
        }
      } else {
        setPushToken(null);
      }
    } catch (err) {
      console.error('Refresh status error:', err);
    }
  };

  const updateNotificationCount = async () => {
    try {
      const notifications = await Notifications.getAllPresentedNotificationsAsync();
      const lostPetNotifications = notifications.filter(
        n => n.request.content.data?.type === 'lost_pet_alert'
      );
      setPendingNotifications(lostPetNotifications.length);
    } catch (err) {
      console.error('Update notification count error:', err);
    }
  };

  const handleLostPetAlert = (notification: Notifications.Notification, data: PushNotificationData) => {
    // Show in-app alert if app is active
    if (AppState.currentState === 'active') {
      Alert.alert(
        notification.request.content.title || 'Lost Pet Alert',
        notification.request.content.body || 'A pet is missing in your area',
        [
          { text: 'Dismiss', style: 'cancel' },
          { 
            text: 'View Details', 
            onPress: () => handleNotificationTapped(data)
          },
        ]
      );
    }
  };

  const handleNotificationTapped = (data: PushNotificationData) => {
    // This would integrate with React Navigation
    console.log('Navigate to lost pet details:', data);
    
    // Example navigation:
    // navigation.navigate('NearbyLostPets', { 
    //   highlightId: data.lostPetId,
    //   petName: data.petName 
    // });
  };

  return {
    notificationsEnabled,
    pushToken,
    loading,
    error,
    pendingNotifications,
    requestPermissions,
    enableNotifications,
    disableNotifications,
    clearNotifications,
    testNotification,
    refreshStatus,
  };
};

export default useLostPetNotifications;