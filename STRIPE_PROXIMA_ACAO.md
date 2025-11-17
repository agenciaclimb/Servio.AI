# 🎯 Stripe - Ação Imediata (3 Passos)

## ✅ Configuração Atual: 90% Completa

**O que já funciona**:

- ✅ Chaves configuradas (test mode)
- ✅ Webhook protegido e respondendo
- ✅ Código implementado e testado
- ✅ Dev server rodando: http://localhost:3000

**Falta apenas**: Configurar Stripe Connect (10 min) + Verificar webhook no Dashboard (5 min)

---

## 🚀 PASSO 1: Stripe Connect (10 minutos)

**Abra agora**: https://dashboard.stripe.com/test/connect/accounts/overview

### Se aparecer "Get started":

1. Clique em **"Get started"**
2. Escolha: **Standard** (recommended)
3. Preencha informações básicas (pode usar dados de teste)
4. Clique em **Save**

### Configurar Redirect URIs:

1. No menu lateral, clique em **Settings** (ícone de engrenagem)
2. Na seção "Connect", clique em **Redirect URIs**
3. Clique em **+ Add URI**
4. Adicione CADA URI abaixo (uma por vez):
   ```
   http://localhost:3000/dashboard?stripe_onboarding_complete=true
   ```
   (Clique em Add)
5. Clique em **+ Add URI** novamente:

   ```
   http://localhost:3000/onboarding-stripe/refresh
   ```

   (Clique em Add)

6. **Save changes**

✅ **Pronto!** Prestadores agora podem conectar suas contas Stripe.

---

## 🔔 PASSO 2: Verificar Webhook (5 minutos)

**Abra agora**: https://dashboard.stripe.com/test/webhooks

### Verificar se existe:

Procure por um webhook com URL:

```
https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook
```

### Se EXISTE:

1. Clique nele
2. Verifique:
   - ✅ Status: **Enabled** (verde)
   - ✅ Eventos: `checkout.session.completed`, `payment_intent.succeeded`, etc.
3. Se tudo OK, pule para Passo 3

### Se NÃO EXISTE:

1. Clique em **+ Add endpoint**
2. Preencha:
   - **Endpoint URL**: `https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook`
   - **Description**: `SERVIO.AI Webhook (Test)`
3. Em **Events to send**, clique em **+ Select events**
4. Use o filtro de busca e marque:
   - ✅ `checkout.session.completed` ⭐ **CRÍTICO**
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.created`
   - ✅ `charge.updated`
5. Clique em **Add events**
6. Clique em **Add endpoint**
7. **IMPORTANTE**: Na próxima tela, copie o **Signing secret** (começa com `whsec_...`)
8. Se copiou um novo secret, atualize no Cloud Run:
   ```powershell
   gcloud run services update servio-backend --region=us-west1 --set-env-vars="STRIPE_WEBHOOK_SECRET=whsec_COLE_AQUI"
   ```

✅ **Pronto!** Webhook configurado e eventos serão processados.

---

## 🧪 PASSO 3: Testar (3 minutos)

### Teste Rápido (No navegador):

1. **Acesse**: http://localhost:3000

2. **Faça login ou crie conta** (pode usar email de teste)

3. **Crie um job**:
   - Clique em "Criar Job" ou use o Wizard IA
   - Descreva qualquer serviço
   - Ex: "Preciso instalar um ventilador de teto"

4. **Verifique**:
   - ✅ Job foi criado sem erros?
   - ✅ Console do navegador (F12) não mostra erros Stripe?
   - ✅ Página não ficou em branco?

**Se tudo funcionou**: ✅ Stripe está pronto!

### Teste Completo E2E (Opcional - 15 min):

Para testar o fluxo de pagamento completo:

1. **Janela 1 - Cliente**:
   - Faça login
   - Crie um job

2. **Janela 2 - Prestador** (aba anônima):
   - Faça login com outro email
   - Vá em "Oportunidades"
   - Conecte conta Stripe (se pedido)
   - Envie proposta para o job

3. **Volta para Janela 1 - Cliente**:
   - Aceite a proposta
   - Será redirecionado para Stripe
   - Use cartão teste: **4242 4242 4242 4242**
   - Data: Qualquer futura (ex: 12/25)
   - CVV: Qualquer (ex: 123)
   - Pague

4. **Verificar escrow criado**:
   - Abra Firebase Console: https://console.firebase.google.com/project/gen-lang-client-0737507616/firestore
   - Collection: `escrows`
   - Deve ter um documento novo com status `pago`

✅ **Se chegou até aqui**: Pagamento E2E funcionando!

---

## ✅ Está Pronto!

Após completar os 3 passos:

### O que você pode fazer:

- ✅ Criar jobs e testar o wizard IA
- ✅ Aceitar propostas e processar pagamentos
- ✅ Testar escrow (pagamento seguro)
- ✅ Demonstrar para stakeholders
- ✅ Desenvolver novas features

### Quando for para produção:

1. Trocar chaves de `test` para `live`
2. Criar novo webhook em https://dashboard.stripe.com/webhooks (sem /test/)
3. Ativar Stripe Connect em produção
4. Completar verificação da empresa no Stripe

---

## 📞 Precisa de Ajuda?

### Erros comuns:

**"Webhook signature verification failed"**

```powershell
# Copie novo signing secret do Dashboard e rode:
gcloud run services update servio-backend --region=us-west1 --set-env-vars="STRIPE_WEBHOOK_SECRET=whsec_NOVO_SECRET"
```

**"No such destination" ao liberar pagamento**

- Prestador precisa completar onboarding Stripe Connect
- Verificar se tem `stripeAccountId` no Firestore

**Página em branco após login**

- Verificar console do navegador (F12)
- Pode ser erro de autenticação Firebase (não Stripe)

### Documentação completa:

- **STRIPE_FINAL_STATUS.md** - Status completo e próximos passos
- **STRIPE_GUIA_RAPIDO.md** - Guia visual de 5 minutos
- **STRIPE_SETUP_GUIDE.md** - Guia passo a passo detalhado

### Scripts úteis:

```powershell
# Testar configuração
npm run test:stripe

# Validar tudo
npm run validate:stripe

# Ver logs do backend
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend" --limit=20
```

---

## 🎉 Parabéns!

Você completou a configuração do Stripe! O sistema de pagamentos está pronto para uso em teste.

**Próxima ação sugerida**: Teste criar um job e explore a plataforma.

**Tempo total**: ~20 minutos (se fizer tudo)

---

**Data**: 13/11/2025  
**Status**: ✅ Pronto para testes  
**Versão**: 1.0
