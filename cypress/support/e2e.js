// Global Cypress setup for E2E stability
// Intercept endpoints not required for E2E to avoid flakiness in offline/preview mode
/* eslint-disable no-undef */

// Import custom commands
import './commands.js';

beforeEach(() => {
  // Mock AI tip endpoint to avoid ECONNREFUSED
  cy.intercept('GET', '**/api/generate-tip*', {
    statusCode: 200,
    body: { tip: 'Dica simulada: descreva o problema e, se puder, adicione fotos.' },
    headers: { 'content-type': 'application/json' },
  }).as('mockGenerateTip');

  // Mock Gemini AI enhancement endpoint for wizard
  cy.intercept('POST', '**/api/enhance-job-request', {
    statusCode: 200,
    body: {
      enhancedDescription: 'Conserto de vazamento na pia da cozinha com troca de vedação',
      suggestedCategory: 'encanador',
      suggestedServiceType: 'personalizado',
      estimatedCost: { min: 100, max: 300 }
    },
    headers: { 'content-type': 'application/json' },
  }).as('mockEnhanceJob');

  // Mock match-providers endpoint (usado pelo wizard)
  cy.intercept('POST', '**/api/match-providers', {
    statusCode: 200,
    body: {
      matches: [],
      message: 'Nenhum prestador encontrado no momento'
    }
  }).as('mockMatchProviders');
});
