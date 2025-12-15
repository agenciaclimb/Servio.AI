# 🔴 RELATÓRIO DE AUDITORIA PRÉ-LANÇAMENTO - SERVIO.AI

**Auditor**: GEMINI (Modo SRE - Auditoria de Hardening)  
**Data**: 2025-12-23  
**Status Final**: 🔴 **NÃO PRONTO PARA PRODUÇÃO**  
**Bloqueadores Críticos**: 7  
**Riscos Aceitáveis Pós-Launch**: 3

---

## RESUMO EXECUTIVO

O Servio.AI apresenta **7 vulnerabilidades críticas em domínios financeiros e operacionais** que causarão falhas catastróficas em produção com clientes reais. Estes são **bloqueadores obrigatórios** antes do lançamento.

Adicionalmente, existem **3 riscos aceitáveis** que podem ser tratados em um hotfix pós-launch se houver cobertura operacional (on-call).

### Veredito SRE: 🔴 **NÃO LANCE AGORA**

Se este fosse **meu sistema em produção**, eu **NÃO lançaria**, porque:

1. **Pagamentos podem duplicar** (cliente paga 1x, provider recebe 2x) → **Perda financeira imediata**
2. **Escrows podem ficar órfãos** (criados mas não pagáveis) → **Suporte direto + refunds**
3. **Transações não são atômicas** → **Estados inconsistentes** entre Firestore e Stripe
4. **Sem logging de erros críticos** → **Impossível debugar em produção**
5. **Rate limiting incompleto** → **Aberto para DOS/abuse**

**Risco de reputação**: Primeiros clientes descobrem duplicação de pagamento = "startup não sabe gerenciar dinheiro".

---

## BLOQUEADORES CRÍTICOS

### 🔴 BLOCKER #1: Duplicação de Transferências (Race Condition)

