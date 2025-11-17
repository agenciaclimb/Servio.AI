module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {},
  ignorePatterns: ['dist', 'node_modules', 'doc/**', 'backend/**'],
  rules: {
    'react/react-in-jsx-scope': 'off', // React 18+ não precisa
    '@typescript-eslint/no-explicit-any': 'warn', // Permitir mas avisar
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-case-declarations': 'warn',
    'prefer-const': 'warn',
    'react-hooks/exhaustive-deps': 'warn', // CRÍTICO para React
    'no-console': ['warn', { allow: ['warn', 'error'] }], // Bloquear console.log em prod
  },
};
