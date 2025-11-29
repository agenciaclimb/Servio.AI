/**
 * Script simplificado: cria documentos Firestore via fetch/node-fetch
 * para usuários E2E que já existem no Auth mas não têm doc no Firestore.
 * 
 * Usa Firestore REST API diretamente (sem Admin SDK).
 */

const https = require('https');

const PROJECT_ID = 'gen-lang-client-0737507616';
const COLLECTION = 'users';

const USERS = [
  {
    email: 'e2e-cliente@servio.ai',
    name: 'E2E Cliente',
    type: 'cliente',
    location: 'São Paulo',
  },
  {
    email: 'e2e-prestador@servio.ai',
    name: 'E2E Prestador',
    type: 'prestador',
    location: 'São Paulo',
    headline: 'Prestador E2E',
    specialties: ['limpeza', 'reparos'],
    verificationStatus: 'verificado',
    providerRate: 0.85,
  },
  {
    email: 'admin@servio.ai',
    name: 'E2E Admin',
    type: 'admin',
    location: 'São Paulo',
  }
];

function toFirestoreValue(val) {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  return { nullValue: null };
}

function buildFirestoreDoc(user) {
  const nowIso = new Date().toISOString();
  const fields = {
    email: toFirestoreValue(user.email),
    name: toFirestoreValue(user.name),
    type: toFirestoreValue(user.type),
    bio: toFirestoreValue(''),
    location: toFirestoreValue(user.location),
    memberSince: toFirestoreValue(nowIso),
    status: toFirestoreValue('ativo'),
  };
  if (user.headline) fields.headline = toFirestoreValue(user.headline);
  if (user.specialties) fields.specialties = toFirestoreValue(user.specialties);
  if (user.verificationStatus) fields.verificationStatus = toFirestoreValue(user.verificationStatus);
  if (user.providerRate) fields.providerRate = toFirestoreValue(user.providerRate);
  return { fields };
}

async function createOrUpdateDoc(email, docPayload) {
  // PATCH to create/update: https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents/{collection}/{documentId}
  const path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(email)}`;
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(docPayload);
    const options = {
      hostname: 'firestore.googleapis.com',
      path: path,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Firestore REST ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

(async () => {
  console.log('⚠️  AVISO: Este script usa Firestore REST API sem autenticação.');
  console.log('⚠️  Certifique-se de que as regras do Firestore permitem escrita pública ou use outro método.\n');
  
  try {
    for (const u of USERS) {
      try {
        const doc = buildFirestoreDoc(u);
        await createOrUpdateDoc(u.email, doc);
        console.log(`✅ Documento criado/atualizado para: ${u.email}`);
      } catch (e) {
        console.error(`❌ Falha para ${u.email}:`, e.message);
      }
    }
    console.log('\n✅ Processo concluído!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro geral:', err);
    process.exit(1);
  }
})();
