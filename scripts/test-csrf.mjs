import fs from "fs";

async function run() {
  const backendUrl = "https://servio-backend-v2-d-h5ogjon7aa-uw.a.run.app"; // ou api.servio-ai.com
  console.log("-> Testando 403 (Requisição sem token CSRF)...");
  
  const resBypass = await fetch(`${backendUrl}/api/identify-item`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image: "mock" })
  });

  console.log("Status sem token:", resBypass.status); // Esperado 403

  console.log("\n-> Obtendo Token via /api/csrf...");
  const csrfInit = await fetch(`${backendUrl}/api/csrf`, {
    method: "GET"
  });
  
  if (!csrfInit.ok) {
     console.log("Falha ao bater em /api/csrf", csrfInit.status);
     return;
  }
  
  const csrfData = await csrfInit.json();
  const token = csrfData.token;
  const setCookie = csrfInit.headers.get("set-cookie");
  const extractedCookie = setCookie ? setCookie.split(";")[0] : "";
  
  console.log("Token recebido:", token);
  console.log("Cookie recebido:", extractedCookie);

  console.log("\n-> Testando sucesso (Com Token + Cookie)...");
  const resSuccess = await fetch(`${backendUrl}/api/identify-item`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-csrf-token": token,
      "cookie": extractedCookie
    },
    body: JSON.stringify({ base64Image: "mock" })
  });
  
  console.log("Status com token:", resSuccess.status); // Esperado 200

  const outData = await resSuccess.text();
  console.log("Retorno:", outData);
}

run();
