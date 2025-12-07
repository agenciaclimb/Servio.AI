# ✅ Configuração dos Webhooks - Omnichannel Servio.AI

**Status:** Cloud Function deployada com sucesso ✅  
**Data:** 2025-01-24  
**URL Base:** `https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/omnichannelWebhook`

---

## 📍 URLs dos Webhooks por Canal

### WhatsApp Business API

```
https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/omnichannelWebhook?channel=whatsapp
```

### Instagram Messaging

```
https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/omnichannelWebhook?channel=instagram
```

### Facebook Messenger

```
https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/omnichannelWebhook?channel=facebook
```

### SendGrid Email Tracking

```
https://servio-backend-v2-1000250760228.us-west1.run.app/api/sendgrid-webhook
```

---

## 🔧 Configuração no Meta Developers Console

### 1. WhatsApp Business API

#### Passo a Passo:

1. Acesse: https://developers.facebook.com/apps/784914627901299/whatsapp-business/wa-settings
2. Localize a seção **"Webhook"**
3. Clique em **"Edit"** ou **"Configure Webhook"**
4. Preencha os campos:

**Callback URL:**

```
https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/omnichannelWebhook?channel=whatsapp
```

**Verify Token:**

```
servioai_omni_secret_705ed8ad-96b3-4708-a99c-337f9d6cf3cb
```

5. Clique em **"Verify and Save"**
6. Após salvar, configure as **Subscription Fields**:
   - ✅ `messages` (Mensagens recebidas)
   - ✅ `message_status` (Status de entrega/leitura)
   - ✅ `messaging_postbacks` (Botões e quick replies)

---

### 2. Instagram Messaging

#### Passo a Passo:

1. Acesse: https://developers.facebook.com/apps/784914627901299/messenger/settings
2. Na seção **Instagram**, localize **"Webhooks"**
3. Clique em **"Add Callback URL"** ou **"Edit"**
4. Preencha os campos:

**Callback URL:**

```
https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/omnichannelWebhook?channel=instagram
```

**Verify Token:**

```
servioai_omni_secret_705ed8ad-96b3-4708-a99c-337f9d6cf3cb
```

5. Clique em **"Verify and Save"**
6. Configure as **Subscription Fields**:
   - ✅ `messages`
   - ✅ `messaging_postbacks`
   - ✅ `message_reads`

---

### 3. Facebook Messenger

#### Passo a Passo:

1. Acesse: https://developers.facebook.com/apps/784914627901299/messenger/settings
2. Na seção **Messenger**, localize **"Webhooks"**
3. Clique em **"Add Callback URL"** ou **"Edit"**
4. Preencha os campos:

**Callback URL:**

```
https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/omnichannelWebhook?channel=facebook
```

**Verify Token:**

```
servioai_omni_secret_705ed8ad-96b3-4708-a99c-337f9d6cf3cb
```

5. Clique em **"Verify and Save"**
6. Configure as **Subscription Fields**:
   - ✅ `messages`
   - ✅ `messaging_postbacks`
   - ✅ `message_reads`
   - ✅ `message_deliveries`

---

### 4. SendGrid Email Tracking

#### Passo a Passo:

1. Acesse: https://app.sendgrid.com/settings/mail_settings
2. Localize **"Event Webhook"**
3. Clique em **"Enable"**
4. Preencha os campos:

**HTTP POST URL:**

```
https://servio-backend-v2-1000250760228.us-west1.run.app/api/sendgrid-webhook
```

5. Selecione os **eventos** para rastrear:
   - ✅ `Delivered` (Email entregue)
   - ✅ `Opened` (Email aberto)
   - ✅ `Clicked` (Link clicado)
   - ✅ `Bounced` (Email rejeitado)
   - ✅ `Dropped` (Email descartado)
   - ✅ `Spam Report` (Marcado como spam)
   - ✅ `Unsubscribe` (Descadastro)

6. Clique em **"Save"**

**Teste do webhook:**

```powershell
# Enviar evento de teste
curl -X POST https://servio-backend-v2-1000250760228.us-west1.run.app/api/sendgrid-webhook `
  -H "Content-Type: application/json" `
  -d '[{"event":"delivered","email":"teste@example.com","timestamp":1234567890}]'
# Deve retornar: OK (200)
```

---

## 🧪 Como Testar a Integração

### Teste Rápido via cURL (Verificar Webhook):

```powershell
# Simula a verificação do Meta
$url = "https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/omnichannelWebhook"
$params = "?hub.mode=subscribe&hub.verify_token=servioai_omni_secret_705ed8ad-96b3-4708-a99c-337f9d6cf3cb&hub.challenge=TEST123"

curl "$url$params"
# Deve retornar: TEST123
```

### Teste com Mensagem Real:

#### WhatsApp:

1. Envie uma mensagem para o número: **+1 (xxx) xxx-xxxx** (número da conta Business)
2. Verifique os logs: `firebase functions:log --only omnichannelWebhook`
3. A IA deve responder automaticamente

#### Instagram:

1. Envie um DM para a conta @servioai_oficial (ou sua conta configurada)
2. Verifique os logs
3. A IA deve responder automaticamente

#### Facebook:

1. Envie mensagem via Messenger para a Página do Facebook
2. Verifique os logs
3. A IA deve responder automaticamente

---

## 📊 Verificar Logs em Tempo Real

