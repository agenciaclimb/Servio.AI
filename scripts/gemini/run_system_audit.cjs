#!/usr/bin/env node
// Weekly system audit runner (non-blocking)
const fs = require('fs');
const cp = require('child_process');
const crypto = require('crypto');
const path = require('path');

function arg(name, def) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

const weekId = arg('--week');
const repo = arg('--repo');
const runId = arg('--run-id');

if (!weekId || !repo) {
  console.error('Parâmetros obrigatórios ausentes: --week e --repo');
  process.exit(1);
}

const auditsDir = path.join(process.cwd(), 'ai-tasks', 'system-audits');
if (!fs.existsSync(auditsDir)) fs.mkdirSync(auditsDir, { recursive: true });

function sh(cmd) {
  return cp.execSync(cmd, { encoding: 'utf8' }).trim();
}

function hash(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

function writeJSON(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function writeMarkdown(file, content) {
  fs.writeFileSync(file, content, 'utf8');
}

// Collect system metrics
const metrics = {
  timestamp_utc: new Date().toISOString(),
  week_id: weekId,
  repo,
  run_id: runId,
};

// Git stats
try {
  metrics.total_commits = Number(sh('git rev-list --count HEAD'));
  metrics.contributors = sh('git shortlog -sn --all --no-merges | wc -l').trim();
  metrics.branches = sh('git branch -r | wc -l').trim();
} catch (e) {
  metrics.git_error = e.message;
}

// File stats
try {
  const srcFiles = sh('find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l').trim();
  const testFiles = sh('find tests -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l').trim();
  metrics.source_files = Number(srcFiles);
  metrics.test_files = Number(testFiles);
} catch (e) {
  metrics.file_stats_error = e.message;
}

// Security scan (basic)
const securityIssues = [];
try {
  const secrets = sh('git log --all -p | grep -iE "(api[_-]?key|secret|password|token)" | head -10').split('\n').filter(Boolean);
  if (secrets.length > 0) {
    securityIssues.push({ type: 'potential_secret_leak', count: secrets.length, sample: secrets[0] });
  }
} catch {}

metrics.security_issues = securityIssues;

// Call Gemini for deep analysis (optional)
async function callGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY não configurado; auditoria básica apenas');
    return { model: 'placeholder', analysis: 'API key não disponível', risk_level: 'UNKNOWN' };
  }

  const https = require('https');
  const prompt = {
    instruction: 'Você é um auditor de sistema. Analise as métricas e responda JSON.',
    schema: {
      type: 'object',
      properties: {
        risk_level: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        findings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
      required: ['risk_level', 'findings', 'recommendations'],
    },
    input: metrics,
  };

  const model = 'gemini-2.0-flash-exp';
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: JSON.stringify(prompt) }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });

  const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`);

  try {
    const resp = await new Promise((resolve, reject) => {
      const req = https.request({
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname + url.search,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 15000,
      }, (res) => {
        let chunks = '';
        res.on('data', d => (chunks += d));
        res.on('end', () => resolve({ status: res.statusCode, body: chunks }));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.abort(); reject(new Error('Gemini timeout')); });
      req.write(body);
      req.end();
    });

    if (resp.status !== 200) throw new Error(`Gemini HTTP ${resp.status}`);
    const json = JSON.parse(resp.body);
    const text = (((json || {}).candidates || [])[0] || {}).content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(text);
    return { model, analysis: parsed };
  } catch (e) {
    console.error('❌ Gemini call failed:', e.message);
    return { model: 'error', analysis: { risk_level: 'UNKNOWN', findings: ['API error'], recommendations: [] } };
  }
}

(async () => {
  const geminiResult = await callGemini();

  const report = {
    type: 'SYSTEM_AUDIT',
    week_id: weekId,
    timestamp_utc: new Date().toISOString(),
    metrics,
    gemini: geminiResult,
    summary: {
      risk_level: geminiResult.analysis.risk_level || 'UNKNOWN',
      total_findings: (geminiResult.analysis.findings || []).length,
      total_recommendations: (geminiResult.analysis.recommendations || []).length,
    },
  };

  const reportPath = path.join(auditsDir, `system-audit-${weekId}.json`);
  writeJSON(reportPath, report);

  const mdContent = `# System Audit Report - ${weekId}

**Generated**: ${new Date().toISOString()}  
**Repository**: ${repo}

## Metrics

- **Total commits**: ${metrics.total_commits || 'N/A'}
- **Contributors**: ${metrics.contributors || 'N/A'}
- **Branches**: ${metrics.branches || 'N/A'}
- **Source files**: ${metrics.source_files || 'N/A'}
- **Test files**: ${metrics.test_files || 'N/A'}

## Security Issues

${metrics.security_issues.length > 0 ? JSON.stringify(metrics.security_issues, null, 2) : 'None detected'}

## Gemini Analysis

**Risk Level**: ${geminiResult.analysis.risk_level || 'UNKNOWN'}

### Findings

${(geminiResult.analysis.findings || []).map((f, i) => `${i + 1}. ${f}`).join('\n') || 'None'}

### Recommendations

${(geminiResult.analysis.recommendations || []).map((r, i) => `${i + 1}. ${r}`).join('\n') || 'None'}

---

*Report generated by Gemini System Audit (CI)*
`;

  const mdPath = path.join(auditsDir, `system-audit-${weekId}.md`);
  writeMarkdown(mdPath, mdContent);

  console.log('✅ System audit completo:', weekId);
  console.log('📊 Risk level:', report.summary.risk_level);
  console.log('🔍 Findings:', report.summary.total_findings);
  console.log('💡 Recommendations:', report.summary.total_recommendations);
})();
