# 🚀 GUIA DE CORREÇÃO: Deploy Cloud Run

## 🔴 Problema Identificado

**Erro no GitHub Actions:**

```
ERROR: (gcloud.artifacts.repositories.create) PERMISSION_DENIED:
Permission 'artifactregistry.repositories.create' denied on resource
'//artifactregistry.googleapis.com/projects/servio-ai/locations/***' (or it may not exist).
```

**Causa:** A Service Account `servio-ci-cd@gen-lang-client-0737507616.iam.gserviceaccount.com` não tem permissões para criar/acessar o repositório do Artifact Registry.

---

## ✅ SOLUÇÃO - Passo a Passo

### Pré-requisitos

- Acesso ao Google Cloud Console com permissões de Owner/Editor
- gcloud CLI instalado e autenticado

### Passo 1: Autenticar no gcloud (se necessário)

```powershell
# Fazer login
gcloud auth login

# Configurar projeto correto
gcloud config set project gen-lang-client-0737507616

# Verificar projeto ativo
gcloud config get-value project
```

### Passo 2: Criar Repositório no Artifact Registry

```powershell
# Criar repositório Docker no Artifact Registry
gcloud artifacts repositories create servio-ai `
  --repository-format=docker `
  --location=us-west1 `
  --description="Repositorio de containers para Servio.AI (backend + AI service)"

# Verificar criação
gcloud artifacts repositories list --location=us-west1
```

**Saída esperada:**

```
REPOSITORY   FORMAT  LOCATION   ...
servio-ai    DOCKER  us-west1   ...
```

### Passo 3: Conceder Permissões à Service Account

```powershell
# Service Account do CI/CD
$SA_EMAIL = "servio-ci-cd@gen-lang-client-0737507616.iam.gserviceaccount.com"
$PROJECT_ID = "gen-lang-client-0737507616"

# 1. Artifact Registry Writer (push de imagens)
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/artifactregistry.writer"

# 2. Cloud Run Admin (deploy de serviços)
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/run.admin"

# 3. Service Account User (para usar SA do Cloud Run)
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/iam.serviceAccountUser"

# 4. Storage Admin (para Cloud Build)
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/storage.admin"
```

### Passo 4: Verificar Permissões

```powershell
# Listar todas as roles da SA
gcloud projects get-iam-policy gen-lang-client-0737507616 `
  --flatten="bindings[].members" `
  --filter="bindings.members:servio-ci-cd@gen-lang-client-0737507616.iam.gserviceaccount.com" `
  --format="table(bindings.role)"
```

**Saída esperada (mínimo):**

```
ROLE
roles/artifactregistry.writer
roles/run.admin
roles/iam.serviceAccountUser
roles/storage.admin
```

### Passo 5: Testar Deploy Manualmente (Opcional)

```powershell
# Acionar workflow manualmente via GitHub CLI
gh workflow run deploy-cloud-run.yml `
  --ref feature/full-implementation `
  -f service=backend

# Ou via interface web:
# https://github.com/agenciaclimb/Servio.AI/actions/workflows/deploy-cloud-run.yml
# → "Run workflow" → Selecionar branch → "Run workflow"
```

---

## 🎯 CHECKLIST DE VALIDAÇÃO

- [ ] Repositório `servio-ai` criado no Artifact Registry (us-west1)
- [ ] Service Account tem role `artifactregistry.writer`
- [ ] Service Account tem role `run.admin`
- [ ] Service Account tem role `iam.serviceAccountUser`
- [ ] Service Account tem role `storage.admin`
- [ ] Comando `gcloud projects get-iam-policy` confirma as 4 roles
- [ ] Deploy manual no GitHub Actions executado com sucesso

---

## 📋 Informações do Projeto

- **Project ID:** `gen-lang-client-0737507616`
- **Region:** `us-west1`
- **Service Account:** `servio-ci-cd@gen-lang-client-0737507616.iam.gserviceaccount.com`
- **Artifact Registry:** `us-west1-docker.pkg.dev/gen-lang-client-0737507616/servio-ai`
- **Services:**
  - Backend: `servio-backend`
  - AI Service: `servio-ai`

---

## 🆘 Troubleshooting

### Erro: "Repository already exists"

```powershell
# Pular Passo 2, ir direto para Passo 3 (permissões)
```

### Erro: "Permission denied" ao executar gcloud

```powershell
# Verificar autenticação
gcloud auth list

# Re-autenticar se necessário
gcloud auth login
```

### Erro: "Service account does not exist"

```powershell
# Verificar se SA existe
gcloud iam service-accounts list --project=gen-lang-client-0737507616

# Se não existir, criar:
gcloud iam service-accounts create servio-ci-cd `
  --display-name="CI/CD Service Account" `
  --project=gen-lang-client-0737507616
```

---

## 📝 Próximos Passos Após Correção

1. ✅ Deploy backend funcionando
2. Validar endpoints em produção (`/health`, `/generate-upload-url`)
3. Configurar Firebase Auth (Google provider + domínios)
4. Criar smoke tests para monitoramento contínuo

---

**Tempo estimado total:** 15-30 minutos
**Complexidade:** Baixa (comandos diretos, sem código)
