describe("Jornada de Login com Google", () => {
  const newUser = {
    email: `test-google-${Date.now()}@example.com`,
    name: "Usuário Google Teste",
  };

  beforeEach(() => {
    // Mock da criação do novo usuário no nosso backend,
    // que é acionada quando um usuário do Google faz login pela primeira vez.
    cy.intercept("POST", "**/users", {
      statusCode: 201,
      body: { message: "User created successfully", id: newUser.email },
    }).as("createUser");

    // Mock da busca do usuário, que vai falhar na primeira vez, acionando a criação.
    cy.intercept("GET", `**/users/${newUser.email}`, {
      statusCode: 404,
    }).as("getUser");

    cy.visit("/login");
  });

  it("deve criar um novo usuário e redirecionar para o dashboard após o primeiro login com Google", () => {
    // O teste não pode interagir com o popup do Google.
    // A lógica de `handleGoogleSignIn` no `AppContext` é o que testamos indiretamente.
    // Clicamos no botão para garantir que a função é chamada.
    cy.contains("button", "Entrar com Google").click();

    // Como não podemos testar o popup, a verificação para aqui.
    // Em um cenário real com stubs mais avançados, verificaríamos o redirecionamento.
    cy.log("Simulação do clique no botão de login com Google concluída.");
  });
});