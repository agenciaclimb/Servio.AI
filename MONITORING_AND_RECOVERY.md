# 📊 MONITORING_AND_RECOVERY.md — Monitoramento e Recuperação

**Versão**: 1.0  
**Status**: Production Active  
**Data**: 11 de dezembro de 2025

---

## 🔴 Monitoramento em Tempo Real

### Métricas Críticas

**Backend (Cloud Run)**:

```
- CPU: < 80%
- Memory: < 85%
- Response time: < 200ms p95
- Error rate: < 0.1%
- Uptime: ≥ 99.9%
```

**Database (Firestore)**:

```
- Read latency: < 100ms p95
- Write latency: < 200ms p95
- Quota usage: < 80%
- Backup status: GREEN
```

**Frontend (Firebase Hosting)**:

```
- CDN cache hit: > 90%
- Page load time: < 2s
- 404 rate: < 1%
- SSL: válido
```

**Pagamentos (Stripe)**:

```
- Webhook latency: < 5s
- Failure rate: < 0.5%
- Balance: sync com ledger
```

---

## 🟢 Alertas Configurados

| Alerta          | Threshold | Ação                   |
| --------------- | --------- | ---------------------- |
| High Error Rate | > 1%      | Slack #critical-alerts |
| High Latency    | > 500ms   | Page on-call           |
| Memory Pressure | > 85%     | Auto-scale             |
| Quota Exceeded  | > 90%     | Escalate               |
| Certificate Exp | < 7 dias  | Renew automático       |

---

## 🛠️ Playbooks de Recuperação

### Cenário 1: Alta Taxa de Erros

```bash
# 1. Verificar logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend-v2" --limit 50

# 2. Verificar métricas
gcloud monitoring dashboards list

# 3. Revert se recente
git revert HEAD
gcloud run deploy servio-backend-v2 --source .

# 4. Monitor por 10 minutos
watch -n 1 'gcloud logging read ... | tail -20'
```

### Cenário 2: Database Overload

```bash
# 1. Verificar quota
gcloud firestore describe

# 2. Verificar queries lentes
gcloud firestore operations list --filter="metadata.operationType=*"

# 3. Escalar índices
firebase deploy --only firestore:indexes

# 4. Aumentar quota
# Via Google Cloud Console → Firestore → Quotas
```

### Cenário 3: Falha de Pagamento

```bash
# 1. Verificar status Stripe
curl https://api.stripe.com/v1/status -H "Authorization: Bearer sk_live_..."

# 2. Sincronizar webhooks
node /ai-engine/stripe/sync-webhooks.js

# 3. Reprocessar eventos pendentes
node /ai-engine/stripe/replay-events.js

# 4. Validar transações
npm run test:stripe-integration
```

### Cenário 4: Perda de Dados

```bash
# 1. Verificar backup
gsutil ls gs://servio-backups/

# 2. Restaurar ponto
gcloud firestore import gs://servio-backups/backup-{timestamp}/

# 3. Validar restauração
npm run test:data-integrity

# 4. Notificar usuários
# Template: /docs/incident-notification.md
```

---

## 📋 Health Check Endpoints

```bash
# Backend
curl https://api.servio.ai/health
# Resposta esperada:
# { "status": "ok", "timestamp": "...", "version": "4.1.0" }

# Database
curl https://api.servio.ai/health/db
# Resposta esperada:
# { "status": "connected", "latency": "45ms" }

# Payments
curl https://api.servio.ai/health/stripe
# Resposta esperada:
# { "status": "ok", "balance": "..." }
```

---

## 📊 Dashboard de Monitoramento

**Google Cloud Console**:

- https://console.cloud.google.com/monitoring/dashboards
- Dashboard ID: `servio-production`

**Métricas expostas**:

- Request count
- Error count
- Latency
- Resource usage
- Custom metrics

---

## 🚨 Escalação

**Severidade 1 (Crítica)**:

- Downtime > 5 minutos
- Data loss
- Security breach
- **Ação**: Page on-call immediately

**Severidade 2 (Alta)**:

- Degradação de performance
- Erro afetando % de usuários
- **Ação**: Slack #critical-alerts + escalate se não resolvido em 30min

**Severidade 3 (Média)**:

- Funcionalidade não crítica com erro
- Performance degradada
- **Ação**: Slack #alerts + resolve em 4h

---

## 📝 Logs e Auditoria

**Centralizados em Google Cloud Logging**:

```bash
# Todos os logs
gcloud logging read --limit 100

# Apenas erros
gcloud logging read "severity=ERROR" --limit 50

# Por serviço
gcloud logging read "resource.service=servio-backend-v2" --limit 50
```

**Retenção**: 90 dias padrão, 1 ano para eventos críticos

---

## 🔄 Backup e Recovery

**Backup automático diário**:

```bash
# Firestore backup
gcloud firestore export gs://servio-backups/daily/$(date +%Y-%m-%d)

# Recover point (7 dias)
gcloud firestore import gs://servio-backups/daily/{data}
```

**RPO** (Recovery Point Objective): 24 horas  
**RTO** (Recovery Time Objective): 1 hora

---

## 📞 Escalação

```
Nível 1: Observability Engineer (on-call pager)
Nível 2: Senior Backend Engineer
Nível 3: Engineering Manager
Nível 4: VP Engineering
```

**On-call**: PagerDuty (escalation policy ativa)

---

_Monitoring & Recovery | Servio.AI | Production_
