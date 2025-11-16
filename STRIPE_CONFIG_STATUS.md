# 🔐 Configuração Stripe - Status e Próximos Passos

## ✅ Status Atual (13/11/2025)

### Webhook (Backend)

- ✅ **Endpoint configurado**: `https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook`
- ✅ **Status**: 200 OK confirmado
- ✅ **Eventos habilitados**:
  - checkout.session.completed
  - payment_intent.succeeded
  - payment_intent.created
  - charge.updated
- ✅ **Signing Secret**: Configurado no Cloud Run como `STRIPE_WEBHOOK_SECRET`

### Código

- ✅ Backend com webhook handler implementado
- ✅ Frontend com Stripe.js carregado
- ✅ 81/81 testes passando (incluindo Stripe)

---

## ⚙️ Configuração Necessária

### 1. Chaves Stripe (Frontend)

**Onde configurar**: `.env.local` na raiz do projeto

```bash
# Adicione estas linhas ao arquivo .env.local:
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_COLE_SUA_CHAVE_AQUI"
```

**Como obter a chave**:

1. Acesse: https://dashboard.stripe.com/test/apikeys
2. Copie a "Publishable key" (começa com `pk_test_`)
3. Cole no `.env.local`

---

### 2. Chaves Stripe (Backend - Cloud Run)

**Já configuradas no Cloud Run**:

- ✅ `STRIPE_SECRET_KEY` (verificar se está setada)
- ✅ `STRIPE_WEBHOOK_SECRET` (confirmado via diagnóstico)

**Para verificar/atualizar**:

```powershell
# Listar variáveis de ambiente do backend
gcloud run services describe servio-backend --region=us-west1 --format="value(spec.template.spec.containers[0].env)"
```

**Para atualizar chave secreta** (se necessário):

```powershell
gcloud run services update servio-backend \
  --region=us-west1 \
  --set-env-vars="STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_AQUI"
```

---

### 3. Stripe Connect (Pagamentos para Prestadores)

**Status**: ⚠️ Precisa configurar no Dashboard Stripe

**Passos**:

1. Acesse: https://dashboard.stripe.com/test/connect/accounts/overview
2. Clique em "Get started" (se ainda não configurado)
3. Escolha: **Standard** account type
4. Em "Settings → Redirect URIs", adicione:
   - `http://localhost:3000/dashboard?stripe_onboarding_complete=true`
   - `http://localhost:3000/onboarding-stripe/refresh`
   - `https://servio.ai/dashboard?stripe_onboarding_complete=true` (produção)
   - `https://servio.ai/onboarding-stripe/refresh` (produção)

---

### 4. Produtos Stripe (Opcional - para testes)

**Status**: ⚠️ Não obrigatório (criamos sessões dinamicamente)

Se quiser criar produtos fixos:

1. Acesse: https://dashboard.stripe.com/test/products
2. Clique em "+ Add product"
3. Configure nome, preço, descrição

---

## 🧪 Como Testar

### Teste Local (Development)

1. **Inicie o backend local**:

```powershell
cd backend
npm run dev
```

2. **Inicie o frontend**:

```powershell
npm run dev
```

3. **Expor webhook localmente** (opcional, para testar webhooks):

```powershell
# Instale ngrok: https://ngrok.com/download
ngrok http 8081

# Copie a URL https://XXXXX.ngrok.io
# Atualize o webhook no Stripe Dashboard para:
# https://XXXXX.ngrok.io/api/stripe-webhook
```

4. **Fluxo de teste**:
   - Faça login como cliente
   - Crie um job (wizard IA)
   - Faça login como prestador (outra janela anônima)
   - Envie uma proposta
   - Volte ao cliente e aceite a proposta
   - Use cartão teste: `4242 4242 4242 4242`
   - Verifique o escrow criado no Firestore

### Teste no Cloud Run (Produção)

1. **Verifique variáveis de ambiente**:

```powershell
# Verificar variáveis do backend
gcloud run services describe servio-backend --region=us-west1 --format="value(spec.template.spec.containers[0].env)"
```

2. **Teste o webhook manualmente**:

```powershell
# Via Stripe CLI (se instalado)
stripe trigger checkout.session.completed

# Ou via curl
curl -X POST https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed"}'
```

---

## 🎯 Checklist de Configuração

Execute estes comandos para verificar o status:

```powershell
# 1. Verificar se .env.local existe e tem VITE_STRIPE_PUBLISHABLE_KEY
Get-Content .env.local | Select-String "VITE_STRIPE_PUBLISHABLE_KEY"

# 2. Verificar variáveis do Cloud Run
gcloud run services describe servio-backend --region=us-west1 --format="value(spec.template.spec.containers[0].env)" | Select-String "STRIPE"

# 3. Testar webhook (deve retornar 200)
curl https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook

# 4. Verificar status do signing secret
curl https://servio-backend-1000250760228.us-west1.run.app/diag/stripe-webhook-secret
```

### Checklist Interativo

- [ ] **Chave Frontend**: `VITE_STRIPE_PUBLISHABLE_KEY` em `.env.local`
- [ ] **Chave Backend**: `STRIPE_SECRET_KEY` no Cloud Run (verificar)
- [ ] **Webhook Secret**: `STRIPE_WEBHOOK_SECRET` no Cloud Run (✅ confirmado)
- [ ] **Stripe Connect**: Redirect URIs configuradas no Dashboard
- [ ] **Teste Local**: Fluxo completo com cartão teste
- [ ] **Teste Cloud Run**: Webhook respondendo 200

---

## 🚀 Próximos Passos Recomendados

1. **Agora** (5 min):
   - Adicione `VITE_STRIPE_PUBLISHABLE_KEY` ao `.env.local`
   - Execute: `npm run dev` e teste criar um job

2. **Logo** (10 min):
   - Configure Stripe Connect no Dashboard
   - Adicione as Redirect URIs

3. **Teste E2E** (20 min):
   - Execute o fluxo completo: job → proposta → pagamento → escrow
   - Verifique logs no Stripe Dashboard: https://dashboard.stripe.com/test/webhooks

4. **Go-Live** (quando pronto):
   - Troque chaves de teste (`pk_test_`, `sk_test_`) por chaves de produção (`pk_live_`, `sk_live_`)
   - Atualize webhook para URL de produção
   - Configure Stripe Connect para produção

---

## 📚 Documentação Útil

- **Guia Completo**: `STRIPE_SETUP_GUIDE.md` (raiz do projeto)
- **Stripe Dashboard (Test)**: https://dashboard.stripe.com/test/dashboard
- **Stripe Dashboard (Live)**: https://dashboard.stripe.com/dashboard
- **Webhooks**: https://dashboard.stripe.com/test/webhooks
- **API Keys**: https://dashboard.stripe.com/test/apikeys
- **Connect**: https://dashboard.stripe.com/test/connect/accounts/overview

---

## 🆘 Suporte

Se tiver problemas:

1. **Erro no webhook**: Verifique logs do Cloud Run

   ```powershell
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend AND severity>=ERROR" --limit=50
   ```

2. **Erro no frontend**: Verifique console do navegador (F12)

3. **Dúvidas gerais**: Consulte `STRIPE_SETUP_GUIDE.md` seção "Troubleshooting"

---

**Última atualização**: 13/11/2025  
**Status**: ✅ Webhook funcionando | ⚠️ Chaves frontend pendentes
