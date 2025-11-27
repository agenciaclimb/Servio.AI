# 🔐 PLANO DE AÇÃO - HOTSPOTS DE SEGURANÇA SONARCLOUD

**Data**: 27/11/2025 (Semana 4 - Dia 2)  
**Status**: Em Execução 🚀  
**Prioridade**: 🔴 CRÍTICA  
**Deadline**: 48-72 horas

---

## 📋 RESUMO EXECUTIVO

O SonarCloud identificou **3 Security Hotspots** que precisam ser revisados e corrigidos para passar no Quality Gate. Este documento detalha cada hotspot, identifica a causa raiz e propõe soluções.

---

## 🎯 HOTSPOTS IDENTIFICADOS

### Hotspot 1: Content Security Policy (CSP) Missing

**Arquivo**: Headers de Resposta HTTP  
**Severidade**: 🟡 ALTA  
**Status**: ⏳ Pendente

**Problema**:

- Falta de `Content-Security-Policy` header no backend
- Falta de `X-Frame-Options` header
- Deixa aplicação vulnerável a XSS e Clickjacking

**Código Atual**:

```javascript
// backend/src/index.js
app.use(express.json());
// ❌ SEM security headers
```

**Solução**:

```javascript
const helmet = require('helmet');

// Adicionar Helmet para security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'https:'],
        connectSrc: ["'self'", 'https://firebaseinstallations.googleapis.com'],
      },
    },
    frameguard: { action: 'deny' }, // X-Frame-Options: DENY
    referrerPolicy: { policy: 'no-referrer' },
  })
);
```

**Checklist**:

- [ ] Instalar `npm install helmet`
- [ ] Adicionar ao `package.json` backend
- [ ] Configurar CSP em `backend/src/index.js`
- [ ] Testar headers com: `curl -I http://localhost:8081`
- [ ] Validar no SonarCloud após push

---

### Hotspot 2: Missing Authorization Check in API Endpoints

**Arquivo**: `backend/src/index.js` (múltiplas rotas)  
**Severidade**: 🔴 CRÍTICA  
**Status**: ⏳ Pendente

**Problema**:

- Alguns endpoints não validam permissões adequadamente
- Permite que usuários acessem dados de outros usuários
- Violação do princípio de autorização granular

**Código Problemático**:

```javascript
// ❌ INSEGURO: Sem validar se o usuário é o dono
app.get('/api/users/:userId', async (req, res) => {
  const user = await admin.firestore().collection('users').doc(req.params.userId).get();
  res.json(user.data()); // Qualquer usuário autenticado vê dados privados!
});

// ❌ INSEGURO: Sem validar role
app.get('/api/admin/stats', async (req, res) => {
  // Retorna dados admin sem verificar se é admin
  res.json({ stats: '...' });
});
```

**Solução**:

```javascript
// ✅ SEGURO: Validar autorização
async function validateUserOwnership(req, res, next) {
  const requestingUser = req.user?.email; // De Firebase Auth
  const targetUserId = req.params.userId;

  if (requestingUser !== targetUserId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

async function requireAdmin(req, res, next) {
  const userDoc = await admin.firestore().collection('users').doc(req.user.email).get();

  if (userDoc.data()?.type !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

// Usar middleware
app.get('/api/users/:userId', validateUserOwnership, async (req, res) => {
  // Agora é seguro - só o dono acessa seus dados
  const user = await admin.firestore().collection('users').doc(req.params.userId).get();
  res.json(user.data());
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  // Agora é seguro - só admins acessam
  res.json({ stats: '...' });
});
```

**Checklist**:

- [ ] Auditar ALL endpoints em `backend/src/index.js`
- [ ] Adicionar `validateUserOwnership` middleware
- [ ] Adicionar `requireAdmin` middleware
- [ ] Adicionar `requireProvider` middleware
- [ ] Testar com usuários não-autorizados (deve rejeitar)
- [ ] Documentar permissões esperadas para cada rota
- [ ] Validar no SonarCloud

---

### Hotspot 3: Firestore Security Rules - Insecure Default Permissions

**Arquivo**: `firestore.rules`  
**Severidade**: 🔴 CRÍTICA  
**Status**: ⏳ Pendente

**Problema**:

- Rules permitem acesso muito permissivo
- Backend pode sobrescrever dados de usuários
- Falta validação de quem está escrevendo

**Código Atual (INSEGURO)**:

```javascript
match /jobs/{jobId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;  // ❌ QUALQUER usuário autenticado pode escrever em qualquer job!
}

match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;  // ✅ OK - só o próprio user
}
```

**Solução Corrigida**:

