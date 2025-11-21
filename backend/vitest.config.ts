import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      'tests/**/*.{test,spec}.{js,ts,tsx}',
      'src/**/*.{test,spec}.{js,ts,tsx}'
    ],
    exclude: [
      ...configDefaults.exclude,
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'src/index.test.js',
      'tests/ai.test.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
    },
  },
  css: {
    // Provide inline PostCSS config to avoid file loading/parsing
    postcss: {
      plugins: [],
    },
  },
});
