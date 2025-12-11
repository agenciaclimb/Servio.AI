# 🔄 MIGRAÇÃO PARA PROJETO SERVIOAI

**Data**: 2025-11-05  
**Ação**: Consolidação de 2 projetos Firebase em 1 único projeto limpo

---

## 📊 SITUAÇÃO ANTES DA MIGRAÇÃO

### Projetos Identificados:

1. **servioai** (projeto CORRETO - usar este!)
   - Project ID: `servioai`
   - Número: `540889654851`
   - Nome no Console: "ServioAI Antigo" (nome enganoso, mas é o correto!)
   - Status: Frontend `.env.local` configurado para este projeto, Firestore NÃO criado

2. **gen-lang-client-0737507616** (projeto para DELETAR)
   - Project ID: `gen-lang-client-0737507616`
   - Número: `100025076228`
   - Nome no Console: "ServioAI" (sem "Antigo")
   - Status: Backend Cloud Run deployado aqui (mas vamos migrar), Firestore NÃO criado
   - **Problema**: Erro `5 NOT_FOUND` no Firestore (database não existe)

**IMPORTANTE**: A nomenclatura "Antigo" no Console está invertida! O projeto `servioai` é o CORRETO.

### Causa Raiz dos Erros 500:

- Backend tentando acessar Firestore que não foi criado
- Logs mostraram: `Error getting users: Error: 5 NOT_FOUND`

---

## ✅ PASSOS DA MIGRAÇÃO (OPÇÃO 1)

### 1. ✅ Frontend Validado

- `.env.local` já configurado para `servioai`:
  ```bash
  VITE_FIREBASE_PROJECT_ID=servioai
  VITE_FIREBASE_API_KEY=[REDACTED_FOR_SECURITY]
  VITE_FIREBASE_AUTH_DOMAIN=servioai.firebaseapp.com
  ```

### 2. ✅ Workflow GitHub Actions Atualizado

- Arquivo: `.github/workflows/deploy-cloud-run.yml`
- Mudanças:
  ```yaml
  env:
    PROJECT_ID: servioai # antes: secrets.GCP_PROJECT_ID (gen-lang-client-0737507616)
    REGION: us-west1 # hardcoded, antes via secret
  ```

### 3. ⏳ Criar Firestore no Projeto `servioai`

**URL Direta**:

```
https://console.firebase.google.com/project/servioai/firestore
```

**Configurações**:

- **Database ID**: `(default)`
- **Location**: `us-west1` (mesma região do Cloud Run)
- **Mode**: **Firestore Native mode** (NÃO Datastore)
- **Security Rules**: Production mode (ou Test mode temporariamente)

**Por que `us-west1`?**

- Menor latência com Cloud Run
- Mesma região do backend deployado anteriormente

### 4. ⏳ Configurar Service Account no `servioai`

**Passo a passo via Console**:

1. Abrir IAM & Admin → Service Accounts:

   ```
   https://console.cloud.google.com/iam-admin/serviceaccounts?project=servioai
   ```

2. **Criar nova Service Account**:
   - Nome: `servio-cicd`
   - ID: `servio-cicd@servioai.iam.gserviceaccount.com`
   - Descrição: "CI/CD para GitHub Actions - Deploy Cloud Run + Artifact Registry"

3. **Conceder Roles** (passo 2 da criação):
   - `roles/owner` (Owner) - para gerenciar todos os recursos
   - OU roles específicas:
     - `roles/run.admin` (Cloud Run Admin)
     - `roles/artifactregistry.writer` (Artifact Registry Writer)
     - `roles/iam.serviceAccountUser` (Service Account User)
     - `roles/cloudbuild.builds.editor` (Cloud Build Editor)

4. **Gerar Chave JSON** (passo 3):
   - Tipo: JSON
   - **BAIXAR** o arquivo (ex: `servio-cicd-key.json`)
   - **GUARDAR COM SEGURANÇA** (nunca commitar!)

### 5. ⏳ Atualizar GitHub Secret `GCP_SA_KEY`

**Via GitHub Web**:

1. Ir para: `https://github.com/agenciaclimb/Servio.AI/settings/secrets/actions`
2. Editar secret: `GCP_SA_KEY`
3. **Colar TODO o conteúdo do JSON** baixado no passo 4
4. Salvar

**Via GitHub CLI** (alternativa):

```bash
gh secret set GCP_SA_KEY < servio-cicd-key.json --repo agenciaclimb/Servio.AI
```

### 6. ⏳ Habilitar APIs no Projeto `servioai`

**APIs Necessárias**:

- Cloud Run API
- Artifact Registry API
- Cloud Build API
- Firestore API
- Cloud Storage API

