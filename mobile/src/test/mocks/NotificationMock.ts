import { jest } from '@jest/globals';

// Comprehensive Expo Notifications Mock
class MockNotificationService {
  private pushToken = 'ExponentPushToken[mock-token]';
  private permissions = { status: 'granted', canAskAgain: true, granted: true };
  private scheduledNotifications: any[] = [];
  private presentedNotifications: any[] = [];
  private notificationListeners: Array<{ listener: Function; remove: Function }> = [];

  // Permission methods
  requestPermissionsAsync = jest.fn(async (permissions?: any) => {
    // Simulate permission request delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.permissions;
  });

  getPermissionsAsync = jest.fn(async () => {
    return this.permissions;
  });

  // Token methods
  getExpoPushTokenAsync = jest.fn(async (options?: any) => {
    // Simulate token generation delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return { data: this.pushToken, type: 'expo' };
  });

  getDevicePushTokenAsync = jest.fn(async () => {
    return { data: 'device-token-mock', type: 'ios' };
  });

  // Notification scheduling
  scheduleNotificationAsync = jest.fn(async (content: any, trigger?: any) => {
    const notification = {
      identifier: `notification-${Date.now()}`,
      content,
      trigger,
      date: trigger?.date || new Date(),
    };
    
    this.scheduledNotifications.push(notification);
    
    // Simulate immediate notification if no trigger
    if (!trigger || trigger.seconds === 0) {
      this.simulateNotificationReceived(notification);
    }
    
    return notification.identifier;
  });

  presentNotificationAsync = jest.fn(async (content: any) => {
    const notification = {
      identifier: `immediate-${Date.now()}`,
      content,
      date: new Date(),
    };
    
    this.presentedNotifications.push(notification);
    this.simulateNotificationReceived(notification);
    
    return notification.identifier;
  });

  // Notification management
  cancelNotificationAsync = jest.fn(async (identifier: string) => {
    this.scheduledNotifications = this.scheduledNotifications.filter(
      n => n.identifier !== identifier
    );
  });

  cancelAllScheduledNotificationsAsync = jest.fn(async () => {
    this.scheduledNotifications = [];
  });

  dismissNotificationAsync = jest.fn(async (identifier: string) => {
    this.presentedNotifications = this.presentedNotifications.filter(
      n => n.identifier !== identifier
    );
  });

  dismissAllNotificationsAsync = jest.fn(async () => {
    this.presentedNotifications = [];
  });

  // Notification queries
  getAllScheduledNotificationsAsync = jest.fn(async () => {
    return [...this.scheduledNotifications];
  });

  getAllPresentedNotificationsAsync = jest.fn(async () => {
    return this.presentedNotifications.map(n => ({
      request: {
        identifier: n.identifier,
        content: n.content,
      },
      date: n.date.getTime(),
    }));
  });

  // Notification settings
  setNotificationHandler = jest.fn((handler: any) => {
    // Store the handler for testing
    this.notificationHandler = handler;
  });

  private notificationHandler: any = null;

  // Event listeners
  addNotificationReceivedListener = jest.fn((listener: Function) => {
    const removeFunction = jest.fn(() => {
      const index = this.notificationListeners.findIndex(l => l.listener === listener);
      if (index !== -1) {
        this.notificationListeners.splice(index, 1);
      }
    });

    this.notificationListeners.push({ listener, remove: removeFunction });
    
    return { remove: removeFunction };
  });

  addNotificationResponseReceivedListener = jest.fn((listener: Function) => {
    const removeFunction = jest.fn(() => {
      const index = this.notificationResponseListeners.findIndex(l => l.listener === listener);
      if (index !== -1) {
        this.notificationResponseListeners.splice(index, 1);
      }
    });

    this.notificationResponseListeners.push({ listener, remove: removeFunction });
    
    return { remove: removeFunction };
  });

  private notificationResponseListeners: Array<{ listener: Function; remove: Function }> = [];

