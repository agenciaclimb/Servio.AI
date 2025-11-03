# Guia para Corrigir Permissões do Cloud Build

## Problema Identificado

O Cloud Build está falhando com erro:

```
Permission 'storage.buckets.create' denied on resource (or it may not exist)
```

A Service Account do Cloud Build não tem permissão para criar/acessar buckets de Storage.

## Solução 1: Via Console GCP (RECOMENDADO)

### Passo 1: Identifique a Service Account do Cloud Build

1. Acesse: https://console.cloud.google.com/cloud-build/settings
2. Projeto: `gen-lang-client-0737507616`
3. A Service Account do Cloud Build é: `[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com`
   - Exemplo: `1087857077612@cloudbuild.gserviceaccount.com`

### Passo 2: Conceda a Permissão de Storage

1. Acesse: https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0737507616
2. Localize a linha com: `[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com`
3. Clique no ícone de edição (lápis) na linha
4. Clique em "+ ADICIONAR OUTRO PAPEL"
5. Selecione: **Storage Admin** (`roles/storage.admin`)
6. Clique em **SALVAR**

### Passo 3: Aguarde Propagação (1-2 minutos)

As permissões IAM levam alguns segundos para propagar.

### Passo 4: Execute Novo Deploy

```powershell
git tag v0.0.14-backend
git push origin v0.0.14-backend
```

---

## Solução 2: Via gcloud CLI

### Configure o projeto correto primeiro:

```bash
gcloud config set project gen-lang-client-0737507616
```

### Obtenha o PROJECT_NUMBER:

```bash
gcloud projects describe gen-lang-client-0737507616 --format="value(projectNumber)"
```

### Conceda a permissão (substitua PROJECT_NUMBER pelo número obtido):

```bash
gcloud projects add-iam-policy-binding gen-lang-client-0737507616 \
  --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/storage.admin"
```

Exemplo com PROJECT_NUMBER = 123456789:

```bash
gcloud projects add-iam-policy-binding gen-lang-client-0737507616 \
  --member="serviceAccount:123456789@cloudbuild.gserviceaccount.com" \
  --role="roles/storage.admin"
```

---

## Solução 3: Permissões Mínimas (Alternativa Segura)

Se preferir conceder apenas as permissões necessárias em vez de Storage Admin:

```bash
gcloud projects add-iam-policy-binding gen-lang-client-0737507616 \
  --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding gen-lang-client-0737507616 \
  --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/storage.legacyBucketWriter"
```

---

## Verificação das Permissões Atuais

Para verificar quais permissões a Service Account já tem:

```bash
gcloud projects get-iam-policy gen-lang-client-0737507616 \
  --flatten="bindings[].members" \
  --filter="bindings.members:*cloudbuild*" \
  --format="table(bindings.role,bindings.members)"
```

---

## Por Que Isso é Necessário?

O Cloud Build precisa de acesso ao Storage porque:

1. Armazena logs de build em buckets do Cloud Storage
2. Pode cachear dependências entre builds
3. Armazena artefatos temporários durante o processo de build

Mesmo com `logging: CLOUD_LOGGING_ONLY`, o Cloud Build ainda precisa de permissões básicas de Storage para funcionar corretamente.

---

## Após Conceder as Permissões

Execute um novo deploy:

```powershell
git tag v0.0.14-backend
git push origin v0.0.14-backend
```

O deploy deve funcionar desta vez! ✅
