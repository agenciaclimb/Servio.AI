/**
 * Follow-up Email Scheduling Service
 *
 * Collection: prospector_followups
 * Document schema:
 * {
 *   id: string,
 *   prospectorId: string,
 *   prospectName: string,
 *   prospectEmail: string,
 *   referralLink?: string,
 *   createdAt: number (ms),
 *   paused: boolean,
 *   optOut: boolean,
 *   steps: [
 *     { key: 'day0'|'day2'|'day5'|'day10', scheduledAt: number(ms), sentAt: number|null, status: 'pending'|'sent'|'skipped' }
 *   ]
 * }
 *
 * Collection: prospector_email_logs
 * { id, prospectorId, scheduleId, stepKey, sentAt, email, success }
 */

const STEP_DEFS = [
  { key: 'day0', offsetDays: 0, template: 'invite' },
  { key: 'day2', offsetDays: 2, template: 'followup' },
  { key: 'day5', offsetDays: 5, template: 'followup2' },
  { key: 'day10', offsetDays: 10, template: 'final' }
];

function ms(days) { return days * 24 * 60 * 60 * 1000; }

/** Create schedule */
async function createFollowUpSchedule({ db, prospectorId, prospectName, prospectEmail, referralLink }) {
  const coll = db.collection('prospector_followups');
  const now = Date.now();
  const ref = coll.doc();
  const steps = STEP_DEFS.map(def => ({
    key: def.key,
    scheduledAt: now + ms(def.offsetDays),
    sentAt: null,
    status: 'pending',
    template: def.template
  }));
  const doc = {
    id: ref.id,
    prospectorId,
    prospectName,
    prospectEmail: prospectEmail.toLowerCase(),
    referralLink: referralLink || null,
    createdAt: now,
    paused: false,
    optOut: false,
    steps
  };
  await ref.set(doc);
  return doc;
}

/** List schedules */
async function listSchedules({ db, prospectorId }) {
  const snap = await db.collection('prospector_followups')
    .where('prospectorId','==', prospectorId).get();
  return snap.docs.map(d => d.data());
}

/** Pause schedule */
async function pauseSchedule({ db, scheduleId }) {
  const ref = db.collection('prospector_followups').doc(scheduleId);
  await ref.update({ paused: true });
  return (await ref.get()).data();
}

/** Resume schedule */
async function resumeSchedule({ db, scheduleId }) {
  const ref = db.collection('prospector_followups').doc(scheduleId);
  await ref.update({ paused: false });
  return (await ref.get()).data();
}

/** Opt-out schedule */
async function optOutSchedule({ db, scheduleId }) {
  const ref = db.collection('prospector_followups').doc(scheduleId);
  await ref.update({ optOut: true, paused: true });
  return (await ref.get()).data();
}

/** Internal: rate limit (max 10 emails/hour per prospector) */
async function isRateLimited({ db, prospectorId }) {
  const oneHourAgo = Date.now() - 60*60*1000;
  const snap = await db.collection('prospector_email_logs')
    .where('prospectorId','==', prospectorId)
    .where('sentAt','>', oneHourAgo)
    .get();
  return snap.size >= 10;
}

/** Determine due steps */
async function getDueSteps({ db, now = Date.now() }) {
  const snap = await db.collection('prospector_followups').get();
  const due = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.paused || data.optOut) continue;
    for (const step of data.steps) {
      if (!step.sentAt && step.status === 'pending' && step.scheduledAt <= now) {
        due.push({ schedule: data, step });
      }
    }
  }
  return due;
}

/** Send email for a step */
async function sendEmailForStep({ gmailService, schedule, step }) {
  const { prospectName, prospectEmail, referralLink } = schedule;
  let result;
  try {
    if (step.key === 'day0') {
      // Treat as invite to prospect (use generic sendEmail)
      const subject = `Convite Servio.AI - ${prospectName}`;
      const html = `<p>Olá ${prospectName},</p><p>Você foi convidado a conhecer a Servio.AI - plataforma inteligente de serviços.</p><p>Cadastre-se: <a href="${referralLink || 'https://servio-ai.com'}">${referralLink || 'https://servio-ai.com'}</a></p>`;
      result = await gmailService.sendEmail({ to: prospectEmail, subject, html, text: html.replaceAll(/<[^>]+>/g,'') });
    } else {
      // Follow-up reminder to prospector (internal) optional extension
      const subject = `Follow-up pendente: ${prospectName}`;
      const html = `<p>Lembrete de follow-up (Etapa ${step.key}). Prospect: <strong>${prospectName}</strong>.</p>`;
      result = await gmailService.sendEmail({ to: prospectEmail, subject, html, text: html.replaceAll(/<[^>]+>/g,'') });
    }
  } catch (err) {
    return { success:false, error: err.message };
  }
  return { success:true, messageId: result.messageId };
}

/** Mark step as sent + log */
async function markStepSent({ db, schedule, step, sendRes }) {
  const ref = db.collection('prospector_followups').doc(schedule.id);
  const newSteps = schedule.steps.map(s => s.key === step.key ? { ...s, sentAt: Date.now(), status: sendRes.success ? 'sent' : 'skipped' } : s);
  await ref.update({ steps: newSteps });
  // log
  const logRef = db.collection('prospector_email_logs').doc();
  await logRef.set({
    id: logRef.id,
    prospectorId: schedule.prospectorId,
    scheduleId: schedule.id,
    stepKey: step.key,
    sentAt: Date.now(),
    email: schedule.prospectEmail,
    success: sendRes.success
  });
}

/** Process due emails */
async function processDueEmails({ db, gmailService }) {
  const due = await getDueSteps({ db });
  let processed = 0, sent = 0;
  for (const item of due) {
    processed++;
    if (await isRateLimited({ db, prospectorId: item.schedule.prospectorId })) continue;
    const res = await sendEmailForStep({ gmailService, schedule: item.schedule, step: item.step });
    await markStepSent({ db, schedule: item.schedule, step: item.step, sendRes: res });
    if (res.success) sent++;
  }
  return { processed, sent };
}

module.exports = {
  createFollowUpSchedule,
  listSchedules,
  pauseSchedule,
  resumeSchedule,
  optOutSchedule,
  processDueEmails,
  isRateLimited
};
