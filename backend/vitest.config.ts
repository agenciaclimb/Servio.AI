import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.{js,ts,tsx}', 'src/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: [
      ...configDefaults.exclude,
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'src/index.test.js',
    ],
    coverage: {
      enabled: true,
      reportOnFailure: true,
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
    },
    setupFiles: ['./tests/setup.js'],
    server: {
      deps: {
        inline: ['firebase-admin', 'firebase-functions', '@google-cloud/secret-manager'],
      },
    },
  },
  resolve: {
    alias: {
      'firebase-functions': path.resolve(__dirname, './tests/mocks/firebase-functions.js'),
      '@google-cloud/secret-manager': path.resolve(__dirname, './tests/mocks/secret-manager.js'),
      'firebase-admin': path.resolve(__dirname, './tests/mocks/firebase-admin.js'),
    },
  },
  css: {
    // Provide inline PostCSS config to avoid file loading/parsing
    postcss: {
      plugins: [],
    },
  },
});
