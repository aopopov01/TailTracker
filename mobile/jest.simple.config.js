module.exports = {
  preset: '@testing-library/react-native',
  setupFilesAfterEnv: ['<rootDir>/src/test/simple-setup.js'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|expo|@expo|@unimodules|unimodules))',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
  ],
  testEnvironment: 'jsdom',
};