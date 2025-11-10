import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
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
