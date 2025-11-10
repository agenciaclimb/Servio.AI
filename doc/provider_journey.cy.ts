describe("Jornada do Prestador (Fluxo Feliz)", () => {
  beforeEach(() => {
    // Visita a página inicial antes de cada teste
    cy.visit("/");
  });

  it("deve navegar para landing de prestador", () => {
    // Passo 1: Tenta acessar página de cadastro para prestador (via header "Seja um Prestador")
    // O botão existe no Header; ao clicar, deve redirecionar para landing de prestador.
    cy.contains('button', /Seja um Prestador/i).click();

    // Passo 2: Sistema apresenta landing com call to action.
    // ProviderLandingPage contém "Quero ser um Parceiro" ou "Cadastrar meu serviço agora"
    cy.contains('button', /Quero ser um Parceiro|Cadastrar meu serviço/i, { timeout: 8000 }).should('be.visible');

    // (Testes completos com mock de auth virão após implementar Firebase mock.)
  });
});
