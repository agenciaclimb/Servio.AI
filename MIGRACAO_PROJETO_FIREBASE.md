# 🔄 Migração de Projeto Firebase: gen-lang-client → servioai

## 📋 SITUAÇÃO ATUAL (CONFLITO DETECTADO)

### ❌ Problema Identificado

- **Frontend**: usando projeto `servioai` (540889654851) ✅
- **Backend Cloud Run**: deployado em `gen-lang-client-0737507616` ❌
- **Firestore**: banco de dados está no projeto antigo ❌
- **Service Account CI/CD**: criado no projeto antigo ❌

### 🚨 Impactos

1. Auth quebrado: tokens Firebase não validam entre projetos
2. Firestore incompatível: dados em bancos separados
3. Storage incompatível: uploads falham por permissões
4. CI/CD precisa ser reconfigurado

---

## 🎯 PLANO DE MIGRAÇÃO (5 Passos)

### PASSO 1: Configurar gcloud para projeto novo

```powershell
# Definir projeto ativo
gcloud config set project servioai

# Verificar projeto atual
gcloud config get-value project

# Listar projetos disponíveis
gcloud projects list
```

### PASSO 2: Habilitar APIs necessárias no projeto novo

```powershell
# Cloud Run API
gcloud services enable run.googleapis.com --project=servioai

# Artifact Registry API
gcloud services enable artifactregistry.googleapis.com --project=servioai

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com --project=servioai

# Firestore API
gcloud services enable firestore.googleapis.com --project=servioai

# Cloud Storage API
gcloud services enable storage-api.googleapis.com --project=servioai

# Identity Platform (Firebase Auth)
gcloud services enable identitytoolkit.googleapis.com --project=servioai
```

### PASSO 3: Criar Artifact Registry no projeto novo

```powershell
gcloud artifacts repositories create servio-ai \
  --repository-format=docker \
  --location=us-west1 \
  --description="Docker images para Servio.AI" \
  --project=servioai
```

### PASSO 4: Criar Service Account CI/CD no projeto novo

```powershell
# Criar Service Account
gcloud iam service-accounts create servio-ci-cd \
  --display-name="Servio CI/CD" \
  --description="Service Account para GitHub Actions deploy" \
  --project=servioai

# Obter project number
gcloud projects describe servioai --format="value(projectNumber)"
# Salve o número que aparecer (exemplo: 540889654851)

# Conceder permissões necessárias
gcloud projects add-iam-policy-binding servioai \
  --member="serviceAccount:servio-ci-cd@servioai.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding servioai \
  --member="serviceAccount:servio-ci-cd@servioai.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding servioai \
  --member="serviceAccount:servio-ci-cd@servioai.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding servioai \
  --member="serviceAccount:servio-ci-cd@servioai.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

# Criar chave JSON para GitHub Secrets
gcloud iam service-accounts keys create servio-sa-key.json \
  --iam-account=servio-ci-cd@servioai.iam.gserviceaccount.com \
  --project=servioai

# O arquivo servio-sa-key.json será criado na pasta atual
# IMPORTANTE: Guarde este arquivo em local seguro e delete depois de adicionar ao GitHub
```

### PASSO 5: Atualizar GitHub Secrets

Acesse: https://github.com/agenciaclimb/Servio.AI/settings/secrets/actions

Atualize estes secrets:

1. **GCP_PROJECT_ID**: `servioai` (substitui `gen-lang-client-0737507616`)
2. **GCP_SA_KEY**: conteúdo do arquivo `servio-sa-key.json` gerado acima
3. **GCP_REGION**: `us-west1` (manter)

---

## 🔧 PASSO 6: Atualizar Arquivos do Projeto

### Arquivos que precisam ser atualizados:

1. ✅ `.env.local` - já está correto
2. ✅ `firebaseConfig.ts` - já está correto
3. ❌ `index.js` - atualizar linha 24
4. ❌ `backend/src/index.js` - verificar variáveis de ambiente
5. ❌ `.github/workflows/deploy-cloud-run.yml` - atualizar project ID
6. ❌ `cloudbuild.yaml` e `cloudbuild-backend.yaml` - atualizar image paths

---

## ✅ VALIDAÇÃO PÓS-MIGRAÇÃO

Após migração, validar:

1. **Auth funcionando**: Login com Google deve funcionar
2. **Backend respondendo**: `https://servio-backend-XXX.us-west1.run.app/health`
3. **Firestore acessível**: Dashboard deve listar dados
4. **Storage funcionando**: Upload de arquivos no wizard
5. **CI/CD ativo**: Push na branch `main` deve deployar automaticamente

---

## 📝 NOTAS IMPORTANTES

- **Projeto antigo (gen-lang-client-0737507616)**: pode ser mantido ou deletado depois
- **Dados existentes**: se houver dados no Firestore antigo, exportar antes
- **URLs Cloud Run**: vão mudar após redeploy no projeto novo
- **Backup**: fazer backup do `.env.local` e `servio-sa-key.json` em local seguro

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

1. Execute PASSOS 1-5 acima (linha de comando)
2. Aguarde confirmação de que todos os comandos passaram
3. Em seguida, atualize os arquivos do código (PASSO 6)
4. Commit e push das mudanças
5. Validação completa (PASSO 7)

**Pronto para começar?** Execute os comandos do PASSO 1 primeiro.
