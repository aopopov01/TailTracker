import 'react-native-gesture-handler/jestSetup';
import React from 'react';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return Object.setPrototypeOf(
    {
      Platform: {
        ...RN.Platform,
        OS: 'android',
        select: jest.fn((obj) => obj.android),
      },
      Dimensions: {
        ...RN.Dimensions,
        get: jest.fn(() => ({ width: 375, height: 667 })),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      StatusBar: {
        setBarStyle: jest.fn(),
        setBackgroundColor: jest.fn(),
        setTranslucent: jest.fn(),
      },
      Alert: {
        alert: jest.fn(),
        prompt: jest.fn(),
      },
      Linking: {
        openURL: jest.fn(() => Promise.resolve()),
        canOpenURL: jest.fn(() => Promise.resolve(true)),
        openSettings: jest.fn(() => Promise.resolve()),
        getInitialURL: jest.fn(() => Promise.resolve(null)),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      PermissionsAndroid: {
        request: jest.fn(() => Promise.resolve('granted')),
        check: jest.fn(() => Promise.resolve(true)),
        requestMultiple: jest.fn(() => Promise.resolve({})),
        PERMISSIONS: {
          CAMERA: 'android.permission.CAMERA',
          ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
          ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
          READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
          WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
        },
        RESULTS: {
          GRANTED: 'granted',
          DENIED: 'denied',
          NEVER_ASK_AGAIN: 'never_ask_again',
        },
      },
    },
    RN,
  );
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      isFocused: jest.fn(() => true),
      addListener: jest.fn(() => jest.fn()),
    }),
    useRoute: () => ({
      params: {},
      key: 'test',
      name: 'test',
      path: undefined,
    }),
    useFocusEffect: jest.fn(),
    useIsFocused: jest.fn(() => true),
  };
});

// Mock React Native Paper
jest.mock('react-native-paper', () => {
  const RNPaper = jest.requireActual('react-native-paper');
  return {
    ...RNPaper,
    Portal: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock React Native Vector Icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    appOwnership: 'standalone',
    expoVersion: '49.0.0',
    statusBarHeight: 24,
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Google',
  manufacturer: 'Google',
  modelName: 'Pixel 4',
  osName: 'Android',
  osVersion: '13',
  platformApiLevel: 33,
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  requestBackgroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 0,
        accuracy: 5,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    })
  ),
  watchPositionAsync: jest.fn(() =>
    Promise.resolve({
      remove: jest.fn(),
    })
  ),
  LocationAccuracy: {
    Highest: 6,
    High: 4,
    Balanced: 3,
    Low: 2,
    Lowest: 1,
  },
}));

jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: 'granted' })
    ),
    getCameraPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: 'granted' })
    ),
  },
  CameraType: {
    back: 'back',
    front: 'front',
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      cancelled: false,
      assets: [
        {
          uri: 'file://test-image.jpg',
          width: 100,
          height: 100,
          type: 'image',
        },
      ],
    })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      cancelled: false,
      assets: [
        {
          uri: 'file://test-photo.jpg',
          width: 100,
          height: 100,
          type: 'image',
        },
      ],
    })
  ),
  MediaTypeOptions: {
    All: 'All',
    Videos: 'Videos',
    Images: 'Images',
  },
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({
      status: 'granted',
      canAskAgain: true,
      granted: true,
    })
  ),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({
      status: 'granted',
      canAskAgain: true,
      granted: true,
    })
  ),
  scheduleNotificationAsync: jest.fn(() =>
    Promise.resolve('notification-id')
  ),
  cancelNotificationAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
}));

// Mock React Native Maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MockMapView = (props: any) => {
    return React.createElement(View, { ...props, testID: "map-view" });
  };
  const MockMarker = (props: any) => {
    return React.createElement(View, { ...props, testID: "map-marker" });
  };
  return {
    default: MockMapView,
    Marker: MockMarker,
    Circle: View,
    Polygon: View,
    Polyline: View,
    Callout: View,
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
    })),
  })),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {},
    })
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock React Query
jest.mock('react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    error: null,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
    error: null,
  })),
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock React Hook Form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    control: {},
    handleSubmit: jest.fn((fn) => fn),
    formState: { errors: {}, isValid: true },
    setValue: jest.fn(),
    getValue: jest.fn(),
    watch: jest.fn(),
    reset: jest.fn(),
    clearErrors: jest.fn(),
    setError: jest.fn(),
  })),
  Controller: ({ render }: any) => render({ field: { onChange: jest.fn(), value: '' } }),
}));

// Mock Zustand
jest.mock('zustand', () => ({
  create: jest.fn(() => jest.fn()),
}));

// Global test utilities
global.TestUtils = {
  mockNavigationProp: {
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    addListener: jest.fn(() => jest.fn()),
  },
  
  mockRouteProp: {
    params: {},
    key: 'test',
    name: 'test',
    path: undefined,
  },
  
  createMockStore: (initialState = {}) => ({
    getState: () => initialState,
    setState: jest.fn(),
    subscribe: jest.fn(),
    destroy: jest.fn(),
  }),
  
  createMockQuery: (data = null, loading = false, error = null) => ({
    data,
    isLoading: loading,
    isError: !!error,
    error,
    refetch: jest.fn(),
  }),
  
  createMockMutation: (loading = false, error = null) => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: loading,
    isError: !!error,
    error,
  }),
};

// Global test data
global.TestData = {
  mockUser: {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  },
  
  mockPet: {
    id: 'pet-1',
    name: 'Buddy',
    type: 'dog',
    breed: 'Golden Retriever',
    age: 3,
    weight: 30,
    ownerId: 'user-1',
  },
  
  mockLocation: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 5,
    timestamp: Date.now(),
  },
};

// Silence console warnings in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args: any[]) => {
  const message = args[0];
  // Suppress known warnings
  if (
    message?.includes('componentWillReceiveProps') ||
    message?.includes('componentWillMount') ||
    message?.includes('ReactNativeFiberHostComponent')
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

console.error = (...args: any[]) => {
  const message = args[0];
  // Suppress known errors
  if (
    message?.includes('Warning: React.createElement') ||
    message?.includes('Warning: Failed prop type')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Set test timeout
jest.setTimeout(10000);