import { jest } from '@jest/globals';

// Comprehensive Supabase Mock for Testing
class MockSupabaseClient {
  private mockData: { [key: string]: any[] } = {
    users: [],
    pets: [],
    lost_pets: [],
    notifications: [],
    subscriptions: [],
    payments: [],
  };

  private mockAuth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
  };

  private mockStorage = {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({
        data: { path: 'test/photo.jpg', fullPath: 'bucket/test/photo.jpg' },
        error: null,
      })),
      download: jest.fn(() => Promise.resolve({
        data: new Blob(['mock image data']),
        error: null,
      })),
      remove: jest.fn(() => Promise.resolve({ error: null })),
      getPublicUrl: jest.fn(() => ({
        data: { publicUrl: 'https://mock-storage.com/test/photo.jpg' },
      })),
    })),
  };

  constructor() {
    this.resetMockData();
    this.setupDefaultMocks();
  }

  // Auth methods
  get auth() {
    return this.mockAuth;
  }

  // Storage methods
  get storage() {
    return this.mockStorage;
  }

  // Database methods
  from(table: string) {
    return new MockQueryBuilder(table, this.mockData);
  }

  // RPC (Remote Procedure Call) methods
  rpc(functionName: string, params?: any) {
    return new MockRPCBuilder(functionName, params, this.mockData);
  }

  // Functions (Edge Functions)
  functions = {
    invoke: jest.fn((functionName: string, options?: any) => {
      return this.mockFunctionInvoke(functionName, options);
    }),
  };

  // Realtime subscriptions
  channel(channelName: string) {
    return new MockRealtimeChannel(channelName);
  }

  // Reset all mock data
  resetMockData() {
    this.mockData = {
      users: [
        {
          id: 'user-1',
          email: 'test@example.com',
          subscription_status: 'premium',
          push_token: 'ExponentPushToken[test]',
          created_at: '2023-01-01T00:00:00.000Z',
        },
        {
          id: 'user-2',
          email: 'free@example.com',
          subscription_status: 'free',
          push_token: null,
          created_at: '2023-01-01T00:00:00.000Z',
        },
      ],
      pets: [
        {
          id: 'pet-1',
          name: 'Buddy',
          species: 'dog',
          breed: 'Golden Retriever',
          created_by: 'user-1',
          status: 'safe',
          photo_url: 'https://example.com/buddy.jpg',
          created_at: '2023-01-01T00:00:00.000Z',
        },
      ],
      lost_pets: [],
      notifications: [],
      subscriptions: [
        {
          id: 'sub-1',
          user_id: 'user-1',
          status: 'active',
          plan: 'premium',
          stripe_customer_id: 'cus_test123',
          created_at: '2023-01-01T00:00:00.000Z',
        },
      ],
      payments: [],
    };
  }

  // Set up default mock responses
  private setupDefaultMocks() {
    // Auth mocks
    this.mockAuth.signUp.mockResolvedValue({
      data: { user: this.mockData.users[0], session: null },
      error: null,
    });

    this.mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: this.mockData.users[0], session: { access_token: 'mock-token' } },
      error: null,
    });

    this.mockAuth.signOut.mockResolvedValue({ error: null });

    this.mockAuth.getUser.mockResolvedValue({
      data: { user: this.mockData.users[0] },
      error: null,
    });

    this.mockAuth.getSession.mockResolvedValue({
      data: { session: { access_token: 'mock-token', user: this.mockData.users[0] } },
      error: null,
    });

    this.mockAuth.onAuthStateChange.mockImplementation((callback) => {
      // Simulate auth state change
      setTimeout(() => {
        callback('SIGNED_IN', { access_token: 'mock-token', user: this.mockData.users[0] });
      }, 100);
      
      return {
        data: { subscription: { unsubscribe: jest.fn() } },
      };
    });
  }

  // Mock function invocations
  private async mockFunctionInvoke(functionName: string, options?: any) {
    const { body } = options || {};
    
    switch (functionName) {
      case 'lost-pet-alerts':
        return this.mockLostPetAlertsFunction(body);
      
      case 'user-profile':
        return this.mockUserProfileFunction(body);
      
      case 'stripe-webhook':
        return this.mockStripeWebhookFunction(body);
      
      default:
        return {
          data: { success: true, message: `Mock response for ${functionName}` },
          error: null,
        };
    }
  }

  private async mockLostPetAlertsFunction(body: any) {
    const { action, data } = body || {};
    
    switch (action) {
      case 'report_lost_pet':
        const lostPet = {
          id: `lost-pet-${Date.now()}`,
          pet_id: data.pet_id,
          reported_by: data.user_id,
          status: 'lost',
          last_seen_location: data.last_seen_location,
          description: data.description,
          reward_amount: data.reward_amount,
          contact_phone: data.contact_phone,
          created_at: new Date().toISOString(),
        };
        
        this.mockData.lost_pets.push(lostPet);
        
        return {
          data: {
            success: true,
            lost_pet_id: lostPet.id,
            alerts_sent: 5,
            message: 'Lost pet report created and alerts sent to nearby users',
          },
          error: null,
        };
      
      case 'mark_found':
        const lostPetIndex = this.mockData.lost_pets.findIndex(
          p => p.id === data.lost_pet_id
        );
        
        if (lostPetIndex !== -1) {
          this.mockData.lost_pets[lostPetIndex].status = 'found';
          this.mockData.lost_pets[lostPetIndex].found_date = new Date().toISOString();
          this.mockData.lost_pets[lostPetIndex].found_by = data.user_id;
        }
        
        return {
          data: {
            success: true,
            message: 'Pet has been marked as found!',
          },
          error: null,
        };
      
      case 'get_nearby_alerts':
        const nearbyAlerts = this.mockData.lost_pets.filter(p => p.status === 'lost');
        
        return {
          data: {
            success: true,
            alerts: nearbyAlerts,
            count: nearbyAlerts.length,
          },
          error: null,
        };
      
      default:
        return {
          data: null,
          error: { message: 'Invalid action' },
        };
    }
  }

  private async mockUserProfileFunction(body: any) {
    return {
      data: { success: true, user: this.mockData.users[0] },
      error: null,
    };
  }

  private async mockStripeWebhookFunction(body: any) {
    return {
      data: { success: true, processed: true },
      error: null,
    };
  }

  // Test utilities
  setMockUser(user: any) {
    this.mockData.users[0] = { ...this.mockData.users[0], ...user };
    this.mockAuth.getUser.mockResolvedValue({
      data: { user: this.mockData.users[0] },
      error: null,
    });
  }

  addMockPet(pet: any) {
    this.mockData.pets.push({ id: `pet-${Date.now()}`, ...pet });
  }

  addMockLostPet(lostPet: any) {
    this.mockData.lost_pets.push({ id: `lost-pet-${Date.now()}`, ...lostPet });
  }

  simulateAuthError(error: string) {
    this.mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: error },
    });
  }

  simulateNetworkError() {
    const networkError = new Error('Network request failed');
    Object.values(this.mockAuth).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockRejectedValue(networkError);
      }
    });
  }

  clearNetworkError() {
    this.setupDefaultMocks();
  }
}

