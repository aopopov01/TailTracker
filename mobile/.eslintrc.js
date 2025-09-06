module.exports = {
  extends: ['expo'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    es2021: true,
    node: true
  },
  rules: {
    // Disable memory-intensive rules
    '@typescript-eslint/no-unused-vars': 'off',
    'import/no-unresolved': 'off',
    'react/jsx-no-undef': 'off',
    'no-undef': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react/jsx-no-duplicate-props': 'off',
    '@typescript-eslint/no-dupe-class-members': 'off',
    'import/namespace': 'off',
    // Minimal rules for performance
    'no-console': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off',
    'import/order': 'off'
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
};