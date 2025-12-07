# 🚀 GUIA RÁPIDO: Deploy Omnichannel em Produção

**Status**: ✅ Código implementado | ⏳ Aguardando configuração Cloud

---

## ✅ Já Completado

- [x] Backend service implementado (6 endpoints REST)
- [x] Cloud Function para webhooks criada
- [x] Frontend OmniInbox + OmniChannelStatus
- [x] Testes automatizados (backend + E2E)
- [x] Dockerfile + CI/CD atualizado
- [x] Credenciais salvas em `.env.local` (protegido pelo .gitignore)
- [x] Documentação técnica completa

---

## ⏳ Próximos Passos (30-45 minutos)

### 1️⃣ Configurar Secrets no Google Cloud (5 min)

```bash
# Autenticar no GCP
gcloud auth login

# Configurar projeto
gcloud config set project gen-lang-client-0737507616

# Adicionar secrets ao Cloud Run (backend principal)
gcloud run services update servio-backend \
  --region us-west1 \
  --set-env-vars="META_ACCESS_TOKEN=EAALJ4C2TN3MBQOZA8siCEiKv17APiloYzhgGOSZBHDkhmC8ZCvr4n8T6C0kUTZCFKlFpVlZCadE2FYy6hXZAodMxGvkv5UvBtP1gPzOVpbGbYjHU3yF2LNJwYH5OSLvgjJxxKxBrIOePh23Nk6ZAzfaFa4VUe5GN7LGtJOYY162JofPJQm35ZBGMBqwddGNvplLfZAQZDZD,META_APP_SECRET=f79c3e815dfcacf1ba49df7f0c4e48b1,WHATSAPP_TOKEN=EAALJ4C2TN3MBQOZA8siCEiKv17APiloYzhgGOSZBHDkhmC8ZCvr4n8T6C0kUTZCFKlFpVlZCadE2FYy6hXZAodMxGvkv5UvBtP1gPzOVpbGbYjHU3yF2LNJwYH5OSLvgjJxxKxBrIOePh23Nk6ZAzfaFa4VUe5GN7LGtJOYY162JofPJQm35ZBGMBqwddGNvplLfZAQZDZD,WHATSAPP_PHONE_ID=1606756873622361"
```

### 2️⃣ Deploy Cloud Function para Webhooks (5 min)

```bash
# Configurar secrets no Firebase Functions
firebase functions:config:set \
  omni.meta_token="EAALJ4C2TN3MBQOZA8siCEiKv17APiloYzhgGOSZBHDkhmC8ZCvr4n8T6C0kUTZCFKlFpVlZCadE2FYy6hXZAodMxGvkv5UvBtP1gPzOVpbGbYjHU3yF2LNJwYH5OSLvgjJxxKxBrIOePh23Nk6ZAzfaFa4VUe5GN7LGtJOYY162JofPJQm35ZBGMBqwddGNvplLfZAQZDZD" \
  omni.meta_secret="f79c3e815dfcacf1ba49df7f0c4e48b1" \
  omni.whatsapp_token="EAALJ4C2TN3MBQOZA8siCEiKv17APiloYzhgGOSZBHDkhmC8ZCvr4n8T6C0kUTZCFKlFpVlZCadE2FYy6hXZAodMxGvkv5UvBtP1gPzOVpbGbYjHU3yF2LNJwYH5OSLvgjJxxKxBrIOePh23Nk6ZAzfaFa4VUe5GN7LGtJOYY162JofPJQm35ZBGMBqwddGNvplLfZAQZDZD" \
  omni.whatsapp_phone_id="1606756873622361" \
  omni.webhook_secret="servioai_omni_webhook_2025"

# Deploy da Cloud Function
cd backend/functions
npm install
firebase deploy --only functions:omnichannelWebhook
```

**URL da Cloud Function** (anotar para próximos passos):

```
https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/omnichannelWebhook
```

### 3️⃣ Configurar Webhooks no Meta Developers (15 min)

#### A. WhatsApp

1. Acessar: https://developers.facebook.com/apps/784914627901299/whatsapp-business/wa-settings
2. Configuração > Webhooks:
   - **Callback URL**: `https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/omnichannelWebhook?channel=whatsapp`
   - **Verify Token**: `servioai_omni_webhook_2025`
   - Clicar em "Verify and Save"
3. Subscrições:
   - [x] messages
   - [x] message_status
4. Salvar

#### B. Instagram

1. Acessar: https://developers.facebook.com/apps/784914627901299/messenger/settings
2. Webhooks:
   - **Callback URL**: `https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/omnichannelWebhook?channel=instagram`
   - **Verify Token**: `servioai_omni_webhook_2025`
3. Subscrições:
   - [x] messages
   - [x] messaging_postbacks
4. Conectar Instagram Business Account (se ainda não conectado)

#### C. Facebook Messenger

1. Acessar: https://developers.facebook.com/apps/784914627901299/messenger/settings
2. Webhooks:
   - **Callback URL**: `https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/omnichannelWebhook?channel=facebook`
   - **Verify Token**: `servioai_omni_webhook_2025`
3. Subscrições:
   - [x] messages
   - [x] messaging_postbacks
