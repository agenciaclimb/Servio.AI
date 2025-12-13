# 🔄 Sistema de Eventos de Handoff entre Agentes

**Protocolo**: PROTOCOLO SUPREMO v4.0  
**Data de Implementação**: 12/12/2025  
**Status**: ✅ ATIVO

---

## 📋 Visão Geral

Sistema estruturado de eventos para garantir comunicação determinística entre agentes (EXECUTOR e GEMINI):

```
EXECUTOR                          GEMINI
   ↓                                ↓
[audit-request-PR.json] --------→  (recebe)
   (aguarda ack)
   ↓
[audit-ack-PR.json]      ←-------- (confirma recebimento)
   (aguarda resultado)
   ↓
[audit-result-PR.json]   ←-------- (envia veredicto)
   ✅ DESBLOQUEADO
```

---

## 📁 Estrutura de Arquivos

### 1. **audit-request-PR_X.json** (criado pelo EXECUTOR)

```json
{
  "timestamp": "2025-12-12T23:30:00Z",
  "pr_number": 28,
  "pr_title": "fix(build): ajustes Etapa 3 Quality",
  "pr_url": "https://github.com/agenciaclimb/Servio.AI/pull/28",
  "executor_status": "blocked",
  "request_type": "pr-audit",
  "solicitations": [
    "Aprovação técnica das mudanças",
    "Update do Documento Mestre",
    "Decisões arquiteturais pendentes",
    "Gate de merge"
  ],
  "context": {
    "branch": "feature/task-qualidade-etapa3-fix-build",
    "files_changed": ["src/components/MatchingResults.tsx", "components/ClientDashboard.tsx"],
    "test_status": "passing",
    "lint_status": "passing",
    "build_status": "passing"
  }
}
```

### 2. **audit-ack-PR_X.json** (criado pelo GEMINI)

```json
{
  "timestamp": "2025-12-12T23:35:00Z",
  "pr_number": 28,
  "ack_type": "received",
  "status": "under-review",
  "gemini_agent": "claude-gemini-auditor",
  "message": "Auditoria iniciada. Revisor em análise."
}
```

### 3. **audit-result-PR_X.json** (criado pelo GEMINI - FINAL)

```json
{
  "timestamp": "2025-12-12T23:50:00Z",
  "pr_number": 28,
  "verdict": "APPROVED",
  "verdict_reason": "Todas as mudanças validadas",
  "technical_approval": true,
  "update_block": "# Atualizar Documento Mestre com...",
  "can_merge": true,
  "executor_unblock": true,
  "notes": ["Implementação conforme protocolo", "Testes passando"],
  "next_steps": ["Merge PR #28", "Aplicar update block", "Deploy"]
}
```

### 4. **gemini-heartbeat.json** (monitoramento do auditor)

```json
{
  "status": "degraded",
  "last_seen": null,
  "sla": {
    "ack_minutes": 15,
    "result_minutes": 60,
    "fallback_minutes": 240
  }
}
```

### 5. **fallback-justification.md** (gerado automaticamente)

```
# 🛡️ Fallback Justification
- PR: <numero>
- Elapsed: <minutos> (limite: 240)
- Generated at: <timestamp>
- Condition: auditoria não respondeu após SLA + fallback
- Action required: aprovação manual antes de merge
```

---

## ⏱️ Ciclo de Vida

| Estado          | Arquivo                   | Criado Por | Ação Executor                          |
| --------------- | ------------------------- | ---------- | -------------------------------------- |
| 1. Request      | `audit-request-PR_X.json` | EXECUTOR   | **BLOQUEADO** até ACK                  |
| 2. Acknowledged | `audit-ack-PR_X.json`     | GEMINI     | Continua bloqueado                     |
| 3. Under Review | (audit-ack atualizado)    | GEMINI     | Aguarda resultado                      |
| 4. Result       | `audit-result-PR_X.json`  | GEMINI     | **DESBLOQUEADO** se `verdict=APPROVED` |

---

## 🔒 Regras de Bloqueio

### EXECUTOR fica BLOQUEADO se:

- `audit-request-PR_X.json` foi criado
- `audit-result-PR_X.json` NÃO existe
- **OU** `verdict` ≠ `APPROVED`

### EXECUTOR desbloqueia quando:

- `audit-result-PR_X.json` existe
- `verdict == "APPROVED"`
- `executor_unblock == true`

### Timeout (FALHA):

- Sem `audit-ack-PR_X.json` após **15 minutos** → Criar `process-alert.md` com INCIDENTE
- Sem `audit-result-PR_X.json` após **60 minutos** → Criar alerta de timeout
- Sem resposta após **240 minutos** → Gerar `fallback-justification.md` e marcar fallback para aprovação manual (Nível CRIT)

---

## 🛠️ Ferramentas Auxiliares

### `executor-state.json` - Estado do Executor

```json
{
  "timestamp": "2025-12-12T23:19:00Z",
  "state": "blocked",
  "reason": "awaiting-audit-result-pr28",
  "pending_pr": 28,
  "request_created_at": "2025-12-12T23:30:00Z",
  "ack_received_at": "2025-12-12T23:35:00Z",
  "result_received_at": null,
  "timeout_threshold_ack_minutes": 15,
  "timeout_threshold_result_minutes": 60
}
```

### `event-monitor.ts` - Monitor em Tempo Real

- Poll a cada 5 segundos para mudanças em `.json` files
- Valida schema de cada evento
- Registra transições em `event-log.jsonl`
- Detecta timeouts e cria alertas

---

## 📊 Log de Eventos Estruturado

Arquivo: `event-log.jsonl` (newline-delimited JSON)

```jsonl
{"timestamp":"2025-12-12T23:30:00Z","event":"audit-request-created","pr":28,"state":"blocked"}
{"timestamp":"2025-12-12T23:35:00Z","event":"audit-ack-received","pr":28,"state":"blocked"}
{"timestamp":"2025-12-12T23:50:00Z","event":"audit-result-received","pr":28,"state":"unblocked","verdict":"APPROVED"}
```

---

## 🚨 Alertas e Incidentes

Arquivo: `process-alert.md`

Registra:

- ❌ Timeouts não respondidos
- ❌ Schema inválido em eventos
- ❌ Verdicts rejeitados
- ✅ Transitions bem-sucedidas
- 📊 Métricas de latência

---

## 🔍 Verificação Manual

```bash
# Ver estado atual do executor
cat ai-tasks/events/executor-state.json | jq .

# Listar todos os events de um PR
ls ai-tasks/events/ | grep "PR_28"

# Monitorar eventos em tempo real (no próximo: event-monitor.ts)
ts-node ai-tasks/event-monitor.ts --watch
```

---

## Integração com PROTOCOLO SUPREMO v4.0

Este sistema implementa:

- ✅ **Seção 2, Item 3**: "Validação de Acionamento do Gemini"
- ✅ **Seção 3, Item 5**: "Bloqueio automático até aprovação"
- ✅ **Seção 4, Item 7**: "Log de transições"
- ✅ **Regra de Bloqueio Automático**: Travamento detectado via timeout

---

_Gerado pelo EXECUTOR INDUSTRIAL em conformidade com PROTOCOLO SUPREMO v4.0_
