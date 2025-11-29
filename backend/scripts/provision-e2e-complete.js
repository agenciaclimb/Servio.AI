/**
 * Script híbrido: 
 * 1. Cria usuários no Firebase Auth via REST API
 * 2. Faz login com cada um para obter idToken
 * 3. Chama backend /api/users com o token para criar doc Firestore
 */

const https = require('https');

const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8081';

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
  }
];

function httpsPostJson({ hostname, path, headers = {} }, bodyObj) {
  const body = JSON.stringify(bodyObj);
  const fullHeaders = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers };
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'POST', headers: fullHeaders }, (res) => {
      let data = '';
      res.on('data', d => { data += d; });
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

async function signUpOrLogin(email, password) {
  const hostname = 'identitytoolkit.googleapis.com';
  // Try signUp first
  try {
    const signUpPath = `/v1/accounts:signUp?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
    const res = await httpsPostJson({ hostname, path: signUpPath }, { email, password, returnSecureToken: true });
    return { idToken: res.idToken, exists: false };
  } catch (err) {
    const msg = String(err.message || '');
    if (msg.includes('EMAIL_EXISTS')) {
      // Try login
      const loginPath = `/v1/accounts:signInWithPassword?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
      const res = await httpsPostJson({ hostname, path: loginPath }, { email, password, returnSecureToken: true });
      return { idToken: res.idToken, exists: true };
    }
    throw err;
  }
}

function httpRequest({ hostname, path, method, headers, port, isHttps }, bodyObj) {
  const body = bodyObj ? JSON.stringify(bodyObj) : '';
  const fullHeaders = bodyObj ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers } : headers;
  const client = isHttps ? https : require('http');
  
  return new Promise((resolve, reject) => {
    const options = { hostname, path, method, headers: fullHeaders, port: port || (isHttps ? 443 : 80) };
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
        } else {
          reject(new Error(`${method} ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (bodyObj) req.write(body);
    req.end();
  });
}

async function createFirestoreDocViaBackend(user, idToken) {
  const url = new URL(BACKEND_URL);
  const nowIso = new Date().toISOString();
  
  const payload = {
    email: user.email,
    name: user.name,
    type: user.type,
    bio: '',
    location: user.location,
    memberSince: nowIso,
    status: 'ativo',
  };
  if (user.headline) payload.headline = user.headline;
  if (user.specialties) payload.specialties = user.specialties;
  if (user.verificationStatus) payload.verificationStatus = user.verificationStatus;
  if (user.type === 'prestador') payload.providerRate = 0.85;

  return httpRequest({
    hostname: url.hostname,
    path: `/users`,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${idToken}` },
    port: url.port ? Number(url.port) : undefined,
    isHttps: url.protocol === 'https:',
  }, payload);
}

(async () => {
  if (!FIREBASE_API_KEY) {
    console.error('❌ Missing VITE_FIREBASE_API_KEY env variable');
    process.exit(2);
  }

  try {
    for (const u of USERS) {
      console.log(`\n🔐 Processando: ${u.email}`);
      
      // 1. SignUp or Login
      const { idToken, exists } = await signUpOrLogin(u.email, u.password);
      console.log(`  ✅ Auth: ${exists ? 'já existia' : 'criado'}`);
      
      // 2. Create Firestore doc via backend
      try {
        await createFirestoreDocViaBackend(u, idToken);
        console.log(`  ✅ Firestore: documento criado/atualizado`);
      } catch (e) {
        const msg = String(e.message || '');
        if (msg.includes('409') || msg.includes('already exists')) {
          console.log(`  ⚠️  Firestore: documento já existe`);
        } else {
          console.warn(`  ⚠️  Firestore: ${msg} (continuando...)`);
        }
      }
    }
    
    console.log('\n✅ Provisionamento completo!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro:', err);
    process.exit(1);
  }
})();
