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
      },
      build: {
        sourcemap: true, // Habilitar sourcemaps para debugging
        minify: 'terser', // Usar terser para minificação mais agressiva
        terserOptions: {
          compress: {
            drop_console: true, // Remover console.log em produção
            drop_debugger: true,
          },
        },
        rollupOptions: {
          output: {
            manualChunks: {
              // Separar vendor chunks grandes para melhor caching
              'react-vendor': ['react', 'react-dom'],
              'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/messaging'],
            }
          }
        },
        chunkSizeWarningLimit: 600, // Aumentar limite para evitar warnings de chunks legítimos
      }
    };
});
