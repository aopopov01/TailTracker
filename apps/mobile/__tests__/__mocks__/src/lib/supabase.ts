// Manual mock for src/lib/supabase.ts to handle re-export structure
// Simplified version focused on making PetService tests work

// Create shared mock functions
const mockAuth = {
  getUser: jest.fn().mockResolvedValue({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    },
    error: null,
  }),
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  })),
};

// Mock functions that can be controlled from tests
const mockSingle = jest.fn().mockResolvedValue({
  data: null,
  error: null,
});

const mockChainableEnd = jest.fn().mockResolvedValue({
  data: [],
  error: null,
});

// Add this for proper chainable promise resolution
const mockChainableResponse = jest.fn().mockResolvedValue({
  data: [],
  error: null,
});

// Create a simple chainable mock that resolves correctly
const createChainableMock = () => {
  const chainable = {
    // All database query methods return the chainable
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gt: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    in: jest.fn(),
    is: jest.fn(),
    filter: jest.fn(),
    match: jest.fn(),
    contains: jest.fn(),
    containedBy: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    range: jest.fn(),
    or: jest.fn(),
    and: jest.fn(),
    not: jest.fn(),

    // Terminal methods
    single: mockSingle,
    maybeSingle: jest.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
  };

  // Make all non-terminal methods return the chainable
  const terminalMethods = ['single', 'maybeSingle'];
  Object.keys(chainable).forEach(key => {
    if (!terminalMethods.includes(key)) {
      (chainable as any)[key] = jest.fn().mockReturnValue(chainable);
    }
  });

  // Add promise resolution for non-single queries
  // This is the key - make the chainable itself a thenable
  (chainable as any).then = jest.fn(onResolve => {
    return mockChainableResponse().then(onResolve);
  });

  (chainable as any).catch = jest.fn(onReject => {
    return mockChainableResponse();
  });

  return chainable;
};

// Main Supabase client mock
const mockSupabaseClient = {
  auth: mockAuth,
  from: jest.fn().mockImplementation(() => createChainableMock()),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      }),
      download: jest.fn().mockResolvedValue({
        data: new Blob(),
        error: null,
      }),
      remove: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://test-url.com' },
      }),
    }),
  },
  rpc: jest.fn().mockResolvedValue({
    data: 'new-pet-id',
    error: null,
  }),
};

const mockSupabaseHelpers = {
  uploadPetPhoto: jest.fn().mockResolvedValue('https://test-photo-url.com'),
  deletePetPhoto: jest.fn().mockResolvedValue(true),
};

// Export the mocks
export const supabase = mockSupabaseClient;
export const supabaseHelpers = mockSupabaseHelpers;
export default mockSupabaseClient;

// Make mocks available globally for test access
(global as any).__MOCK_SUPABASE__ = mockSupabaseClient;
(global as any).__MOCK_SUPABASE_HELPERS__ = mockSupabaseHelpers;
(global as any).__MOCK_SUPABASE_SHARED__ = {
  getUser: mockAuth.getUser,
  single: mockSingle,
  chainableEnd: mockChainableEnd,
  chainableResponse: mockChainableResponse,
  from: mockSupabaseClient.from,
  auth: mockAuth,
};
