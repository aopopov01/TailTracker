/**
 * Test Helper Utilities
 * Common testing utilities and setup functions
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { Alert } from 'react-native';

// Mock implementations
export const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    insert: jest.fn(),
    update: jest.fn(() => ({
      eq: jest.fn()
    })),
    delete: jest.fn(() => ({
      eq: jest.fn()
    }))
  })),
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn()
  }
};

export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(() => true),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn()
};

export const mockRoute = {
  key: 'test-route',
  name: 'TestScreen',
  params: {}
};

// Custom render function with providers
interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };

// Mock Alert for testing
export const mockAlert = {
  alert: jest.fn(),
  prompt: jest.fn()
};

// Wait for async operations to complete
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Common test data generators
export const generateTestId = (component: string, suffix?: string) => {
  return suffix ? `${component}-${suffix}` : component;
};

// Mock hook implementations
export const createMockHook = <T>(returnValue: T) => {
  return jest.fn(() => returnValue);
};

// Database response helpers
export const createSuccessResponse = <T>(data: T) => ({
  data,
  error: null,
  status: 200,
  statusText: 'OK'
});

export const createErrorResponse = (message: string, status = 400) => ({
  data: null,
  error: { message },
  status,
  statusText: 'Error'
});

// Species-specific test utilities
export const getSpeciesActivities = (species: string): string[] => {
  const activities = {
    dog: ['Playing Fetch', 'Long Walks', 'Dog Parks', 'Swimming'],
    cat: ['Laser Pointer', 'Window Bird Watching', 'Catnip Toys'],
    bird: ['Foraging Games', 'Talking/Mimicking', 'Perch Swinging']
  };
  return activities[species as keyof typeof activities] || [];
};

// Form validation helpers
export const expectFormField = (getByTestId: any, fieldId: string, value: string) => {
  const field = getByTestId(fieldId);
  expect(field.props.value || field.props.defaultValue).toBe(value);
};

export const expectFieldsToBePopulated = (getByTestId: any, fields: Record<string, string>) => {
  Object.entries(fields).forEach(([fieldId, expectedValue]) => {
    expectFormField(getByTestId, fieldId, expectedValue);
  });
};

// Navigation test helpers
export const expectNavigationCall = (mockNav: any, screen: string, params?: any) => {
  expect(mockNav.navigate).toHaveBeenCalledWith(screen, params);
};

// Async action test helpers
export const waitForLoadingToFinish = async (getByTestId: any, loadingId = 'loading') => {
  const loading = getByTestId(loadingId);
  await waitFor(() => {
    expect(loading).not.toBeTruthy();
  });
};

// Error boundary test helper
export const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return null;
};

// Mock implementations for common services
export const mockPetService = {
  upsertPetFromOnboarding: jest.fn(),
  getPetById: jest.fn(),
  updatePet: jest.fn(),
  deletePet: jest.fn(),
  getAllPets: jest.fn()
};

export const mockAuthService = {
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  getCurrentUser: jest.fn(),
  refreshSession: jest.fn()
};

export const mockPetPersonalityService = {
  getAllFavoriteActivities: jest.fn(),
  getPersonalityTraits: jest.fn()
};

// Reset all mocks before each test
export const resetAllMocks = () => {
  jest.clearAllMocks();
  mockSupabase.rpc.mockReset();
  mockNavigation.navigate.mockReset();
  mockNavigation.goBack.mockReset();
  mockPetService.upsertPetFromOnboarding.mockReset();
  mockAuthService.signIn.mockReset();
  mockPetPersonalityService.getAllFavoriteActivities.mockReset();
};

// Test data validation helpers
export const validatePetData = (actual: any, expected: any) => {
  expect(actual.name).toBe(expected.name);
  expect(actual.species).toBe(expected.species);
  expect(actual.breed).toBe(expected.breed);
  expect(actual.personality_traits).toEqual(expected.personality_traits);
  expect(actual.favorite_activities).toEqual(expected.favorite_activities);
};

export const validateDatabaseParams = (actualParams: any, expectedPetData: any) => {
  expect(actualParams.p_name).toBe(expectedPetData.name);
  expect(actualParams.p_species).toBe(expectedPetData.species);
  expect(actualParams.p_breed).toBe(expectedPetData.breed);
  expect(actualParams.p_personality_traits).toEqual(expectedPetData.personality_traits);
  expect(actualParams.p_favorite_activities).toEqual(expectedPetData.favorite_activities);
};