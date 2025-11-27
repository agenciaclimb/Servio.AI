## ✅ GUIA DE IMPLANTAÇÃO - WHATSAPP BUSINESS API

**Status:** 🟢 PRONTO PARA DEPLOY  
**Data:** 2025-11-27  
**Tempo Estimado:** 20 minutos

---

## 📋 Checklist de Implantação

### PASSO 1: Validar Arquivos Criados ✅

Verificar se todos os 3 arquivos foram criados com sucesso:

```powershell
# Frontend - Verificar se os arquivos existem
Test-Path "c:\Users\JE\servio.ai\backend\src\whatsappService.js"        # ✅ Deve retornar True
Test-Path "c:\Users\JE\servio.ai\backend\src\routes\whatsapp.js"       # ✅ Deve retornar True
Test-Path "c:\Users\JE\servio.ai\WHATSAPP_BUSINESS_CONFIG.md"          # ✅ Deve retornar True
Test-Path "c:\Users\JE\servio.ai\PROSPECTOR_MODULE_STATUS.md"          # ✅ Deve retornar True
```

**Status Esperado:** Todos os 4 arquivos existem ✅

---

### PASSO 2: Verificar Integração do Backend ✅

Confirmar que as rotas foram registradas no `backend/src/index.js`:

```powershell
# Verificar se WhatsAppService foi importado
Select-String -Path "c:\Users\JE\servio.ai\backend\src\index.js" -Pattern "whatsappService|whatsappRouter" | Select-Object -First 2

# Esperado:
# const WhatsAppService = require('./whatsappService');
# const whatsappRouter = require('./routes/whatsapp');
```

**Status Esperado:** 2 linhas de import encontradas ✅

---

### PASSO 3: Definir Variáveis de Ambiente

Adicionar as 6 variáveis de ambiente necessárias:

#### 3a. Arquivo `.env.local` (Desenvolvimento Local)

```bash
# WhatsApp Business API Configuration
VITE_WHATSAPP_APP_ID=784914627901299
VITE_WHATSAPP_PHONE_NUMBER_ID=1606756873622361
WHATSAPP_ACCESS_TOKEN=EAALJ4C2TN3MBQOZA8siCEiKv17APiloYzhgGOSZBHDkhmC8ZCvr4n8T6C0kUTZCFKlFpVlZCadE2FYy6hXZAodMxGvkv5UvBtP1gPzOVpbGbYjHU3yF2LNJwYH5OSLvgjJxxKxBrIOePh23Nk6ZAzfaFa4VUe5GN7LGtJOYY162JofPJQm35ZBGMBqwddGNvplLfZAQZDZD
WHATSAPP_SECRET_KEY=f79c3e815dfcacf1ba49df7f0c4e48b1
WHATSAPP_WEBHOOK_TOKEN=servio-ai-webhook-token-2025
WHATSAPP_WEBHOOK_VERIFY_TOKEN=servio-ai-webhook-token-2025
```

#### 3b. Google Cloud Run (Produção)

Usar Google Cloud Console ou CLI:

```bash
# Set environment variables in Cloud Run service
gcloud run services update servio-backend \
  --update-env-vars VITE_WHATSAPP_APP_ID=784914627901299 \
  --update-env-vars VITE_WHATSAPP_PHONE_NUMBER_ID=1606756873622361 \
  --update-env-vars WHATSAPP_ACCESS_TOKEN=EAALJ4C2TN3... \
  --update-env-vars WHATSAPP_SECRET_KEY=f79c3e815dfcacf1ba49df7f0c4e48b1 \
  --update-env-vars WHATSAPP_WEBHOOK_TOKEN=servio-ai-webhook-token-2025 \
  --update-env-vars WHATSAPP_WEBHOOK_VERIFY_TOKEN=servio-ai-webhook-token-2025 \
  --region us-west1
```

**⚠️ IMPORTANTE:** Usar `WHATSAPP_WEBHOOK_TOKEN` como variável separada para webhook verification.

---

### PASSO 4: Testar Backend Localmente

Iniciar o servidor backend em modo desenvolvimento:

```powershell
# Terminal 1: Backend
cd backend
npm install  # Se necessário
npm start
# Esperado: "Firestore Backend Service listening on port 8081"
```

