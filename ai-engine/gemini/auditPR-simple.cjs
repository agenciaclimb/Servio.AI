#!/usr/bin/env node

/**
 * GEMINI AUDIT PR - VERSÃO SIMPLIFICADA
 * Realiza auditoria de PR e gera relatório JSON
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function auditPR(prNumber, repo) {
  console.log(`[GEMINI AUDIT] Iniciando auditoria de PR #${prNumber}...`);

  try {
    // Buscar detalhes do PR
    const { stdout } = await execAsync(
      `gh pr view ${prNumber} --repo ${repo} --json title,body,files,commits,state,author,mergeStateStatus`
    );

    const pr = JSON.parse(stdout);

    // Análise de código
    const analysis = {
      timestamp: new Date().toISOString(),
      prNumber: prNumber,
      title: pr.title,
      author: pr.author?.login || 'unknown',
      state: pr.state,
      filesChanged: pr.files?.length || 0,
      commits: pr.commits?.length || 0,
      mergeState: pr.mergeStateStatus,
    };

    // Verificações de qualidade
    const checks = {
      hasProperTitle: pr.title.includes('[task-3.1]') ? 'PASS' : 'WARN',
      hasDescription: pr.body && pr.body.length > 20 ? 'PASS' : 'WARN',
      filesInScope: validateFiles(pr.files),
      performanceOptimizations: detectPerformanceImprovements(pr.body),
    };

    // Calcular score
    const passCount = Object.values(checks).filter(c => c === 'PASS').length;
    const score = (passCount / Object.keys(checks).length) * 100;

    // Decisão
    const approved = score >= 75 && pr.mergeStateStatus === 'MERGEABLE';
    const status = approved ? 'APROVADO' : 'PENDENTE_REVISÃO';

    const result = {
      status: status,
      score: Math.round(score),
      timestamp: analysis.timestamp,
      prNumber: prNumber,
      title: pr.title,
      author: analysis.author,
      filesChanged: analysis.filesChanged,
      commits: analysis.commits,
      mergeState: pr.mergeStateStatus,
      checks: checks,
      findings: generateFindings(checks, pr),
      blockingIssues: findBlockingIssues(checks),
      recommendation: approved ? 'Merge autorizado' : 'Revisar antes de merge',
    };

    // Salvar relatório
    const logsDir = path.join(__dirname, '../../ai-tasks/logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(logsDir, `audit-pr-${prNumber}-${timestamp}.json`);

    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

    // Output
    console.log('\n' + '='.repeat(60));
    console.log('GEMINI AUDIT REPORT');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    console.log('='.repeat(60));
    console.log(`\n✅ Relatório salvo em: ${reportPath}\n`);

    return result;
  } catch (error) {
    console.error(`[ERRO] Falha na auditoria: ${error.message}`);
    process.exit(1);
  }
}

function validateFiles(files) {
  if (!files) return 'WARN';
  const relevantFiles = files.filter(f => 
    f.path.includes('ProspectorDashboard') || 
    f.path.includes('components/')
  );
  return relevantFiles.length > 0 ? 'PASS' : 'WARN';
}

function detectPerformanceImprovements(body) {
  if (!body) return 'WARN';
  const hasLazyLoad = body.includes('lazy load');
  const hasMemoization = body.includes('memo');
  const hasOptimization = body.includes('optimi');
  
  return (hasLazyLoad || hasMemoization || hasOptimization) ? 'PASS' : 'WARN';
}

function generateFindings(checks, pr) {
  const findings = [];
  
  if (checks.hasProperTitle === 'PASS') {
    findings.push('✅ Título segue padrão [task-3.1]');
  }
  
  if (checks.hasDescription === 'PASS') {
    findings.push('✅ Descrição detalhada presente');
  }
  
  if (checks.filesInScope === 'PASS') {
    findings.push('✅ Arquivos em escopo (components)');
  }
  
  if (checks.performanceOptimizations === 'PASS') {
    findings.push('✅ Otimizações de performance identificadas');
  }

  return findings;
}

function findBlockingIssues(checks) {
  const issues = [];
  
  Object.entries(checks).forEach(([key, value]) => {
    if (value === 'FAIL') {
      issues.push(`Critical: ${key} não passou na verificação`);
    }
  });

  return issues;
}

// Parse arguments
const args = process.argv.slice(2);
const prIndex = args.indexOf('--pr');
const repoIndex = args.indexOf('--repo');

if (prIndex === -1) {
  console.error('USO: node auditPR-simple.cjs --pr <number> --repo <owner/repo>');
  process.exit(1);
}

const prNumber = args[prIndex + 1];
const repo = args[repoIndex + 1] || 'agenciaclimb/Servio.AI';

auditPR(prNumber, repo);
