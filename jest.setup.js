// Comprehensive Jest setup for TailTracker React Native Testing
// This setup addresses React Native Testing Library rendering issues and provides complete mocking

// Console configuration
global.console = {
  ...console,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
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

// Mock React Native without using requireActual to prevent TurboModule issues
jest.mock('react-native', () => {
  const React = require('react');

  // Create mock component factory
  const MockComponent = (name: string) => {
    const Component = React.forwardRef((props: any, ref: any) => {
      return React.createElement('div', { ...props, ref, 'data-testid': props.testID });
    });
    Component.displayName = `Mock${name}`;
    return Component;
  };

  // Create comprehensive React Native mock
  const ReactNativeMock = {
    // Platform APIs
    Platform: {
      OS: 'ios',
      Version: '16.0',
      select: jest.fn((obj) => obj.ios || obj.default)
    },

    // UI APIs
    Alert: {
      alert: jest.fn((title, message, buttons) => {
        // Simulate button press for testing
        if (buttons && buttons.length > 0) {
          const defaultButton = buttons.find(b => b.style !== 'cancel') || buttons[0];
          if (defaultButton && defaultButton.onPress) {
            defaultButton.onPress();
          }
        }
      })
    },

    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },

    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
    },

    StyleSheet: {
      create: jest.fn(styles => styles),
      compose: jest.fn(),
      flatten: jest.fn(),
      absoluteFill: {},
      absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    },

    // Core Components
    View: MockComponent('View'),
    Text: MockComponent('Text'),
    Image: MockComponent('Image'),
    TextInput: MockComponent('TextInput'),
    ScrollView: MockComponent('ScrollView'),
    FlatList: MockComponent('FlatList'),
    SectionList: MockComponent('SectionList'),
    VirtualizedList: MockComponent('VirtualizedList'),
    TouchableOpacity: MockComponent('TouchableOpacity'),
    TouchableHighlight: MockComponent('TouchableHighlight'),
    TouchableWithoutFeedback: MockComponent('TouchableWithoutFeedback'),
    Pressable: MockComponent('Pressable'),
    SafeAreaView: MockComponent('SafeAreaView'),
    KeyboardAvoidingView: MockComponent('KeyboardAvoidingView'),
    Modal: MockComponent('Modal'),
    RefreshControl: MockComponent('RefreshControl'),
    ActivityIndicator: MockComponent('ActivityIndicator'),
    Switch: MockComponent('Switch'),
    StatusBar: MockComponent('StatusBar'),

    // Navigation and Layout
    NavigationContainer: MockComponent('NavigationContainer'),

    // Native Modules
    NativeModules: {
      DevMenu: {
        show: jest.fn(),
        reload: jest.fn(),
      },
    },

    // TurboModule Registry - Fixed to prevent errors
    TurboModuleRegistry: {
      getEnforcing: jest.fn(() => ({
        show: jest.fn(),
        reload: jest.fn(),
      })),
      get: jest.fn(() => null),
    },

    // Device APIs
    Linking: {
      openURL: jest.fn(() => Promise.resolve()),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
      getInitialURL: jest.fn(() => Promise.resolve(null)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },

    // I18nManager - Required for NavigationContainer
    I18nManager: {
      getConstants: jest.fn(() => ({
        isRTL: false,
        doLeftAndRightSwapInRTL: true,
        localeIdentifier: 'en_US',
      })),
      allowRTL: jest.fn(),
      forceRTL: jest.fn(),
      swapLeftAndRightInRTL: jest.fn(),
      isRTL: false,
      doLeftAndRightSwapInRTL: true,
      localeIdentifier: 'en_US',
    },

    // BackHandler - Required for useBackButton hook
    BackHandler: {
      addEventListener: jest.fn((event, handler) => ({
        remove: jest.fn(),
      })),
      removeEventListener: jest.fn(),
      exitApp: jest.fn(),
    },

    // Clipboard
    Clipboard: {
      getString: jest.fn(() => Promise.resolve('')),
      setString: jest.fn(() => Promise.resolve()),
    },

    // Haptics
    Haptics: {
      impactAsync: jest.fn(() => Promise.resolve()),
      notificationAsync: jest.fn(() => Promise.resolve()),
      selectionAsync: jest.fn(() => Promise.resolve()),
    },

    // Animated API
    Animated: {
      View: MockComponent('AnimatedView'),
      Text: MockComponent('AnimatedText'),
      Image: MockComponent('AnimatedImage'),
      ScrollView: MockComponent('AnimatedScrollView'),
      FlatList: MockComponent('AnimatedFlatList'),
      createAnimatedComponent: (component: any) => component,
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        setOffset: jest.fn(),
        flattenOffset: jest.fn(),
        extractOffset: jest.fn(),
        addListener: jest.fn(() => 'listener-id'),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        interpolate: jest.fn(() => ({
          addListener: jest.fn(() => 'listener-id'),
          removeListener: jest.fn(),
        })),
        stopAnimation: jest.fn(),
        resetAnimation: jest.fn(),
      })),
      ValueXY: jest.fn(() => ({
        x: { setValue: jest.fn(), addListener: jest.fn() },
        y: { setValue: jest.fn(), addListener: jest.fn() },
        setValue: jest.fn(),
        setOffset: jest.fn(),
        flattenOffset: jest.fn(),
        extractOffset: jest.fn(),
        getLayout: jest.fn(() => ({ left: 0, top: 0 })),
        getTranslateTransform: jest.fn(() => []),
        addListener: jest.fn(() => 'listener-id'),
        removeListener: jest.fn(),
      })),
      timing: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      spring: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      decay: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      sequence: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      parallel: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      stagger: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      loop: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      delay: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      event: jest.fn(() => jest.fn()),
      forkEvent: jest.fn(),
      unforkEvent: jest.fn(),
      Easing: {
        linear: jest.fn(),
        ease: jest.fn(),
        quad: jest.fn(),
        cubic: jest.fn(),
        poly: jest.fn(),
        sin: jest.fn(),
        circle: jest.fn(),
        exp: jest.fn(),
        elastic: jest.fn(),
        back: jest.fn(),
        bounce: jest.fn(),
        bezier: jest.fn(),
        in: jest.fn(),
        out: jest.fn(),
        inOut: jest.fn(),
      },
    },

    // LayoutAnimation
    LayoutAnimation: {
      configureNext: jest.fn(),
      create: jest.fn(),
      easeInEaseOut: jest.fn(),
      linear: jest.fn(),
      spring: jest.fn(),
      Types: {
        spring: 'spring',
        linear: 'linear',
        easeInEaseOut: 'easeInEaseOut',
        easeIn: 'easeIn',
        easeOut: 'easeOut',
        keyboard: 'keyboard',
      },
      Properties: {
        opacity: 'opacity',
        scaleX: 'scaleX',
        scaleY: 'scaleY',
        scaleXY: 'scaleXY',
      },
    },

    // PanResponder
    PanResponder: {
      create: jest.fn(() => ({
        panHandlers: {},
      })),
    },
  };

  return ReactNativeMock;
});

