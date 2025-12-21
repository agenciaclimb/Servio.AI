import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig, configDefaults } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    // IMPORTANTE: no backend existem serviços duplicados em .js e .ts.
    // Para testes TypeScript, queremos resolver primeiro para .ts (senão o Vite
    // pega o .js e quebra o shape esperado nos testes).
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    // O backend (Cloud Run) não depende de firebase-functions, mas alguns serviços TS
    // usam o logger de lá. Para testes, mapeamos para um stub local.
    alias: {
      'firebase-functions': path.resolve(__dirname, 'tests/stubs/firebase-functions.ts'),
    },
  },
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
  },
  css: {
    // Provide inline PostCSS config to avoid file loading/parsing
    postcss: {
      plugins: [],
    },
  },
});
