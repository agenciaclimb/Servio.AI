// Follow-up email scheduler entrypoint
// Invokes processDueEmails from followUpService so it can be run by Cloud Run Job or manual script.
// Usage (local): `node backend/src/followUpScheduler.js`
// Expects Firebase Admin credentials available via environment (Cloud Run service account or GOOGLE_APPLICATION_CREDENTIALS).

const admin = require('firebase-admin');
const gmailService = require('./gmailService');
const { processDueEmails } = require('./followUpService');

async function initAdmin() {
  if (!admin.apps || admin.apps.length === 0) {
    try { admin.initializeApp(); } catch (e) { console.warn('[followUpScheduler] Firebase init skipped:', e.message); }
  }
  return admin.firestore();
}

async function run() {
  const db = await initAdmin();
  console.log('[followUpScheduler] Starting processing at', new Date().toISOString());
  try {
    const res = await processDueEmails({ db, gmailService });
    console.log('[followUpScheduler] Completed', res);
  } catch (err) {
    console.error('[followUpScheduler] Error', err && err.message ? err.message : err);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  await run();
}

module.exports = { run };