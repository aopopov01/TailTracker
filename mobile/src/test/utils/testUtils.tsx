import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import { lightTheme } from '@/theme/materialTheme';

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Mock navigation container
const MockNavigationContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NavigationContainer>
      {children}
    </NavigationContainer>
  );
};

// All the providers wrapper
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  theme?: any;
}

const AllProviders: React.FC<AllProvidersProps> = ({ 
  children, 
  queryClient = createTestQueryClient(),
  theme = lightTheme 
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <MockNavigationContainer>
          {children}
        </MockNavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  theme?: any;
  navigationOptions?: any;
}

const customRender = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  const { queryClient, theme, ...renderOptions } = options || {};
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllProviders queryClient={queryClient} theme={theme}>
      {children}
    </AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Test helpers for common operations
export const TestHelpers = {
  /**
   * Create a mock navigation prop
   */
  createMockNavigation: (overrides = {}) => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    addListener: jest.fn(() => jest.fn()),
    ...overrides,
  }),

  /**
   * Create a mock route prop
   */
  createMockRoute: (params = {}, name = 'TestScreen') => ({
    params,
    key: 'test-key',
    name,
    path: undefined,
  }),

  /**
   * Create mock async storage data
   */
  setupMockAsyncStorage: (data: Record<string, string>) => {
    const mockAsyncStorage = require('@react-native-async-storage/async-storage');
    mockAsyncStorage.getItem.mockImplementation((key: string) => 
      Promise.resolve(data[key] || null)
    );
    mockAsyncStorage.setItem.mockImplementation((key: string, value: string) => {
      data[key] = value;
      return Promise.resolve();
    });
    mockAsyncStorage.removeItem.mockImplementation((key: string) => {
      delete data[key];
      return Promise.resolve();
    });
    mockAsyncStorage.clear.mockImplementation(() => {
      Object.keys(data).forEach(key => delete data[key]);
      return Promise.resolve();
    });
  },

  /**
   * Create mock query client with data
   */
  createMockQueryClient: (initialData: Record<string, any> = {}) => {
    const queryClient = createTestQueryClient();
    
    Object.entries(initialData).forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
    
    return queryClient;
  },

  /**
   * Mock successful API response
   */
  mockApiSuccess: (data: any) => {
    return jest.fn(() => Promise.resolve({ data, error: null }));
  },

  /**
   * Mock API error response
   */
  mockApiError: (error: any) => {
    return jest.fn(() => Promise.resolve({ data: null, error }));
  },

  // Location permission mocks removed - GPS tracking features removed

  /**
   * Mock camera permission granted
   */
  mockCameraPermissionGranted: () => {
    const mockCamera = require('expo-camera');
    mockCamera.Camera.requestCameraPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
  },

  /**
   * Mock successful image picker
   */
  mockImagePickerSuccess: (imageUri = 'file://test-image.jpg') => {
    const mockImagePicker = require('expo-image-picker');
    mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
      cancelled: false,
      assets: [
        {
          uri: imageUri,
          width: 100,
          height: 100,
          type: 'image',
        },
      ],
    });
  },

  /**
   * Wait for next tick
   */
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

  /**
   * Trigger async state updates
   */
  flushPromises: () => new Promise(resolve => setImmediate(resolve)),

  /**
   * Create mock pet data
   */
  createMockPet: (overrides = {}) => ({
    id: 'pet-1',
    name: 'Test Pet',
    type: 'dog',
    breed: 'Test Breed',
    age: 2,
    weight: 25,
    color: 'Brown',
    ownerId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  /**
   * Create mock user data
   */
  createMockUser: (overrides = {}) => ({
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  /**
   * Create mock location data
   */
  createMockLocation: (overrides = {}) => ({
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 5,
    altitude: 0,
    speed: 0,
    heading: 0,
    timestamp: Date.now(),
    ...overrides,
  }),

  /**
   * Create mock geofence data
   */
  createMockGeofence: (overrides = {}) => ({
    id: 'geofence-1',
    petId: 'pet-1',
    name: 'Home',
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 100,
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  }),
};

// Re-export testing library utilities
export * from '@testing-library/react-native';

// Export custom render as the default render
export { customRender as render };

// Export other utilities
export { createTestQueryClient, AllProviders };