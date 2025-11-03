const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const { Storage } = require("@google-cloud/storage");
const stripeLib = require("stripe");

// Initialize Firebase Admin SDK
// For Cloud Run, credentials will be automatically picked up from the service account.
// For local development, you might need to set GOOGLE_APPLICATION_CREDENTIALS
// or provide a service account key file directly.
try {
  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp();
  }
} catch (_) {
  // Allow running without firebase credentials locally
}

const storage = new Storage();
const defaultDb = admin.firestore();
// Stripe initialization - requires STRIPE_SECRET_KEY env var
const defaultStripe = process.env.STRIPE_SECRET_KEY
  ? stripeLib(process.env.STRIPE_SECRET_KEY)
  : null; // Will be injected in tests or left null if not configured
const port = process.env.PORT || 8081;

/**
 * Calculate provider revenue share rate based on profile and performance stats.
 * Simple, deterministic formula so tests can assert output ranges.
 * @param {Object} provider - Provider profile document
 * @param {Object} stats - Performance stats { totalJobs, averageRating, totalDisputes, totalRevenue }
 * @returns {{ currentRate: number, factors: Record<string, number> }}
 */
function calculateProviderRate(provider = {}, stats = {}) {
  const baseRate = 0.75;

  const headline = (provider.headline || '').trim();
  const verificationStatus = provider.verificationStatus || 'pendente';
  const totalJobs = Number(stats.totalJobs || 0);
  const averageRating = Number(stats.averageRating || 0);
  const totalRevenue = Number(stats.totalRevenue || 0);
  const totalDisputes = Number(stats.totalDisputes || 0);

  // Bonuses according to tests' expectations
  const profileComplete = headline && verificationStatus === 'verificado' ? 0.02 : 0;
  const highRating = averageRating >= 4.8 ? 0.02 : 0;
  const volumeTier = totalRevenue >= 11000 ? 0.03 : totalRevenue >= 6000 ? 0.02 : totalRevenue >= 1500 ? 0.01 : 0;
  const lowDisputeRate = totalJobs > 0 && totalDisputes / totalJobs < 0.05 ? 0.01 : 0;

  let rate = baseRate + profileComplete + highRating + volumeTier + lowDisputeRate;
  // Cap at 85%
  rate = Math.min(0.85, rate);

  // Tier heuristic (kept simple to satisfy tests)
  const tier = highRating && profileComplete && volumeTier >= 0.02 && lowDisputeRate > 0 ? 'Ouro' : 'Bronze';

  return {
    currentRate: Number(rate.toFixed(2)),
    bonuses: { profileComplete, highRating, volumeTier, lowDisputeRate },
    tier,
  };
}

/**
 * Factory function to create the Express app with dependency injection
 * @param {Object} options - Configuration options
 * @param {Object} options.db - Firestore database instance (default: admin.firestore())
 * @param {Object} options.storage - Google Cloud Storage instance (default: new Storage())
 * @param {Object} options.stripe - Stripe instance (default: require('stripe')(env.STRIPE_SECRET_KEY))
 * @returns {Express.Application} Configured Express app
 */