  removeNotificationSubscription = jest.fn((subscription: any) => {
    if (subscription && subscription.remove) {
      subscription.remove();
    }
  });

  // Notification channels (Android)
  setNotificationChannelAsync = jest.fn(async (channelId: string, channel: any) => {
    return Promise.resolve();
  });

  getNotificationChannelAsync = jest.fn(async (channelId: string) => {
    return {
      id: channelId,
      name: 'Test Channel',
      importance: 3,
      sound: true,
      vibrate: true,
    };
  });

  deleteNotificationChannelAsync = jest.fn(async (channelId: string) => {
    return Promise.resolve();
  });

  // Badge management
  setBadgeCountAsync = jest.fn(async (badgeCount: number) => {
    this.badgeCount = badgeCount;
  });

  getBadgeCountAsync = jest.fn(async () => {
    return this.badgeCount;
  });

  private badgeCount = 0;

  // Testing utilities
  simulateNotificationReceived(notification: any) {
    const fullNotification = {
      date: Date.now(),
      request: {
        identifier: notification.identifier || `mock-${Date.now()}`,
        content: {
          title: notification.content?.title || 'Test Notification',
          body: notification.content?.body || 'Test notification body',
          data: notification.content?.data || {},
          sound: notification.content?.sound || 'default',
          ...notification.content,
        },
      },
    };

    // Notify all listeners
    this.notificationListeners.forEach(({ listener }) => {
      try {
        listener(fullNotification);
      } catch (error) {
        console.warn('Notification listener error:', error);
      }
    });

    return fullNotification;
  }

  simulateNotificationTapped(notification: any) {
    const response = {
      actionIdentifier: 'com.apple.UNNotificationDefaultActionIdentifier',
      notification: notification || {
        date: Date.now(),
        request: {
          identifier: `tapped-${Date.now()}`,
          content: {
            title: 'Tapped Notification',
            body: 'User tapped notification',
            data: { type: 'test' },
          },
        },
      },
    };

    this.notificationResponseListeners.forEach(({ listener }) => {
      try {
        listener(response);
      } catch (error) {
        console.warn('Notification response listener error:', error);
      }
    });

    return response;
  }

  simulateLostPetAlert(petData: any) {
    const notification = this.simulateNotificationReceived({
      content: {
        title: `Lost Pet Alert: ${petData.name}`,
        body: `A ${petData.species} named ${petData.name} is missing in your area. Can you help?`,
        data: {
          type: 'lost_pet_alert',
          pet_id: petData.id,
          lost_pet_id: `lost-pet-${Date.now()}`,
          pet_name: petData.name,
          species: petData.species,
          breed: petData.breed,
          location: petData.location,
          reward_amount: petData.reward_amount,
          contact_phone: petData.contact_phone,
          photo_url: petData.photo_url,
        },
        sound: 'default',
        priority: 'high',
      },
    });

    return notification;
  }

  simulateReminderNotification(reminderData: any) {
    return this.simulateNotificationReceived({
      content: {
        title: `Reminder: ${reminderData.title}`,
        body: reminderData.message,
        data: {
          type: 'care_reminder',
          reminder_id: reminderData.id,
          pet_id: reminderData.pet_id,
          reminder_type: reminderData.type,
        },
        sound: 'default',
      },
    });
  }

  // Permission simulation
  simulatePermissionDenied() {
    this.permissions = { status: 'denied', canAskAgain: false, granted: false };
    this.requestPermissionsAsync.mockResolvedValue(this.permissions);
    this.getPermissionsAsync.mockResolvedValue(this.permissions);
  }

  simulatePermissionGranted() {
    this.permissions = { status: 'granted', canAskAgain: true, granted: true };
    this.requestPermissionsAsync.mockResolvedValue(this.permissions);
    this.getPermissionsAsync.mockResolvedValue(this.permissions);
  }

  // Token simulation
  simulateTokenError() {
    this.getExpoPushTokenAsync.mockRejectedValue(new Error('Failed to get push token'));
  }

