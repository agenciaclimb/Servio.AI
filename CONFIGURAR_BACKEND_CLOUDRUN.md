# Configurar Backend Cloud Run - Variáveis de Ambiente

## 🎯 Objetivo

Corrigir os erros 500 nos endpoints do backend configurando as variáveis de ambiente necessárias no Cloud Run.

## 📋 Pré-requisitos

1. **Google Cloud CLI instalado:**

```bash
gcloud --version
```

2. **Autenticação ativa:**

```bash
gcloud auth login
gcloud config set project gen-lang-client-0737507616
```

3. **Credenciais necessárias:**

- Stripe Secret Key (Dashboard → Developers → API Keys)
- Nome do bucket GCS para uploads (ex: `servio-uploads`)
- Firebase Project ID (já configurado: `gen-lang-client-0737507616`)

---

## 🔧 Passo 1: Verificar Variáveis Atuais

```bash
gcloud run services describe servio-backend \
  --region=us-west1 \
  --format="value(spec.template.spec.containers[0].env)"
```

**Output esperado:** Lista de env vars configuradas ou vazio se nenhuma.

---

## 🚀 Passo 2: Configurar Variáveis de Ambiente

### Opção A: Configurar todas de uma vez

```bash
gcloud run services update servio-backend \
  --region=us-west1 \
  --set-env-vars="GCP_STORAGE_BUCKET=servio-uploads,\
STRIPE_SECRET_KEY=sk_test_SEU_KEY_AQUI,\
FIRESTORE_PROJECT_ID=gen-lang-client-0737507616,\
NODE_ENV=production"
```

### Opção B: Configurar uma por vez

```bash
# 1. Bucket para uploads
gcloud run services update servio-backend \
  --region=us-west1 \
  --set-env-vars="GCP_STORAGE_BUCKET=servio-uploads"

# 2. Stripe Secret Key
gcloud run services update servio-backend \
  --region=us-west1 \
  --set-env-vars="STRIPE_SECRET_KEY=sk_test_SEU_KEY_AQUI"

# 3. Firebase Project ID
gcloud run services update servio-backend \
  --region=us-west1 \
  --set-env-vars="FIRESTORE_PROJECT_ID=gen-lang-client-0737507616"
```

---

## 🔑 Passo 3: Verificar/Configurar Permissões IAM

O Service Account do Cloud Run precisa de permissões para:

- **Cloud Storage:** Gerar signed URLs
- **Firestore:** Read/Write

```bash
# 1. Identificar o Service Account
gcloud run services describe servio-backend \
  --region=us-west1 \
  --format="value(spec.template.spec.serviceAccountName)"

# 2. Conceder permissões (substitua SERVICE_ACCOUNT_EMAIL)
gcloud projects add-iam-policy-binding gen-lang-client-0737507616 \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding gen-lang-client-0737507616 \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/datastore.user"
```

**Service Account padrão do Cloud Run:**

```
PROJECT_NUMBER-compute@developer.gserviceaccount.com
```

Para descobrir o PROJECT_NUMBER:

```bash
gcloud projects describe gen-lang-client-0737507616 --format="value(projectNumber)"
```

---

## 🪣 Passo 4: Criar Bucket GCS (se não existir)

```bash
# Verificar se bucket existe
gsutil ls gs://servio-uploads

# Se não existir, criar:
gsutil mb -l us-west1 gs://servio-uploads

# Configurar CORS para uploads diretos
cat > cors.json << EOF
[
  {
    "origin": ["http://localhost:4173", "http://localhost:3000", "https://servioai.firebaseapp.com"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Content-Range", "Content-Encoding"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://servio-uploads
```

---

## 🔍 Passo 5: Validar Configuração

### 5.1. Verificar logs do Cloud Run

```bash
gcloud run services logs read servio-backend \
  --region=us-west1 \
  --limit=50
```

### 5.2. Testar endpoint de upload

```powershell
# Obter token do Firebase (no console do browser após login)
# await firebase.auth().currentUser.getIdToken()

$token = "SEU_TOKEN_AQUI"
$body = @{
  fileName = 'test.jpg'
  contentType = 'image/jpeg'
  jobId = 'test-job-123'
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "https://servio-backend-h5ogjon7aa-uw.a.run.app/generate-upload-url" `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -Headers @{"Authorization" = "Bearer $token"} `
  -UseBasicParsing
```

**Output esperado (200):**

```json
{
  "signedUrl": "https://storage.googleapis.com/servio-uploads/...",
  "filePath": "uploads/test-job-123/test.jpg"
}
```

### 5.3. Testar endpoint de usuários

```powershell
Invoke-WebRequest `
  -Uri "https://servio-backend-h5ogjon7aa-uw.a.run.app/users" `
  -Method GET `
  -Headers @{"Authorization" = "Bearer $token"} `
  -UseBasicParsing
```

---

## 🔐 Onde Encontrar Credenciais

### Stripe Secret Key

1. Acesse: https://dashboard.stripe.com/test/apikeys
2. Copie a "Secret key" (começa com `sk_test_`)
3. **IMPORTANTE:** Use a chave de **TEST** para desenvolvimento

### Firebase Config (já configurado)

- Project ID: `gen-lang-client-0737507616`
- Região Firestore: `us-west1`

---

## ✅ Checklist Final

Após configurar, verifique se:

- [ ] Variáveis de ambiente configuradas no Cloud Run
- [ ] Service Account tem permissões `storage.admin` e `datastore.user`
- [ ] Bucket GCS `servio-uploads` existe e tem CORS configurado
- [ ] Endpoint `/generate-upload-url` retorna 200 com token válido
- [ ] Endpoint `/users` retorna lista (ou 401 se token inválido)
- [ ] Logs do Cloud Run não mostram erros de "missing environment variable"

---

## 🐛 Troubleshooting

### Erro: "Failed to retrieve users"

- **Causa:** Firestore vazio ou permissões IAM
- **Solução:** Verificar que Firestore tem dados de teste ou criar usuário via console

### Erro: "GCP_STORAGE_BUCKET is not defined"

- **Causa:** Variável de ambiente não configurada
- **Solução:** Executar `gcloud run services update` com `--set-env-vars`

### Erro: "Stripe API key invalid"

- **Causa:** STRIPE_SECRET_KEY incorreta ou não configurada
- **Solução:** Verificar chave no Stripe Dashboard (test vs. live)

### Erro: 403 Forbidden no GCS

- **Causa:** Service Account sem permissões
- **Solução:** Executar `gcloud projects add-iam-policy-binding` com role `storage.admin`

---

## 📚 Referências

- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
- [Cloud Storage Signed URLs](https://cloud.google.com/storage/docs/access-control/signed-urls)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)

---

## 🎯 Próximos Passos Após Configuração

1. **Testar upload de arquivo no Wizard:**
   - Login no app → "Começar Agora"
   - Upload de foto → Verificar se não retorna 500

2. **Testar fluxo de pagamento:**
   - Criar job → Aceitar proposta
   - Checkout → Verificar redirecionamento Stripe

3. **Deploy frontend atualizado:**
   - `npm run build`
   - Deploy no Firebase Hosting
   - Testar em produção

**Tempo estimado:** 15-30 minutos para configuração completa.
