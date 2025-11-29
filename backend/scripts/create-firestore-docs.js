/**
 * Criar documentos Firestore para usuários E2E que já existem no Firebase Auth.
 * Usa Firebase Admin inicializado no backend.
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin se ainda não foi
if (!admin.apps || admin.apps.length === 0) {
  try {
    // Tentar usar credenciais do ambiente
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0737507616';
    admin.initializeApp({
      projectId: projectId,
    });
    console.log(`[INIT] Firebase Admin inicializado com projectId=${projectId}`);
  } catch (e) {
    console.error('[INIT] Erro ao inicializar Firebase Admin:', e.message);
    console.log('[INIT] Continuando sem Admin SDK (apenas leitura/escrita direta)');
  }
}

const db = admin.firestore();

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

(async () => {
  try {
    const nowIso = new Date().toISOString();
    
    for (const u of USERS) {
      const docRef = db.collection('users').doc(u.email);
      const payload = {
        email: u.email,
        name: u.name,
        type: u.type,
        bio: '',
        location: u.location,
        memberSince: nowIso,
        status: 'ativo',
        ...(u.headline && { headline: u.headline }),
        ...(u.specialties && { specialties: u.specialties }),
        ...(u.verificationStatus && { verificationStatus: u.verificationStatus }),
        ...(u.providerRate && { providerRate: u.providerRate }),
      };
      
      await docRef.set(payload, { merge: true });
      console.log(`✅ Documento Firestore criado/atualizado para: ${u.email}`);
    }
    
    console.log('\n✅ Todos os documentos Firestore foram criados com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao criar documentos Firestore:', err);
    process.exit(1);
  }
})();
