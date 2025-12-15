# PROCESSO — SELF TEST (Sem Simular Gemini)

Este guia valida o ciclo REQUEST → BLOQUEIO → ALERTA sem o Auditor.

## Passos

```powershell
# 1) Gerar REQUEST (PR 99 de exemplo)
npm run audit:request

# 2) Checar status do executor
npm run audit:status
Get-Content ai-tasks/events/executor-state.json

# 3) Rodar monitor contínuo (opcional)
node ai-tasks/events/events-monitor.cjs

# 4) Validar guardrails
node scripts/guardrails/deny-local-audit-results.cjs
```

## Resultado Esperado

- executor-state.json: `blocked: true` e `reason: AWAITING_RESULT` ou `TIMEOUT`
- process-alert.md: alerta se ACK/RESULT não chegarem no SLA
- Nenhum ACK/RESULT criado localmente

## Como validar ACK/RESULT reais

- Abra/atualize um PR e aguarde o workflow "Gemini Auditor Bot"
- Verifique arquivos gerados pela Action:
  - `ai-tasks/events/audit-ack-PR_<N>.json`
  - `ai-tasks/events/audit-result-PR_<N>.json`
  - `ai-tasks/events/proof-of-origin-PR_<N>.json`
- Guardrail deve passar (prova JSON com metadados do run)
- Se `verdict=APPROVED`, o monitor deve atualizar `executor-state.json` para `blocked: false` (UNLOCKED)
