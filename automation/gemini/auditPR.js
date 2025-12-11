import { GoogleGenerativeAI } from "@google/generative-ai";
import { execSync } from "child_process";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// === RECEBE O NÚMERO DO PR ===
const pr = process.argv[2];

if (!pr) {
  console.error("Uso: node auditPR.js <numero_do_pr>");
  process.exit(1);
}

// === OBTÉM DIFF DO GITHUB ===
const diff = execSync(`gh pr diff ${pr}`, {
  encoding: "utf8"
});

// === CARREGA DOCUMENTO MESTRE ===
const masterDoc = fs.readFileSync("DOCUMENTO_MESTRE_SERVIO_AI.md", "utf8");

// === PROMPT DE AUDITORIA ===
const prompt = `
Você é o Auditor Global A+, seguindo o PROTOCOLO SUPREMO v3.0.
Audite o PR #${pr}.
Leia o diff abaixo, compare com o Documento Mestre e produza:

1. VEREDITO (Aprovado ou Rejeitado)
2. Lista de violações
3. Lista de sugestões
4. Bloco:

=== ATUALIZAÇÃO DO DOCUMENTO MESTRE — PR ${pr} ===
(Apenas texto explicativo, sem código)

==================== DIFF ====================
${diff}

==================== DOCUMENTO MESTRE ====================
${masterDoc}
`;

async function audit() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const result = await model.generateContent(prompt);

  const output = result.response.text();
  fs.writeFileSync(`automation_output/audit_PR_${pr}.md`, output);

  console.log("\n=== AUDITORIA GERADA COM SUCESSO ===");
  console.log(`Arquivo: automation_output/audit_PR_${pr}.md`);
}

audit();
