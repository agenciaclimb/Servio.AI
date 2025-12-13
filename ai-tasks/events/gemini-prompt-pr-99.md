# Prompt para GEMINI — Auditoria de PR #99

Objetivo: Auditar o PR "chore(protocol): hardening segregação + guardrails auditoria" conforme PROTOCOLO SUPREMO v4.0.

Instruções:

1. Analise o PR completo (diff de código, scripts, CI, hooks)
2. Valide que o guardrail impede ACK/RESULT sem prova de origem
3. Verifique o monitor de eventos e documentação
4. Retorne:
   - `audit-result-PR_99.json` com campos:
     - `timestamp` (ISO)
     - `pr_number` (99)
     - `verdict` (APPROVED ou REJECTED)
     - `verdict_reason`
     - `executor_unblock` (true/false)
   - Prover dados para `proof-of-origin.txt`:
     - Link do chat (URL)
     - Timestamp
     - Hash SHA256 do JSON

Restrições:

- Não simular, não inventar
- A resposta deve ser colada manualmente (fora do Copilot)
- Auditor é somente você (GEMINI externo)
