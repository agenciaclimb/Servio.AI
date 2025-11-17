# ⚡ GUIA RÁPIDO - Redeploy do Backend

**Escolha o método mais conveniente para você:**

---

## 🚀 OPÇÃO 1: Deploy via GitHub Actions (RECOMENDADO)

**Vantagens**: Automático, rastreável, usa CI/CD configurado  
**Tempo**: 8-12 minutos

### Passo a Passo:

1. **Commitar mudanças locais** (se houver):

   ```bash
   git add .
   git commit -m "fix: atualizar configuração webhook Stripe"
   git push origin main
   ```

2. **Acionar deploy manual**:
   - Acesse: https://github.com/agenciaclimb/Servio.AI/actions
   - Clique em **"Deploy to Cloud Run"** (workflow)
   - Clique em **"Run workflow"**
   - Selecione:
     - Branch: `main`
     - Service: `backend`
   - Clique em **"Run workflow"**

3. **Aguardar deploy** (8-12 min):
   - Acompanhe o progresso na página do workflow
   - Aguarde status ✅ "Success"

4. **Validar**:

   ```bash
   curl -X POST https://servio-ai-100025076028.us-west1.run.app/api/stripe-webhook -d '{}'
   ```

   **Esperado**: `Webhook Error: Missing signature` (não 404!)

---

## 💻 OPÇÃO 2: Deploy via Terminal (RÁPIDO)

**Vantagens**: Mais rápido, controle direto  
**Tempo**: 5-8 minutos

### Comando Único:

```bash
cd backend && gcloud run deploy servio-ai --source . --region us-west1 --platform managed --allow-unauthenticated
```

### Passo a Passo Detalhado:

```bash
# 1. Navegar para pasta backend
cd backend

# 2. Fazer login (se necessário)
gcloud auth login

# 3. Selecionar projeto correto
gcloud config set project gen-lang-client-0737507616

# 4. Deploy
gcloud run deploy servio-ai \
  --source . \
  --region us-west1 \
  --platform managed \
  --allow-unauthenticated
```

**Output esperado**:

```
Building using Dockerfile and deploying...
✓ Building and deploying... Done.
✓ Service [servio-ai] revision [servio-ai-00042] has been deployed
Service URL: https://servio-ai-100025076028.us-west1.run.app
```

---

## 🔥 OPÇÃO 3: Deploy Ultra-Rápido (Se urgente)

**Use apenas se extremamente urgente**

```bash
# Uma linha só
cd backend && gcloud run deploy servio-ai --source . --region us-west1 --quiet
```

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

### 1. Testar Endpoint

```bash
curl -X POST https://servio-ai-100025076028.us-west1.run.app/api/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**✅ SUCESSO se retornar**:

```
Webhook Error: Missing signature or secret.
```

**❌ FALHOU se retornar**:

```
<title>404 Page not found</title>
```

### 2. Testar no Stripe

1. Ir para: https://dashboard.stripe.com/test/webhooks
2. Clicar no webhook
3. Clicar em **"Send test webhook"**
4. Selecionar: `checkout.session.completed`
5. Enviar

**✅ SUCESSO**: Status 200, sem erros

### 3. Ver Logs

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-ai" \
  --limit 10 \
  --format "table(timestamp, textPayload)"
```

Deve mostrar logs do webhook sendo recebido.

---

## 🚨 SE DER ERRO NO DEPLOY

### Erro: "Permission denied"

```bash
# Fazer login novamente
gcloud auth login

# Tentar deploy novamente
```

### Erro: "Project not found"

```bash
# Verificar projeto atual
gcloud config get-value project

# Mudar para projeto correto
gcloud config set project gen-lang-client-0737507616
```

### Erro: "Build failed"

```bash
# Ver logs do build
gcloud builds list --limit 1

# Ver detalhes do último build
gcloud builds log $(gcloud builds list --limit 1 --format="value(id)")
```

---

## 📊 VERIFICAR STATUS ATUAL

```bash
# Ver serviço atual
gcloud run services describe servio-ai --region us-west1

# Ver última revisão
gcloud run revisions list --service servio-ai --region us-west1 --limit 1

# Ver URL
gcloud run services describe servio-ai --region us-west1 --format="value(status.url)"
```

---

## ⏱️ TIMELINE

```
00:00 - Iniciar deploy
02:00 - Build da imagem
04:00 - Upload para registry
06:00 - Deploy no Cloud Run
08:00 - ✅ Deploy completo
08:30 - Testar com curl
09:00 - Testar no Stripe
10:00 - ✅ Problema resolvido!
```

---

## 🎯 CHECKLIST FINAL

- [ ] Deploy executado (GitHub Actions ou gcloud)
- [ ] Status do deploy: ✅ Success
- [ ] Teste curl retorna erro de assinatura (não 404)
- [ ] Teste Stripe retorna 200
- [ ] Logs mostram webhooks sendo recebidos
- [ ] Fazer pagamento teste funciona end-to-end

---

## 💡 RECOMENDAÇÃO

**Use Opção 1 (GitHub Actions)** para:

- ✅ Rastreabilidade completa
- ✅ Logs organizados
- ✅ CI/CD padronizado
- ✅ Rollback mais fácil

**Use Opção 2 (Terminal)** para:

- ✅ Deploy mais rápido
- ✅ Debugging direto
- ✅ Situações urgentes

---

**ESCOLHA UMA OPÇÃO E EXECUTE AGORA! ⚡**

Após deploy, volte aqui e marque o checklist final.
