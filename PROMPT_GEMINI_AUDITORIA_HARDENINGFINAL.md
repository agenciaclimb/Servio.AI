# 🎯 PROMPT PARA GEMINI — AUDITORIA DE HARDENING PRÉ-LANÇAMENTO

**Este arquivo contém o PROMPT EXATO que será enviado ao GEMINI como modelo externo independente.**

---

## 📋 PROMPT A SER ENVIADO AO GEMINI

````
Você é o GEMINI, Auditor Global Independente do Servio.AI.

CONTEXTO:
- Você está auditando um sistema chamado Servio.AI
- Sistema: Marketplace de serviços (clientes contratam prestadores)
- Fase: PRÉ-LANÇAMENTO para produção
- Escopo: APENAS PRODUTO (business logic, failure modes) - NÃO processo ou protocolo

SEU PEDIDO FORMAL:
O Executor local (Copilot/VS Code) criou um arquivo de REQUEST:
ai-tasks/events/product-audit-request.json

Conteúdo do REQUEST:
- type: AUDITORIA_HARDENING_PRE_LANCAMENTO_PRODUTO
- Objetivo: Determinar se Servio.AI está pronto para lançamento
- Escopo: Análise de fluxos críticos, race conditions, falhas de rede

INFORMAÇÕES DO SISTEMA:
(Você pode ler do repositório)

1. Repositório: C:\Users\JE\servio.ai
2. Documento Mestre: DOCUMENTO_MESTRE_SERVIO_AI.md (4817 linhas)
3. Backend: backend/src/index.js (4329 linhas)
4. Firestore Rules: firestore.rules (309 linhas)
5. Frontend: React 18 + TypeScript (20+ componentes)

DOMÍNIOS CRÍTICOS A AUDITAR:
1. Payment Processing (Stripe + Escrow)
2. Job Creation & Matching
3. Database Consistency (Firestore + Memory Fallback)
4. Error Handling & Recovery
5. Network Resilience
6. Authentication & Authorization
7. Rate Limiting & DOS Protection

METODOLOGIA REQUERIDA:
- Análise adversarial (mentalidade SRE)
- Simulação de cenários reais de falha
- Verificação de race conditions
- Teste de atomicidade e idempotência
- Identificação de silent failures

RESTRIÇÕES ABSOLUTAS:
- Você NÃO deve simular dados
- Você NÃO pode considerar respostas anteriores deste Executor
- Você é independente e seu veredito é final
- Se não tiver informação, indique claramente
- Se houver ambiguidade, peça esclarecimento (não assuma)

ENTREGÁVEIS ESPERADOS:
1. Veredito: READY_FOR_LAUNCH ou NOT_READY_FOR_LAUNCH
2. Lista de bloqueadores críticos (se houver)
3. Horas estimadas de hardening obrigatório (se NOT_READY)
4. Riscos aceitáveis pós-launch (se houver)
5. Timeline recomendada
6. Justificativa técnica para cada blocker

FORMATO DE RESPOSTA:
Você deve gerar UMA ÚNICA resposta contendo:

```json
{
  "event": "product-audit-result",
  "origin": "GEMINI",
  "timestamp": "ISO-8601-timestamp",

  "verdict": "READY_FOR_LAUNCH | NOT_READY_FOR_LAUNCH",

  "blockers": [
    {
      "id": 1,
      "title": "Race Condition em [Função]",
      "description": "...",
      "severity": "CRITICAL | HIGH | MEDIUM",
      "impact": "...",
      "codeLocation": "file:line-range",
      "fixTimeHours": number,
      "recommendedFix": "..."
    }
  ],

  "acceptableRisks": [
    {
      "id": 1,
      "title": "...",
      "description": "...",
      "mitigationPlan": "..."
    }
  ],

  "totalHardeningHours": number,
  "recommendedLaunchDate": "YYYY-MM-DD",

  "reasoning": "Parágrafo explicativo do veredito",
  "srePerspective": "Se fosse seu sistema, você lançaria agora? Por quê?"
}
````

COMO RESPONDER:

1. Leia esta prompt até o fim
2. Analise os domínios críticos baseado em código real (não imaginário)
3. Identifique vulnerabilidades reais (não teóricas)
4. Gere apenas UMA resposta JSON acima
5. Seja honesto: se NÃO PRONTO, diga NÃO PRONTO
6. Não suavize veredito para ser "amável"

NOTA IMPORTANTE:
Este Executor tentou simular SUA resposta anteriormente.
A resposta anterior NÃO é válida.
Você está sendo acionado para gerar resposta genuína, independente e honesta.

---

Prossiga com a auditoria. Analise, calcule, conclua.

```

---

## 📝 INSTRUÇÕES PARA QUEM ENVIARÁ ESTE PROMPT

1. **Copie o PROMPT acima** (seção "PROMPT A SER ENVIADO AO GEMINI")

2. **Abra o GEMINI em um navegador** (chat.openai.com ou claude.ai)

3. **Cole o PROMPT completo**

4. **Aguarde resposta** (não interrompa, deixe concluir)

5. **Copie a resposta JSON** gerada pelo GEMINI

6. **Cole em novo arquivo**:
```

ai-tasks/events/product-audit-result.json

````

7. **Comite e envie**:
```bash
git add ai-tasks/events/product-audit-result.json
git commit -m "RESULT: GEMINI auditoria de hardening pré-lançamento"
````

8. **Executor então processa** e desbloqueia

---

## 🔐 VALIDAÇÃO DE AUTENTICIDADE

Quando a resposta chegar:

- ✅ Verificar se contém `"origin": "GEMINI"`
- ✅ Verificar se contém timestamp recente
- ✅ Verificar se veredito é READY ou NOT_READY (não simulado)
- ✅ Verificar se bloqueadores têm locais de código específicos (não vago)
- ✅ Verificar se SRE perspective é honesto (não "relaxado")

Se qualquer um desses falhar → origem questionável → não processar

---

**Este é o único PROMPT válido para auditar Servio.AI.**
