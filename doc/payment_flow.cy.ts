describe("E2E - Payment Flow (WIP - Implementando UI)", () => {
  it("deve permitir cliente efetuar pagamento", () => {
    // TODO: Implementar quando UI de payment estiver completa
    cy.visit('/');
  });
});

describe("E2E - Payment Flow (Fluxo Completo Pagamento - WIP)", () => {
  beforeEach(() => {
    // Mock de job com proposta aceita
    cy.intercept('GET', '**/api/jobs/job-123', {
      statusCode: 200,
      body: {
        id: 'job-123',
        title: 'Conserto de Encanamento',
        description: 'Vazamento na pia da cozinha',
        category: 'encanamento',
        urgency: 'urgente',
        mode: 'normal',
        clientId: 'client-abc',
        clientName: 'Ana Silva',
        providerId: 'provider-def',
        providerName: 'Carlos Ferreira',
        status: 'proposta_aceita',
        budget: 150,
        finalPrice: 120,
        location: { city: 'São Paulo', state: 'SP' },
        createdAt: new Date().toISOString(),
      }
    }).as('getJob');

    // Mock de proposta aceita
    cy.intercept('GET', '**/api/proposals?jobId=job-123', {
      statusCode: 200,
      body: [
        {
          id: 'proposal-789',
          jobId: 'job-123',
          providerId: 'provider-def',
          providerName: 'Carlos Ferreira',
          price: 120,
          description: 'Tenho 10 anos de experiência. Posso resolver hoje!',
          estimatedDuration: '2-3 horas',
          status: 'aceita',
          createdAt: new Date().toISOString()
        }
      ]
    }).as('getProposals');

    // Mock de criação de sessão Stripe
    cy.intercept('POST', '**/api/payments/create-checkout-session', {
      statusCode: 200,
      body: {
        sessionId: 'cs_test_mock_session_123',
        url: 'https://checkout.stripe.com/c/pay/cs_test_mock_session_123'
      }
    }).as('createCheckoutSession');

    // Mock de webhook Stripe (payment success)
    cy.intercept('POST', '**/api/webhooks/stripe', {
      statusCode: 200,
      body: { received: true }
    }).as('stripeWebhook');

    // Mock de atualização do job para "em_andamento"
    cy.intercept('PATCH', '**/api/jobs/job-123', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          ...req.body,
          status: 'em_andamento',
          paymentStatus: 'pago',
          updatedAt: new Date().toISOString()
        }
      });
    }).as('updateJobStatus');

    // Mock de criação de escrow
    cy.intercept('POST', '**/api/escrows', {
      statusCode: 201,
      body: {
        id: 'escrow-456',
        jobId: 'job-123',
        clientId: 'client-abc',
        providerId: 'provider-def',
        amount: 120,
        status: 'bloqueado',
        createdAt: new Date().toISOString(),
        releaseScheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
      }
    }).as('createEscrow');

    // Mock de notificação para provedor
    cy.intercept('POST', '**/api/notifications', {
      statusCode: 201,
      body: {
        id: 'notif-payment-001',
        userId: 'provider-def',
        type: 'pagamento_recebido',
        message: 'Pagamento confirmado para "Conserto de Encanamento"! Você pode iniciar o trabalho.',
        read: false,
        createdAt: new Date().toISOString()
      }
    }).as('sendPaymentNotification');

    // Mock de autenticação do cliente
    cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', {
      statusCode: 200,
      body: {
        idToken: 'mock-client-id-token',
        email: 'cliente-teste@example.com',
        refreshToken: 'mock-refresh-token',
        expiresIn: '3600',
        localId: 'client-abc'
      }
    }).as('clientLogin');

    // Mock de dados do cliente
    cy.intercept('GET', '**/api/users/client-abc', {
      statusCode: 200,
      body: {
        uid: 'client-abc',
        email: 'cliente-teste@example.com',
        displayName: 'Ana Silva',
        role: 'client',
        profile: {
          phone: '11987654321',
          location: { city: 'São Paulo', state: 'SP' }
        }
      }
    }).as('getClientProfile');

    cy.visit('/');
  });

  it("deve permitir que cliente aceite proposta e complete pagamento via Stripe", () => {
    // Passo 1: Login como cliente
  cy.get('button[data-testid="header-login-button"]', { timeout: 5000 }).click();
    cy.get('input[type="email"]', { timeout: 5000 }).type('cliente-teste@example.com');
    cy.get('input[type="password"]').type('senha123');
    cy.get('button[data-testid="auth-submit-button"]').click();
    
    cy.wait('@clientLogin', { timeout: 10000 });
    cy.wait('@getClientProfile', { timeout: 5000 });

    // Passo 2: Navegar para dashboard
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.contains('Olá, Ana Silva', { timeout: 8000 }).should('be.visible');

    // Passo 3: Visualizar job com proposta
    cy.contains('Meus Serviços').click();
    cy.contains('Conserto de Encanamento').should('be.visible');
    cy.contains('1 proposta recebida', { timeout: 5000 }).should('be.visible');

    // Passo 4: Abrir detalhes do job
    cy.contains('button', 'Ver Detalhes').click();
    cy.get('[data-testid="job-details-modal"]', { timeout: 5000 }).should('be.visible');
    
    cy.wait('@getJob', { timeout: 5000 });
    cy.wait('@getProposals', { timeout: 5000 });

    // Passo 5: Visualizar propostas
    cy.contains('Propostas Recebidas').should('be.visible');
    cy.contains('Carlos Ferreira').should('be.visible');
    cy.contains('R$ 120,00').should('be.visible');
    cy.contains('Tenho 10 anos de experiência').should('be.visible');

    // Passo 6: Aceitar proposta
    cy.contains('button', 'Aceitar Proposta').click();

    // Confirmação de aceitação
    cy.contains('Deseja aceitar esta proposta?', { timeout: 3000 }).should('be.visible');
    cy.contains('button', 'Confirmar').click();

    // Aguardar atualização do job
    cy.wait('@updateJobStatus', { timeout: 10000 });

    // Passo 7: Modal de pagamento aparece
    cy.get('[data-testid="payment-modal"]', { timeout: 8000 }).should('be.visible');
    cy.contains('Finalizar Pagamento').should('be.visible');
    cy.contains('R$ 120,00').should('be.visible');
    cy.contains('Carlos Ferreira').should('be.visible');

    // Informações de proteção do escrow
    cy.contains('Pagamento Seguro', { timeout: 3000 }).should('be.visible');
    cy.contains('Seu dinheiro fica bloqueado até a conclusão do serviço').should('be.visible');

    // Passo 8: Clicar para pagar com Stripe
    cy.contains('button', 'Pagar com Stripe').click();

    cy.wait('@createCheckoutSession', { timeout: 10000 });

    // Passo 9: Redirecionamento para Stripe (simulado)
    // Em produção, redirecionaria para checkout.stripe.com
    // Aqui simulamos sucesso do pagamento
    cy.url({ timeout: 5000 }).should('include', 'checkout');

    // Simular retorno de sucesso do Stripe (webhook processado)
    cy.visit('/payment-success?session_id=cs_test_mock_session_123');

    // Passo 10: Página de sucesso
    cy.contains('Pagamento Confirmado!', { timeout: 8000 }).should('be.visible');
    cy.contains('Seu pagamento foi processado com sucesso').should('be.visible');
    cy.contains('Carlos Ferreira foi notificado').should('be.visible');

    // Aguardar criação do escrow
    cy.wait('@createEscrow', { timeout: 10000 });
    cy.wait('@sendPaymentNotification', { timeout: 5000 });

    // Passo 11: Voltar para dashboard
    cy.contains('button', 'Voltar ao Dashboard').click();
    
    cy.url({ timeout: 5000 }).should('include', '/dashboard');

    // Passo 12: Job agora está "Em Andamento"
    cy.contains('Meus Serviços').click();
    cy.contains('Conserto de Encanamento').should('be.visible');
    cy.contains('Em Andamento', { timeout: 5000 }).should('be.visible');
    cy.contains('Pago').should('be.visible');
  });

  it("deve exibir erro se criação de sessão Stripe falhar", () => {
    // Override do mock para simular erro
    cy.intercept('POST', '**/api/payments/create-checkout-session', {
      statusCode: 500,
      body: { error: 'Erro ao criar sessão de pagamento' }
    }).as('createCheckoutSessionError');

    // Login e aceitar proposta
  cy.get('button[data-testid="header-login-button"]', { timeout: 5000 }).click();
    cy.get('input[type="email"]').type('cliente-teste@example.com');
    cy.get('input[type="password"]').type('senha123');
    cy.get('button[data-testid="auth-submit-button"]').click();
    
    cy.wait('@clientLogin', { timeout: 10000 });
    
    // Simular fluxo até pagamento
    cy.contains('Meus Serviços').click();
    cy.contains('button', 'Ver Detalhes').click();
    cy.contains('button', 'Aceitar Proposta').click();
    cy.contains('button', 'Confirmar').click();
    
    cy.wait('@updateJobStatus', { timeout: 10000 });

    // Tentar pagar
    cy.get('[data-testid="payment-modal"]', { timeout: 8000 }).should('be.visible');
    cy.contains('button', 'Pagar com Stripe').click();

    cy.wait('@createCheckoutSessionError', { timeout: 10000 });

    // Mensagem de erro
    cy.contains('Erro ao processar pagamento', { timeout: 5000 }).should('be.visible');
    cy.contains('Tente novamente').should('be.visible');
  });

  it("deve permitir cancelar pagamento antes de confirmar", () => {
  cy.get('button[data-testid="header-login-button"]', { timeout: 5000 }).click();
    // Login e aceitar proposta
    cy.get('input[type="email"]').type('cliente-teste@example.com');
    cy.get('input[type="password"]').type('senha123');
    cy.get('button[data-testid="auth-submit-button"]').click();
    
    cy.wait('@clientLogin', { timeout: 10000 });
    
    cy.contains('Meus Serviços').click();
    cy.contains('button', 'Ver Detalhes').click();
    cy.contains('button', 'Aceitar Proposta').click();
    cy.contains('button', 'Confirmar').click();
    
    cy.wait('@updateJobStatus', { timeout: 10000 });

    // Modal de pagamento aparece
    cy.get('[data-testid="payment-modal"]', { timeout: 8000 }).should('be.visible');

    // Cancelar pagamento
    cy.contains('button', 'Cancelar').click();

    // Modal fecha
    cy.get('[data-testid="payment-modal"]').should('not.exist');

    // Não deve ter chamado Stripe
    cy.get('@createCheckoutSession.all').should('have.length', 0);
  });

  it("deve exibir informações do escrow corretamente", () => {
  cy.get('button[data-testid="header-login-button"]', { timeout: 5000 }).click();
    // Login e aceitar proposta
    cy.get('input[type="email"]').type('cliente-teste@example.com');
    cy.get('input[type="password"]').type('senha123');
    cy.get('button[data-testid="auth-submit-button"]').click();
    
    cy.wait('@clientLogin', { timeout: 10000 });
    
    cy.contains('Meus Serviços').click();
    cy.contains('button', 'Ver Detalhes').click();
    cy.contains('button', 'Aceitar Proposta').click();
    cy.contains('button', 'Confirmar').click();
    
    cy.wait('@updateJobStatus', { timeout: 10000 });

    // Modal de pagamento mostra detalhes do escrow
    cy.get('[data-testid="payment-modal"]', { timeout: 8000 }).should('be.visible');
    
    // Informações de proteção
    cy.contains('Como funciona o Pagamento Seguro:').should('be.visible');
    cy.contains('Seu dinheiro fica bloqueado até a conclusão').should('be.visible');
    cy.contains('Você aprova a liberação após o serviço').should('be.visible');
    cy.contains('Em caso de problema, abra uma disputa').should('be.visible');

    // Valor do escrow
    cy.contains('Valor a ser bloqueado:').should('be.visible');
    cy.contains('R$ 120,00').should('be.visible');

    // Prazo de liberação automática
    cy.contains('Liberação automática em:').should('be.visible');
    cy.contains('7 dias').should('be.visible');
  });

  it("deve criar escrow com status 'bloqueado' após pagamento", () => {
    // Login e processo completo de pagamento
  cy.get('button[data-testid="header-login-button"]', { timeout: 5000 }).click();
    cy.get('input[type="email"]').type('cliente-teste@example.com');
    cy.get('input[type="password"]').type('senha123');
    cy.get('button[data-testid="auth-submit-button"]').click();
    
    cy.wait('@clientLogin', { timeout: 10000 });
    
    cy.contains('Meus Serviços').click();
    cy.contains('button', 'Ver Detalhes').click();
    cy.contains('button', 'Aceitar Proposta').click();
    cy.contains('button', 'Confirmar').click();
    cy.wait('@updateJobStatus', { timeout: 10000 });

    cy.get('[data-testid="payment-modal"]', { timeout: 8000 }).should('be.visible');
    cy.contains('button', 'Pagar com Stripe').click();
    cy.wait('@createCheckoutSession', { timeout: 10000 });

    // Simular retorno de sucesso
    cy.visit('/payment-success?session_id=cs_test_mock_session_123');

    // Verificar que escrow foi criado com status correto
    cy.wait('@createEscrow', { timeout: 10000 }).then((interception) => {
      expect(interception.request.body).to.have.property('jobId', 'job-123');
      expect(interception.request.body).to.have.property('amount', 120);
      expect(interception.request.body).to.have.property('status', 'bloqueado');
    });

    // Confirmação visual
    cy.contains('Escrow criado com sucesso', { timeout: 5000 }).should('be.visible');
    cy.contains('Valor bloqueado: R$ 120,00').should('be.visible');
  });
});