// Mock React Native Reanimated v4 with Worklets
jest.mock('react-native-reanimated', () => {
  const React = require('react');

  const MockComponent = (name: string) => {
    const Component = React.forwardRef((props: any, ref: any) => {
      return React.createElement('div', { ...props, ref });
    });
    Component.displayName = `Reanimated${name}`;
    return Component;
  };

  return {
    default: {
      View: MockComponent('View'),
      Text: MockComponent('Text'),
      Image: MockComponent('Image'),
      ScrollView: MockComponent('ScrollView'),
      createAnimatedComponent: (component: any) => component,
    },
    View: MockComponent('View'),
    Text: MockComponent('Text'),
    Image: MockComponent('Image'),
    ScrollView: MockComponent('ScrollView'),
    createAnimatedComponent: (component: any) => component,
    useSharedValue: jest.fn((initial) => ({ value: initial })),
    useAnimatedStyle: jest.fn((fn) => ({})),
    useAnimatedGestureHandler: jest.fn(() => ({})),
    useAnimatedProps: jest.fn(() => ({})),
    useAnimatedReaction: jest.fn(),
    useDerivedValue: jest.fn((fn) => ({ value: fn() })),
    useAnimatedScrollHandler: jest.fn(() => ({})),
    useWorkletCallback: jest.fn((fn) => fn),
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withDelay: jest.fn((delay, value) => value),
    withRepeat: jest.fn((value) => value),
    withSequence: jest.fn((...values) => values[values.length - 1]),
    cancelAnimation: jest.fn(),
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      poly: jest.fn(),
      sin: jest.fn(),
      circle: jest.fn(),
      exp: jest.fn(),
      elastic: jest.fn(),
      back: jest.fn(),
      bounce: jest.fn(),
      bezier: jest.fn(),
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
    Extrapolate: {
      EXTEND: 'extend',
      CLAMP: 'clamp',
      IDENTITY: 'identity',
    },
    interpolate: jest.fn(),
    Keyframe: jest.fn(),
    EntryAnimationsValues: {},
    ExitAnimationsValues: {},
    SlideInRight: jest.fn(),
    SlideInLeft: jest.fn(),
    SlideInUp: jest.fn(),
    SlideInDown: jest.fn(),
    SlideOutRight: jest.fn(),
    SlideOutLeft: jest.fn(),
    SlideOutUp: jest.fn(),
    SlideOutDown: jest.fn(),
    FadeIn: jest.fn(),
    FadeInRight: jest.fn(),
    FadeInLeft: jest.fn(),
    FadeInUp: jest.fn(),
    FadeInDown: jest.fn(),
    FadeOut: jest.fn(),
    FadeOutRight: jest.fn(),
    FadeOutLeft: jest.fn(),
    FadeOutUp: jest.fn(),
    FadeOutDown: jest.fn(),
    ZoomIn: jest.fn(),
    ZoomInRotate: jest.fn(),
    ZoomInLeft: jest.fn(),
    ZoomInRight: jest.fn(),
    ZoomInUp: jest.fn(),
    ZoomInDown: jest.fn(),
    ZoomInEasyUp: jest.fn(),
    ZoomInEasyDown: jest.fn(),
    ZoomOut: jest.fn(),
    ZoomOutRotate: jest.fn(),
    ZoomOutLeft: jest.fn(),
    ZoomOutRight: jest.fn(),
    ZoomOutUp: jest.fn(),
    ZoomOutDown: jest.fn(),
    ZoomOutEasyUp: jest.fn(),
    ZoomOutEasyDown: jest.fn(),
  };
});

// Mock react-native-worklets
jest.mock('react-native-worklets', () => ({
  useWorklet: jest.fn((fn) => fn),
  createWorklet: jest.fn((fn) => fn),
  runOnJS: jest.fn((fn) => fn),
  runOnUI: jest.fn((fn) => fn),
}));

