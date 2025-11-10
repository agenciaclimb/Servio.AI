describe("E2E - Dispute Flow (WIP - Implementando UI)", () => {
  it("deve permitir cliente abrir disputa", () => {
    // TODO: Implementar quando UI de dispute estiver completa
    cy.visit('/');
  });
});

describe("E2E - Dispute Flow (Fluxo Completo Disputa - WIP)", () => {
  beforeEach(() => {
    // Mock de job em andamento com escrow bloqueado
    cy.intercept('GET', '**/api/jobs/job-123', {
      statusCode: 200,
      body: {
        id: 'job-123',
        title: 'Conserto de Encanamento',
        description: 'Vazamento na pia da cozinha',
        category: 'encanamento',
        clientId: 'client-abc',
        clientName: 'Ana Silva',
        providerId: 'provider-def',
        providerName: 'Carlos Ferreira',
        status: 'em_andamento',
        paymentStatus: 'pago',
        finalPrice: 120,
        createdAt: new Date().toISOString(),
      }
    }).as('getJob');

    // Mock de escrow bloqueado
    cy.intercept('GET', '**/api/escrows?jobId=job-123', {
      statusCode: 200,
      body: {
        id: 'escrow-456',
        jobId: 'job-123',
        clientId: 'client-abc',
        providerId: 'provider-def',
        amount: 120,
        status: 'bloqueado',
        createdAt: new Date().toISOString(),
      }
    }).as('getEscrow');

    // Mock de criação de disputa
    cy.intercept('POST', '**/api/disputes', {
      statusCode: 201,
      body: {
        id: 'dispute-789',
        jobId: 'job-123',
        escrowId: 'escrow-456',
        reporterId: 'client-abc',
        reporterRole: 'client',
        reason: 'Serviço não foi concluído conforme acordado',
        description: 'O encanador não resolveu o problema completamente e o vazamento continua.',
        status: 'aberta',
        createdAt: new Date().toISOString(),
      }
    }).as('createDispute');

    // Mock de mensagens da disputa
    cy.intercept('GET', '**/api/disputes/dispute-789/messages', {
      statusCode: 200,
      body: [
        {
          id: 'msg-001',
          disputeId: 'dispute-789',
          senderId: 'client-abc',
          senderName: 'Ana Silva',
          senderRole: 'client',
          message: 'O vazamento continua após o serviço. Preciso de reembolso.',
          createdAt: new Date().toISOString(),
        }
      ]
    }).as('getDisputeMessages');

    // Mock de envio de mensagem na disputa
    cy.intercept('POST', '**/api/disputes/dispute-789/messages', (req) => {
      req.reply({
        statusCode: 201,
        body: {
          id: 'msg-' + Date.now(),
          disputeId: 'dispute-789',
          senderId: req.body.senderId,
          senderName: req.body.senderName,
          senderRole: req.body.senderRole,
          message: req.body.message,
          createdAt: new Date().toISOString(),
        }
      });
    }).as('sendDisputeMessage');

    // Mock de resolução de disputa pelo admin
    cy.intercept('PATCH', '**/api/disputes/dispute-789/resolve', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          id: 'dispute-789',
          status: 'resolvida',
          resolution: req.body.resolution,
          resolvedBy: 'admin-master',
          resolvedAt: new Date().toISOString(),
        }
      });
    }).as('resolveDispute');

    // Mock de atualização do escrow após resolução
    cy.intercept('PATCH', '**/api/escrows/escrow-456', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          id: 'escrow-456',
          status: req.body.status,
          releasedTo: req.body.releasedTo,
          releasedAmount: req.body.releasedAmount,
          updatedAt: new Date().toISOString(),
        }
      });
    }).as('updateEscrow');

    // Mock de notificações
    cy.intercept('POST', '**/api/notifications', (req) => {
      req.reply({
        statusCode: 201,
        body: {
          id: 'notif-' + Date.now(),
          userId: req.body.userId,
          type: req.body.type,
          message: req.body.message,
          read: false,
          createdAt: new Date().toISOString(),
        }
      });
    }).as('sendNotification');

    // Mock de lista de disputas para admin
    cy.intercept('GET', '**/api/disputes?status=aberta', {
      statusCode: 200,
      body: [
        {
          id: 'dispute-789',
          jobId: 'job-123',
          jobTitle: 'Conserto de Encanamento',
          clientName: 'Ana Silva',
          providerName: 'Carlos Ferreira',
          reason: 'Serviço não concluído',
          status: 'aberta',
          createdAt: new Date().toISOString(),
        }
      ]
    }).as('getOpenDisputes');

    // Mock de autenticação
    cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', (req) => {
      const email = JSON.parse(req.body).email;
      const localId = email.includes('admin') ? 'admin-master' : 
                      email.includes('cliente') ? 'client-abc' : 'provider-def';
      const role = email.includes('admin') ? 'admin' : 
                   email.includes('cliente') ? 'client' : 'provider';
      
      req.reply({
        statusCode: 200,
        body: {
          idToken: `mock-${role}-token`,
          email: email,
          refreshToken: 'mock-refresh-token',
          expiresIn: '3600',
          localId: localId
        }
      });
    }).as('login');

    // Mock de perfis de usuário
    cy.intercept('GET', '**/api/users/*', (req) => {
      const userId = req.url.split('/').pop();
      const profiles = {
        'client-abc': {
          uid: 'client-abc',
          email: 'cliente-teste@example.com',
          displayName: 'Ana Silva',
          role: 'client'
        },
        'provider-def': {
          uid: 'provider-def',
          email: 'provider-teste@example.com',
          displayName: 'Carlos Ferreira',
          role: 'provider'
        },
        'admin-master': {
          uid: 'admin-master',
          email: 'admin@servio.ai',
          displayName: 'Admin Master',
          role: 'admin'
        }
      };
      req.reply({ statusCode: 200, body: profiles[userId] || {} });
    }).as('getUserProfile');

    cy.visit('/');
  });

  it("deve permitir que cliente reporte problema e abra disputa", () => {
    // Passo 1: Login como cliente
    cy.get('input[type="email"]', { timeout: 5000 }).type('cliente-teste@example.com');
    cy.get('input[type="password"]').type('senha123');
    cy.get('button[data-testid="auth-submit-button"]').click();
    
    cy.wait('@login', { timeout: 10000 });
    cy.wait('@getUserProfile', { timeout: 5000 });

    // Passo 2: Navegar para "Meus Serviços"
    cy.contains('Meus Serviços', { timeout: 8000 }).click();
    cy.contains('Conserto de Encanamento').should('be.visible');
    cy.contains('Em Andamento').should('be.visible');

    // Passo 3: Abrir detalhes do job
    cy.contains('button', 'Ver Detalhes').click();
    cy.get('[data-testid="job-details-modal"]', { timeout: 5000 }).should('be.visible');
    
    cy.wait('@getJob', { timeout: 5000 });
    cy.wait('@getEscrow', { timeout: 5000 });

    // Passo 4: Clicar em "Reportar Problema"
    cy.contains('button', 'Reportar Problema').click();

    // Passo 5: Modal de disputa abre
    cy.get('[data-testid="dispute-modal"]', { timeout: 5000 }).should('be.visible');
    cy.contains('Reportar Problema com o Serviço').should('be.visible');

    // Passo 6: Preencher formulário de disputa
    cy.get('select[name="reason"]').select('Serviço não concluído');
    cy.get('textarea[name="description"]').type(
      'O encanador não resolveu o problema completamente e o vazamento continua.'
    );

    // Upload de evidência (opcional)
    cy.contains('Anexar Evidências').should('be.visible');

    // Passo 7: Submeter disputa
    cy.get('button[data-testid="submit-dispute-button"]').click();

    cy.wait('@createDispute', { timeout: 10000 });
    cy.wait('@sendNotification', { timeout: 5000 });

    // Passo 8: Confirmação de sucesso
    cy.contains('Disputa criada com sucesso', { timeout: 8000 }).should('be.visible');
    cy.contains('Nossa equipe vai analisar o caso').should('be.visible');

    // Modal fecha
    cy.get('[data-testid="dispute-modal"]').should('not.exist');

    // Passo 9: Job agora mostra status "Em Disputa"
    cy.contains('Em Disputa', { timeout: 5000 }).should('be.visible');
    
    // Badge de disputa ativa
    cy.get('[data-testid="dispute-badge"]').should('be.visible');
  });

  it("deve permitir que provedor responda à disputa", () => {
    // Override: disputa já existe
    cy.intercept('GET', '**/api/disputes?jobId=job-123', {
      statusCode: 200,
      body: {
        id: 'dispute-789',
        jobId: 'job-123',
        reporterId: 'client-abc',
        reason: 'Serviço não concluído',
        status: 'aberta',
      }
    }).as('getJobDispute');

    // Passo 1: Login como provedor
    cy.get('input[type="email"]').type('provider-teste@example.com');
    cy.get('input[type="password"]').type('senha123');
    cy.get('button[data-testid="auth-submit-button"]').click();
    
    cy.wait('@login', { timeout: 10000 });

    // Passo 2: Navegar para "Meus Trabalhos"
    cy.contains('Meus Trabalhos', { timeout: 8000 }).click();
    cy.contains('Conserto de Encanamento').should('be.visible');
    
    // Badge de alerta de disputa
    cy.get('[data-testid="dispute-alert"]').should('be.visible');

    // Passo 3: Abrir detalhes do job
    cy.contains('button', 'Ver Detalhes').click();
    cy.wait('@getJobDispute', { timeout: 5000 });

    // Alerta de disputa ativa
    cy.contains('Disputa Ativa', { timeout: 5000 }).should('be.visible');
    cy.contains('O cliente reportou um problema').should('be.visible');

    // Passo 4: Clicar para ver detalhes da disputa
    cy.contains('button', 'Ver Disputa').click();

    cy.get('[data-testid="dispute-details-modal"]', { timeout: 5000 }).should('be.visible');
    cy.wait('@getDisputeMessages', { timeout: 5000 });

    // Passo 5: Visualizar mensagens da disputa
    cy.contains('O vazamento continua após o serviço').should('be.visible');

    // Passo 6: Enviar resposta
    cy.get('textarea[data-testid="dispute-message-input"]').type(
      'Voltarei ao local hoje para revisar o trabalho. O problema será resolvido.'
    );
    cy.get('button[data-testid="send-message-button"]').click();

    cy.wait('@sendDisputeMessage', { timeout: 10000 });

    // Mensagem aparece no chat
    cy.contains('Voltarei ao local hoje', { timeout: 5000 }).should('be.visible');

    // Notificação enviada para cliente e admin
    cy.wait('@sendNotification', { timeout: 3000 });
  });

  it("deve permitir que admin resolva disputa a favor do cliente (reembolso)", () => {
    // Passo 1: Login como admin
    cy.get('input[type="email"]').type('admin@servio.ai');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[data-testid="auth-submit-button"]').click();
    
    cy.wait('@login', { timeout: 10000 });

    // Passo 2: Navegar para dashboard admin
    cy.url({ timeout: 10000 }).should('include', '/admin');
    cy.contains('Admin Dashboard', { timeout: 8000 }).should('be.visible');

    // Passo 3: Visualizar disputas abertas
    cy.contains('Disputas', { timeout: 5000 }).click();
    cy.wait('@getOpenDisputes', { timeout: 5000 });

    cy.contains('Conserto de Encanamento').should('be.visible');
    cy.contains('Ana Silva').should('be.visible'); // Cliente
    cy.contains('Carlos Ferreira').should('be.visible'); // Provedor
    cy.contains('Aberta').should('be.visible');

    // Passo 4: Abrir detalhes da disputa
    cy.contains('button', 'Analisar').click();

    cy.get('[data-testid="admin-dispute-modal"]', { timeout: 5000 }).should('be.visible');
    cy.wait('@getDisputeMessages', { timeout: 5000 });

    // Passo 5: Visualizar histórico completo
    cy.contains('Histórico da Disputa').should('be.visible');
    cy.contains('O vazamento continua após o serviço').should('be.visible');
    cy.contains('Voltarei ao local hoje').should('be.visible');

    // Informações do escrow
    cy.contains('Valor em disputa:').should('be.visible');
    cy.contains('R$ 120,00').should('be.visible');

    // Passo 6: Decidir pela resolução (a favor do cliente)
    cy.get('select[name="resolution"]').select('reembolso_cliente');
    cy.get('textarea[name="adminNotes"]').type(
      'Após análise, ficou constatado que o serviço não foi concluído adequadamente. Reembolso autorizado.'
    );

    // Passo 7: Confirmar resolução
    cy.get('button[data-testid="resolve-dispute-button"]').click();

    // Confirmação
    cy.contains('Confirmar Resolução?', { timeout: 3000 }).should('be.visible');
    cy.contains('Esta ação não pode ser desfeita').should('be.visible');
    cy.contains('button', 'Confirmar Resolução').click();

    cy.wait('@resolveDispute', { timeout: 10000 });
    cy.wait('@updateEscrow', { timeout: 5000 });

    // Verificar que escrow foi atualizado para "liberado_cliente"
    cy.get('@updateEscrow').then((interception) => {
      expect(interception.request.body).to.have.property('status', 'liberado');
      expect(interception.request.body).to.have.property('releasedTo', 'client-abc');
      expect(interception.request.body).to.have.property('releasedAmount', 120);
    });

    // Notificações enviadas para ambas as partes
    cy.wait('@sendNotification', { timeout: 3000 });
    cy.wait('@sendNotification', { timeout: 3000 });

    // Passo 8: Confirmação de sucesso
    // O teste agora verifica o componente de toast
    cy.contains('.Toastify__toast--success', 'Disputa resolvida com sucesso!', { timeout: 8000 }).should('be.visible');

    // Modal fecha
    cy.get('[data-testid="dispute-details-modal"]').should('not.exist');

    // Passo 9: Disputa agora aparece como "Resolvida"
  });

  it("deve permitir que admin resolva disputa a favor do provedor", () => {
    // Login como admin
    cy.get('input[type="email"]').type('admin@servio.ai');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[data-testid="auth-submit-button"]').click();
    
    cy.wait('@login', { timeout: 10000 });

    // Navegar para disputas
    cy.contains('Disputas', { timeout: 5000 }).click();
    cy.wait('@getOpenDisputes', { timeout: 5000 });
    cy.contains('button', 'Analisar').click();
    cy.wait('@getDisputeMessages', { timeout: 5000 });

    // Decidir a favor do provedor
    cy.get('select[name="resolution"]').select('liberar_provedor');
    cy.get('textarea[name="adminNotes"]').type(
      'Provedor forneceu evidências de que o serviço foi concluído adequadamente.'
    );

    cy.get('button[data-testid="resolve-dispute-button"]').click();
    cy.contains('button', 'Confirmar Resolução').click();

    cy.wait('@resolveDispute', { timeout: 10000 });
    cy.wait('@updateEscrow', { timeout: 5000 });

    // Verificar que escrow foi liberado para provedor
    cy.get('@updateEscrow').then((interception) => {
      expect(interception.request.body).to.have.property('status', 'liberado');
      expect(interception.request.body).to.have.property('releasedTo', 'provider-def');
      expect(interception.request.body).to.have.property('releasedAmount', 120);
    });

    cy.contains('Pagamento de R$ 120,00 liberado para Carlos Ferreira', { timeout: 8000 })
      .should('be.visible');
  });

  it("deve permitir que admin resolva disputa com divisão (split)", () => {
    // Login como admin
    cy.get('input[type="email"]').type('admin@servio.ai');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[data-testid="auth-submit-button"]').click();
    
    cy.wait('@login', { timeout: 10000 });

    cy.contains('Disputas', { timeout: 5000 }).click();
    cy.wait('@getOpenDisputes', { timeout: 5000 });
    cy.contains('button', 'Analisar').click();
    cy.wait('@getDisputeMessages', { timeout: 5000 });

    // Decidir por divisão
    cy.get('select[name="resolution"]').select('dividir');
    
    // Inputs de divisão aparecem
    cy.get('input[name="clientAmount"]').clear().type('60');
    cy.get('input[name="providerAmount"]').clear().type('60');

    cy.get('textarea[name="adminNotes"]').type(
      'Ambas as partes têm razão parcial. Divisão equilibrada do valor.'
    );

    cy.get('button[data-testid="resolve-dispute-button"]').click();
    cy.contains('button', 'Confirmar Resolução').click();

    cy.wait('@resolveDispute', { timeout: 10000 });
    cy.wait('@updateEscrow', { timeout: 5000 });
    cy.wait('@updateEscrow', { timeout: 5000 }); // Dois updates (cliente + provedor)

    cy.contains('Disputa resolvida com divisão', { timeout: 8000 }).should('be.visible');
    cy.contains('Cliente: R$ 60,00').should('be.visible');
    cy.contains('Provedor: R$ 60,00').should('be.visible');
  });

  it("deve validar campos obrigatórios ao criar disputa", () => {
    // Login como cliente
    cy.get('input[type="email"]').type('cliente-teste@example.com');
    cy.get('input[type="password"]').type('senha123');
    cy.get('button[data-testid="auth-submit-button"]').click();
    cy.wait('@login', { timeout: 10000 });

    // Abrir formulário de disputa
    cy.contains('Meus Serviços', { timeout: 8000 }).click();
    cy.contains('button', 'Ver Detalhes').click();
    cy.contains('button', 'Reportar Problema').click();

    cy.get('[data-testid="dispute-modal"]', { timeout: 5000 }).should('be.visible');

    // Tentar submeter sem preencher
    cy.get('button[data-testid="submit-dispute-button"]').click();

    // Mensagens de validação
    cy.contains('Motivo é obrigatório', { timeout: 3000 }).should('be.visible');
    cy.contains('Descrição é obrigatória', { timeout: 3000 }).should('be.visible');
  });

  it("deve impedir criação de disputa duplicada para mesmo job", () => {
    // Override: disputa já existe
    cy.intercept('GET', '**/api/disputes?jobId=job-123', {
      statusCode: 200,
      body: {
        id: 'dispute-789',
        status: 'aberta'
      }
    }).as('getExistingDispute');

    // Login como cliente
    cy.get('input[type="email"]').type('cliente-teste@example.com');
    cy.get('input[type="password"]').type('senha123');
    cy.get('button[data-testid="auth-submit-button"]').click();
    cy.wait('@login', { timeout: 10000 });

    // Tentar abrir disputa
    cy.contains('Meus Serviços', { timeout: 8000 }).click();
    cy.contains('button', 'Ver Detalhes').click();
    cy.wait('@getExistingDispute', { timeout: 5000 });

    // Botão "Reportar Problema" desabilitado ou não existe
    cy.contains('button', 'Reportar Problema').should('be.disabled');
    
    // Mensagem informativa
    cy.contains('Disputa já existe para este serviço', { timeout: 3000 }).should('be.visible');
  });
});
