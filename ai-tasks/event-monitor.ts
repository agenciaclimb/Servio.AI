import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AuditRequest {
  timestamp: string;
  pr_number: number;
  request_id: string;
  executor_status: string;
}

interface AuditAck {
  timestamp: string;
  pr_number: number;
  ack_type: string;
  status: string;
}

interface AuditResult {
  timestamp: string;
  pr_number: number;
  verdict: 'APPROVED' | 'REJECTED' | 'REVIEW_PENDING';
  executor_unblock: boolean;
}

interface ExecutorState {
  state: 'ready' | 'blocked';
  pending_pr: number | null;
  pending_pr_title?: string | null;
  request_id?: string | null;
  request_created_at: string | null;
  ack_received_at: string | null;
  result_received_at: string | null;
  timeout_threshold_ack_minutes: number;
  timeout_threshold_result_minutes: number;
  fallback_threshold_minutes?: number;
  fallback_ready?: boolean;
  fallback_since?: string | null;
  last_state_check?: string | null;
  monitor_runs?: Array<{
    started_at: string;
    events_dir: string;
  }>;
}

const EVENTS_DIR = process.env.EVENTS_DIR
  ? path.resolve(process.cwd(), process.env.EVENTS_DIR)
  : path.join(__dirname, 'events');

const LOG_FILE = path.join(EVENTS_DIR, 'event-log.jsonl');
const STATE_FILE = process.env.EVENTS_STATE_FILE
  ? path.resolve(process.cwd(), process.env.EVENTS_STATE_FILE)
  : path.join(EVENTS_DIR, 'executor-state.json');
const ALERT_FILE = path.join(EVENTS_DIR, 'process-alert.md');
const HEARTBEAT_FILE = path.join(EVENTS_DIR, 'gemini-heartbeat.json');
const FALLBACK_FILE = path.join(EVENTS_DIR, 'fallback-justification.md');

class EventMonitor {
  private lastCheckTime = 0;
  private pollIntervalMs = 5000;
  private fallbackThresholdMinutes = 240; // 4h

  async start() {
    console.log('🔄 Event Monitor iniciado - PROTOCOLO SUPREMO v4.0');
    console.log(`📁 Monitorando: ${EVENTS_DIR}`);
    console.log(`⏱️  Intervalo de polling: ${this.pollIntervalMs}ms`);
    console.log(`📊 Log de eventos: ${LOG_FILE}`);

    this.ensurePaths();
    this.registerMonitorRun();

    if (process.env.RUN_ONCE === '1') {
      await this.checkEvents();
      return;
    }

    setInterval(() => this.checkEvents(), this.pollIntervalMs);

    // Check inicial
    await this.checkEvents();
  }

