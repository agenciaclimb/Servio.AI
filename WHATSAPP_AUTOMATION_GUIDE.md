## 🤖 WhatsApp Automation - Automações Necessárias

**Status:** 📋 Recommended Implementation  
**Date:** 2025-11-27  
**Version:** 1.0

---

## 🎯 Objetivo

Automatizar o envio de mensagens WhatsApp em eventos críticos do sistema, garantindo comunicação proativa com usuários em tempo real.

---

## 📋 Automações Recomendadas

### 1️⃣ CLIENTE - Job Posted (Automática)

**Quando:** Um cliente publica um novo job

**Trigger:** Firestore trigger on `jobs` collection

```javascript
exports.notifyClientJobPosted = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async snap => {
    const job = snap.data();

    if (job.status === 'ativo') {
      await axios.post('https://api.servio.ai/api/whatsapp/multi-role/client/job-posted', {
        phone: job.clientPhone,
        jobTitle: job.title,
        jobDescription: job.description,
        jobLocation: job.location,
        link: `https://servio.ai/jobs/${snap.id}`,
      });
    }
  });
```

### 2️⃣ CLIENTE - Proposal Received (Automática)

**Quando:** Nova proposta é recebida

**Trigger:** Firestore trigger on `proposals` collection

```javascript
exports.notifyClientProposalReceived = functions.firestore
  .document('proposals/{proposalId}')
  .onCreate(async snap => {
    const proposal = snap.data();
    const job = await admin.firestore().collection('jobs').doc(proposal.jobId).get();

    await axios.post('https://api.servio.ai/api/whatsapp/multi-role/client/proposal-received', {
      phone: job.data().clientPhone,
      providerName: proposal.providerName,
      amount: proposal.amount,
      rating: proposal.providerRating,
      link: `https://servio.ai/proposals/${snap.id}`,
    });
  });
```

### 3️⃣ CLIENTE - Job Completed (Automática)

**Quando:** Job é marcado como concluído

**Trigger:** Firestore update on jobs.status = 'concluido'

```javascript
exports.notifyClientJobCompleted = functions.firestore
  .document('jobs/{jobId}')
  .onUpdate(async change => {
    const oldStatus = change.before.data().status;
    const newStatus = change.after.data().status;

    if (oldStatus !== 'concluido' && newStatus === 'concluido') {
      const job = change.after.data();

      await axios.post('https://api.servio.ai/api/whatsapp/multi-role/client/job-completed', {
        phone: job.clientPhone,
        jobTitle: job.title,
        link: `https://servio.ai/payment/${change.after.id}`,
      });
    }
  });
```

### 4️⃣ CLIENTE - Payment Reminder (Agendada)

**Quando:** Job concluído > 24 horas sem pagamento

**Trigger:** Cloud Scheduler (daily)

```javascript
exports.reminderPaymentCliente = functions.pubsub.schedule('every 6 hours').onRun(async context => {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const jobs = await admin
    .firestore()
    .collection('jobs')
    .where('status', '==', 'concluido')
    .where('paymentCompletedAt', '<', dayAgo)
    .get();

  for (const job of jobs.docs) {
    const data = job.data();
    await axios.post('https://api.servio.ai/api/whatsapp/multi-role/client/payment-reminder', {
      phone: data.clientPhone,
      amount: data.totalAmount,
      providerName: data.providerName,
      link: `https://servio.ai/payment/${job.id}`,
    });
  }
});
```

---

### 5️⃣ PRESTADOR - New Job Available (Automática)

**Quando:** Novo job é publicado na categoria do prestador

**Trigger:** Firestore trigger on `jobs` collection

```javascript
exports.notifyProviderNewJob = functions.firestore.document('jobs/{jobId}').onCreate(async snap => {
  const job = snap.data();

  // Encontrar prestadores que trabalham com essa categoria
  const providers = await admin
    .firestore()
    .collection('users')
    .where('type', '==', 'prestador')
    .where('categories', 'array-contains', job.category)
    .where('status', '==', 'ativo')
    .get();

  for (const provider of providers.docs) {
    const pData = provider.data();
    if (pData.notificationsEnabled && pData.phone) {
      await axios.post('https://api.servio.ai/api/whatsapp/multi-role/provider/new-job', {
        phone: pData.phone,
        category: job.category,
        location: job.location,
        budget: job.budget,
        link: `https://servio.ai/jobs/${snap.id}`,
      });
    }
  }
});
```

### 6️⃣ PRESTADOR - Payment Received (Automática)

**Quando:** Pagamento for processado

**Trigger:** Stripe webhook + Firestore update

```javascript
exports.notifyProviderPaymentReceived = functions.firestore
  .document('payments/{paymentId}')
  .onCreate(async snap => {
    const payment = snap.data();

    if (payment.status === 'succeeded') {
      const job = await admin.firestore().collection('jobs').doc(payment.jobId).get();

      const provider = await admin.firestore().collection('users').doc(job.data().providerId).get();

      await axios.post('https://api.servio.ai/api/whatsapp/multi-role/provider/payment-received', {
        phone: provider.data().phone,
        amount: payment.amount,
        jobTitle: job.data().title,
        date: new Date(payment.createdAt).toLocaleDateString('pt-BR'),
        link: 'https://servio.ai/account/payments',
      });
    }
  });
