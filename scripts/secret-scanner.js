#!/usr/bin/env node

/**
 * Pre-commit Secret Scanner
 * Detecta API keys e secrets em arquivos staged antes do commit
 */

import { execSync } from 'child_process';
import fs from 'fs';

// Patterns para detectar API keys comuns
const PATTERNS = [
  { name: 'Google API Key', pattern: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'Stripe Live Key', pattern: /sk_live_[0-9a-zA-Z]{24,}/g },
  { name: 'Stripe Test Key', pattern: /sk_test_[0-9a-zA-Z]{24,}/g },
  { name: 'Stripe Webhook Secret', pattern: /whsec_[0-9a-zA-Z]{32,}/g },
  { name: 'Google OAuth', pattern: /[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/g },
  { name: 'Google OAuth Access Token', pattern: /ya29\.[0-9A-Za-z_-]{100,}/g },
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g },
  { name: 'GitHub Personal Access Token', pattern: /ghp_[0-9a-zA-Z]{36}/g },
  { name: 'GitHub OAuth Access Token', pattern: /gho_[0-9a-zA-Z]{36}/g },
  { name: 'GitHub Fine-grained PAT', pattern: /github_pat_[0-9a-zA-Z_]{82}/g },
  { name: 'Firebase API Key', pattern: /AIzaSy[0-9A-Za-z_-]{33}/g },
  { name: 'Gemini API Key', pattern: /AIzaSy[A-Za-z0-9_-]{33}/g },
];

// Exceções (arquivos/linhas que podem ter false positives)
const EXCEPTIONS = [
  '.gitignore',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.env.example',
  '.env.production.example',
  'lighthouse-report',
  'firebaseConfig.ts', // Firebase public API key (seguro no frontend)
  'DOCUMENTO_MESTRE_SERVIO_AI.md', // Incident reports com chaves [REDACTED]
  'PROGRESSO_PROSPECCAO_FASE1.md', // Histórico de desenvolvimento
  'GUIA_REVOGACAO_CHAVES.md', // Guia de incidente com chaves para revogar
];

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    return output.trim().split('\n').filter(f => f && fs.existsSync(f));
  } catch {
    return [];
  }
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  for (const { name, pattern } of PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      // Skip se for exceção conhecida
      const isException = EXCEPTIONS.some(exc => filePath.includes(exc));
      const isFirebasePublicKey = filePath.includes('firebaseConfig') && name === 'Firebase API Key';
      
      if (!isException && !isFirebasePublicKey) {
        findings.push({
          file: filePath,
          type: name,
          match: match[0].substring(0, 20) + '...',
        });
      }
    }
  }

  return findings;
}

function main() {
  console.log('\n🔒 Running secret scanner...\n');

  const files = getStagedFiles();
  if (files.length === 0) {
    console.log('✅ No files to scan.');
    return 0;
  }

  let allFindings = [];
  for (const file of files) {
    const findings = scanFile(file);
    allFindings = allFindings.concat(findings);
  }

  if (allFindings.length > 0) {
    console.error('╔════════════════════════════════════════════════════════╗');
    console.error('║                                                        ║');
    console.error('║   🚨 COMMIT BLOQUEADO POR SEGURANÇA 🚨                ║');
    console.error('║                                                        ║');
    console.error('╚════════════════════════════════════════════════════════╝\n');

    console.error('❌ SECRETS DETECTADOS:\n');
    allFindings.forEach(({ file, type, match }) => {
      console.error(`   Arquivo: ${file}`);
      console.error(`   Tipo: ${type}`);
      console.error(`   Preview: ${match}`);
      console.error('');
    });

    console.error('AÇÕES NECESSÁRIAS:');
    console.error('  1. Remova os secrets dos arquivos');
    console.error('  2. Use variáveis de ambiente (.env.local)');
    console.error('  3. Adicione arquivos ao .gitignore');
    console.error('  4. Verifique se .env está no .gitignore\n');
    console.error('Para sobrescrever (NÃO RECOMENDADO):');
    console.error('  git commit --no-verify\n');

    return 1;
  }

  console.log('✅ No secrets detected. Safe to commit.\n');
  return 0;
}

process.exit(main());
