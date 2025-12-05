# ☁️ CLOUD SCHEDULER SETUP - GUIA PASSO A PASSO

**Fase 3 Implementation**: Cloud Scheduler + Analytics Dashboard  
**Status**: Ready for manual configuration in GCP Console  
**Date**: 05/12/2025

---

## 🎯 OBJETIVO

Configurar 5 jobs de Cloud Scheduler para automatizar prospecção, email, analytics e limpeza de dados. Cada job fará uma requisição HTTP POST para endpoints backend com OIDC authentication.

---

## 📋 JOBS A CONFIGURAR

### 1️⃣ **Follow-ups Automáticos** (Job: `prospector-follow-ups`)

| Campo               | Valor                                                                               |
| ------------------- | ----------------------------------------------------------------------------------- |
| **Frequência**      | `0 */4 * * *` (a cada 4 horas)                                                      |
| **Timezone**        | `America/Sao_Paulo`                                                                 |
| **HTTP Method**     | POST                                                                                |
| **URL**             | `https://servio-backend-v2-1000250760228.us-west1.run.app/api/scheduler/follow-ups` |
| **Auth Type**       | OIDC                                                                                |
| **Service Account** | `cloud-scheduler-sa@{PROJECT_ID}.iam.gserviceaccount.com`                           |
| **Audience**        | `https://servio-backend-v2-1000250760228.us-west1.run.app`                          |
| **Body**            | `{ "action": "follow-ups" }`                                                        |
| **Content-Type**    | `application/json`                                                                  |

**Função**: Envia lembretes automáticos para leads sem resposta há 4+ horas.

---

### 2️⃣ **Email Reminders** (Job: `prospector-email-reminders`)

| Campo               | Valor                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------- |
| **Frequência**      | `0 9 * * *` (9:00 AM diariamente)                                                        |
| **Timezone**        | `America/Sao_Paulo`                                                                      |
| **HTTP Method**     | POST                                                                                     |
| **URL**             | `https://servio-backend-v2-1000250760228.us-west1.run.app/api/scheduler/email-reminders` |
| **Auth Type**       | OIDC                                                                                     |
| **Service Account** | `cloud-scheduler-sa@{PROJECT_ID}.iam.gserviceaccount.com`                                |
| **Audience**        | `https://servio-backend-v2-1000250760228.us-west1.run.app`                               |
| **Body**            | `{ "action": "email-reminders" }`                                                        |
| **Content-Type**    | `application/json`                                                                       |

**Função**: Envia email digest com resumo diário de prospects e métricas.

---

### 3️⃣ **Analytics Rollup Diário** (Job: `prospector-analytics-daily`)

| Campo               | Valor                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------- |
| **Frequência**      | `0 0 * * *` (Midnight)                                                                    |
| **Timezone**        | `America/Sao_Paulo`                                                                       |
| **HTTP Method**     | POST                                                                                      |
| **URL**             | `https://servio-backend-v2-1000250760228.us-west1.run.app/api/scheduler/analytics-rollup` |
| **Auth Type**       | OIDC                                                                                      |
| **Service Account** | `cloud-scheduler-sa@{PROJECT_ID}.iam.gserviceaccount.com`                                 |
| **Audience**        | `https://servio-backend-v2-1000250760228.us-west1.run.app`                                |
| **Body**            | `{ "action": "daily-rollup" }`                                                            |
| **Content-Type**    | `application/json`                                                                        |

**Função**: Agregação diária de métricas (leads, conversões, revenue) para dashboard.

---

### 4️⃣ **Campaign Performance Metrics** (Job: `prospector-campaign-metrics`)

| Campo               | Valor                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------- |
| **Frequência**      | `0 6,12,18 * * *` (6h, 12h, 18h)                                                              |
| **Timezone**        | `America/Sao_Paulo`                                                                           |
| **HTTP Method**     | POST                                                                                          |
| **URL**             | `https://servio-backend-v2-1000250760228.us-west1.run.app/api/scheduler/campaign-performance` |
| **Auth Type**       | OIDC                                                                                          |
| **Service Account** | `cloud-scheduler-sa@{PROJECT_ID}.iam.gserviceaccount.com`                                     |
| **Audience**        | `https://servio-backend-v2-1000250760228.us-west1.run.app`                                    |
| **Body**            | `{ "action": "campaign-metrics" }`                                                            |
| **Content-Type**    | `application/json`                                                                            |

**Função**: Calcula performance em tempo real por campanha (taxa conversão, revenue, engajamento).

---

### 5️⃣ **Cleanup Weekly** (Job: `prospector-cleanup`)

| Campo               | Valor                                                                            |
| ------------------- | -------------------------------------------------------------------------------- |
| **Frequência**      | `0 3 ? * SUN` (3 AM Sundays)                                                     |
| **Timezone**        | `America/Sao_Paulo`                                                              |
| **HTTP Method**     | POST                                                                             |
| **URL**             | `https://servio-backend-v2-1000250760228.us-west1.run.app/api/scheduler/cleanup` |
| **Auth Type**       | OIDC                                                                             |
| **Service Account** | `cloud-scheduler-sa@{PROJECT_ID}.iam.gserviceaccount.com`                        |
| **Audience**        | `https://servio-backend-v2-1000250760228.us-west1.run.app`                       |
| **Body**            | `{ "action": "cleanup", "days": 90 }`                                            |
| **Content-Type**    | `application/json`                                                               |