// Mock Expo modules with comprehensive coverage
jest.mock('expo-modules-core', () => ({
  EventEmitter: class MockEventEmitter {
    addListener() {
      return { remove: jest.fn() };
    }
    removeAllListeners() {}
    emit() {}
  },
  NativeModulesProxy: {
    ExpoNavigationBar: {
      getConstants: jest.fn(() => ({
        statusBarHeight: 44,
        navigationBarHeight: 0,
      })),
    },
    ExpoDevice: {
      getConstants: jest.fn(() => ({
        deviceType: 1,
        isDevice: true,
        osName: 'iOS',
        osVersion: '16.0',
        osBuildId: '20A362',
        modelName: 'iPhone 14 Pro',
        modelId: 'iPhone15,2',
        designName: 'iPhone 14 Pro',
        productName: 'iPhone',
        supportedCpuArchitectures: ['arm64'],
        manufacturer: 'Apple',
      })),
    },
    ExpoPlatform: {
      getConstants: jest.fn(() => ({
        OS: 'ios',
        Version: '16.0',
      })),
    },
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
  requireNativeModule: jest.fn((name) => ({
    getConstants: jest.fn(() => {
      if (name === 'ExpoDevice') {
        return {
          deviceType: 1,
          isDevice: true,
          osName: 'iOS',
          osVersion: '16.0',
          modelName: 'iPhone 14 Pro',
        };
      }
      if (name === 'ExpoNavigationBar') {
        return {
          statusBarHeight: 44,
          navigationBarHeight: 0,
        };
      }
      return {};
    }),
    getItemAsync: jest.fn(() => Promise.resolve(null)),
    setItemAsync: jest.fn(() => Promise.resolve()),
    deleteItemAsync: jest.fn(() => Promise.resolve()),
  })),
  requireOptionalNativeModule: jest.fn((name) => ({
    getConstants: jest.fn(() => {
      if (name === 'ExpoDevice') {
        return {
          deviceType: 1,
          isDevice: true,
          osName: 'iOS',
          osVersion: '16.0',
          modelName: 'iPhone 14 Pro',
        };
      }
      return {};
    }),
  })),
  createPermissionHook: jest.fn(() => () => [
    { granted: true, status: 'granted' },
    jest.fn(() => Promise.resolve({ granted: true, status: 'granted' }))
  ]),
}));

// Mock all Expo modules
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
  useForegroundPermissions: jest.fn(() => [
    { granted: true, status: 'granted' },
    jest.fn(() => Promise.resolve({ granted: true, status: 'granted' }))
  ]),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/document/',
  cacheDirectory: 'file:///mock/cache/',
  bundleDirectory: 'file:///mock/bundle/',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('mock file content')),
  deleteAsync: jest.fn(() => Promise.resolve()),
  moveAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, isDirectory: false, size: 1024 })),
  downloadAsync: jest.fn(() => Promise.resolve({ uri: 'file:///mock/downloaded.jpg' })),
  uploadAsync: jest.fn(() => Promise.resolve({ body: 'upload complete' })),
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
  FileSystemRequestDirectoryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => Promise.resolve({
    uri: 'file:///mock/manipulated.jpg',
    width: 100,
    height: 100,
  })),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
  },
  FlipType: {
    Vertical: 'vertical',
    Horizontal: 'horizontal',
  },
  RotateType: {
    Rotate90: 90,
    Rotate180: 180,
    Rotate270: 270,
  },
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

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  
  const createIconComponent = (name) => {
    return React.forwardRef((props, ref) => {
      return React.createElement(Text, {
        ...props,
        ref,
        testID: props.testID || `${name}-icon`,
      }, props.name || 'icon');
    });
  };

  return {
    AntDesign: createIconComponent('AntDesign'),
    Entypo: createIconComponent('Entypo'),
    EvilIcons: createIconComponent('EvilIcons'),
    Feather: createIconComponent('Feather'),
    FontAwesome: createIconComponent('FontAwesome'),
    FontAwesome5: createIconComponent('FontAwesome5'),
    FontAwesome6: createIconComponent('FontAwesome6'),
    Foundation: createIconComponent('Foundation'),
    Ionicons: createIconComponent('Ionicons'),
    MaterialIcons: createIconComponent('MaterialIcons'),
    MaterialCommunityIcons: createIconComponent('MaterialCommunityIcons'),
    Octicons: createIconComponent('Octicons'),
    Zocial: createIconComponent('Zocial'),
    SimpleLineIcons: createIconComponent('SimpleLineIcons'),
  };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    LinearGradient: React.forwardRef((props, ref) => {
      return React.createElement(View, {
        ...props,
        ref,
        testID: props.testID || 'linear-gradient',
        style: [props.style, { backgroundColor: '#f0f0f0' }],
      }, props.children);
    }),
  };
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const createSvgComponent = (name) => {
    return React.forwardRef((props, ref) => {
      return React.createElement(View, {
        ...props,
        ref,
        testID: props.testID || `svg-${name.toLowerCase()}`,
        style: [props.style, { backgroundColor: '#f0f0f0' }],
      }, props.children);
    });
  };

  return {
    default: createSvgComponent('Svg'),
    Svg: createSvgComponent('Svg'),
    Circle: createSvgComponent('Circle'),
    Ellipse: createSvgComponent('Ellipse'),
    G: createSvgComponent('G'),
    Text: createSvgComponent('Text'),
    TSpan: createSvgComponent('TSpan'),
    TextPath: createSvgComponent('TextPath'),
    Path: createSvgComponent('Path'),
    Polygon: createSvgComponent('Polygon'),
    Polyline: createSvgComponent('Polyline'),
    Line: createSvgComponent('Line'),
    Rect: createSvgComponent('Rect'),
    Use: createSvgComponent('Use'),
    Image: createSvgComponent('Image'),
    Symbol: createSvgComponent('Symbol'),
    Defs: createSvgComponent('Defs'),
    LinearGradient: createSvgComponent('LinearGradient'),
    RadialGradient: createSvgComponent('RadialGradient'),
    Stop: createSvgComponent('Stop'),
    ClipPath: createSvgComponent('ClipPath'),
    Pattern: createSvgComponent('Pattern'),
    Mask: createSvgComponent('Mask'),
    SvgXml: createSvgComponent('SvgXml'),
    LocalSvg: createSvgComponent('LocalSvg'),
    SvgUri: createSvgComponent('SvgUri'),
    withLocalSvg: (Component) => Component,
  };
});

// Mock react-native-qrcode-svg
jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  return React.forwardRef((props, ref) => {
    return React.createElement(View, {
      ...props,
      ref,
      testID: props.testID || 'qr-code',
      style: [
        props.style,
        {
          width: props.size || 100,
          height: props.size || 100,
          backgroundColor: '#f0f0f0',
          justifyContent: 'center',
          alignItems: 'center',
        },
      ],
    }, React.createElement(Text, null, 'QR Code'));
  });
});

