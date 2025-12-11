import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import { execSync } from "child_process";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const issue = process.argv[2];

if (!issue) {
  console.error("Uso: node applyFix.js <numero_da_issue>");
  process.exit(1);
}

// Lê contexto da issue
const issueData = execSync(`gh issue view ${issue} --json body,title`, {
  encoding: "utf8"
});

const master = fs.readFileSync("DOCUMENTO_MESTRE_SERVIO_AI.md", "utf8");

const prompt = `
Você é o Gemini Arquiteto seguindo o Protocolo Supremo v3.0.

Analise a issue #${issue} abaixo e gere instruções técnicas DETALHADAS para o Copilot implementar.

Formato de saída:
# FIX PARA ISSUE #${issue}

## Contexto
[Explicação do problema]

## Solução Proposta
[Arquitetura da solução]

## Instruções para Copilot
1. [Passo a passo técnico]
2. [Arquivos a modificar]
3. [Testes necessários]

## Critérios de Aceitação
- [ ] Critério 1
- [ ] Critério 2

==================== ISSUE ====================
${issueData}

==================== DOCUMENTO MESTRE ====================
${master}
`;

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  fs.writeFileSync(`automation_output/fix_issue_${issue}.md`, text);
  console.log(`✅ Instruções geradas: automation_output/fix_issue_${issue}.md`);
}

run();