```

---

### 7️⃣ PROSPECTOR - Commission Earned (Automática)

**Quando:** Novo recrutamento confirmado (novo usuário se cadastra via referral link)

**Trigger:** Firestore trigger on `users` collection (new user with referralCode)

```javascript
exports.notifyProspectorCommissionEarned = functions.firestore
  .document('users/{userId}')
  .onCreate(async snap => {
    const user = snap.data();

    if (user.referralCode && user.type === 'prestador') {
      // Encontrar prospector
      const prospector = await admin
        .firestore()
        .collection('users')
        .where('referralCode', '==', user.referralCode)
        .where('type', '==', 'prospector')
        .limit(1)
        .get();

      if (!prospector.empty) {
        const pData = prospector.docs[0].data();
        const commission = calculateCommission(user); // função helper

        await axios.post(
          'https://api.servio.ai/api/whatsapp/multi-role/prospector/commission-earned',
          {
            phone: pData.phone,
            amount: commission.toFixed(2),
            reason: `Recrutamento de ${user.name}`,
            monthlyTotal: pData.monthlyCommissions,
            link: 'https://servio.ai/prospector/commissions',
          }
        );
      }
    }
  });
```

### 8️⃣ PROSPECTOR - Badge Unlocked (Automática)

**Quando:** Prospector atinge critério de badge

**Trigger:** Firestore update on prospectors.badges

```javascript
exports.notifyProspectorBadgeUnlocked = functions.firestore
  .document('prospectors/{prospectorId}')
  .onUpdate(async change => {
    const oldBadges = change.before.data().badges || [];
    const newBadges = change.after.data().badges || [];

    const newBadge = newBadges.find(b => !oldBadges.find(ob => ob.name === b.name));

    if (newBadge) {
      const prospector = change.after.data();

      await axios.post('https://api.servio.ai/api/whatsapp/multi-role/prospector/badge-unlocked', {
        phone: prospector.phone,
        badgeName: newBadge.name,
        description: newBadge.description,
        link: 'https://servio.ai/prospector/badges',
      });
    }
  });
```

### 9️⃣ PROSPECTOR - Lead Reminder (Agendada)

**Quando:** Lead não foi contatado por 3+ dias

**Trigger:** Cloud Scheduler (every 2 hours)

```javascript
exports.reminderProspectorLeadFollowUp = functions.pubsub
  .schedule('every 2 hours')
  .onRun(async context => {
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

    const leads = await admin
      .firestore()
      .collectionGroup('leads')
      .where('status', '==', 'new')
      .where('lastContactedAt', '<', threeDaysAgo)
      .get();

    for (const lead of leads.docs) {
      const prospectorId = lead.ref.parent.parent.id;
      const prospector = await admin.firestore().collection('users').doc(prospectorId).get();

      const daysSince = Math.floor((now - lead.data().lastContactedAt) / (24 * 60 * 60 * 1000));

      await axios.post('https://api.servio.ai/api/whatsapp/multi-role/prospector/lead-reminder', {
        phone: prospector.data().phone,
        leadName: lead.data().name,
        daysSince: daysSince,
        link: `https://servio.ai/prospector/crm`,
      });
    }
  });
```

---

### 🔟 ADMIN - System Alert (Automática)

**Quando:** Taxa de erro > threshold ou falha crítica

**Trigger:** Cloud Monitoring alert

```javascript
exports.notifyAdminSystemAlert = functions.pubsub
  .topic('system-alerts')
  .onPublish(async message => {
    const alert = JSON.parse(Buffer.from(message.data, 'base64').toString());

    // Notify all admins
    const admins = await admin
      .firestore()
      .collection('users')
      .where('type', '==', 'admin')
      .where('phone', '!=', null)
      .get();

    for (const admin_user of admins.docs) {
      await axios.post('https://api.servio.ai/api/whatsapp/multi-role/admin/system-alert', {
        phone: admin_user.data().phone,
        alertType: alert.type,
        severity: alert.severity,
        description: alert.description,
        link: `https://admin.servio.ai/alerts`,
      });
    }
  });
```

### 1️⃣1️⃣ ADMIN - Dispute Escalation (Automática)

**Quando:** Disputa é escalada (não resolvida em 24h)

**Trigger:** Firestore update on disputes.escalatedAt

```javascript
exports.notifyAdminDisputeEscalation = functions.firestore
  .document('disputes/{disputeId}')
  .onUpdate(async change => {
    const oldEscalated = change.before.data().escalated;
    const newEscalated = change.after.data().escalated;

    if (!oldEscalated && newEscalated) {
      const dispute = change.after.data();

      // Notify admins
      const admins = await admin
        .firestore()
        .collection('users')
        .where('type', '==', 'admin')
        .where('phone', '!=', null)
        .get();

      for (const admin_user of admins.docs) {
        await axios.post('https://api.servio.ai/api/whatsapp/multi-role/admin/dispute-escalation', {
          phone: admin_user.data().phone,
          jobTitle: dispute.jobTitle,
          reason: dispute.reason,
          clientName: dispute.clientName,
          providerName: dispute.providerName,
          link: `https://admin.servio.ai/disputes/${change.id}`,
        });
      }
    }
  });
