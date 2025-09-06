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

// Basic React Native mocks
jest.mock('react-native', () => ({
  Platform: { OS: 'android', select: jest.fn(obj => obj.android) },
  Alert: { alert: jest.fn() },
  Dimensions: { get: jest.fn(() => ({ width: 375, height: 667 })) }
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: [], error: null })) })),
      insert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: {}, error: null })) }))
    }))
  }))
}));