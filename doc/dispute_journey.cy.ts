describe("Jornada de Disputa", () => {
  const jobId = "job-dispute-1";
  const disputeId = "dispute-123";

  it("deve permitir que um cliente abra uma disputa e um admin a resolva", () => {
    // --- ETAPA CLIENTE: Abrir Disputa ---

    // Mocks para o cliente
    cy.intercept("GET", "**/users/cliente@servio.ai", { fixture: "clientUser.json" }).as("clientLogin");
    cy.intercept("GET", `**/jobs/${jobId}`, { fixture: "jobForDispute_inProgress.json" }).as("getJobInProgress");
    cy.intercept("POST", "**/disputes", { statusCode: 201, body: { id: disputeId } }).as("createDispute");
    cy.intercept("PUT", `**/jobs/${jobId}`, { statusCode: 200 }).as("updateJobToDispute");

    // Login como Cliente
    cy.visit("/login");
    cy.get('input[name="email"]').type("cliente@servio.ai");
    cy.get('input[name="password"]').type("123456");
    cy.contains("button", "Entrar").click();
    cy.wait("@clientLogin");

    // Navega para a página do job e abre a disputa
    cy.visit(`/job/${jobId}`);
    cy.wait("@getJobInProgress");
    cy.contains("button", "Relatar um Problema / Abrir Disputa").click();

    // Preenche o modal de disputa
    cy.get('textarea[placeholder*="descreva o problema"]').type("O serviço não foi realizado conforme o combinado.");
    cy.contains("button", "Enviar Disputa").click();

    cy.wait("@createDispute");
    cy.wait("@updateJobToDispute");

    // Verifica se a UI atualizou (ex: o botão de disputa sumiu ou mudou)
    cy.contains("Disputa em andamento").should("be.visible");

    // --- ETAPA ADMIN: Resolver Disputa ---

    // Mocks para o admin
    cy.intercept("GET", "**/users/admin@servio.ai", { fixture: "adminUser.json" }).as("adminLogin");
    cy.intercept("GET", "**/disputes", { fixture: "openDisputes.json" }).as("getDisputes");
    cy.intercept("POST", `**/disputes/${disputeId}/resolve`, { statusCode: 200 }).as("resolveDispute");

    // Login como Admin
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@servio.ai");
    cy.get('input[name="password"]').type("adminpass");
    cy.contains("button", "Entrar").click();
    cy.wait("@adminLogin");

    // Navega para o dashboard do admin e resolve a disputa
    cy.url().should("include", "/admin");
    cy.contains("h2", "Disputas Abertas").should("be.visible");
    cy.wait("@getDisputes");

    cy.contains("td", `Job: ${jobId.substring(0, 8)}...`).parent().contains("button", "Analisar").click();

    // No modal de análise
    cy.contains("h2", "Analisar Disputa").should("be.visible");
    cy.get('textarea[id="resolution-comment"]').type("Análise concluída. O pagamento será liberado para o prestador pois o serviço foi executado.");
    cy.contains("button", "Liberar para Prestador").click();

    cy.wait("@resolveDispute");

    // Verifica se o modal fechou e a disputa sumiu da lista
    cy.contains("h2", "Analisar Disputa").should("not.exist");
    cy.contains("td", `Job: ${jobId.substring(0, 8)}...`).should("not.exist");

    // --- ETAPA CLIENTE: Verificar Resolução ---
    cy.intercept("GET", `**/jobs/${jobId}`, { fixture: "jobForDispute_resolved.json" }).as("getJobResolved");

    // Visita a página do job novamente
    cy.visit(`/job/${jobId}`);
    cy.wait("@getJobResolved");

    // Verifica se o status do job foi atualizado para "concluido"
    cy.contains("span", "concluido").should("be.visible");
  });
});