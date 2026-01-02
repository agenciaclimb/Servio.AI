/**
 * Provision E2E test users using Firebase Auth REST API + backend /api/users.
 * No Firebase Admin credentials required.
 *
 * Requires env:
 *  - VITE_FIREBASE_API_KEY (or FIREBASE_WEB_API_KEY)
 * Optional env:
 *  - BACKEND_URL (default: http://localhost:8081)
 *
 * Users (email/password):
 *  - e2e-cliente@servio.ai / SenhaE2E!123 (cliente)
 *  - e2e-prestador@servio.ai / SenhaE2E!123 (prestador)
 *  - admin@servio.ai / AdminE2E!123      (admin)
 */

const https = require('https');

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
    verificationStatus: 'verificado',
  },
  {
    email: 'admin@servio.ai',
    password: 'AdminE2E!123',
    type: 'admin',
    name: 'E2E Admin',
    location: 'São Paulo',
  },
];

function firestoreUserPayload(u) {
  const nowIso = new Date().toISOString();
  const payload = {
    email: u.email,
    name: u.name,
    type: u.type,
    bio: '',
    location: u.location,
    memberSince: nowIso,
    status: 'ativo',
  };
  // Only add fields if they have values (avoid undefined)
  if (u.headline) payload.headline = u.headline;
  if (u.specialties) payload.specialties = u.specialties;
  if (u.verificationStatus) payload.verificationStatus = u.verificationStatus;
  if (u.type === 'prestador') payload.providerRate = 0.85;
  return payload;
}

function httpsPostJson({ hostname, path, method = 'POST', headers = {} }, bodyObj) {
  const body = JSON.stringify(bodyObj);
  const fullHeaders = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    ...headers,
  };
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method, headers: fullHeaders }, res => {
      let data = '';
      res.on('data', d => {
        data += d;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function signUpWithEmailPassword(apiKey, email, password) {
  // https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=[API_KEY]
  const hostname = 'identitytoolkit.googleapis.com';
  const path = `/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`;
  try {
    const res = await httpsPostJson(
      { hostname, path },
      { email, password, returnSecureToken: true }
    );
    return { ok: true, res };
  } catch (err) {
    // If already exists, treat as success for idempotency
    const msg = String(err.message || '');
    if (msg.includes('EMAIL_EXISTS')) {
      return { ok: true, exists: true };
    }
    throw err;
  }
}

function parseUrl(u) {
  const { hostname, pathname, protocol, port } = new URL(u);
  return {
    hostname,
    pathPrefix: pathname.endsWith('/') ? pathname.slice(0, -1) : pathname,
    isHttps: protocol === 'https:',
    port,
  };
}

async function createFirestoreUserDoc(backendUrl, payload) {
  const { hostname, pathPrefix, isHttps, port } = parseUrl(backendUrl);
  // Use /users instead of /api/users to avoid prospector logic
  const path = `${pathPrefix || ''}/users`;
  const body = payload;
  const method = 'POST';

  return new Promise((resolve, reject) => {
    const client = isHttps ? require('https') : require('http');
    const postData = JSON.stringify(body);
    const options = {
      hostname,
      port: port ? Number(port) : isHttps ? 443 : 80,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    const req = client.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch {
            resolve({});
          }
        } else {
          reject(new Error(`Backend ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

(async () => {
  try {
    const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) {
      console.error('Missing VITE_FIREBASE_API_KEY (or FIREBASE_WEB_API_KEY) env.');
      process.exit(2);
    }
    const backendUrl =
      process.env.BACKEND_URL || process.env.VITE_BACKEND_API_URL || 'http://localhost:8081';

    for (const u of USERS) {
      try {
        await signUpWithEmailPassword(apiKey, u.email, u.password);
        console.log(`[AUTH] Ready: ${u.email}`);
      } catch (e) {
        console.error(`[AUTH] Failed for ${u.email}:`, e.message);
        throw e;
      }

      try {
        const fsPayload = firestoreUserPayload(u);
        await createFirestoreUserDoc(backendUrl, fsPayload);
        console.log(`[FS] Upserted Firestore doc for: ${u.email}`);
      } catch (e) {
        const msg = String(e.message || '');
        if (msg.includes('Already exists') || msg.includes('already exists')) {
          console.log(`[FS] Already existed: ${u.email}`);
        } else {
          console.warn(`[FS] Failed to create user doc for ${u.email}: ${msg}`);
          console.log('[FS] Continuing anyway (user may exist in Firestore)...');
        }
      }
    }

    console.log('E2E users provisioned (REST path).');
    process.exit(0);
  } catch (err) {
    console.error('Provisioning failed:', err);
    process.exit(1);
  }
})();
