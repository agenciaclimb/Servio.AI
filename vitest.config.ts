import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
      enabled: true,
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
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 75,
      },
      // Exclude non-production and helper paths from coverage to better reflect app code
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
        'services/errorMessages.ts', // Utility file - messages catalog
      ],
    },
  },
});