```

### 1️⃣2️⃣ ADMIN - Daily Report (Agendada)

**Quando:** Todo dia às 8h da manhã (São Paulo)

**Trigger:** Cloud Scheduler

```javascript
exports.dailyReportAdmin = functions.pubsub
  .schedule('0 8 * * *') // 8h São Paulo = 11h UTC
  .timeZone('America/Sao_Paulo')
  .onRun(async context => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Buscar métricas
    const jobsCreated = await admin
      .firestore()
      .collection('jobs')
      .where('createdAt', '>=', yesterday)
      .get();

    const proposals = await admin
      .firestore()
      .collection('proposals')
      .where('createdAt', '>=', yesterday)
      .get();

    const recruits = await admin
      .firestore()
      .collection('users')
      .where('type', '==', 'prestador')
      .where('createdAt', '>=', yesterday)
      .get();

    // Calcular receita
    const payments = await admin
      .firestore()
      .collection('payments')
      .where('status', '==', 'succeeded')
      .where('createdAt', '>=', yesterday)
      .get();

    const revenue = payments.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

    // Notify all admins
    const admins = await admin
      .firestore()
      .collection('users')
      .where('type', '==', 'admin')
      .where('phone', '!=', null)
      .get();

    for (const admin_user of admins.docs) {
      await axios.post('https://api.servio.ai/api/whatsapp/multi-role/admin/daily-report', {
        phone: admin_user.data().phone,
        jobsCreated: jobsCreated.size,
        proposals: proposals.size,
        recruits: recruits.size,
        revenue: revenue.toFixed(2),
        link: `https://admin.servio.ai/reports`,
      });
    }
  });
```

---

## 📋 Checklist de Implementação

### Fase 1: Setup Base (1 dia)

- [ ] Criar `functions/index.js`
- [ ] Setup Firebase Cloud Functions SDK
- [ ] Deploy functions básicas (notifyClientJobPosted, etc)
- [ ] Testar triggers localmente

### Fase 2: Automações Completas (2 dias)

- [ ] Implementar todas as 12 automações
- [ ] Cloud Scheduler setup
- [ ] Monitoring alerts
- [ ] Error handling

### Fase 3: Testes (1 dia)

- [ ] Teste funcional de cada automação
- [ ] Teste de volume (múltiplos usuários)
- [ ] Teste de rate limiting
- [ ] Teste de fallback

---

## 🔐 Boas Práticas

1. **Idempotência**

   ```javascript
   // Verificar se mensagem já foi enviada
   const existing = await admin
     .firestore()
     .collection('whatsapp_messages')
     .where('jobId', '==', jobId)
     .where('type', '==', 'job_posted')
     .limit(1)
     .get();

   if (!existing.empty) {
     return; // Já enviada
   }
   ```

2. **Rate Limiting**

   ```javascript
   // Máximo 10 mensagens por segundo
   const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

   for (const user of users) {
     await sendMessage(user);
     await delay(100); // 10msg/segundo
   }
   ```

3. **Erro Handling**
   ```javascript
   try {
     const result = await whatsappApi.send(...);
     await admin.firestore()
       .collection('whatsapp_messages')
       .add({
         ...result,
         timestamp: admin.firestore.FieldValue.serverTimestamp()
       });
   } catch (error) {
     logger.error('WhatsApp send failed:', error);
     // Retry logic ou notificação de erro
   }
   ```

---

## 📊 Monitoramento

```javascript
// Cloud Monitoring - Custom Metric
const monitoring = new monitoring.MetricServiceClient();

await monitoring.createTimeSeries({
  name: monitoring.projectPath(projectId),
  timeSeries: [
    {
      metric: {
        type: 'custom.googleapis.com/whatsapp/messages_sent',
        labels: {
          user_type: 'cliente',
          message_type: 'job_posted',
        },
      },
      points: [
        {
          interval: {
            endTime: { seconds: Math.floor(Date.now() / 1000) },
          },
          value: { int64Value: 1 },
        },
      ],
    },
  ],
});
```

---

## 🎯 KPIs para Acompanhar

- **Delivery Rate:** % de mensagens entregues com sucesso
- **Response Time:** Tempo até resposta do usuário
- **Error Rate:** % de falhas
- **Volume:** Mensagens/hora por tipo
- **User Engagement:** % que abrem/respondem

---

**Status:** 📋 Ready for Implementation  
**Priority:** HIGH (fundamental para UX)  
**Complexity:** MEDIUM  
**Time Estimate:** 4-5 days
