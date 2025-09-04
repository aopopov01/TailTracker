const baseConfig = require('./package.json').jest;

module.exports = {
  ...baseConfig,
  displayName: 'Performance Tests',
  testMatch: [
    '**/__tests__/**/*performance.(test|spec).(ts|tsx|js)',
    '**/*performance.(test|spec).(ts|tsx|js)'
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test/setup.ts',
    '<rootDir>/src/test/performance-setup.ts'
  ],
  testTimeout: 60000,
  coverageDirectory: '<rootDir>/coverage/performance',
  collectCoverage: false, // Performance tests don't need coverage
  verbose: true,
  reporters: [
    'default',
    ['<rootDir>/src/test/reporters/performance-reporter.js', {}]
  ]
};