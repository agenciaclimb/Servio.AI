import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account
const serviceAccountPath = join(__dirname, '..', 'doc', 'gen-lang-client-0737507616-25bf95a3e2b9.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function createProspectorUser() {
  const email = 'barbara@navikafacilities.com.br';
  const password = 'BJ130850';
  const name = 'Barbara (Prospector Test)';

  try {
    console.log('🔍 Verificando se usuário já existe...');
    
    // Check if user exists in Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`✅ Usuário Auth já existe: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('📝 Criando usuário no Firebase Auth...');
        userRecord = await auth.createUser({
          email,
          password,
          displayName: name,
          emailVerified: true
        });
        console.log(`✅ Usuário Auth criado: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // Check if user exists in Firestore
    const userDoc = await db.collection('users').doc(email).get();
    
    if (userDoc.exists) {
      console.log('📝 Atualizando tipo de usuário para prospector...');
      await db.collection('users').doc(email).update({
        type: 'prospector',
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Usuário atualizado para prospector!');
    } else {
      console.log('📝 Criando documento de usuário no Firestore...');
      await db.collection('users').doc(email).set({
        email,
        name,
        type: 'prospector',
        phone: '',
        location: '',
        bio: 'Prospector de teste para validar melhorias Fase 1',
        profilePicture: '',
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Documento de usuário criado!');
    }

    // Create or update prospector stats
    const prospectorDoc = await db.collection('prospectors').doc(email).get();
    const referralCode = `BARBARA${Date.now().toString().slice(-6)}`;
    
    if (!prospectorDoc.exists) {
      console.log('📝 Criando stats de prospector...');
      await db.collection('prospectors').doc(email).set({
        prospectorId: email,
        totalRecruits: 12,
        activeRecruits: 10,
        totalCommissionsEarned: 2450.75,
        pendingCommissions: 320.0,
        averageCommissionPerRecruit: 204.23,
        currentBadge: 'Ouro',
        currentBadgeName: 'Ouro',
        referralCode: referralCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Stats de prospector criadas!');
    } else {
      console.log('✅ Stats de prospector já existem!');
    }

    // Create referral link
    console.log('📝 Criando link de indicação...');
    const shortCode = referralCode.toLowerCase().slice(0, 6);
    const baseUrl = 'https://servio-ai.com';
    const fullUrl = `${baseUrl}/?ref=${email}&utm_source=prospector&utm_medium=referral&utm_campaign=phase1&utm_content=${email}`;
    const shortUrl = `${baseUrl}/r/${shortCode}`;
    
    await db.collection('referral_links').doc(email).set({
      prospectorId: email,
      prospectorName: name,
      fullUrl: fullUrl,
      shortCode: shortCode,
      shortUrl: shortUrl,
      utmParams: {
        source: 'prospector',
        medium: 'referral',
        campaign: 'phase1',
        content: email
      },
      clicks: 0,
      conversions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Link de indicação criado!');

    console.log('\n🎉 SUCESSO! Usuário prospector configurado:');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);
    console.log(`🌐 URL: https://gen-lang-client-0737507616.web.app`);
    console.log('\n✅ Agora você pode:');
    console.log('1. Fazer logout do admin');
    console.log('2. Fazer login com essas credenciais');
    console.log('3. Ver o ProspectorDashboard com todas as melhorias Fase 1!');
    console.log('\n🎯 Features para testar:');
    console.log('✓ Tour guiado (5 steps) - primeira vez que acessar');
    console.log('✓ Barra de ações rápidas (topo azul-roxa)');
    console.log('✓ Dashboard unificado (3 colunas sem tabs)');
    console.log('✓ Smart Actions, Performance metrics, Weekly Goals');

  } catch (error) {
    console.error('❌ Erro ao criar prospector:', error);
    process.exit(1);
  }
}

createProspectorUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  });
