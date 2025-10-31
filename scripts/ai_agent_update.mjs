/**
 * AI Agent Update Script
 * - Acrescenta um #update_log no doc/DOCUMENTO_MESTRE_SERVIO_AI.md
 * - Ponto único para expandir a automação (ex.: rodar validações, gerar seções, sincronizar status do GCP, etc.)
 */
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const DOC_PATH  = path.join(REPO_ROOT, "doc", "DOCUMENTO_MESTRE_SERVIO_AI.md");

const reason = process.argv[2] || "";
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

if (!fs.existsSync(DOC_PATH)) {
  console.error("Documento Mestre não encontrado em:", DOC_PATH);
  process.exit(0); // não falha build; apenas não altera
}

let md = fs.readFileSync(DOC_PATH, "utf-8");

// Insere (ou cria) a seção #update_log ao final
const logLine = `#update_log - ${stamp}
Agente IA executado automaticamente via workflow. ${reason ? "Motivo: " + reason : ""}
`;

if (!md.includes("#update_log")) {
  // Se não existe nenhum, adiciona cabeçalho e nosso primeiro log
  md += `

---

## Logs de Atualização (IA)
${logLine}
`;
} else {
  // Apenas anexa mais um log
  md += `

${logLine}
`;
}

fs.writeFileSync(DOC_PATH, md, "utf-8");
console.log("Documento Mestre atualizado com #update_log em", stamp);
