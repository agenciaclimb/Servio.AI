/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Comando customizado para fazer login como cliente ou prestador.
       * @example cy.login('cliente')
       */
      login(userType: 'cliente' | 'prestador'): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (userType: 'cliente' | 'prestador') => {
  cy.visit('/login');

  const email = userType === 'cliente' ? 'cliente@servio.ai' : 'prestador@servio.ai';
  const password = '123456'; // Senha padrão para usuários de teste

  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.contains('button', 'Entrar').click();
});