4. Conectar Facebook Page (se ainda não conectado)

### 4️⃣ Testar Integração (10 min)

#### Teste WhatsApp

```bash
# Enviar mensagem de teste para o número WhatsApp Business
# Verificar logs da Cloud Function
firebase functions:log --only omnichannelWebhook

# Verificar Firestore
# Collection: conversations, messages
```

#### Teste Instagram

1. Enviar DM para a conta Instagram conectada
2. Verificar resposta automática da IA
3. Verificar logs

#### Teste Facebook Messenger

1. Enviar mensagem para a página Facebook conectada
2. Verificar resposta automática
3. Verificar logs

#### Teste WebChat (Frontend)

```bash
# Acessar painel admin
https://gen-lang-client-0737507616.web.app/admin/omnichannel

# Verificar:
# - Lista de conversas
# - Filtros por canal
# - Envio manual de mensagens
```

### 5️⃣ Configurar Cloud Scheduler para Automações (5 min)

```bash
# Criar job de automação (roda a cada 15 minutos)
gcloud scheduler jobs create http omni-automation \
  --location=us-west1 \
  --schedule="*/15 * * * *" \
  --uri="https://servio-backend-xxx.run.app/api/omni/automation/run" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body='{"trigger":"scheduled"}' \
  --attempt-deadline=300s

# Verificar job criado
gcloud scheduler jobs list --location=us-west1
```

### 6️⃣ Monitoramento e Alertas (5 min)

#### Cloud Monitoring Dashboard

1. Acessar: https://console.cloud.google.com/monitoring
2. Criar dashboard "Omnichannel Health"
3. Adicionar métricas:
   - Cloud Function invocations (omnichannelWebhook)
   - Cloud Run requests (servio-backend /api/omni/\*)
   - Firestore writes (collections: conversations, messages)
   - Error rate (4xx, 5xx)

#### Alertas

```bash
# Criar alerta para webhook failures
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Omnichannel Webhook Failures" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05
```

---

## 📋 Checklist de Validação

Após completar os passos acima, verificar:

### Infraestrutura

- [ ] Secrets configurados no Cloud Run
- [ ] Cloud Function deployed e rodando
- [ ] Webhooks registrados no Meta Developers (WA/IG/FB)
- [ ] Cloud Scheduler job criado
- [ ] Monitoring dashboard configurado

### Funcionalidades

- [ ] Enviar mensagem WhatsApp → Receber resposta da IA
- [ ] Enviar DM Instagram → Receber resposta da IA
- [ ] Enviar mensagem Facebook → Receber resposta da IA
- [ ] WebChat funcional no frontend
- [ ] Conversas aparecem no OmniInbox
- [ ] Filtros funcionando (canal, userType)
- [ ] Envio manual de mensagens funcional

### Automações

- [ ] Trigger `followup_48h` executando (verificar logs)
- [ ] Trigger `followup_proposta` executando
- [ ] Mensagens automáticas marcadas com 🤖 Auto
- [ ] Opt-out sendo respeitado

### Monitoramento

- [ ] Logs da Cloud Function visíveis no Firebase Console
- [ ] Logs do Cloud Run visíveis no GCP Console
- [ ] Dashboard de métricas mostrando dados
- [ ] Alertas configurados e testados

---

## 🚨 Troubleshooting

### Webhook não está recebendo mensagens

1. Verificar URL no Meta Developers (deve incluir `?channel=whatsapp`)
2. Testar manualmente: `curl -X POST "https://FUNCTION_URL/omnichannelWebhook?channel=whatsapp"`
3. Verificar logs: `firebase functions:log --only omnichannelWebhook`
4. Verificar token de verificação (deve ser exatamente igual ao configurado)

### IA não está respondendo

1. Verificar `GEMINI_API_KEY` está configurado
2. Verificar logs da Cloud Function (buscar por "Omni IA")
3. Verificar coleção `ia_logs` no Firestore
4. Verificar quota do Gemini (free tier: 1500 req/day)

### Mensagens duplicadas

1. Verificar lógica de validação de duplicação (`isDuplicate` function)
2. Verificar se `messageId` está sendo salvo corretamente
3. Meta pode reenviar mensagens se não receber 200 OK em 20s

### Automações não executando

1. Verificar Cloud Scheduler job: `gcloud scheduler jobs describe omni-automation --location=us-west1`
2. Verificar logs do endpoint `/api/omni/automation/run`
3. Verificar se há conversas/propostas/escrow que atendem aos critérios dos triggers

---

## 📞 Suporte

**Documentação Técnica**: `doc/OMNICHANNEL_DESIGN.md`  
**Credenciais**: `doc/CREDENTIALS_OMNICHANNEL.md` (confidencial)  
**Meta Support**: https://developers.facebook.com/support  
**Desenvolvedor**: jeferson@jccempresas.com.br

---

**Tempo estimado total**: 30-45 minutos  
**Pré-requisitos**: Acesso GCP, Firebase CLI instalado, Credenciais Meta/WhatsApp

✅ **Após completar este guia, o módulo Omnichannel estará 100% operacional em produção!**
