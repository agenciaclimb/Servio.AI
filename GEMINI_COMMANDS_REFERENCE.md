# 🛠️ COMMANDS ÚTEIS - GEMINI CONSOLIDATION

**Gerado**: 18/12/2025 | **Para**: Executar plano de consolidação Gemini  
**Formato**: PowerShell (Windows) + Bash (Linux/Mac)

---

## 📋 ÍNDICE

1. [Setup e Verificação](#setup)
2. [Testes - Week 1](#tests-week1)
3. [Rate Limiting - Week 1](#ratelimit)
4. [Cache Redis - Week 2](#cache)
5. [Monitoring e Stats](#monitoring)
6. [Deploy](#deploy)

---

## <a name="setup"></a> 🔧 SETUP E VERIFICAÇÃO

### Verificar Status Atual

```bash
# Verificar testes passando
npm test 2>&1 | grep -E "Test Files|Tests:|Coverage"

# Verificar cobertura Gemini
npm test -- tests/services/geminiService.comprehensive.test.ts --coverage

# Verificar endpoints Gemini no backend
grep -n "app.post.*enhance-job\|app.post.*match-providers\|app.post.*generate" backend/src/index.js | wc -l
```

### Verificar GEMINI_API_KEY em Produção

```bash
# Cloud Run
gcloud run services describe servio-ai-backend --region us-west1 --format="value(spec.template.spec.containers[0].env)" | grep GEMINI

# Local (deve estar em .env)
echo $GEMINI_API_KEY  # Linux/Mac
echo %GEMINI_API_KEY% # Windows
```

### Instalar Dependências Week 1-2

```bash
# Frontend (nenhuma nova)
npm install

# Backend
cd backend
npm install express-rate-limit redis

# Redis (opcional local)
docker run -d -p 6379:6379 redis:latest
```

---

## <a name="tests-week1"></a> 🧪 TESTES - WEEK 1

### Task 1.1: Teste summarizeReviews()

```bash
# Abrir arquivo
code tests/services/geminiService.comprehensive.test.ts

# Adicionar esta suite antes da última (linha ~230)
# [COPY-PASTE: ver PLANO_CONSOLIDACAO_GEMINI.md Task 1.1]

# Rodar
npm test -- tests/services/geminiService.comprehensive.test.ts --grep "summarizeReviews"

# Esperado: ✅ 2 testes passando
```

### Task 1.2: Teste parseSearchQuery()

```bash
# Mesma suite, adicionar após 1.1
# [COPY-PASTE: ver PLANO_CONSOLIDACAO_GEMINI.md Task 1.2]

npm test -- tests/services/geminiService.comprehensive.test.ts --grep "parseSearchQuery"

# Esperado: ✅ 2 testes passando
```

### Task 1.3: Teste extractInfoFromDocument()

```bash
npm test -- tests/services/geminiService.comprehensive.test.ts --grep "extractInfoFromDocument"

# Esperado: ✅ 2 testes passando
```

### Task 1.4: Teste mediateDispute() - CRÍTICO

```bash
npm test -- tests/services/geminiService.comprehensive.test.ts --grep "mediateDispute"

# Esperado: ✅ 3 testes passando (mediação básica, fallback, detecção bias)
```

### Task 1.5: Teste analyzeProviderBehaviorForFraud() - CRÍTICO

```bash
npm test -- tests/services/geminiService.comprehensive.test.ts --grep "analyzeProviderBehaviorForFraud"

# Esperado: ✅ 4 testes passando (normal, suspeito, fallback, padrão manipulação)
```

### Verificar Cobertura Pós-Testes

```bash
npm test -- tests/services/geminiService.comprehensive.test.ts --coverage

# Esperado: 100% coverage em geminiService.ts
```

---

## <a name="ratelimit"></a> 🔐 RATE LIMITING - WEEK 1 (CRÍTICO)

### Task 2.1: Implementar Rate Limiter

**PASSO 1: Instalar dependência**

```bash
cd backend
npm install express-rate-limit
```

**PASSO 2: Editar backend/src/index.js (linhas 1-50)**

```javascript
// Adicionar após outros imports (linha 20 aprox)
const rateLimit = require('express-rate-limit');

// Criar limiter (após linha 140, antes dos endpoints)
const geminiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições IA. Tente novamente em 1 minuto.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.user?.type === 'admin', // Não limitar admins
  keyGenerator: req => req.user?.email || req.ip,
});
```

**PASSO 3: Aplicar a endpoints críticos**

```javascript
// Encontrar estas linhas e adicionar geminiLimiter:

// Linha ~433 (enhance-job)
app.post("/api/enhance-job", geminiLimiter, async (req, res) => {

// Linha ~583 (match-providers)
app.post("/api/match-providers", geminiLimiter, async (req, res) => {

// Linha ~626 (generate-tip)
app.post('/api/generate-tip', geminiLimiter, async (req, res) => {

// ... repetir para todos endpoints que usam genAI
```

**PASSO 4: Testar**

```bash
# Backend test
npm run test:backend -- --grep "rate.*limit"

# Manual test (fazer 101 requests em 60s)
for i in {1..101}; do
  curl -X POST http://localhost:8081/api/enhance-job \
    -H "Content-Type: application/json" \
    -d '{"prompt":"test"}' &
done

# Esperado na 101ª: 429 Too Many Requests
```

### Task 2.2: Logging de Custos

**PASSO 1: Criar função de logging (line ~610 em backend/src/index.js)**

```javascript
function logGeminiUsage(endpoint, inputTokens, outputTokens, durationMs) {
  const inputCost = (inputTokens / 1000000) * 0.075;
  const outputCost = (outputTokens / 1000000) * 0.3;
  const totalCost = inputCost + outputCost;

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      endpoint,
      inputTokens,
      outputTokens,
      durationMs,
      inputCost: inputCost.toFixed(6),
      outputCost: outputCost.toFixed(6),
      totalCost: totalCost.toFixed(6),
      level: 'GEMINI_USAGE',
    })
  );
}
```

**PASSO 2: Usar em endpoints (ex. enhance-job, linha ~500)**

```javascript
const startTime = Date.now();
const result = await model.generateContent(systemPrompt);
const usageMetadata = result.response.usageMetadata || {};
logGeminiUsage(
  '/api/enhance-job',
  usageMetadata.promptTokenCount || 0,
  usageMetadata.candidatesTokenCount || 0,
  Date.now() - startTime
);
```

**PASSO 3: Verificar em Cloud Logging**

```bash
# Google Cloud
gcloud logging read 'resource.type=cloud_run_revision AND jsonPayload.level=GEMINI_USAGE' \
  --limit 10 \
  --format json
```

---

## <a name="cache"></a> 💾 CACHE REDIS - WEEK 2

### Task 3.1: Implementar Cache MATCH-PROVIDERS

**PASSO 1: Instalar Redis**

```bash
cd backend && npm install redis

# Se usar Docker
docker run -d --name redis -p 6379:6379 redis:latest
```

**PASSO 2: Conectar Redis (linha 15 em backend/src/index.js)**

```javascript
const redis = require('redis');
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});
redisClient.connect();
```

**PASSO 3: Modificar endpoint match-providers (linha ~585)**

```javascript
app.post('/api/match-providers', geminiLimiter, async (req, res) => {
  const { job, allUsers, allJobs } = req.body;

  const cacheKey = `match:${job.id}:${allUsers.length}`;

  try {
    // Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('[match-providers] Cache HIT');
      return res.json(JSON.parse(cached));
    }

    // Existing Gemini logic...
    const result = await model.generateContent(...);

    // Cache result for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));

    return res.json(result);
  } catch (e) {
    console.warn('[match-providers] Error:', e);
    return res.json([]);
  }
});
```

**PASSO 4: Testar cache hit rate**

```bash
# Fazer 2 requests idênticos
curl -X POST http://localhost:8081/api/match-providers \
  -H "Content-Type: application/json" \
  -d '{...}' -w "\nTime: %{time_total}s\n"

# Segunda chamada deve ser < 10ms (vs 1000-3000ms sem cache)
```

### Task 3.2: Retry com Exponential Backoff

**PASSO 1: Editar geminiService.ts (line 120)**

```typescript
const fetchFromBackend = async <T>(endpoint: string, body: object): Promise<T> => {
  const fullUrl = resolveEndpoint(endpoint);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) return response.json();
      if (response.status >= 500) throw new Error(`Server error`);
      return response.json();
    } catch (err) {
      if (attempt < 2) {
        const delay = Math.pow(2, attempt) * 300; // 300ms, 600ms
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
};
```

**PASSO 2: Testar**

```bash
npm test -- tests/services/geminiService.comprehensive.test.ts --grep "retry"

# Esperado: ✅ Testes de retry passando
```

---

## <a name="monitoring"></a> 📊 MONITORING E STATS

### Task 4.1: Admin Endpoint para Gemini Stats

**PASSO 1: Adicionar endpoint (line ~3500 em backend/src/index.js)**

```javascript
app.get('/api/admin/gemini-stats', async (req, res) => {
  if (req.user?.type !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // TODO: Buscar do Cloud Logging
  const stats = {
    requestsToday: 1234,
    averageLatency: 850,
    errorRate: 0.02,
    estimatedCostToday: 1.23,
    estimatedCostMonth: 37.5,
    topEndpoints: [{ name: '/api/enhance-job', calls: 450, avgLatency: 920 }],
  };

  res.json(stats);
});
```

**PASSO 2: Testar**

```bash
curl -X GET http://localhost:8081/api/admin/gemini-stats \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

# Esperado: JSON com stats
```

---

## <a name="deploy"></a> 🚀 DEPLOY

### Pré-Deploy Checklist

```bash
# 1. Testes
npm test 2>&1 | grep "Test Files"
# Esperado: "Test Files: XXX passed"

# 2. Build
npm run build
# Esperado: sem erros

# 3. Lint
npm run lint:ci
# Esperado: sem warnings

# 4. Backend testes
cd backend && npm test
# Esperado: todos passando

# 5. Coverage
npm test -- --coverage 2>&1 | grep "TOTAL"
# Esperado: linhas 35%+, branches 75%+
```

### Deploy em Staging

```bash
# Firebase Hosting (frontend)
firebase deploy --only hosting --project servio-ai-staging

# Cloud Run (backend)
gcloud run deploy servio-ai-backend \
  --source . \
  --region us-west1 \
  --set-env-vars GEMINI_API_KEY=${GEMINI_API_KEY_STAGING}
```

### Deploy em Produção

```bash
# Merge em main dispara GitHub Actions automaticamente
git checkout main
git pull origin main

# Ou manual
gcloud run deploy servio-ai-backend \
  --source . \
  --region us-west1 \
  --set-env-vars GEMINI_API_KEY=${GEMINI_API_KEY_PROD}
```

### Validar Deploy

```bash
# Health check
curl -s https://servio-ai.firebaseapp.com/api/health | jq .

# Test Gemini
curl -X POST https://servio-ai-backend.run.app/api/enhance-job \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}' | jq .

# Logs
gcloud logging read 'resource.type=cloud_run_revision' \
  --limit 10 \
  --format json
```

---

## 📋 CHECKLISTS RÁPIDOS

### Week 1 Done

```
☑️ Task 1.1: npm test -- --grep "summarizeReviews" [✅ PASS]
☑️ Task 1.2: npm test -- --grep "parseSearchQuery" [✅ PASS]
☑️ Task 1.3: npm test -- --grep "extractInfoFromDocument" [✅ PASS]
☑️ Task 1.4: npm test -- --grep "mediateDispute" [✅ PASS]
☑️ Task 1.5: npm test -- --grep "analyzeProviderBehaviorForFraud" [✅ PASS]
☑️ Task 2.1: Rate limiter ativo [✅ DEPLOYED]
☑️ Task 2.2: Logging de custos ativo [✅ VERIFIED]
```

### Week 2 Done

```
☑️ Task 3.1: Redis cache HIT rate > 40% [✅ VERIFIED]
☑️ Task 3.2: Exponential backoff working [✅ TEST PASS]
☑️ Staging validation: P99 < 3s [✅ OK]
```

### Week 3 Done

```
☑️ Task 4.1: Admin stats endpoint [✅ DEPLOYED]
☑️ Task 4.2: Runbook updated [✅ DONE]
☑️ Production deploy [✅ SUCCESS]
```

---

## 🆘 TROUBLESHOOTING

### Rate Limiter não funciona

```bash
# Verificar se middleware está aplicado
grep -n "geminiLimiter" backend/src/index.js | wc -l
# Deve haver 6+ matches

# Se 0, adicionar aos endpoints
```

### Redis connection refused

```bash
# Verificar se Redis está rodando
redis-cli ping
# Se falhar, iniciar: redis-server

# Ou via Docker
docker ps | grep redis
# Se não aparecer: docker run -d -p 6379:6379 redis:latest
```

### Testes falhando

```bash
# Clear cache
rm -rf node_modules/.vite

# Reinstalar
npm install

# Rodar testes
npm test -- --no-coverage
```

### Cobertura baixa

```bash
# Verificar qual arquivo não tem testes
npm test -- --coverage 2>&1 | grep "| 0 |"

# Adicionar teste para aquele arquivo
```

---

## 📞 REFERÊNCIAS

- Plano completo: [PLANO_CONSOLIDACAO_GEMINI.md](PLANO_CONSOLIDACAO_GEMINI.md)
- Auditoria: [AUDITORIA_GEMINI_PRODUCAO.md](AUDITORIA_GEMINI_PRODUCAO.md)
- Sumário: [SUMARIO_EXECUTIVO_GEMINI.md](SUMARIO_EXECUTIVO_GEMINI.md)

---

**Última atualização**: 18/12/2025  
**Versão**: 1.0