**Comando (se gcloud estiver autenticado)**:

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  --project=servioai
```

**Via Console** (alternativa):

```
https://console.cloud.google.com/apis/library?project=servioai
```

- Procurar cada API e clicar "Enable"

### 7. ⏳ Criar Artifact Registry Repository

**Via Console**:

```
https://console.cloud.google.com/artifacts?project=servioai
```

- Clicar "CREATE REPOSITORY"
- Nome: `servio-ai`
- Format: **Docker**
- Location: `us-west1` (Multi-region)
- Encryption: Google-managed
- Clicar "CREATE"

**Via gcloud**:

```bash
gcloud artifacts repositories create servio-ai \
  --repository-format=docker \
  --location=us-west1 \
  --description="Docker images para Servio.AI" \
  --project=servioai
```

### 8. ⏳ Re-deploy Backend no `servioai`

**Opção A: Via Git Tag** (automático):

```bash
git add .
git commit -m "fix: migrate to servioai project"
git tag v0.1.0-backend
git push origin feature/full-implementation --tags
```

**Opção B: Workflow Manual** (GitHub Actions):

1. Ir para: `https://github.com/agenciaclimb/Servio.AI/actions/workflows/deploy-cloud-run.yml`
2. Clicar "Run workflow"
3. Selecionar:
   - Branch: `feature/full-implementation`
   - Service: `backend`
4. Clicar "Run workflow"

### 9. ⏳ Validar Backend Funcionando

**Executar Smoke Test**:

```bash
node scripts/backend_smoke_test.mjs
```

**Resultado Esperado**:

```
✅ Health check: 200 OK
✅ List users: 200 OK (array vazio ou com dados)
✅ List jobs: 200 OK (array vazio ou com dados)
✅ Generate upload URL: 200 OK
```

### 10. ⏳ Atualizar `.env.local` com Nova URL Backend

Após deploy, a URL do Cloud Run será:

```bash
VITE_BACKEND_API_URL=https://servio-backend-XXXXX-uw.a.run.app
```

Atualizar no `.env.local` quando o deploy concluir.

---

## 🗑️ DELETAR PROJETO ANTIGO (APÓS VALIDAÇÃO)

**⚠️ ATENÇÃO**: Só execute isso depois que:

- Firestore estiver criado no `servioai`
- Backend estiver deployado e funcionando no `servioai`
- Smoke tests passarem 100%

### Passo a Passo:

1. **Backup final** (se houver dados importantes):

   ```bash
   gcloud firestore export gs://BUCKET_NAME/backup-final \
     --project=gen-lang-client-0737507616
   ```

2. **Desabilitar Cloud Run** (para parar billing):

   ```
   https://console.cloud.google.com/run?project=gen-lang-client-0737507616
   ```

   - Deletar services: `servio-backend`, `servio-ai`

3. **Deletar Artifact Registry** (liberar storage):

   ```
   https://console.cloud.google.com/artifacts?project=gen-lang-client-0737507616
   ```

   - Deletar repository `servio-ai`

4. **Deletar Projeto**:

   ```
   https://console.cloud.google.com/iam-admin/settings?project=gen-lang-client-0737507616
   ```

   - Scroll até "Shut down project"
   - Digitar: `gen-lang-client-0737507616`
   - Confirmar

**Observação**: Projeto fica em "pending deletion" por 30 dias (pode restaurar se necessário).

---

## 📝 CHECKLIST FINAL

- [ ] Firestore criado no `servioai`
- [ ] Service Account criada no `servioai`
- [ ] GitHub Secret `GCP_SA_KEY` atualizado
- [ ] APIs habilitadas no `servioai`
- [ ] Artifact Registry criado no `servioai`
- [ ] Backend re-deployado no `servioai`
- [ ] Smoke test passou (200 OK em todos endpoints)
- [ ] `.env.local` atualizado com nova URL backend
- [ ] Projeto antigo `gen-lang-client-0737507616` deletado

---

## 🎯 RESULTADO ESPERADO

**Arquitetura Final**:

```
┌─────────────────────────────────────────┐
│   Frontend (Firebase Hosting)          │
│   Projeto: servioai                     │
└──────────┬─────────────┬────────────────┘
           │             │
           ▼             ▼
┌──────────────────┐  ┌──────────────────┐
│ AI Service       │  │ Backend API      │
│ Cloud Run        │  │ Cloud Run        │
│ Projeto: servioai│  │ Projeto: servioai│
└──────────────────┘  └──────────────────┘
           │                    │
           └────────┬───────────┘
                    ▼
         ┌────────────────────┐
         │ Firestore (default)│
         │ Projeto: servioai  │
         │ Region: us-west1   │
         └────────────────────┘
```

**Benefícios**:

- ✅ 1 projeto único (sem confusão)
- ✅ ID limpo e profissional (`servioai`)
- ✅ Ambiente fresco (sem histórico de erros)
- ✅ Melhor organização para produção
- ✅ Firestore e Cloud Run na mesma região (menor latência)

---

**Autor**: GitHub Copilot  
**Última Atualização**: 2025-11-05 11:30 BRT
