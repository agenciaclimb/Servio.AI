# 🎯 Webhook Stripe - Próximos Passos

**Data**: 19/11/2025  
**Status**: ✅ Webhook configurado via CLI  
**Ação Necessária**: Configurar Signing Secret e testar

---

## ✅ O que foi feito

1. ✅ Autenticado no Stripe CLI
2. ✅ Verificado webhook de produção existente
3. ✅ Confirmado eventos críticos configurados
4. ✅ Documentação completa gerada

---

## 🔴 AÇÃO IMEDIATA NECESSÁRIA

### Passo 1: Obter o Signing Secret

O signing secret é necessário para validar que os webhooks realmente vêm do Stripe.

1. Acesse o Stripe Dashboard: **https://dashboard.stripe.com/webhooks**
2. Clique no webhook de produção (URL: `https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook`)
3. Na seção **"Signing secret"**, clique em **"Reveal"**
4. Copie o valor que começa com `whsec_...`

### Passo 2: Configurar no Google Cloud Run

Cole o comando abaixo no terminal, substituindo `YOUR_SECRET_HERE` pelo valor copiado:

```powershell
gcloud run services update servio-backend `
  --region=us-west1 `
  --set-env-vars="STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE"
```

**Importante**: Certifique-se de que o nome do serviço Cloud Run está correto. Pode ser:

- `servio-backend`
- `servio-ai`
- Outro nome usado no seu projeto

Para verificar o nome do serviço:

```powershell
gcloud run services list --region=us-west1
```

---

## 🧪 Passo 3: Testar o Webhook

### Teste Básico via Dashboard

1. Acesse: **https://dashboard.stripe.com/webhooks**
2. Clique no webhook de produção
3. Clique em **"Send test webhook"**
4. Selecione: `checkout.session.completed`
5. Clique em **"Send test event"**
6. **Resultado esperado**: Status **200 OK**

### Teste via CLI

```powershell
# Ver detalhes do webhook
stripe webhook_endpoints retrieve we_1SVIq9JEyu4utIB8OmM9SxRX --live

# Listar eventos recentes
stripe events list --live --limit 10
```

### Verificar Logs do Backend

```powershell
# Ver logs de webhook do Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~'webhook'" `
  --limit 20 `
  --format "table(timestamp, textPayload)"
```

---

## 📊 Informações do Webhook Configurado

### Webhook de Produção

**ID**: `we_1SVIq9JEyu4utIB8OmM9SxRX`  
**URL**: `https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook`  
**Status**: ✅ Enabled  
**Modo**: Live (Produção)

### Eventos Configurados (8 eventos)

- ✅ `checkout.session.completed` - **CRÍTICO** (confirmação de pagamento)
- ✅ `payment_intent.succeeded` - Pagamento bem-sucedido
- ✅ `payment_intent.payment_failed` - Pagamento falhou
- ✅ `invoice.paid` - Fatura paga
- ✅ `invoice.payment_failed` - Fatura não paga
- ✅ `customer.subscription.created` - Assinatura criada
- ✅ `customer.subscription.updated` - Assinatura atualizada
- ✅ `customer.subscription.deleted` - Assinatura cancelada

---

## 🔍 Verificação de Funcionamento

Após configurar o signing secret, verifique se está tudo OK:

### 1. Verificar Variável de Ambiente

```powershell
# Listar variáveis de ambiente do Cloud Run
gcloud run services describe servio-backend `
  --region=us-west1 `
  --format="value(spec.template.spec.containers[0].env)"
```

Deve aparecer `STRIPE_WEBHOOK_SECRET` na lista.

### 2. Enviar Evento de Teste

No Dashboard do Stripe:

1. Webhooks → Seu webhook → Send test webhook
2. Se retornar **200 OK**, está funcionando! ✅
3. Se retornar **401** ou **403**, revisar o signing secret

### 3. Testar com Pagamento Real

Para teste final (opcional):

1. Criar um pagamento de teste pequeno (ex: R$ 5,00)
2. Usar cartão de teste: `4242 4242 4242 4242`
3. Verificar nos logs se o webhook foi recebido
4. Verificar no Firestore se o escrow foi atualizado

---

## 🚨 Possíveis Problemas

### Webhook retorna 401 ou 403

**Causa**: Signing secret incorreto ou não configurado  
**Solução**: Repetir Passo 1 e Passo 2 acima

### Webhook retorna 404

**Causa**: URL incorreta ou backend não deployado  
**Solução**: Verificar se backend está ativo no Cloud Run

```powershell
# Verificar status do serviço
gcloud run services describe servio-backend --region=us-west1
```

### Webhook retorna 500

**Causa**: Erro no código do backend  
**Solução**: Verificar logs detalhados

```powershell
# Ver logs de erro
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" `
  --limit 50 `
  --format json
```

---

## 📚 Documentação Adicional

Para mais detalhes, consulte:

- **STRIPE_WEBHOOK_PRODUCAO_CONFIGURADO.md** - Documentação completa do webhook
- **STRIPE_SETUP_GUIDE.md** - Guia de configuração geral
- **CORRECAO_WEBHOOK_STRIPE.md** - Troubleshooting detalhado

---

## ✅ Checklist Final

- [ ] Signing secret obtido do Dashboard
- [ ] Signing secret configurado no Cloud Run
- [ ] Teste de webhook enviado (200 OK)
- [ ] Logs do backend confirmam recebimento
- [ ] Variável de ambiente verificada
- [ ] Teste de pagamento real validado (opcional)

---

## 🎯 Resultado Esperado

Após concluir os passos acima, você terá:

✅ Webhook de produção totalmente funcional  
✅ Pagamentos sendo processados automaticamente  
✅ Escrows atualizados no Firestore  
✅ Sistema pronto para receber pagamentos reais

---

## 💡 Comandos Úteis do Stripe CLI

```powershell
# Listar webhooks
stripe webhook_endpoints list --live

# Ver eventos recentes
stripe events list --live --limit 10

# Ver detalhes de um evento
stripe events retrieve evt_XXXXX --live

# Atualizar webhook (adicionar eventos)
stripe webhook_endpoints update we_1SVIq9JEyu4utIB8OmM9SxRX `
  --enabled-event charge.succeeded `
  --live

# Desabilitar webhook temporariamente
stripe webhook_endpoints update we_1SVIq9JEyu4utIB8OmM9SxRX `
  --disabled `
  --live

# Reabilitar webhook
stripe webhook_endpoints update we_1SVIq9JEyu4utIB8OmM9SxRX `
  --enabled `
  --live
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do Cloud Run
2. Teste o webhook no Dashboard do Stripe
3. Revise a documentação completa em `STRIPE_WEBHOOK_PRODUCAO_CONFIGURADO.md`
4. Contate o suporte do Stripe se necessário: https://support.stripe.com

---

**Tempo estimado para conclusão**: 5-10 minutos  
**Prioridade**: 🔴 ALTA - Necessário para processar pagamentos em produção  
**Próximo passo**: Configurar signing secret (Passo 1 e 2 acima)
