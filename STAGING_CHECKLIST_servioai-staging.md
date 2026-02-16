# 📋 Checklist de Configuração - Projeto Staging

**Projeto:** servioai-staging  
**Data:** 07/01/2026  
**Status:** ✅ Projeto criado e configurado no Firebase CLI

---

## ✅ Concluído Automaticamente

- [x] Projeto Firebase criado: `servioai-staging`
- [x] `.firebaserc` atualizado com alias staging
- [x] `.env.staging` criado
- [x] Projeto selecionado no Firebase CLI
- [x] Verificação de projeto confirmada

---

## 🔧 Configuração Manual Necessária

### 1️⃣ Firebase Console - Configurar Serviços

Acesse: **https://console.firebase.google.com/project/servioai-staging**

#### Authentication

- [ ] Ir em **Build > Authentication**
- [ ] Clicar em **Get Started**
- [ ] Habilitar **Email/Password**
  - Sign-in method > Email/Password > Enable
- [ ] Habilitar **Google Sign-in**
  - Sign-in method > Google > Enable
  - Configurar email de suporte do projeto
- [ ] Adicionar domínios autorizados (se necessário)
  - Settings > Authorized domains

#### Firestore Database

- [ ] Ir em **Build > Firestore Database**
- [ ] Clicar em **Create database**
- [ ] Escolher **Start in production mode**
- [ ] Região: **us-central1** (mesma do prod)
- [ ] Aguardar criação do banco
- [ ] **IMPORTANTE:** Deploy das rules (ver seção 4)

#### Cloud Storage

- [ ] Ir em **Build > Storage**
- [ ] Clicar em **Get started**
- [ ] Escolher **Start in production mode**
- [ ] Região: **us-central1** (mesma do prod)
- [ ] Aguardar criação
- [ ] **IMPORTANTE:** Deploy das rules (ver seção 4)

#### Hosting (Opcional - será feito no deploy)

- [ ] Ir em **Build > Hosting**
- [ ] Pode pular por enquanto (será configurado automaticamente no primeiro deploy)

---

### 2️⃣ Obter Credenciais Firebase

**Passo a passo:**

1. Acesse: https://console.firebase.google.com/project/servioai-staging/settings/general

2. Role até **Your apps**

3. Se não tiver app web criado:
   - Clique em **</>** (ícone web)
   - Nome do app: "ServioAI Staging Web"
   - Marque **"Also set up Firebase Hosting"** (opcional)
   - Clique em **Register app**

4. Copie os valores do **Firebase SDK snippet** (Config):

```javascript
const firebaseConfig = {
  apiKey: '...', // → VITE_FIREBASE_API_KEY
  authDomain: '...', // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: '...', // → VITE_FIREBASE_PROJECT_ID
  storageBucket: '...', // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: '...', // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: '...', // → VITE_FIREBASE_APP_ID
  measurementId: '...', // → VITE_FIREBASE_MEASUREMENT_ID
};
```

5. Preencha no arquivo `.env.staging`

**Checklist de credenciais:**

