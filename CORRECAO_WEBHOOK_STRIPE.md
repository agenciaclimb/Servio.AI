# 🔴 CORREÇÃO URGENTE - Webhook Stripe com Erro 404

**Data**: 13/11/2025  
**Status**: ❌ WEBHOOK NÃO FUNCIONANDO  
**Problema**: URL incorreta configurada no Stripe Dashboard

---

## 🚨 Problema Identificado

O Stripe está tentando enviar webhooks para:

```
https://servio-ai-100025076028.us-west1.run.app/stripe-webhook
```

Mas o backend espera:

```
https://servio-ai-100025076028.us-west1.run.app/api/stripe-webhook
```

**Resultado**: Todos os eventos retornam **404 (Not Found)**

---

## ✅ SOLUÇÃO IMEDIATA (5 minutos)

### Passo 1: Acessar Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/webhooks
2. Faça login com suas credenciais
3. Encontre o webhook: `we_1SOLqxJEyu4utl88wvOA2gQy`

### Passo 2: Corrigir URL do Endpoint

**URL ATUAL (ERRADA)**:

```
https://servio-ai-100025076028.us-west1.run.app/stripe-webhook
```

**URL CORRETA**:

```
https://servio-ai-100025076028.us-west1.run.app/api/stripe-webhook
```

#### Como corrigir:

1. Clique no webhook existente
2. Clique em **"..."** (três pontos) → **"Update details"**
3. No campo **"Endpoint URL"**, altere para:
   ```
   https://servio-ai-100025076028.us-west1.run.app/api/stripe-webhook
   ```
4. Clique em **"Update endpoint"**

### Passo 3: Validar Correção

Após salvar, o Stripe enviará um evento de teste:

1. No webhook, clique em **"Send test webhook"**
2. Selecione evento: `checkout.session.completed`
3. Clique em **"Send test event"**
4. **Resultado esperado**: ✅ Status 200 (Success)

---

## 🔍 Verificação de Eventos Configurados

Certifique-se de que estes eventos estão habilitados:

- ✅ `checkout.session.completed` (CRÍTICO - confirmação de pagamento)
- ✅ `payment_intent.succeeded` (Recomendado)
- ✅ `payment_intent.payment_failed` (Recomendado)
- ✅ `charge.refunded` (Para estornos)

### Como verificar:

1. No webhook, veja seção **"Events to send"**
2. Se faltarem eventos, clique **"+ Add events"**
3. Selecione os eventos acima
4. Salve

---

## 🔑 Webhook Secret (Validar)

O backend precisa do **Signing Secret** para validar eventos:

### Verificar se está configurado:

1. No Stripe Dashboard, no webhook, veja **"Signing secret"**
2. Copie o valor (começa com `whsec_...`)
3. Verifique se está no Cloud Run:

```bash
# No Google Cloud Console
# Navegue para: Cloud Run > servio-ai > Variables & Secrets
# Deve ter: STRIPE_WEBHOOK_SECRET = whsec_...
```

Se NÃO estiver configurado:

```bash
# Adicionar secret no Cloud Run
gcloud run services update servio-ai \
  --region us-west1 \
  --update-secrets STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest
```

---

## 📊 Teste Completo (Após Correção)

### 1. Teste de Conectividade

```bash
# Verificar se endpoint responde
curl -X POST https://servio-ai-100025076028.us-west1.run.app/api/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Esperado**: Erro de assinatura (normal, significa que endpoint existe)

### 2. Teste Real no Stripe

1. Crie um pagamento de teste no frontend
2. Use cartão de teste: `4242 4242 4242 4242`
3. Data: qualquer futura (ex: 12/30)
4. CVV: qualquer 3 dígitos
5. Complete o pagamento

### 3. Verificar Logs

**Cloud Run**:

```bash
# Ver logs do webhook
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-ai" \
  --limit 50 \
  --format "table(timestamp, textPayload)"
```

**Firestore**:

```bash
# Verificar se escrow foi atualizado
# No Firebase Console > Firestore > escrows
# Status deve mudar de 'pendente' para 'pago'
```

---

## 🐛 Problemas Comuns

### Erro: "Webhook signature verification failed"

**Causa**: STRIPE_WEBHOOK_SECRET incorreto

**Solução**:

1. Copie novamente o Signing Secret do Stripe
2. Atualize no Cloud Run
3. Redeploy se necessário

### Erro: "Missing signature or secret"

**Causa**: Falta STRIPE_WEBHOOK_SECRET no ambiente

**Solução**:

```bash
# Adicionar variável
gcloud run services update servio-ai \
  --region us-west1 \
  --set-env-vars STRIPE_WEBHOOK_SECRET=whsec_SEU_SECRET_AQUI
```

### Erro: 404 persiste

**Causa**: Cache do Stripe ou deploy não aplicado

**Solução**:

1. Aguarde 2-3 minutos
2. Tente enviar test webhook novamente
3. Verifique se URL está exatamente como especificado

---

## ✅ Checklist Pós-Correção

- [ ] URL do webhook corrigida no Stripe Dashboard
- [ ] Test webhook enviado com sucesso (Status 200)
- [ ] STRIPE_WEBHOOK_SECRET configurado no Cloud Run
- [ ] Eventos necessários habilitados (checkout.session.completed)
- [ ] Teste real de pagamento realizado
- [ ] Logs do Cloud Run mostram webhooks recebidos
- [ ] Firestore mostra escrow atualizado para 'pago'

---

## 📝 Logs Esperados (Sucesso)

**Stripe Dashboard**:

```
✓ 2025-08-27 22:27:39  checkout.session.completed  200
✓ 2025-08-27 22:27:40  payment_intent.succeeded    200
```

**Cloud Run**:

```
✅ Checkout session completed for Escrow ID: abc123
✅ Payment successful: pi_xxx
```

**Firestore**:

```json
{
  "escrowId": "abc123",
  "status": "pago",
  "paymentIntentId": "pi_xxx",
  "updatedAt": "2025-11-13T15:30:00Z"
}
```

---

## 🚀 Próximos Passos

Após correção:

1. ✅ Webhook funcionando
2. ⏳ Testar fluxo completo de pagamento
3. ⏳ Monitorar logs por 24h
4. ⏳ Configurar alertas para falhas de webhook

---

## 📞 Suporte

Se problemas persistirem:

1. Verifique logs detalhados do Cloud Run
2. Teste com Stripe CLI local:
   ```bash
   stripe listen --forward-to localhost:8081/api/stripe-webhook
   ```
3. Contate suporte do Stripe se necessário

---

**AÇÃO IMEDIATA NECESSÁRIA**: Corrija a URL do webhook no Stripe Dashboard AGORA para evitar perda de eventos de pagamento! ⚠️

**Tempo estimado**: 5 minutos  
**Impacto**: ALTO - Pagamentos não são confirmados sem webhook funcionando
