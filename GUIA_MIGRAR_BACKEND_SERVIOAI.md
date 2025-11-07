# 🚀 GUIA: Migrar Backend para Projeto Correto (servioai)

**Problema Identificado:** Backend está no projeto `gen-lang-client-0737507616`, mas Firestore está em `servioai`.

**Solução:** Re-deploy do backend no projeto `servioai` onde está o Firestore.

---

## ✅ PASSO 1: Habilitar APIs necessárias no projeto servioai

Abra este link (abre direto no Console):

```
https://console.cloud.google.com/apis/library?project=servioai
```

**Habilite estas APIs** (clique em cada uma e depois em "Ativar"):

1. **Cloud Run API**: https://console.cloud.google.com/apis/library/run.googleapis.com?project=servioai
2. **Cloud Build API**: https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=servioai
3. **Artifact Registry API**: https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=servioai

---

## ✅ PASSO 2: Criar Service Account para CI/CD

**Link direto:**

```
https://console.cloud.google.com/iam-admin/serviceaccounts/create?project=servioai
```

**Preencha assim:**

1. **Nome da conta de serviço:** `servio-cicd`
2. **ID da conta de serviço:** `servio-cicd` (auto-preenche)
3. **Descrição:** `Service Account para CI/CD do GitHub Actions`
4. Clique em **"Criar e continuar"**

**Conceder Funções (roles):**

Na tela seguinte, clique em "Adicionar outra função" e adicione ESTAS 4 roles:

1. **Cloud Run Admin** (`roles/run.admin`)
2. **Cloud Build Editor** (`roles/cloudbuild.builds.editor`)
3. **Artifact Registry Writer** (`roles/artifactregistry.writer`)
4. **Service Account User** (`roles/iam.serviceAccountUser`)

Clique em **"Continuar"** e depois **"Concluído"**.

---

## ✅ PASSO 3: Criar Artifact Registry

**Link direto:**

```
https://console.cloud.google.com/artifacts/create-repo?project=servioai
```

**Preencha assim:**

1. **Nome:** `servio-ai`
2. **Formato:** Docker
3. **Modo:** Standard
4. **Local:** `southamerica-east1` (São Paulo) ← IMPORTANTE: mesma região do Firestore!
5. **Criptografia:** Chave gerenciada pelo Google
6. Clique em **"Criar"**

---

## ✅ PASSO 4: Gerar Chave JSON da Service Account

**Link direto:**

```
https://console.cloud.google.com/iam-admin/serviceaccounts?project=servioai
```

1. Localize a Service Account: `servio-cicd@servioai.iam.gserviceaccount.com`
2. Clique nos **3 pontinhos (⋮)** ao lado
3. Selecione **"Gerenciar chaves"**
4. Clique em **"Adicionar chave" → "Criar nova chave"**
5. Formato: **JSON**
6. Clique em **"Criar"**
7. **Arquivo será baixado** automaticamente (salve em local seguro!)

---

## ✅ PASSO 5: Atualizar GitHub Secrets

**Link direto:**

```
https://github.com/agenciaclimb/Servio.AI/settings/secrets/actions
```

**Atualize ESTES 2 secrets:**

### 5.1 - Atualizar `GCP_PROJECT_ID`

1. Localize o secret **GCP_PROJECT_ID**
2. Clique em **"Update"**
3. Cole o novo valor: `servioai`
4. Clique em **"Update secret"**

### 5.2 - Atualizar `GCP_SA_KEY`

1. Localize o secret **GCP_SA_KEY**
2. Clique em **"Update"**
3. Abra o arquivo JSON baixado no Passo 4
4. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
5. Cole no campo do secret
6. Clique em **"Update secret"**

---

## ✅ PASSO 6: Re-deploy do Backend

**No VS Code, execute no terminal:**

```powershell
# Navegar para o diretório do projeto (se necessário)
cd C:\Users\JE\servio.ai

# Criar e enviar tag para disparar deploy
git tag v0.0.36-backend
git push origin v0.0.36-backend
```

**Acompanhar o deploy:**

Abra este link:

```
https://github.com/agenciaclimb/Servio.AI/actions
```

Aguarde o workflow **"Deploy to Cloud Run"** completar (~3-5 minutos).

---

## ✅ PASSO 7: Validar Backend

**Após deploy concluído, no VS Code terminal:**

```powershell
node scripts/backend_smoke_test.mjs
```

**Resultado Esperado:**

```
✅ Health check: 200 OK
✅ GET /users: 200 OK (array vazio ou com dados)
✅ GET /jobs: 200 OK (array vazio ou com dados)
✅ POST /generate-upload-url: 200 OK
```

---

## 🎯 RESUMO DO QUE FIZEMOS

1. ✅ Habilitamos APIs no projeto `servioai`
2. ✅ Criamos Service Account `servio-cicd` com roles corretas
3. ✅ Criamos Artifact Registry em `southamerica-east1`
4. ✅ Geramos chave JSON da SA
5. ✅ Atualizamos GitHub Secrets
6. ✅ Re-deploy do backend no projeto correto
7. ✅ Validamos endpoints funcionando

---

## 🆘 Se algo der errado

**Erro: "permission denied on Artifact Registry"**

- Verifique se as 4 roles foram adicionadas corretamente à SA

**Erro: "Cloud Run deployment failed"**

- Confirme que a região do Artifact Registry é `southamerica-east1`
- Verifique se o secret `GCP_SA_KEY` tem TODO o JSON (incluindo `{` e `}`)

**Erro: 500 em /users ou /jobs após deploy**

- Aguarde 2 minutos para propagação
- Execute: `node scripts/backend_smoke_test.mjs` novamente

---

**Status:** ⏳ Aguardando você seguir os passos acima. Me avise em qual passo está ou se encontrar algum erro!
