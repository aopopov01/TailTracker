/**
 * Test Setup Configuration
 * Global test setup and mocks
 */

import '@testing-library/jest-native/extend-expect';
import { jest } from '@jest/globals';

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 40.7128, longitude: -74.006 },
    })
  ),
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
}));

jest.mock('expo-camera', () => ({
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock NativeBase
jest.mock('native-base', () => {
  const React = require('react');
  return {
    NativeBaseProvider: ({ children }: any) => children,
    Box: ({ children, ...props }: any) =>
      React.createElement('View', props, children),
    VStack: ({ children, ...props }: any) =>
      React.createElement('View', props, children),
    HStack: ({ children, ...props }: any) =>
      React.createElement('View', props, children),
    Text: ({ children, ...props }: any) =>
      React.createElement('Text', props, children),
    Button: ({ children, onPress, ...props }: any) =>
      React.createElement('Pressable', { onPress, ...props }, children),
    Input: (props: any) => React.createElement('TextInput', props),
    Select: ({ children, ...props }: any) =>
      React.createElement('View', props, children),
    Checkbox: (props: any) => React.createElement('View', props),
    Radio: ({ children, ...props }: any) =>
      React.createElement('View', props, children),
    Image: (props: any) => React.createElement('Image', props),
    ScrollView: ({ children, ...props }: any) =>
      React.createElement('ScrollView', props, children),
  };
});

// Global test timeout
jest.setTimeout(10000);

// Console warnings/errors in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('source.uri should not be an empty string') ||
        args[0].includes('VirtualizedLists should never be nested'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
