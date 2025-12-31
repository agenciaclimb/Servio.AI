/* eslint-disable no-undef */
// Custom Cypress Commands for Servio.AI E2E Tests
// Provides robust authentication mocking without Firebase dependency

/**
 * cy.mockLogin() - Simula login injetando user no AppContext
 * @param {string} userType - 'client' | 'provider' | 'admin'
 * @param {object} overrides - Propriedades customizadas do usuário
 *
 * Estratégia:
 * 1. Mocka Firebase auth com usuário fake
 * 2. Intercept GET /api/users/* para retornar perfil
 * 3. Injeta currentUser no localStorage para persistência
 * 4. Força reload do AppContext
 */
Cypress.Commands.add('mockLogin', (userType = 'client', overrides = {}) => {
  const userProfiles = {
    client: {
      uid: 'test-client-abc',
      email: 'cliente-teste@servio.ai',
      displayName: 'João Silva',
      type: 'cliente',
      phone: '11987654321',
      verificationStatus: 'verificado',
      createdAt: '2025-01-01',
      ...overrides,
    },
    provider: {
      uid: 'test-provider-def',
      email: 'provider-teste@servio.ai',
      displayName: 'Carlos Ferreira',
      type: 'prestador',
      phone: '11912345678',
      verificationStatus: 'verificado',
      serviceCatalog: ['encanador', 'eletricista'],
      rating: 4.8,
      createdAt: '2025-01-01',
      ...overrides,
    },
    admin: {
      uid: 'test-admin-master',
      email: 'admin@servio.ai',
      displayName: 'Admin Master',
      type: 'admin',
      phone: '11999999999',
      verificationStatus: 'verificado',
      createdAt: '2025-01-01',
      ...overrides,
    },
  };

  const user = userProfiles[userType];

  // Mock Firebase Auth state
  cy.window().then(win => {
    // Injeta mock do Firebase auth no window
    win.mockFirebaseUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      getIdToken: cy.stub().resolves('fake-jwt-token-' + user.uid),
    };

    // Injeta user no localStorage para AppContext
    win.localStorage.setItem('servio_current_user', JSON.stringify(user));
    win.localStorage.setItem('servio_auth_token', 'fake-jwt-token-' + user.uid);
  });

  // Intercept user profile fetch
  cy.intercept('GET', `**/api/users/${user.email}`, {
    statusCode: 200,
    body: user,
  }).as('getUserProfile');

  // Intercept user profile fetch by UID (alternativa)
  cy.intercept('GET', `**/api/users/*`, req => {
    req.reply({
      statusCode: 200,
      body: user,
    });
  }).as('getUserById');

  cy.log(`✅ Mock login: ${userType} (${user.email})`);
});

/**
 * cy.mockFirestore() - Mocka queries Firestore para testes sem backend
 * @param {string} collection - Nome da collection
 * @param {object} data - Dados mockados
 */
Cypress.Commands.add('mockFirestore', (collection, data) => {
  cy.intercept('GET', `**/firestore/${collection}*`, {
    statusCode: 200,
    body: data,
  }).as(`mockFirestore_${collection}`);

  cy.log(`✅ Mock Firestore: ${collection}`);
});

/**
 * cy.mockStripeSession() - Mocka criação de sessão Stripe
 */
Cypress.Commands.add('mockStripeSession', (sessionId = 'cs_test_123') => {
  cy.intercept('POST', '**/api/stripe/create-checkout-session', {
    statusCode: 200,
    body: {
      sessionId: sessionId,
      url: 'https://checkout.stripe.com/pay/' + sessionId,
    },
  }).as('createStripeSession');

  cy.log(`✅ Mock Stripe session: ${sessionId}`);
});

/**
 * cy.mockJobData() - Mocka dados de jobs para testes
 */
Cypress.Commands.add('mockJobData', (jobs = []) => {
  const defaultJob = {
    id: 'job-test-001',
    clientEmail: 'cliente-teste@servio.ai',
    title: 'Conserto de vazamento',
    description: 'Vazamento na pia da cozinha',
    category: 'encanador',
    status: 'aberto',
    urgency: 'normal',
    createdAt: '2025-11-10T10:00:00Z',
  };

  const mockJobs = jobs.length > 0 ? jobs : [defaultJob];

  cy.intercept('GET', '**/api/jobs*', {
    statusCode: 200,
    body: mockJobs,
  }).as('getJobs');

  cy.intercept('POST', '**/api/jobs', req => {
    req.reply({
      statusCode: 201,
      body: { ...defaultJob, ...req.body, id: 'job-test-' + Date.now() },
    });
  }).as('createJob');

  cy.log(`✅ Mock ${mockJobs.length} jobs`);
});

/**
 * cy.mockProposalData() - Mocka propostas para testes
 */
Cypress.Commands.add('mockProposalData', (proposals = []) => {
  cy.intercept('GET', '**/api/proposals*', {
    statusCode: 200,
    body: proposals,
  }).as('getProposals');

  cy.intercept('POST', '**/api/proposals', req => {
    req.reply({
      statusCode: 201,
      body: { ...req.body, id: 'prop-test-' + Date.now() },
    });
  }).as('createProposal');

  cy.log(`✅ Mock ${proposals.length} proposals`);
});

/**
 * cy.mockDisputeData() - Mocka disputas para testes
 */
Cypress.Commands.add('mockDisputeData', (disputes = []) => {
  cy.intercept('GET', '**/api/disputes*', {
    statusCode: 200,
    body: disputes,
  }).as('getDisputes');

  cy.intercept('POST', '**/api/disputes', req => {
    req.reply({
      statusCode: 201,
      body: {
        ...req.body,
        id: 'disp-test-' + Date.now(),
        status: 'aberta',
        createdAt: new Date().toISOString(),
      },
    });
  }).as('createDispute');

  cy.log(`✅ Mock ${disputes.length} disputes`);
});

/**
 * cy.waitForApp() - Aguarda app carregar completamente
 */
Cypress.Commands.add('waitForApp', () => {
  cy.get('body', { timeout: 10000 }).should('be.visible');
  cy.get('[data-testid="loading-spinner"]', { timeout: 5000 }).should('not.exist');
  cy.log('✅ App carregado');
});

// Export para TypeScript definitions
export {};
