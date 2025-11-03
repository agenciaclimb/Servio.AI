describe('Jornada Completa do Cliente', () => {
  beforeEach(() => {
    // Intercepta a chamada para a lista de jobs para garantir que o dashboard carregue
    cy.intercept('GET', '**/jobs', { fixture: 'jobs.json' }).as('getJobs');
    cy.intercept('GET', '**/users/cliente@servio.ai', { fixture: 'client_user.json' }).as('getClientUser');
  });

  it('deve permitir que um cliente faça login, crie um job e o veja no dashboard', () => {
    // 1. Visitar a página de login
    cy.visit('/login');

    // 2. Fazer login como cliente
    cy.get('input[name="email"]').type('cliente@servio.ai');
    cy.get('input[name="password"]').type('123456');
    cy.contains('button', 'Entrar').click();

    // 3. Aguardar o redirecionamento e o carregamento do dashboard
    cy.wait('@getJobs');
    cy.url().should('include', '/dashboard');
    cy.contains('h1', 'Bem-vinda, Cliente').should('be.visible');

    // 4. Abrir o wizard para criar um novo serviço
    cy.contains('button', 'Solicitar Novo Serviço').click();

    // 5. Preencher o wizard e publicar o job (cenário simplificado)
    cy.get('textarea').type('Preciso de um eletricista para instalar um novo chuveiro.');
    cy.contains('button', 'Analisar com IA').click();
    cy.contains('button', 'Publicar Job').click();

    // 6. Verificar se o novo job aparece no dashboard (aqui precisaríamos interceptar a nova chamada de jobs)
    cy.contains('h2', 'Meus Serviços').should('be.visible');
    // Adicionar asserção para o novo job aqui
  });
});