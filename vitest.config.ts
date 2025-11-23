import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.{ts,tsx,js,mjs}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 20000,
    hookTimeout: 10000,
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
        'firebaseConfig.ts'
      ],
      thresholds: {
        lines: 45,
        statements: 45,
        functions: 25,
        branches: 40,
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
      ],
    },
  }
})
