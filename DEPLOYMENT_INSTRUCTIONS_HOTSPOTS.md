# 🚀 INSTRUÇÕES DE DEPLOYMENT - HOTSPOTS RESOLVIDOS

**Data**: 27/11/2025  
**Responsável**: Security Team  
**Status**: Pronto para Produção

---

## ✅ PRÉ-DEPLOYMENT CHECKLIST

### 1. Backend Changes (Helmet + Authorization Middleware)

- [x] Helmet instalado em `backend/package.json`
- [x] `authorizationMiddleware.js` criado
- [x] Imports adicionados a `backend/src/index.js`
- [x] 12+ rotas protegidas com middleware
- [x] ESLint validado (pre-commit)
- [x] Sem dependências quebradas

**Status**: ✅ PRONTO PARA DEPLOY

### 2. Firestore Security Rules

- [x] Users collection protegida (PII prevention)
- [x] Jobs collection restrita
- [x] Proposals/Bids validadas
- [x] Messages com anti-spoofing
- [x] Analytics protegidas
- [x] Admin logs implementado
- [x] Sem sintaxe errors

**Status**: ✅ PRONTO PARA DEPLOY

---

## 🔧 PASSO 1: DEPLOY BACKEND CHANGES

### Pré-requisitos:

```powershell
# Verificar que está no branch main
git branch

# Trazer mudanças mais recentes
git pull origin main

# Verificar status
git log --oneline -5
```

### Build & Test:

```powershell
# Frontend
npm run build
npm test

# Backend
cd backend
npm install
npm test
npm start  # Verificar que inicia sem erros
```

### Deploy para Cloud Run:

```bash
# Assumindo que as mudanças já estão em main branch
# GitHub Actions dispara automaticamente:

# 1. Build de docker image
# 2. Push para Google Cloud Registry
# 3. Deploy para Cloud Run (us-west1)
```

**Tempo Estimado**: 15-20 min

---

## 🔧 PASSO 2: DEPLOY FIRESTORE RULES

### Pré-requisitos:

```bash
# Validar Firebase CLI instalado
firebase --version

# Login (se necessário)
firebase login

# Verificar que está apontando pro projeto correto
firebase projects:list
firebase use --list
```

### Deploy das Regras:

```bash
# Do diretório raiz do projeto
firebase deploy --only firestore:rules --force

# Saída esperada:
# ✔ Deploying firestore rules
# ✔ Firestore Rules have been deployed successfully.
```

**Tempo Estimado**: 2-3 min

### Rollback (se necessário):

```bash
# Se houver problemas, reverter para versão anterior
firebase firestore:indexes:list  # Verificar versão anterior
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules --force
```

---

## ✅ PASSO 3: VALIDAÇÃO PÓS-DEPLOYMENT

### 3.1 Validar Headers de Segurança

```powershell
# Testar CSP Headers
curl -I https://api.servio-ai.com/api/health

# Esperado - Deve ver headers:
# Content-Security-Policy: ...
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=31536000
# X-Content-Type-Options: nosniff
```

### 3.2 Validar Authorization Middleware

```bash
# Teste 1: Sem autenticação (deve retornar 401)
curl -X GET https://api.servio-ai.com/api/jobs

# Teste 2: Com token válido de cliente
TOKEN="seu_token_aqui"
curl -X GET https://api.servio-ai.com/api/jobs \
  -H "Authorization: Bearer $TOKEN"

# Teste 3: Tentar acessar recurso alheio (deve retornar 403)
curl -X GET https://api.servio-ai.com/api/users/outro_usuario@email.com \
  -H "Authorization: Bearer $TOKEN"
```

### 3.3 Validar Firestore Rules

```bash
# Testar com Firebase Emulator (local development)
firebase emulators:start

# Ou testar leitura de documento protegido
db.collection('users').doc('user@example.com').get()
# Deve retornar acesso negado se não for proprietário
```

### 3.4 Verificar SonarCloud

1. Ir para: https://sonarcloud.io/project/overview?id=agenciaclimb_Servio.AI
2. Verificar se hotspots foram reduzidos de 3 para 0
3. Validar Quality Gate status

---

