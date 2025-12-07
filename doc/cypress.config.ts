import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', // A porta do seu dev server Vite
    supportFile: false,
  },
});
