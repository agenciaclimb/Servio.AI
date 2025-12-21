/*
 * Guardrail: impede simulação local de resultados de auditoria.
 *
 * Regras (alinhadas aos testes):
 * - Se NÃO houver arquivos ACK/RESULT em ai-tasks/events → exit 0
 * - Se houver ACK/RESULT:
 *   - Sem proof-of-origin.txt → exit 1
 *   - proof-of-origin.txt sem Data/Link/Hash → exit 1
 *   - Hash deve ser sha256 do conteúdo concatenado (ordenado) dos arquivos ACK/RESULT → senão exit 1
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function getRepoRoot() {
  return path.resolve(__dirname, '..', '..');
}

function getEventsDir() {
  return path.join(getRepoRoot(), 'ai-tasks', 'events');
}

function isAckOrResultFile(fileName) {
  const lower = fileName.toLowerCase();
  return lower.includes('ack') || lower.includes('result');
}

function parseProof(proofText) {
  const lines = proofText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const dataLine = lines.find(l => l.toLowerCase().startsWith('data:'));
  const linkLine = lines.find(l => l.toLowerCase().startsWith('link:'));
  const hashLine = lines.find(l => l.toLowerCase().startsWith('hash:'));

  return {
    hasData: Boolean(dataLine),
    hasLink: Boolean(linkLine),
    hash: hashLine ? hashLine.split(':').slice(1).join(':').trim() : '',
  };
}

function main() {
  const eventsDir = getEventsDir();

  if (!fs.existsSync(eventsDir)) {
    // Sem pasta de eventos = nada para validar
    process.exit(0);
  }

  const allFiles = fs
    .readdirSync(eventsDir)
    .filter(f => !f.endsWith('.tmp') && !f.startsWith('.'));

  const flaggedFiles = allFiles.filter(isAckOrResultFile);
  if (flaggedFiles.length === 0) {
    process.exit(0);
  }

  const proofPath = path.join(eventsDir, 'proof-of-origin.txt');
  if (!fs.existsSync(proofPath)) {
    process.exit(1);
  }

  const proofText = fs.readFileSync(proofPath, 'utf8');
  const proof = parseProof(proofText);
  if (!proof.hasData || !proof.hasLink || !proof.hash) {
    process.exit(1);
  }

  const concatenated = flaggedFiles
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .map(f => fs.readFileSync(path.join(eventsDir, f), 'utf8'))
    .join('');

  const computed = sha256(concatenated);
  if (computed !== proof.hash) {
    process.exit(1);
  }

  process.exit(0);
}

main();