  simulateTokenSuccess(customToken?: string) {
    const token = customToken || this.pushToken;
    this.getExpoPushTokenAsync.mockResolvedValue({ data: token, type: 'expo' });
  }

  // Network simulation
  simulateNetworkError() {
    const networkError = new Error('Network request failed');
    this.scheduleNotificationAsync.mockRejectedValue(networkError);
    this.presentNotificationAsync.mockRejectedValue(networkError);
    this.getExpoPushTokenAsync.mockRejectedValue(networkError);
  }

  // Reset all mocks
  reset() {
    this.scheduledNotifications = [];
    this.presentedNotifications = [];
    this.notificationListeners = [];
    this.notificationResponseListeners = [];
    this.badgeCount = 0;
    this.permissions = { status: 'granted', canAskAgain: true, granted: true };
    this.pushToken = 'ExponentPushToken[mock-token]';
    
    // Reset all jest mocks
    Object.values(this).forEach(prop => {
      if (jest.isMockFunction(prop)) {
        prop.mockClear();
      }
    });

    // Re-setup default implementations
    this.setupDefaultMocks();
  }

  private setupDefaultMocks() {
    this.requestPermissionsAsync.mockImplementation(async () => this.permissions);
    this.getPermissionsAsync.mockImplementation(async () => this.permissions);
    this.getExpoPushTokenAsync.mockImplementation(async () => ({ data: this.pushToken, type: 'expo' }));
    this.scheduleNotificationAsync.mockImplementation(async (content, trigger) => {
      const id = `notification-${Date.now()}`;
      if (!trigger || trigger.seconds === 0) {
        setTimeout(() => this.simulateNotificationReceived({ content }), 100);
      }
      return id;
    });
  }

  // Get current state for testing
  getTestState() {
    return {
      pushToken: this.pushToken,
      permissions: this.permissions,
      scheduledNotifications: [...this.scheduledNotifications],
      presentedNotifications: [...this.presentedNotifications],
      listenerCount: this.notificationListeners.length,
      responseListenerCount: this.notificationResponseListeners.length,
      badgeCount: this.badgeCount,
    };
  }
}

// Export mock instance
export const mockNotificationService = new MockNotificationService();

// Mock expo-notifications module exports
export const mockExpoNotifications = {
  ...mockNotificationService,
  
  // Enum values
  AndroidImportance: {
    MIN: 1,
    LOW: 2,
    DEFAULT: 3,
    HIGH: 4,
    MAX: 5,
  },
  
  AndroidNotificationVisibility: {
    UNKNOWN: 0,
    PUBLIC: 1,
    PRIVATE: 2,
    SECRET: 3,
  },
  
  IosAuthorizationStatus: {
    NOT_DETERMINED: 0,
    DENIED: 1,
    AUTHORIZED: 2,
    PROVISIONAL: 3,
  },
  
  // Default notification handler
  setNotificationHandler: mockNotificationService.setNotificationHandler,
};

// Helper for creating mock notifications in tests
export const createMockNotification = (overrides: any = {}) => ({
  date: Date.now(),
  request: {
    identifier: `mock-${Date.now()}`,
    content: {
      title: 'Test Notification',
      body: 'Test notification body',
      data: {},
      sound: 'default',
      ...overrides.content,
    },
    trigger: null,
    ...overrides.request,
  },
  ...overrides,
});

// Helper for creating lost pet alerts in tests
export const createMockLostPetAlert = (petData: any) => {
  return createMockNotification({
    request: {
      content: {
        title: `Lost Pet Alert: ${petData.name}`,
        body: `A ${petData.species} named ${petData.name} is missing in your area.`,
        data: {
          type: 'lost_pet_alert',
          pet_id: petData.id,
          pet_name: petData.name,
          species: petData.species,
          location: petData.location,
          ...petData,
        },
        sound: 'default',
        priority: 'high',
      },
    },
  });
};

export default mockNotificationService;