---

### PASSO 5: Testar Endpoint de Status

Verificar se o serviço WhatsApp está configurado corretamente:

```bash
# Terminal 2: Teste de Status
curl -X GET http://localhost:8081/api/whatsapp/status \
  -H "Content-Type: application/json"

# Resposta Esperada:
# {
#   "configured": true,
#   "connected": true,
#   "phoneNumberId": "1606756873622361",
#   "displayPhoneNumber": "+55 11 98765-4321",
#   "qualityRating": "GREEN"
# }
```

**Se configurado:** ✅ connected: true  
**Se não configurado:** ❌ connected: false

---

### PASSO 6: Testar Envio de Mensagem (Desenvolvimento)

Enviar uma mensagem de teste através do endpoint:

```bash
# Teste de Envio
curl -X POST http://localhost:8081/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "prospectorId": "seu_email@example.com",
    "prospectPhone": "5511987654321",
    "prospectName": "Teste",
    "message": "Teste de mensagem WhatsApp",
    "referralLink": "https://servio.ai?ref=ABC123DEF456"
  }'

# Resposta Esperada (Sucesso):
# {
#   "success": true,
#   "messageId": "wamid.XXXXXXXXXXX",
#   "phone": "5511987654321",
#   "message": "Teste de mensagem WhatsApp",
#   "status": "sent",
#   "createdAt": "2025-11-27T12:00:00.000Z"
# }

# Resposta Esperada (Erro de Credenciais):
# {
#   "success": false,
#   "error": "WhatsApp service not properly configured"
# }
```

---

### PASSO 7: Verificar Webhook (Desenvolvimento)

Testar endpoint de verificação de webhook (Challenge/Response):

```bash
# Test webhook verification endpoint
curl -X GET "http://localhost:8081/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=CHALLENGE_STRING&hub.verify_token=servio-ai-webhook-token-2025" \
  -H "Content-Type: application/json"

# Resposta Esperada (Sucesso - Token Correto):
# CHALLENGE_STRING

# Resposta Esperada (Erro - Token Incorreto):
# HTTP/1.1 403 Forbidden
# Forbidden
```

---

### PASSO 8: Configurar Webhook no Meta Business Manager

**⚠️ REQUER ACESSO MANUAL - FAZER NA DASHBOARD DO META**

1. **Acesse:** https://developers.facebook.com/apps/784914627901299/
2. **Navegue até:** Configuração → Webhooks
3. **Clique em:** "Editar Inscrição"
4. **Configure os campos:**
   - **URL do Callback:** `https://api.servio-ai.com/api/whatsapp/webhook`
   - **Token de Verificação:** `servio-ai-webhook-token-2025`
   - **Eventos Inscritos:**
     ✅ `messages`  
     ✅ `message_status`  
     ✅ `message_template_status_update` (opcional)

5. **Clique em:** "Verificar e Salvar"
6. **Aguarde:** Confirmação de webhook verificado (verde ✅)

---

### PASSO 9: Deploy para Produção (Cloud Run)

Após validar localmente, fazer deploy:

```powershell
# Build e push para Cloud Run
gcloud builds submit --region=us-west1

# Ou manualmente:
cd backend
npm run build
gcloud run deploy servio-backend \
  --source . \
  --region us-west1 \
  --allow-unauthenticated
```

**Tempo esperado:** 3-5 minutos

**Esperado ao terminar:**

```
Service [servio-backend] revision [XXXXX] has been deployed and is serving 100% of traffic at:
https://servio-backend-XXXXXXXXX-uw.a.run.app
```

---

### PASSO 10: Testar em Produção

Após deploy, testar os mesmos endpoints em produção:

```bash
# 1. Status da API
curl -X GET https://api.servio-ai.com/api/whatsapp/status

# 2. Webhook verification (Meta fará isso automaticamente após salvar)
curl -X GET "https://api.servio-ai.com/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=TEST123&hub.verify_token=servio-ai-webhook-token-2025"

# 3. Enviar mensagem de teste (com número real)
curl -X POST https://api.servio-ai.com/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "prospectorId": "seu_email@example.com",
    "prospectPhone": "5511987654321",
    "prospectName": "Nome Real",
    "message": "Mensagem de teste da API",
    "referralLink": "https://servio.ai?ref=PROD123"
  }'
```

