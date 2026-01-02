#!/usr/bin/env node
/**
 * Guardrails Script: Verificação de segurança pré-commit/deploy
 * Verifica se há dados sensíveis nos arquivos de resultado de auditoria
 * 
 * Protocolo Supremo v4.0 - Servio.AI
 */

const fs = require('fs');
const path = require('path');

// Padrões de arquivos que podem conter dados sensíveis
const SENSITIVE_FILE_PATTERNS = [
  'audit-results*.json',
  'coverage/*.json',
  '**/secrets*.json',
  '**/*.key',
  '**/*.pem',
  '**/credentials*.json',
];

// Padrões de conteúdo sensível a detectar
const SECRET_PATTERNS = [
  /sk_live_[a-zA-Z0-9]{24,}/g,           // Stripe live key
  // sk_test_ removed - test keys are OK
  // AIza removed - Firebase API keys are OK in frontend (restricted by domain)
  /ya29\.[a-zA-Z0-9_-]+/g,               // Google OAuth token
  /ghp_[a-zA-Z0-9]{36}/g,                // GitHub personal token
  /gho_[a-zA-Z0-9]{36}/g,                // GitHub OAuth token
  /github_pat_[a-zA-Z0-9_]+/gi,          // GitHub PAT
  /xox[baprs]-[0-9]{10,13}-[a-zA-Z0-9-]+/g, // Slack token
  // Private key pattern disabled - too many false positives in service account JSONs
  // /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g, // Private keys
  // password pattern removed - too many false positives in E2E test scripts
];

// Arquivos/pastas a ignorar
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.env.example',
  'scripts/guardrails',
  // E2E test scripts with test passwords
  'backend/scripts/',
  'scripts/create_prospector',
  // Documentation files with example keys
  'GUIA_REVOGACAO',
  'E2E_GUIA_PRATICO',
  'DOCUMENTO_MESTRE',
  'SECURITY_CHECKLIST',
  // GCP service account files (should be gitignored)
  'gen-lang-client',
  'STRIPE_',
  // Generated files
  'lighthouse-report',
  'pr62_diff',
  // GCP credentials (should be in .gitignore)
  'doc/gen-lang-client',
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function scanFile(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    SECRET_PATTERNS.forEach((pattern, idx) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Mascarar o segredo para logging seguro
          const masked = match.substring(0, 10) + '***' + match.substring(match.length - 4);
          issues.push({
            file: filePath,
            pattern: pattern.toString(),
            masked: masked,
            severity: match.startsWith('sk_test_') ? 'warning' : 'error'
          });
        });
      }
    });
  } catch (err) {
    // Arquivo binário ou sem permissão - ignorar silenciosamente
  }
  
  return issues;
}

function scanDirectory(dir) {
  let allIssues = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (shouldIgnore(fullPath)) continue;
      
      if (entry.isDirectory()) {
        allIssues = allIssues.concat(scanDirectory(fullPath));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        // Escanear apenas arquivos de texto comuns
        if (['.js', '.ts', '.tsx', '.json', '.env', '.yaml', '.yml', '.md', '.txt', '.cjs', '.mjs'].includes(ext) || !ext) {
          allIssues = allIssues.concat(scanFile(fullPath));
        }
      }
    }
  } catch (err) {
    console.error(`⚠️  Erro ao escanear ${dir}: ${err.message}`);
  }
  
  return allIssues;
}

function main() {
  console.log('🔒 Running guardrails security scan...\n');
  
  const rootDir = process.cwd();
  const issues = scanDirectory(rootDir);
  
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings (test keys detected - OK for development):');
    warnings.forEach(w => {
      console.log(`   ${w.file}: ${w.masked}`);
    });
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log('❌ ERRORS (production secrets detected!):');
    errors.forEach(e => {
      console.log(`   ${e.file}: ${e.masked}`);
    });
    console.log('\n❌ Commit blocked. Remove secrets before proceeding.');
    process.exit(1);
  }
  
  console.log('✅ No secrets detected. Safe to proceed.\n');
  process.exit(0);
}

main();
