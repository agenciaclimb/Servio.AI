describe("Jornada do Admin (Visão Smoke)", () => {
  beforeEach(() => {
    // Visita a página inicial antes de cada teste
    cy.visit("/");
  });

  it("deve exibir página inicial para todos os usuários (admin acessa via login especial)", () => {
    // Admin não tem link direto na landing; precisa fazer login com credenciais especiais.
    // Como ainda não temos mock de auth, apenas verificamos que a home carrega para qualquer visitante.
    cy.get('#job-prompt').should('be.visible');
    cy.contains('h1', /Qual problema podemos/i).should('be.visible');

    // (Testes de login admin virão após implementação de mock Firebase para admin master.)
  });
});
