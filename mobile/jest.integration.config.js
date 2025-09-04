const baseConfig = require('./package.json').jest;

module.exports = {
  ...baseConfig,
  displayName: 'Integration Tests',
  testMatch: [
    '**/__tests__/**/*integration.(test|spec).(ts|tsx|js)',
    '**/*integration.(test|spec).(ts|tsx|js)'
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test/setup.ts',
    '<rootDir>/src/test/integration-setup.ts'
  ],
  testTimeout: 30000,
  coverageDirectory: '<rootDir>/coverage/integration',
  globalSetup: '<rootDir>/src/test/global-setup.js',
  globalTeardown: '<rootDir>/src/test/global-teardown.js',
};