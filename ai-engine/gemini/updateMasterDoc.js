#!/usr/bin/env node

/**
 * GEMINI UPDATE MASTER DOC
 * 
 * Aplica atualizações estruturadas ao Documento Mestre
 * 
 * USO:
 *   node updateMasterDoc.js --block <arquivo.md>
 * 
 * SAÍDA:
 *   DOCUMENTO_MESTRE_SERVIO_AI.md (atualizado)
 *   /ai-tasks/logs/master-doc-update-{timestamp}.json (log)
 */

const fs = require('fs');
const path = require('path');

const MASTER_DOC = path.join(__dirname, '../../docs/00_DOCUMENTO_MESTRE_SERVIO_AI.md');
const LOGS_DIR = path.join(__dirname, '../../ai-tasks/logs');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Aplica bloco de atualização ao Documento Mestre
 */
function updateMasterDoc(blockFile) {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    // 1. Lê bloco a ser aplicado
    if (!fs.existsSync(blockFile)) {
      throw new Error(`Bloco não encontrado: ${blockFile}`);
    }

    const blockContent = fs.readFileSync(blockFile, 'utf-8');

    // 2. Lê Documento Mestre atual
    if (!fs.existsSync(MASTER_DOC)) {
      throw new Error(`Documento Mestre não encontrado: ${MASTER_DOC}`);
    }

    const masterDocContent = fs.readFileSync(MASTER_DOC, 'utf-8');

    // 3. Aplica atualização
    // Procura seção APPENDIX A e insere antes dela
    const appendixIndex = masterDocContent.indexOf('## 📋 APPENDIX A');

    if (appendixIndex === -1) {
      throw new Error('Seção APPENDIX A não encontrada no Documento Mestre');
    }

    const beforeAppendix = masterDocContent.substring(0, appendixIndex);
    const appendixSection = masterDocContent.substring(appendixIndex);

    const updatedContent = beforeAppendix + blockContent + '\n\n' + appendixSection;

    // 4. Salva Documento Mestre atualizado
    fs.writeFileSync(MASTER_DOC, updatedContent);

    // 5. Registra atualização
    const logEntry = {
      timestamp,
      status: 'SUCESSO',
      duration: `${Date.now() - startTime}ms`,
      blockFile,
      documentPath: MASTER_DOC,
      changeSize: blockContent.length,
    };

    const logFile = path.join(LOGS_DIR, `master-doc-update-${Date.now()}.json`);
    fs.writeFileSync(logFile, JSON.stringify(logEntry, null, 2));

    console.log(`✅ Documento Mestre atualizado com sucesso`);
    console.log(`Bloco aplicado: ${blockFile}`);
    console.log(`Documento: ${MASTER_DOC}`);
    console.log(`Log: ${logFile}`);

    return logEntry;

  } catch (error) {
    console.error(`❌ ERRO AO ATUALIZAR: ${error.message}`);

    const errorLog = {
      timestamp,
      status: 'ERRO',
      error: error.message,
      duration: `${Date.now() - startTime}ms`,
    };

    const logFile = path.join(LOGS_DIR, `master-doc-update-error-${Date.now()}.json`);
    fs.writeFileSync(logFile, JSON.stringify(errorLog, null, 2));

    process.exit(1);
  }
}

/**
 * Gera bloco de atualização em formato padrão
 */
function generateUpdateBlock(section, content) {
  return `## ${section}

${content}

---

*Atualizado em ${new Date().toISOString()} | Versão Gemini*
`;
}

// EXECUÇÃO
if (require.main === module) {
  const args = process.argv.slice(2);
  const blockIndex = args.indexOf('--block');

  if (blockIndex === -1) {
    console.error('USO: node updateMasterDoc.js --block <arquivo.md>');
    process.exit(1);
  }

  const blockFile = args[blockIndex + 1];
  updateMasterDoc(blockFile);
}

module.exports = { updateMasterDoc, generateUpdateBlock };
