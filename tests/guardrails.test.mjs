/**
 * TESTES: Guardrails de Segregação
 *
 * Validar que deny-local-audit-results.js detecta corretamente
 * arquivos ACK/RESULT sem proof-of-origin.txt
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DIR = path.join(__dirname, '../test-temp-events');
const GUARDRAIL_SCRIPT = path.join(
  __dirname,
  '../scripts/guardrails/deny-local-audit-results.js'
);

describe('Guardrail Anti-Simulação', () => {
  beforeEach(() => {
    // Criar diretório temporário para testes
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    // Limpar diretório temporário
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('deve PASSAR quando não há arquivos ACK/RESULT', () => {
    // Criar arquivo normal (não suspeito)
    fs.writeFileSync(path.join(TEST_DIR, 'normal-file.json'), '{}');

    // Executar guardrail (deve passar)
    const exitCode = runGuardrail();
    expect(exitCode).toBe(0);
  });

  it('deve FALHAR quando há RESULT sem proof-of-origin.txt', () => {
    // Criar arquivo RESULT sem prova de origem
    const resultPath = path.join(TEST_DIR, 'product-audit-result.json');
    fs.writeFileSync(resultPath, JSON.stringify({ verdict: 'APPROVED' }));

    // Executar guardrail (deve falhar)
    const exitCode = runGuardrail();
    expect(exitCode).toBe(1);
  });

  it('deve FALHAR quando há ACK sem proof-of-origin.txt', () => {
    // Criar arquivo ACK sem prova de origem
    const ackPath = path.join(TEST_DIR, 'audit-ack-PR_28.json');
    fs.writeFileSync(ackPath, JSON.stringify({ status: 'acknowledged' }));

    // Executar guardrail (deve falhar)
    const exitCode = runGuardrail();
    expect(exitCode).toBe(1);
  });

  it('deve FALHAR quando proof-of-origin.txt está incompleto (falta hash)', () => {
    // Criar RESULT
    const resultPath = path.join(TEST_DIR, 'product-audit-result.json');
    const content = JSON.stringify({ verdict: 'APPROVED' });
    fs.writeFileSync(resultPath, content);

    // Criar proof-of-origin sem hash
    const proofPath = path.join(TEST_DIR, 'proof-of-origin.txt');
    fs.writeFileSync(
      proofPath,
      `
Data: 2025-12-13 10:30
Link: https://chat.openai.com/share/abc123
    `.trim()
    );

    // Executar guardrail (deve falhar)
    const exitCode = runGuardrail();
    expect(exitCode).toBe(1);
  });

  it('deve FALHAR quando proof-of-origin.txt tem hash errado', () => {
    // Criar RESULT
    const resultPath = path.join(TEST_DIR, 'product-audit-result.json');
    const content = JSON.stringify({ verdict: 'APPROVED' });
    fs.writeFileSync(resultPath, content);

    // Criar proof-of-origin com hash incorreto
    const proofPath = path.join(TEST_DIR, 'proof-of-origin.txt');
    fs.writeFileSync(
      proofPath,
      `
Data: 2025-12-13 10:30
Link: https://chat.openai.com/share/abc123
Hash: wronghash123
    `.trim()
    );

    // Executar guardrail (deve falhar)
    const exitCode = runGuardrail();
    expect(exitCode).toBe(1);
  });

  it('deve PASSAR quando proof-of-origin.txt está completo e correto', () => {
    // Criar RESULT
    const resultPath = path.join(TEST_DIR, 'product-audit-result.json');
    const content = JSON.stringify({ verdict: 'APPROVED' });
    fs.writeFileSync(resultPath, content);

    // Calcular hash correto
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    // Criar proof-of-origin completo
    const proofPath = path.join(TEST_DIR, 'proof-of-origin.txt');
    fs.writeFileSync(
      proofPath,
      `
Data: 2025-12-13 10:30
Link: https://chat.openai.com/share/abc123
Hash: ${hash}
Autor: Test User
    `.trim()
    );

    // Executar guardrail (deve passar)
    const exitCode = runGuardrail();
    expect(exitCode).toBe(0);
  });

  it('deve detectar múltiplas violações', () => {
    // Criar dois RESULTs sem prova
    fs.writeFileSync(path.join(TEST_DIR, 'audit-result-1.json'), '{}');
    fs.writeFileSync(path.join(TEST_DIR, 'audit-result-2.json'), '{}');

    // Executar guardrail (deve falhar)
    const exitCode = runGuardrail();
    expect(exitCode).toBe(1);
  });
});

/**
 * Helper: Executar guardrail e retornar exit code
 */
function runGuardrail() {
  try {
    // Simular ai-tasks/events/ apontando para TEST_DIR
    const testEventsDir = path.join(__dirname, '../ai-tasks');
    if (!fs.existsSync(testEventsDir)) {
      fs.mkdirSync(testEventsDir, { recursive: true });
    }

    const eventsSymlink = path.join(testEventsDir, 'events');
    if (fs.existsSync(eventsSymlink)) {
      fs.rmSync(eventsSymlink, { recursive: true, force: true });
    }

    // Copiar arquivos de teste para ai-tasks/events/
    fs.mkdirSync(eventsSymlink, { recursive: true });
    const testFiles = fs.readdirSync(TEST_DIR);
    testFiles.forEach((file) => {
      fs.copyFileSync(path.join(TEST_DIR, file), path.join(eventsSymlink, file));
    });

    // Executar guardrail
    execSync(`node "${GUARDRAIL_SCRIPT}"`, { stdio: 'ignore' });
    return 0; // Passou
  } catch (error) {
    return error.status || 1; // Falhou
  } finally {
    // Limpar symlink de teste
    const eventsSymlink = path.join(__dirname, '../ai-tasks/events');
    if (fs.existsSync(eventsSymlink)) {
      fs.rmSync(eventsSymlink, { recursive: true, force: true });
    }
  }
}
