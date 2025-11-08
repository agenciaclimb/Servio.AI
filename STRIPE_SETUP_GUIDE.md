# 🔐 Guia de Configuração Stripe - SERVIO.AI

## 📋 Visão Geral

Este guia explica como configurar pagamentos Stripe com escrow seguro no SERVIO.AI.

---

## 🔑 1. Obter Chaves Stripe

### 1.1. Acesse o Dashboard Stripe

👉 **Teste:** https://dashboard.stripe.com/test/dashboard  
👉 **Produção:** https://dashboard.stripe.com/dashboard

### 1.2. Copie as Chaves

**Chave Publicável (Frontend):**

- Ir para: **Developers → API keys**
- Copiar: `Publishable key` (começa com `pk_test_` ou `pk_live_`)
- Adicionar em `.env.local`:
  ```bash
  VITE_STRIPE_PUBLISHABLE_KEY="pk_test_SUA_CHAVE_AQUI"
  ```

**Chave Secreta (Backend):**

- Copiar: `Secret key` (começa com `sk_test_` ou `sk_live_`)
- Adicionar em `.env.local` (backend):
  ```bash
  STRIPE_SECRET_KEY="sk_test_SUA_CHAVE_AQUI"
  ```

---

## 🔔 2. Configurar Webhook (CRÍTICO para Escrow)

### 2.1. Criar Webhook Endpoint

1. Ir para: **Developers → Webhooks**
2. Clicar: **+ Add endpoint**
3. Endpoint URL:
   - **Desenvolvimento local:** `https://SEU_NGROK_URL.ngrok.io/api/stripe-webhook`
   - **Produção (Cloud Run):** `https://servio-backend-h5ogjon7aa-uw.a.run.app/api/stripe-webhook`

### 2.2. Selecionar Eventos

Marcar apenas o evento crítico:

- ✅ `checkout.session.completed`

### 2.3. Copiar Webhook Secret

Após criar o webhook:

- Clicar em **Reveal** no campo `Signing secret`
- Copiar o valor (começa com `whsec_`)
- Adicionar em `.env.local` (backend):
  ```bash
  STRIPE_WEBHOOK_SECRET="whsec_SUA_CHAVE_AQUI"
  ```

---

## 🏦 3. Configurar Stripe Connect (Pagamentos para Prestadores)

### 3.1. Habilitar Connect no Dashboard

1. Ir para: **Connect → Settings**
2. Clicar: **Get started**
3. Escolher: **Standard** (mais flexível)

### 3.2. Configurar URLs de Redirecionamento

Em **Settings → Redirect URIs**:

- Adicionar: `https://servio.ai/dashboard?stripe_onboarding_complete=true`
- Adicionar: `https://servio.ai/onboarding-stripe/refresh`

### 3.3. Testar Onboarding de Prestador

```typescript
// Frontend: components/ProviderOnboarding.tsx
const handleStripeConnect = async () => {
  const { accountId } = await API.createStripeConnectAccount(user.email);
  const { url } = await API.createStripeAccountLink(user.email);
  window.location.href = url; // Redireciona para Stripe onboarding
};
```

---

## 🧪 4. Testar Fluxo Completo (Ambiente de Teste)

### 4.1. Dados de Teste Stripe

**Cartão de Crédito Teste (Sucesso):**

```
Número: 4242 4242 4242 4242
Validade: Qualquer data futura (ex: 12/25)
CVV: Qualquer 3 dígitos (ex: 123)
CEP: Qualquer (ex: 12345-678)
```

**Cartão de Crédito Teste (Falha):**

```
Número: 4000 0000 0000 0002
```

### 4.2. Cenário de Teste E2E

1. **Cliente cria job**
   - Usar AIJobRequestWizard
   - Job salvo no Firestore

2. **Prestador envia proposta**
   - ProposalModal → POST /proposals
   - Proposta aparece no ClientDashboard

