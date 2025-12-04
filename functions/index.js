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
 * 4. Send push notification via FCM
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

      // Send push notification via FCM if token exists
      const userDoc = await db.collection('users').doc(recipientId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;
        const prefs = userData.notificationPreferences || {};
        
        // Check if user wants new message notifications (default: true)
        if (fcmToken && (prefs.newMessage !== false)) {
          try {
            await admin.messaging().send({
              token: fcmToken,
              notification: {
                title: 'Nova Mensagem no Servio.AI',
                body: notification.text,
              },
              webpush: {
                fcmOptions: {
                  link: `${process.env.APP_URL || 'https://servio.ai'}/dashboard`,
                },
              },
            });
            console.log(`FCM push sent to ${recipientId}`);
          } catch (fcmError) {
            console.warn(`Failed to send FCM to ${recipientId}:`, fcmError);
            // If token is invalid, remove it
            if (fcmError.code === 'messaging/registration-token-not-registered') {
              await db.collection('users').doc(recipientId).update({ fcmToken: admin.firestore.FieldValue.delete() });
              console.log(`Removed invalid FCM token for ${recipientId}`);
            }
          }
        }
      }

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

/**
 * Cloud Function: Omnichannel Webhook Handler
 * 
 * Triggered by: HTTP POST from Meta (WhatsApp, Instagram, Facebook)
 * 
 * Endpoints:
 * - ?channel=whatsapp
 * - ?channel=instagram
 * - ?channel=facebook
 * 
 * Actions:
 * 1. Validate webhook signature (HMAC SHA-256)
 * 2. Normalize message payload
 * 3. Check for duplicates
 * 4. Persist to Firestore (messages, conversations)
 * 5. Trigger IA Central (Gemini) for response
 * 6. Send response back to channel
 */