// Mock Query Builder
class MockQueryBuilder {
  private table: string;
  private mockData: { [key: string]: any[] };
  private query: {
    select?: string;
    filters?: { field: string; operator: string; value: any }[];
    order?: { field: string; direction: string };
    limit?: number;
    single?: boolean;
  } = {};

  constructor(table: string, mockData: { [key: string]: any[] }) {
    this.table = table;
    this.mockData = mockData;
  }

  select(columns?: string) {
    this.query.select = columns || '*';
    return this;
  }

  eq(field: string, value: any) {
    this.query.filters = this.query.filters || [];
    this.query.filters.push({ field, operator: 'eq', value });
    return this;
  }

  neq(field: string, value: any) {
    this.query.filters = this.query.filters || [];
    this.query.filters.push({ field, operator: 'neq', value });
    return this;
  }

  gt(field: string, value: any) {
    this.query.filters = this.query.filters || [];
    this.query.filters.push({ field, operator: 'gt', value });
    return this;
  }

  lt(field: string, value: any) {
    this.query.filters = this.query.filters || [];
    this.query.filters.push({ field, operator: 'lt', value });
    return this;
  }

  in(field: string, values: any[]) {
    this.query.filters = this.query.filters || [];
    this.query.filters.push({ field, operator: 'in', value: values });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.query.order = {
      field,
      direction: options?.ascending === false ? 'desc' : 'asc',
    };
    return this;
  }

  limit(count: number) {
    this.query.limit = count;
    return this;
  }

  single() {
    this.query.single = true;
    return this;
  }

  async insert(data: any | any[]) {
    const items = Array.isArray(data) ? data : [data];
    const insertedItems = items.map(item => ({
      id: `${this.table}-${Date.now()}-${Math.random()}`,
      created_at: new Date().toISOString(),
      ...item,
    }));

    this.mockData[this.table] = this.mockData[this.table] || [];
    this.mockData[this.table].push(...insertedItems);

    return {
      data: Array.isArray(data) ? insertedItems : insertedItems[0],
      error: null,
    };
  }

