// Global Cypress setup for E2E stability
// Intercept endpoints not required for E2E to avoid flakiness in offline/preview mode
/* eslint-disable no-undef */

beforeEach(() => {
  // Mock AI tip endpoint to avoid ECONNREFUSED
  cy.intercept('GET', '/api/generate-tip*', {
    statusCode: 200,
    body: { tip: 'Dica simulada: descreva o problema e, se puder, adicione fotos.' },
    headers: { 'content-type': 'application/json' },
  }).as('mockGenerateTip');

  // Mock Gemini AI enhancement endpoint for wizard
  cy.intercept('POST', '**/enhance-job-request', {
    statusCode: 200,
    body: {
      enhancedDescription: 'Conserto de vazamento na pia da cozinha com troca de vedação',
      suggestedCategory: 'encanador',
      suggestedServiceType: 'personalizado',
      estimatedCost: { min: 100, max: 300 }
    },
    headers: { 'content-type': 'application/json' },
  }).as('mockEnhanceJob');

  // Mock Firebase Auth - simulate successful login
  cy.window().then((win) => {
    // Stub Firebase auth methods
    if (win.firebase?.auth) {
      cy.stub(win.firebase.auth(), 'signInWithEmailAndPassword').resolves({
        user: {
          uid: 'test-client-123',
          email: 'cliente-teste@example.com',
          getIdToken: () => Promise.resolve('fake-token-123')
        }
      });
    }
  });

  // Mock backend user fetch after login
  cy.intercept('GET', '**/api/users/*', {
    statusCode: 200,
    body: {
      email: 'cliente-teste@example.com',
      name: 'Cliente Teste',
      type: 'cliente',
      phone: '11999999999'
    }
  }).as('mockUserFetch');

  // Mock job creation
  cy.intercept('POST', '**/api/jobs', {
    statusCode: 201,
    body: {
      id: 'job-test-123',
      clientEmail: 'cliente-teste@example.com',
      category: 'encanador',
      status: 'aberto'
    }
  }).as('mockJobCreate');
});
