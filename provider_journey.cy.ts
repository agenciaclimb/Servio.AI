describe('Jornada do Prestador - Envio de Proposta', () => {
  const jobId = 'job-open-for-proposal';

  beforeEach(() => {
    // Mock das chamadas de API para a jornada do prestador
    cy.intercept('GET', '**/users/prestador@servio.ai', { fixture: 'provider_user.json' }).as('getProviderUser');
    cy.intercept('GET', '**/jobs*', { fixture: 'open_jobs.json' }).as('getOpenJobs');
    cy.intercept('GET', `**/jobs/${jobId}`, { fixture: 'job_details.json' }).as('getJobDetails');
    cy.intercept('GET', `**/proposals?jobId=${jobId}`, { body: [] }).as('getProposals'); // Nenhuma proposta existente
    cy.intercept('GET', `**/jobs/${jobId}/messages`, { body: [] }).as('getMessages');

    // Mock para o assistente de IA
    cy.intercept('POST', '**/get-proposal-insights', { fixture: 'proposal_insights.json' }).as('getInsights');

    // Mock para a submissão da proposta
    cy.intercept('POST', '**/proposals', {
      statusCode: 201,
      body: { id: 'new-prop-123', message: 'Proposta enviada com sucesso' }
    }).as('submitProposal');
  });

  it('deve permitir que um prestador faça login, encontre um job, use o assistente de IA e envie uma proposta', () => {
    // 1. Login como prestador
    cy.visit('/login');
    cy.get('input[name="email"]').type('prestador@servio.ai');
    cy.get('input[name="password"]').type('123456');
    cy.contains('button', 'Entrar').click();
    cy.wait('@getProviderUser');
    cy.url().should('include', '/dashboard');

    // 2. Encontrar uma nova oportunidade no funil de negócios
    cy.contains('h2', 'Meu Funil de Negócios').should('be.visible');
    cy.wait('@getOpenJobs');
    cy.contains('h3', '🚀 Novas Oportunidades').parent().within(() => {
      cy.contains('p', 'Instalação de Ar Condicionado').click();
    });

    // 3. Usar o Assistente de Proposta da IA
    cy.contains('h2', 'Assistente de Proposta IA').should('be.visible');
    cy.wait('@getInsights');
    cy.contains('💡 Sugestão de Preço').should('be.visible');
    cy.contains('✍️ Rascunho de Mensagem').should('be.visible');

    // 4. Clicar para criar a proposta (o que redireciona para a página do job)
    cy.contains('button', 'Criar Proposta').click();

    // 5. Verificar se foi redirecionado e o formulário está preenchido
    cy.url().should('include', `/job/${jobId}`);
    cy.wait(['@getJobDetails', '@getProposals', '@getMessages']);
    cy.get('textarea#message').should('contain.value', 'Olá! Vi seu anúncio e posso ajudar.');

    // 6. Preencher o preço e enviar a proposta
    cy.get('input#price').type('450.00');
    cy.contains('button', 'Enviar Proposta').click();

    // 7. Verificar se a chamada de API foi feita
    cy.wait('@submitProposal');
    cy.contains('h2', 'Sua Proposta').should('not.exist'); // O formulário deve sumir após o envio
    cy.contains('div', 'Sua proposta foi enviada!').should('be.visible'); // Supondo que uma mensagem de sucesso apareça
  });
});