3. **Cliente aceita proposta (STRIPE CHECKOUT)**
   - Clicar "Aceitar" → Redireciona para Stripe
   - Pagar com cartão teste: `4242 4242 4242 4242`
   - Stripe redireciona de volta: `/job/:id?payment_success=true`

4. **Webhook processa pagamento**
   - Backend recebe `checkout.session.completed`
   - Escrow criado no Firestore (status: `pago`)
   - PaymentIntent ID salvo no escrow

5. **Cliente finaliza serviço e avalia**
   - Clicar "Concluir Serviço" → ReviewModal
   - Submit review → POST /jobs/:jobId/release-payment

6. **Backend libera pagamento**
   - Stripe Transfer criado para prestador
   - Escrow atualizado (status: `liberado`)
   - Job atualizado (status: `concluido`)

---

## 🚨 5. Troubleshooting

### Problema: Webhook não recebe eventos

**Causa:** URL do webhook incorreta ou não acessível

**Solução:**

- **Local:** Use ngrok para expor localhost
  ```bash
  ngrok http 8081
  # Copie a URL https://XXXXX.ngrok.io
  # Adicione /api/stripe-webhook no final
  ```
- **Produção:** Verificar se Cloud Run está público e endpoint existe

### Problema: Erro "Webhook signature verification failed"

**Causa:** STRIPE_WEBHOOK_SECRET incorreto

**Solução:**

- Copiar novamente o `Signing secret` do webhook no Dashboard Stripe
- Atualizar variável de ambiente no backend
- Reiniciar servidor backend

### Problema: Transfer falha "No such destination"

**Causa:** Prestador não completou Stripe Connect onboarding

**Solução:**

- Verificar se `user.stripeAccountId` existe no Firestore
- Prestador deve completar onboarding via `createStripeAccountLink()`

### Problema: Checkout Session criado mas não redireciona

**Causa:** VITE_STRIPE_PUBLISHABLE_KEY faltando no frontend

**Solução:**

- Adicionar em `.env.local`:
  ```bash
  VITE_STRIPE_PUBLISHABLE_KEY="pk_test_SUA_CHAVE_AQUI"
  ```
- Reiniciar servidor Vite (`npm run dev`)

---

## 📊 6. Monitoramento (Produção)

### 6.1. Logs Stripe Dashboard

- **Webhooks:** Developers → Webhooks → [Seu webhook] → Attempts
- **Payments:** Payments → All payments
- **Transfers:** Connect → Transfers

### 6.2. Logs Backend (Cloud Run)

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend" --limit 50 --format json
```

### 6.3. Verificar Escrows no Firestore

```typescript
// Firebase Console → Firestore → Collection: escrows
// Filtrar por status: 'pendente', 'pago', 'liberado'
```

---

## 🎯 7. Checklist de Go-Live

Antes de ativar pagamentos em produção:

- [ ] Stripe chaves de **produção** configuradas (não test)
- [ ] Webhook configurado com URL de produção
- [ ] Testado fluxo completo com cartão teste
- [ ] Stripe Connect configurado para prestadores
- [ ] Monitoramento de logs ativado
- [ ] Política de reembolso definida
- [ ] Termos de uso atualizados com cláusula de escrow
- [ ] Suporte preparado para disputas de pagamento

---

## 💡 8. Recursos Adicionais

- **Documentação Stripe:** https://stripe.com/docs
- **Stripe Connect Guide:** https://stripe.com/docs/connect
- **Webhooks Best Practices:** https://stripe.com/docs/webhooks/best-practices
- **Test Cards:** https://stripe.com/docs/testing#cards

---

## 🔒 Segurança

⚠️ **NUNCA commitar chaves secretas no Git!**

Apenas adicione em:

- `.env.local` (local development)
- Variáveis de ambiente no Cloud Run (produção)
- GitHub Secrets (CI/CD)

---

**Status:** ✅ Integração completa - Backend 81/81 testes passando  
**Última atualização:** 08/11/2025 - SPRINT 2
