# 🔐 Guia de Segurança: Chaves e Configurações

> **⚠️ IMPORTANTE:** Este documento explica COMO gerenciar chaves de forma segura, sem expor valores sensíveis.

---

## 📋 Índice

1. [GitHub Secrets](#github-secrets)
2. [Google Cloud Platform (GCP)](#google-cloud-platform-gcp)
3. [Firebase](#firebase)
4. [Stripe](#stripe)
5. [Boas Práticas Gerais](#boas-práticas-gerais)
6. [Checklist de Segurança](#checklist-de-segurança)

---

## 🔑 GitHub Secrets

### Como Funcionam

Os **GitHub Secrets** armazenam dados sensíveis (chaves, tokens, senhas) de forma criptografada e são acessíveis apenas pelos workflows do GitHub Actions.

### Configuração

1. Acesse: `https://github.com/[OWNER]/[REPO]/settings/secrets/actions`
2. Clique em **"New repository secret"**
3. Configure os secrets necessários (veja tabela abaixo)

### Secrets Obrigatórios para Servio.AI

| Nome                 | Descrição                     | Como Obter                               | Formato                                            |
| -------------------- | ----------------------------- | ---------------------------------------- | -------------------------------------------------- |
| `GCP_PROJECT_ID`     | ID do projeto GCP             | Console GCP → Dashboard                  | String (ex: `gen-lang-client-0737507616`)          |
| `GCP_REGION`         | Região do Cloud Run           | Escolha geográfica                       | String (ex: `us-west1`)                            |
| `GCP_SA_KEY`         | Chave JSON da Service Account | Ver seção GCP abaixo                     | JSON completo (multi-linha)                        |
| `GEMINI_API_KEY`     | API key do Gemini AI          | Google AI Studio                         | String (começa com `AIza...`)                      |
| `FRONTEND_URL`       | URL do frontend em produção   | Após deploy                              | URL (ex: `https://servio-ai.web.app`)              |
| `GCP_STORAGE_BUCKET` | Bucket do Firebase Storage    | Console Firebase → Storage               | String (ex: `servio-ai.appspot.com`)               |
| `STRIPE_SECRET_KEY`  | Chave secreta do Stripe       | Dashboard Stripe → Developers → API keys | String (começa com `sk_test_...` ou `sk_live_...`) |

### ⚠️ Erros Comuns

❌ **Copiar apenas parte do JSON da Service Account**

- Problema: Workflow falha com erro de autenticação
- Solução: Copie desde `{` até `}`, incluindo quebras de linha `\n`

❌ **Usar projeto GCP errado**

- Problema: Permissões negadas no Artifact Registry
- Solução: Verifique que `GCP_PROJECT_ID` corresponde ao projeto onde está o Artifact Registry

❌ **Atualizar secret mas não confirmar**

- Problema: Secret continua com valor antigo
- Solução: Clique em "Update secret" e aguarde confirmação verde

---

## ☁️ Google Cloud Platform (GCP)

### Service Account para CI/CD

A **Service Account** é uma identidade que o GitHub Actions usa para interagir com GCP.

#### Criar Service Account

```bash
# 1. Criar a Service Account
gcloud iam service-accounts create servio-cicd \
  --display-name="Servio CI/CD" \
  --description="Service Account para GitHub Actions" \
  --project=SEU_PROJECT_ID

# 2. Adicionar Roles Necessárias
gcloud projects add-iam-policy-binding SEU_PROJECT_ID \
  --member="serviceAccount:servio-cicd@SEU_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding SEU_PROJECT_ID \
  --member="serviceAccount:servio-cicd@SEU_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding SEU_PROJECT_ID \
  --member="serviceAccount:servio-cicd@SEU_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# 3. Gerar Chave JSON
gcloud iam service-accounts keys create servio-cicd-key.json \
  --iam-account=servio-cicd@SEU_PROJECT_ID.iam.gserviceaccount.com \
  --project=SEU_PROJECT_ID

# 4. Copiar TODO o conteúdo do arquivo JSON gerado
cat servio-cicd-key.json

# 5. Cole no GitHub Secret GCP_SA_KEY

# 6. ⚠️ DELETAR o arquivo local imediatamente!
rm servio-cicd-key.json
```

#### Roles Mínimas Necessárias

| Role                            | Propósito              | Escopo                 |
| ------------------------------- | ---------------------- | ---------------------- |
| `roles/artifactregistry.writer` | Push de imagens Docker | Projeto ou Repositório |
| `roles/run.admin`               | Deploy no Cloud Run    | Projeto                |
| `roles/iam.serviceAccountUser`  | Permitir atuar como SA | Projeto                |

### Artifact Registry

O **Artifact Registry** armazena as imagens Docker do projeto.

#### Verificar Configuração

```bash
# Listar repositórios
gcloud artifacts repositories list --location=us-west1

# Verificar IAM de um repositório
gcloud artifacts repositories get-iam-policy NOME_REPO \
  --location=us-west1 \
  --project=SEU_PROJECT_ID

# Adicionar permissão à SA (se necessário)
gcloud artifacts repositories add-iam-policy-binding NOME_REPO \
  --location=us-west1 \
  --member="serviceAccount:servio-cicd@SEU_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

### ⚠️ Problema Comum: Projetos Misturados

**Sintoma:**

```
denied: Permission "artifactregistry.repositories.uploadArtifacts" denied
```

**Causa:**

- Secret `GCP_PROJECT_ID` aponta para um projeto
- Service Account pertence a outro projeto
- Artifact Registry está em um terceiro projeto

**Solução:**

1. Identifique onde está o Artifact Registry:

   ```bash
   gcloud artifacts repositories list --format="table(name,location,project)"
   ```

2. Gere chave da SA **do mesmo projeto** do Artifact Registry

3. Atualize `GCP_PROJECT_ID` e `GCP_SA_KEY` no GitHub

---

## 🔥 Firebase

### Configuração do Frontend

O arquivo `firebaseConfig.ts` contém configurações públicas do Firebase (não são secretas):

```typescript
export const firebaseConfig = {
  apiKey: "AIza...", // ✅ Pode ser público (protegido por domínio)
  authDomain: "projeto.firebaseapp.com",
  projectId: "projeto-id",
  storageBucket: "projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc",
};
```

**Por que essas chaves são públicas?**

- Firebase Security Rules protegem os dados
- `apiKey` não é secreta; apenas identifica o projeto
- Autenticação é feita via OAuth (Google, etc.)

### Firebase Admin SDK (Backend)

Para operações administrativas no backend, use **Service Account do Firebase**:

```bash
# Baixar chave do Firebase (não confundir com GCP SA!)
# Console Firebase → Project Settings → Service Accounts → Generate new private key
```

**⚠️ Esta chave NUNCA deve ser commitada no Git!**

Adicione ao `.gitignore`:

```
*-firebase-adminsdk-*.json
serviceAccountKey.json
firebase-key.json
```

---

## 💳 Stripe

### Chaves do Stripe

O Stripe usa **duas chaves por ambiente**:

| Tipo                                | Exposição  | Uso                        |
| ----------------------------------- | ---------- | -------------------------- |
| **Publishable Key** (`pk_test_...`) | ✅ Público | Frontend (checkout UI)     |
| **Secret Key** (`sk_test_...`)      | ❌ Privada | Backend (criar pagamentos) |

### Configuração

**Frontend (público):**

```typescript
// OK committar no Git
const stripe = loadStripe("pk_test_...");
```

**Backend (privado):**

- Armazene em variável de ambiente
- GitHub Secret: `STRIPE_SECRET_KEY`
- Nunca commite no código

### Webhooks

Para receber eventos do Stripe (pagamento aprovado, etc.):

1. Configure endpoint: `https://seu-backend.run.app/stripe/webhook`
2. Obtenha **Webhook Secret**: `whsec_...`
3. Adicione ao backend como variável de ambiente

---

## 🛡️ Boas Práticas Gerais

### 1. **Rotação de Chaves**

Chaves de API devem ser rotacionadas periodicamente:

- **Service Accounts GCP**: A cada 90 dias
- **Stripe API Keys**: Ao detectar vazamento
- **Firebase Admin SDK**: Anualmente

**Como rotacionar SA no GCP:**

```bash
# 1. Criar nova chave
gcloud iam service-accounts keys create nova-chave.json \
  --iam-account=servio-cicd@PROJETO.iam.gserviceaccount.com

# 2. Atualizar GitHub Secret

# 3. Testar deploy

# 4. Deletar chave antiga
gcloud iam service-accounts keys delete CHAVE_ID_ANTIGA \
  --iam-account=servio-cicd@PROJETO.iam.gserviceaccount.com
```

### 2. **Nunca Commitar Chaves**

Adicione ao `.gitignore`:

```
# Service Account Keys
*.json
!package.json
!tsconfig.json
!firebase.json

# Environment Variables
.env
.env.local
.env.*.local

# Stripe
stripe-key.txt

# Outros secrets
secrets/
private/
```

### 3. **Usar Ambientes Separados**

| Ambiente        | Propósito       | Secrets                                      |
| --------------- | --------------- | -------------------------------------------- |
| **Development** | Local/testes    | Chaves de teste (Stripe, Firebase emulators) |
| **Staging**     | Pre-produção    | Chaves de teste com dados reais              |
| **Production**  | Usuários finais | Chaves de produção                           |

### 4. **Princípio do Menor Privilégio**

Dê apenas as permissões necessárias:

❌ **Ruim:**

```bash
# Dar roles/owner para tudo
gcloud projects add-iam-policy-binding ... --role="roles/owner"
```

✅ **Bom:**

```bash
# Roles específicas por necessidade
gcloud projects add-iam-policy-binding ... --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding ... --role="roles/run.admin"
```

### 5. **Monitoramento de Uso**

Ative alertas para detectar uso suspeito:

**GCP:**

```bash
# Ver logs de acesso da SA
gcloud logging read "protoPayload.authenticationInfo.principalEmail=servio-cicd@PROJECT.iam.gserviceaccount.com" \
  --limit 50 \
  --format json
```

**GitHub:**

- Audit log: `Settings → Security → Audit log`
- Monitorar tentativas de acesso aos secrets

---

## ✅ Checklist de Segurança

### Antes de Commitar

- [ ] Nenhum arquivo `.json` com chaves (exceto configs públicos)
- [ ] `.env` está no `.gitignore`
- [ ] Nenhuma senha/token hardcoded no código
- [ ] `console.log()` não imprime secrets

### Ao Configurar GitHub Secrets

- [ ] `GCP_PROJECT_ID` corresponde ao projeto do Artifact Registry
- [ ] `GCP_SA_KEY` é a chave JSON **completa** (desde `{` até `}`)
- [ ] Service Account tem roles necessárias
- [ ] Chave local foi deletada após upload ao GitHub

### Ao Rotacionar Chaves

- [ ] Nova chave testada em ambiente de staging
- [ ] Chave antiga revogada/deletada
- [ ] Documentação atualizada (se aplicável)

### Periodicamente

- [ ] Revisar permissões das Service Accounts
- [ ] Verificar logs de acesso suspeito
- [ ] Atualizar dependências com vulnerabilidades
- [ ] Rotacionar chaves antigas (>90 dias)

---

## 🆘 Em Caso de Vazamento

### Se uma chave for comprometida:

**1. Revogar Imediatamente**

**GCP Service Account:**

```bash
# Listar chaves
gcloud iam service-accounts keys list \
  --iam-account=servio-cicd@PROJETO.iam.gserviceaccount.com

# Deletar chave comprometida
gcloud iam service-accounts keys delete CHAVE_ID \
  --iam-account=servio-cicd@PROJETO.iam.gserviceaccount.com
```

**Stripe:**

- Dashboard → Developers → API keys → "Roll" (gera nova e revoga antiga)

**Firebase:**

- Console → Project Settings → Service Accounts → Delete key

**2. Gerar Nova Chave**

Siga os passos de criação acima.

**3. Atualizar Todos os Locais**

- GitHub Secrets
- Ambientes de staging/produção
- Documentação interna

**4. Investigar Impacto**

- Revisar logs de acesso
- Verificar transações suspeitas (Stripe)
- Analisar alterações não autorizadas (GCP)

---

## 📚 Recursos Adicionais

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GCP Service Accounts Best Practices](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Stripe API Keys](https://stripe.com/docs/keys)

---

**Última atualização:** 2025-11-05  
**Responsável:** Equipe DevOps Servio.AI
