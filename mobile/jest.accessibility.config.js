module.exports = {
  preset: 'jest-expo',
  displayName: 'Accessibility Tests',
  testMatch: [
    '**/src/**/*.accessibility.(test|spec).(ts|tsx|js)',
    '**/accessibility/**/*.(test|spec).(ts|tsx|js)'
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test/setup.ts',
    '<rootDir>/src/test/accessibility-setup.ts'
  ],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    'src/screens/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*'
  ],
  coverageDirectory: 'coverage/accessibility',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/accessibility',
      filename: 'accessibility-report.html'
    }]
  ]
};