**Função**: Limpeza de dados antigos (>90 dias) e logs expirados.

---

## 🔧 PASSOS DE CONFIGURAÇÃO NO GCP CONSOLE

### **Pré-requisitos**

1. ✅ Projeto GCP: `servio-ai-prod`
2. ✅ Service Account criada: `cloud-scheduler-sa@servio-ai-prod.iam.gserviceaccount.com`
3. ✅ Backend Cloud Run: `servio-backend-v2` em `us-west1`
4. ✅ Roles atribuídos ao Service Account:
   - `roles/iam.workloadIdentityUser`
   - `roles/run.invoker`

### **Para cada job acima:**

1. **Acessar Cloud Scheduler Console**

   ```
   https://console.cloud.google.com/cloudscheduler?project=servio-ai-prod
   ```

2. **Clique em "CREATE JOB"**

3. **Preencha os campos:**
   - **Name**: Nome do job (ex: `prospector-follow-ups`)
   - **Frequency**: Cron expression (ex: `0 */4 * * *`)
   - **Timezone**: `America/Sao_Paulo`

4. **Clique "CONTINUE"**

5. **Configure a execução:**
   - **Execution timeout**: 600 seconds (10 minutos)
   - **Retry on failure**: enabled (max 5 retries)
   - **Backoff duration**: 5 minutes

6. **Configure autenticação:**
   - **Authentication**: OIDC Token
   - **Service account email**: `cloud-scheduler-sa@servio-ai-prod.iam.gserviceaccount.com`
   - **OIDC token audience**: `https://servio-backend-v2-1000250760228.us-west1.run.app`

7. **Configure requisição HTTP:**
   - **HTTP method**: POST
   - **URL**: `https://servio-backend-v2-1000250760228.us-west1.run.app/api/scheduler/{action}`
   - **Auth header**: Will be added automatically
   - **Message body**:
     ```json
     {
       "action": "{action-name}",
       "timestamp": "automated"
     }
     ```

8. **Clique "CREATE"**

---

## ✅ VERIFICAÇÃO PÓS-SETUP

### Testar cada job manualmente:

```bash
# 1. Follow-ups
curl -X POST https://servio-backend-v2-1000250760228.us-west1.run.app/api/scheduler/follow-ups \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"action":"follow-ups"}'

# 2. Email Reminders
curl -X POST https://servio-backend-v2-1000250760228.us-west1.run.app/api/scheduler/email-reminders \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"action":"email-reminders"}'

# 3. Analytics Rollup
curl -X POST https://servio-backend-v2-1000250760228.us-west1.run.app/api/scheduler/analytics-rollup \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"action":"daily-rollup"}'

# 4. Campaign Performance
curl -X POST https://servio-backend-v2-1000250760228.us-west1.run.app/api/scheduler/campaign-performance \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"action":"campaign-metrics"}'

# 5. Cleanup
curl -X POST https://servio-backend-v2-1000250760228.us-west1.run.app/api/scheduler/cleanup \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"action":"cleanup","days":90}'
```

Cada requisição deve retornar:

```json
{
  "success": true,
  "action": "{action-name}",
  "timestamp": "2025-12-05T11:45:00.000Z",
  "message": "Action executed successfully"
}
```

### Verificar logs no Cloud Run:

```bash
gcloud run logs read servio-backend-v2 --region us-west1 --limit 50
```

---

## 📊 DASHBOARD METRICS VERIFICATION

Após setup, verificar se métricas aparecem no dashboard:

1. **Acessar frontend** em produção
2. **Login como prospector**
3. **Navegar para "Métricas"** (route: `/api/metrics`)
4. **Verificar KPI Cards**:
   - Leads Importados
   - Taxa de Conversão
   - Revenue Gerado
   - Engajamento
   - Taxa de Resposta

5. **Verificar Charts**:
   - LineChart: Evolução últimos 30 dias
   - BarChart: Revenue por semana
   - Campaign Table: Performance por campanha
   - Conversion Funnel: Funil de conversão

---

## 🚨 TROUBLESHOOTING

### Job executa mas retorna 401 Unauthorized

- **Causa**: Service Account não tem permissão de invocar Cloud Run
- **Solução**:
  ```bash
  gcloud run services add-iam-policy-binding servio-backend-v2 \
    --region us-west1 \
    --member=serviceAccount:cloud-scheduler-sa@servio-ai-prod.iam.gserviceaccount.com \
    --role=roles/run.invoker
  ```

### Job timeout (> 600s)

- **Causa**: Backend respondendo lento
- **Solução**: Verificar logs do Cloud Run, aumentar timeout para 900s, ou verificar Firestore queries

### OIDC token inválido

- **Causa**: Audience URL incorreta
- **Solução**: Garantir que audience matches exatamente o URL do Cloud Run (sem trailing slash)

### No data appearing in dashboard

- **Causa**: Analytics service não agregando dados
- **Solução**: Verificar Firestore collections `analytics_daily` e `prospector_campaigns`

---

## 📝 NOTAS

- Cloud Scheduler usa OIDC tokens que são válidos por ~1 hora
- Cada job pode ser testado manualmente clicando "FORCE RUN" no console
- Logs de cada execução aparecem em Cloud Run logs
- Métricas agregadas em `Firestore > analytics_daily` collection

---

**Status**: Ready for implementation  
**Owner**: DevOps / GCP Admin  
**Date**: 05/12/2025
