# 🔥 RESOLUÇÃO: Firestore 500 Errors no Cloud Run Backend

## 📊 Diagnóstico

**Problema identificado:** Endpoints `/users` e `/jobs` retornam 500 errors

**Causa raiz:** Firestore Security Rules bloqueiam acesso não autenticado, mas o Cloud Run backend não está se autenticando ao acessar o Firestore.

## 🔍 Análise das Security Rules

O arquivo `firestore.rules` atual requer autenticação para TODAS as operações:

```javascript
function isSignedIn() {
  return request.auth != null;  // ← Requer Firebase Auth
}

match /users/{userId} {
  allow read: if true;  // Permite leitura pública
  // Mas isSignedIn() é usada em outras rules
}

match /jobs/{jobId} {
  allow read: if isJobParticipant(jobId);  // ← Requer auth
}
```

**Problema:** Cloud Run backend usa Admin SDK, mas as Security Rules aplicam-se a TODAS as requisições, incluindo Admin SDK quando não configurado corretamente.

## ✅ Soluções Possíveis

### Opção 1: Configurar Service Account com bypass das Security Rules (RECOMENDADO)

O Firebase Admin SDK deve ignorar Security Rules quando autenticado corretamente.

**Verificar:**

1. Cloud Run service está usando Service Account correta
2. SA tem role `roles/datastore.user` ou `roles/firebase.admin`

**Comandos para verificar:**

```bash
# 1. Verificar qual SA o Cloud Run usa
gcloud run services describe servio-backend \
  --region=us-west1 \
  --project=gen-lang-client-0737507616 \
  --format="value(spec.template.spec.serviceAccountName)"

# 2. Adicionar role Firestore à SA (se necessário)
gcloud projects add-iam-policy-binding gen-lang-client-0737507616 \
  --member="serviceAccount:[SA_EMAIL_AQUI]" \
  --role="roles/datastore.user"
```

### Opção 2: Atualizar Security Rules para permitir backend

Adicionar uma rule que permite acesso administrativo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Permitir acesso total ao backend (APENAS para desenvolvimento/testes)
    // REMOVER EM PRODUÇÃO e usar roles IAM corretas
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

⚠️ **ATENÇÃO:** Esta é uma solução TEMPORÁRIA apenas para testes!

### Opção 3: Verificar inicialização do Admin SDK

No arquivo `backend/src/index.js`, o Admin SDK é inicializado assim:

```javascript
try {
  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp(); // ← Auto-detecta credenciais do Cloud Run
  }
} catch (_) {
  // Allow running without firebase credentials locally
}
```

**Verificar:**

- Admin SDK está inicializando corretamente no Cloud Run
- Não há erros no bloco try/catch que estão sendo silenciados

## 🎯 Plano de Ação Recomendado

### Passo 1: Verificar Service Account (Manual via Console)

Acesse: https://console.cloud.google.com/run/detail/us-west1/servio-backend?project=gen-lang-client-0737507616

1. Clique na aba "YAML"
2. Procure por `serviceAccountName`
3. Anote o email da Service Account

### Passo 2: Verificar IAM Roles (Manual via Console)

Acesse: https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0737507616

1. Busque pela Service Account do Passo 1
2. Verifique se tem uma destas roles:
   - `Cloud Datastore User` (roles/datastore.user)
   - `Firebase Admin` (roles/firebase.admin)
   - `Cloud Datastore Owner` (roles/datastore.owner)

Se NÃO tiver, adicione manualmente:

1. Clique em "Grant Access"
2. Cole o email da Service Account
3. Selecione role: "Cloud Datastore User"
4. Save

### Passo 3: Verificar Firestore Collections (Manual via Console)

Acesse: https://console.firebase.google.com/project/gen-lang-client-0737507616/firestore/databases/-default-/data

Verifique se existem as coleções:

- ✅ `users` (com pelo menos 1 documento)
- ✅ `jobs` (com pelo menos 1 documento)

Se não existirem, crie manualmente ou use o seed script:

```bash
node scripts/firestore_seed.mjs
```

### Passo 4: Verificar Logs do Cloud Run

Acesse: https://console.cloud.google.com/run/detail/us-west1/servio-backend/logs?project=gen-lang-client-0737507616

Procure por erros relacionados a:

- "Error getting users:"
- "Error getting jobs:"
- "PERMISSION_DENIED"
- "UNAUTHENTICATED"

### Passo 5: Solução Temporária (SE NECESSÁRIO)

Se após os passos acima ainda não funcionar, aplique a Security Rule temporária:

1. Edite `firestore.rules`
2. Adicione no início (dentro do `match /databases/{database}/documents`):

```javascript
// TEMPORÁRIO - Permitir backend acessar dados
match /{document=**} {
  allow read, write: if request.time < timestamp.date(2025, 12, 31);
}
```

3. Deploy das rules:

```bash
firebase deploy --only firestore:rules
```

4. Teste novamente:

```bash
node scripts/backend_smoke_test.mjs
```

## 📝 Checklist de Verificação

- [ ] Service Account identificada no Cloud Run
- [ ] Service Account tem role `datastore.user` ou `firebase.admin`
- [ ] Coleções `users` e `jobs` existem no Firestore
- [ ] Logs do Cloud Run não mostram erros de permissão
- [ ] Admin SDK inicializando corretamente (sem erros silenciosos)
- [ ] Security Rules permitem acesso backend (temporário ou via IAM)

## 🔗 Links Úteis

- Cloud Run Service: https://console.cloud.google.com/run/detail/us-west1/servio-backend?project=gen-lang-client-0737507616
- IAM & Admin: https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0737507616
- Firestore Data: https://console.firebase.google.com/project/gen-lang-client-0737507616/firestore
- Cloud Run Logs: https://console.cloud.google.com/run/detail/us-west1/servio-backend/logs?project=gen-lang-client-0737507616

## ✅ Teste Final

Após aplicar correções, execute:

```bash
node scripts/backend_smoke_test.mjs
```

**Resultado esperado:**

```
✓ Health Check (200)
✓ List Users (200)  ← Deve passar
✓ List Jobs (200)   ← Deve passar
✓ Generate Upload URL (200)

Total: 4 | Passed: 4 | Failed: 0
```
