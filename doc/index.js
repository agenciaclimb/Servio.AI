const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

/**
 * Triggered on the creation of a new proposal.
 * Fetches the related job and client to create a notification for the client.
 */
exports.notifyClientOnNewProposal = functions
  .region('us-west1') // Consistent with the project region
  .firestore.document('proposals/{proposalId}')
  .onCreate(async (snap, context) => {
    const newProposal = snap.data();

    try {
      // 1. Get the job to find the client's ID
      const jobRef = db.collection('jobs').doc(newProposal.jobId);
      const jobDoc = await jobRef.get();
      if (!jobDoc.exists) {
        console.error(`Job with ID ${newProposal.jobId} not found.`);
        return null;
      }
      const jobData = jobDoc.data();
      const clientId = jobData.clientId;

      // 2. Create the notification for the client
      const notificationRef = db.collection('notifications').doc();
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
      console.error('Error creating notification for new proposal:', error);
    }
    return null;
  });

/**
 * Triggered when a job is updated.
 * If a review is added, it notifies the provider.
 */
exports.notifyProviderOnNewReview = functions
  .region('us-west1')
  .firestore.document('jobs/{jobId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Check if 'review' field was added
    if (!beforeData.review && afterData.review) {
      try {
        const notificationRef = db.collection('notifications').doc();
        const notificationPayload = {
          id: notificationRef.id,
          userId: afterData.providerId,
          text: `Você recebeu uma nova avaliação de ${afterData.review.rating} estrelas para o serviço "${afterData.category}".`,
          isRead: false,
          createdAt: new Date().toISOString(),
          relatedJobId: context.params.jobId,
        };
        await notificationRef.set(notificationPayload);
        console.log(`Review notification sent to provider ${afterData.providerId}`);
      } catch (error) {
        console.error('Error creating new review notification:', error);
      }
    }
    return null;
  });
