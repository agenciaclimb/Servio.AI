# 🔄 Scheduler de Prospecção (Follow-ups Automáticos)

Este guia configura um job do Cloud Scheduler para acionar o endpoint HTTPS que executa follow-ups automáticos em leads com `nextFollowUpAt <= agora`.

## ✅ Status: PRODUÇÃO
- **Deploy**: 03/12/2025 21:20 BRT
- **Job ID**: `prospector-follow-up-scheduler`
- **Região**: `us-central1`
- **Frequência**: A cada 5 minutos (`*/5 * * * *`)
- **Endpoint**: `https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/prospectorRunScheduler?limit=50`
- **Timezone**: `America/Sao_Paulo`
- **Headers**: `x-servio-scheduler-token`, `Content-Type: application/json`, `Content-Length: 0`
- **Última execução**: Automática via Cloud Scheduler (logs ativos)

---

## 🔍 Verificação Rápida

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

## 🧪 Teste Manual

```powershell
# Content-Length é obrigatório
$TOKEN = Get-Content scheduler_token.txt
curl -X POST "https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/prospectorRunScheduler" `
  -H "x-servio-scheduler-token: $TOKEN" `
  -H "Content-Type: application/json" `
  -H "Content-Length: 0"
```

## 🚨 Monitoramento e Alertas (Opcional)

```powershell
# Criar alerta se o job falhar consecutivamente
# Cloud Monitoring → Alertas → Condição por logs
# Filtro sugerido:
# resource.type="cloud_function"
# resource.labels.function_name="prospectorRunScheduler"
# severity>=ERROR
```

> Nota: Projeto usa `firebase-functions@4.9.0` e `functions.config()`.
> Planejar upgrade para `firebase-functions@>=5.1.0` e migração de variáveis para `.env` antes de março/2026.


## 📌 Pré-requisitos

- Firebase Functions já configurado no projeto `gen-lang-client-0737507616`
- Permissões para criar jobs no Cloud Scheduler
- Token secreto para proteger o endpoint

---

## 🛡️ Definir o token secreto (Functions Config)

```powershell
# Definir o token secreto usado pelo header x-servio-scheduler-token
firebase functions:config:set servio.scheduler_token="SEU_TOKEN_FORTE_AQUI"

# Verificar
firebase functions:config:get
```

---

## 🚀 Deploy do endpoint

```powershell
# Deploy apenas do endpoint de scheduler
firebase deploy --only functions:prospectorRunScheduler
```

Endpoint HTTPS:

```
https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/prospectorRunScheduler
```

---

## ⏱️ Criar job no Cloud Scheduler

```powershell
# Executar a cada 5 minutos
$FUNCTION_URL = "https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/prospectorRunScheduler"
$TOKEN = "SEU_TOKEN_FORTE_AQUI"

gcloud scheduler jobs create http prospector-sequencer `
  --schedule "*/5 * * * *" `
  --http-method POST `
  --uri "$FUNCTION_URL" `
  --headers "x-servio-scheduler-token=$TOKEN" `
  --time-zone "America/Los_Angeles"
```

Para atualizar o token do job:

```powershell
gcloud scheduler jobs update http prospector-sequencer `
  --headers "x-servio-scheduler-token=$TOKEN"
```

---

## 🧪 Teste manual do endpoint

```powershell
$FUNCTION_URL = "https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/prospectorRunScheduler"
$TOKEN = "SEU_TOKEN_FORTE_AQUI"

curl -X POST $FUNCTION_URL `
  -H "x-servio-scheduler-token: $TOKEN"
```

Resposta esperada:

```json
{ "ok": true, "count": 0, "processed": [] }
```

> Observação: Se houver leads com `nextFollowUpAt <= agora`, o `count` será maior que zero e a lista terá os IDs processados.

---

## 🔍 Logs e verificação

```powershell
# Ver logs da função
firebase functions:log --only prospectorRunScheduler

# Consultar leads com follow-up agendado
firebase firestore:query prospector_prospects --limit 10
```

---

## ✅ Boas práticas

- Use um token aleatório longo (UUID + sufixo) e rotacione periodicamente.
- Mantenha o `limit` padrão do endpoint (50) para evitar picos.
- Ajuste a frequência do Scheduler conforme volume de leads.
- Monitore `activities` e `nextFollowUpAt` para garantir idempotência operacional.

---

Pronto! O follow-up automático ficará ativo e seguro, mantendo seu pipeline sempre em movimento. 💼⚡