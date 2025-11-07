# 🎯 RESUMO DA INVESTIGAÇÃO - FIRESTORE 500 ERRORS

## ✅ O QUE DESCOBRIMOS

### Problema

Endpoints `/users` e `/jobs` retornam **500 Internal Server Error**

### Causa Raiz

**Firestore Security Rules** bloqueiam acesso do backend porque:

1. Rules exigem `request.auth != null`
2. Cloud Run backend não está autenticado corretamente no Firestore
3. Service Account pode não ter roles IAM corretas

### Por que Cloud Storage funciona e Firestore não?

- Cloud Storage: Usa roles IAM diferentes (Storage Admin/Object Admin)
- Firestore: Requer `datastore.user` ou `firebase.admin` role

## 📋 PRÓXIMOS PASSOS (MANUAL VIA CONSOLE)

### ✅ Passo 1: Identificar Service Account do Cloud Run

**Acesse:** https://console.cloud.google.com/run/detail/us-west1/servio-backend?project=gen-lang-client-0737507616

1. Clique na aba **"YAML"** ou **"SECURITY"**
2. Procure por: `serviceAccountName`
3. **Anote o email da SA** (exemplo: `123456789-compute@developer.gserviceaccount.com`)

---

### ✅ Passo 2: Verificar Roles IAM da Service Account

**Acesse:** https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0737507616

1. Use Ctrl+F e busque pelo email da SA (do Passo 1)
2. **Verifique se tem uma destas roles:**
   - ☑️ Cloud Datastore User (`roles/datastore.user`)
   - ☑️ Firebase Admin (`roles/firebase.admin`)
   - ☑️ Cloud Datastore Owner (`roles/datastore.owner`)

**Se NÃO tiver essas roles:**

1. Clique no botão **"GRANT ACCESS"** (topo da página)
2. Em "New principals", cole o email da Service Account
3. Em "Select a role", busque: **"Cloud Datastore User"**
4. Clique **"SAVE"**
5. Aguarde 1-2 minutos para propagação

---

### ✅ Passo 3: Verificar Coleções do Firestore

**Acesse:** https://console.firebase.google.com/project/gen-lang-client-0737507616/firestore/databases/-default-/data

**Verifique se existem:**

- ☑️ Coleção `users` (com pelo menos 1 documento de teste)
- ☑️ Coleção `jobs` (com pelo menos 1 documento de teste)

**Se as coleções não existirem:**

```powershell
# Executar seed script localmente
node scripts/firestore_seed.mjs
```

---

### ✅ Passo 4: Verificar Logs de Erros do Cloud Run

**Acesse:** https://console.cloud.google.com/run/detail/us-west1/servio-backend/logs?project=gen-lang-client-0737507616

**Busque por:**

- "Error getting users"
- "Error getting jobs"
- "PERMISSION_DENIED"
- "UNAUTHENTICATED"
- "Missing or insufficient permissions"

**Se encontrar erros de permissão:** Volte ao Passo 2 e adicione a role IAM

---

### ✅ Passo 5: Re-testar Backend

Após fazer as correções acima:

```powershell
# Executar smoke test novamente
node scripts/backend_smoke_test.mjs
```

**Resultado esperado:**

```
✓ Health Check (200)
✓ List Users (200)    ← Deve PASSAR agora
✓ List Jobs (200)     ← Deve PASSAR agora
✓ Generate Upload URL (200)

Total: 4 | Passed: 4 | Failed: 0
```

---

## 🚨 SOLUÇÃO ALTERNATIVA (SE OS PASSOS ACIMA NÃO FUNCIONAREM)

### Opção: Modificar Security Rules Temporariamente

**⚠️ APENAS PARA DESENVOLVIMENTO/TESTES**

1. Edite `firestore.rules`
2. Adicione NO INÍCIO do bloco `match /databases/{database}/documents`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ⚠️ TEMPORÁRIO - Remover em produção
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }

    // ... resto das rules ...
  }
}
```

3. Deploy das rules:

```powershell
firebase deploy --only firestore:rules
```

4. Teste novamente:

```powershell
node scripts/backend_smoke_test.mjs
```

---

## 📚 DOCUMENTAÇÃO CRIADA

✅ `FIRESTORE_TROUBLESHOOTING.md` - Guia detalhado completo  
✅ `scripts/diagnose_firestore.mjs` - Script de diagnóstico HTTP  
✅ `scripts/check_cloudrun_permissions.ps1` - Script de verificação IAM  
✅ Documento mestre atualizado com análise completa

---

## 🎯 AÇÃO IMEDIATA RECOMENDADA

**COMEÇAR PELO PASSO 2** - Verificar e adicionar role IAM

É a causa mais provável e a mais fácil de resolver!

1. Abra: https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0737507616
2. Busque pela Service Account do Cloud Run
3. Adicione role "Cloud Datastore User"
4. Aguarde 1-2 minutos
5. Execute: `node scripts/backend_smoke_test.mjs`

---

## ❓ DÚVIDAS?

Consulte: `FIRESTORE_TROUBLESHOOTING.md` para guia completo passo-a-passo
