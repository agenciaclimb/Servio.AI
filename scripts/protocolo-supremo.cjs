#!/usr/bin/env node
/* eslint-disable no-console */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  if (typeof result.status === 'number') return result.status;
  return 1;
}

function header(title) {
  console.log('');
  console.log('========================================');
  console.log(title);
  console.log('========================================');
  console.log('');
}

function repoRoot() {
  // scripts/protocolo-supremo.cjs → repo root
  return path.resolve(__dirname, '..');
}

function usage() {
  console.log('🔱 Protocolo Supremo V4 - CLI');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/protocolo-supremo.cjs <comando>');
  console.log('');
  console.log('Comandos:');
  console.log('  help           Mostra esta ajuda');
  console.log('  init           Valida doc mestre e orienta ciclo');
  console.log('  audit          Lint + build + testes + security');
  console.log('  fix            Prettier + ESLint --fix');
  console.log('  test-backend   Roda testes do backend');
  console.log('  dashboard      Mostra status local (branch, scripts)');
  console.log('  pr-status      Lista PRs abertas (via gh, se disponível)');
  console.log('');
  console.log('Atalhos npm (package.json):');
  console.log('  npm run supremo:help');
  console.log('  npm run supremo:init');
  console.log('  npm run supremo:audit');
  console.log('  npm run supremo:fix');
  console.log('  npm run supremo:test-backend');
  console.log('  npm run supremo:dashboard');
  console.log('  npm run supremo:pr-status');
}

function commandInit() {
  header('PROTOCOLO SUPREMO V4 — INIT');

  const root = repoRoot();
  const docMestre = path.join(root, 'DOCUMENTO_MESTRE_SERVIO_AI.md');

  if (!fs.existsSync(docMestre)) {
    console.error('❌ DOCUMENTO_MESTRE_SERVIO_AI.md não encontrado.');
    return 1;
  }

  console.log('1) Validando Documento Mestre...');
  const validateDocExit = run('npm', ['run', 'validate:doc-mestre']);
  if (validateDocExit !== 0) return validateDocExit;

  console.log('');
  console.log('2) Próximos passos (ciclo completo):');
  console.log('   - Gerar tasks:      npm run generate-tasks');
  console.log('   - Orquestrar tasks: npm run orchestrate-tasks');
  console.log('   - Validar:          npm run supremo:audit');
  console.log('');

  return 0;
}

function commandAudit() {
  header('PROTOCOLO SUPREMO V4 — AUDIT (GATES)');

  const steps = [
    { name: 'Lint', cmd: 'npm', args: ['run', 'lint'] },
    { name: 'Typecheck', cmd: 'npm', args: ['run', 'typecheck'] },
    { name: 'Build', cmd: 'npm', args: ['run', 'build'] },
    { name: 'Test (frontend)', cmd: 'npm', args: ['test'] },
    { name: 'Test (backend)', cmd: 'npm', args: ['run', 'test:backend'] },
    // Guardrails é gate determinístico para evitar simulação local
    { name: 'Guardrails', cmd: 'npm', args: ['run', 'guardrails:audit'] },
    { name: 'Security Audit', cmd: 'npm', args: ['run', 'security:audit'] },
  ];

  for (const step of steps) {
    console.log(`\n➡️  ${step.name}...`);
    const code = run(step.cmd, step.args);
    if (code !== 0) {
      console.error(`\n❌ Falhou em: ${step.name} (exit ${code})`);
      return code;
    }
  }

  console.log('\n✅ Auditoria completa OK.');
  return 0;
}

function commandFix() {
  header('PROTOCOLO SUPREMO V4 — FIX');

  const steps = [
    { name: 'Prettier', cmd: 'npm', args: ['run', 'format'] },
    { name: 'ESLint --fix', cmd: 'npm', args: ['run', 'lint:fix'] },
  ];

  for (const step of steps) {
    console.log(`\n➡️  ${step.name}...`);
    const code = run(step.cmd, step.args);
    if (code !== 0) {
      console.error(`\n❌ Falhou em: ${step.name} (exit ${code})`);
      return code;
    }
  }

  console.log('\n✅ Fix automático concluído.');
  return 0;
}

function commandTestBackend() {
  header('PROTOCOLO SUPREMO V4 — TEST BACKEND');
  return run('npm', ['run', 'test:backend']);
}

function commandDashboard() {
  header('PROTOCOLO SUPREMO V4 — DASHBOARD (LOCAL)');

  console.log(`Node: ${process.version}`);

  // git branch (best effort)
  const gitExit = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { stdio: 'pipe' });
  if (gitExit === 0) {
    const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: process.platform === 'win32',
    }).stdout.toString().trim();
    console.log(`Branch: ${branch}`);
  } else {
    console.log('Branch: (git indisponível)');
  }

  const guardrailCjs = path.join(repoRoot(), 'scripts', 'guardrails', 'deny-local-audit-results.cjs');
  const guardrailJs = path.join(repoRoot(), 'scripts', 'guardrails', 'deny-local-audit-results.js');
  console.log(`Guardrail (cjs): ${fs.existsSync(guardrailCjs) ? 'OK' : 'MISSING'}`);
  console.log(`Guardrail (js):  ${fs.existsSync(guardrailJs) ? 'OK' : 'MISSING'}`);

  const protocoloPath = path.join(repoRoot(), 'scripts', 'protocolo-supremo.cjs');
  console.log(`CLI: ${fs.existsSync(protocoloPath) ? 'OK' : 'MISSING'}`);

  return 0;
}

function commandPrStatus() {
  header('PROTOCOLO SUPREMO V4 — PR STATUS');
  console.log('Tentando listar PRs via GitHub CLI (gh)...');

  // Se gh não estiver instalado, retorna erro. Nesse caso, damos instrução.
  const code = run('gh', ['pr', 'list', '--state', 'open', '--limit', '50']);
  if (code !== 0) {
    console.log('');
    console.log('ℹ️  Não consegui rodar `gh pr list`.');
    console.log('   - Instale o GitHub CLI (gh) e autentique: `gh auth login`');
    console.log('   - Alternativa: use o GitHub web para ver PRs abertas.');
  }
  return code;
}

function main() {
  const command = process.argv[2] || 'help';

  switch (command) {
    case 'help':
      usage();
      return 0;
    case 'init':
      return commandInit();
    case 'audit':
      return commandAudit();
    case 'fix':
      return commandFix();
    case 'test-backend':
      return commandTestBackend();
    case 'dashboard':
      return commandDashboard();
    case 'pr-status':
      return commandPrStatus();
    default:
      console.error(`Comando desconhecido: ${command}`);
      usage();
      return 1;
  }
}

process.exit(main());
