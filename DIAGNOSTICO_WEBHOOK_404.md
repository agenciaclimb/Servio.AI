# 🔴 DIAGNÓSTICO E CORREÇÃO - Webhook Stripe 404 (Atualizado)

**Data**: 13/11/2025  
**Status**: ❌ Webhook ainda retornando 404 APÓS correção de URL  
**Situação**: URL corrigida no Stripe mas backend não responde

---

## 🔍 DIAGNÓSTICO

### ✅ O que está correto:

- URL no Stripe Dashboard: `https://servio-ai-100025076028.us-west1.run.app/api/stripe-webhook` ✅
- Código backend tem endpoint: `/api/stripe-webhook` ✅
- Middleware configurado corretamente ✅

### ❌ O que está ERRADO:

- **Cloud Run NÃO tem a versão atualizada do código**
- Backend deployado está com código antigo (sem o endpoint de webhook)
- Precisa fazer REDEPLOY do backend

---

## 🚨 CAUSA RAIZ

O endpoint `/api/stripe-webhook` existe no **código local**, mas o **Cloud Run ainda está rodando uma versão antiga** que não tem esse endpoint!

**Evidência**:

- Resposta do servidor mostra HTML `<title>404 Page not found</title>`
- Isso significa que o Cloud Run recebeu a requisição mas não encontrou a rota
- Se fosse problema de URL, não chegaria nem no servidor

---

## ✅ SOLUÇÃO: REDEPLOY DO BACKEND

### Opção 1: Deploy via GitHub Actions (Recomendado)

Se você tem CI/CD configurado:

```bash
# 1. Commitar código
git add backend/src/index.js
git commit -m "fix: atualizar endpoint webhook Stripe"
git push origin main

# 2. GitHub Actions vai fazer deploy automaticamente
# Aguardar 5-10 minutos
```

### Opção 2: Deploy Manual via gcloud

```bash
# 1. Navegar para pasta backend
cd backend

# 2. Deploy no Cloud Run
gcloud run deploy servio-ai \
  --source . \
  --region us-west1 \
  --platform managed \
  --allow-unauthenticated

# 3. Aguardar deploy (3-5 minutos)
```

### Opção 3: Deploy via Cloud Build

```bash
# 1. Build da imagem
gcloud builds submit --tag gcr.io/servio-ai/backend

# 2. Deploy da nova imagem
gcloud run deploy servio-ai \
  --image gcr.io/servio-ai/backend \
  --region us-west1 \
  --platform managed
```

---

## 🔍 VALIDAR DEPLOY

### 1. Verificar versão do Cloud Run

```bash
# Ver última revisão deployada
gcloud run revisions list --service servio-ai --region us-west1

# Deve mostrar revisão recente (hoje)
```

### 2. Testar endpoint diretamente

```bash
# Testar se endpoint existe
curl -X POST https://servio-ai-100025076028.us-west1.run.app/api/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Esperado APÓS deploy:
# "Webhook Error: Missing signature or secret."
# (Isso é NORMAL - significa que endpoint EXISTE mas falta assinatura)

# Se ainda retornar 404, deploy não funcionou
```

### 3. Verificar logs do Cloud Run

```bash
# Ver logs recentes
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-ai" \
  --limit 20 \
  --format "table(timestamp, textPayload)"

# Deve mostrar logs do novo deploy
```

---

## 📋 CHECKLIST DE DEPLOY

- [ ] Código local está commitado no Git
- [ ] Push para repositório remoto (GitHub)
- [ ] Cloud Build iniciou (se CI/CD ativo)
- [ ] Deploy completou sem erros
- [ ] Nova revisão aparece no Cloud Run
- [ ] Teste com curl retorna erro de assinatura (não 404)
- [ ] Teste do Stripe Dashboard com "Send test webhook"
- [ ] Webhook retorna Status 200

---

## 🔧 VARIÁVEIS DE AMBIENTE (VERIFICAR)

Após deploy, garantir que estas variáveis estão configuradas:

```bash
# Listar variáveis atuais
gcloud run services describe servio-ai \
  --region us-west1 \
  --format="value(spec.template.spec.containers[0].env)"

# Deve conter:
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET (CRÍTICO para webhook)
# - FIREBASE_PROJECT_ID
# - GCP_STORAGE_BUCKET
```

Se `STRIPE_WEBHOOK_SECRET` estiver faltando:

