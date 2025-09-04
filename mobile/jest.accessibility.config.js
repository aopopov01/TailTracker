module.exports = {
  preset: 'jest-expo',
  displayName: 'Accessibility Tests',
  testMatch: [
    '**/__tests__/**/*accessibility.(test|spec).(ts|tsx|js)',
    '**/*accessibility.(test|spec).(ts|tsx|js)',
    '**/__tests__/**/*a11y.(test|spec).(ts|tsx|js)',
    '**/*a11y.(test|spec).(ts|tsx|js)'
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect'
  ],
  testTimeout: 20000,
  coverageDirectory: '<rootDir>/coverage/accessibility',
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase|zustand|react-hook-form)"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1"
  }
};