/**
 * 🔐 Generate Firebase Auth Test Tokens
 * Para uso em smoke tests E2E autenticados
 * 
 * Uso:
 *   node scripts/generate-test-token.js cliente
 *   node scripts/generate-test-token.js prestador
 *   node scripts/generate-test-token.js prospector
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (usa GOOGLE_APPLICATION_CREDENTIALS ou default)
try {
  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp();
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.log('\n💡 Soluções:');
  console.log('  1. Set GOOGLE_APPLICATION_CREDENTIALS=C:\\secrets\\firebase-service-account.json');
  console.log('  2. Run: gcloud auth application-default login');
  process.exit(1);
}

const role = process.argv[2] || 'cliente';
const validRoles = ['cliente', 'prestador', 'prospector', 'admin'];

if (!validRoles.includes(role)) {
  console.error(`❌ Role inválido: ${role}`);
  console.log(`Roles válidos: ${validRoles.join(', ')}`);
  process.exit(1);
}

const testUsers = {
  cliente: {
    uid: 'test-cliente-uid-001',
    email: 'test-cliente@servio.ai',
    role: 'cliente',
    displayName: 'Test Cliente'
  },
  prestador: {
    uid: 'test-provider-uid-002',
    email: 'test-provider@servio.ai',
    role: 'prestador',
    displayName: 'Test Prestador'
  },
  prospector: {
    uid: 'test-prospector-uid-003',
    email: 'test-prospector@servio.ai',
    role: 'prospector',
    displayName: 'Test Prospector'
  },
  admin: {
    uid: 'test-admin-uid-999',
    email: 'test-admin@servio.ai',
    role: 'admin',
    displayName: 'Test Admin'
  }
};

const userData = testUsers[role];

async function generateToken() {
  try {
    console.log(`\n🔐 Generating custom token for: ${userData.displayName}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   UID: ${userData.uid}\n`);

    // Create custom token with claims
    const customToken = await admin.auth().createCustomToken(userData.uid, {
      role: userData.role,
      email: userData.email
    });

    console.log('✅ Custom Token (expires in 1h):');
    console.log(customToken);
    console.log('\n📋 Para usar em curl:');
    console.log(`   curl -H "Authorization: Bearer ${customToken}" http://localhost:8081/api/jobs`);
    console.log('\n📋 Para usar em PowerShell:');
    console.log(`   $token = "${customToken}"`);
    console.log(`   Invoke-WebRequest -Uri "http://localhost:8081/api/jobs" -Headers @{Authorization="Bearer $token"}`);
    console.log('\n⚠️  IMPORTANTE: Este é um CUSTOM token. Para ID token, use:');
    console.log('   1. Login no frontend com este custom token');
    console.log('   2. Ou use Firebase REST API: https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken');

    // Try to get/create user
    try {
      const userRecord = await admin.auth().getUser(userData.uid);
      console.log(`\n✅ User exists: ${userRecord.email}`);
    } catch (getUserError) {
      if (getUserError.code === 'auth/user-not-found') {
        console.log(`\n⚠️  User not found. Creating user...`);
        try {
          const newUser = await admin.auth().createUser({
            uid: userData.uid,
            email: userData.email,
            emailVerified: true,
            displayName: userData.displayName,
            disabled: false
          });
          console.log(`✅ User created: ${newUser.uid}`);
          
          // Set custom claims
          await admin.auth().setCustomUserClaims(userData.uid, {
            role: userData.role
          });
          console.log(`✅ Custom claims set: role=${userData.role}`);
        } catch (createError) {
          console.error(`❌ Failed to create user:`, createError.message);
        }
      } else {
        console.error(`❌ Error checking user:`, getUserError.message);
      }
    }

  } catch (error) {
    console.error('❌ Error generating token:', error);
    process.exit(1);
  }
}

generateToken().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
});
