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
  ignorePatterns: ['dist', 'node_modules', 'doc/**', 'backend/**', 'e2e/**', 'tests/**', 'App.tsx'],
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
    // Temporariamente não bloquear console para não gerar warnings no CI
    // Reativar como 'warn' após estabilização
    'no-console': 'off',
  },
};
