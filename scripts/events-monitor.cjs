#!/usr/bin/env node
/**
 * EVENT MONITOR - Monitoramento de Eventos do Protocolo
 * 
 * Propósito: Monitorar REQUEST/ACK/RESULT do protocolo SUPREMO v4.0
 * e gerar alertas quando timeouts ou fallbacks ocorrerem.
 * 
 * Gera:
 * - ai-tasks/events/process-alert.md (alertas para usuário)
 * - ai-tasks/events/event-log.jsonl (log estruturado)
 * - ai-tasks/events/executor-state.json (estado atual do executor)
 * 
 * Uso: npm run events:monitor
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '../ai-tasks/events');
const EVENT_LOG = path.join(EVENTS_DIR, 'event-log.jsonl');
const ALERT_FILE = path.join(EVENTS_DIR, 'process-alert.md');
const STATE_FILE = path.join(EVENTS_DIR, 'executor-state.json');

// Timeouts (em milissegundos)
const TIMEOUT_ACK = 5 * 60 * 1000;      // 5 minutos para ACK
const TIMEOUT_RESULT = 30 * 60 * 1000;  // 30 minutos para RESULT

/**
 * Lê eventos do log JSONL
 */
function readEvents() {
  if (!fs.existsSync(EVENT_LOG)) {
    return [];
  }

  const content = fs.readFileSync(EVENT_LOG, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  
  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (error) {
      console.warn(`⚠️  Linha inválida no event-log.jsonl: ${line}`);
      return null;
    }
  }).filter(Boolean);
}

/**
 * Adiciona evento ao log
 */
function appendEvent(event) {
  if (!fs.existsSync(EVENTS_DIR)) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
  }

  const eventWithTimestamp = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  fs.appendFileSync(EVENT_LOG, JSON.stringify(eventWithTimestamp) + '\n', 'utf8');
}

/**
 * Atualiza estado do executor
 */
function updateExecutorState(state) {
  if (!fs.existsSync(EVENTS_DIR)) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
  }

  const stateWithTimestamp = {
    ...state,
    lastUpdate: new Date().toISOString(),
  };

  fs.writeFileSync(STATE_FILE, JSON.stringify(stateWithTimestamp, null, 2), 'utf8');
}

/**
 * Gera alerta em Markdown
 */
function generateAlert(alert) {
  if (!fs.existsSync(EVENTS_DIR)) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
  }

  const markdown = `# 🚨 ALERTA DE PROCESSO

**Data**: ${new Date().toISOString()}  
**Tipo**: ${alert.type}  
**Severidade**: ${alert.severity}

## Descrição

${alert.description}

## Detalhes

${alert.details}

## Ações Recomendadas

${alert.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

---

_Este alerta foi gerado automaticamente pelo Event Monitor._
`;

  fs.writeFileSync(ALERT_FILE, markdown, 'utf8');
  console.log(`\n🚨 Alerta gerado: ${ALERT_FILE}\n`);
}

/**
 * Verifica timeouts de REQUEST pendentes
 */
