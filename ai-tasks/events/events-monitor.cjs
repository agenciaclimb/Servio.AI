#!/usr/bin/env node
/**
 * Event Monitor (Hardened)
 * - Polling a cada 10s
 * - Timeout ACK: 15 min
 * - Timeout RESULT: 60 min
 * - Atualiza process-alert.md, event-log.jsonl, executor-state.json
 * - NÃO cria ACK/RESULT
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname);
const ROOT_EVENTS_DIR = path.join(process.cwd(), 'ai-tasks', 'events');
const EVENT_LOG = path.join(ROOT_EVENTS_DIR, 'event-log.jsonl');
const ALERT_FILE = path.join(ROOT_EVENTS_DIR, 'process-alert.md');
const STATE_FILE = path.join(ROOT_EVENTS_DIR, 'executor-state.json');

const POLL_MS = 10_000;
const ACK_TIMEOUT_MS = 15 * 60 * 1000;
const RESULT_TIMEOUT_MS = 60 * 60 * 1000;

function ensureFiles() {
  if (!fs.existsSync(ROOT_EVENTS_DIR)) fs.mkdirSync(ROOT_EVENTS_DIR, { recursive: true });
  if (!fs.existsSync(EVENT_LOG)) fs.writeFileSync(EVENT_LOG, '', 'utf8');
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ blocked: true, reason: 'AWAITING_RESULT', pending_prs: [] }, null, 2));
  }
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function appendEvent(event) {
  const line = JSON.stringify({ ...event, timestamp: new Date().toISOString() }) + '\n';
  fs.appendFileSync(EVENT_LOG, line);
}

function writeAlert(lines) {
  const md = ['# 🚨 ALERTA DE PROCESSO', '', ...lines].join('\n');
  fs.writeFileSync(ALERT_FILE, md, 'utf8');
}

function updateState(state) {
  const s = { ...state, lastUpdate: new Date().toISOString() };
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}

function scanRequests() {
  const files = fs.readdirSync(ROOT_EVENTS_DIR).filter(f => f.startsWith('audit-request-PR_') && f.endsWith('.json'));
  return files.map(f => ({ file: path.join(ROOT_EVENTS_DIR, f), pr: Number((f.match(/PR_(\d+)/)||[])[1]) }));
}

function findAckFor(pr) {
  const f = path.join(ROOT_EVENTS_DIR, `audit-ack-PR_${pr}.json`);
  return fs.existsSync(f) ? f : null;
}

function findResultFor(pr) {
  const f = path.join(ROOT_EVENTS_DIR, `audit-result-PR_${pr}.json`);
  return fs.existsSync(f) ? f : null;
}

function checkTimeouts() {
  const reqs = scanRequests();
  const now = Date.now();
  const alerts = [];

  reqs.forEach(({ file, pr }) => {
    const req = readJson(file);
    if (!req) return;

    const reqTs = new Date(req.timestamp || fs.statSync(file).mtime.toISOString()).getTime();
    const ackFile = findAckFor(pr);
    const resFile = findResultFor(pr);

    if (!ackFile && now - reqTs > ACK_TIMEOUT_MS) {
      alerts.push(`- PR #${pr}: REQUEST sem ACK > 15min`);
      appendEvent({ event: 'timeout-ack', pr, sinceMinutes: Math.round((now - reqTs)/60000) });
    }

    if (ackFile && !resFile) {
      const ackTs = new Date(readJson(ackFile)?.timestamp || fs.statSync(ackFile).mtime.toISOString()).getTime();
      if (now - ackTs > RESULT_TIMEOUT_MS) {
        alerts.push(`- PR #${pr}: ACK sem RESULT > 60min`);
        appendEvent({ event: 'timeout-result', pr, sinceMinutes: Math.round((now - ackTs)/60000) });
      }
    }
  });

  if (alerts.length) {
    writeAlert(['**Time-outs detectados:**', '', ...alerts]);
    updateState({ blocked: true, reason: 'TIMEOUT', pending_prs: reqs.map(r => r.pr) });
  } else {
    updateState({ blocked: true, reason: 'AWAITING_RESULT', pending_prs: reqs.map(r => r.pr) });
  }
}

function loop() {
  ensureFiles();
  checkTimeouts();
  setTimeout(loop, POLL_MS);
}

function main() {
  ensureFiles();
  const cmd = process.argv[2] || 'run';
  if (cmd === 'status') {
    checkTimeouts();
    console.log('Status atualizado. Veja executor-state.json e process-alert.md.');
    return;
  }
  if (cmd === 'clear') {
    if (fs.existsSync(ALERT_FILE)) fs.unlinkSync(ALERT_FILE);
    appendEvent({ event: 'alerts-cleared' });
    console.log('Alertas limpos.');
    return;
  }
  console.log('🔍 Monitorando eventos... (Ctrl+C para parar)');
  loop();
}

if (require.main === module) main();