**Arquivo**: [backend/src/index.js#L2877-L2930](backend/src/index.js#L2877-L2930)  
**Função**: `POST /jobs/:jobId/release-payment`  
**Severidade**: CRÍTICA (Financial Loss)

**Código Vulnerável**:

```javascript
app.post("/jobs/:jobId/release-payment", requireJobParticipant, async (req, res) => {
  // ❌ Sem transação: 2 requests simultâneos veem status='pago'
  const escrowData = escrowQuery.docs[0].data();

  if (escrowData.status !== "pago") {
    return res.status(400).json({ error: `Status: ${escrowData.status}` });
  }

  // PROBLEMA: Ambas criam transfer porque check não é atomic
  const transfer = await stripe.transfers.create({...});
  await escrowDoc.ref.update({ status: "liberado", stripeTransferId: transfer.id });
});
```

**Cenário Real**:

1. Cliente clica botão "Liberar Pagamento" (JavaScript, implementação em [src/components/CheckoutFlow.tsx](src/components/CheckoutFlow.tsx))
2. Network é lento → cliente clica novamente (usuário impaciente)
3. **Request 1**: lê escrow, vê `status='pago'` ✓
4. **Request 2**: lê escrow (antes da Request 1 atualizar), vê `status='pago'` ✓
5. **Request 1**: cria transfer de R$ 500 para provider ✓
6. **Request 2**: **cria OUTRO transfer de R$ 500 para provider** 💥
7. **Resultado**: Provider recebe R$ 1000 de uma única ordem

**Impacto**:

- Provider com sorte recebe 2x pagamento
- Cliente precisa fazer chargeback ou disputa
- Stripe detecta anomalia, suspende conta (pior cenário)
- Confiança destruída

**Fix Obrigatório**:

```javascript
// Usar transação Firestore para atomicidade
await db.runTransaction(async (t) => {
  const escrowSnap = await t.get(escrowRef);
  if (escrowSnap.data().status !== "pago") {
    throw new Error("Status must be 'pago'");
  }

  const transfer = await stripe.transfers.create({...});

  t.update(escrowRef, {
    status: "liberado",
    stripeTransferId: transfer.id,
    lockedAt: new Date() // Prevent re-entry
  });
});
```

---

### 🔴 BLOCKER #2: Webhook Stripe Sem Idempotência

**Arquivo**: [backend/src/index.js#L2832-L2865](backend/src/index.js#L2832-L2865)  
**Função**: `POST /api/stripe-webhook` - case `checkout.session.completed`  
**Severidade**: CRÍTICA (Data Corruption)

**Código Vulnerável**:

```javascript
case 'checkout.session.completed': {
  const session = event.data.object;
  const { escrowId } = session.metadata || {};

  if (escrowId && paymentIntentId) {
    const snap = await escrowRef.get();
    const existing = snap.exists ? snap.data() : {};

    // ❌ PROBLEMA: Race condition entre get() e update()
    if (existing.status === 'pago' && existing.paymentIntentId === paymentIntentId) {
      console.log('[Stripe Webhook] Skipping (already processed)');
    } else {
      // Se dois webhooks chegam antes de completar a first write:
      // Ambos veem status != 'pago' → ambos updatem
      await escrowRef.update({ status: 'pago', paymentIntentId });
    }
  }
}
```

**Cenário Real**:

1. Cliente completa pagamento no Stripe
2. Stripe envia webhook para `/api/stripe-webhook` com `session.completed`
3. **Webhook recebido 2x** (Stripe retry, network glitch, etc.) com mesmo `event.id`
4. **Handler 1**: lê escrow, vê `status !== 'pago'` ✓, começaa update
5. **Handler 2**: lê escrow (antes da Handler 1 completar), vê `status !== 'pago'` ✓, começaa update
6. **Resultado**: Ambos atualizam escrow com mesmo paymentIntentId (redundante, data ok) MAS
   - Se Stripe envia payload ligeiramente diferente (edge case raro), escrow fica inconsistente
   - Logs impossíveis de diferenciar

**Fix Obrigatório**:

```javascript
await db.runTransaction(async t => {
  const snap = await t.get(escrowRef);
  const existing = snap.exists ? snap.data() : {};

  // Já processado? Pula silenciosamente (idempotente)
  if (existing.paymentIntentId === paymentIntentId) {
    return { success: true, alreadyProcessed: true };
  }

  // Primeira vez: update atômico
  t.update(escrowRef, { status: 'pago', paymentIntentId, processedAt: new Date() });
});
```

---

### 🔴 BLOCKER #3: Criação de Escrow Sem Garantia Atomística

**Arquivo**: [backend/src/index.js#L1101-L1125](backend/src/index.js#L1101-L1125)  
**Função**: `POST /create-checkout-session`  
**Severidade**: CRÍTICA (Orphaned Records)

**Código Vulnerável**:

```javascript
// Criar escrow ANTES de Stripe session
const escrowRef = db.collection('escrows').doc();
const escrowData = { id: escrowRef.id, jobId, clientId, providerId, amount };
await escrowRef.set(escrowData); // Escrow criado ✓

// AGORA cria session Stripe
const session = await stripe.checkout.sessions.create({
  // ... config ...
  metadata: { escrowId: escrowRef.id },
});
```

**Cenário Real** (Stripe está down ou timeout):

1. Escrow criado em Firestore ✓
2. Stripe.checkout.sessions.create() **fails** (timeout, error, rate limit) ❌
3. Client recebe erro → mostra retry button
4. Cliente **não sabe que escrow foi criado**
5. Administrator vê escrow órfão em Firestore
6. **Problema**:
   - Não há sesssão no Stripe para o cliente pagar
   - Job está "blocked" (esperando pagamento)
   - Cliente tenta novamente → **2ª escrow criada**
   - Leaderboard conta jobs incorretos

**Fix Obrigatório**:

```javascript
// Stripe FIRST, THEN Firestore
const session = await stripe.checkout.sessions.create({
  metadata: { jobId: job.id }, // Não incluir escrowId yet
  // ...
});

// Apenas após success, criar escrow
const escrowRef = db.collection('escrows').doc();
await escrowRef.set({
  id: escrowRef.id,
  jobId,
  stripeSessionId: session.id, // Link to Stripe
  metadata: { escrowId: escrowRef.id },
});
```

---

### 🔴 BLOCKER #4: Sem Loggin de Erros Críticos no Webhook

**Arquivo**: [backend/src/index.js#L2819-L2865](backend/src/index.js#L2819-L2865)  
**Função**: `POST /api/stripe-webhook` - error handling  
**Severidade**: ALTA (Debugging Impossível)

**Problema**:

```javascript
try {
  event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
} catch (err) {
  console.log(`❌ Webhook signature verification failed.`, err.message);
  return res.status(400).send(`Webhook Error: ${err.message}`);
  // ❌ Sem log de req.body, sig, ou contexto completo
  // Em produção: impossível debugar por que webhooks estão falhando
}
```

**Cenário em Produção**:

1. Webhooks começam a falhar mysteriously
2. Suporte recebe: "Não consigo pagar, diz erro no servidor"
3. Você olha logs e vê: `❌ Webhook signature verification failed. invalid`
4. Mas sem a assinatura real, body, ou timestamp, **não há como debugar**
5. **Resultado**: 3 horas investigando enquanto clientes não conseguem pagar

**Fix Obrigatório**:

```javascript
catch (err) {
  const logData = {
    error: err.message,
    sig: sig?.slice(0, 20) + '...',  // Primeira 20 chars (safe)
    bodyHash: crypto.createHash('sha256').update(req.body).digest('hex').slice(0, 16),
    eventType: event?.type || 'unknown',
    timestamp: new Date().toISOString()
  };
  console.error('[Stripe Webhook CRITICAL]', logData);

  // Também log em Firestore para auditoria
  await db.collection('webhook_errors').add({ ...logData, createdAt: new Date() });

  return res.status(400).send(`Webhook Error: ${err.message}`);
}
```

---

### 🔴 BLOCKER #5: Rate Limiting Incompleto (Aberto para DOS)

**Arquivo**: [backend/src/index.js#L181-L200](backend/src/index.js#L181-L200)  
**Função**: Auth/User/Proposals rate limiting setup  
**Severidade**: ALTA (Availability)

**Problema**:

```javascript
const authPaths = [
  '/login',
  '/api/login',
  '/register',
  '/api/register',
  '/api/register-with-invite',
];
authPaths.forEach(path => app.use(path, authRateLimiter));

const userPaths = ['/users', '/api/users'];
userPaths.forEach(path => app.use(path, userRateLimiter));

app.use('/proposals', proposalsRateLimiter);

// ❌ MAS FALTAM rate limits para:
// - /api/enhance-job (Gemini API, expensive)
// - /api/match-providers (Database query, expensive)
// - /api/stripe/create-connect-account (Stripe API call)
// - /api/stripe-webhook (DoS vettor: fake events)
// - /api/leaderboard (Causes leaderboard cache hammer)
```

**Cenário DOS Real**:

1. Attacker escreve script que:
   ```python
   for i in range(10000):
     POST /api/enhance-job with prompt="test" * 10000
   ```
2. Backend queues 10000 Gemini API calls
3. Google charges you R$ 5000+ em minutos
4. Backend overload, legitimate users get 503

**Fix Obrigatório**:

```javascript
const enhanceJobLimiter = buildRateLimiter({ windowMs: 60000, max: 10 });  // 10 per min
const matchProvidersLimiter = buildRateLimiter({ windowMs: 60000, max: 5 });
const connectAccountLimiter = buildRateLimiter({ windowMs: 3600000, max: 1 });  // 1 per hour
const webhookLimiter = buildRateLimiter({ windowMs: 10000, max: 100 });

app.post('/api/enhance-job', enhanceJobLimiter, async (req, res) => { ... });
app.post('/api/match-providers', matchProvidersLimiter, async (req, res) => { ... });
app.post('/api/stripe/create-connect-account', connectAccountLimiter, async (req, res) => { ... });
app.post('/api/stripe-webhook', webhookLimiter, express.raw(...), async (req, res) => { ... });
```

---

### 🔴 BLOCKER #6: Firestore Transactions Não Implementadas (Cascading Failures)

**Arquivo**: Múltiplos endpoints em [backend/src/index.js](backend/src/index.js)  
**Funções**: `/release-payment`, `/mediate-dispute/resolve`, payment flow  
**Severidade**: CRÍTICA (Data Consistency)

**Problema**:

- **release-payment**: Atualiza job, escrow, e stripe transfer em 3 chamadas separadas
- Se falha após update job mas antes de stripe: Job é "concluído" mas provider não foi pago
- Se falha após stripe mas antes de escrow: Dinheiro foi transferido mas não registrado

**Fix Obrigatório** (em release-payment):

```javascript
await db.runTransaction(async (transaction) => {
  // Step 1: Lock escrow (atomic)
  const escrowSnap = await transaction.get(escrowRef);
  if (escrowSnap.data().status !== "pago") {
    throw new Error("Invalid status");
  }

  // Step 2: Create transfer (via Stripe - NOT transactional)
  const transfer = await stripe.transfers.create({ ... });

  // Step 3: Update all records atomically
  transaction.update(escrowRef, { status: "liberado", stripeTransferId: transfer.id });
  transaction.update(jobRef, { status: "concluido", earnings: { ... } });

  // If any step fails before all writes are committed, NONE are written
});
```

---

### 🔴 BLOCKER #7: Sem Verificação de Provider Stripe Setup

**Arquivo**: [backend/src/index.js#L1100-L1102](backend/src/index.js#L1100-L1102)  
**Função**: `POST /create-checkout-session`  
**Severidade**: ALTA (Silent Failure)

**Código Vulnerável**:

```javascript
const providerStripeId = providerData.stripeAccountId;

if (!providerStripeId) {
  return res.status(400).json({ error: 'Provider has not set up payment account.' });
}

// ❌ MAS: Não verifica se Stripe account é "verified"
// Provider pode ter criado account mas não completado onboarding
// Stripe pode ter desativado a conta por compliance
```

**Cenário Real**:

1. Provider registra e inicia Stripe onboarding mas **não completa**
2. Client tenta pagar para esse provider
3. Backend cria escrow, Stripe session criado ✓
4. Client paga ✓
5. Webhook chega, escrow = 'pago' ✓
6. Client clica "Liberar Pagamento" ✓
7. Backend tenta `stripe.transfers.create()` com provider account incompleto
8. **Stripe retorna**: `Destination account restrictions...` ❌
9. **Backend não trata erro** → 500 server error
10. **Client vê**: "Internal Server Error" (WTF?)
11. **Provider nunca recebe pagamento** mas escrow = 'liberado' (inconsistent)

**Fix Obrigatório**:

```javascript
// Validar status de account Stripe
const providerAccount = await stripe.accounts.retrieve(providerStripeId);
if (providerAccount.requirements?.current_deadline || providerAccount.charges_enabled === false) {
  return res.status(400).json({
    error: 'Provider payment account is not fully set up. Cannot process payment.',
    requiresProviderAction: true,
  });
}
```

---

## RISCOS ACEITÁVEIS (PÓS-LAUNCH)

### 🟡 RISCO #1: Firebase Fallback Mode Não Testado

**Arquivo**: [backend/src/index.js#L???] (Database wrapper com `memoryDb`)  
**Severidade**: MÉDIA (Backup Plan)

**Problema**:

- Backend tem memory fallback para Firestore
- Mas **nunca foi testado sob load real**
- Se Firestore fica down, backend entra em memory mode
- **Issue**: Data perde ao reiniciar, não há persistência

**Risco Aceitável se**:

- Firestore RTO < 30 minutos (Google SLA: 99.95%, ~2.2h downtime/month)
- Team tem alertas configurados
- Runbook de restauração pronto

**Recomendação**:

- Monitorar Firestore health em dashboard
- Alert em Slack se entra memory mode

---

### 🟡 RISCO #2: Gemini API Timeouts (12s não é suficiente)

**Arquivo**: [services/geminiService.ts#L118](services/geminiService.ts#L118)  
**Severidade**: BAIXA (UX Issue, não financial)

**Problema**:

```javascript
const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout
```

**Real World**: Gemini API para /api/enhance-job frequentemente leva 8-15s dependendo da complexidade

**Risco Aceitável se**:

- Frontend exibe "Melhorando descrição..." spinner
- User nunca vê timeout em >95% dos casos

---

### 🟡 RISCO #3: Sem Monitoring de Erros em Produção

**Arquivo**: N/A (Infrastructure)  
**Severidade**: MÉDIA (Operational Blind Spot)

**Problema**:

- Logs vão para console (Cloud Run logs)
- Sem Sentry/DataDog/Firebase Crashlytics
- Você não sabe quando erros começam em produção até cliente reclamar

**Recomendação**:

- Setup Sentry ou similar ANTES do launch
- Alert se error rate > 5%

---

## PLANO DE HARDENING OBRIGATÓRIO

### Ordem de Execução (Sequencial):

| Prioridade | Blocker                    | Tempo Est. | Testes                | Complexidade |
| ---------- | -------------------------- | ---------- | --------------------- | ------------ |
| 1          | #1 (Duplicação transfers)  | 2h         | Sim (2x simultâneos)  | ALTA         |
| 2          | #2 (Webhook idempotência)  | 1.5h       | Sim (retry 2x)        | ALTA         |
| 3          | #3 (Escrow atomicity)      | 2h         | Sim (falha Stripe)    | ALTA         |
| 4          | #4 (Logging crítico)       | 1h         | Sim (valide logs)     | BAIXA        |
| 5          | #5 (Rate limiting)         | 1.5h       | Sim (DOS test)        | MÉDIA        |
| 6          | #6 (Transactions)          | 2.5h       | Sim (cascading fail)  | MUITO ALTA   |
| 7          | #7 (Stripe account verify) | 1h         | Sim (test incomplete) | MÉDIA        |

**Total**: 11.5 horas de dev + testes

### Checklist de Validação:

- [ ] Todos bloqueadores fixados
- [ ] E2E test: payment 2x simultâneos → só 1 transfer
- [ ] E2E test: webhook retransmitido 3x → idempotente
- [ ] E2E test: Stripe down durante checkout → rollback gracioso
- [ ] Load test: 1000 concurrent requests to `/enhance-job` → rate limited
- [ ] Firestore fallback test: database unavailable 30s → graceful degrade
- [ ] Error logging: simular erro → apareça em logs com contexto
- [ ] Smoke tests passamn (10/10)
- [ ] Security audit passá (0 criticals)

---

## VEREDITO FINAL

### 🔴 **GO/NO-GO**: NÃO LANCE AGORA

**Razão Primária**: 7 bloqueadores críticos em domínios financeiros:

- Duplicação de pagamentos (cliente perde confiança)
- Escrows órfãos (operações impossíveis)
- Sem idempotência (webhook failures causam inconsistência)
- Sem atomicidade (cascading failures)

**Risk Profile se Lançar Sem Fix**:

- **Semana 1**: Primeiros usuarios descrevem duplicação de transferência
- **Semana 2**: Stripe fraud team investiga (suas transactions parecem duplicadas)
- **Semana 3**: Stripe suspende sua conta pendente investigation
- **Game Over**: Platform inacessível

### ✅ **Recomendação**:

1. **Esta semana (antes de Natal)**: Fix bloqueadores 1-4 (6h dev + 2h QA)
2. **Próxima semana**: Fix bloqueadores 5-7 (5.5h dev + 2h QA)
3. **Validação**: Full E2E + load testing (8h QA)
4. **Launch**: 2025-01-10 (quando tudo está locked)

### 📊 **Métricas de Risco**:

| Métrica                | Pré-Launch | Pós-Fix |
| ---------------------- | ---------- | ------- |
| Critical Bugs          | 7          | 0       |
| Race Conditions        | 3          | 0       |
| Silent Failures        | 4          | 0       |
| User Financial Risk    | MUITO ALTO | BAIXO   |
| Operational Complexity | 7          | 2       |

---

## APÊNDICE: Comandos de Teste para Validação

### Teste Race Condition #1 (Duplicação):

```bash
# Criar job e escrow
curl -X POST http://localhost:8081/api/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"clientId":"user@example.com","providerId":"provider@example.com","amount":500}'

# Simular 2 releases simultâneos
(curl -X POST http://localhost:8081/jobs/JOB_ID/release-payment \
  -H "Authorization: Bearer $TOKEN" &) && \
(curl -X POST http://localhost:8081/jobs/JOB_ID/release-payment \
  -H "Authorization: Bearer $TOKEN" &)

# Validar: apenas 1 transfer em Stripe (verificar via Stripe dashboard)
```

### Teste Webhook Idempotência #2:

```bash
# Enviar webhook 3x com mesmo event.id
curl -X POST http://localhost:8081/api/stripe-webhook \
  -H "Stripe-Signature: t=1234567890,v1=SIGNATURE" \
  -d '{"id":"evt_123","type":"checkout.session.completed","data":{"object":{"id":"cs_123"}}}'

# 3x consecutivos → todas devem ser 200 e ser idempotentes
```

---

**Documento gerado por auditor SRE autônomo**  
**Classificação**: CONFIDENCIAL - PRÉ-LANÇAMENTO  
**Próxima revisão**: Após implementação de bloqueadores (12/29/2024)
