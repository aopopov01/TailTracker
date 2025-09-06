import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import { useLostPetNotifications } from '../useLostPetNotifications';
import { notificationService } from '../../services/NotificationService';
import { supabase } from '../../services/supabase';
import usePremiumAccess from '../usePremiumAccess';

// Mock dependencies
jest.mock('../usePremiumAccess');
jest.mock('../../services/NotificationService');
jest.mock('../../services/supabase');

const mockUsePremiumAccess = jest.mocked(usePremiumAccess);
const mockNotificationService = jest.mocked(notificationService);
const mockSupabase = jest.mocked(supabase);

describe('useLostPetNotifications', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockUsePremiumAccess.mockReturnValue({
      subscriptionStatus: 'premium',
      isLoading: false,
      hasAccess: true,
      checkFeatureAccess: jest.fn(() => true),
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockNotificationService.requestPermissions.mockResolvedValue(true);
    mockNotificationService.getPushToken.mockResolvedValue('ExponentPushToken[test]');
    mockNotificationService.updateUserPushToken.mockResolvedValue();
    mockNotificationService.disablePushNotifications.mockResolvedValue();
    mockNotificationService.clearAllNotifications.mockResolvedValue();
    mockNotificationService.testNotification.mockResolvedValue();
    mockNotificationService.getCurrentPushToken.mockReturnValue('ExponentPushToken[test]');

    // Mock NotificationHelpers
    require('../../services/NotificationService').NotificationHelpers = {
      areNotificationsEnabled: jest.fn(() => Promise.resolve(true)),
      openNotificationSettings: jest.fn(),
    };

    // Mock Notifications module functions
    jest.mocked(Notifications.addNotificationReceivedListener).mockReturnValue({
      remove: jest.fn(),
    });
    jest.mocked(Notifications.addNotificationResponseReceivedListener).mockReturnValue({
      remove: jest.fn(),
    });
    jest.mocked(Notifications.getPresentedNotificationsAsync).mockResolvedValue([]);
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useLostPetNotifications());

      expect(result.current.notificationsEnabled).toBe(false);
      expect(result.current.pushToken).toBe(null);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.pendingNotifications).toBe(0);
    });

    it('should initialize notifications on mount', async () => {
      const { result } = renderHook(() => useLostPetNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notificationsEnabled).toBe(true);
      expect(result.current.pushToken).toBe('ExponentPushToken[test]');
      expect(mockNotificationService.updateUserPushToken).toHaveBeenCalledWith('user-1');
    });

    it('should handle initialization error', async () => {
      require('../../services/NotificationService').NotificationHelpers
        .areNotificationsEnabled.mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => useLostPetNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to initialize notifications');
    });
  });

  describe('requestPermissions', () => {
    it('should request and grant permissions successfully', async () => {
      const { result } = renderHook(() => useLostPetNotifications());

      let permissionResult: boolean;
      await act(async () => {
        permissionResult = await result.current.requestPermissions();
      });

      expect(permissionResult!).toBe(true);
      expect(result.current.notificationsEnabled).toBe(true);
      expect(result.current.pushToken).toBe('ExponentPushToken[test]');
      expect(mockNotificationService.requestPermissions).toHaveBeenCalled();
    });

    it('should handle permission denial', async () => {
      mockNotificationService.requestPermissions.mockResolvedValue(false);

      const { result } = renderHook(() => useLostPetNotifications());

      let permissionResult: boolean;
      await act(async () => {
        permissionResult = await result.current.requestPermissions();
      });

      expect(permissionResult!).toBe(false);
      expect(result.current.notificationsEnabled).toBe(false);
      expect(result.current.pushToken).toBe(null);
    });

    it('should handle permission request error', async () => {
      mockNotificationService.requestPermissions.mockRejectedValue(
        new Error('Permission request failed')
      );

      const { result } = renderHook(() => useLostPetNotifications());

      let permissionResult: boolean;
      await act(async () => {
        permissionResult = await result.current.requestPermissions();
      });

      expect(permissionResult!).toBe(false);
      expect(result.current.error).toBe('Failed to request permissions');
    });
  });

  describe('enableNotifications', () => {
    it('should enable notifications successfully', async () => {
      const { result } = renderHook(() => useLostPetNotifications());

      await act(async () => {
        await result.current.enableNotifications();
      });

      expect(mockNotificationService.requestPermissions).toHaveBeenCalled();
    });

    it('should show alert when permissions are denied', async () => {
      mockNotificationService.requestPermissions.mockResolvedValue(false);
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { result } = renderHook(() => useLostPetNotifications());

      await act(async () => {
        await result.current.enableNotifications();
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive lost pet alerts.',
        expect.arrayContaining([
          { text: 'Cancel' },
          { text: 'Open Settings', onPress: expect.any(Function) },
        ])
      );
    });
  });

  describe('disableNotifications', () => {
    it('should disable notifications successfully', async () => {
      const { result } = renderHook(() => useLostPetNotifications());
      const alertSpy = jest.spyOn(Alert, 'alert');

      await act(async () => {
        await result.current.disableNotifications();
      });

      expect(mockNotificationService.disablePushNotifications).toHaveBeenCalledWith('user-1');
      expect(result.current.notificationsEnabled).toBe(false);
      expect(result.current.pushToken).toBe(null);
      expect(alertSpy).toHaveBeenCalledWith(
        'Notifications Disabled',
        'You will no longer receive lost pet alerts. You can re-enable them anytime in settings.'
      );
    });

    it('should handle disable error', async () => {
      mockNotificationService.disablePushNotifications.mockRejectedValue(
        new Error('Disable failed')
      );

      const { result } = renderHook(() => useLostPetNotifications());

      await act(async () => {
        await result.current.disableNotifications();
      });

      expect(result.current.error).toBe('Failed to disable notifications');
    });
  });

  describe('clearNotifications', () => {
    it('should clear all notifications', async () => {
      const { result } = renderHook(() => useLostPetNotifications());

      await act(async () => {
        await result.current.clearNotifications();
      });

      expect(mockNotificationService.clearAllNotifications).toHaveBeenCalled();
      expect(result.current.pendingNotifications).toBe(0);
    });
  });

  describe('testNotification', () => {
    it('should send test notification successfully', async () => {
      const { result } = renderHook(() => useLostPetNotifications());

      await act(async () => {
        await result.current.testNotification();
      });

      expect(mockNotificationService.testNotification).toHaveBeenCalled();
    });

    it('should handle test notification error', async () => {
      mockNotificationService.testNotification.mockRejectedValue(
        new Error('Test failed')
      );
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { result } = renderHook(() => useLostPetNotifications());

      await act(async () => {
        await result.current.testNotification();
      });

      expect(alertSpy).toHaveBeenCalledWith('Test Failed', 'Unable to send test notification');
    });
  });

  describe('notification handling', () => {
    it('should handle incoming lost pet notification', async () => {
      let notificationHandler: (notification: any) => void;
      
      jest.mocked(Notifications.addNotificationReceivedListener)
        .mockImplementation((handler) => {
          notificationHandler = handler;
          return { remove: jest.fn() };
        });

      const alertSpy = jest.spyOn(Alert, 'alert');
      // Mock AppState.currentState as 'active'
      Object.defineProperty(AppState, 'currentState', {
        value: 'active',
        writable: true,
      });

      renderHook(() => useLostPetNotifications());

      // Simulate receiving a notification
      const mockNotification = {
        request: {
          content: {
            title: 'Lost Pet Alert',
            body: 'Buddy is missing in your area',
            data: {
              type: 'lost_pet_alert',
              lostPetId: 'lost-pet-1',
              petName: 'Buddy',
            },
          },
        },
      };

      await act(async () => {
        notificationHandler!(mockNotification);
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Lost Pet Alert',
        'Buddy is missing in your area',
        expect.arrayContaining([
          { text: 'Dismiss', style: 'cancel' },
          { text: 'View Details', onPress: expect.any(Function) },
        ])
      );
    });

    it('should handle notification tap', async () => {
      let responseHandler: (response: any) => void;
      
      jest.mocked(Notifications.addNotificationResponseReceivedListener)
        .mockImplementation((handler) => {
          responseHandler = handler;
          return { remove: jest.fn() };
        });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderHook(() => useLostPetNotifications());

      // Simulate tapping a notification
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'lost_pet_alert',
                lostPetId: 'lost-pet-1',
                petName: 'Buddy',
              },
            },
          },
        },
      };

      await act(async () => {
        responseHandler!(mockResponse);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Navigate to lost pet details:',
        mockResponse.notification.request.content.data
      );

      consoleSpy.mockRestore();
    });

    it('should update notification count when app becomes active', async () => {
      let appStateHandler: (nextAppState: string) => void;
      
      jest.mocked(AppState.addEventListener).mockImplementation((event, handler) => {
        if (event === 'change') {
          appStateHandler = handler;
        }
        return { remove: jest.fn() };
      });

      const mockNotifications = [
        {
          request: {
            content: {
              data: { type: 'lost_pet_alert' },
            },
          },
        },
        {
          request: {
            content: {
              data: { type: 'other' },
            },
          },
        },
      ];

      jest.mocked(Notifications.getPresentedNotificationsAsync)
        .mockResolvedValue(mockNotifications as any);

      const { result } = renderHook(() => useLostPetNotifications());

      await act(async () => {
        appStateHandler!('active');
      });

      await waitFor(() => {
        expect(result.current.pendingNotifications).toBe(1);
      });
    });
  });

  describe('refreshStatus', () => {
    it('should refresh notification status', async () => {
      const { result } = renderHook(() => useLostPetNotifications());

      await act(async () => {
        await result.current.refreshStatus();
      });

      expect(require('../../services/NotificationService').NotificationHelpers.areNotificationsEnabled)
        .toHaveBeenCalled();
    });

    it('should get new token if current token is missing', async () => {
      mockNotificationService.getCurrentPushToken.mockReturnValue(null);
      
      const { result } = renderHook(() => useLostPetNotifications());

      await act(async () => {
        await result.current.refreshStatus();
      });

      expect(mockNotificationService.getPushToken).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle Supabase auth errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' },
      });

      const { result } = renderHook(() => useLostPetNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still work without authenticated user
      expect(result.current.notificationsEnabled).toBe(true);
    });
  });

  describe('premium access integration', () => {
    it('should work with premium subscription', () => {
      mockUsePremiumAccess.mockReturnValue({
        subscriptionStatus: 'premium',
        isLoading: false,
        hasAccess: true,
        checkFeatureAccess: jest.fn(() => true),
      });

      const { result } = renderHook(() => useLostPetNotifications());

      expect(result.current).toBeDefined();
    });

    it('should work with free subscription', () => {
      mockUsePremiumAccess.mockReturnValue({
        subscriptionStatus: 'free',
        isLoading: false,
        hasAccess: false,
        checkFeatureAccess: jest.fn(() => false),
      });

      const { result } = renderHook(() => useLostPetNotifications());

      expect(result.current).toBeDefined();
    });
  });
});