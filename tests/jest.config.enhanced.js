// Enhanced Jest Configuration for TailTracker
// This configuration extends the base Jest setup with additional testing capabilities

// eslint-disable-next-line @typescript-eslint/no-var-requires
const baseConfig = require('../package.json').jest;

module.exports = {
  ...baseConfig,

  // Test environment setup
  testEnvironment: 'jsdom',
  testTimeout: 15000, // Increased timeout for complex tests

  // Enhanced test patterns
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
    '**/*.integration.(ts|tsx|js)',
    '**/*.e2e.(ts|tsx|js)',
  ],

  // Coverage configuration for zero-defect quality
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.config.{ts,js}',
    '!src/**/index.{ts,tsx}',
    // Exclude generated files
    '!src/types/api-generated.ts',
    '!src/constants/app-store-generated.ts',
  ],

  // Strict coverage thresholds for critical areas
  coverageThreshold: {
    global: {
      branches: 92,
      functions: 92,
      lines: 92,
      statements: 92,
    },
    // Critical business logic requires 98% coverage
    './src/services/payment/': {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
    './src/services/location/': {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
    './src/services/auth/': {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
    // Hooks and utilities require 95% coverage
    './src/hooks/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './src/utils/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Enhanced coverage reporting
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json-summary',
    'clover', // For CI integration
    'cobertura', // For Azure DevOps/Jenkins
  ],

  // Performance optimization
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // Enhanced setup files
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test/setup.ts',
    '<rootDir>/src/test/setup-extended.ts', // Additional setup for enhanced testing
    '<rootDir>/src/test/mocks/global-mocks.ts', // Global mocks
  ],

  // Module name mapping for better test isolation
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Mock external modules that cause issues in tests
    '^react-native-purchases$':
      '<rootDir>/src/test/mocks/react-native-purchases.js',
    '^@react-native-community/netinfo$': '<rootDir>/src/test/mocks/netinfo.js',
    '^expo-location$': '<rootDir>/src/test/mocks/expo-location.js',
    '^expo-camera$': '<rootDir>/src/test/mocks/expo-camera.js',
    '^expo-image-picker$': '<rootDir>/src/test/mocks/expo-image-picker.js',
    '^@supabase/supabase-js$': '<rootDir>/src/test/mocks/supabase.js',
    // Test data and fixtures
    '^@test/(.*)$': '<rootDir>/src/test/$1',
    '^@fixtures/(.*)$': '<rootDir>/src/test/fixtures/$1',
    '^@mocks/(.*)$': '<rootDir>/src/test/mocks/$1',
  },

  // Transform ignore patterns for React Native
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase|zustand|react-hook-form|react-native-purchases|@react-native-community|expo-.*)',
  ],

  // Test reporters for CI/CD
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'jest-results.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: './test-results',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'TailTracker Test Report',
      },
    ],
  ],

  // Global test configuration
  globals: {
    __DEV__: true,
    __TEST__: true,
  },

  // Project-specific test configurations
  projects: [
    // Unit tests
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.(ts|tsx)'],
      setupFilesAfterEnv: [
        '@testing-library/jest-native/extend-expect',
        '<rootDir>/src/test/setup.ts',
      ],
    },
    // Integration tests
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/*.integration.(ts|tsx)'],
      setupFilesAfterEnv: [
        '@testing-library/jest-native/extend-expect',
        '<rootDir>/src/test/setup.ts',
        '<rootDir>/src/test/integration-setup.ts',
      ],
      testTimeout: 30000,
    },
    // Component tests
    {
      displayName: 'component',
      testMatch: ['<rootDir>/src/components/**/*.test.(ts|tsx)'],
      setupFilesAfterEnv: [
        '@testing-library/jest-native/extend-expect',
        '<rootDir>/src/test/setup.ts',
        '<rootDir>/src/test/component-setup.ts',
      ],
    },
    // Service tests
    {
      displayName: 'service',
      testMatch: ['<rootDir>/src/services/**/*.test.(ts|tsx)'],
      setupFilesAfterEnv: [
        '@testing-library/jest-native/extend-expect',
        '<rootDir>/src/test/setup.ts',
        '<rootDir>/src/test/service-setup.ts',
      ],
    },
  ],

  // Verbose output for debugging
  verbose: true,

  // Fail fast on first test failure (for development)
  bail: process.env.NODE_ENV === 'development' ? 1 : false,

  // Watch mode configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
  ],
};