```bash
# Adicionar secret
gcloud run services update servio-ai \
  --region us-west1 \
  --set-env-vars STRIPE_WEBHOOK_SECRET=whsec_SEU_SECRET_AQUI
```

**Obter o secret**: Dashboard Stripe > Webhooks > seu webhook > "Signing secret"

---

## 🧪 TESTE COMPLETO

### 1. Teste Manual (curl)

```bash
# Deve retornar erro de assinatura (não 404)
curl -X POST https://servio-ai-100025076028.us-west1.run.app/api/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Esperado APÓS deploy**:

```
Webhook Error: Missing signature or secret.
```

### 2. Teste do Stripe

1. Stripe Dashboard > Webhooks
2. Clicar em "Send test webhook"
3. Selecionar: `checkout.session.completed`
4. Enviar

**Esperado**:

- ✅ Status: 200
- ✅ Response time: < 2s
- ✅ Sem erros nos logs

### 3. Teste Real (E2E)

1. Criar job no frontend
2. Aceitar proposta
3. Fazer checkout (4242 4242 4242 4242)
4. Completar pagamento
5. Verificar:
   - Logs do Cloud Run mostram webhook recebido
   - Escrow atualizado para "pago" no Firestore
   - Job progride para próxima fase

---

## 🚨 SE AINDA FALHAR APÓS DEPLOY

### Problema: 404 persiste

```bash
# 1. Verificar se serviço está rodando
gcloud run services describe servio-ai --region us-west1

# 2. Ver logs de erro
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit 50

# 3. Testar endpoint raiz (deve funcionar)
curl https://servio-ai-100025076028.us-west1.run.app/

# Deve retornar: "Hello from SERVIO.AI Backend..."
```

### Problema: Erro de assinatura

```bash
# Verificar se STRIPE_WEBHOOK_SECRET está correto
# Copiar novamente do Stripe Dashboard
# Atualizar no Cloud Run
gcloud run services update servio-ai \
  --region us-west1 \
  --update-env-vars STRIPE_WEBHOOK_SECRET=whsec_NOVO_SECRET
```

### Problema: Timeout

```bash
# Aumentar timeout do Cloud Run
gcloud run services update servio-ai \
  --region us-west1 \
  --timeout 60
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### Alertas para configurar:

1. **Webhook Failures**
   - Alert quando > 5 webhooks falharem em 5 minutos

2. **Cloud Run Errors**
   - Alert quando error rate > 5%

3. **Latency**
   - Alert quando p95 > 2 segundos

### Dashboard para monitorar:

```bash
# URL do Cloud Run monitoring
echo "https://console.cloud.google.com/run/detail/us-west1/servio-ai/metrics"
```

---

## 🎯 TIMELINE ESPERADO

```
Agora        → Fazer deploy (5-10 min)
+10 min      → Validar endpoint existe (curl)
+15 min      → Testar webhook Stripe (test)
+20 min      → Teste E2E completo
+30 min      → Monitorar logs
+1-2h        → Validar produção estável
```

---

## 💡 DICA PRO

Sempre que alterar rotas/endpoints:

1. ✅ Testar localmente primeiro

   ```bash
   cd backend
   npm start
   # Testar: curl http://localhost:8081/api/stripe-webhook
   ```

2. ✅ Commitar e fazer deploy

3. ✅ Validar com curl antes de testar no Stripe

4. ✅ Teste do Stripe por último

---

## ✅ PRÓXIMOS PASSOS

1. **AGORA**: Fazer redeploy do backend
2. **+10min**: Validar endpoint com curl
3. **+15min**: Testar no Stripe Dashboard
4. **+30min**: Monitorar webhooks reais
5. **+1h**: Marcar como resolvido se tudo OK

---

## 📞 COMANDO RÁPIDO (COPIAR E COLAR)

```bash
# Deploy completo em um comando
cd backend && \
gcloud run deploy servio-ai \
  --source . \
  --region us-west1 \
  --platform managed \
  --allow-unauthenticated && \
echo "✅ Deploy completo! Aguarde 2-3 minutos e teste com:" && \
echo "curl -X POST https://servio-ai-100025076028.us-west1.run.app/api/stripe-webhook -d '{}'"
```

---

**AÇÃO IMEDIATA**: Execute o deploy do backend AGORA para corrigir o problema! 🚀

**Tempo estimado**: 10-15 minutos  
**Impacto**: CRÍTICO - Sistema de pagamentos não funciona sem isso
