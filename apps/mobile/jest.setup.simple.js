// Minimal Jest setup for testing
global.console = {
  ...console,
  // uncomment to ignore a specific log level
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // error: jest.fn(),
};

// Mock browser APIs that Expo expects to be available
Object.defineProperty(global, 'TransformStream', {
  value: class MockTransformStream {
    constructor() {}
  },
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'TextDecoderStream', {
  value: class MockTextDecoderStream {
    constructor() {}
  },
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'TextEncoderStream', {
  value: class MockTextEncoderStream {
    constructor() {}
  },
  writable: true,
  configurable: true,
});

// Basic React Native mocks

// Mock expo-modules-core EventEmitter
jest.mock('expo-modules-core', () => ({
  EventEmitter: class MockEventEmitter {
    addListener() {
      return { remove: jest.fn() };
    }
    removeAllListeners() {}
    emit() {}
  },
  NativeModulesProxy: {},
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
  requireNativeModule: jest.fn(() => ({
    getItemAsync: jest.fn(() => Promise.resolve(null)),
    setItemAsync: jest.fn(() => Promise.resolve()),
    deleteItemAsync: jest.fn(() => Promise.resolve()),
  })),
  createPermissionHook: jest.fn(() => () => [
    { granted: true, status: 'granted' },
    jest.fn(() => Promise.resolve({ granted: true, status: 'granted' }))
  ]),
}));

// Mock Expo SQLite
jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn(),
    readTransaction: jest.fn(),
    executeSql: jest.fn(),
  })),
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    getAllSync: jest.fn(() => []),
    getFirstSync: jest.fn(() => null),
    runSync: jest.fn(() => ({ lastInsertRowId: 1, changes: 1 })),
    prepareSync: jest.fn(() => ({
      executeSync: jest.fn(),
      getAllSync: jest.fn(() => []),
      getSync: jest.fn(() => null),
      runSync: jest.fn(() => ({ lastInsertRowId: 1, changes: 1 })),
      finalizeSync: jest.fn(),
    })),
    closeSync: jest.fn(),
  })),
}));

// Mock Expo modules
jest.mock('expo-device', () => ({
  isDevice: true,
  deviceType: 1,
  modelName: 'iPhone 14 Pro',
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelNotificationAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'test-push-token' })),
  getPresentedNotificationsAsync: jest.fn(() => Promise.resolve([])),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
  dismissNotificationAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: 37.7749, longitude: -122.4194 }
  })),
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    cancelled: false,
    assets: [{ uri: 'test-image-uri.jpg', width: 100, height: 100 }]
  })),
  launchCameraAsync: jest.fn(() => Promise.resolve({
    cancelled: false,
    assets: [{ uri: 'test-camera-uri.jpg', width: 100, height: 100 }]
  })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key'
      }
    }
  }
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  }
}));

// Mock specific React Native components and APIs
jest.mock('react-native', () => {
  const MockComponent = (props: any) => {
    const React = require('react');
    return React.createElement('View', props);
  };

  return {
    Platform: { OS: 'android', select: jest.fn(obj => obj.android || obj.default) },
    Alert: { alert: jest.fn() },
    Dimensions: { get: jest.fn(() => ({ width: 375, height: 667 })) },
    AppState: { currentState: 'active', addEventListener: jest.fn() },
    StyleSheet: { create: jest.fn(styles => styles) },
    Text: MockComponent,
    View: MockComponent,
    TouchableOpacity: MockComponent,
    Pressable: MockComponent,
    ScrollView: MockComponent,
    FlatList: MockComponent,
    Image: MockComponent,
    TextInput: MockComponent,
    SafeAreaView: MockComponent,
    NativeModules: {},
    TurboModuleRegistry: {
      getEnforcing: jest.fn(() => ({})),
      get: jest.fn(() => null)
    },
    // Add missing React Native APIs
    Animated: {
      View: MockComponent,
      Text: MockComponent,
      Image: MockComponent,
      createAnimatedComponent: (component: any) => component,
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        interpolate: jest.fn(() => ({ addListener: jest.fn() })),
      })),
      timing: jest.fn(() => ({ start: jest.fn() })),
      spring: jest.fn(() => ({ start: jest.fn() })),
      decay: jest.fn(() => ({ start: jest.fn() })),
      sequence: jest.fn(() => ({ start: jest.fn() })),
      parallel: jest.fn(() => ({ start: jest.fn() })),
    },
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
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: [], error: null })) })),
      insert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: {}, error: null })) }))
    }))
  }))
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: any }) => children,
  SafeAreaView: ({ children }: { children: any }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  withSafeAreaInsets: (component: any) => component,
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {
      primary: '#000',
      onPrimaryContainer: '#000',
      primaryContainer: '#fff',
      surface: '#fff',
      onSurface: '#000',
      onSurfaceVariant: '#666',
      outline: '#ccc',
      onBackground: '#000',
      error: '#f00',
      onError: '#fff',
    },
  }),
  Button: ({ children, onPress, testID }: any) =>
    require('react-native').TouchableOpacity({ onPress, testID }, children),
  ProgressBar: () => require('react-native').View({}),
  Card: ({ children }: any) => require('react-native').View({}, children),
  Text: ({ children }: any) => require('react-native').Text({}, children),
}));

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  initStripe: jest.fn(() => Promise.resolve()),
  useStripe: jest.fn(() => ({
    initPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
    presentPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
  })),
  StripeProvider: ({ children }: { children: any }) => children,
}));