- [ ] VITE_FIREBASE_API_KEY
- [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
- [ ] VITE_FIREBASE_APP_ID
- [ ] VITE_FIREBASE_MEASUREMENT_ID

---

### 3️⃣ Configurar Stripe (Modo TEST)

Acesse: **https://dashboard.stripe.com/test/apikeys**

- [ ] Copiar **Publishable key** (começa com `pk_test_`)
  - Colar em `VITE_STRIPE_PUBLISHABLE_KEY` no `.env.staging`

- [ ] Copiar **Secret key** (começa com `sk_test_`)
  - Colar em `STRIPE_SECRET_KEY` no `.env.staging`

- [ ] Configurar Webhook (após primeiro deploy):
  - Developers > Webhooks > Add endpoint
  - URL: `https://us-central1-servioai-staging.cloudfunctions.net/api/stripe-webhook`
  - Events: `checkout.session.completed`, `payment_intent.succeeded`
  - Copiar **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

### 4️⃣ Deploy das Regras de Segurança

**IMPORTANTE:** Faça isso ANTES de usar Firestore/Storage!

```powershell
# Garantir que está no projeto staging
npx firebase-tools use staging

# Deploy apenas das rules
npx firebase-tools deploy --only firestore:rules,storage:rules
```

**Checklist:**

- [ ] Comando executado com sucesso
- [ ] Regras do Firestore deployadas
- [ ] Regras do Storage deployadas
- [ ] Sem erros no console

---

### 5️⃣ Service Account (Cloud Functions)

**Para Cloud Functions e backend:**

1. Acesse: https://console.cloud.google.com/iam-admin/serviceaccounts?project=servioai-staging

2. Criar Service Account:
   - [ ] Clicar em **+ CREATE SERVICE ACCOUNT**
   - [ ] Nome: `servioai-staging-backend`
   - [ ] ID: `servioai-staging-backend`
   - [ ] Descrição: "Service account para backend staging"
   - [ ] Clicar em **CREATE AND CONTINUE**

3. Grant permissions:
   - [ ] Role: **Firebase Admin**
   - [ ] Role: **Cloud Datastore User**
   - [ ] Role: **Storage Object Admin**
   - [ ] Clicar em **CONTINUE** e **DONE**

4. Criar chave:
   - [ ] Clicar no service account criado
   - [ ] Aba **KEYS**
   - [ ] **ADD KEY** > **Create new key**
   - [ ] Tipo: **JSON**
   - [ ] Download automático

5. Salvar chave:
   - [ ] Mover arquivo para `C:\secrets\`
   - [ ] Renomear para `service-account-staging.json`
   - [ ] Atualizar `GOOGLE_APPLICATION_CREDENTIALS` no `.env.staging`

---

### 6️⃣ Gemini API Key

**Opção A: Usar mesma key do prod (recomendado para staging)**

- [ ] Copiar `GEMINI_API_KEY` de `.env.local` para `.env.staging`

**Opção B: Criar key separada**

1. Acesse: https://aistudio.google.com/app/apikey
2. Create API key
3. Copiar para `.env.staging`

---

### 7️⃣ Primeiro Deploy

**Build local:**

```powershell
npm run build
```

**Deploy completo:**

```powershell
npm run deploy:staging
```

Ou deploy por partes:

```powershell
# 1. Deploy hosting (frontend)
npm run deploy:staging:hosting

# 2. Deploy functions (backend) - se tiver
npm run deploy:staging:functions
```

**Checklist:**

- [ ] Build executado sem erros
- [ ] Deploy executado com sucesso
- [ ] Hosting URL disponível: `https://servioai-staging.web.app`
- [ ] Sem erros no console

---

### 8️⃣ Testes Críticos

Acesse: **https://servioai-staging.web.app**

#### Teste 1: Login

- [ ] Página carrega corretamente
- [ ] Criar conta nova funciona
- [ ] Login com email/senha funciona
- [ ] Login com Google funciona (se habilitado)
- [ ] Logout funciona

#### Teste 2: Firestore

- [ ] Criar um job de teste
- [ ] Job aparece no dashboard
- [ ] Editar job funciona
- [ ] Deletar job funciona

#### Teste 3: Storage

- [ ] Upload de imagem funciona
- [ ] Imagem é exibida corretamente
- [ ] Download funciona

#### Teste 4: Stripe (Modo Test)

- [ ] Processo de checkout inicia
- [ ] Usar cartão de teste: `4242 4242 4242 4242`
- [ ] Pagamento é processado
- [ ] Webhook é recebido
- [ ] Status do job atualiza

#### Teste 5: Gemini AI

- [ ] Features de IA respondem
- [ ] Sugestões são geradas
- [ ] Sem erros de API key

---

## 📊 Validação Final

### Console Firebase

- [ ] Zero erros em **Firestore > Usage**
- [ ] Zero erros em **Storage > Usage**
- [ ] Zero erros em **Functions > Logs** (se houver)

### Console Stripe

- [ ] Webhook recebendo eventos
- [ ] Pagamentos de teste aparecem
- [ ] Sem erros nos logs

### Monitoramento

- [ ] Abrir browser developer tools
- [ ] Verificar console sem erros críticos
- [ ] Network tab: todas requests 200 OK

---

## 🌐 URLs do Ambiente Staging

- **Hosting:** https://servioai-staging.web.app
- **Firebase Console:** https://console.firebase.google.com/project/servioai-staging
- **Functions:** https://us-central1-servioai-staging.cloudfunctions.net
- **Firestore:** https://console.firebase.google.com/project/servioai-staging/firestore
- **Storage:** https://console.firebase.google.com/project/servioai-staging/storage

---

## 🔄 Comandos Úteis

```powershell
# Alternar entre ambientes
npx firebase-tools use staging      # Staging
npx firebase-tools use production   # Produção

# Ver projeto atual
npx firebase-tools use

# Deploy
npm run deploy:staging              # Deploy completo
npm run deploy:staging:hosting      # Só frontend
npm run deploy:staging:functions    # Só backend

# Logs
npm run gcp:logs                    # Ver logs Cloud Run

# Voltar para prod
npx firebase-tools use production
```

---

## 🆘 Troubleshooting

### Erro: "Permission denied"

```powershell
npx firebase-tools login --reauth
```

### Erro: "Project not found"

Verifique se está no projeto correto:

```powershell
npx firebase-tools use staging
npx firebase-tools projects:list
```

### Firestore rules error

```powershell
npx firebase-tools deploy --only firestore:rules
```

### Storage rules error

```powershell
npx firebase-tools deploy --only storage:rules
```

---

## 📞 Próximos Passos

1. ✅ **Completar itens deste checklist**
2. 📝 **Atualizar `STAGING_SETUP.md`** com status final
3. 🚀 **Fazer primeiro deploy de teste**
4. ✅ **Executar bateria de testes**
5. 📊 **Documentar URLs e credenciais em local seguro**

---

**Criado:** 07/01/2026  
**Última atualização:** 07/01/2026  
**Próxima revisão:** Após primeiro deploy bem-sucedido
