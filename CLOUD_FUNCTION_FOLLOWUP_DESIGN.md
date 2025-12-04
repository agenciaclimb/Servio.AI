# Cloud Function - Follow-up Automático

## Arquitetura

### Trigger
- **Tipo**: Scheduled (Pub/Sub + Cloud Scheduler)
- **Frequência**: A cada hora (cron: `0 * * * *`)
- **Region**: `us-west1` (mesma do Cloud Run backend)

### Fluxo
1. Cloud Scheduler dispara Pub/Sub topic `send-followups`
2. Cloud Function `processFollowUps` recebe trigger
3. Query Firestore: `prospector_followups` where `status == 'active'`
4. Para cada followup:
   - Filtra steps onde `scheduledFor <= now` e `completed == false`
   - Para cada step:
     - Se `channel == 'whatsapp'`: envia via API Twilio/MessageBird
     - Se `channel == 'email'`: envia via SendGrid
     - Se `channel == 'call'`: cria notificação para prospector
     - Atualiza step: `completed: true`, `sentAt: Timestamp.now()`
5. Se todos steps completados: atualiza followup `status: 'completed'`

### Firestore Schema (revisão)
```typescript
interface FollowUpSchedule {
  prospectorId: string;
  leadId: string;
  leadName: string;
  sequenceId: string;
  sequenceName: string;
  currentStep: number;
  steps: FollowUpStepExecution[];
  createdAt: Timestamp;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
}

interface FollowUpStepExecution {
  stepIndex: number;
  dayOffset: number;
  scheduledFor: Timestamp;
  channel: 'whatsapp' | 'email' | 'call';
  template: string;
  subject?: string;
  completed: boolean;
  sentAt: Timestamp | null;
  error?: string;
}
```

## Implementação

### 1. Cloud Function (Node.js)

**Arquivo**: `backend/functions/processFollowUps.js`

```javascript
const { Firestore } = require('@google-cloud/firestore');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

const db = new Firestore();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.processFollowUps = async (message, context) => {
  console.log('[Follow-Up] Starting scheduled job');
  const now = Firestore.Timestamp.now();

  try {
    const snapshot = await db.collection('prospector_followups')
      .where('status', '==', 'active')
      .get();

    console.log(`[Follow-Up] Found ${snapshot.size} active schedules`);

    for (const doc of snapshot.docs) {
      const schedule = doc.data();
      let updated = false;

      for (const step of schedule.steps) {
        if (step.completed) continue;
        if (step.scheduledFor.toMillis() > now.toMillis()) continue;

        console.log(`[Follow-Up] Processing step ${step.stepIndex} for lead ${schedule.leadId}`);

        try {
          if (step.channel === 'whatsapp') {
            await sendWhatsApp(step, schedule);
          } else if (step.channel === 'email') {
            await sendEmail(step, schedule);
          } else if (step.channel === 'call') {
            await createCallReminder(step, schedule);
          }

          step.completed = true;
          step.sentAt = now;
          updated = true;

          console.log(`[Follow-Up] ✅ Step ${step.stepIndex} sent successfully`);
        } catch (error) {
          console.error(`[Follow-Up] ❌ Error sending step ${step.stepIndex}:`, error);
          step.error = error.message;
        }
      }

      if (updated) {
        const allCompleted = schedule.steps.every(s => s.completed);
        await db.collection('prospector_followups').doc(doc.id).update({
          steps: schedule.steps,
          status: allCompleted ? 'completed' : 'active',
          updatedAt: now
        });
      }
    }

    console.log('[Follow-Up] Job completed successfully');
  } catch (error) {
    console.error('[Follow-Up] Job failed:', error);
    throw error;
  }
};

async function sendWhatsApp(step, schedule) {
  // Buscar lead para obter telefone
  const leadDoc = await db.collection('prospector_prospects').doc(schedule.leadId).get();
  const lead = leadDoc.data();
  if (!lead?.phone) throw new Error('Lead sem telefone');

  const phone = lead.phone.replace(/\D/g, '');
  
  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER, // Ex: whatsapp:+14155238886
    to: `whatsapp:+55${phone}`,
    body: step.template
  });
}

async function sendEmail(step, schedule) {
  const leadDoc = await db.collection('prospector_prospects').doc(schedule.leadId).get();
  const lead = leadDoc.data();
  if (!lead?.email) throw new Error('Lead sem email');

  await sgMail.send({
    to: lead.email,
    from: process.env.SENDGRID_FROM_EMAIL, // Ex: noreply@servio.ai
    subject: step.subject || 'Mensagem da Servio.AI',
    text: step.template,
    html: `<p>${step.template.replace(/\n/g, '<br>')}</p>`
  });
}

async function createCallReminder(step, schedule) {
  // Criar notificação no Firestore para o prospector
  await db.collection('notifications').add({
    userId: schedule.prospectorId,
    type: 'call_reminder',
    leadId: schedule.leadId,
    leadName: schedule.leadName,
    message: step.template,
    createdAt: Firestore.Timestamp.now(),
    read: false
  });
}
```

