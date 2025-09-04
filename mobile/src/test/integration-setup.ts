import { setupServer } from 'msw/node';
import { rest } from 'msw';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test database for integration tests
let testDb: any = {};

// Mock Supabase with more realistic responses for integration tests
const supabaseHandlers = [
  rest.post('*/auth/v1/token', (req, res, ctx) => {
    return res(
      ctx.json({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
      })
    );
  }),
  
  rest.get('*/rest/v1/users', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 'user-1',
          email: 'test@example.com',
          subscription_status: 'premium',
          push_token: 'ExponentPushToken[test]',
        },
      ])
    );
  }),
  
  rest.post('*/rest/v1/lost_pets', (req, res, ctx) => {
    const lostPet = {
      id: 'lost-pet-1',
      pet_id: 'pet-1',
      reported_by: 'user-1',
      status: 'lost',
      created_at: new Date().toISOString(),
      ...req.body,
    };
    testDb.lostPets = testDb.lostPets || [];
    testDb.lostPets.push(lostPet);
    return res(ctx.json(lostPet));
  }),
  
  rest.get('*/rest/v1/lost_pets', (req, res, ctx) => {
    return res(ctx.json(testDb.lostPets || []));
  }),
  
  rest.post('*/functions/v1/lost-pet-alerts', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        lost_pet_id: 'lost-pet-1',
        alerts_sent: 5,
        message: 'Lost pet report created and alerts sent to nearby users',
      })
    );
  }),
];

// Mock Expo push notification API
const expoHandlers = [
  rest.post('https://exp.host/--/api/v2/push/send', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            status: 'ok',
            id: 'test-notification-id',
          },
        ],
      })
    );
  }),
];

// Setup MSW server
export const server = setupServer(...supabaseHandlers, ...expoHandlers);

// Global setup for integration tests
beforeAll(async () => {
  server.listen({ onUnhandledRequest: 'warn' });
  
  // Clear AsyncStorage
  await AsyncStorage.clear();
  
  // Reset test database
  testDb = {};
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Test utilities for integration tests
export const IntegrationTestUtils = {
  // Simulate user login
  async loginUser(userData = {}) {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      subscription_status: 'premium',
      ...userData,
    };
    
    await AsyncStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      user,
    }));
    
    return user;
  },
  
  // Create test pet
  createTestPet(petData = {}) {
    const pet = {
      id: 'pet-1',
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      created_by: 'user-1',
      status: 'safe',
      ...petData,
    };
    
    testDb.pets = testDb.pets || [];
    testDb.pets.push(pet);
    return pet;
  },
  
  // Clear test database
  clearTestDb() {
    testDb = {};
  },
  
  // Get test database state
  getTestDb() {
    return testDb;
  },
  
  // Simulate location permission granted
  grantLocationPermissions() {
    jest.mocked(require('react-native').PermissionsAndroid.request)
      .mockResolvedValueOnce('granted');
  },
  
  // Simulate notification permissions
  grantNotificationPermissions() {
    const { requestPermissionsAsync } = require('expo-notifications');
    jest.mocked(requestPermissionsAsync).mockResolvedValueOnce({
      status: 'granted',
      canAskAgain: true,
      granted: true,
    });
  },
};

// Export for use in tests
export { testDb };