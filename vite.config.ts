import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy de desenvolvimento: direciona chamadas /api para o backend
          // Configure VITE_BACKEND_URL no .env.local para apontar ao Cloud Run quando necessário
          '/api': {
            target: env.VITE_BACKEND_URL || 'http://localhost:8081',
            changeOrigin: true,
            // Se o backend não usa prefixo /api, ajuste a regra abaixo
            // rewrite: (path) => path.replace(/^\/api/, '')
          },
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