### 2. Deploy Script

**Arquivo**: `backend/functions/package.json`

```json
{
  "name": "servio-followups",
  "version": "1.0.0",
  "main": "processFollowUps.js",
  "dependencies": {
    "@google-cloud/firestore": "^7.0.0",
    "@sendgrid/mail": "^8.0.0",
    "twilio": "^5.0.0"
  }
}
```

**Deploy Command** (PowerShell):
```powershell
# 1. Criar função no GCP
gcloud functions deploy processFollowUps `
  --gen2 `
  --runtime=nodejs20 `
  --region=us-west1 `
  --source=backend/functions `
  --entry-point=processFollowUps `
  --trigger-topic=send-followups `
  --set-env-vars="SENDGRID_API_KEY=...,TWILIO_ACCOUNT_SID=...,TWILIO_AUTH_TOKEN=...,TWILIO_WHATSAPP_NUMBER=...,SENDGRID_FROM_EMAIL=..."

# 2. Criar Cloud Scheduler job
gcloud scheduler jobs create pubsub send-followups-hourly `
  --location=us-west1 `
  --schedule="0 * * * *" `
  --topic=send-followups `
  --message-body='{"trigger":"scheduled"}'
```

### 3. Variáveis de Ambiente Necessárias

No Secret Manager ou env vars:
- `SENDGRID_API_KEY`: Chave da API SendGrid
- `SENDGRID_FROM_EMAIL`: Email verificado (ex: `noreply@servio.ai`)
- `TWILIO_ACCOUNT_SID`: SID da conta Twilio
- `TWILIO_AUTH_TOKEN`: Token de autenticação
- `TWILIO_WHATSAPP_NUMBER`: Número WhatsApp Business (ex: `whatsapp:+14155238886`)

## Custos Estimados (1000 leads/mês)

| Serviço | Uso | Custo/mês |
|---------|-----|-----------|
| Cloud Function | 720 invocações/mês + 2s/exec | $0.00 (free tier) |
| Cloud Scheduler | 720 jobs/mês | $0.10 |
| SendGrid | 3000 emails (média 3 per lead) | $14.95 (plan Essentials) |
| Twilio WhatsApp | 2000 msgs | $12.00 ($0.006/msg) |
| **TOTAL** | | **~$27/mês** |

## Monitoramento

### Logs (Cloud Logging)
```bash
gcloud logging read "resource.type=cloud_function AND resource.labels.function_name=processFollowUps" --limit 50
```

### Métricas (Cloud Monitoring)
- `cloud.googleapis.com/function/execution_count`: Total de execuções
- `cloud.googleapis.com/function/execution_times`: Latência
- Custom metric: `followup_steps_sent` (via OpenTelemetry)

### Alertas
- Execução falha 3x seguidas → email para DevOps
- Taxa de erro > 10% → Slack alert

## Rollout Plan

### Fase 1: Test (1 semana)
- Deploy em projeto de staging
- 10 leads fictícios com sequências curtas (D+0, D+1)
- Validar envio real de emails/WhatsApp

### Fase 2: Pilot (2 semanas)
- 50 leads reais (voluntários)
- Monitorar taxa de abertura, resposta, erros
- Ajustar templates conforme feedback

### Fase 3: Production (escalável)
- Rollout gradual: 10% → 50% → 100%
- Adicionar circuit breaker (pausar se taxa erro > 15%)
- Implementar retry com exponential backoff

## Próximos Passos

1. **Configurar contas**:
   - Criar conta SendGrid (free tier 100 emails/dia)
   - Criar conta Twilio + solicitar WhatsApp Business API

2. **Desenvolver função**:
   - Implementar `processFollowUps.js`
   - Adicionar testes unitários (mock Firestore, SendGrid, Twilio)

3. **Deploy staging**:
   - Criar projeto GCP staging
   - Deploy função + scheduler
   - Criar 10 followups de teste

4. **Validação**:
   - Verificar logs de execução
   - Confirmar recebimento de emails/WhatsApp
   - Validar atualização de `completed: true` no Firestore

5. **Production**:
   - Deploy em projeto production
   - Criar dashboard de monitoramento (Grafana/Looker)
   - Documentar runbook de troubleshooting

## Troubleshooting

### Problema: Função não executa
**Causa**: Cloud Scheduler não disparando  
**Fix**: Verificar `gcloud scheduler jobs list --location=us-west1`

### Problema: WhatsApp não envia
**Causa**: Número não aprovado no Twilio  
**Fix**: Seguir processo de aprovação Twilio WhatsApp Business

### Problema: Email vai para spam
**Causa**: Falta autenticação SPF/DKIM  
**Fix**: Configurar DNS records no SendGrid

---

**Status**: 📋 Design Completo | Implementação: Pendente  
**Estimativa**: 2-3 dias dev + 1 semana teste  
**Owner**: Backend Team
