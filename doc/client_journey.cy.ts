describe('Jornada do Cliente (Fluxo Feliz)', () => {
  beforeEach(() => {
    // Visita a página inicial antes de cada teste
    cy.visit('/');
  });

  it('deve permitir que um cliente busque, preencha e publique um serviço', () => {
    // Passo 1: Busca Inteligente na home
    const serviceDescription = 'Preciso consertar um vazamento na pia da cozinha';
    cy.get('input#job-prompt', { timeout: 10000 }).should('be.visible').type(serviceDescription);
    cy.get('button[data-testid="hero-submit-button"]').click();

    // Passo 2: Auth Modal aparece (pois não está logado)
    cy.get('[data-testid="auth-modal"]', { timeout: 8000 }).should('be.visible');
    cy.contains('h2', 'Bem-vindo de volta!').should('be.visible');

    // Preencher email e senha de teste
    cy.get('input[type="email"]').type('cliente-teste@example.com');
    cy.get('input[type="password"]').type('senha123');
    cy.get('button[data-testid="auth-submit-button"]').click();

    // Passo 3: Wizard com IA abre após login
    cy.get('[data-testid="wizard-modal"]', { timeout: 15000 }).should('be.visible');
    cy.contains('h2', 'Revise o seu Pedido').should('be.visible');

    // A IA deve ter preenchido a descrição com conteúdo relevante
    cy.get('textarea#service-description').should('not.have.value', '');

    // Verificar elementos da UI do wizard
    cy.contains('Urgência').should('exist');
    cy.contains('Modalidade do Serviço').should('exist');

    // Botão de publicação presente (scroll até ele)
    cy.get('button[data-testid="wizard-publish-button"]').scrollIntoView().should('be.visible');
  });
});
