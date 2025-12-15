# ✅ Webhook Stripe - Produção Configurado

**Data**: 19/11/2025  
**Status**: ✅ WEBHOOK DE PRODUÇÃO TOTALMENTE CONFIGURADO  
**Conta Stripe**: Agencia IA Climb (acct_1OmPLvJEyu4utIB8)

---

## 🎯 Resumo da Configuração

O webhook de produção foi **CRIADO VIA CLI e TOTALMENTE CONFIGURADO**.

### Webhook de Produção (Live Mode)

**ID**: `we_1SVJo4JEyu4utIB8YxuJEX4H`  
**URL**: `https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook`  
**Status**: ✅ Enabled  
**Modo**: Live (Produção)  
**Signing Secret**: `whsec_[REDACTED]` ✅ Configurado

### Eventos Configurados (10 eventos)

Os seguintes eventos estão configurados para produção:

- ✅ `checkout.session.completed` (CRÍTICO - Confirmação de pagamento)
- ✅ `payment_intent.succeeded` (Pagamento bem-sucedido)
- ✅ `payment_intent.payment_failed` (Pagamento falhou)
- ✅ `charge.succeeded` (Cobrança bem-sucedida)
- ✅ `charge.updated` (Cobrança atualizada)
- ✅ `invoice.paid` (Fatura paga)
- ✅ `invoice.payment_failed` (Fatura não paga)
- ✅ `customer.subscription.created` (Assinatura criada)
- ✅ `customer.subscription.updated` (Assinatura atualizada)
- ✅ `customer.subscription.deleted` (Assinatura cancelada)

---

## 🔐 Webhook Signing Secret ✅ CONFIGURADO

**Status**: ✅ Signing secret já configurado em todos os ambientes necessários

### Onde está configurado:

1. ✅ **Cloud Run** (servio-backend)
   - `STRIPE_SECRET_KEY`: Configurado
   - `STRIPE_WEBHOOK_SECRET`: `whsec_[REDACTED]`

2. ✅ **GitHub Secrets** (para CI/CD)
   - `STRIPE_SECRET_KEY`: Atualizado com chave live
   - `STRIPE_WEBHOOK_SECRET`: Atualizado com signing secret
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Atualizado com chave live

3. ✅ **.env.local** (desenvolvimento local)
   - `STRIPE_SECRET_KEY`: Configurado
   - `STRIPE_WEBHOOK_SECRET`: Configurado
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Configurado

---

## 🧪 Como Testar o Webhook

### Opção 1: Testar via Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique no webhook `we_1SVIq9JEyu4utIB8OmM9SxRX`
3. Clique em **"Send test webhook"**
4. Selecione o evento: `checkout.session.completed`
5. Clique em **"Send test event"**
6. Verifique o resultado: deve retornar **200 OK**

### Opção 2: Testar via Stripe CLI

```powershell
# Enviar evento de teste
stripe events resend evt_ID_DO_EVENTO --live

# Ou simular um evento
stripe trigger checkout.session.completed --live
```

### Opção 3: Teste Real

1. Crie um pagamento real (pequeno valor) no ambiente de produção
2. Use um cartão de teste ou cartão real
3. Complete o pagamento
4. Verifique nos logs do Cloud Run se o webhook foi recebido

```powershell
# Ver logs do Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend AND textPayload=~'webhook'" --limit 20 --format json
```

---

## 📊 Webhooks Disponíveis

### Ambiente de Teste (Test Mode)

**ID**: `we_1SOLqxJEyu4utIB8wwQA2gQy`  
**URL**: `https://servio-backend-h5ogjon7aa-uw.a.run.app/api/stripe-webhook`  
**Status**: Enabled  
**Eventos**: Todos os eventos habilitados (para teste abrangente)

### Ambiente de Produção (Live Mode)

**ID**: `we_1SVIq9JEyu4utIB8OmM9SxRX`  
**URL**: `https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook`  
**Status**: Enabled  
**Eventos**: 8 eventos críticos (listados acima)

---

## 🔍 Monitoramento e Logs

### Ver Status dos Webhooks

```powershell
# Listar webhooks de teste
stripe webhook_endpoints list

# Listar webhooks de produção
stripe webhook_endpoints list --live

# Detalhes de um webhook específico
stripe webhook_endpoints retrieve we_1SVIq9JEyu4utIB8OmM9SxRX --live
```

### Ver Tentativas de Webhook

```powershell
# Ver eventos recentes
stripe events list --live --limit 10

# Ver detalhes de um evento específico
stripe events retrieve evt_ID_DO_EVENTO --live
```

### Logs do Backend

```powershell
# Logs gerais do Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend" --limit 50

# Logs específicos de webhook
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend AND textPayload=~'stripe.*webhook'" --limit 20
```

