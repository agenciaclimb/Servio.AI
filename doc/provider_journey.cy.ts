describe("Jornada do Prestador (Fluxo Feliz)", () => {
  const providerEmail = `provider-${Date.now()}@servio.ai`;
  const newProvider = {
    email: `provider-${Date.now()}@servio.ai`,
    password: "password123",
    name: "João da Silva",
  };

  beforeEach(() => {
    // Mock da criação de usuário no backend
    cy.intercept("POST", "**/users", {
      statusCode: 201,
      body: { message: "User created successfully", id: newProvider.email },
    }).as("createUser");

    // Mock da extração de dados do documento pela IA
    cy.intercept("POST", "**/api/extract-document", {
      statusCode: 200,
      body: {
        fullName: "JOAO DA SILVA",
        cpf: "123.456.789-00",
      },
    }).as("extractDocument");

    // Mock da atualização do perfil do usuário (submissão do onboarding)
    cy.intercept("PUT", `**/users/${newProvider.email}`, {
      statusCode: 200,
      body: { message: "User updated successfully", id: newProvider.email },
    }).as("updateUser");

    cy.visit("/");
  });

  it("deve permitir o cadastro, onboarding e submissão para verificação", () => {
    // Passo 1: Cadastro
    cy.contains("a", "Criar conta").click();
    cy.url().should("include", "/register"); // Supondo que a rota de cadastro seja /register

    cy.get('input[name="name"]').type(newProvider.name);
    cy.get('input[name="email"]').type(newProvider.email);
    cy.get('input[name="password"]').type(newProvider.password);
    cy.get('select[name="userType"]').select("prestador");
    cy.contains("button", "Criar Conta").click();

    cy.wait("@createUser");

    // Passo 2: Onboarding
    // Após o cadastro, o usuário deve ser redirecionado para o onboarding
    cy.url().should("include", "/onboarding");
    cy.contains("h1", "Complete seu Perfil de Prestador").should("be.visible");

    // Preenche o perfil
    cy.get('input[name="headline"]').type("Especialista em Reparos Residenciais");
    cy.get('textarea[name="bio"]').type("Mais de 10 anos de experiência com reparos elétricos e hidráulicos.");
    cy.get('input[name="specialties"]').type("eletricista, encanador{enter}");

    // Simula o upload do documento
    cy.get('input[type="file"]').selectFile("cypress/fixtures/documento-exemplo.png", { force: true });

    // Aguarda a IA extrair os dados e verifica se os campos foram preenchidos
    cy.wait("@extractDocument");
    cy.get('input[name="fullNameFromDoc"]').should("have.value", "JOAO DA SILVA");
    cy.get('input[name="cpfFromDoc"]').should("have.value", "123.456.789-00");

    // Submete para verificação
    cy.contains("button", "Enviar para Verificação").click();
    cy.wait("@updateUser");

    // O usuário deve ser redirecionado para uma página de "aguardando aprovação" ou dashboard com aviso
    cy.contains("h2", "Aguardando Aprovação").should("be.visible");
    cy.contains("p", "Seu perfil foi enviado para análise.").should("be.visible");
  });

  it("deve permitir que um admin aprove o prestador e que ele envie sua primeira proposta", () => {
    // --- ETAPA ADMIN ---
    // Mock das APIs para o fluxo de aprovação
    cy.intercept("GET", "**/users/admin@servio.ai", { fixture: "adminUser.json" }).as("adminLogin");
    cy.intercept("GET", "**/users", { fixture: "usersWithPending.json" }).as("getUsers");
    cy.intercept("PUT", `**/users/${providerEmail}`, { statusCode: 200 }).as("approveProvider");

    // Login como Admin
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@servio.ai");
    cy.get('input[name="password"]').type("adminpass");
    cy.contains("button", "Entrar").click();
    cy.wait("@adminLogin");

    // Aprovação no Admin Dashboard
    cy.url().should("include", "/admin");
    cy.contains("h2", "Verificações Pendentes").should("be.visible");
    cy.wait("@getUsers");

    // Encontra o prestador pendente na lista e clica para analisar
    cy.contains(providerEmail).parent().find("button").click();
    cy.contains("h2", "Verificação de Identidade").should("be.visible");
    cy.contains("button", "Aprovar Verificação").click();
    cy.wait("@approveProvider");
    cy.contains(providerEmail).should("not.exist"); // Verifica se o usuário saiu da lista de pendentes

    // --- ETAPA PRESTADOR (PÓS-APROVAÇÃO) ---
    // Mock das APIs para o fluxo de envio de proposta
    cy.intercept("GET", `**/users/${providerEmail}`, { fixture: "approvedProvider.json" }).as("providerLogin");
    cy.intercept("GET", "**/jobs?status=aberto", { fixture: "openJobs.json" }).as("getOpenJobs");
    cy.intercept("POST", "**/proposals", { statusCode: 201 }).as("submitProposal");

    // Login como o prestador recém-aprovado
    cy.visit("/login");
    cy.get('input[name="email"]').type(providerEmail);
    cy.get('input[name="password"]').type(newProvider.password);
    cy.contains("button", "Entrar").click();
    cy.wait("@providerLogin");

    // Encontra um job e envia uma proposta
    cy.url().should("include", "/dashboard");
    cy.contains("h2", "Novas Oportunidades").should("be.visible");
    cy.wait("@getOpenJobs");
    cy.contains("p", "Vazamento no sifão da pia da cozinha").click(); // Clica no job de exemplo

    cy.url().should("match", /job\/.+/);
    cy.get('textarea[placeholder="Sua mensagem para o cliente..."]').type("Olá, sou especialista em hidráulica e posso resolver seu problema rapidamente.");
    cy.get('input[placeholder="R$ 0,00"]').type("150,00");
    cy.contains("button", "Enviar Proposta").click();
    cy.wait("@submitProposal");
    cy.contains("Proposta Enviada com Sucesso!").should("be.visible");
  });

  it("deve permitir que o prestador execute o serviço e receba a avaliação", () => {
    // --- ETAPA PRESTADOR (PÓS-ACEITE) ---
    // Mock das APIs para o fluxo de execução
    const providerUser = { fixture: "approvedProvider.json" };
    providerUser.body.email = providerEmail; // Garante o email correto

    cy.intercept("GET", `**/users/${providerEmail}`, providerUser).as("providerLogin");
    cy.intercept("GET", "**/jobs?providerId=*", { fixture: "acceptedJobs.json" }).as("getMyJobs");
    cy.intercept("POST", "**/jobs/job-accepted-1/set-on-the-way", { statusCode: 200 }).as("setOnTheWay");

    // Mock para simular a conclusão e avaliação pelo cliente
    cy.intercept("GET", "**/jobs/job-accepted-1", (req) => {
      // Na primeira chamada, o job está agendado. Depois, estará concluído com avaliação.
      if (req.headers.referer && req.headers.referer.includes("/dashboard")) {
        req.reply({ fixture: "jobDetailsScheduled.json" });
      } else {
        req.reply({ fixture: "jobDetailsCompleted.json" });
      }
    }).as("getJobDetails");

    // Login como o prestador
    cy.visit("/login");
    cy.get('input[name="email"]').type(providerEmail);
    cy.get('input[name="password"]').type(newProvider.password);
    cy.contains("button", "Entrar").click();
    cy.wait("@providerLogin");

    // Encontra o job aceito em "Meus Serviços"
    cy.url().should("include", "/dashboard");
    cy.contains("h2", "Meus Serviços").should("be.visible");
    cy.wait("@getMyJobs");
    cy.contains("p", "Instalação de lustre na sala de estar").click();

    // Clica em "Estou a Caminho"
    cy.contains("button", "Estou a Caminho").click();
    cy.wait("@setOnTheWay");

    // Simula a conclusão pelo cliente e verifica a avaliação
    cy.reload(); // Recarrega a página para simular o tempo passando
    cy.contains("h3", "Serviço Concluído!").should("be.visible");
    cy.contains("Sua Avaliação").should("be.visible");
    cy.get(".rating-star").should("have.length", 5); // Verifica se as estrelas da avaliação estão presentes
  });
});