exports.omnichannelWebhook = functions.https.onRequest(async (req, res) => {
  const crypto = require('crypto');
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const axios = require('axios');
  
  const channel = req.query.channel;

  if (!channel) {
    return res.status(400).send('Missing channel parameter');
  }

  // Verificação de webhook (Meta)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === functions.config().omni?.webhook_secret) {
      console.log(`[Omni ${channel}] Webhook verificado`);
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // Processamento de mensagens (POST)
  if (req.method === 'POST') {
    try {
      // Validar assinatura (Meta)
      if (channel === 'whatsapp' || channel === 'instagram' || channel === 'facebook') {
        const signature = req.headers['x-hub-signature-256'];
        if (signature) {
          const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', functions.config().omni?.meta_secret || '')
            .update(req.rawBody)
            .digest('hex');
          
          if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            console.error('[Omni Webhook] Assinatura inválida');
            return res.status(403).send('Invalid signature');
          }
        }
      }

      const { entry } = req.body;
      if (!entry) {
        return res.sendStatus(200);
      }

      // Processar mensagens
      for (const item of entry) {
        if (channel === 'whatsapp') {
          await processWhatsAppEntry(item);
        } else if (channel === 'instagram' || channel === 'facebook') {
          await processSocialEntry(item, channel);
        }
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('[Omni Webhook] Erro:', error);
      res.sendStatus(500);
    }
  } else {
    res.status(405).send('Method not allowed');
  }

  // Helper functions
  async function processWhatsAppEntry(entry) {
    const changes = entry.changes || [];
    
    for (const change of changes) {
      const value = change.value;
      if (!value.messages) continue;

      for (const message of value.messages) {
        const normalized = {
          messageId: message.id,
          conversationId: `wa_${message.from}`,
          channel: 'whatsapp',
          sender: message.from,
          senderType: null,
          text: message.text?.body || message.interactive?.button_reply?.title || '',
          timestamp: admin.firestore.Timestamp.fromMillis(parseInt(message.timestamp) * 1000),
          metadata: {
            phone_number_id: value.metadata.phone_number_id
          },
          createdAt: admin.firestore.Timestamp.now()
        };
        
        if (await isDuplicate(normalized.messageId)) continue;
        
        await saveMessage(normalized);
        triggerOmniIA(normalized).catch(err => console.error('[Omni WA] Erro IA:', err));
      }
    }
  }

  async function processSocialEntry(entry, channelType) {
    const messaging = entry.messaging || [];
    
    for (const event of messaging) {
      if (!event.message) continue;

      const normalized = {
        messageId: event.message.mid,
        conversationId: `${channelType}_${event.sender.id}`,
        channel: channelType,
        sender: event.sender.id,
        senderType: null,
        text: event.message.text || '',
        timestamp: admin.firestore.Timestamp.fromMillis(event.timestamp),
        metadata: { recipient_id: event.recipient.id },
        createdAt: admin.firestore.Timestamp.now()
      };
      
      if (await isDuplicate(normalized.messageId)) continue;
      
      await saveMessage(normalized);
      triggerOmniIA(normalized).catch(err => console.error(`[Omni ${channelType}] Erro IA:`, err));
    }
  }

  async function isDuplicate(messageId) {
    const doc = await db.collection('messages').doc(messageId).get();
    return doc.exists;
  }

  async function saveMessage(normalized) {
    await db.collection('messages').doc(normalized.messageId).set(normalized);
    
    await db.collection('conversations').doc(normalized.conversationId).set({
      channel: normalized.channel,
      participants: [normalized.sender, 'omni_ia'],
      userType: normalized.senderType,
      lastMessage: normalized.text,
      lastMessageAt: normalized.timestamp,
      lastMessageSender: normalized.sender,
      status: 'active',
      updatedAt: admin.firestore.Timestamp.now()
    }, { merge: true });
  }

  async function triggerOmniIA(normalized) {
    const userType = await identifyUserType(normalized.sender, normalized.channel);
    
    await db.collection('messages').doc(normalized.messageId).update({ senderType: userType });
    await db.collection('conversations').doc(normalized.conversationId).update({ userType });

    const historySnapshot = await db.collection('messages')
      .where('conversationId', '==', normalized.conversationId)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const history = historySnapshot.docs.reverse().map(doc => {
      const data = doc.data();
      return `${data.senderType === 'bot' ? 'Assistente' : 'Usuário'}: ${data.text}`;
    }).join('\n');

    const genAI = new GoogleGenerativeAI(functions.config().omni?.gemini_key || process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = buildPrompt(userType, normalized.channel, normalized.text, history);
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const responseRef = db.collection('messages').doc();
    await responseRef.set({
      messageId: responseRef.id,
      conversationId: normalized.conversationId,
      channel: normalized.channel,
      sender: 'omni_ia',
      senderType: 'bot',
      text: response,
      timestamp: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now()
    });

    await db.collection('conversations').doc(normalized.conversationId).update({
      lastMessage: response,
      lastMessageAt: admin.firestore.Timestamp.now(),
      lastMessageSender: 'omni_ia'
    });

    await sendToChannel(normalized.channel, normalized.sender, response, normalized.metadata);

    await db.collection('ia_logs').add({
      conversationId: normalized.conversationId,
      channel: normalized.channel,
      userType,
      prompt,
      response,
      timestamp: admin.firestore.Timestamp.now()
    });
  }

  function buildPrompt(userType, channel, message, history) {
    const baseContext = `Você é o assistente virtual da Servio.AI, uma plataforma de serviços.
Canal: ${channel}
Histórico recente:
${history}

Mensagem atual: ${message}`;

    const personas = {
      cliente: `${baseContext}\n\nVocê está conversando com um CLIENTE.\n- Ajude com dúvidas sobre serviços, orçamentos, pagamentos\n- Seja cordial e resolutivo\n- Ofereça encontrar prestadores se necessário\n- Use linguagem clara e acessível`,
      prestador: `${baseContext}\n\nVocê está conversando com um PRESTADOR.\n- Ajude com jobs, propostas, pagamentos, perfil\n- Oriente sobre como melhorar visibilidade\n- Seja profissional e direto\n- Incentive ações que aumentem conversão`,
      prospector: `${baseContext}\n\nVocê está conversando com um PROSPECTOR/FUNCIONÁRIO.\n- Ajude com CRM, leads, metas, ferramentas internas\n- Forneça dicas de prospecção\n- Seja estratégico e motivacional\n- Use linguagem de equipe interna`,
      admin: `${baseContext}\n\nVocê está conversando com um ADMINISTRADOR.\n- Forneça insights sobre plataforma, usuários, performance\n- Seja técnico e objetivo\n- Apresente dados quando relevante`
    };

    return personas[userType] || personas.cliente;
  }

  async function identifyUserType(identifier, channel) {
    let query;
    if (channel === 'whatsapp') {
      query = db.collection('users').where('phone', '==', identifier);
    } else if (channel === 'instagram') {
      query = db.collection('users').where('instagramId', '==', identifier);
    } else if (channel === 'facebook') {
      query = db.collection('users').where('facebookId', '==', identifier);
    }

    if (query) {
      const snapshot = await query.limit(1).get();
      if (!snapshot.empty) {
        return snapshot.docs[0].data().type || 'cliente';
      }
    }
    return 'cliente';
  }

  async function sendToChannel(channel, recipient, text, metadata) {
    try {
      if (channel === 'whatsapp') {
        await axios.post(
          `https://graph.facebook.com/v18.0/${metadata.phone_number_id}/messages`,
          {
            messaging_product: 'whatsapp',
            to: recipient,
            type: 'text',
            text: { body: text }
          },
          {
            headers: {
              'Authorization': `Bearer ${functions.config().omni?.whatsapp_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else if (channel === 'instagram' || channel === 'facebook') {
        await axios.post(
          `https://graph.facebook.com/v18.0/me/messages`,
          {
            recipient: { id: recipient },
            message: { text }
          },
          {
            headers: {
              'Authorization': `Bearer ${functions.config().omni?.meta_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } catch (error) {
      console.error(`[Omni] Erro ao enviar ${channel}:`, error.response?.data || error);
    }
  }
});

/**
 * Cloud Function: Prospector Scheduler (Follow-up Automation)
 * 
 * Triggered by: HTTP POST from Cloud Scheduler (every 5 minutes)
 * 
 * Security: Requires x-servio-scheduler-token header matching servio.scheduler_token
 * 
 * Actions:
 * 1. Query leads with nextFollowUpAt <= now
 * 2. Create automatic follow-up activities
 * 3. Reschedule nextFollowUpAt to +24h
 * 4. Return count of processed leads
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