// Mock react-native-view-shot
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('data:image/png;base64,mockImageData')),
  captureScreen: jest.fn(() => Promise.resolve('data:image/png;base64,mockScreenData')),
  ViewShot: require('react').forwardRef((props, ref) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { ...props, ref }, props.children);
  }),
}));

// Mock AsyncStorage - Handle both default and named import patterns
const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: mockAsyncStorage,
  // Also export methods directly for named imports
  ...mockAsyncStorage
}));

// Mock Supabase with comprehensive database operations
jest.mock('@supabase/supabase-js', () => {
  // Mock pet data for consistent testing
  const mockPetData = {
    'pet-1': {
      id: 'pet-1',
      name: 'Max',
      species: 'dog',
      breed: 'Golden Retriever',
      weight_kg: 25,
      color_markings: 'Golden with white chest',
      medical_conditions: [],
      allergies: [],
      current_medications: [],
      personality_traits: ['friendly', 'playful'],
      favorite_activities: ['fetch', 'swimming'],
      exercise_needs: 'high',
      date_of_birth: '2020-01-01',
      status: 'active',
      user_id: 'user-1',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }
  };

  const mockUserData = {
    'user-1': {
      id: 'user-1',
      auth_user_id: 'auth-user-1',
      email: 'test@example.com',
      subscription_tier: 'free',
      created_at: '2023-01-01T00:00:00Z'
    }
  };

  // Create a comprehensive Supabase client mock
  const createSupabaseMock = () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      rangeLt: jest.fn().mockReturnThis(),
      rangeGt: jest.fn().mockReturnThis(),
      rangeGte: jest.fn().mockReturnThis(),
      rangeLte: jest.fn().mockReturnThis(),
      rangeAdjacent: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      abortSignal: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          data: mockPetData['pet-1'],
          error: null
        });
      }),
      maybeSingle: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          data: mockPetData['pet-1'],
          error: null
        });
      }),
      csv: jest.fn().mockReturnThis(),
      geojson: jest.fn().mockReturnThis(),
      explain: jest.fn().mockReturnThis(),
      rollback: jest.fn().mockReturnThis(),
      returns: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((callback) => {
        // Default behavior for query chains
        const result = { data: [mockPetData['pet-1']], error: null };
        return Promise.resolve(callback ? callback(result) : result);
      }),
    };

    // Override specific methods with realistic behavior
    queryBuilder.insert.mockImplementation((data) => {
      const newId = `pet-${Date.now()}`;
      const newPet = { ...data, id: newId };
      return {
        ...queryBuilder,
        select: jest.fn().mockImplementation(() => ({
          ...queryBuilder,
          single: jest.fn().mockResolvedValue({ data: newPet, error: null })
        })),
        then: jest.fn().mockResolvedValue({ data: newPet, error: null })
      };
    });

    return {
      auth: {
        signUp: jest.fn((credentials) =>
          Promise.resolve({
            data: {
              user: { id: 'auth-user-1', email: credentials.email },
              session: { access_token: 'mock-token' }
            },
            error: null
          })
        ),
        signInWithPassword: jest.fn((credentials) =>
          Promise.resolve({
            data: {
              user: { id: 'auth-user-1', email: credentials.email },
              session: { access_token: 'mock-token' }
            },
            error: null
          })
        ),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
        getSession: jest.fn(() =>
          Promise.resolve({
            data: {
              session: {
                user: { id: 'auth-user-1', email: 'test@example.com' },
                access_token: 'mock-token'
              }
            },
            error: null
          })
        ),
        getUser: jest.fn().mockImplementation(() => {
          console.log('🔍 MOCK: getUser called from createSupabaseMock');
          return Promise.resolve({
            data: {
              user: { id: 'auth-user-1', email: 'test@example.com' }
            },
            error: null
          });
        }),
        onAuthStateChange: jest.fn((callback) => {
          // Simulate immediate auth state
          if (callback) {
            callback('SIGNED_IN', {
              user: { id: 'auth-user-1', email: 'test@example.com' },
              access_token: 'mock-token'
            });
          }
          return {
            data: {
              subscription: {
                unsubscribe: jest.fn()
              }
            }
          };
        }),
        refreshSession: jest.fn(() =>
          Promise.resolve({
            data: {
              session: { access_token: 'refreshed-token' }
            },
            error: null
          })
        ),
        updateUser: jest.fn((attributes) =>
          Promise.resolve({
            data: {
              user: { id: 'auth-user-1', ...attributes }
            },
            error: null
          })
        ),
      },

      from: jest.fn((table) => {
        // Table-specific mock behavior
        if (table === 'pets') {
          return {
            ...queryBuilder,
            select: jest.fn().mockImplementation((columns) => ({
              ...queryBuilder,
              eq: jest.fn().mockImplementation((column, value) => ({
                ...queryBuilder,
                single: jest.fn().mockResolvedValue({
                  data: value === 'pet-1' ? mockPetData['pet-1'] : null,
                  error: null
                }),
                then: jest.fn().mockResolvedValue({
                  data: value === 'pet-1' ? [mockPetData['pet-1']] : [],
                  error: null
                })
              })),
              order: jest.fn().mockImplementation(() => ({
                ...queryBuilder,
                then: jest.fn().mockResolvedValue({
                  data: Object.values(mockPetData),
                  error: null
                })
              })),
              then: jest.fn().mockResolvedValue({
                data: Object.values(mockPetData),
                error: null
              })
            })),
            insert: jest.fn().mockImplementation((data) => ({
              ...queryBuilder,
              select: jest.fn().mockImplementation(() => ({
                ...queryBuilder,
                single: jest.fn().mockResolvedValue({
                  data: { ...data, id: `pet-${Date.now()}` },
                  error: null
                })
              }))
            })),
            update: jest.fn().mockImplementation((data) => ({
              ...queryBuilder,
              eq: jest.fn().mockImplementation(() => ({
                ...queryBuilder,
                select: jest.fn().mockImplementation(() => ({
                  ...queryBuilder,
                  single: jest.fn().mockResolvedValue({
                    data: { ...mockPetData['pet-1'], ...data },
                    error: null
                  })
                }))
              }))
            }))
          };
        }

        if (table === 'users') {
          return {
            ...queryBuilder,
            select: jest.fn().mockImplementation(() => ({
              ...queryBuilder,
              eq: jest.fn().mockImplementation(() => ({
                ...queryBuilder,
                single: jest.fn().mockResolvedValue({
                  data: mockUserData['user-1'],
                  error: null
                })
              }))
            }))
          };
        }

        // Default table behavior
        return queryBuilder;
      }),

      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(() => Promise.resolve({
            data: { path: 'mock-path.jpg' },
            error: null
          })),
          download: jest.fn(() => Promise.resolve({
            data: new Blob(),
            error: null
          })),
          remove: jest.fn(() => Promise.resolve({
            data: null,
            error: null
          })),
          list: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          })),
          getPublicUrl: jest.fn(() => ({
            data: { publicUrl: 'https://mock-url.com/image.jpg' }
          })),
        }))
      },

      realtime: {
        channel: jest.fn(() => ({
          on: jest.fn().mockReturnThis(),
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
        }))
      },

      rpc: jest.fn((functionName, params) => {
        // Mock RPC functions
        if (functionName === 'find_nearby_users') {
          return Promise.resolve({ data: [], error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };
  };

  return {
    createClient: jest.fn(() => createSupabaseMock())
  };
});

// NOTE: @/lib/supabase mock is handled by individual test files to avoid conflicts

// Disable this mock to test if it conflicts with @/lib/supabase mock
// jest.mock('./src/services/supabase', () => {
//   const createSupabaseMock = () => {
//     const queryBuilder = {
//       select: jest.fn().mockReturnThis(),
//       insert: jest.fn().mockReturnThis(),
//       update: jest.fn().mockReturnThis(),
//       delete: jest.fn().mockReturnThis(),
//       upsert: jest.fn().mockReturnThis(),
//       eq: jest.fn().mockReturnThis(),
//       neq: jest.fn().mockReturnThis(),
//       gt: jest.fn().mockReturnThis(),
//       gte: jest.fn().mockReturnThis(),
//       lt: jest.fn().mockReturnThis(),
//       lte: jest.fn().mockReturnThis(),
//       like: jest.fn().mockReturnThis(),
//       ilike: jest.fn().mockReturnThis(),
//       is: jest.fn().mockReturnThis(),
//       in: jest.fn().mockReturnThis(),
//       contains: jest.fn().mockReturnThis(),
//       containedBy: jest.fn().mockReturnThis(),
//       rangeGt: jest.fn().mockReturnThis(),
//       rangeGte: jest.fn().mockReturnThis(),
//       rangeLt: jest.fn().mockReturnThis(),
//       rangeLte: jest.fn().mockReturnThis(),
//       rangeAdjacent: jest.fn().mockReturnThis(),
//       overlaps: jest.fn().mockReturnThis(),
//       textSearch: jest.fn().mockReturnThis(),
//       match: jest.fn().mockReturnThis(),
//       not: jest.fn().mockReturnThis(),
//       or: jest.fn().mockReturnThis(),
//       filter: jest.fn().mockReturnThis(),
//       order: jest.fn().mockReturnThis(),
//       limit: jest.fn().mockReturnThis(),
//       range: jest.fn().mockReturnThis(),
//       single: jest.fn().mockImplementation(() => {
//         return Promise.resolve({
//           data: {
//             id: 'pet-1',
//             name: 'Max',
//             species: 'dog',
//             breed: 'Golden Retriever',
//             weight_kg: 25,
//             medical_conditions: [],
//             allergies: []
//           },
//           error: null
//         });
//       }),
//       maybeSingle: jest.fn().mockImplementation(() => {
//         return Promise.resolve({
//           data: null,
//           error: null
//         });
//       })
//     };

//     return {
//       auth: {
//         signUp: jest.fn((credentials) =>
//           Promise.resolve({
//             data: {
//               user: { id: 'auth-user-1', email: credentials.email },
//               session: { access_token: 'mock-token' }
//             },
//             error: null
//           })
//         ),
//         signInWithPassword: jest.fn((credentials) =>
//           Promise.resolve({
//             data: {
//               user: { id: 'auth-user-1', email: credentials.email },
//               session: { access_token: 'mock-token' }
//             },
//             error: null
//           })
//         ),
//         signOut: jest.fn(() =>
//           Promise.resolve({
//             error: null
//           })
//         ),
//         getUser: jest.fn().mockResolvedValue({
//           data: {
//             user: { id: 'auth-user-1', email: 'test@example.com' }
//           },
//           error: null
//         }),
//         getSession: jest.fn(() =>
//           Promise.resolve({
//             data: {
//               session: { access_token: 'mock-token', user: { id: 'auth-user-1' } }
//             },
//             error: null
//           })
//         ),
//         onAuthStateChange: jest.fn((callback) => {
//           callback('SIGNED_IN', { user: { id: 'auth-user-1' } });
//           return { data: { subscription: { unsubscribe: jest.fn() } } };
//         })
//       },
//       from: jest.fn((table) => queryBuilder),
//       channel: jest.fn(() => ({
//         on: jest.fn().mockReturnThis(),
//         subscribe: jest.fn().mockImplementation(() => Promise.resolve('ok'))
//       })),
//       removeChannel: jest.fn()
//     };
//   };

//   const mockClient = createSupabaseMock();

//   return {
//     supabase: mockClient,
//     supabaseHelpers: {
//       // Mock any helper functions if needed
//     },
//     default: mockClient
//   };
// });

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
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome5', () => 'Icon');

// Mock react-native-paper with comprehensive components
jest.mock('react-native-paper', () => {
  const React = require('react');

  const MockPaperComponent = (name: string) => {
    const Component = React.forwardRef((props: any, ref: any) => {
      const { children, onPress, ...otherProps } = props;
      return React.createElement(
        onPress ? 'button' : 'div',
        {
          ...otherProps,
          ref,
          onClick: onPress,
          'data-testid': props.testID
        },
        children
      );
    });
    Component.displayName = `MockPaper${name}`;
    return Component;
  };

  return {
    useTheme: () => ({
      colors: {
        primary: '#6200ea',
        onPrimary: '#ffffff',
        primaryContainer: '#bb86fc',
        onPrimaryContainer: '#000000',
        secondary: '#03dac6',
        onSecondary: '#000000',
        secondaryContainer: '#a7f3d0',
        onSecondaryContainer: '#000000',
        tertiary: '#ffc107',
        onTertiary: '#000000',
        tertiaryContainer: '#fff59d',
        onTertiaryContainer: '#000000',
        error: '#b00020',
        onError: '#ffffff',
        errorContainer: '#ffb4a9',
        onErrorContainer: '#410001',
        background: '#ffffff',
        onBackground: '#000000',
        surface: '#ffffff',
        onSurface: '#000000',
        surfaceVariant: '#f5f5f5',
        onSurfaceVariant: '#666666',
        outline: '#cccccc',
        outlineVariant: '#e0e0e0',
        shadow: '#000000',
        scrim: '#000000',
        inverseSurface: '#2d2d2d',
        inverseOnSurface: '#f5f5f5',
        inversePrimary: '#bb86fc',
        elevation: {
          level0: 'transparent',
          level1: '#f7f7f7',
          level2: '#f2f2f2',
          level3: '#ededed',
          level4: '#ebebeb',
          level5: '#e8e8e8',
        },
        surfaceDisabled: '#e0e0e0',
        onSurfaceDisabled: '#9e9e9e',
        backdrop: 'rgba(0, 0, 0, 0.5)',
      },
      fonts: {
        regular: { fontFamily: 'System' },
        medium: { fontFamily: 'System' },
        light: { fontFamily: 'System' },
        thin: { fontFamily: 'System' },
      },
      roundness: 4,
      isV3: true,
    }),

    // Core Components
    Provider: ({ children }: any) => children,
    PaperProvider: ({ children }: any) => children,
    Portal: ({ children }: any) => children,

    // Layout Components
    Card: MockPaperComponent('Card'),
    Surface: MockPaperComponent('Surface'),
    Divider: MockPaperComponent('Divider'),

    // Typography
    Text: MockPaperComponent('Text'),
    Title: MockPaperComponent('Title'),
    Subheading: MockPaperComponent('Subheading'),
    Headline: MockPaperComponent('Headline'),
    Caption: MockPaperComponent('Caption'),
    Paragraph: MockPaperComponent('Paragraph'),

    // Form Components
    Button: MockPaperComponent('Button'),
    FAB: MockPaperComponent('FAB'),
    IconButton: MockPaperComponent('IconButton'),
    TextInput: MockPaperComponent('TextInput'),
    Checkbox: MockPaperComponent('Checkbox'),
    RadioButton: MockPaperComponent('RadioButton'),
    Switch: MockPaperComponent('Switch'),
    ToggleButton: MockPaperComponent('ToggleButton'),
    Chip: MockPaperComponent('Chip'),

    // Lists
    List: {
      Item: MockPaperComponent('ListItem'),
      Icon: MockPaperComponent('ListIcon'),
      Accordion: MockPaperComponent('ListAccordion'),
      Section: MockPaperComponent('ListSection'),
      Subheader: MockPaperComponent('ListSubheader'),
    },

    // Progress & Activity
    ProgressBar: MockPaperComponent('ProgressBar'),
    ActivityIndicator: MockPaperComponent('ActivityIndicator'),

    // Feedback
    Snackbar: MockPaperComponent('Snackbar'),
    Banner: MockPaperComponent('Banner'),
    Dialog: MockPaperComponent('Dialog'),

    // Navigation
    BottomNavigation: MockPaperComponent('BottomNavigation'),
    Appbar: {
      Header: MockPaperComponent('AppbarHeader'),
      Content: MockPaperComponent('AppbarContent'),
      Action: MockPaperComponent('AppbarAction'),
      BackAction: MockPaperComponent('AppbarBackAction'),
    },

    // Data Display
    Avatar: MockPaperComponent('Avatar'),
    Badge: MockPaperComponent('Badge'),
    DataTable: MockPaperComponent('DataTable'),

    // Navigation Tab
    TabView: MockPaperComponent('TabView'),

    // Menu
    Menu: MockPaperComponent('Menu'),

    // Modal
    Modal: MockPaperComponent('Modal'),

    // Search
    Searchbar: MockPaperComponent('Searchbar'),

    // Constants
    Colors: {
      red50: '#ffebee',
      red100: '#ffcdd2',
      red200: '#ef9a9a',
      red300: '#e57373',
      red400: '#ef5350',
      red500: '#f44336',
      red600: '#e53935',
      red700: '#d32f2f',
      red800: '#c62828',
      red900: '#b71c1c',
    },

    DefaultTheme: {
      colors: {
        primary: '#6200ea',
        background: '#ffffff',
        surface: '#ffffff',
        accent: '#03dac6',
        error: '#b00020',
        text: '#000000',
        onSurface: '#000000',
        disabled: 'rgba(0, 0, 0, 0.26)',
        placeholder: 'rgba(0, 0, 0, 0.54)',
        backdrop: 'rgba(0, 0, 0, 0.5)',
        notification: '#f50057',
      },
    },

    // MD3 Themes
    MD3LightTheme: {
      colors: {
        primary: '#6200ea',
        onPrimary: '#ffffff',
        primaryContainer: '#bb86fc',
        onPrimaryContainer: '#000000',
        secondary: '#03dac6',
        onSecondary: '#000000',
        secondaryContainer: '#a7f3d0',
        onSecondaryContainer: '#000000',
        tertiary: '#ffc107',
        onTertiary: '#000000',
        tertiaryContainer: '#fff59d',
        onTertiaryContainer: '#000000',
        error: '#b00020',
        onError: '#ffffff',
        errorContainer: '#ffb4a9',
        onErrorContainer: '#410001',
        background: '#ffffff',
        onBackground: '#000000',
        surface: '#ffffff',
        onSurface: '#000000',
        surfaceVariant: '#f5f5f5',
        onSurfaceVariant: '#666666',
        outline: '#cccccc',
        outlineVariant: '#e0e0e0',
        shadow: '#000000',
        scrim: '#000000',
        inverseSurface: '#2d2d2d',
        inverseOnSurface: '#f5f5f5',
        inversePrimary: '#bb86fc',
        elevation: {
          level0: 'transparent',
          level1: '#f7f7f7',
          level2: '#f2f2f2',
          level3: '#ededed',
          level4: '#ebebeb',
          level5: '#e8e8e8',
        },
        surfaceDisabled: '#e0e0e0',
        onSurfaceDisabled: '#9e9e9e',
        backdrop: 'rgba(0, 0, 0, 0.5)',
      },
      fonts: {
        regular: { fontFamily: 'System' },
        medium: { fontFamily: 'System' },
        light: { fontFamily: 'System' },
        thin: { fontFamily: 'System' },
      },
      roundness: 4,
      isV3: true,
    },

    MD3DarkTheme: {
      colors: {
        primary: '#bb86fc',
        onPrimary: '#000000',
        primaryContainer: '#3700b3',
        onPrimaryContainer: '#ffffff',
        secondary: '#03dac6',
        onSecondary: '#000000',
        secondaryContainer: '#004d40',
        onSecondaryContainer: '#ffffff',
        tertiary: '#ffc107',
        onTertiary: '#000000',
        tertiaryContainer: '#ff8f00',
        onTertiaryContainer: '#ffffff',
        error: '#cf6679',
        onError: '#000000',
        errorContainer: '#b00020',
        onErrorContainer: '#ffffff',
        background: '#121212',
        onBackground: '#ffffff',
        surface: '#121212',
        onSurface: '#ffffff',
        surfaceVariant: '#2d2d2d',
        onSurfaceVariant: '#cccccc',
        outline: '#666666',
        outlineVariant: '#444444',
        shadow: '#000000',
        scrim: '#000000',
        inverseSurface: '#ffffff',
        inverseOnSurface: '#000000',
        inversePrimary: '#6200ea',
        elevation: {
          level0: 'transparent',
          level1: '#1e1e1e',
          level2: '#232323',
          level3: '#2a2a2a',
          level4: '#2c2c2c',
          level5: '#2e2e2e',
        },
        surfaceDisabled: '#2d2d2d',
        onSurfaceDisabled: '#666666',
        backdrop: 'rgba(0, 0, 0, 0.5)',
      },
      fonts: {
        regular: { fontFamily: 'System' },
        medium: { fontFamily: 'System' },
        light: { fontFamily: 'System' },
        thin: { fontFamily: 'System' },
      },
      roundness: 4,
      isV3: true,
    },
  };
});

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  initStripe: jest.fn(() => Promise.resolve()),
  useStripe: jest.fn(() => ({
    initPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
    presentPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
  })),
  StripeProvider: ({ children }: { children: any }) => children,
}));