---

## 🔍 Verificação de Firestore

Após enviar mensagens, verificar se estão sendo registradas em Firestore:

```firestore
# Firestore Console Query
db.collection('whatsapp_messages')
  .orderBy('createdAt', 'desc')
  .limit(10)

# Campos esperados em cada documento:
{
  prospectorId: string,
  prospectPhone: string,
  prospectName: string,
  messageId: string,
  message: string,
  status: "sent" | "delivered" | "read" | "failed",
  createdAt: timestamp,
  deliveredAt?: timestamp,
  readAt?: timestamp,
  referralLink: string,
  errorMessage?: string
}
```

**Status Esperado:**

- ✅ Novos documentos aparecem em tempo real
- ✅ Status atualiza quando WhatsApp processa (webhook)
- ✅ Timestamps aumentam sequencialmente

---

## 📊 Monitoramento

### Cloud Logging - Verificar Erros

```bash
# Ver logs de erro no Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend AND severity=ERROR" \
  --limit=50 \
  --format=json | head -20

# Ou via Console:
# Google Cloud Console → Cloud Run → servio-backend → Logs
```

### Alertas Recomendados (Setup no Cloud Monitoring)

1. **Webhook Failures:** Se >5 errors em 5 minutos → Slack Alert
2. **Message Failures:** Se delivery rate <90% → Email Alert
3. **Service Down:** Se status endpoint retorna erro → PagerDuty
4. **Rate Limit Hit:** Se retorna HTTP 429 → Log warning

---

## ✅ Checklist Final

- [ ] Arquivos criados (3 arquivos verificados)
- [ ] Backend integrado no index.js (imports + router)
- [ ] Variáveis de ambiente definidas (.env.local ou Cloud Run)
- [ ] Teste local de status OK
- [ ] Teste local de envio OK
- [ ] Teste local de webhook OK
- [ ] Webhook configurado no Meta Business Manager
- [ ] Deploy para produção concluído
- [ ] Teste de produção de status OK
- [ ] Teste de produção de envio OK
- [ ] Mensagens aparecem em Firestore
- [ ] Monitoramento configurado

---

## 🚨 Troubleshooting

### Problema: "WhatsApp service not properly configured"

**Causa:** Variáveis de ambiente não estão definidas

**Solução:**

```bash
# Verificar se variáveis existem
echo $WHATSAPP_ACCESS_TOKEN
echo $WHATSAPP_SECRET_KEY

# Se vazio, adicionar ao .env.local ou Cloud Run
```

---

### Problema: Webhook retorna 403 Forbidden

**Causa:** Token de verificação incorreto

**Solução:**

1. Verificar token em Meta Business Manager
2. Comparar com `WHATSAPP_WEBHOOK_TOKEN` em .env
3. Garantir que os tokens COMBINAM EXATAMENTE

```bash
# Verificar valor esperado
echo "Token esperado: $WHATSAPP_WEBHOOK_TOKEN"
echo "Token meta: servio-ai-webhook-token-2025"
```

---

### Problema: Mensagens não são entregues

**Causa:** Número de telefone em formato errado

**Solução:**

- Usar formato E.164: `+XXXXXXXXXXX`
- Brasil: `+55 + DDD + número` sem "-" ou espaços
- Exemplo correto: `5511987654321` (sem +55 prefixo no campo, o serviço adiciona)

---

### Problema: "Invalid template language"

**Causa:** Template não existe ou tem outro idioma

**Solução:**

1. Verificar templates criados em Meta Business Manager
2. Confirmar idioma: português_BR não português_PT
3. Usar nomes de template exatos (case-sensitive)

---

## 📞 Suporte

- **WhatsApp Business API Docs:** https://developers.facebook.com/docs/whatsapp/cloud-api/
- **Status da API:** https://developers.facebook.com/status/
- **Documentação Interna:** Ver WHATSAPP_BUSINESS_CONFIG.md

---

**Próximo Passo:** Criar componente frontend QuickActionsBar para integrar os botões de WhatsApp
