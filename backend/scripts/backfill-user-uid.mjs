/**
 * Backfill Script - Task 1.3
 * 
 * Popula o campo `uid` em documentos de usuários existentes no Firestore.
 * 
 * Este script:
 * 1. Lista todos os documentos da coleção `users`
 * 2. Para cada usuário (cujo ID é o email), busca o UserRecord no Firebase Auth via getUserByEmail()
 * 3. Verifica se o campo `uid` já existe no documento Firestore
 * 4. Se não existir, atualiza o documento adicionando `uid: userRecord.uid`
 * 
 * Uso:
 *   node backend/scripts/backfill-user-uid.mjs
 * 
 * Ou via npm script:
 *   npm run user:backfill-uid
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const BATCH_SIZE = 100; // Processar 100 usuários por vez
const DRY_RUN = process.env.DRY_RUN === 'true'; // Modo de simulação (não altera dados)

// ============================================================================
// INICIALIZAÇÃO DO FIREBASE ADMIN
// ============================================================================

console.log('🔧 [Task 1.3] Backfill User UID Script');
console.log('=====================================\n');

if (DRY_RUN) {
  console.log('⚠️  DRY RUN MODE: No changes will be made to Firestore\n');
}

// Verificar se Firebase Admin já foi inicializado
let app;
try {
  app = admin.app();
  console.log('✓ Using existing Firebase Admin app\n');
} catch (error) {
  // Inicializar Firebase Admin
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '../../servio-ai-firebase-adminsdk.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: Service account file not found at:', serviceAccountPath);
    console.error('   Set GOOGLE_APPLICATION_CREDENTIALS environment variable or place file in backend/');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✓ Firebase Admin initialized\n');
}

const db = admin.firestore();
const auth = admin.auth();

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

const stats = {
  totalUsers: 0,
  usersWithUid: 0,
  usersWithoutUid: 0,
  usersUpdated: 0,
  usersSkipped: 0,
  authUsersNotFound: 0,
  errors: [],
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Busca o UserRecord no Firebase Auth pelo email
 */
async function getUserRecordByEmail(email) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

/**
 * Atualiza o documento Firestore adicionando o campo uid
 */
async function updateUserUid(email, uid) {
  if (DRY_RUN) {
    console.log(`   [DRY RUN] Would update ${email} with uid: ${uid}`);
    return;
  }

  await db.collection('users').doc(email).update({
    uid: uid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Processa um batch de usuários
 */
async function processUserBatch(userDocs) {
  for (const doc of userDocs) {
    stats.totalUsers++;
    const email = doc.id;
    const userData = doc.data();

    console.log(`\n[${stats.totalUsers}] Processing: ${email}`);

    // Verificar se uid já existe
    if (userData.uid) {
      console.log('   ✓ uid already exists:', userData.uid);
      stats.usersWithUid++;
      stats.usersSkipped++;
      continue;
    }

    console.log('   ⚠ uid missing, fetching from Firebase Auth...');
    stats.usersWithoutUid++;

    try {
      // Buscar UserRecord no Firebase Auth
      const userRecord = await getUserRecordByEmail(email);

      if (!userRecord) {
        console.log('   ❌ User not found in Firebase Auth');
        stats.authUsersNotFound++;
        stats.errors.push({
          email,
          error: 'User not found in Firebase Auth',
        });
        continue;
      }

      console.log('   ✓ Found uid in Auth:', userRecord.uid);

      // Atualizar documento Firestore
      await updateUserUid(email, userRecord.uid);
      console.log('   ✅ Document updated successfully');
      stats.usersUpdated++;

    } catch (error) {
      console.error(`   ❌ Error processing ${email}:`, error.message);
      stats.errors.push({
        email,
        error: error.message,
      });
    }
  }
}

// ============================================================================
// SCRIPT PRINCIPAL
// ============================================================================

async function main() {
  console.log('📋 Starting backfill process...\n');
  console.log('Configuration:');
  console.log(`  - Batch Size: ${BATCH_SIZE}`);
  console.log(`  - Dry Run: ${DRY_RUN}`);
  console.log('');

  try {
    // Listar todos os documentos da coleção users
    console.log('📚 Fetching users from Firestore...\n');

    const usersSnapshot = await db.collection('users').get();
    const totalDocs = usersSnapshot.size;

    console.log(`✓ Found ${totalDocs} user documents\n`);
    console.log('─'.repeat(60));

    if (totalDocs === 0) {
      console.log('\n⚠️  No users found in Firestore. Nothing to do.');
      return;
    }

    // Processar documentos em batches
    const batches = [];
    let currentBatch = [];

    usersSnapshot.forEach(doc => {
      currentBatch.push(doc);
      if (currentBatch.length === BATCH_SIZE) {
        batches.push([...currentBatch]);
        currentBatch = [];
      }
    });

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    console.log(`\n📦 Processing ${batches.length} batch(es)...\n`);

    for (let i = 0; i < batches.length; i++) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Batch ${i + 1}/${batches.length}`);
      console.log('='.repeat(60));
      await processUserBatch(batches[i]);
    }

    // ========================================================================
    // RELATÓRIO FINAL
    // ========================================================================

    console.log('\n\n' + '='.repeat(60));
    console.log('📊 BACKFILL SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nTotal Users Processed:       ${stats.totalUsers}`);
    console.log(`Users with uid (before):     ${stats.usersWithUid}`);
    console.log(`Users without uid (before):  ${stats.usersWithoutUid}`);
    console.log(`Users Updated:               ${stats.usersUpdated} ✅`);
    console.log(`Users Skipped (had uid):     ${stats.usersSkipped}`);
    console.log(`Auth Users Not Found:        ${stats.authUsersNotFound} ⚠️`);
    console.log(`Errors:                      ${stats.errors.length} ❌`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err.email}: ${err.error}`);
      });
    }

    // Salvar relatório em JSON
    const reportPath = path.join(__dirname, `backfill-user-uid-report-${Date.now()}.json`);
    const report = {
      timestamp: new Date().toISOString(),
      dryRun: DRY_RUN,
      stats,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);

    console.log('\n✅ Backfill process completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Fatal error during backfill:', error);
    process.exit(1);
  }
}

// ============================================================================
// EXECUTAR SCRIPT
// ============================================================================

main()
  .then(() => {
    console.log('🎉 Script finished. Exiting...');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
