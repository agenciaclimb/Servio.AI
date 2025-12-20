/* eslint-disable @typescript-eslint/no-unused-vars */
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
import * as crypto from 'crypto';

const TEST_DIR = path.join(__dirname, '../test-temp-events');
const GUARDRAIL_SCRIPT = path.join(__dirname, '../scripts/guardrails/deny-local-audit-results.js');

describe('Guardrail Anti-Simulação', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('deve PASSAR quando não há arquivos ACK/RESULT', () => {
    fs.writeFileSync(path.join(TEST_DIR, 'normal-file.json'), '{}');
    const exitCode = runGuardrail();
    expect(exitCode).toBe(0);
  });

  it('deve FALHAR quando há RESULT sem proof-of-origin.txt', () => {
    const resultPath = path.join(TEST_DIR, 'product-audit-result.json');
    fs.writeFileSync(resultPath, JSON.stringify({ verdict: 'APPROVED' }));
    const exitCode = runGuardrail();
    expect(exitCode).toBe(1);
  });

  it('deve FALHAR quando há ACK sem proof-of-origin.txt', () => {
    const ackPath = path.join(TEST_DIR, 'audit-ack-PR_28.json');
    fs.writeFileSync(ackPath, JSON.stringify({ status: 'acknowledged' }));
    const exitCode = runGuardrail();
    expect(exitCode).toBe(1);
  });

  it('deve FALHAR quando proof-of-origin.txt está incompleto (falta hash)', () => {
    const resultPath = path.join(TEST_DIR, 'product-audit-result.json');
    const content = JSON.stringify({ verdict: 'APPROVED' });
    fs.writeFileSync(resultPath, content);

    const proofPath = path.join(TEST_DIR, 'proof-of-origin.txt');
    fs.writeFileSync(
      proofPath,
      `
Data: 2025-12-13 10:30
Link: https://chat.openai.com/share/abc123
      `.trim()
    );

    const exitCode = runGuardrail();
    expect(exitCode).toBe(1);
  });

  it('deve FALHAR quando proof-of-origin.txt tem hash errado', () => {
    const resultPath = path.join(TEST_DIR, 'product-audit-result.json');
    const content = JSON.stringify({ verdict: 'APPROVED' });
    fs.writeFileSync(resultPath, content);

    const proofPath = path.join(TEST_DIR, 'proof-of-origin.txt');
    fs.writeFileSync(
      proofPath,
      `
Data: 2025-12-13 10:30
Link: https://chat.openai.com/share/abc123
Hash: wronghash123
      `.trim()
    );

    const exitCode = runGuardrail();
    expect(exitCode).toBe(1);
  });

  it('deve PASSAR quando proof-of-origin.txt está completo e correto', () => {
    const resultPath = path.join(TEST_DIR, 'product-audit-result.json');
    const content = JSON.stringify({ verdict: 'APPROVED' });
    fs.writeFileSync(resultPath, content);

    const hash = crypto.createHash('sha256').update(content).digest('hex');

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

    const exitCode = runGuardrail();
    expect(exitCode).toBe(0);
  });

  it('deve detectar múltiplas violações', () => {
    fs.writeFileSync(path.join(TEST_DIR, 'audit-result-1.json'), '{}');
    fs.writeFileSync(path.join(TEST_DIR, 'audit-result-2.json'), '{}');
    const exitCode = runGuardrail();
    expect(exitCode).toBe(1);
  });
});

function runGuardrail(): number {
  try {
    const testEventsDir = path.join(__dirname, '../ai-tasks');
    if (!fs.existsSync(testEventsDir)) {
      fs.mkdirSync(testEventsDir, { recursive: true });
    }

    const eventsDir = path.join(testEventsDir, 'events');
    if (fs.existsSync(eventsDir)) {
      fs.rmSync(eventsDir, { recursive: true, force: true });
    }

    fs.mkdirSync(eventsDir, { recursive: true });
    const testFiles = fs.readdirSync(TEST_DIR);
    testFiles.forEach(file => {
      fs.copyFileSync(path.join(TEST_DIR, file), path.join(eventsDir, file));
    });

    execSync(`node "${GUARDRAIL_SCRIPT}"`, { stdio: 'ignore' });
    return 0;
  } catch (error: unknown) {
    const status = (error as { status?: number } | undefined)?.status;
    return status || 1;
  } finally {
    const eventsDir = path.join(__dirname, '../ai-tasks/events');
    if (fs.existsSync(eventsDir)) {
      fs.rmSync(eventsDir, { recursive: true, force: true });
    }
  }
}
