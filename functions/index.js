const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function: Notify users when a new message is sent
 * 
 * Triggered by: Firestore onCreate on /messages/{messageId}
 * 
 * Actions:
 * 1. Get message data
 * 2. Determine recipient (if sender is client, notify provider, and vice versa)
 * 3. Create notification in Firestore
 * 4. (Future) Send push notification
 */
exports.notifyOnNewMessage = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const messageId = context.params.messageId;

    console.log(`New message created: ${messageId}`, message);

    try {
      // Get job details to find the other participant
      const jobRef = db.collection('jobs').doc(message.chatId);
      const jobDoc = await jobRef.get();

      if (!jobDoc.exists) {
        console.log(`Job not found: ${message.chatId}`);
        return null;
      }

      const job = jobDoc.data();
      
      // Determine recipient (opposite of sender)
      let recipientId;
      if (message.senderId === job.clientId) {
        recipientId = job.providerId;
      } else if (message.senderId === job.providerId) {
        recipientId = job.clientId;
      } else {
        console.log(`Sender ${message.senderId} not part of job ${message.chatId}`);
        return null;
      }

      // Skip notification for system messages or if no recipient
      if (message.senderType === 'system' || !recipientId) {
        console.log('Skipping notification for system message or no recipient');
        return null;
      }

      // Create notification in Firestore
      const notification = {
        userId: recipientId,
        text: `Nova mensagem sobre "${job.category}": ${message.text.substring(0, 50)}...`,
        type: 'new_message',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          jobId: message.chatId,
          messageId: messageId,
          senderId: message.senderId,
        }
      };

      await db.collection('notifications').add(notification);
      
      console.log(`Notification created for user ${recipientId}`);

      // TODO: Send push notification via FCM
      // const userDoc = await db.collection('users').doc(recipientId).get();
      // if (userDoc.exists && userDoc.data().fcmToken) {
      //   await admin.messaging().send({
      //     token: userDoc.data().fcmToken,
      //     notification: {
      //       title: 'Nova Mensagem',
      //       body: notification.text,
      //     }
      //   });
      // }

      return null;
    } catch (error) {
      console.error('Error in notifyOnNewMessage:', error);
      return null;
    }
  });

/**
 * Cloud Function: Calculate provider commission rate dynamically
 * 
 * Triggered by: Firestore onUpdate on /users/{userId} when provider completes a job
 * 
 * Actions:
 * 1. Detect if user is a provider
 * 2. Fetch completed jobs stats
 * 3. Calculate dynamic commission rate (75-85%)
 * 4. Update user.providerRate field
 * 
 * Rate factors:
 * - Base: 75%
 * - +2% Profile complete (headline + verified)
 * - +2% High rating (4.8+)
 * - +3% Volume tier (revenue tiers)
 * - +1% Low dispute rate (<5%)
 * - Cap: 85%
 */
exports.updateProviderRate = functions.firestore
  .document('jobs/{jobId}')
  .onUpdate(async (change, context) => {
    const jobBefore = change.before.data();
    const jobAfter = change.after.data();

    // Only run when job becomes 'concluido'
    if (jobBefore.status !== 'concluido' && jobAfter.status === 'concluido') {
      const providerId = jobAfter.providerId;
      
      if (!providerId) {
        console.log('No provider for this job');
        return null;
      }

      try {
        console.log(`Recalculating rate for provider: ${providerId}`);

        // Fetch provider profile
        const providerDoc = await db.collection('users').doc(providerId).get();
        if (!providerDoc.exists) {
          console.log(`Provider not found: ${providerId}`);
          return null;
        }

        const provider = providerDoc.data();

        // Fetch all completed jobs for this provider
        const completedJobsSnapshot = await db.collection('jobs')
          .where('providerId', '==', providerId)
          .where('status', '==', 'concluido')
          .get();

        const completedJobs = [];
        completedJobsSnapshot.forEach(doc => {
          completedJobs.push({ id: doc.id, ...doc.data() });
        });

        // Calculate stats
        const totalJobs = completedJobs.length;
        const totalRevenue = completedJobs.reduce((sum, job) => {
          return sum + (job.earnings?.providerShare || job.fixedPrice || 0);
        }, 0);

        const ratings = completedJobs
          .filter(job => job.review?.rating)
          .map(job => job.review.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
          : 0;

        // Count disputes
        const disputesSnapshot = await db.collection('disputes')
          .where('providerId', '==', providerId)
          .get();
        const totalDisputes = disputesSnapshot.size;

        // Calculate commission rate
        const stats = {
          totalJobs,
          totalRevenue,
          averageRating,
          totalDisputes,
        };

        const earningsProfile = calculateProviderRate(provider, stats);

        // Update provider's commission rate
        await db.collection('users').doc(providerId).update({
          providerRate: earningsProfile.currentRate,
          rateTier: earningsProfile.tier,
          rateLastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Updated rate for ${providerId}: ${earningsProfile.currentRate} (${earningsProfile.tier})`);

        return null;
      } catch (error) {
        console.error('Error in updateProviderRate:', error);
        return null;
      }
    }

    return null;
  });

/**
 * Helper function: Calculate provider commission rate
 * Same logic as backend/src/index.js
 */
function calculateProviderRate(provider = {}, stats = {}) {
  const baseRate = 0.75;

  const headline = (provider.headline || '').trim();
  const verificationStatus = provider.verificationStatus || 'pendente';
  const totalJobs = Number(stats.totalJobs || 0);
  const averageRating = Number(stats.averageRating || 0);
  const totalRevenue = Number(stats.totalRevenue || 0);
  const totalDisputes = Number(stats.totalDisputes || 0);

  // Bonuses
  const profileComplete = headline && verificationStatus === 'verificado' ? 0.02 : 0;
  const highRating = averageRating >= 4.8 ? 0.02 : 0;
  const volumeTier = totalRevenue >= 11000 ? 0.03 : totalRevenue >= 6000 ? 0.02 : totalRevenue >= 1500 ? 0.01 : 0;
  const lowDisputeRate = totalJobs > 0 && totalDisputes / totalJobs < 0.05 ? 0.01 : 0;

  let rate = baseRate + profileComplete + highRating + volumeTier + lowDisputeRate;
  rate = Math.min(0.85, rate); // Cap at 85%

  const tier = highRating && profileComplete && volumeTier >= 0.02 && lowDisputeRate > 0 ? 'Ouro' : 'Bronze';

  return {
    currentRate: Number(rate.toFixed(2)),
    bonuses: { profileComplete, highRating, volumeTier, lowDisputeRate },
    tier,
  };
}

/**
 * Cloud Function: Clean up old notifications
 * 
 * Triggered by: Pub/Sub scheduled (daily at 2am)
 * 
 * Actions:
 * 1. Find notifications older than 30 days
 * 2. Delete them in batches
 */
exports.cleanupOldNotifications = functions.pubsub
  .schedule('0 2 * * *') // Every day at 2am
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('Starting cleanup of old notifications...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldNotificationsSnapshot = await db.collection('notifications')
        .where('createdAt', '<', thirtyDaysAgo)
        .limit(500) // Batch limit
        .get();

      if (oldNotificationsSnapshot.empty) {
        console.log('No old notifications to delete');
        return null;
      }

      const batch = db.batch();
      oldNotificationsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${oldNotificationsSnapshot.size} old notifications`);

      return null;
    } catch (error) {
      console.error('Error in cleanupOldNotifications:', error);
      return null;
    }
  });
