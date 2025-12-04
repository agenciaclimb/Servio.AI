const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

/**
 * Triggered on the creation of a new proposal.
 * Fetches the related job and client to create a notification for the client.
 */
exports.notifyClientOnNewProposal = functions
  .region("us-west1") // Consistent with the project region
  .firestore.document("proposals/{proposalId}")
  .onCreate(async (snap, context) => {
    const newProposal = snap.data();

    try {
      // 1. Get the job to find the client's ID
      const jobRef = db.collection("jobs").doc(newProposal.jobId);
      const jobDoc = await jobRef.get();
      if (!jobDoc.exists) {
        console.error(`Job with ID ${newProposal.jobId} not found.`);
        return null;
      }
      const jobData = jobDoc.data();
      const clientId = jobData.clientId;

      // 2. Create the notification for the client
      const notificationRef = db.collection("notifications").doc();
      const notificationPayload = {
        id: notificationRef.id,
        userId: clientId,
        text: `Você recebeu uma nova proposta para o job "${jobData.category}".`,
        isRead: false,
        createdAt: new Date().toISOString(),
        relatedJobId: newProposal.jobId,
      };

      await notificationRef.set(notificationPayload);
      console.log(`Notification created for user ${clientId} for job ${newProposal.jobId}`);
    } catch (error) {
      console.error("Error creating notification for new proposal:", error);
    }
    return null;
  });

/**
 * Triggered when a provider is verified.
 * Generates and saves SEO content for their public profile.
 */
exports.generateSeoOnVerification = functions
  .region("us-west1")
  .firestore.document("users/{userId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Trigger only when a provider's status changes to 'verificado'
    if (afterData.type === 'prestador' && beforeData.verificationStatus !== 'verificado' && afterData.verificationStatus === 'verificado') {
      try {
        // Call our own AI service to generate SEO content
        const response = await fetch('http://localhost:8080/api/generate-seo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: afterData }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate SEO content from API.');
        }

        const seoData = await response.json();

        // Save the generated SEO data back to the user's profile
        await change.after.ref.update({ seo: seoData });

        console.log(`SEO content generated and saved for provider ${context.params.userId}`);
      } catch (error) {
        console.error("Error generating SEO content:", error);
      }
    }
    return null;
  });

/**
 * HTTPS Scheduler endpoint: executa follow-ups automáticos
 * Protegido por header "x-servio-scheduler-token".
 */
exports.prospectorRunScheduler = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
      const tokenHeader = req.headers['x-servio-scheduler-token'];
      const configured = (functions.config().servio && functions.config().servio.scheduler_token) || process.env.SERVIO_SCHEDULER_TOKEN;
      if (!configured || tokenHeader !== configured) return res.status(401).send('Unauthorized');

      const now = admin.firestore.Timestamp.now();
      const limit = Math.min(parseInt(req.query.limit) || 50, 200);

      const q = db.collection('prospector_prospects')
        .where('nextFollowUpAt', '<=', now)
        .limit(limit);

      const snapshot = await q.get();
      const processed = [];
      for (const docSnap of snapshot.docs) {
        const lead = docSnap.data();
        const next = admin.firestore.Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);
        const newActivity = {
          type: 'follow_up',
          description: 'Follow-up automático executado (scheduler)',
          timestamp: admin.firestore.Timestamp.now()
        };
        await docSnap.ref.update({
          lastActivity: admin.firestore.Timestamp.now(),
          nextFollowUpAt: next,
          activities: [...(lead.activities || []), newActivity]
        });
        processed.push(docSnap.id);
      }

      return res.status(200).json({ ok: true, count: processed.length, processed });
    } catch (err) {
      console.error('prospectorRunScheduler error:', err);
      return res.status(500).json({ ok: false, error: String(err) });
    }
  });