// Additional React Native Libraries
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
  })),
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
  })),
}));

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');

  const MockGestureComponent = (name: string) => {
    const Component = React.forwardRef((props: any, ref: any) => {
      return React.createElement('div', { ...props, ref });
    });
    Component.displayName = `MockGesture${name}`;
    return Component;
  };

  return {
    GestureHandlerRootView: MockGestureComponent('HandlerRootView'),
    PanGestureHandler: MockGestureComponent('PanGestureHandler'),
    TapGestureHandler: MockGestureComponent('TapGestureHandler'),
    FlingGestureHandler: MockGestureComponent('FlingGestureHandler'),
    LongPressGestureHandler: MockGestureComponent('LongPressGestureHandler'),
    PinchGestureHandler: MockGestureComponent('PinchGestureHandler'),
    RotationGestureHandler: MockGestureComponent('RotationGestureHandler'),
    ForceTouchGestureHandler: MockGestureComponent('ForceTouchGestureHandler'),
    RawButton: MockGestureComponent('RawButton'),
    BaseButton: MockGestureComponent('BaseButton'),
    RectButton: MockGestureComponent('RectButton'),
    BorderlessButton: MockGestureComponent('BorderlessButton'),
    TouchableOpacity: MockGestureComponent('TouchableOpacity'),
    TouchableHighlight: MockGestureComponent('TouchableHighlight'),
    TouchableNativeFeedback: MockGestureComponent('TouchableNativeFeedback'),
    TouchableWithoutFeedback: MockGestureComponent('TouchableWithoutFeedback'),
    ScrollView: MockGestureComponent('ScrollView'),
    FlatList: MockGestureComponent('FlatList'),
    DrawerLayout: MockGestureComponent('DrawerLayout'),
    Swipeable: MockGestureComponent('Swipeable'),
    State: {
      UNDETERMINED: 0,
      FAILED: 1,
      BEGAN: 2,
      CANCELLED: 3,
      ACTIVE: 4,
      END: 5,
    },
    Directions: {
      RIGHT: 1,
      LEFT: 2,
      UP: 4,
      DOWN: 8,
    },
  };
});

