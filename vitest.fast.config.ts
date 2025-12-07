import baseConfig from './vitest.config';
import { mergeConfig, defineConfig } from 'vitest/config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        provider: 'istanbul',
        reporter: ['text'],
        include: [
          'components/ClientDashboard.tsx',
          'components/AdminDashboard*.tsx',
          'components/ProspectorDashboard.tsx',
        ],
      },
    },
  })
);
