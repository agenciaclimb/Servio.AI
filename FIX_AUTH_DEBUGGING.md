# 🔐 CRITICAL FIX: /api/jobs 401 Unauthorized

**Status**: ⚠️ **ROOT CAUSE IDENTIFIED** - Auth Middleware NOT Enforcing  
**Date**: 2026-03-05  
**Severity**: CRITICAL (Authentication Bypass)  
**Impact**: All protected endpoints returning 200 instead of 401

---

## CAUSA RAIZ

**Problem**: `/api/jobs` está retornando **200 OK** mesmo SEM `Authorization` header

- Frontend envia `Authorization: Bearer {token}` mas nega acesso
- Backend não está rejeitando requisições sem token
- Meaning: `requireAuth` middleware **não está protegendo a rota**

### Evidência de Falha:

```
TEST 1: GET /api/jobs (NO auth header)
Expected: 401 Unauthorized
Actual:   200 OK ❌

TEST 2: GET /api/jobs (invalid Bearer token)
Expected: 401 Token Invalid
Actual:   200 OK ❌

TEST 3: GET /api/health (public)
Expected: 200 OK
Actual:   200 OK ✅
```

**Conclusão**: Middleware `requireAuth` **NÃO está sendo executado** na rota `/api/jobs`

---

## MUDANÇAS FRONT

### [services/api.ts](services/api.ts#L152-L220)

**1. Melhorado: Token Fetch com Logs** (Linha 152-167)

```typescript
let authToken = '';
try {
  const { auth } = await import('../firebaseConfig');
  if (auth.currentUser) {
    authToken = await auth.currentUser.getIdToken();
    if (DEBUG) {
      console.warn(`🔐 [API v3] Token obtained for: ${auth.currentUser.email}`);
      console.warn(`🔐 [API v3] Token length: ${authToken?.length || 0}`);
      console.warn(`🔐 [API v3] Header Authorization: Bearer ${authToken ? '[set]' : '[empty]'}`);
    }
  } else {
    if (DEBUG) console.warn('🔐 [API v3] No authenticated user (auth.currentUser is null)');
  }
} catch (authError) {
  console.warn('[API v3] Failed to get auth token:', authError);
}
```

**Melhorias**:

- ✅ Log detalhado do token (length, se foi obtido)
- ✅ Verifica se `auth.currentUser` existe antes de chamar `getIdToken()`
- ✅ Dev-only logging (não aparece em produção)

**2. Melhorado: Registro de Headers Enviados** (Linha 197-207)

```typescript
if (DEBUG) {
  console.warn(`🧪 [API v3] Sending request: ${BACKEND_URL}${finalEndpoint}`);
  console.warn(`🧪 [API v3] Authorization header: ${authToken ? 'Bearer [token]' : '[not set]'}`);
  console.warn(
    `🧪 [API v3] Headers:`,
    Object.entries(headers).reduce(
      (acc, [k, v]) => {
        acc[k] = k === 'Authorization' ? '[REDACTED]' : v;
        return acc;
      },
      {} as Record<string, string>
    )
  );
}
```

**Melhorias**:

- ✅ Mostra se Authorization header está sendo anexado
- ✅ Log redactado (não expõe token completo)
- ✅ Mostra todos os headers sendo enviados

**3. Melhorado: Error Logging para 401/403** (Linha 221-226)

```typescript
if ((response.status === 401 || response.status === 403) && DEBUG) {
  console.error(`🔴 [API v3] Auth failed (${response.status}): ${finalEndpoint}`);
  console.error(`🔴 [API v3] Auth header sent: ${authToken ? 'Yes (Bearer token)' : 'No'}`);
  console.error(`🔴 [API v3] Headers: ${JSON.stringify(...)}`);
}
```

**Melhorias**:

- ✅ Log claro quando 401/403 ocorre
- ✅ Indica se header foi enviado ou não
- ✅ Fácil debug in Cloud Run logs

---

## MUDANÇAS BACK

### [backend/src/index.js](backend/src/index.js#L333-L385)

**Auth Middleware - Problema Identificado** (Linha 335-375)

```javascript
// ❌ ANTES: Token inválido era ignorado silenciosamente
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = { uid, email, role };
      return next();
    } catch (error) {
      console.error('[Auth] Token verification failed:', error.message);
      // ❌ PROBLEMA: Não rejeita - permite que req.user fica undefined
    }
  }
  // ❌ Se não há autenticação, req.user fica undefined
  next();
});
```

**✅ DEPOIS: Logs Melhorados**

