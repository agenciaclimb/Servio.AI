#!/usr/bin/env node
/**
 * TRUTH-GATE - Validação de Segurança e Anti-Padrões
 * 
 * Detecta automaticamente padrões perigosos antes do deploy:
 * - Bypass de autenticação
 * - Mocks ativos em produção
 * - Secrets hardcoded
 * - Endpoints fake/test
 * - Debug flags ativas
 * - TODO/FIXME críticos
 * 
 * Status de saída:
 * - 0: PASSED (seguro para deploy)
 * - 1: FAILED (bloqueio obrigatório)
 * 
 * Uso: node scripts/truth-gate.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
  // Diretórios a verificar
  dirs: [
    'components',
    'services',
    'hooks',
    'contexts',
    'src',
    'backend/src',
  ],
  
  // Extensões de arquivo
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
  
  // Diretórios a ignorar
  ignore: [
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage',
    '.git',
    'tests',
    '__tests__',
    '*.test.*',
    '*.spec.*',
  ],
};

// ============================================================================
// PADRÕES DE DETECÇÃO
// ============================================================================

const CRITICAL_PATTERNS = [
  {
    name: 'Auth Bypass',
    pattern: /(bypassAuth|skipAuth|auth\.skip|noAuth:\s*true)/i,
    severity: 'HIGH',
    message: 'Detectado bypass de autenticação',
  },
  {
    name: 'Hardcoded Secret',
    pattern: /(apiKey|api_key|secret|password|token)\s*[:=]\s*['"`][A-Za-z0-9_\-]{20,}/i,
    severity: 'HIGH',
    message: 'Possível secret hardcoded (não em .env)',
  },
  {
    name: 'SQL Injection Risk',
    pattern: /(DROP\s+TABLE|DELETE\s+FROM.*WHERE.*1\s*=\s*1|TRUNCATE\s+TABLE)/i,
    severity: 'HIGH',
    message: 'Operação SQL perigosa detectada',
  },
  {
    name: 'Mock Active in Production',
    pattern: /USE_MOCK\s*=\s*true/i,
    severity: 'HIGH',
    message: 'Mock ativado - não permitido em produção',
  },
  {
    name: 'Fake/Test Endpoint',
    pattern: /(\/api\/fake|\/api\/mock|\/api\/test(?!s\/))/i,
    severity: 'MEDIUM',
    message: 'Endpoint fake/mock/test detectado',
  },
  {
    name: 'Debug Flag Active',
    pattern: /(DEBUG\s*=\s*true|VERBOSE\s*=\s*true|TRACE_ENABLED\s*=\s*true)/i,
    severity: 'MEDIUM',
    message: 'Flag de debug ativa',
  },
  {
    name: 'Critical TODO',
    pattern: /(TODO:\s*(SECURITY|AUTH|FIX|URGENT|CRITICAL)|FIXME:\s*(SECURITY|AUTH))/i,
    severity: 'MEDIUM',
    message: 'TODO/FIXME crítico encontrado',
  },
  {
    name: 'Console.error Production',
    pattern: /console\.(error|warn)\s*\([^)]*production/i,
    severity: 'LOW',
    message: 'Console.error com referência a produção',
  },
];

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function isIgnored(filePath) {
  return CONFIG.ignore.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function hasValidExtension(filePath) {
  return CONFIG.extensions.some(ext => filePath.endsWith(ext));
}

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (isIgnored(filePath)) return;
    
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (hasValidExtension(filePath)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function scanFile(filePath, patterns) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];
  
  patterns.forEach(({ name, pattern, severity, message }) => {
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        violations.push({
          file: path.relative(ROOT, filePath),
          line: index + 1,
          code: line.trim(),
          rule: name,
          severity,
          message,
        });
      }
    });
  });
  
  return violations;
}

// ============================================================================
// EXECUÇÃO PRINCIPAL
// ============================================================================

function main() {
  console.log('🔍 TRUTH-GATE - Iniciando validação...\n');
  
  const allFiles = [];
  CONFIG.dirs.forEach(dir => {
    const dirPath = path.join(ROOT, dir);
    const files = getAllFiles(dirPath);
    allFiles.push(...files);
  });
  
  console.log(`📁 Arquivos a verificar: ${allFiles.length}\n`);
  
  const allViolations = [];
  
  allFiles.forEach(file => {
    const violations = scanFile(file, CRITICAL_PATTERNS);
    allViolations.push(...violations);
  });
  
  // ============================================================================
  // REPORTE DE RESULTADOS
  // ============================================================================
  
  if (allViolations.length === 0) {
    console.log('✅ TRUTH-GATE: PASSED\n');
    console.log('Nenhuma violação detectada. Seguro para deploy.\n');
    process.exit(0);
  }
  
  // Agrupar por severidade
  const high = allViolations.filter(v => v.severity === 'HIGH');
  const medium = allViolations.filter(v => v.severity === 'MEDIUM');
  const low = allViolations.filter(v => v.severity === 'LOW');
  
  console.log('❌ TRUTH-GATE: FAILED\n');
  console.log(`Total de violações: ${allViolations.length}\n`);
  
  if (high.length > 0) {
    console.log('🚨 SEVERIDADE HIGH (Bloqueio Obrigatório):\n');
    high.forEach(v => {
      console.log(`  Arquivo: ${v.file}:${v.line}`);
      console.log(`  Regra: ${v.rule}`);
      console.log(`  Código: ${v.code}`);
      console.log(`  Motivo: ${v.message}\n`);
    });
  }
  
  if (medium.length > 0) {
    console.log('⚠️  SEVERIDADE MEDIUM (Requer Revisão):\n');
    medium.forEach(v => {
      console.log(`  Arquivo: ${v.file}:${v.line}`);
      console.log(`  Regra: ${v.rule}`);
      console.log(`  Código: ${v.code}`);
      console.log(`  Motivo: ${v.message}\n`);
    });
  }
  
  if (low.length > 0) {
    console.log('ℹ️  SEVERIDADE LOW (Aviso):\n');
    low.forEach(v => {
      console.log(`  Arquivo: ${v.file}:${v.line}`);
      console.log(`  Regra: ${v.rule}`);
      console.log(`  Motivo: ${v.message}\n`);
    });
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('AÇÃO OBRIGATÓRIA:\n');
  
  if (high.length > 0) {
    console.log('🚨 BLOQUEIO IMEDIATO:');
    console.log('   - Corrija todas as violações HIGH antes de prosseguir');
    console.log('   - Deploy está BLOQUEADO até resolução\n');
  }
  
  if (medium.length > 0) {
    console.log('⚠️  REVISÃO NECESSÁRIA:');
    console.log('   - Revise violações MEDIUM');
    console.log('   - Obtenha aprovação humana se necessário\n');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Falhar se houver violações HIGH ou MEDIUM
  if (high.length > 0 || medium.length > 0) {
    process.exit(1);
  }
  
  // Se apenas LOW, avisar mas passar
  console.log('⚠️  Violações LOW detectadas, mas deploy pode prosseguir.\n');
  process.exit(0);
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

try {
  main();
} catch (error) {
  console.error('💥 TRUTH-GATE: ERRO INTERNO\n');
  console.error(error.message);
  console.error('\nStacktrace:', error.stack);
  process.exit(1);
}
