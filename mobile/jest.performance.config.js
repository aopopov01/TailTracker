module.exports = {
  preset: 'jest-expo',
  displayName: 'Performance Tests',
  testMatch: [
    '**/src/**/*.performance.(test|spec).(ts|tsx|js)',
    '**/performance/**/*.(test|spec).(ts|tsx|js)'
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test/setup.ts',
    '<rootDir>/src/test/performance-setup.ts'
  ],
  testTimeout: 60000,
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    'src/screens/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*'
  ],
  coverageDirectory: 'coverage/performance',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/performance',
      filename: 'performance-report.html'
    }]
  ]
};