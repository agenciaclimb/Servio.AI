const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use environment variable for secret key

// Initialize Firebase Admin SDK
// For Cloud Run, credentials will be automatically picked up from the service account.
// For local development, you might need to set GOOGLE_APPLICATION_CREDENTIALS
// or provide a service account key file directly.
// const serviceAccount = require('./path/to/your/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
admin.initializeApp(); // Assumes GOOGLE_APPLICATION_CREDENTIALS or Cloud Run environment

const storage = new Storage();
const db = admin.firestore();
const app = express();
const port = process.env.PORT || 8081; // Use a different port than server.js (8080)

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json());

// Basic "Hello World" endpoint for the backend service
app.get('/', (req, res) => {
  res.send('Hello from SERVIO.AI Backend (Firestore Service)!');
});

// =================================================================
// STRIPE PAYMENT ENDPOINTS
// =================================================================

app.post('/create-checkout-session', async (req, res) => {
  const { job, amount } = req.body;
  const YOUR_DOMAIN = process.env.FRONTEND_URL || 'http://localhost:5173'; // Your frontend domain

  try {
    // Create an escrow record in Firestore first
    const escrowRef = db.collection('escrows').doc();
    const escrowData = {
      id: escrowRef.id,
      jobId: job.id,
      clientId: job.clientId,
      providerId: job.providerId,
      amount: amount,
      status: 'pendente', // 'pendente', 'pago', 'liberado', 'disputa'
      createdAt: new Date().toISOString(),
    };
    await escrowRef.set(escrowData);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Serviço: ${job.category}`,
              description: `Pagamento seguro para o serviço: ${job.description.substring(0, 100)}...`,
            },
            unit_amount: amount * 100, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/job/${job.id}?payment_success=true`,
      cancel_url: `${YOUR_DOMAIN}/job/${job.id}?payment_canceled=true`,
      metadata: {
        escrowId: escrowRef.id,
        jobId: job.id,
      }
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

app.post('/jobs/:jobId/release-payment', async (req, res) => {
  const { jobId } = req.params;

  try {
    const escrowQuery = await db.collection('escrows').where('jobId', '==', jobId).limit(1).get();

    if (escrowQuery.empty) {
      return res.status(404).json({ error: 'Registro de pagamento não encontrado para este job.' });
    }

    const escrowDoc = escrowQuery.docs[0];
    const escrowData = escrowDoc.data();
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    const jobData = jobDoc.data();

    if (jobData.clientId !== req.user.email) {
      return res.status(403).json({ error: 'Forbidden: Only the client can release the payment.' });
    }

    if (escrowData.status !== 'pago') {
      return res.status(400).json({ error: `Pagamento não pode ser liberado. Status atual: ${escrowData.status}` });
    }

    // TODO: Implement Stripe Payout/Transfer to the provider's connected account.
    // This is a critical step for a real application.
    // For now, we simulate the success by updating our internal state.
    console.log(`Simulating Stripe Payout for Escrow ID: ${escrowDoc.id} to Provider: ${escrowData.providerId}`);

    // Update job and escrow status
    await db.collection('jobs').doc(jobId).update({ status: 'concluido' });
    await escrowDoc.ref.update({ status: 'liberado' });

    res.status(200).json({ message: 'Pagamento liberado e serviço concluído com sucesso.' });
  } catch (error) {
    console.error('Error releasing payment:', error);
    res.status(500).json({ error: 'Falha ao liberar o pagamento.' });
  }
});

app.post('/jobs/:jobId/set-on-the-way', async (req, res) => {
  const { jobId } = req.params;
  try {
    const jobRef = db.collection('jobs').doc(jobId);
    // We could add a check here to ensure the user making the request is the provider
    await jobRef.update({ status: 'a_caminho' });
    res.status(200).json({ message: 'Status updated to "a_caminho" successfully.' });
  } catch (error) {
    console.error('Error setting job status to on the way:', error);
    res.status(500).json({ error: 'Failed to update job status.' });
  }
});


// =================================================================
// FILE UPLOAD ENDPOINTS
// =================================================================

app.post('/generate-upload-url', async (req, res) => {
  const { fileName, contentType, jobId } = req.body;
  if (!fileName || !contentType || !jobId) {
    return res.status(400).json({ error: 'fileName, contentType, and jobId are required.' });
  }

  // Any authenticated user can get an upload URL, we can restrict later if needed
  // based on req.user.uid if they are the client for the job.

  try {
    const bucketName = process.env.GCP_STORAGE_BUCKET; // e.g., 'your-project-id.appspot.com'
    if (!bucketName) {
      throw new Error('GCP_STORAGE_BUCKET environment variable not set.');
    }
    const bucket = storage.bucket(bucketName);
    const filePath = `jobs/${jobId}/${Date.now()}-${fileName}`;
    const file = bucket.file(filePath);

    const options = {
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
    };

    const [url] = await file.getSignedUrl(options);
    res.status(200).json({ signedUrl: url, filePath: filePath });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL.' });
  }
});

app.post('/disputes/:disputeId/resolve', async (req, res) => {
  const { disputeId } = req.params;
  const { resolution, comment } = req.body; // resolution: 'release_to_provider' or 'refund_client'

  if (!resolution || !comment) {
    return res.status(400).json({ error: 'Resolution decision and comment are required.' });
  }

  const db = admin.firestore();
  const disputeRef = db.collection('disputes').doc(disputeId);

  try {
    const disputeDoc = await disputeRef.get();
    if (!disputeDoc.exists) {
      return res.status(404).json({ error: 'Dispute not found.' });
    }
    const disputeData = disputeDoc.data();
    const jobId = disputeData.jobId;

    const escrowQuery = await db.collection('escrows').where('jobId', '==', jobId).limit(1).get();
    if (escrowQuery.empty) {
      return res.status(404).json({ error: 'Escrow record not found for this job.' });
    }
    const escrowRef = escrowQuery.docs[0].ref;

    // Update documents in a transaction for atomicity
    await db.runTransaction(async (transaction) => {
      transaction.update(disputeRef, { status: 'resolvida', resolution: { decision: resolution, comment: comment, resolvedAt: new Date().toISOString() } });
      transaction.update(db.collection('jobs').doc(jobId), { status: resolution === 'release_to_provider' ? 'concluido' : 'cancelado' });
      transaction.update(escrowRef, { status: resolution === 'release_to_provider' ? 'liberado' : 'reembolsado' });
    });

    res.status(200).json({ message: 'Dispute resolved successfully.' });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    res.status(500).json({ error: 'Failed to resolve dispute.' });
  }
});

// =================================================================
// USERS API ENDPOINTS
// =================================================================

// Get all users
app.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// Get a single user by ID (email)
app.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to retrieve user.' });
  }
});

// Create a new user
app.post('/users', async (req, res) => {
  try {
    const userData = req.body;
    if (!userData.email) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    await db.collection('users').doc(userData.email).set(userData);
    res.status(201).json({ message: 'User created successfully', id: userData.email });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// Update an existing user
app.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = req.body;
    const userRef = db.collection('users').doc(userId);
    await userRef.update(userData);
    res.status(200).json({ message: 'User updated successfully', id: userId });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// Delete a user
app.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    await db.collection('users').doc(userId).delete();
    res.status(200).json({ message: 'User deleted successfully', id: userId });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Get all jobs
app.get('/jobs', async (req, res) => {
  try {
    const { providerId } = req.query;
    let query = db.collection('jobs');
    if (providerId) {
      query = query.where('providerId', '==', providerId);
    }
    const snapshot = await query.get();
    const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error getting jobs:', error);
    res.status(500).json({ error: 'Failed to retrieve jobs.' });
  }
});

// Start the server only if the file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Firestore Backend Service listening on port ${port}`);
  });
}

module.exports = app; // Export for testing