  async update(data: any) {
    const tableData = this.mockData[this.table] || [];
    let updatedItems: any[] = [];

    if (this.query.filters) {
      updatedItems = tableData.filter(item => this.matchesFilters(item));
      updatedItems.forEach(item => {
        Object.assign(item, data, { updated_at: new Date().toISOString() });
      });
    }

    return {
      data: this.query.single ? updatedItems[0] : updatedItems,
      error: null,
    };
  }

  async delete() {
    const tableData = this.mockData[this.table] || [];
    
    if (this.query.filters) {
      const toDelete = tableData.filter(item => this.matchesFilters(item));
      this.mockData[this.table] = tableData.filter(item => !this.matchesFilters(item));
      
      return {
        data: toDelete,
        error: null,
      };
    }

    return { data: [], error: null };
  }

  // Execute the query
  then(resolve: (result: any) => void, reject?: (error: any) => void) {
    return this.execute().then(resolve, reject);
  }

  private async execute() {
    const tableData = this.mockData[this.table] || [];
    let results = [...tableData];

    // Apply filters
    if (this.query.filters) {
      results = results.filter(item => this.matchesFilters(item));
    }

    // Apply ordering
    if (this.query.order) {
      results.sort((a, b) => {
        const aVal = a[this.query.order!.field];
        const bVal = b[this.query.order!.field];
        
        if (this.query.order!.direction === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    // Apply limit
    if (this.query.limit) {
      results = results.slice(0, this.query.limit);
    }

    // Return single item if requested
    if (this.query.single) {
      return {
        data: results[0] || null,
        error: results.length === 0 ? { message: 'No rows found' } : null,
      };
    }

    return { data: results, error: null };
  }

  private matchesFilters(item: any): boolean {
    if (!this.query.filters) return true;

    return this.query.filters.every(filter => {
      const itemValue = item[filter.field];
      
      switch (filter.operator) {
        case 'eq':
          return itemValue === filter.value;
        case 'neq':
          return itemValue !== filter.value;
        case 'gt':
          return itemValue > filter.value;
        case 'lt':
          return itemValue < filter.value;
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(itemValue);
        default:
          return true;
      }
    });
  }
}

// Mock RPC Builder
class MockRPCBuilder {
  private functionName: string;
  private params: any;
  private mockData: { [key: string]: any[] };

  constructor(functionName: string, params: any, mockData: { [key: string]: any[] }) {
    this.functionName = functionName;
    this.params = params;
    this.mockData = mockData;
  }

  then(resolve: (result: any) => void, reject?: (error: any) => void) {
    return this.execute().then(resolve, reject);
  }

  private async execute() {
    switch (this.functionName) {
      case 'find_users_within_radius':
        return {
          data: [
            {
              id: 'nearby-user-1',
              push_token: 'ExponentPushToken[nearby1]',
              latitude: this.params.center_lat + 0.001,
              longitude: this.params.center_lng + 0.001,
              distance_km: 0.5,
            },
          ],
          error: null,
        };
      
      case 'get_lost_pets_within_radius':
        const nearbyPets = this.mockData.lost_pets.filter(pet => pet.status === 'lost');
        return {
          data: nearbyPets,
          error: null,
        };
      
      default:
        return {
          data: null,
          error: { message: `Unknown RPC function: ${this.functionName}` },
        };
    }
  }
}

// Mock Realtime Channel
class MockRealtimeChannel {
  private channelName: string;
  private subscriptions: { event: string; callback: Function }[] = [];

  constructor(channelName: string) {
    this.channelName = channelName;
  }

  on(event: string, callback: Function) {
    this.subscriptions.push({ event, callback });
    return this;
  }

  subscribe() {
    return Promise.resolve({ status: 'subscribed' });
  }

  unsubscribe() {
    return Promise.resolve({ status: 'unsubscribed' });
  }

  // Test utility to simulate events
  simulateEvent(event: string, payload: any) {
    const matchingSubscriptions = this.subscriptions.filter(sub => sub.event === event);
    matchingSubscriptions.forEach(sub => sub.callback(payload));
  }
}

// Export the mock client
export const createMockSupabaseClient = () => new MockSupabaseClient();
export { MockSupabaseClient };

// Default mock for jest.mock()
export default MockSupabaseClient;