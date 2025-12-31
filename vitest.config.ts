import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx,js,mjs}', 'src/**/__tests__/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 15000,
    maxWorkers: 1,
    minWorkers: 1,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        isolate: true,
      },
    },
    exclude: ['backend/**', 'doc/**', 'node_modules/**'],
    coverage: {
      enabled: true, // Alinhar com npm test --coverage
      reportOnFailure: true,
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: [
        'components/**/*.{ts,tsx}',
        'services/**/*.{ts,tsx}',
        'src/**/*.{ts,tsx}',
        'App.tsx',
        'types.ts',
        'firebaseConfig.ts',
      ],
      thresholds: {
        // Padrão do projeto: manter cobertura >45%
        lines: 45,
        statements: 45,
        functions: 45,
        branches: 40,
      },
      // Excluir caminhos não produtivos para refletir melhor o código da app
      exclude: [
        'backend/**',
        'doc/**',
        'coverage/**',
        'scripts/**',
        'node_modules/**',
        '**/*.d.ts',
        'index.html',
        'tests/**',
        '**/*.test.*',
        'coverage/**/*.js',
        'services/errorMessages.ts',
      ],
    },
  },
});