## 📊 MÉTRICAS DE SUCESSO

### Antes do Deployment:

```
SonarCloud Hotspots: 3
  - CSP Headers Missing ❌
  - Authorization Bypass ❌
  - Firestore Rules Insecure ❌

Test Coverage: 48.19%
Quality Gate: FAILED
```

### Depois do Deployment:

```
SonarCloud Hotspots: 0 ✅
  - CSP Headers ✅ IMPLEMENTED
  - Authorization Middleware ✅ IMPLEMENTED
  - Firestore Rules ✅ IMPLEMENTED

Test Coverage: 48.19% (unchanged - security work doesn't impact coverage)
Quality Gate: PASSED ✅
```

---

## 🚨 PROBLEMAS CONHECIDOS & SOLUTIONS

### Problema 1: Firestore Rules Syntax Error

```
Error: Rule syntax error on line X
```

**Solução**:

- Validar arquivo `firestore.rules` com Firebase emulator
- Verificar indentação (deve ser 2 espaços)
- Usar Firebase console para debugging

### Problema 2: Authorization Returns 403 Unexpectedly

```
Error: 403 Forbidden - Access denied
```

**Possíveis Causas**:

- Usuário não é proprietário do recurso
- JWT token expirado
- Email não corresponde no Firestore

**Debug**:

```javascript
// Em authorizationMiddleware.js, adicionar logs
console.log(`User email: ${req.user.email}`);
console.log(`Requested resource: ${paramName}`);
console.log(`Match: ${req.user.email === req.params[paramName]}`);
```

### Problema 3: CSP Blocks Legitimate Requests

```
Refused to load the script ...
due to Content Security Policy
```

**Solução**:

- Adicionar origem a CSP directives em `index.js`
- Exemplo:

```javascript
scriptSrc: ["'self'", "'unsafe-inline'", 'https://new-domain.com'];
```

---

## 📝 DOCUMENTAÇÃO

### Para Desenvolvedores:

- Ler: `backend/src/authorizationMiddleware.js` (comentários detalhados)
- Ler: `firestore.rules` (comentários em cada collection)
- Referência: DOCUMENTO_MESTRE_SERVIO_AI.md

### Para DevOps:

- Deploy Backend: GitHub Actions (.github/workflows/ci.yml)
- Deploy Rules: `firebase deploy --only firestore:rules`
- Monitoring: Google Cloud Console + Firebase Console

### Para Product/Security:

- Entender mudanças: HOTSPOTS_FINAL_RESOLUTION.md
- SonarCloud Dashboard: https://sonarcloud.io/...
- Auditoria: Novo collection `admin_logs` em Firestore

---

## 🔄 ROLLBACK PROCEDURE (se necessário)

### Rollback Backend:

```bash
# Se deployment quebrou, reverter commit
git revert 1a9124b  # Revert authorization middleware
git revert 30bb147  # Revert Helmet headers

# Redeploy via GitHub Actions
git push origin main
```

### Rollback Firestore Rules:

```bash
# Voltar para versão anterior
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules --force

# Depois fix o problema e redeploy
git checkout HEAD firestore.rules
firebase deploy --only firestore:rules --force
```

---

## 📞 COMUNICAÇÃO

### Notificações Necessárias:

- [ ] Notify Security Team - Hotspots resolvidos
- [ ] Notify DevOps - Ready for production deployment
- [ ] Notify Product - Quality Gate improvements
- [ ] Update Status Page - Security improvements active

### Escalation Contacts:

- **Security Lead**: security@servio-ai.com
- **DevOps Lead**: devops@servio-ai.com
- **CTO**: engineering@servio-ai.com

---

## ✅ SIGN-OFF

| Role     | Name | Date       | Status     |
| -------- | ---- | ---------- | ---------- |
| Security | TBD  | 27/11/2025 | 🔄 Pending |
| DevOps   | TBD  | 27/11/2025 | 🔄 Pending |
| Product  | TBD  | 27/11/2025 | 🔄 Pending |

---

**Next Steps**:

1. Code review approval
2. Run final tests
3. Deploy to production
4. Validate in SonarCloud
5. Close security hotspots issue
