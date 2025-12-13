#!/usr/bin/env node

/**
 * GEMINI SYSTEM REVIEW
 * 
 * Auditoria geral do sistema a cada 2 semanas
 * Gera relatório de saúde e recomendações
 * 
 * USO:
 *   node system-review.cjs
 * 
 * SAÍDA:
 *   /ai-tasks/logs/system-review-{timestamp}.json
 *   /ai-tasks/logs/system-review-{timestamp}.md (relatório)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOGS_DIR = path.join(__dirname, '../../ai-tasks/logs');
const PROJECT_ROOT = path.join(__dirname, '../../');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Executa auditoria geral do sistema
 */
function systemReview() {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  console.log(`[GEMINI SYSTEM REVIEW] Iniciando auditoria geral...`);

  try {
    const report = {
      timestamp,
      sections: {},
    };

    // 1. Status de Testes
    report.sections.tests = reviewTests();

    // 2. Cobertura de Código
    report.sections.coverage = reviewCoverage();

    // 3. Segurança (npm audit)
    report.sections.security = reviewSecurity();

    // 4. Build Status
    report.sections.build = reviewBuild();

    // 5. Linting
    report.sections.linting = reviewLinting();

    // 6. Histórico de Execução
    report.sections.taskHistory = reviewTaskHistory();

    // 7. Performance
    report.sections.performance = reviewPerformance();

    // Calcula score geral
    report.overallScore = calculateOverallScore(report.sections);
    report.status = report.overallScore >= 85 ? '✅ SAUDÁVEL' : '⚠️ ATENÇÃO';
    report.duration = `${Date.now() - startTime}ms`;

    // Salva relatório JSON
    const jsonLogFile = path.join(LOGS_DIR, `system-review-${Date.now()}.json`);
    fs.writeFileSync(jsonLogFile, JSON.stringify(report, null, 2));

    // Gera relatório markdown
    const mdReport = generateMarkdownReport(report);
    const mdLogFile = path.join(LOGS_DIR, `system-review-${Date.now()}.md`);
    fs.writeFileSync(mdLogFile, mdReport);

    console.log(`\n✅ AUDITORIA CONCLUÍDA`);
    console.log(`Status Geral: ${report.status}`);
    console.log(`Score: ${report.overallScore}/100`);
    console.log(`JSON: ${jsonLogFile}`);
    console.log(`Markdown: ${mdLogFile}`);

    return report;

  } catch (error) {
    console.error(`❌ ERRO NA AUDITORIA: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Revisa status de testes
 */
function reviewTests() {
  try {
    const result = execSync('npm test -- --run 2>&1', { cwd: PROJECT_ROOT, encoding: 'utf-8' });
    const passedMatch = result.match(/(\d+) passed/);
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;

    return {
      status: passed > 0 ? 'PASSANDO' : 'FALHOS',
      score: passed > 0 ? 90 : 0,
      details: `${passed} testes passando`,
    };
  } catch {
    return {
      status: 'ERRO',
      score: 0,
      details: 'Não foi possível executar testes',
    };
  }
}

/**
 * Revisa cobertura de código
 */
function reviewCoverage() {
  try {
    const coverageFile = path.join(PROJECT_ROOT, 'coverage/coverage-final.json');
    if (!fs.existsSync(coverageFile)) {
      return {
        status: 'NÃO DISPONÍVEL',
        score: 50,
        details: 'Coverage report não encontrado',
      };
    }

    const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf-8'));
    const lineCoverage = coverage.total?.lines?.pct || 0;

    return {
      status: lineCoverage >= 80 ? 'EXCELENTE' : 'ADEQUADO',
      score: Math.min(100, lineCoverage),
      details: `${lineCoverage}% coverage (target: ≥80%)`,
    };
  } catch {
    return {
      status: 'ERRO',
      score: 0,
      details: 'Erro ao ler coverage',
    };
  }
}

/**
 * Revisa segurança
 */
function reviewSecurity() {
  try {
    execSync('npm audit --audit-level=moderate 2>&1', { cwd: PROJECT_ROOT });
    return {
      status: 'SEGURO',
      score: 100,
      details: 'Sem vulnerabilidades encontradas',
    };
  } catch {
    return {
      status: 'VULNERABILIDADES ENCONTRADAS',
      score: 30,
      details: 'Executar: npm audit e corrigir',
    };
  }
}

/**
 * Revisa status de build
 */
function reviewBuild() {
  try {
    execSync('npm run build 2>&1', { cwd: PROJECT_ROOT, timeout: 60000 });
    return {
      status: 'BUILD OK',
      score: 95,
      details: 'Build produção compilada com sucesso',
    };
  } catch {
    return {
      status: 'BUILD FALHO',
      score: 0,
      details: 'Erro na compilação de produção',
    };
  }
}

/**
 * Revisa linting
 */
function reviewLinting() {
  try {
    execSync('npm run lint 2>&1', { cwd: PROJECT_ROOT });
    return {
      status: 'LINT OK',
      score: 100,
      details: 'Sem warnings de linting',
    };
  } catch {
    return {
      status: 'LINT WARNINGS',
      score: 70,
      details: 'Executar: npm run lint e corrigir',
    };
  }
}

/**
 * Revisa histórico de tasks
 */
function reviewTaskHistory() {
  try {
    const historyDir = path.join(PROJECT_ROOT, 'ai-tasks/history');
    if (!fs.existsSync(historyDir)) {
      return {
        status: 'SEM HISTÓRICO',
        score: 50,
        details: 'Nenhuma task foi executada ainda',
      };
    }

    const files = fs.readdirSync(historyDir);
    const taskCount = files.length;

    return {
      status: taskCount > 0 ? 'ATIVO' : 'INATIVO',
      score: Math.min(100, 50 + taskCount * 5),
      details: `${taskCount} tasks registradas no histórico`,
    };
  } catch {
    return {
      status: 'ERRO',
      score: 0,
      details: 'Erro ao ler histórico de tasks',
    };
  }
}

/**
 * Revisa performance
 */
function reviewPerformance() {
  return {
    status: 'MONITORADO',
    score: 85,
    details: 'Performance será auditada após lançamento',
  };
}

/**
 * Calcula score geral
 */
function calculateOverallScore(sections) {
  const weights = {
    tests: 25,
    coverage: 20,
    security: 25,
    build: 15,
    linting: 10,
    taskHistory: 5,
  };

  let totalScore = 0;
  Object.entries(sections).forEach(([key, section]) => {
    totalScore += (section.score || 0) * (weights[key] || 1);
  });

  return Math.round(totalScore / Object.keys(weights).reduce((a, b) => a + weights[b], 0));
}

/**
 * Gera relatório em markdown
 */
function generateMarkdownReport(report) {
  const sections = report.sections;

  return `# 🔍 GEMINI SYSTEM REVIEW — ${report.timestamp.split('T')[0]}

**Status Geral**: ${report.status}  
**Score**: ${report.overallScore}/100  
**Duração**: ${report.duration}

---

## 📊 Relatório Detalhado

### ✅ Testes
- Status: ${sections.tests.status}
- Score: ${sections.tests.score}
- ${sections.tests.details}

### 📈 Cobertura de Código
- Status: ${sections.coverage.status}
- Score: ${sections.coverage.score}
- ${sections.coverage.details}

### 🔒 Segurança
- Status: ${sections.security.status}
- Score: ${sections.security.score}
- ${sections.security.details}

### 🏗️ Build
- Status: ${sections.build.status}
- Score: ${sections.build.score}
- ${sections.build.details}

### 🎯 Linting
- Status: ${sections.linting.status}
- Score: ${sections.linting.score}
- ${sections.linting.details}

### 📋 Histórico de Tasks
- Status: ${sections.taskHistory.status}
- Score: ${sections.taskHistory.score}
- ${sections.taskHistory.details}

### ⚡ Performance
- Status: ${sections.performance.status}
- Score: ${sections.performance.score}
- ${sections.performance.details}

---

## 🎯 Recomendações

${report.overallScore >= 85 
  ? '✅ Sistema está saudável. Continue a execução normalmente.'
  : '⚠️ Existem áreas que necessitam atenção. Priorize as recomendações acima.'}

---

*Auditoria gerada por Gemini em ${report.timestamp}*
`;
}

// EXECUÇÃO
if (require.main === module) {
  systemReview();
}

module.exports = { systemReview };
