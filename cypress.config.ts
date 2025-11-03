import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173', // A URL do seu app de desenvolvimento
    setupNodeEvents(on, config) {},
  },
});