function checkTimeouts() {
  const events = readEvents();
  const now = Date.now();
  
  // Agrupar eventos por taskId
  const tasks = {};
  
  events.forEach(event => {
    const taskId = event.taskId || event.type?.split('-')[0];
    if (!taskId) return;

    if (!tasks[taskId]) {
      tasks[taskId] = { request: null, ack: null, result: null };
    }

    if (event.type?.includes('request')) {
      tasks[taskId].request = event;
    } else if (event.type?.includes('ack')) {
      tasks[taskId].ack = event;
    } else if (event.type?.includes('result')) {
      tasks[taskId].result = event;
    }
  });

  // Verificar timeouts
  const alerts = [];

  Object.entries(tasks).forEach(([taskId, task]) => {
    if (!task.request) return;

    const requestTime = new Date(task.request.timestamp).getTime();
    const elapsed = now - requestTime;

    // Timeout de ACK
    if (!task.ack && elapsed > TIMEOUT_ACK) {
      alerts.push({
        type: 'TIMEOUT_ACK',
        severity: 'WARNING',
        taskId,
        description: `REQUEST "${taskId}" sem ACK após ${Math.round(elapsed / 60000)} minutos`,
        details: `**REQUEST**: ${task.request.timestamp}\n**Timeout**: ${TIMEOUT_ACK / 60000} minutos\n**Status**: GEMINI pode não ter recebido o REQUEST`,
        actions: [
          'Verificar se o REQUEST foi enviado ao GEMINI externo',
          'Reenviar prompt se necessário',
          'Aguardar mais tempo ou executar fallback',
        ],
      });
    }

    // Timeout de RESULT
    if (task.ack && !task.result && elapsed > TIMEOUT_RESULT) {
      alerts.push({
        type: 'TIMEOUT_RESULT',
        severity: 'ERROR',
        taskId,
        description: `REQUEST "${taskId}" sem RESULT após ${Math.round(elapsed / 60000)} minutos`,
        details: `**REQUEST**: ${task.request.timestamp}\n**ACK**: ${task.ack.timestamp}\n**Timeout**: ${TIMEOUT_RESULT / 60000} minutos\n**Status**: GEMINI confirmou mas não entregou RESULT`,
        actions: [
          'Verificar se o GEMINI completou a análise',
          'Coletar RESULT do chat externo e colar em JSON',
          'Se RESULT não disponível, executar fallback (procedimento manual)',
        ],
      });
    }
  });

  return alerts;
}

/**
 * Monitora eventos e gera alertas
 */
function monitor() {
  console.log('🔍 Event Monitor - Verificando protocolo SUPREMO v4.0...\n');

  const alerts = checkTimeouts();

  if (alerts.length === 0) {
    console.log('✅ Nenhum timeout detectado');
    
    updateExecutorState({
      status: 'OK',
      message: 'Todos os REQUESTs estão dentro do prazo ou completos',
      alerts: [],
    });

    // Limpar alerta anterior se existir
    if (fs.existsSync(ALERT_FILE)) {
      fs.unlinkSync(ALERT_FILE);
    }

    return;
  }

  // Gerar alertas
  alerts.forEach(alert => {
    console.warn(`⚠️  ${alert.type}: ${alert.description}`);
    
    // Registrar no event log
    appendEvent({
      type: 'timeout-detected',
      taskId: alert.taskId,
      timeoutType: alert.type,
      severity: alert.severity,
    });
  });

  // Gerar arquivo de alerta com todos os timeouts
  const combinedAlert = {
    type: 'MULTIPLE_TIMEOUTS',
    severity: alerts.some(a => a.severity === 'ERROR') ? 'ERROR' : 'WARNING',
    description: `${alerts.length} timeout(s) detectado(s)`,
    details: alerts.map(a => `- **${a.taskId}**: ${a.description}`).join('\n'),
    actions: [
      'Revisar REQUESTs pendentes abaixo',
      'Tomar ações específicas para cada timeout',
      'Executar fallback se necessário',
    ],
  };

  generateAlert(combinedAlert);

  updateExecutorState({
    status: 'TIMEOUT',
    message: `${alerts.length} timeout(s) detectado(s)`,
    alerts: alerts.map(a => ({ type: a.type, taskId: a.taskId })),
  });
}

/**
 * Exibe estado atual
 */
function showStatus() {
  const events = readEvents();
  
  console.log('\n📊 ESTADO ATUAL DO PROTOCOLO\n');
  console.log(`Total de eventos: ${events.length}`);
  
  const eventTypes = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  console.log('\nEventos por tipo:');
  Object.entries(eventTypes).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });

  if (fs.existsSync(STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    console.log(`\nStatus executor: ${state.status}`);
    console.log(`Última atualização: ${state.lastUpdate}`);
  }

  console.log('');
}

/**
 * Execução principal
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'monitor';

  switch (command) {
    case 'monitor':
      monitor();
      break;
    case 'status':
      showStatus();
      break;
    case 'clear':
      if (fs.existsSync(ALERT_FILE)) fs.unlinkSync(ALERT_FILE);
      if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
      console.log('✅ Alertas e estado limpos');
      break;
    default:
      console.log('Uso: npm run events:monitor [monitor|status|clear]');
      process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { monitor, checkTimeouts, readEvents, appendEvent };
