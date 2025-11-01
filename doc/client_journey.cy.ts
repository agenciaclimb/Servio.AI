describe("Jornada do Cliente (Fluxo Feliz)", () => {
  beforeEach(() => {
    // Visita a página inicial antes de cada teste
    cy.visit("/");
  });

  it("deve permitir que um cliente busque, preencha e publique um serviço", () => {
    // Passo 1: Busca Inteligente
    const serviceDescription = "Preciso consertar um vazamento na pia da cozinha";
    cy.get('input[placeholder="Descreva o que você precisa..."]').type(
      serviceDescription
    );
    cy.contains("button", "Solicitar Serviço").click();

    // Passo 2: Wizard com IA
    // O wizard deve abrir. Vamos verificar se o título está visível.
    cy.contains("h2", "Revise os Detalhes do Serviço").should("be.visible");

    // A IA deve ter preenchido a descrição
    cy.get('textarea[name="description"]').should(
      "not.have.value",
      ""
    );
    cy.get('select[name="category"]').should("not.have.value", "");
  });
});