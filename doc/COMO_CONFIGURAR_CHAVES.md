# 🔑 Guia: Como Configurar Suas Chaves de API

Este documento explica onde encontrar cada chave e segredo necessários para rodar o projeto SERVIO.AI localmente e em produção.

---

## 1. Configuração do Firebase

Estas chaves são para o **frontend** se comunicar com os serviços do Firebase (Auth, Firestore, Storage, Analytics). Elas são consideradas públicas e são armazenadas diretamente no código do frontend.

**Onde encontrar:**
1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Selecione o seu projeto.
3. No menu lateral, clique no ícone de engrenagem (⚙️) ao lado de "Visão geral do projeto" e vá para **Configurações do projeto**.
4. Na aba **Geral**, role para baixo até a seção "Seus apps".
5. Selecione o seu aplicativo da web (se não tiver um, crie clicando em `</>`).
6. Você verá um objeto de configuração `firebaseConfig`.

**Onde colocar (já feito):**
O arquivo `src/firebaseConfig.ts` já foi atualizado com os valores reais do seu projeto Firebase.

```typescript
// Conteúdo atual de src/firebaseConfig.ts (já preenchido)

const firebaseConfig = {
  apiKey: "SUA_CHAVE_FIREBASE_AQUI",
  authDomain: "servioai.firebaseapp.com",
  projectId: "servioai",
  storageBucket: "servioai.appspot.com",
  messagingSenderId: "540889654851",
  appId: "1:540889654851:web:1a27423acff6a7c7a416f6",
  measurementId: "G-YZYN9EKPFR"
};
```

---

## 2. Chave de API do Google AI (Gemini)
Esta chave é para o **backend de IA** (`server.js`) se comunicar com a API do Gemini.

**Importante:** Para o `server.js` rodar localmente, você precisará de um arquivo `.env.local` na raiz do projeto com `API_KEY="SUA_CHAVE_GEMINI"`. Para o Cloud Run, configure como variável de ambiente.

**Onde encontrar:**
1. Acesse o Google AI Studio.
2. Clique em **"Get API key"** no menu lateral esquerdo.
3. Clique em **"Create API key in new project"** (ou use uma existente).
4. Copie a chave gerada.

**Onde colocar:**
No arquivo `.env.local`, na variável `API_KEY`. (✅ Preenchida)

---

## 3. Chaves do Stripe
Estas chaves são para o **backend de pagamentos** (`backend/src/index.js`) e para o **frontend** (`src/main.tsx` e `App.tsx`).

**Onde encontrar:**
1. Acesse seu Dashboard do Stripe.
2. Certifique-se de que você está no **Modo de Teste** (toggle no canto superior direito).
3. **Chave Publicável (`pk_test_...`):** Vá para **Desenvolvedores > Chaves de API**. Copie a "Chave publicável".
4. **Chave Secreta (`sk_test_...`):** Na mesma página, clique em "Revelar chave de teste" para ver e copiar a "Chave secreta".
5. **Segredo do Webhook (`whsec_...`):**
   - Vá para **Desenvolvedores > Webhooks**.
   - Clique em **"Adicionar um endpoint"**.
   - Para desenvolvimento local, você precisará usar a CLI do Stripe para encaminhar eventos para `http://localhost:8081/stripe-webhook`. O comando será algo como: `stripe listen --forward-to localhost:8081/stripe-webhook`.
   - A CLI fornecerá um **segredo do webhook** para teste. Copie-o.

**Onde colocar:**
- **Chave Secreta (`sk_test_...`):** No arquivo `.env.local`, na variável `STRIPE_SECRET_KEY`. (✅ Preenchida)
- **Segredo do Webhook (`whsec_...`):** No arquivo `.env.local`, na variável `STRIPE_WEBHOOK_SECRET`. (✅ Preenchida)
- **Chave Publicável (`pk_test_...`):** No arquivo `.env.local`, na variável `REACT_APP_STRIPE_PUBLISHABLE_KEY`. (✅ Preenchida)

**Importante:** Para produção, configure `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` como variáveis de ambiente no Cloud Run do backend. Configure `REACT_APP_STRIPE_PUBLISHABLE_KEY` no ambiente de build do seu frontend.
---

## 4. Bucket do Google Cloud Storage

**Onde encontrar:**
1. No Console do Firebase, selecione seu projeto.
2. No menu lateral, vá para **Storage**.
3. Na aba "Arquivos", o nome do seu bucket estará no topo (ex: `seu-projeto.appspot.com`).

**Onde colocar:**
No arquivo `.env.local`, na variável `GCP_STORAGE_BUCKET`. (✅ Preenchida)

---

## 5. URLs da Aplicação

Estas variáveis definem as URLs do seu frontend e backend.

**Onde colocar:**
- **URL do Frontend:** No arquivo `.env.local`, na variável `FRONTEND_URL`. Usado pelo backend para redirecionamentos do Stripe.
- **URL da API de Backend:** No arquivo `.env.local`, na variável `REACT_APP_BACKEND_API_URL`. Usado pelo frontend para todas as chamadas à sua API.
- **URL da API de IA:** No arquivo `.env.local`, na variável `REACT_APP_AI_API_URL`. Usado pelo frontend para todas as chamadas à sua API de IA.

**Importante:** Para produção, configure `FRONTEND_URL`, `REACT_APP_BACKEND_API_URL` e `REACT_APP_AI_API_URL` como variáveis de ambiente no Cloud Run (para o backend) e no ambiente de build (para o frontend).