  private async checkEvents() {
    try {
      const state = this.readExecutorState();
      const effectiveFallbackThreshold =
        state.fallback_threshold_minutes || this.fallbackThresholdMinutes;

      if (state.state === 'blocked' && state.pending_pr) {
        const pr = state.pending_pr;
        const _requestFile = path.join(EVENTS_DIR, `audit-request-PR_${pr}.json`);
        const ackFile = path.join(EVENTS_DIR, `audit-ack-PR_${pr}.json`);
        const resultFile = path.join(EVENTS_DIR, `audit-result-PR_${pr}.json`);

        // Verificar heartbeat (degradado ou ausente)
        this.checkHeartbeat();

        // Verificar timeout para ACK
        if (state.request_created_at && !state.ack_received_at) {
          const minutesElapsed = this.getMinutesElapsed(state.request_created_at);
          if (minutesElapsed > state.timeout_threshold_ack_minutes) {
            this.recordAlert(
              `TIMEOUT: ACK não recebido para PR #${pr} após ${state.timeout_threshold_ack_minutes} minutos (aguardando ${minutesElapsed}m)`,
              'N1'
            );
            console.error(`❌ TIMEOUT ACK: PR #${pr} aguardando há ${minutesElapsed}m`);
          }
        }

        // Verificar timeout para RESULT
        if (state.ack_received_at && !state.result_received_at) {
          const minutesElapsed = this.getMinutesElapsed(state.ack_received_at);
          if (minutesElapsed > state.timeout_threshold_result_minutes) {
            this.recordAlert(
              `TIMEOUT: RESULT não recebido para PR #${pr} após ${state.timeout_threshold_result_minutes} minutos (aguardando ${minutesElapsed}m)`,
              'N2'
            );
            console.error(`❌ TIMEOUT RESULT: PR #${pr} aguardando há ${minutesElapsed}m`);
          }
        }

        // Verificar fallback >4h
        if (state.request_created_at && !state.result_received_at) {
          const minutesElapsed = this.getMinutesElapsed(state.request_created_at);
          if (minutesElapsed >= effectiveFallbackThreshold && !state.fallback_ready) {
            state.fallback_ready = true;
            state.fallback_since = new Date().toISOString();
            this.writeFallbackJustification(pr, minutesElapsed, effectiveFallbackThreshold);
            this.recordAlert(
              `FALLBACK READY: PR #${pr} ultrapassou ${effectiveFallbackThreshold} minutos sem auditoria. Liberar somente com justificativa registrada.`,
              'CRIT'
            );
            console.error(`⚠️ FALLBACK READY: PR #${pr} aguardando ${minutesElapsed}m`);
          }
        }

        // Verificar ACK recebido
        if (!state.ack_received_at && fs.existsSync(ackFile)) {
          const ack = JSON.parse(fs.readFileSync(ackFile, 'utf-8')) as AuditAck;
          this.logEvent({
            event: 'audit-ack-received',
            pr: pr,
            status: ack.status,
            timestamp: new Date().toISOString(),
          });
          state.ack_received_at = ack.timestamp;
          console.log(`✅ ACK recebido para PR #${pr}: ${ack.status}`);
        }

        // Verificar RESULT recebido
        if (!state.result_received_at && fs.existsSync(resultFile)) {
          const result = JSON.parse(fs.readFileSync(resultFile, 'utf-8')) as AuditResult;
          this.logEvent({
            event: 'audit-result-received',
            pr: pr,
            verdict: result.verdict,
            timestamp: new Date().toISOString(),
          });
          state.result_received_at = result.timestamp;

          if (result.executor_unblock && result.verdict === 'APPROVED') {
            state.state = 'ready';
            state.pending_pr = null;
            state.fallback_ready = false;
            state.fallback_since = null;
            this.logEvent({
              event: 'executor-unblocked',
              pr: pr,
              verdict: result.verdict,
              timestamp: new Date().toISOString(),
            });
            console.log(`🟢 EXECUTOR DESBLOQUEADO - PR #${pr} APROVADO`);
          } else if (result.verdict === 'REJECTED') {
            this.recordAlert(`REJECTED: PR #${pr} foi rejeitado pelo Gemini`, 'CRIT');
            console.error(`❌ PR #${pr} REJEITADO`);
          }
        }
      }

      // Salvar estado atualizado
      state.last_state_check = new Date().toISOString();
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (error) {
      console.error('❌ Erro no monitor:', error);
    }
  }

  private readExecutorState(): ExecutorState {
    try {
      const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      return {
        fallback_threshold_minutes: this.fallbackThresholdMinutes,
        ...parsed,
      };
    } catch {
      return {
        state: 'ready',
        pending_pr: null,
        request_created_at: null,
        ack_received_at: null,
        result_received_at: null,
        timeout_threshold_ack_minutes: 15,
        timeout_threshold_result_minutes: 60,
        fallback_threshold_minutes: this.fallbackThresholdMinutes,
        fallback_ready: false,
        fallback_since: null,
        monitor_runs: [],
      };
    }
  }

  private getMinutesElapsed(isoTimestamp: string): number {
    const created = new Date(isoTimestamp).getTime();
    const now = new Date().getTime();
    return Math.floor((now - created) / (1000 * 60));
  }

  private logEvent(event: unknown) {
    const logEntry = JSON.stringify(event) + '\n';
    fs.appendFileSync(LOG_FILE, logEntry, 'utf-8');
  }

  private recordAlert(message: string, level: 'N1' | 'N2' | 'CRIT' = 'N1') {
    const timestamp = new Date().toISOString();
    const alertLine = `- **${timestamp}** [${level}]: ${message}\n`;

    if (!fs.existsSync(ALERT_FILE)) {
      fs.writeFileSync(
        ALERT_FILE,
        `# ⚠️ Process Alerts - PROTOCOLO SUPREMO v4.0\n\n` +
          `**Sistema de Monitoramento de Eventos** (auto-gerado)\n\n`,
        'utf-8'
      );
    }

    fs.appendFileSync(ALERT_FILE, alertLine, 'utf-8');
  }

  private ensurePaths() {
    if (!fs.existsSync(EVENTS_DIR)) {
      fs.mkdirSync(EVENTS_DIR, { recursive: true });
    }

    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private writeFallbackJustification(pr: number, minutesElapsed: number, threshold: number) {
    const header = `# 🛡️ Fallback Justification\n\n`;
    const body =
      `- PR: ${pr}\n` +
      `- Elapsed: ${minutesElapsed} minutos (limite: ${threshold})\n` +
      `- Generated at: ${new Date().toISOString()}\n` +
      `- Condition: auditoria não respondeu após SLA + fallback\n` +
      `- Action required: aprovação manual documentada antes de qualquer merge\n`;

    fs.writeFileSync(FALLBACK_FILE, header + body, 'utf-8');
  }

  private registerMonitorRun() {
    const timestamp = new Date().toISOString();
    const state = this.readExecutorState();
    const runInfo = { started_at: timestamp, events_dir: EVENTS_DIR };
    const runs = state.monitor_runs || [];
    runs.push(runInfo);
    state.monitor_runs = runs;
    state.last_state_check = timestamp;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    this.logEvent({ event: 'monitor-start', timestamp, events_dir: EVENTS_DIR });
  }

  private checkHeartbeat() {
    if (!fs.existsSync(HEARTBEAT_FILE)) {
      this.recordAlert('Heartbeat GEMINI ausente. Atualize gemini-heartbeat.json.', 'N1');
      return;
    }

    try {
      const heartbeat = JSON.parse(fs.readFileSync(HEARTBEAT_FILE, 'utf-8')) as {
        status: string;
        last_seen: string | null;
        sla: { ack_minutes: number; result_minutes: number; fallback_minutes?: number };
      };

      const now = new Date().getTime();
      if (heartbeat.last_seen) {
        const deltaMinutes = Math.floor(
          (now - new Date(heartbeat.last_seen).getTime()) / (1000 * 60)
        );
        const slaAck = heartbeat.sla?.ack_minutes || 15;
        if (deltaMinutes > slaAck) {
          this.recordAlert(
            `Heartbeat GEMINI atrasado: last_seen há ${deltaMinutes} minutos (SLA ACK ${slaAck}m)`,
            'N1'
          );
        }
      }
    } catch (err) {
      this.recordAlert(`Falha ao ler gemini-heartbeat.json: ${String(err)}`, 'N1');
    }
  }
}

// Iniciar monitor se chamado diretamente
const isMainModule =
  import.meta.url.startsWith('file://') &&
  import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
  const monitor = new EventMonitor();
  monitor.start().catch(console.error);
}

export { EventMonitor };
export type { ExecutorState, AuditRequest, AuditAck, AuditResult };
