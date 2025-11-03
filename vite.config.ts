import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
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
        target: 'es2020', // Modernizar JavaScript (evita transpilação desnecessária)
        cssMinify: true, // CSS minification padrão (esbuild)
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
              'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
            },
            // Cache-friendly file names (hash estável para vendors)
            chunkFileNames: (chunkInfo) => {
              const name = chunkInfo.name;
              if (name.startsWith('vendor-')) {
                return 'assets/[name].[hash].js';
              }
              return 'assets/[name]-[hash].js';
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            passes: 2, // Minify mais agressivo
            pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove console calls
          },
          mangle: {
            safari10: true, // Compatibilidade Safari
          },
          format: {
            comments: false, // Remove comentários
          }
        }
      }
    };
});