```javascript
// Helper functions
function isSignedIn() {
  return request.auth != null;
}

function isUserEmail(email) {
  return request.auth.token.email == email;
}

function isJobParticipant(jobId) {
  let job = get(/databases/(default)/documents/jobs/$(jobId)).data;
  return isUserEmail(job.clientId) || isUserEmail(job.providerId);
}

function isAdmin() {
  let user = get(/databases/(default)/documents/users/$(request.auth.token.email)).data;
  return user.type == 'admin';
}

// Rules corrigidas
match /jobs/{jobId} {
  allow read: if isSignedIn();  // Qualquer user autenticado lê
  allow create: if isSignedIn() && request.auth.token.email == request.resource.data.clientId;  // Cliente cria seu job
  allow update: if isSignedIn() && isJobParticipant(jobId);  // Participantes atualizam
  allow delete: if isAdmin() || (isUserEmail(resource.data.clientId) && resource.data.status == 'cancelled');
}

match /users/{userId} {
  allow read: if isSignedIn();
  allow write: if isUserEmail(userId);  // Só o próprio user escreve
  allow update: if isUserEmail(userId) && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['type', 'role']);  // Não pode mudar tipo/role
}

match /admin_logs/{log} {
  allow write: if isAdmin();  // Só admin escreve logs
  allow read: if isAdmin();
}

match /disputes/{disputeId} {
  allow read: if isSignedIn() && (isUserEmail(resource.data.clientId) || isUserEmail(resource.data.providerId) || isAdmin());
  allow write: if isAdmin() || isUserEmail(resource.data.clientId) || isUserEmail(resource.data.providerId);
  allow create: if isSignedIn();
}
```

**Checklist**:

- [ ] Revisar cada `match` block em `firestore.rules`
- [ ] Implementar helper functions (isAdmin, isJobParticipant, etc)
- [ ] Testar permissões com Firebase Emulator
- [ ] Testar com usuários diferentes (client, provider, admin)
- [ ] Validar que campos críticos não podem ser alterados (type, role)
- [ ] Deploy rules: `firebase deploy --only firestore:rules`
- [ ] Validar no SonarCloud

---

## 🚀 PLANO DE EXECUÇÃO

### Fase 1: Implementação (Hoje - Dia 2)

```
1. 09:00 - 10:00  → Hotspot 1: CSP Headers (30-45 min)
2. 10:00 - 12:00  → Hotspot 2: Authorization Middleware (90 min)
3. 12:00 - 13:00  → Pausa/Almoço
4. 13:00 - 15:00  → Hotspot 3: Firestore Rules (120 min)
5. 15:00 - 16:00  → Testes e validação
```

### Fase 2: Validação (Dia 3)

```
1. Executar full test suite
2. Testar manualmente as permissões
3. Verificar no SonarCloud se hotspots foram marcados como "Reviewed"
4. Commit e push para triggerar análise final
```

---

## 📊 VALIDAÇÃO PÓS-CORREÇÃO

### Teste 1: CSP Headers

```bash
# Verificar headers no backend rodando
curl -I http://localhost:8081/api/jobs

# Esperado:
# Content-Security-Policy: default-src 'self'; ...
# X-Frame-Options: DENY
```

### Teste 2: Authorization

```bash
# Tentar acessar dados de outro usuário (deve falhar)
curl -H "Authorization: Bearer $TOKEN_USER_A" \
  http://localhost:8081/api/users/user_b@example.com
# Esperado: 403 Forbidden
```

### Teste 3: Firestore Rules

```bash
# Usar Firebase Emulator ou testar em staging
# 1. User A tenta sobrescrever Job de User B → ❌ Falha (correto)
# 2. Client tenta mudar seu tipo para 'admin' → ❌ Falha (correto)
# 3. Admin consegue criar admin log → ✅ Sucesso (correto)
```

---

## 🔗 REFERÊNCIAS

### Documentação Oficial

- [OWASP Top 10 - A01:2021 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [Helmet.js - Express Security](https://helmetjs.github.io/)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)
- [Content Security Policy - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

### Documentação Servio.AI

- `SECURITY_CHECKLIST.md` - Auditoria de segurança completa
- `firestore.rules` - Rules atuais (a corrigir)
- `backend/src/index.js` - Backend (a corrigir)

---

## ✅ CHECKLIST FINAL

- [ ] **Hotspot 1**: CSP Headers implementado e testado
- [ ] **Hotspot 2**: Autorização validada em todos endpoints
- [ ] **Hotspot 3**: Firestore rules corrigidas e deployadas
- [ ] **Testes**: Suite de testes passando (incluindo testes de segurança)
- [ ] **SonarCloud**: Hotspots marcados como "Reviewed" ou "Fixed"
- [ ] **Documentação**: Updated `SECURITY_CHECKLIST.md` com mudanças
- [ ] **Commit**: Clean commit message com referência aos hotspots
- [ ] **Validação**: Quality Gate passando no SonarCloud

---

## 📝 PRÓXIMOS PASSOS APÓS HOTSPOTS

1. ✅ Hotspots resolvidos → Quality Gate deve passar
2. 📊 Reduzir **176 → <100 issues** abertos
3. 📈 Aumentar cobertura de testes **48% → 55-60%**
4. 🧪 Testes de endpoints (API routes)
5. 🔧 Testes de utilitários e custom hooks

**Meta da Semana 4**: 55-60% de cobertura + 0 hotspots críticos + <100 issues

---

**Status**: 🟡 **Em Análise - Pronto para Implementação**  
**Responsável**: Seu Time  
**Data de Revisão**: 28/11/2025  
**Contato**: agenciaclimb130850@sonarcloud.io
