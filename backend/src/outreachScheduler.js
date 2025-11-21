// Prospector follow-up outreach processing
// Scans Firestore collection 'prospector_outreach' for records eligible for WhatsApp follow-up.
// Eligibility: status === 'email_sent', optOut === false, whatsappSentAt === null, Date.now() >= followUpEligibleAt
// On success: updates status -> 'whatsapp_sent', sets whatsappSentAt.
// On failure: pushes error into errorHistory.

/**
 * Process pending outreach records.
 * @param {Object} deps
 * @param {import('firebase-admin').firestore.Firestore} deps.db Firestore instance
 * @param {(msg: string, phone?: string)=>Promise<{success:boolean}>} deps.sendWhatsApp Optional external sender fn
 * @returns {Promise<Array<{id:string,status:string,error?:string}>>}
 */
async function processPendingOutreach({ db, sendWhatsApp = defaultWhatsAppStub } = {}) {
  const coll = db.collection('prospector_outreach');
  const snap = await coll.get();
  const now = Date.now();
  const results = [];
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    if (data.status !== 'email_sent') continue;
    if (data.optOut) continue;
    if (data.whatsappSentAt) continue;
    if (typeof data.followUpEligibleAt !== 'number') continue;
    if (now < data.followUpEligibleAt) continue; // Not yet eligible

    try {
      // Simulate WhatsApp send (placeholder)
      const message = `Olá ${data.providerName}, acompanhando seu convite para conhecer a Servio.AI. Posso ajudar no cadastro?`;
      const sendRes = await sendWhatsApp(message, data.providerPhone);
      if (!sendRes.success) throw new Error('WhatsApp send failed');
      await coll.doc(doc.id).update({
        whatsappSentAt: Date.now(),
        status: 'whatsapp_sent'
      });
      results.push({ id: doc.id, status: 'whatsapp_sent' });
    } catch (err) {
      const errorMsg = err && err.message ? err.message : String(err);
      const history = Array.isArray(data.errorHistory) ? data.errorHistory.slice() : [];
      history.push({ at: Date.now(), error: errorMsg });
      await coll.doc(doc.id).update({ errorHistory: history });
      results.push({ id: doc.id, status: 'error', error: errorMsg });
    }
  }
  return results;
}

function defaultWhatsAppStub(message, phone) {
  // 85% simulated success
  const ok = Math.random() < 0.85;
  return Promise.resolve({ success: ok, phone, message });
}

module.exports = { processPendingOutreach };
