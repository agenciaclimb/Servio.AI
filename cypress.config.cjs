const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4173',
    specPattern: 'doc/**/*.cy.{js,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    video: false,
    retries: { runMode: 1, openMode: 0 },
    defaultCommandTimeout: 8000,
  },
});
