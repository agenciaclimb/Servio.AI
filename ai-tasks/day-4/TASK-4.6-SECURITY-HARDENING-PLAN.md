# 🔐 TASK 4.6 - Security Hardening: Plano de Ação Detalhado

**Status**: Pronto para iniciar  
**Data**: 17/12/2025  
**Issue**: #49  
**Estimativa**: 6 horas

---

## 📋 Resumo da Task

Implementar camada de segurança enterprise no backend Servio.AI com:

1. Rate Limiting (Express + Redis)
2. API Key Rotation Automática
3. Advanced Audit Logging
4. Proteção CSRF + XSS
5. Security Headers (Helmet)
6. Validação rigorosa com Zod

---

## 🚀 Plano de Execução

### Fase 1: Rate Limiting (1h)

**Arquivo**: `backend/src/middleware/rateLimiter.js`

```javascript
// 1. Setup Redis store
// 2. Global limiter: 1000 req/15min
// 3. Auth limiter: 5 tentativas/15min
// 4. API limiter: 100 req/min
// 5. Payment limiter: 10 req/min
```

**Integração**:

- `backend/src/index.js`: app.use(globalLimiter)
- Por rota: authLimiter, apiLimiter, paymentLimiter

---

### Fase 2: API Key Manager + Audit Logger (1.5h)

**Arquivo 1**: `backend/src/services/apiKeyManager.js`

- generateNewKey()
- validateKey()
- rotateExpiredKeys() [7 dias]
- Firestore integration

**Arquivo 2**: `backend/src/services/auditLogger.js`

- log(action, userId, resource, details, ip, ua)
- getLogsForUser()
- alertOnSuspiciousActivity()

**Cloud Scheduler Job**:

- Rotar keys todos os dias

---

### Fase 3: CSRF + XSS + Security Headers (1h)

**Arquivo 1**: `backend/src/middleware/securityHeaders.js`

- helmet.js config
- CSP (Content Security Policy)
- HSTS, X-Frame-Options, etc.

**Arquivo 2**: `backend/src/middleware/csrfProtection.js`

- csurf middleware
- Token validation em POST/PUT/DELETE

**XSS Sanitização**:

- xss package
- Sanitizar req.body globalmente

---

### Fase 4: Validação com Zod (1h)

**Arquivo**: `backend/src/validators/requestValidators.js`

- Schema para createJob
- Schema para login
- Schema para payment
- Middleware validateRequest()

---

### Fase 5: Testes (1h)

**Arquivo 1**: `backend/tests/middleware/rateLimiter.test.js`

- Testar limite global
- Testar limite por endpoint
- Mock Redis store

**Arquivo 2**: `backend/tests/services/apiKeyManager.test.js`

- generateNewKey
- validateKey
- rotateExpiredKeys

**Arquivo 3**: `backend/tests/services/auditLogger.test.js`

- Log action
- Query logs

---

### Fase 6: Integração + Docs (0.5h)

- Integrar todos os middlewares em `backend/src/index.js`
- Adicionar dependências em `package.json`
- Atualizar `.env.example`
- Atualizar DOCUMENTO_MESTRE #update_log

---

## 📦 Dependências a Instalar

```bash
cd backend
npm install express-rate-limit rate-limit-redis helmet csurf xss zod redis
```

---

## ✅ Checklist de Validação

- [ ] Todos os middlewares criados
- [ ] Rate limiting ativo e testado
- [ ] API keys rotacionando automaticamente
- [ ] Audit logs sendo registrados
- [ ] CSRF + XSS proteção ativa
- [ ] Validação reforçada
- [ ] Testes >80% coverage
- [ ] npm test: 100% passing
- [ ] npm audit: 0 vulnerabilities
- [ ] Build sem erros: npm run build
- [ ] Backend rodando localmente: npm start
- [ ] Documento Mestre atualizado

---

## 🎯 Próximas Tarefas

**Task 4.7** (Próxima): Data Privacy & GDPR Compliance

- Anonimização de dados
- Export de dados pessoais
- Direito ao esquecimento
- Retenção de logs

---

## 📞 Checklist de Comunicação

1. ✅ Task spec criada em `ai-tasks/day-4/task-4.6.md`
2. ⏳ Copilot vai implementar
3. ⏳ PR vai ser criada
4. ⏳ Gemini vai auditar
5. ⏳ Merge e deploy automático

---

**Gerenciador**: Orchestrator  
**Executor**: Copilot (GitHub Copilot no VS Code)  
**Auditor**: Gemini (Claude/OpenAI)  
**Data Alvo**: 17/12/2025 (hoje)
