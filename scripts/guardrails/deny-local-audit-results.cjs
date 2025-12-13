#!/usr/bin/env node
/**
 * GUARDRAIL: Anti-Simulação de Auditoria
 * 
 * Propósito: Garantir que arquivos *-ack.json e *-result.json em ai-tasks/events/
 * apenas existam se forem provenientes do GEMINI externo (com prova de origem).
 * 
 * Regras:
 * 1. Nenhum arquivo *-ack*.json ou *-result*.json pode existir sem proof-of-origin.txt
 * 2. proof-of-origin.txt deve conter: data/hora, link do chat, hash SHA256
 * 3. Se violação detectada → processo FALHA (exit code 1)
 * 
 * Uso:
 * - Pre-commit hook (local)
 * - CI workflow (GitHub Actions)
 * - Validação manual: node scripts/guardrails/deny-local-audit-results.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EVENTS_DIR = path.join(__dirname, '../../ai-tasks/events');
const VIOLATIONS = [];

/**
 * Calcula hash SHA256 de um arquivo JSON
 */
function calculateHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

/**
 * Verifica se proof-of-origin.txt é válido
 */
function validateProofOfOrigin(proofPath, resultHash) {
  if (!fs.existsSync(proofPath)) {
    return { valid: false, reason: 'proof-of-origin.txt não existe' };
  }

  const content = fs.readFileSync(proofPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());

  // Validar estrutura mínima
  const hasDate = lines.some(l => l.match(/data|hora|timestamp/i));
  const hasLink = lines.some(l => l.match(/https?:\/\//));
  const hasHash = lines.some(l => l.includes(resultHash));

  if (!hasDate) {
    return { valid: false, reason: 'falta data/hora no proof-of-origin.txt' };
  }
  if (!hasLink) {
    return { valid: false, reason: 'falta link do chat externo no proof-of-origin.txt' };
  }
  if (!hasHash) {
    return { valid: false, reason: `hash SHA256 não corresponde: esperado ${resultHash}` };
  }

  return { valid: true };
}

/**
 * Busca recursivamente por arquivos ACK/RESULT em ai-tasks/events/
 */
function scanForViolations(dir = EVENTS_DIR) {
  if (!fs.existsSync(dir)) {
    console.log('✅ Diretório ai-tasks/events/ não existe (sem violações possíveis)');
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanForViolations(fullPath);
      continue;
    }

    // Detectar arquivos suspeitos
    const isSuspicious = 
      entry.name.match(/-ack.*\.json$/i) || 
      entry.name.match(/-result.*\.json$/i);

    if (!isSuspicious) continue;

    // Arquivo suspeito encontrado - verificar prova de origem
    const dirPath = path.dirname(fullPath);
    const proofPath = path.join(dirPath, 'proof-of-origin.txt');
    const fileHash = calculateHash(fullPath);

    if (!fileHash) {
      VIOLATIONS.push({
        file: fullPath,
        reason: 'Arquivo corrompido ou ilegível',
      });
      continue;
    }

    const validation = validateProofOfOrigin(proofPath, fileHash);

    if (!validation.valid) {
      VIOLATIONS.push({
        file: fullPath,
        reason: validation.reason,
        hash: fileHash,
      });
    }
  }
}

/**
 * Exibe relatório de violações
 */
function reportViolations() {
  if (VIOLATIONS.length === 0) {
    console.log('✅ GUARDRAIL PASSOU: Nenhuma violação detectada\n');
    console.log('   Todos os arquivos *-ack*.json e *-result*.json têm proof-of-origin.txt válido');
    console.log('   ou não existem arquivos suspeitos.\n');
    return true;
  }

  console.error('\n❌ GUARDRAIL FALHOU: Violações de segregação detectadas\n');
  console.error('   REGRA VIOLADA: Arquivos *-ack*.json ou *-result*.json sem prova de origem válida\n');
  
  VIOLATIONS.forEach((v, idx) => {
    console.error(`   ${idx + 1}. ${path.relative(process.cwd(), v.file)}`);
    console.error(`      Motivo: ${v.reason}`);
    if (v.hash) {
      console.error(`      Hash: ${v.hash}`);
    }
    console.error('');
  });

  console.error('🔧 COMO CORRIGIR:\n');
  console.error('   1. Se o arquivo foi criado localmente (simulação), DELETE-O:');
  console.error('      Remove-Item "caminho/do/arquivo.json"\n');
  console.error('   2. Se o arquivo veio do GEMINI externo, crie proof-of-origin.txt:');
  console.error('      echo "Data: 2025-12-13 10:30" > proof-of-origin.txt');
  console.error('      echo "Link: https://chat.openai.com/share/abc123" >> proof-of-origin.txt');
  console.error('      echo "Hash: [hash_sha256_do_json]" >> proof-of-origin.txt\n');
  console.error('   3. Commit apenas se tiver evidência verificável de origem externa.\n');

  return false;
}

/**
 * Execução principal
 */
function main() {
  console.log('🛡️  GUARDRAIL: Verificando segregação Executor/GEMINI...\n');
  
  scanForViolations();
  const passed = reportViolations();

  process.exit(passed ? 0 : 1);
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { scanForViolations, validateProofOfOrigin, calculateHash };