// Mock navigation libraries
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  
  // Mock NavigationContainer with proper linking and theme support
  const MockNavigationContainer = React.forwardRef(({ children, ...props }, ref) => {
    // Provide navigation context
    return React.createElement('div', { ref, ...props }, children);
  });
  MockNavigationContainer.displayName = 'MockNavigationContainer';

  return {
    NavigationContainer: MockNavigationContainer,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      isFocused: jest.fn(() => true),
      addListener: jest.fn(() => jest.fn()),
      reset: jest.fn(),
      setParams: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      popToTop: jest.fn(),
      replace: jest.fn(),
      canGoBack: jest.fn(() => false),
      getId: jest.fn(() => 'mock-id'),
      getState: jest.fn(() => ({ routes: [], index: 0 })),
    }),
    useRoute: () => ({
      params: {},
      name: 'Test',
      key: 'test-key',
      path: undefined,
    }),
    useFocusEffect: jest.fn((callback) => {
      // Immediately call the callback to simulate focus
      if (typeof callback === 'function') {
        const cleanup = callback();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }
    }),
    useIsFocused: jest.fn(() => true),
    useNavigationState: jest.fn((selector) => selector({ routes: [], index: 0 })),
    createNavigationContainerRef: jest.fn(() => ({
      current: {
        navigate: jest.fn(),
        goBack: jest.fn(),
        dispatch: jest.fn(),
        reset: jest.fn(),
        getRootState: jest.fn(() => ({ routes: [], index: 0 })),
        getCurrentRoute: jest.fn(() => ({ name: 'Test', key: 'test-key' })),
        getCurrentOptions: jest.fn(() => ({})),
        addListener: jest.fn(() => jest.fn()),
        removeListener: jest.fn(),
        isReady: jest.fn(() => true),
      },
    })),
    CommonActions: {
      navigate: jest.fn((name, params) => ({ type: 'NAVIGATE', payload: { name, params } })),
      goBack: jest.fn(() => ({ type: 'GO_BACK' })),
      reset: jest.fn((state) => ({ type: 'RESET', payload: state })),
      setParams: jest.fn((params) => ({ type: 'SET_PARAMS', payload: { params } })),
    },
    StackActions: {
      push: jest.fn((name, params) => ({ type: 'STACK_PUSH', payload: { name, params } })),
      pop: jest.fn((count) => ({ type: 'STACK_POP', payload: { count } })),
      popToTop: jest.fn(() => ({ type: 'STACK_POP_TO_TOP' })),
      replace: jest.fn((name, params) => ({ type: 'STACK_REPLACE', payload: { name, params } })),
    },
    TabActions: {
      jumpTo: jest.fn((name, params) => ({ type: 'JUMP_TO', payload: { name, params } })),
    },
    DrawerActions: {
      openDrawer: jest.fn(() => ({ type: 'OPEN_DRAWER' })),
      closeDrawer: jest.fn(() => ({ type: 'CLOSE_DRAWER' })),
      toggleDrawer: jest.fn(() => ({ type: 'TOGGLE_DRAWER' })),
    },
    // Add linking config support
    LinkingContext: React.createContext(null),
    NavigationContext: React.createContext(null),
    NavigationRouteContext: React.createContext(null),
  };
});

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: jest.fn(() => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  })),
  CardStyleInterpolators: {},
  TransitionSpecs: {},
  HeaderStyleInterpolators: {},
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(() => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  })),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  })),
  NativeStackNavigationProp: {},
  NativeStackScreenProps: {},
}));

