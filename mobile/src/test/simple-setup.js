// Basic Jest setup without Object.defineProperty issues
import '@testing-library/jest-native/extend-expect';

// Simple mocks
global.fetch = jest.fn();

// Mock console to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock basic React Native components
jest.mock('react-native', () => ({
  Platform: { OS: 'android', select: jest.fn() },
  Dimensions: { get: jest.fn(() => ({ width: 375, height: 667 })) },
  StyleSheet: { create: jest.fn(styles => styles) },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Alert: { alert: jest.fn() },
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));