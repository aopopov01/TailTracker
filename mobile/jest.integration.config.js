module.exports = {
  preset: 'jest-expo',
  displayName: 'Integration Tests',
  testMatch: [
    '**/src/**/*.integration.(test|spec).(ts|tsx|js)',
    '**/integration/**/*.(test|spec).(ts|tsx|js)'
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test/setup.ts',
    '<rootDir>/src/test/integration-setup.ts'
  ],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/services/**/*.{ts,tsx}',
    'src/api/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*'
  ],
  coverageDirectory: 'coverage/integration',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  testEnvironment: 'node'
};