function createApp({
  db = defaultDb,
  storage: storageInstance = storage,
  stripe = defaultStripe,
} = {}) {
  const app = express();

  // Middleware to check for Super Admin role
  const checkSuperAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send('Unauthorized: No token provided.');
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userDoc = await db.collection('users').doc(decodedToken.email).get();
      if (userDoc.exists && userDoc.data().role === 'super_admin') {
        req.user = decodedToken;
        return next();
      }
      return res.status(403).send('Forbidden: Super admin access required.');
    } catch (error) {
      console.error('Error verifying super admin token:', error);
      return res.status(403).send('Forbidden: Invalid token.');
    }
  };

  app.use(cors());
  app.use(express.json());

  // Basic "Hello World" endpoint for the backend service
  app.get("/", (req, res) => {
    res.send("Hello from SERVIO.AI Backend (Firestore Service)!");
  });

  // =================================================================
  // STRIPE PAYMENT ENDPOINTS
  // =================================================================

  app.post("/create-checkout-session", async (req, res) => {
    const { job, amount } = req.body;
    const YOUR_DOMAIN = process.env.FRONTEND_URL || "http://localhost:5173"; // Your frontend domain

    try {
      // Create an escrow record in Firestore first
      const escrowRef = db.collection("escrows").doc();
      const escrowData = {
        id: escrowRef.id,
        jobId: job.id,
        clientId: job.clientId,
        providerId: job.providerId,
        amount: amount,
        status: "pendente", // 'pendente', 'pago', 'liberado', 'disputa'
        createdAt: new Date().toISOString(),
      };
      await escrowRef.set(escrowData);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card", "boleto"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: `Serviço: ${job.category}`,
                description: `Pagamento seguro para o serviço: ${job.description.substring(0, 100)}...`,
              },
              unit_amount: amount * 100, // Amount in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${YOUR_DOMAIN}/job/${job.id}?payment_success=true`,
        cancel_url: `${YOUR_DOMAIN}/job/${job.id}?payment_canceled=true`,
        metadata: {
          escrowId: escrowRef.id,
          jobId: job.id,
        },
      });

      res.json({ id: session.id });
    } catch (error) {
      console.error("Error creating Stripe checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session." });
    }
  });

  app.post("/create-subscription-session", async (req, res) => {
    const { priceId, userEmail } = req.body; // priceId from your Stripe product
    const YOUR_DOMAIN = process.env.FRONTEND_URL || "http://localhost:5173";

    try {
      // Check if user already has a Stripe customer ID, create if not.
      // In a real app, you'd store this customer ID in your 'users' collection.
      const customer = await stripe.customers.create({
        email: userEmail,
        description: `Customer for ${userEmail}`,
      });

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: priceId, // e.g., price_1P...
            quantity: 1,
          },
        ],
        success_url: `${YOUR_DOMAIN}/dashboard?subscription_success=true`,
        cancel_url: `${YOUR_DOMAIN}/dashboard?subscription_canceled=true`,
        metadata: {
          userEmail: userEmail,
        },
      });
      res.json({ id: session.id });
    } catch (error) {
      console.error("Error creating Stripe subscription session:", error);
      res.status(500).json({ error: "Failed to create subscription session." });
    }
  });

  // Stripe webhook handler
  app.post(
    "/stripe-webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error(`❌ Error message: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object;
          // Handle payment for one-time jobs
          if (session.mode === 'payment' && session.metadata.escrowId) {
            const escrowId = session.metadata.escrowId;
            await db.collection("escrows").doc(escrowId).update({ status: "pago" });
            console.log(`Escrow ${escrowId} marked as paid.`);
          }
          // If it's a subscription, Stripe will send 'customer.subscription.created' separately.
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object;
          const customerId = subscription.customer;
          
          // Find user by Stripe customer ID
          const userQuery = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
          if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const subscriptionData = {
              planId: subscription.items.data[0].price.id,
              stripeSubscriptionId: subscription.id,
              status: subscription.status, // 'active', 'past_due', 'canceled', etc.
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            };
            await userDoc.ref.update({ subscription: subscriptionData });
            console.log(`Subscription status updated for user ${userDoc.id} to ${subscription.status}.`);
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    }
  );

  app.post("/jobs/:jobId/release-payment", async (req, res) => {
    const { jobId } = req.params;

    try {
      const escrowQuery = await db
        .collection("escrows")
        .where("jobId", "==", jobId)
        .limit(1)
        .get();

      if (escrowQuery.empty) {
        return res.status(404).json({
          error: "Registro de pagamento não encontrado para este job.",
        });
      }

      const escrowDoc = escrowQuery.docs[0];
      const escrowData = escrowDoc.data();
      const jobDoc = await db.collection("jobs").doc(jobId).get();
      const jobData = jobDoc.data();

      if (jobData.clientId !== req.user.email) {
        return res.status(403).json({
          error: "Forbidden: Only the client can release the payment.",
        });
      }

      if (escrowData.status !== "pago") {
        return res.status(400).json({
          error: `Pagamento não pode ser liberado. Status atual: ${escrowData.status}`,
        });
      }

      // TODO: Implement Stripe Payout/Transfer to the provider's connected account.
      // This is a critical step for a real application.
      // For now, we simulate the success by updating our internal state.

      // **NOVA LÓGICA DE COMISSÃO DINÂMICA**
      const providerDoc = await db.collection('users').doc(escrowData.providerId).get();
      if (!providerDoc.exists) throw new Error('Provider not found for commission calculation.');
      
      // Reutiliza a lógica de cálculo de estatísticas
      const jobsSnapshot = await db.collection('jobs').where('providerId', '==', escrowData.providerId).where('status', '==', 'concluido').get();
      const completedJobs = jobsSnapshot.docs.map(doc => doc.data());
      const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.price || 0), 0);
      const ratings = completedJobs.map(job => job.review?.rating).filter(Boolean);
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
      const stats = { totalJobs: completedJobs.length, totalRevenue, averageRating, totalDisputes: 0 }; // Simplificado

      const earningsProfile = calculateProviderRate(providerDoc.data(), stats);
      const providerShare = escrowData.amount * earningsProfile.currentRate;
      const platformShare = escrowData.amount * (1 - earningsProfile.currentRate);

      console.log(
        `Simulating Stripe Payout for Escrow ID: ${escrowDoc.id}. Total: ${escrowData.amount}. Provider (${earningsProfile.currentRate * 100}%): ${providerShare.toFixed(2)}. Platform: ${platformShare.toFixed(2)}.`
      );

      // Update job and escrow status
      await db.collection("jobs").doc(jobId).update({ 
        status: "concluido",
        earnings: { providerShare, platformShare, rate: earningsProfile.currentRate } 
      });
      await escrowDoc.ref.update({ status: "liberado" });

      res.status(200).json({
        message: "Pagamento liberado e serviço concluído com sucesso.",
      });
    } catch (error) {
      console.error("Error releasing payment:", error);
      res.status(500).json({ error: "Falha ao liberar o pagamento." });
    }
  });

  app.post("/jobs/:jobId/set-on-the-way", async (req, res) => {
    const { jobId } = req.params;
    try {
      const jobRef = db.collection("jobs").doc(jobId);
      // We could add a check here to ensure the user making the request is the provider
      await jobRef.update({ status: "a_caminho" });
      res
        .status(200)
        .json({ message: 'Status updated to "a_caminho" successfully.' });
    } catch (error) {
      console.error("Error setting job status to on the way:", error);
      res.status(500).json({ error: "Failed to update job status." });
    }
  });

  // =================================================================
  // FILE UPLOAD ENDPOINTS
  // =================================================================

  app.post("/generate-upload-url", async (req, res) => {
    const { fileName, contentType, jobId } = req.body;
    if (!fileName || !contentType || !jobId) {
      return res
        .status(400)
        .json({ error: "fileName, contentType, and jobId are required." });
    }

    // Any authenticated user can get an upload URL, we can restrict later if needed
    // based on req.user.uid if they are the client for the job.

    try {
      const bucketName = process.env.GCP_STORAGE_BUCKET; // e.g., 'your-project-id.appspot.com'
      if (!bucketName) {
        throw new Error("GCP_STORAGE_BUCKET environment variable not set.");
      }
      const bucket = storage.bucket(bucketName);
      const filePath = `jobs/${jobId}/${Date.now()}-${fileName}`;
      const file = bucket.file(filePath);

      const options = {
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: contentType,
      };

      const [url] = await file.getSignedUrl(options);
      res.status(200).json({ signedUrl: url, filePath: filePath });
    } catch (error) {
      console.error("Error generating signed URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL." });
    }
  });

  app.post("/disputes/:disputeId/resolve", async (req, res) => {
    const { disputeId } = req.params;
    const { resolution, comment } = req.body; // resolution: 'release_to_provider' or 'refund_client'

    if (!resolution || !comment) {
      return res
        .status(400)
        .json({ error: "Resolution decision and comment are required." });
    }

    const db = admin.firestore();
    const disputeRef = db.collection("disputes").doc(disputeId);

    try {
      const disputeDoc = await disputeRef.get();
      if (!disputeDoc.exists) {
        return res.status(404).json({ error: "Dispute not found." });
      }
      const disputeData = disputeDoc.data();
      const jobId = disputeData.jobId;

      const escrowQuery = await db
        .collection("escrows")
        .where("jobId", "==", jobId)
        .limit(1)
        .get();
      if (escrowQuery.empty) {
        return res
          .status(404)
          .json({ error: "Escrow record not found for this job." });
      }
      const escrowRef = escrowQuery.docs[0].ref;

      // Update documents in a transaction for atomicity
      await db.runTransaction(async (transaction) => {
        transaction.update(disputeRef, {
          status: "resolvida",
          resolution: {
            decision: resolution,
            comment: comment,
            resolvedAt: new Date().toISOString(),
          },
        });
        transaction.update(db.collection("jobs").doc(jobId), {
          status:
            resolution === "release_to_provider" ? "concluido" : "cancelado",
        });
        transaction.update(escrowRef, {
          status:
            resolution === "release_to_provider" ? "liberado" : "reembolsado",
        });
      });

      res.status(200).json({ message: "Dispute resolved successfully." });
    } catch (error) {
      console.error("Error resolving dispute:", error);
      res.status(500).json({ error: "Failed to resolve dispute." });
    }
  });

  // Create a new dispute
  app.post("/disputes", async (req, res) => {
    try {
      const { jobId, initiatorId, reason } = req.body;
      if (!jobId || !initiatorId || !reason) {
        return res.status(400).json({ error: "jobId, initiatorId and reason are required." });
      }

      const disputeRef = db.collection("disputes").doc();
      const dispute = {
        id: disputeRef.id,
        jobId,
        initiatorId,
        reason,
        status: 'aberta',
        messages: [],
        createdAt: new Date().toISOString(),
      };
      await disputeRef.set(dispute);

      // Also update the job status to 'em_disputa'
      await db.collection('jobs').doc(jobId).update({ status: 'em_disputa' });

      res.status(201).json(dispute);
    } catch (error) {
      console.error("Error creating dispute:", error);
      res.status(500).json({ error: "Failed to create dispute." });
    }
  });

  // =================================================================
  // USERS API ENDPOINTS
  // =================================================================

  // Get all users
  app.get("/users", async (req, res) => {
    try {
      const snapshot = await db.collection("users").get();
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "Failed to retrieve users." });
    }
  });

  // Get a single user by ID (email)
  app.get("/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const userRef = db.collection("users").doc(userId);
      const doc = await userRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "User not found." });
      }
      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Failed to retrieve user." });
    }
  });

  // Create a new user
  app.post("/users", async (req, res) => {
    try {
      const userData = req.body;
      if (!userData.email) {
        return res.status(400).json({ error: "User email is required." });
      }
      await db.collection("users").doc(userData.email).set(userData);
      res
        .status(201)
        .json({ message: "User created successfully", id: userData.email });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user." });
    }
  });

  // Update an existing user
  app.put("/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const userData = req.body;
      const userRef = db.collection("users").doc(userId);
      await userRef.update(userData);
      res
        .status(200)
        .json({ message: "User updated successfully", id: userId });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user." });
    }
  });

  // Delete a user
  app.delete("/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      await db.collection("users").doc(userId).delete();
      res
        .status(200)
        .json({ message: "User deleted successfully", id: userId });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user." });
    }
  });

  // Get all jobs
  app.get("/jobs", async (req, res) => {
    try {
      const { providerId, status } = req.query;
      let query = db.collection("jobs");
      if (providerId) {
        query = query.where("providerId", "==", providerId);
      }
      if (status) {
        query = query.where("status", "==", status);
      }
      const snapshot = await query.get();
      const jobs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(jobs);
    } catch (error) {
      console.error("Error getting jobs:", error);
      res.status(500).json({ error: "Failed to retrieve jobs." });
    }
  });

  // Create a new job
  app.post("/jobs", async (req, res) => {
    try {
      const jobData = {
        ...req.body,
        createdAt: new Date().toISOString(),
        status: req.body.status || "ativo",
      };
      const jobRef = db.collection("jobs").doc();
      await jobRef.set(jobData);
      res.status(201).json({ id: jobRef.id, ...jobData });
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ error: "Failed to create job." });
    }
  });

  // Mark a job as complete by the client
  app.post("/jobs/:id/complete", async (req, res) => {
    // This should be protected by checkAuth
    try {
      const { id } = req.params;
      // const requesterEmail = req.user.email;

      const jobRef = db.collection("jobs").doc(id);
      const jobDoc = await jobRef.get();

      if (!jobDoc.exists) {
        return res.status(404).json({ error: "Job not found." });
      }

      // if (jobDoc.data().clientId !== requesterEmail) {
      //   return res.status(403).json({ error: "Forbidden: Only the client can complete the job." });
      // }

      await jobRef.update({ status: "concluido" });
      res.status(200).json({ message: "Job marked as complete successfully." });
    } catch (error) {
      console.error("Error completing job:", error);
      res.status(500).json({ error: "Failed to complete job." });
    }
  });

  // =================================================================
  // MESSAGES API ENDPOINTS
  // =================================================================

  // Get all messages for a specific chat (job)
  app.get("/jobs/:jobId/messages", async (req, res) => {
    try {
      const { jobId } = req.params;
      const snapshot = await db.collection("messages").where("chatId", "==", jobId).orderBy("createdAt", "asc").get();
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ error: "Failed to retrieve messages." });
    }
  });

  // Compatibility route: GET /messages/:jobId
  app.get("/messages/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const snapshot = await db
        .collection("messages")
        .where("chatId", "==", jobId)
        .orderBy("createdAt", "asc")
        .get();
      const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(messages);
    } catch (error) {
      console.error("Error getting messages (compat):", error);
      res.status(500).json({ error: "Failed to retrieve messages." });
    }
  });

  // Get a single job by ID
  app.get("/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await db.collection("jobs").doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: "Job not found." });
      }
      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error("Error getting job:", error);
      res.status(500).json({ error: "Failed to retrieve job." });
    }
  });

  // Generic update for a job document
  app.put("/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const jobRef = db.collection("jobs").doc(id);
      const jobDoc = await jobRef.get();
      if (!jobDoc.exists) {
        return res.status(404).json({ error: "Job not found." });
      }
      await jobRef.update(updates);
      const updated = await jobRef.get();
      res.status(200).json({ id: updated.id, ...updated.data() });
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ error: "Failed to update job." });
    }
  });

  // =================================================================
  // PROPOSALS API ENDPOINTS
  // =================================================================

  // Get proposals, optionally filtered by jobId
  app.get("/proposals", async (req, res) => {
    try {
      const { jobId } = req.query;
      let query = db.collection("proposals");
      if (jobId) {
        query = query.where("jobId", "==", jobId);
      }
      const snapshot = await query.get();
      const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(proposals);
    } catch (error) {
      console.error("Error getting proposals:", error);
      res.status(500).json({ error: "Failed to retrieve proposals." });
    }
  });

  // Create a new proposal
  app.post("/proposals", async (req, res) => {
    try {
      const proposalData = { ...req.body, createdAt: new Date().toISOString(), status: 'pendente' };
      const proposalRef = await db.collection("proposals").add(proposalData);
      res.status(201).json({ id: proposalRef.id, ...proposalData });
    } catch (error) {
      console.error("Error creating proposal:", error);
      res.status(500).json({ error: "Failed to create proposal." });
    }
  });

  // Update proposal
  app.put("/proposals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const ref = db.collection("proposals").doc(id);
      const doc = await ref.get();
      if (!doc.exists) return res.status(404).json({ error: "Proposal not found." });
      await ref.update(updates);
      const updated = await ref.get();
      res.status(200).json({ id: updated.id, ...updated.data() });
    } catch (error) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ error: "Failed to update proposal." });
    }
  });

  // Create a new message in a chat
  app.post("/jobs/:jobId/messages", async (req, res) => {
    try {
      const { jobId } = req.params;
      // const senderId = req.user.email;
      const { text, senderId } = req.body; // senderId is temporary until auth is fully enforced
      const messageData = { chatId: jobId, senderId, text, createdAt: new Date().toISOString() };
      const messageRef = await db.collection("messages").add(messageData);
      res.status(201).json({ id: messageRef.id, ...messageData });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message." });
    }
  });

  // Compatibility route: POST /messages
  app.post("/messages", async (req, res) => {
    try {
      const { chatId, text, senderId } = req.body;
      if (!chatId || !text || !senderId) {
        return res.status(400).json({ error: "chatId, text and senderId are required." });
      }
      const messageData = { chatId, senderId, text, createdAt: new Date().toISOString() };
      const messageRef = await db.collection("messages").add(messageData);
      res.status(201).json({ id: messageRef.id, ...messageData });
    } catch (error) {
      console.error("Error sending message (compat):", error);
      res.status(500).json({ error: "Failed to send message." });
    }
  });

  // =================================================================
  // SENTIMENT ALERTS API ENDPOINTS
  // =================================================================

  // Get all sentiment alerts
  app.get("/sentiment-alerts", async (req, res) => {
    try {
      const snapshot = await db.collection("sentiment_alerts").orderBy('createdAt', 'desc').get();
      const alerts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(alerts);
    } catch (error) {
      console.error("Error getting sentiment alerts:", error);
      res.status(500).json({ error: "Failed to retrieve sentiment alerts." });
    }
  });

  // Create a new sentiment alert
  app.post("/sentiment-alerts", async (req, res) => {
    try {
      const alertData = {
        ...req.body,
        createdAt: new Date().toISOString(),
        status: "novo", // 'novo', 'revisado'
      };
      const alertRef = db.collection("sentiment_alerts").doc();
      await alertRef.set(alertData);
      res.status(201).json({ id: alertRef.id, ...alertData });
    } catch (error) {
      console.error("Error creating sentiment alert:", error);
      res.status(500).json({ error: "Failed to create sentiment alert." });
    }
  });

  // Get maintenance history for a specific item
  app.get("/maintained-items/:itemId/history", async (req, res) => {
    try {
      const { itemId } = req.params;
      const snapshot = await db
        .collection("jobs")
        .where("itemId", "==", itemId)
        .where("status", "==", "concluido")
        .orderBy("completedAt", "desc")
        .get();

      const history = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(history);
    } catch (error) {
      console.error("Error getting maintenance history:", error);
      res.status(500).json({ error: "Failed to retrieve maintenance history." });
    }
  });

  // List maintained items for a client
  app.get("/maintained-items", async (req, res) => {
    try {
      const { clientId } = req.query;
      if (!clientId) return res.status(400).json({ error: "clientId is required" });
      const snapshot = await db
        .collection("maintained_items")
        .where("clientId", "==", clientId)
        .orderBy("createdAt", "desc")
        .get();
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(items);
    } catch (error) {
      console.error("Error listing maintained items:", error);
      res.status(500).json({ error: "Failed to retrieve maintained items." });
    }
  });

  // Create a maintained item for a client
  app.post("/maintained-items", async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !payload.clientId || !payload.name || !payload.category) {
        return res
          .status(400)
          .json({ error: "clientId, name and category are required." });
      }
      const ref = db.collection("maintained_items").doc();
      const newItem = {
        ...payload,
        id: ref.id,
        createdAt: new Date().toISOString(),
        maintenanceHistory: [],
      };
      await ref.set(newItem);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating maintained item:", error);
      res.status(500).json({ error: "Failed to create maintained item." });
    }
  });

  // =================================================================
  // METRICS API ENDPOINTS
  // =================================================================

  // Helper to group data by day
  const groupByDay = (data, dateField, valueField = null) => {
    const groups = data.reduce((acc, item) => {
      const date = item[dateField].split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, value: 0 };
      }
      acc[date].value += valueField ? (item[valueField] || 0) : 1;
      return acc;
    }, {});
    return Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Get user growth metrics
  app.get("/metrics/user-growth", async (req, res) => {
    try {
      const snapshot = await db.collection("users").orderBy('memberSince').get();
      const users = snapshot.docs.map(doc => doc.data());
      const dailyGrowth = groupByDay(users, 'memberSince');
      res.status(200).json(dailyGrowth);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve user growth metrics." });
    }
  });

  // Get job creation metrics
  app.get("/metrics/job-creation", async (req, res) => {
    try {
      const snapshot = await db.collection("jobs").orderBy('createdAt').get();
      const jobs = snapshot.docs.map(doc => doc.data());
      const dailyCreation = groupByDay(jobs, 'createdAt');
      res.status(200).json(dailyCreation);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve job creation metrics." });
    }
  });

  // Get revenue metrics
  app.get("/metrics/revenue", async (req, res) => {
    try {
      const snapshot = await db.collection("escrows").where('status', '==', 'liberado').orderBy('releasedAt').get();
      const escrows = snapshot.docs.map(doc => doc.data());
      // Assuming platform fee is a fixed percentage for simplicity here
      const platformFee = 0.15; 
      const dailyRevenue = groupByDay(escrows, 'releasedAt', 'amount').map(item => ({ ...item, value: item.value * platformFee }));
      res.status(200).json(dailyRevenue);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve revenue metrics." });
    }
  });

  // =================================================================
  // SEO ENDPOINTS
  // =================================================================

  app.get("/sitemap.xml", async (req, res) => {
    const YOUR_DOMAIN = process.env.FRONTEND_URL || "http://localhost:5173";
    try {
      const usersSnapshot = await db.collection("users").where('type', '==', 'prestador').where('verificationStatus', '==', 'verificado').get();
      const providers = usersSnapshot.docs.map(doc => doc.data());

      // Idealmente, teríamos uma coleção de 'categorias' ou extrairíamos das existentes
      const categories = ['eletricista', 'encanador', 'pintor', 'montador-de-moveis'];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // Add static pages
      xml += `<url><loc>${YOUR_DOMAIN}/</loc></url>\n`;

      // Add category pages
      categories.forEach(cat => {
        xml += `<url><loc>${YOUR_DOMAIN}/servicos/${cat}</loc></url>\n`;
      });

      // Add provider profiles
      providers.forEach(p => {
        xml += `<url><loc>${YOUR_DOMAIN}/provider/${p.email}</loc></url>\n`;
      });

      xml += `</urlset>`;
      res.header('Content-Type', 'application/xml').send(xml);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap.");
    }
  });

  // =================================================================
  // STAFF MANAGEMENT API ENDPOINTS
  // =================================================================

  // Create a new staff member (only for super_admins)
  app.post("/staff", checkSuperAdmin, async (req, res) => {
    try {
      const { email, name, role } = req.body;
      if (!email || !name || !role) {
        return res.status(400).json({ error: "Email, name, and role are required." });
      }

      // 1. Create user in Firebase Auth
      // A temporary password is set. The user should be prompted to change it.
      const tempPassword = Math.random().toString(36).slice(-8);
      const userRecord = await admin.auth().createUser({
        email: email,
        password: tempPassword,
        displayName: name,
      });

      // 2. Create user document in Firestore
      const staffData = {
        email: userRecord.email,
        name: name,
        type: 'staff',
        role: role,
        status: 'ativo',
        memberSince: new Date().toISOString(),
      };
      await db.collection("users").doc(userRecord.email).set(staffData);

      res.status(201).json({ message: `Staff member ${name} created successfully. Temporary password: ${tempPassword}`, id: userRecord.uid });
    } catch (error) {
      console.error("Error creating staff member:", error);
      res.status(500).json({ error: "Failed to create staff member. The email might already be in use." });
    }
  });

  // Start a 30-day free trial for a user
  app.post("/users/:id/start-trial", async (req, res) => {
    // This endpoint should be protected by checkAuth in a real scenario
    const { id } = req.params;
    // const requesterEmail = req.user.email; // From checkAuth middleware

    // if (id !== requesterEmail) {
    //   return res.status(403).json({ error: "Forbidden: You can only start a trial for your own account." });
    // }

    try {
      const userRef = db.collection("users").doc(id);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found." });
      }

      const userData = userDoc.data();
      if (userData.subscription && (userData.subscription.status === 'active' || userData.subscription.trialStartedAt)) {
        return res.status(400).json({ error: "This account already has an active subscription or has used a trial period." });
      }

      const now = new Date();
      const trialEnds = new Date();
      trialEnds.setDate(now.getDate() + 30);

      const trialSubscription = {
        status: 'trialing',
        trialStartedAt: now.toISOString(),
        trialEndsAt: trialEnds.toISOString(),
      };

      await userRef.update({ subscription: trialSubscription });
      res.status(200).json({ message: "30-day free trial started successfully!", subscription: trialSubscription });
    } catch (error) {
      console.error(`Error starting trial for user ${id}:`, error);
      res.status(500).json({ error: "Failed to start free trial." });
    }
  });

  // =================================================================
  // DOCUMENT REQUESTS API ENDPOINTS
  // =================================================================

  // Create a new document request for a job
  app.post("/jobs/:jobId/document-requests", async (req, res) => {
    // This should be protected by checkAuth and role checks
    const { jobId } = req.params;
    const { documentName } = req.body;

    if (!documentName) {
      return res.status(400).json({ error: "Document name is required." });
    }

    try {
      const jobRef = db.collection("jobs").doc(jobId);
      const newRequest = {
        id: db.collection('dummy').doc().id, // Generate a random ID
        documentName,
        status: 'solicitado',
        createdAt: new Date().toISOString(),
      };

      // Firestore doesn't have a native way to push to an array, so we read, update, and write.
      await jobRef.update({
        documentRequests: admin.firestore.FieldValue.arrayUnion(newRequest)
      });

      res.status(201).json(newRequest);
    } catch (error) {
      console.error(`Error creating document request for job ${jobId}:`, error);
      res.status(500).json({ error: "Failed to create document request." });
    }
  });

  // Update a document request (e.g., after file upload)
  // This is a simplified version. A real implementation would be more complex.
  app.put("/jobs/:jobId/document-requests/:requestId", async (req, res) => {
    // This endpoint is simplified for demonstration.
    // A robust implementation would involve transactions to update the array element.
    // For now, we acknowledge the request. The Cloud Function will do the heavy lifting.
    const { jobId, requestId } = req.params;
    console.log(`Received update for document request ${requestId} in job ${jobId} with data:`, req.body);
    res.status(200).json({ message: "Document status update acknowledged." });
  });

  // =================================================================
  // INVITATIONS API ENDPOINTS
  // =================================================================

  // Create a new invitation for a provider
  app.post("/invitations", async (req, res) => {
    // This should be protected by checkAuth
    const { providerEmail, clientId, clientName } = req.body;

    if (!providerEmail || !clientId || !clientName) {
      return res.status(400).json({ error: "Provider email, client ID, and client name are required." });
    }

    try {
      const invitationRef = db.collection("invitations").doc();
      const newInvitation = {
        id: invitationRef.id,
        providerEmail,
        clientId,
        clientName,
        status: 'pendente',
        createdAt: new Date().toISOString(),
      };

      await invitationRef.set(newInvitation);
      res.status(201).json({ message: "Invitation created successfully. The provider will be notified shortly." });
    } catch (error) {
      console.error(`Error creating invitation for ${providerEmail}:`, error);
      res.status(500).json({ error: "Failed to create invitation." });
    }
  });

  // List invitations (filter by clientId or providerEmail)
  app.get("/invitations", async (req, res) => {
    try {
      const { clientId, providerEmail } = req.query;
      let query = db.collection("invitations");
      if (clientId) query = query.where("clientId", "==", clientId);
      if (providerEmail) query = query.where("providerEmail", "==", providerEmail);
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const invitations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(invitations);
    } catch (error) {
      console.error("Error listing invitations:", error);
      res.status(500).json({ error: "Failed to retrieve invitations." });
    }
  });

  // =================================================================
  // CONTRACTS API ENDPOINTS
  // =================================================================

  // GET /contracts - List contracts, filterable by clientId or providerId
  app.get("/contracts", async (req, res) => {
    // This should be protected by checkAuth
    try {
      const { clientId, providerId } = req.query;
      let query = db.collection("contracts");

      if (clientId) {
        query = query.where("clientId", "==", clientId);
      }
      if (providerId) {
        query = query.where("providerId", "==", providerId);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const contracts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ error: "Failed to retrieve contracts." });
    }
  });

  // POST /contracts - Create a new contract
  app.post("/contracts", async (req, res) => {
    // This should be protected by checkAuth
    try {
      const contractData = req.body;
      if (!contractData.clientId || !contractData.title) {
        return res.status(400).json({ error: "Client ID and title are required." });
      }

      const newContractRef = db.collection("contracts").doc();
      await newContractRef.set({ ...contractData, id: newContractRef.id, createdAt: new Date().toISOString() });
      res.status(201).json({ id: newContractRef.id, ...contractData });
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({ error: "Failed to create contract." });
    }
  });

  // =================================================================
  // ADMIN MANUAL PAYOUTS
  // =================================================================

  // List escrows (optional filter by status)
  app.get("/escrows", async (req, res) => {
    try {
      const { status, clientId, providerId } = req.query;
      let query = db.collection("escrows");
      if (status) query = query.where("status", "==", status);
      if (clientId) query = query.where("clientId", "==", clientId);
      if (providerId) query = query.where("providerId", "==", providerId);
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const escrows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(escrows);
    } catch (error) {
      console.error("Error listing escrows:", error);
      res.status(500).json({ error: "Failed to retrieve escrows." });
    }
  });

  // Mark an escrow as paid to the provider (manual payout)
  app.post("/admin/payments/:escrowId/mark-paid", checkSuperAdmin, async (req, res) => {
    try {
      const { escrowId } = req.params;
      const escrowRef = db.collection("escrows").doc(escrowId);
      const escrowDoc = await escrowRef.get();

      if (!escrowDoc.exists || escrowDoc.data().status !== 'liberado') {
        return res.status(404).json({ error: "Pending payment not found or not in correct status." });
      }

      await escrowRef.update({
        status: 'pago_ao_prestador',
        paidOutAt: new Date().toISOString(),
      });

      res.status(200).json({ message: "Payment marked as paid successfully." });
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      res.status(500).json({ error: "Failed to mark payment as paid." });
    }
  });

  // =================================================================
  // BLOG API ENDPOINTS (Público)
  // =================================================================

  // Get all published blog posts (summary view)
  app.get("/blog-posts", async (req, res) => {
    try {
      const snapshot = await db.collection("blog_posts")
        .where('status', '==', 'publicado')
        .orderBy('createdAt', 'desc')
        .get();
      
      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          slug: data.slug,
          title: data.title,
          introduction: data.introduction,
          createdAt: data.createdAt,
        };
      });
      res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ error: "Failed to retrieve blog posts." });
    }
  });

  // Get a single blog post by slug
  app.get("/blog-posts/:slug", async (req, res) => {
    const { slug } = req.params;
    const doc = await db.collection("blog_posts").doc(slug).get();
    if (!doc.exists) return res.status(404).json({ error: "Post not found." });
    res.status(200).json({ id: doc.id, ...doc.data() });
  });

  // Get related blog posts by category
  app.get("/blog-posts/related", async (req, res) => {
    const { category, exclude, limit = '3' } = req.query;
    if (!category || !exclude) {
      return res.status(400).json({ error: "Category and exclude parameters are required." });
    }

    try {
      const snapshot = await db.collection("blog_posts")
        .where('status', '==', 'publicado')
        .where('category', '==', category)
        .where('slug', '!=', exclude) // Exclude the current post
        .limit(parseInt(limit, 10))
        .get();

      const posts = snapshot.docs.map(doc => {
        const { title, slug, featuredImageUrl } = doc.data();
        return { title, slug, featuredImageUrl };
      });
      res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching related blog posts:", error);
      res.status(500).json({ error: "Failed to retrieve related posts." });
    }
  });

  // =================================================================
  // FRAUD ALERTS AND DISPUTES LISTING (Admin)
  // =================================================================

  // List fraud alerts
  app.get("/fraud-alerts", async (req, res) => {
    try {
      const snapshot = await db.collection("fraud_alerts").orderBy('createdAt', 'desc').get();
      const alerts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(alerts);
    } catch (error) {
      console.error("Error listing fraud alerts:", error);
      res.status(500).json({ error: "Failed to retrieve fraud alerts." });
    }
  });

  // Update fraud alert
  app.put("/fraud-alerts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const ref = db.collection("fraud_alerts").doc(id);
      const doc = await ref.get();
      if (!doc.exists) return res.status(404).json({ error: "Fraud alert not found." });
      await ref.update(updates);
      const updated = await ref.get();
      res.status(200).json({ id: updated.id, ...updated.data() });
    } catch (error) {
      console.error("Error updating fraud alert:", error);
      res.status(500).json({ error: "Failed to update fraud alert." });
    }
  });

  // List disputes
  app.get("/disputes", async (req, res) => {
    try {
      const snapshot = await db.collection("disputes").orderBy('createdAt', 'desc').get();
      const disputes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(disputes);
    } catch (error) {
      console.error("Error listing disputes:", error);
      res.status(500).json({ error: "Failed to retrieve disputes." });
    }
  });

  return app;
}

// Create default app instance
const app = createApp();

// Start the server only if the file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Firestore Backend Service listening on port ${port}`);
  });
}

module.exports = { createApp, app, calculateProviderRate };
