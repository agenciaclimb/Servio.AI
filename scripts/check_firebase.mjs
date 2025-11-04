// Script para verificar configuração do Firebase
// Usage: node scripts/check_firebase.mjs

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🔍 Verificando configuração do Firebase...\n');

// Ler o arquivo .env.local
try {
  const envPath = join(__dirname, '..', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  
  // Extrair variáveis Firebase
  const vars = {
    'VITE_FIREBASE_API_KEY': envContent.match(/VITE_FIREBASE_API_KEY=(.+)/)?.[1]?.trim(),
    'VITE_FIREBASE_AUTH_DOMAIN': envContent.match(/VITE_FIREBASE_AUTH_DOMAIN=(.+)/)?.[1]?.trim(),
    'VITE_FIREBASE_PROJECT_ID': envContent.match(/VITE_FIREBASE_PROJECT_ID=(.+)/)?.[1]?.trim(),
    'VITE_FIREBASE_STORAGE_BUCKET': envContent.match(/VITE_FIREBASE_STORAGE_BUCKET=(.+)/)?.[1]?.trim(),
    'VITE_FIREBASE_MESSAGING_SENDER_ID': envContent.match(/VITE_FIREBASE_MESSAGING_SENDER_ID=(.+)/)?.[1]?.trim(),
    'VITE_FIREBASE_APP_ID': envContent.match(/VITE_FIREBASE_APP_ID=(.+)/)?.[1]?.trim(),
  };
  
  console.log('📋 Variáveis encontradas no .env.local:\n');
  
  let hasIssues = false;
  for (const [key, value] of Object.entries(vars)) {
    const status = value ? '✅' : '❌';
    const display = value ? `${value.slice(0, 20)}...` : 'NÃO DEFINIDA';
    console.log(`${status} ${key}: ${display}`);
    if (!value) hasIssues = true;
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (hasIssues) {
    console.log('\n❌ PROBLEMA ENCONTRADO: Algumas variáveis estão faltando!\n');
    console.log('📝 SOLUÇÃO SIMPLES (copie e cole):\n');
    console.log('1. Abra este link no navegador:');
    console.log('   https://console.firebase.google.com/project/servioai/settings/general\n');
    console.log('2. Role até "Seus apps" → clique no ícone </> (Web)');
    console.log('3. Você verá um código assim:\n');
    console.log('   const firebaseConfig = {');
    console.log('     apiKey: "AIza...",');
    console.log('     authDomain: "servioai.firebaseapp.com",');
    console.log('     ...');
    console.log('   };\n');
    console.log('4. Copie APENAS os valores (entre aspas) e cole aqui:');
    console.log('   - apiKey → vai em VITE_FIREBASE_API_KEY=');
    console.log('   - authDomain → vai em VITE_FIREBASE_AUTH_DOMAIN=');
    console.log('   - projectId → vai em VITE_FIREBASE_PROJECT_ID=');
    console.log('   - storageBucket → vai em VITE_FIREBASE_STORAGE_BUCKET=');
    console.log('   - messagingSenderId → vai em VITE_FIREBASE_MESSAGING_SENDER_ID=');
    console.log('   - appId → vai em VITE_FIREBASE_APP_ID=\n');
    console.log('5. Me envie os valores que eu crio o arquivo correto para você!\n');
  } else {
    console.log('\n✅ Todas as variáveis estão presentes!');
    console.log('\n🔧 Agora vamos verificar se o Firebase Auth está habilitado...\n');
    console.log('📝 PRÓXIMO PASSO (copie e cole):\n');
    console.log('1. Abra este link:');
    console.log('   https://console.firebase.google.com/project/servioai/authentication/providers\n');
    console.log('2. Verifique se "Email/senha" está ATIVADO (botão azul)');
    console.log('3. Se estiver desativado, clique nele e ative!\n');
    console.log('4. Clique em "Configurações" (Settings) no topo');
    console.log('5. Role até "Domínios autorizados" (Authorized domains)');
    console.log('6. Adicione: localhost\n');
    console.log('7. Me avise quando terminar que eu rebuildo o app!\n');
  }
  
} catch (e) {
  console.error('❌ Erro ao ler .env.local:', e.message);
}
