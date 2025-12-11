import fs from "fs";

const updateFile = process.argv[2];

if (!updateFile) {
  console.error("Uso: node updateMasterDoc.js <arquivo_com_bloco>");
  process.exit(1);
}

const updateBlock = fs.readFileSync(updateFile, "utf8");

const masterPath = "DOCUMENTO_MESTRE_SERVIO_AI.md";
const master = fs.readFileSync(masterPath, "utf8");

const updated =
  master +
  `

# ========================================
# ATUALIZAÇÃO AUTOMÁTICA — ${new Date().toISOString()}
${updateBlock}
`;

fs.writeFileSync(masterPath, updated);

console.log("✅ Documento Mestre atualizado!");
console.log(`📝 Bloco adicionado de: ${updateFile}`);
