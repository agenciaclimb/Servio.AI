#!/usr/bin/env node

/**
 * PROTOCOLO SUPREMO v4.0 — CLI Central
 * 
 * Script unificado para operações do Protocolo Supremo:
 * - Inicialização de tasks
 * - Auditoria de PRs
 * - Correções automáticas
 * - Dashboard de métricas
 * - Status de PRs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const DOCUMENTO_MESTRE = path.join(__dirname, '..', 'DOCUMENTO_MESTRE_SERVIO_AI.md');
const TASKS_DIR = path.join(__dirname, '..', 'ai-tasks');
const BACKEND_DIR = path.join(__dirname, '..', 'backend');

// ==========================================
// UTILITIES
// ==========================================

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    title: '\x1b[35m'    // Magenta
  };
  const reset = '\x1b[0m';
  const icon = {
    info: 'ℹ',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    title: '🛡️'
  };
  
  console.log(`${colors[type]}${icon[type]} ${message}${reset}`);
}

function exec(command, options = {}) {
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return output;
  } catch (error) {
    if (!options.ignoreError) {
      log(`Erro ao executar: ${command}`, 'error');
      log(error.message, 'error');
      process.exit(1);
    }
    return null;
  }
}

function readDocumentoMestre() {
  if (!fs.existsSync(DOCUMENTO_MESTRE)) {
    log('Documento Mestre não encontrado!', 'error');
    process.exit(1);
  }
  return fs.readFileSync(DOCUMENTO_MESTRE, 'utf8');
}

function extractStatusFromDoc(content) {
  const statusMatch = content.match(/## 🔄 Status Atual do Sistema.*?\n([\s\S]*?)\n\n/);
  if (!statusMatch) return null;
  
  return {
    raw: statusMatch[1],
    timestamp: new Date().toISOString()
  };
}

// ==========================================
// COMANDOS
// ==========================================

function init() {
  log('Inicializando Protocolo Supremo v4.0...', 'title');
  
  // Verificar estrutura de pastas
  log('Verificando estrutura de diretórios...', 'info');
  const dirs = [TASKS_DIR, path.join(TASKS_DIR, 'validation')];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Criado: ${dir}`, 'success');
    }
  });
  
  // Verificar Documento Mestre
  log('Verificando Documento Mestre...', 'info');
  const doc = readDocumentoMestre();
  if (doc.includes('PROTOCOLO SUPREMO')) {
    log('Documento Mestre validado ✓', 'success');
  }
  
  // Verificar Git
  log('Verificando repositório Git...', 'info');
  const branch = exec('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();
  log(`Branch atual: ${branch}`, 'info');
  
  // Verificar status
  const gitStatus = exec('git status --porcelain', { silent: true });
  const uncommittedFiles = gitStatus ? gitStatus.split('\n').filter(l => l.trim()).length : 0;
  
  if (uncommittedFiles > 0) {
    log(`⚠️  ${uncommittedFiles} arquivos não-commitados detectados`, 'warning');
  } else {
    log('Repositório limpo ✓', 'success');
  }
  
  log('Protocolo Supremo inicializado com sucesso!', 'success');
}

function audit() {
  log('Executando auditoria do Protocolo Supremo...', 'title');
  
  const doc = readDocumentoMestre();
  const status = extractStatusFromDoc(doc);
  
  if (status) {
    log('Status extraído do Documento Mestre:', 'info');
    console.log(status.raw);
  }
  
  // Verificar testes backend
  log('Executando testes backend...', 'info');
  exec('npm run test:backend', { cwd: process.cwd() });
  
  log('Auditoria concluída!', 'success');
}

function fix() {
  log('Executando correções automáticas...', 'title');
  
  // 1. Verificar e corrigir vulnerabilidades NPM
  log('Verificando vulnerabilidades NPM...', 'info');
  exec('npm audit fix', { ignoreError: true });
  
  // 2. Rodar lint fix
  log('Executando lint:fix...', 'info');
  exec('npm run lint:fix', { ignoreError: true });
  
  // 3. Rodar format
  log('Formatando código...', 'info');
  exec('npm run format', { ignoreError: true });
  
  log('Correções aplicadas!', 'success');
}

function testBackend() {
  log('Executando testes backend completos...', 'title');
  
  // Rodar testes do backend
  exec('npm run test:backend');
  
  log('Testes backend concluídos!', 'success');
}

function dashboard() {
  log('Dashboard do Protocolo Supremo v4.0', 'title');
  
  const doc = readDocumentoMestre();
  
  // Extrair métricas
  const prMatch = doc.match(/\*\*PR atual\*\*\s*\|\s*#?(\d+)/);
  const taskMatch = doc.match(/\*\*Task atual\*\*\s*\|\s*([\d.]+)/);
  const branchMatch = doc.match(/\*\*Branch em execução\*\*\s*\|\s*`([^`]+)`/);
  const syncMatch = doc.match(/\*\*Fluxo sincronizado\*\*\s*\|\s*(✅\s*SIM|❌\s*NÃO)/);
  
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║     PROTOCOLO SUPREMO v4.0 - DASHBOARD    ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  console.log(`📋 PR Atual:           ${prMatch ? '#' + prMatch[1] : 'N/A'}`);
  console.log(`📌 Task Atual:         ${taskMatch ? taskMatch[1] : 'N/A'}`);
  console.log(`🌿 Branch:             ${branchMatch ? branchMatch[1] : 'N/A'}`);
  console.log(`🔄 Sincronizado:       ${syncMatch ? syncMatch[1] : 'N/A'}`);
  
  // Git status
  const branch = exec('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();
  const uncommitted = exec('git status --porcelain', { silent: true });
  const uncommittedCount = uncommitted ? uncommitted.split('\n').filter(l => l.trim()).length : 0;
  
  console.log(`\n📊 Status Git:`);
  console.log(`   Branch ativa:       ${branch}`);
  console.log(`   Arquivos pendentes: ${uncommittedCount}`);
  
  // Package info
  const pkg = require(path.join(__dirname, '..', 'package.json'));
  console.log(`\n📦 Versão:             ${pkg.version || 'N/A'}`);
  
  console.log('\n✨ Use `npm run supremo:help` para ver todos os comandos\n');
}

function prStatus() {
  log('Verificando status de PRs...', 'title');
  
  // Listar PRs abertas (requer gh CLI)
  try {
    const prs = exec('gh pr list --state open', { silent: true, ignoreError: true });
    if (prs) {
      console.log('\n📋 PRs Abertas:\n');
      console.log(prs);
    } else {
      log('Nenhuma PR aberta ou gh CLI não disponível', 'info');
      log('Instale: https://cli.github.com/', 'info');
    }
  } catch (error) {
    log('gh CLI não disponível. Instale: https://cli.github.com/', 'warning');
  }
}

function help() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           PROTOCOLO SUPREMO v4.0 — COMANDOS CLI               ║
╚════════════════════════════════════════════════════════════════╝

COMANDOS DISPONÍVEIS:

  npm run supremo:init
    → Inicializa estrutura do Protocolo Supremo
    → Verifica pastas, Git, Documento Mestre
  
  npm run supremo:audit
    → Executa auditoria completa do sistema
    → Valida Documento Mestre + testes backend
  
  npm run supremo:fix
    → Aplica correções automáticas
    → npm audit fix + lint:fix + format
  
  npm run supremo:test-backend
    → Roda testes backend completos
    → npm run test:backend
  
  npm run supremo:dashboard
    → Exibe dashboard de métricas em tempo real
    → Status de PR, Task, Branch, Sincronização
  
  npm run supremo:pr-status
    → Lista PRs abertas (requer gh CLI)
    → Status de revisão e aprovação
  
  npm run supremo:help
    → Exibe esta ajuda

EXEMPLOS DE USO:

  # Iniciar novo ciclo
  npm run supremo:init
  
  # Verificar estado atual
  npm run supremo:dashboard
  
  # Corrigir problemas comuns
  npm run supremo:fix
  
  # Auditar antes de deploy
  npm run supremo:audit

DOCUMENTAÇÃO COMPLETA:
  DOCUMENTO_MESTRE_SERVIO_AI.md (linhas 5063-5332)

🛡️  Protocolo Supremo v4.0 — Desenvolvimento Assistido por IA
`);
}

// ==========================================
// MAIN
// ==========================================

function main() {
  const command = process.argv[2];
  
  const commands = {
    init,
    audit,
    fix,
    'test-backend': testBackend,
    dashboard,
    'pr-status': prStatus,
    help
  };
  
  if (!command || !commands[command]) {
    log('Comando inválido. Use: npm run supremo:help', 'error');
    process.exit(1);
  }
  
  commands[command]();
}

main();