// Add any additional mocks for your specific services
jest.mock('./src/services/PetPersonalityService', () => {
  const mockService = {
    getAllPersonalityTraits: jest.fn(() => [
      { id: 'friendly', label: 'Friendly', description: 'Good with people', category: 'social' },
      { id: 'playful', label: 'Playful', description: 'Loves games', category: 'behavior' },
      { id: 'calm', label: 'Calm', description: 'Relaxed nature', category: 'temperament' }
    ]),
    getAllFavoriteActivities: jest.fn(() => [
      { id: 'fetch', label: 'Playing Fetch', description: 'Retrieving thrown objects' },
      { id: 'walks', label: 'Long Walks', description: 'Extended outdoor exercise' },
      { id: 'swimming', label: 'Swimming', description: 'Water-based exercise' }
    ]),
    getPersonalityTraitsForSpecies: jest.fn(() => [
      { id: 'friendly', label: 'Friendly', description: 'Good with people', category: 'social' },
      { id: 'playful', label: 'Playful', description: 'Loves games', category: 'behavior' }
    ]),
    getFavoriteActivitiesForSpecies: jest.fn(() => [
      { id: 'fetch', label: 'Playing Fetch', description: 'Retrieving thrown objects' },
      { id: 'walks', label: 'Long Walks', description: 'Extended outdoor exercise' }
    ]),
    getPersonalityProfile: jest.fn(() => ({
      species: 'dog',
      personalityTraits: [
        { id: 'friendly', label: 'Friendly', description: 'Good with people', category: 'social' },
        { id: 'playful', label: 'Playful', description: 'Loves games', category: 'behavior' }
      ],
      favoriteActivities: [
        { id: 'fetch', label: 'Playing Fetch', description: 'Retrieving thrown objects' },
        { id: 'walks', label: 'Long Walks', description: 'Extended outdoor exercise' }
      ],
      careOptions: [
        { id: 'daily-walk', label: 'Daily walks', description: 'Regular exercise', category: 'exercise' }
      ],
      exerciseNeeds: [
        { id: 'high', label: 'High', value: 'high', description: 'Needs lots of exercise' }
      ]
    })),
    getExerciseOptions: jest.fn(() => [
      { id: 'high', label: 'High Energy', value: 'high', description: '2+ hours daily exercise' },
      { id: 'moderate', label: 'Moderate Energy', value: 'moderate', description: '1-2 hours daily exercise' },
      { id: 'low', label: 'Low Energy', value: 'low', description: '30-60 minutes daily exercise' }
    ])
  };
  
  return {
    __esModule: true,
    PetPersonalityService: mockService,  // Named export (used by components)
    default: mockService                 // Default export (alternative import)
  };
});

// Setup console error suppression for React warnings in tests
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
     args[0].includes('Warning: React.createFactory() is deprecated') ||
     args[0].includes('Warning: componentWillMount has been renamed') ||
     args[0].includes('Warning: componentWillReceiveProps has been renamed'))
  ) {
    return;
  }
  originalError.apply(console, args);
};

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  usePathname: jest.fn(() => '/'),
  useGlobalSearchParams: jest.fn(() => ({})),
  Link: ({ children, ...props }) => children,
  Redirect: () => null,
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
  Slot: () => null,
}));
