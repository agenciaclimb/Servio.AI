import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const master = fs.readFileSync("DOCUMENTO_MESTRE_SERVIO_AI.md", "utf8");

const prompt = `
Você é o GERADOR OFICIAL DE TASKS seguindo o Protocolo Supremo v3.0.
Com base no Documento Mestre abaixo, gere um JSON de tasks para o próximo dia.

Formato obrigatório:
{
  "day": X,
  "area": "Área do Sprint",
  "source": "gemini",
  "tasks": [
    {
      "id": "X.Y",
      "title": "Título da task",
      "priority": "critical|high|medium|low",
      "description": "Descrição técnica detalhada",
      "labels": ["label1", "label2"],
      "acceptanceCriteria": [
        "Critério 1",
        "Critério 2"
      ]
    }
  ]
}

Documento Mestre:
${master}
`;

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extrai apenas o JSON do response (remove markdown se houver)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonContent = jsonMatch ? jsonMatch[0] : text;

  fs.writeFileSync("tasks-dia-gerado.json", jsonContent);
  console.log("✅ Tasks geradas em tasks-dia-gerado.json");
}

run();