```powershell
# Ver todos os logs da função
firebase functions:log --only omnichannelWebhook

# Ver apenas erros
firebase functions:log --only omnichannelWebhook --severity error

# Seguir logs em tempo real (polling)
while ($true) {
  Clear-Host
  Write-Host "🔄 Logs Omnichannel (atualizado: $(Get-Date -Format 'HH:mm:ss'))" -ForegroundColor Cyan
  firebase functions:log --only omnichannelWebhook --limit 10
  Start-Sleep -Seconds 5
}
```

---

## 📦 Verificar Dados no Firestore

Após enviar mensagens, verifique se os dados foram gravados:

```powershell
# Ver todas as conversas
firebase firestore:query conversations --limit 10

# Ver mensagens de uma conversa específica
firebase firestore:query "conversations/{conversationId}/messages" --limit 20

# Ver logs da IA
firebase firestore:query ia_logs --limit 10
```

**Ou via Firebase Console:**

- https://console.firebase.google.com/project/gen-lang-client-0737507616/firestore

---

## 🔐 Segurança - Validação de Assinatura

A Cloud Function **valida automaticamente** as assinaturas HMAC SHA-256 de todas as requisições:

```javascript
// Código implementado em functions/index.js
const signature = req.headers['x-hub-signature-256'];
const expectedSignature =
  'sha256=' + crypto.createHmac('sha256', metaSecret).update(rawBody).digest('hex');

if (signature !== expectedSignature) {
  return res.status(403).send('Invalid signature');
}
```

✅ **Nenhuma requisição sem assinatura válida será processada.**

---

## 🔄 Scheduler de Follow-ups Automáticos

### Endpoint de Prospecção

**URL do Scheduler:**

```
https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/prospectorRunScheduler
```

**Método:** POST  
**Autenticação:** Header `x-servio-scheduler-token`

Este endpoint executa automaticamente follow-ups para leads com `nextFollowUpAt <= agora`, reagendando-os para +24h e registrando atividade no histórico.

#### Configuração do Token

```powershell
# Definir token secreto
firebase functions:config:set servio.scheduler_token="SUA_CHAVE_ALEATORIA_FORTE"

# Deploy do endpoint
firebase deploy --only functions:prospectorRunScheduler
```

#### Criar Job no Cloud Scheduler (Produção)

```powershell
# Job executado a cada 5 minutos (us-central1)
$FUNCTION_URL = "https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/prospectorRunScheduler?limit=50"
$TOKEN = "SUA_CHAVE_ALEATORIA_FORTE"

gcloud scheduler jobs create http prospector-follow-up-scheduler `
  --location us-central1 `
  --schedule "*/5 * * * *" `
  --http-method POST `
  --uri "$FUNCTION_URL" `
  --headers "x-servio-scheduler-token=$TOKEN,Content-Type=application/json,Content-Length=0" `
  --time-zone "America/Sao_Paulo" `
  --description "Automatiza follow-ups do Prospector CRM a cada 5 minutos"
```

#### Teste Manual (requisição HTTP)

```powershell
# Content-Length é obrigatório em Cloud Functions HTTP
curl -X POST https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/prospectorRunScheduler `
  -H "x-servio-scheduler-token: SUA_CHAVE_ALEATORIA_FORTE" `
  -H "Content-Type: application/json" `
  -H "Content-Length: 0"

# Resposta esperada: {"ok":true,"count":<n>,"processed":[...]}
```

#### Verificação Rápida

```powershell
# Listar jobs
gcloud scheduler jobs list --location=us-central1

# Descrever job
gcloud scheduler jobs describe prospector-follow-up-scheduler --location=us-central1

# Executar imediatamente
gcloud scheduler jobs run prospector-follow-up-scheduler --location=us-central1

# Ler últimos logs da função
gcloud functions logs read prospectorRunScheduler --region=us-central1 --limit=10
```

> Nota: O projeto está usando `firebase-functions@4.9.0` e `functions.config()`.
> Planeje atualizar para `firebase-functions@>=5.1.0` e migrar variáveis para `.env` antes de março/2026.

📖 **Documentação completa:** Ver `PROSPECCAO_SCHEDULER.md`

---

## 🎯 Próximos Passos

1. **[AGORA]** Configurar webhooks no Meta Developers Console (15 min)
2. **[DEPOIS]** Enviar mensagens de teste nos 3 canais (5 min)
3. **[RECOMENDADO]** Configurar Cloud Scheduler para follow-ups automáticos (10 min)
4. **[OPCIONAL]** Ajustar prompts da IA em `functions/index.js` → `buildPrompt()`

---

## 📱 Informações do App Meta

- **App ID:** 784914627901299
- **WhatsApp Phone ID:** 1606756873622361
- **Console:** https://developers.facebook.com/apps/784914627901299

---

## ⚠️ Notas Importantes

1. **Verify Token é sensível** - Nunca exponha em código
2. **Tokens de acesso expiram** - Renovar a cada 60 dias
3. **Rate limits do Meta:**
   - WhatsApp: 1000 conversas/dia (tier inicial)
   - Instagram: 200 msg/hora
   - Facebook: 200 msg/hora

4. **Monitoramento:**
   - Cloud Function → Firebase Console
   - Custos → Google Cloud Console
   - Webhooks → Meta Developers Console

---

**🎉 Pronto!** Após configurar os webhooks, o sistema estará 100% operacional.
