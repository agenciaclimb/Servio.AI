/**
 * Provision E2E test users in Firebase Auth + Firestore using email as document ID.
 * Users:
 *  - e2e-cliente@servio.ai (cliente)
 *  - e2e-prestador@servio.ai (prestador)
 *  - admin@servio.ai (admin)
 *
 * Safe to run multiple times (idempotent). Requires Firebase Admin credentials.
 * If running locally ensure GOOGLE_APPLICATION_CREDENTIALS is set or default app can initialize.
 */

const admin = require('firebase-admin');

async function ensureInitialized() {
  if (!admin.apps || admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    try {
      if (projectId) {
        admin.initializeApp({ projectId });
        console.log(`[INIT] Firebase Admin initialized with projectId=${projectId}`);
      } else {
        admin.initializeApp();
        console.log('[INIT] Firebase Admin initialized with default credentials');
      }
    } catch (e) {
      console.warn('[INIT] Firebase Admin initialization fallback', e.message);
      // Attempt secondary fallback specifying only projectId placeholder if none provided
      if (!projectId) {
        admin.initializeApp({ projectId: 'servio-ai-dev' });
        console.log('[INIT] Fallback projectId servio-ai-dev used');
      }
    }
  }
}

const USERS = [
  {
    email: 'e2e-cliente@servio.ai',
    password: 'SenhaE2E!123',
    type: 'cliente',
    name: 'E2E Cliente',
    location: 'São Paulo',
  },
  {
    email: 'e2e-prestador@servio.ai',
    password: 'SenhaE2E!123',
    type: 'prestador',
    name: 'E2E Prestador',
    location: 'São Paulo',
    headline: 'Prestador E2E',
    specialties: ['limpeza', 'reparos'],
    verificationStatus: 'verificado'
  },
  {
    email: 'admin@servio.ai',
    password: 'AdminE2E!123',
    type: 'admin',
    name: 'E2E Admin',
    location: 'São Paulo'
  }
];

function firestoreUserPayload(user) {
  const nowIso = new Date().toISOString();
  return {
    email: user.email,
    name: user.name,
    type: user.type,
    bio: '',
    location: user.location,
    memberSince: nowIso,
    status: 'ativo',
    headline: user.headline || undefined,
    specialties: user.specialties || undefined,
    verificationStatus: user.verificationStatus || undefined,
    providerRate: user.type === 'prestador' ? 0.85 : undefined,
  };
}

async function provisionUser(u, auth, db) {
  let authRecord;
  try {
    authRecord = await auth.getUserByEmail(u.email);
    console.log(`[AUTH] User already exists: ${u.email}`);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      authRecord = await auth.createUser({ email: u.email, password: u.password, displayName: u.name });
      console.log(`[AUTH] Created user: ${u.email}`);
    } else {
      throw e;
    }
  }

  const docRef = db.collection('users').doc(u.email);
  const snap = await docRef.get();
  if (!snap.exists) {
    await docRef.set(firestoreUserPayload(u));
    console.log(`[FS] Created Firestore doc for: ${u.email}`);
  } else {
    console.log(`[FS] Firestore doc already exists: ${u.email}`);
  }

  // Optional: set custom claims for admin
  if (u.type === 'admin') {
    try {
      await auth.setCustomUserClaims(authRecord.uid, { admin: true });
      console.log('[AUTH] Set custom claim admin=true');
    } catch (e) {
      console.warn('[AUTH] Failed to set admin claim', e.message);
    }
  }
}

(async () => {
  try {
    await ensureInitialized();
    const auth = admin.auth();
    const db = admin.firestore();

    for (const u of USERS) {
      await provisionUser(u, auth, db);
    }

    console.log('E2E user provisioning complete.');
    process.exit(0);
  } catch (err) {
    console.error('Failed provisioning E2E users:', err);
    process.exit(1);
  }
})();
