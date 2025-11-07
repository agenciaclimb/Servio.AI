#!/usr/bin/env node
/**
 * Script para criar usuários de teste no Firebase Auth e Firestore
 * 
 * Uso:
 * 1. Autentique no Firebase: firebase login
 * 2. Execute: node scripts/create_test_users.mjs
 * 
 * Criará 3 usuários:
 * - cliente@servio.ai (senha: 123456) - Cliente
 * - prestador@servio.ai (senha: 123456) - Prestador  
 * - admin@servio.ai (senha: 123456) - Admin
 */

import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
try {
  const serviceAccountPath = resolve(__dirname, '../doc/gen-lang-client-0737507616-25bf95a3e2b9.json');
  const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'gen-lang-client-0737507616'
  });
  
  console.log('✅ Firebase Admin inicializado');
} catch (err) {
  console.error('❌ Erro ao inicializar Firebase Admin:', err.message);
  console.error('   Certifique-se de que doc/gen-lang-client-0737507616-25bf95a3e2b9.json existe');
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

const testUsers = [
  {
    email: 'cliente@servio.ai',
    password: '123456',
    displayName: 'Cliente Teste',
    type: 'cliente',
    status: 'ativo',
    phone: '+55 11 91234-5678',
    location: {
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil'
    }
  },
  {
    email: 'prestador@servio.ai',
    password: '123456',
    displayName: 'Prestador Teste',
    type: 'prestador',
    status: 'aprovado',
    phone: '+55 11 98765-4321',
    location: {
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil'
    },
    categories: ['Instalação', 'Manutenção', 'Limpeza'],
    rating: 4.8,
    reviewCount: 25,
    completedJobs: 30
  },
  {
    email: 'admin@servio.ai',
    password: '123456',
    displayName: 'Admin Sistema',
    type: 'admin',
    status: 'ativo',
    phone: '+55 11 99999-9999',
    location: {
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil'
    }
  }
];

async function createUser(userData) {
  const { email, password, displayName, ...firestoreData } = userData;
  
  try {
    // 1. Criar usuário no Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`ℹ️  Usuário ${email} já existe no Auth (uid: ${userRecord.uid})`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email,
          password,
          displayName,
          emailVerified: true // Para ambiente de teste
        });
        console.log(`✅ Criado no Auth: ${email} (uid: ${userRecord.uid})`);
      } else {
        throw err;
      }
    }
    
    // 2. Criar/atualizar documento no Firestore (coleção users)
    const userDoc = {
      email,
      name: displayName,
      ...firestoreData,
      memberSince: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(email).set(userDoc, { merge: true });
    console.log(`✅ Criado/Atualizado no Firestore: users/${email}`);
    
    return { success: true, uid: userRecord.uid, email };
  } catch (err) {
    console.error(`❌ Erro ao criar ${email}:`, err.message);
    return { success: false, email, error: err.message };
  }
}

async function main() {
  console.log('🚀 Iniciando criação de usuários de teste...\n');
  
  const results = [];
  for (const userData of testUsers) {
    const result = await createUser(userData);
    results.push(result);
    console.log(''); // Linha em branco entre usuários
  }
  
  console.log('📊 Resumo:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`   ✅ Sucesso: ${successful}`);
  console.log(`   ❌ Falha: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Usuários que falharam:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.email}: ${r.error}`);
    });
  }
  
  console.log('\n✅ Script concluído!');
  console.log('   Agora você pode fazer login com:');
  console.log('   - cliente@servio.ai / 123456');
  console.log('   - prestador@servio.ai / 123456');
  console.log('   - admin@servio.ai / 123456');
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('💥 Erro fatal:', err);
  process.exit(1);
});
