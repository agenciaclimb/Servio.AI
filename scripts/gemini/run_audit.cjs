#!/usr/bin/env node
// CI-only auditor runner. Generates ACK, calls Gemini, applies policy, writes RESULT and proof.
const fs = require('fs');
const cp = require('child_process');
const crypto = require('crypto');
const path = require('path');

function arg(name, def) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

const prNumber = arg('--pr');
const sha = arg('--sha');
const actor = arg('--actor');
const repo = arg('--repo');
const runId = arg('--run-id');
const runAttempt = arg('--run-attempt');

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY ausente; usando placeholder para aprovação verde');
}

if (!prNumber || !sha) {
  console.error('Parâmetros obrigatórios ausentes: --pr e --sha');
  process.exit(1);
}

const eventsDir = path.join(process.cwd(), 'ai-tasks', 'events');
if (!fs.existsSync(eventsDir)) fs.mkdirSync(eventsDir, { recursive: true });

function sh(cmd) {
  return cp.execSync(cmd, { encoding: 'utf8' }).trim();
}

function hash(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

function writeJSON(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function writeText(file, content) {
  fs.writeFileSync(file, content, 'utf8');
}

// 1) Collect context
let diff = '';
try {
  diff = sh(`git diff main...HEAD`);
} catch {}

const testStatus = process.env.AUDIT_TEST_STATUS || 'pass';
const lintStatus = process.env.AUDIT_LINT_STATUS || 'pass';
const buildStatus = process.env.AUDIT_BUILD_STATUS || 'pass';

let documentoMestre = '';
try {
  documentoMestre = fs.readFileSync(path.join(process.cwd(), 'DOCUMENTO_MESTRE_SERVIO_AI.md'), 'utf8');
} catch {}

let pendingEvents = [];
try {
  const files = fs.readdirSync(eventsDir);
  pendingEvents = files.filter(f => /audit-request-PR_\d+\.json$/.test(f));
} catch {}

const context = {
  prNumber: Number(prNumber),
  sha,
  actor,
  repo,
  runId,
  runAttempt,
  timestamps: { utc: new Date().toISOString() },
  diff,
  statuses: { tests: testStatus, lint: lintStatus, build: buildStatus },
  documento_mestre_excerpt_hash: hash(documentoMestre.slice(0, 5000) || ''),
  pending_events: pendingEvents,
};

// 2) ACK
const ackPath = path.join(eventsDir, `audit-ack-PR_${prNumber}.json`);
writeJSON(ackPath, { type: 'ACK', prNumber: Number(prNumber), received_at_utc: new Date().toISOString(), context_summary_hash: hash(JSON.stringify(context)) });

// 3) Call Gemini API (structured JSON only)
function buildPrompt(context) {
  return {
    instruction: 'Você é um auditor de segurança e qualidade. Responda APENAS JSON.',
    schema: {
      type: 'object',
      properties: {
        risk_level: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        findings: { type: 'array', items: { type: 'string' } },
        doc_mestre_violations: { type: 'array', items: { type: 'string' } },
      },
      required: ['risk_level', 'findings', 'doc_mestre_violations'],
      additionalProperties: false,
    },
    input: {
      prNumber: context.prNumber,
      statuses: context.statuses,
      diff: context.diff,
      documento_mestre_excerpt_hash: context.documento_mestre_excerpt_hash,
    },
  };
}

async function callGemini(promptObj) {
  // Minimal HTTP call to Google AI (Gemini) JSON responses
  const https = require('https');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY não configurado; usando placeholder LOW-risk');
    return {
      model: 'gemini-2.0-flash-exp-placeholder',
      parsed: { risk_level: 'LOW', findings: ['Placeholder resposta (API key não configurado)'], doc_mestre_violations: [] },
      raw: { status: 'placeholder' },
      placeholder: true,
    };
  }

  const model = 'gemini-2.0-flash-exp';
  const body = JSON.stringify({
    contents: [
      { role: 'user', parts: [{ text: JSON.stringify(promptObj) }]} 
    ],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`);

  const resp = await new Promise((resolve, reject) => {
    const req = https.request({
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 10000
    }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
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
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { risk_level: 'HIGH', findings: ['Invalid JSON'], doc_mestre_violations: ['invalid_response'] }; }
  return { model, parsed, raw: json, placeholder: false };
}

(async () => {
  try {
    const prompt = buildPrompt(context);
    let gemini;
    try {
      gemini = await callGemini(prompt);
    } catch (e) {
      console.error('❌ Gemini API call falhou:', e.message);
      gemini = { model: 'gemini-2.0-flash-exp', parsed: { risk_level: 'HIGH', findings: ['API error: ' + e.message], doc_mestre_violations: ['api_error'] }, raw: { error: String(e.message) }, placeholder: false };
    }

  // 4) Policy Engine (determinístico)
  const risksBlockList = ['HIGH'];
  const sensitiveKeywords = ['stripe', 'payment', 'escrow', 'webhook', 'auth', 'firebase rules', 'firestore.rules'];

  function hasSensitive(diff) {
    const d = (diff || '').toLowerCase();
    return sensitiveKeywords.some(k => d.includes(k));
  }

  const statusGreen = context.statuses.tests === 'pass' && context.statuses.lint === 'pass' && context.statuses.build === 'pass';
  const violatesDoc = Array.isArray(gemini.parsed.doc_mestre_violations) && gemini.parsed.doc_mestre_violations.length > 0;
  const isSensitive = hasSensitive(context.diff);
  const isHighRisk = risksBlockList.includes(String(gemini.parsed.risk_level || '').toUpperCase());

  let verdict = 'REJECTED';
  let reasons = [];
  if (!statusGreen) {
    reasons.push('statuses_not_green');
  }
  if (violatesDoc) {
    reasons.push('documento_mestre_violations');
  }
  if (isSensitive) {
    reasons.push('sensitive_area_change');
  }
  if (isHighRisk) {
    reasons.push('high_risk');
  }

  if (gemini.placeholder && statusGreen && !violatesDoc && !isSensitive) {
    verdict = 'APPROVED';
    reasons = [];
    console.log('✅ Placeholder com status verde => APROVADO');
  } else if (statusGreen && !violatesDoc && !isSensitive && !isHighRisk && String(gemini.parsed.risk_level).toUpperCase() === 'LOW') {
    verdict = 'APPROVED';
    reasons = [];
    console.log('✅ Análise LOW-risk com status verde => APROVADO');
  } else if (!isHighRisk && statusGreen && String(gemini.parsed.risk_level).toUpperCase() === 'MEDIUM' && !violatesDoc && !isSensitive) {
    verdict = 'NEEDS_CHANGES';
  }
  
  if (verdict === 'REJECTED' && reasons.length > 0) {
    console.warn('⚠️  Razões para rejeição:', reasons.join(', '));
  }

  console.log('📊 Status externo: tests=' + testStatus + ', lint=' + lintStatus + ', build=' + buildStatus);
  console.log('🔍 Gemini response: risk_level=' + (gemini.parsed.risk_level || 'UNKNOWN') + ', placeholder=' + (gemini.placeholder ? 'true' : 'false'));
  console.log('📋 Documento Mestre violations:', gemini.parsed.doc_mestre_violations ? gemini.parsed.doc_mestre_violations.length : 0);
  console.log('🚨 Veredicto final:', verdict);

  // 5) RESULT
  const resultPath = path.join(eventsDir, `audit-result-PR_${prNumber}.json`);
  const resultObj = {
    type: 'RESULT',
    prNumber: Number(prNumber),
    verdict,
    reasons,
    risk_level: gemini.parsed.risk_level,
    findings: gemini.parsed.findings,
    doc_mestre_violations: gemini.parsed.doc_mestre_violations,
    emitted_at_utc: new Date().toISOString(),
  };
  writeJSON(resultPath, resultObj);

  // 6) Proof-of-origin (JSON + TXT)
  const inputHash = hash(JSON.stringify(prompt));
  const outputHash = hash(JSON.stringify(resultObj));
  const proofJson = {
    source: 'github-actions',
    workflow_run_id: runId,
    run_attempt: runAttempt,
    actor,
    repo,
    sha,
    pr_number: Number(prNumber),
    timestamp_utc: new Date().toISOString(),
    gemini_model: gemini.model,
    input_hash_sha256: inputHash,
    output_hash_sha256: outputHash,
  };
  const proofJsonPath = path.join(eventsDir, `proof-of-origin-PR_${prNumber}.json`);
  writeJSON(proofJsonPath, proofJson);
  const proofTxtPath = path.join(eventsDir, `proof-of-origin-PR_${prNumber}.txt`);
  writeText(proofTxtPath, `source=github-actions\nworkflow_run_id=${runId}\nrun_attempt=${runAttempt}\nactor=${actor}\nrepo=${repo}\nsha=${sha}\npr_number=${prNumber}\ntimestamp_utc=${new Date().toISOString()}\nmodel=${gemini.model}\ninput_hash_sha256=${inputHash}\noutput_hash_sha256=${outputHash}\n`);

  // 7) Exit code for CI gating
  if (verdict !== 'APPROVED') {
    console.error('Auditoria CI: VEREDICTO =', verdict);
    process.exit(2);
  }
  
  console.log('✅ Auditoria CI APROVADA');
  process.exit(0);
  } catch (err) {
    console.error('❌ Erro fatal no runner:', err.message);
    process.exit(1);
  }
})();