---

## ⚙️ Comandos Úteis via CLI

### Atualizar Eventos do Webhook

```powershell
# Adicionar novos eventos
stripe webhook_endpoints update we_1SVIq9JEyu4utIB8OmM9SxRX \
  --enabled-event charge.succeeded \
  --enabled-event charge.failed \
  --live

# Ver lista completa de eventos disponíveis
stripe events types list
```

### Desabilitar/Habilitar Webhook

```powershell
# Desabilitar temporariamente
stripe webhook_endpoints update we_1SVIq9JEyu4utIB8OmM9SxRX \
  --disabled \
  --live

# Reabilitar
stripe webhook_endpoints update we_1SVIq9JEyu4utIB8OmM9SxRX \
  --enabled \
  --live
```

### Criar Novo Webhook (se necessário)

```powershell
stripe webhook_endpoints create \
  --url "https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook" \
  --enabled-event checkout.session.completed \
  --enabled-event payment_intent.succeeded \
  --enabled-event payment_intent.payment_failed \
  --enabled-event invoice.paid \
  --enabled-event invoice.payment_failed \
  --enabled-event customer.subscription.created \
  --enabled-event customer.subscription.updated \
  --enabled-event customer.subscription.deleted \
  --description "SERVIO.AI Production Webhook" \
  --live
```

---

## 🚨 Troubleshooting

### Webhook retorna 404

**Problema**: URL incorreta ou endpoint não existe  
**Solução**: Verificar se o backend está deployado e a rota `/api/stripe-webhook` existe

### Webhook retorna 401/403

**Problema**: Signing secret incorreto ou ausente  
**Solução**: Configurar `STRIPE_WEBHOOK_SECRET` no Cloud Run (veja seção acima)

### Webhook não recebe eventos

**Problema**: Webhook desabilitado ou eventos não configurados  
**Solução**:

```powershell
# Verificar status
stripe webhook_endpoints retrieve we_1SVIq9JEyu4utIB8OmM9SxRX --live

# Reabilitar se necessário
stripe webhook_endpoints update we_1SVIq9JEyu4utIB8OmM9SxRX --enabled --live
```

### Testar Localmente

Para testar webhooks localmente durante desenvolvimento:

```powershell
# Escutar webhooks e encaminhar para localhost
stripe listen --forward-to localhost:8081/api/stripe-webhook --live

# Em outro terminal, fazer deploy ou teste
```

---

## 📋 Checklist de Validação

- [x] Webhook de produção criado via CLI
- [x] URL correta configurada (`/api/stripe-webhook`)
- [x] Eventos críticos habilitados (10 eventos)
- [x] Status: Enabled
- [x] Signing secret configurado no Cloud Run
- [x] Variáveis configuradas no GitHub Secrets
- [x] Variáveis configuradas no .env.local
- [x] Backend redeploy realizado (revision servio-backend-00030-zcv)
- [x] Endpoint testado e respondendo corretamente
- [ ] Teste de webhook via Dashboard Stripe (próximo passo)
- [ ] Teste real de pagamento validado (próximo passo)

---

## 🔒 Segurança

### Boas Práticas

1. **NUNCA** commitar o webhook signing secret no Git
2. Sempre usar variáveis de ambiente para secrets
3. Validar assinatura do webhook no backend (já implementado)
4. Monitorar tentativas falhadas de webhook
5. Configurar alertas para webhooks com erro

### Rotação de Secrets

Se precisar trocar o signing secret:

1. Criar novo webhook endpoint
2. Atualizar variável de ambiente no Cloud Run
3. Testar novo endpoint
4. Desabilitar webhook antigo
5. Após confirmação, deletar webhook antigo

---

## 📞 Próximos Passos

1. **OBTER E CONFIGURAR** o Signing Secret (veja seção acima)
2. **TESTAR** o webhook via Dashboard ou CLI
3. **MONITORAR** logs por 24-48h após ativar
4. **VALIDAR** com pagamento real de teste
5. **DOCUMENTAR** qualquer erro ou ajuste necessário

---

## 📚 Recursos Adicionais

- **Stripe Webhooks Docs**: https://stripe.com/docs/webhooks
- **Stripe CLI Docs**: https://stripe.com/docs/stripe-cli
- **Webhook Best Practices**: https://stripe.com/docs/webhooks/best-practices
- **Dashboard Webhooks**: https://dashboard.stripe.com/webhooks

---

**Status Final**: ✅ Webhook configurado via CLI  
**Ação Necessária**: Configurar Signing Secret no Cloud Run  
**Última Atualização**: 19/11/2025  
**Configurado por**: Stripe CLI v1.31.0