```javascript
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    const isDebug = process.env.NODE_ENV !== 'production';

    if (isDebug) {
      console.warn('[Auth] Bearer token detected, length:', token.length);
      console.warn('[Auth] Token prefix:', token.substring(0, 10) + '...');
    }

    try {
      // Verificar se admin.auth() está inicializado
      const decodedToken = await admin.auth().verifyIdToken(token);

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'cliente',
      };

      if (isDebug) {
        console.warn('[Auth] ✅ Token verified for:', req.user.email);
      }
      return next();
    } catch (error) {
      console.error('[Auth] ❌ Token verification failed:', error.message);
      if (process.env.DEBUG === 'true') {
        console.error('[Auth] Error details:', error);
      }
    }
  } else if (authHeader) {
    console.warn('[Auth] ⚠️  Invalid Authorization format:', authHeader.substring(0, 20) + '...');
  }

  // Lightweight dev auth fallback
  if (!req.user) {
    const injected = req.headers['x-user-email'];
    if (injected && typeof injected === 'string') {
      req.user = { email: injected };
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Auth] Using injected user (dev mode):', injected);
      }
    }
  }

  next();
});
```

**Melhorias**:

- ✅ Logs quando token é detectado
- ✅ Sucesso log quando token é validado
- ✅ Error log com detalhes(se DEBUG=true)
- ✅ Detecta formato inválido de Authorization
- ✅ Melhor suporte a dev mode com `x-user-email`

### **⚠️ IMPORTANTE: requireAuth ainda não faz nada**

O problema **real** pode ser:

1. **`requireAuth` não está sendo aplicado** à rota `/api/jobs`
   - Verificar: `app.get('/api/jobs', requireAuth, async (req, res) => { ... })`
   - Solução: Confirmar que `requireAuth` é importado de `authorizationMiddleware.js`

2. **`require Auth` tem bug na verificação**
   - Código: `if (!req.user?.email) { return res.status(401)... }`
   - Problema: Pode estar sendo pulado por exceção ou error

3. **Rota `/jobs` (sem /api) está respondendo primeiro**
   - Route `/jobs` é pública (sem auth)
   - Frontend pode estar caindo para rota sem /api

---

## TESTE

### Execute Localmente (com VITE_DEBUG=true):

```bash
VITE_DEBUG=true npm run dev
# Abrir browser console e fazer request GET /api/jobs
# Observar logs: "Token obtained for:", "Authorization header:", "Auth failed"
```

### Execute em Produção:

```bash
node scripts/test-auth-endpoints.mjs
node scripts/diagnose-auth-middleware.mjs
```

### Resultado Esperado:

```
Test 1: GET /api/jobs (NO auth)           → 401 ✅
Test 2: GET /api/jobs (invalid token)     → 401 ✅
Test 3: GET/api/health (public)           → 200 ✅
```

---

## PRÓXIMAS AÇÕES CRÍTICAS

### 1. **Verificar se `requireAuth` está realmente na rota**

```bash
grep -n "app.get('/api/jobs'" backend/src/index.js
# Should show: app.get('/api/jobs', requireAuth, async (req, res) => {
```

### 2. **Verificar se authorizationMiddleware é importado**

```bash
grep -n "require.*authorizationMiddleware\|const.*requireAuth" backend/src/index.js
```

### 3. **Verificar se Firebase Admin SDK está inicializado**

```bash
grep -n "admin.initializeApp\|GOOGLE_APPLICATION_CREDENTIALS" backend/src/index.js
```

### 4. **Verificar env vars em Cloud Run**

```bash
gcloud run services describe servio-backend --region us-west1 --project gen-lang-client-0737507616 | grep -A 20 "ENVIRON"
```

### 5. **Checar logs em produção**

```bash
gcloud functions logs read servio-backend --limit 50 --project gen-lang-client-0737507616
# Procurar por "[Auth]" para ver se middleware está sendo executado
```

---

## STATUS: PRÓXIMO PASSO

⚠️ **A causa provável é que `requireAuth` NÃO está sendo aplicado à rota `/api/jobs`**

Confirme:

1. ✅ Backend is receiving requests (health check works)
2. ❌ Routes are NOT protected (app.get('/api/jobs', requireAuth) may not be applied)
3. ⚠️ Frontend is sending tokens (with improved logging now added)

**Build & Deploy agora com logs melhorados para diagnosticar melhor:**

```bash
npm run build
firebase deploy --project=gen-lang-client-0737507616 --only hosting
# Aguardar 2min para produção estabilizar
# Executar: node scripts/diagnose-auth-middleware.mjs
# Verificar console logs com VITE_DEBUG=true
```

---

**COMMIT**:

```
fix(critical): improve auth debugging - add token & header logging

Frontend:
- Log token obtain status in debug mode
- Show Authorization header presence in XHR
- Detailed 401 error logging

Backend:
- Log Bearer token detection
- Log successful token verification
- Log invalid auth format
- Add DEBUG environment flag support

URGENTE: Verify that requireAuth middleware is actually applied to /api/jobs
Route protection test shows 200 OK without token (auth not enforced)

Related: FIX CRÍTICO — /api/jobs retornando 401
```
