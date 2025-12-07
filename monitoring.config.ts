// Error Tracking & Monitoring Configuration
// Instruções: Configurar Sentry ou LogRocket para produção

export const errorTracking = {
  // Sentry (recomendado)
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment: import.meta.env.MODE || 'development',
    tracesSampleRate: 0.1, // 10% das transações
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  },

  // Google Analytics 4
  ga4: {
    measurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID || '',
  },

  // Configurar em .env.local:
  // VITE_SENTRY_DSN=https://...@sentry.io/...
  // VITE_GA4_MEASUREMENT_ID=G-...
};

// Como adicionar Sentry:
// npm install @sentry/react
// Inicializar em main.tsx:
// import * as Sentry from '@sentry/react';
// Sentry.init({ dsn: errorTracking.sentry.dsn, ... });
