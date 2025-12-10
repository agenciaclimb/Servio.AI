#!/usr/bin/env node

/**
 * Script: Backfill Custom Claims
 * 
 * Objetivo: Sincronizar custom claims do Firebase Auth com base nos dados do Firestore
 * 
 * Use este script quando:
 * - Migrar usuários existentes para o sistema de custom claims
 * - Corrigir custom claims inconsistentes
 * - Atualizar roles em massa
 * 
 * Execução:
 * node backend/scripts/backfill-custom-claims.mjs
 * 
 * Requisitos:
 * - Credenciais Firebase Admin SDK configuradas
 * - Variável de ambiente GOOGLE_APPLICATION_CREDENTIALS ou serviceAccountKey.json
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
try {
  // Tentar usar service account key se existir
  const serviceAccountPath = join(__dirname, '..', '..', 'serviceAccountKey.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin inicializado com service account');
} catch (error) {
  // Fallback para Application Default Credentials
  admin.initializeApp();
  console.log('✅ Firebase Admin inicializado com credenciais padrão');
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * Mapeamento de tipos Firestore → roles Firebase Auth
 * 
 * Baseado na convenção do Servio.AI:
 * - Firestore users.type: 'cliente' | 'prestador' | 'admin' | 'prospector'
 * - Firebase Auth custom claim: { role: 'cliente' | 'prestador' | 'admin' | 'prospector' }
 */
const TYPE_TO_ROLE_MAP = {
  'cliente': 'cliente',
  'prestador': 'prestador',
  'admin': 'admin',
  'prospector': 'prospector'
};

/**
 * Validar se o tipo é válido
 */
function isValidType(type) {
  return Object.keys(TYPE_TO_ROLE_MAP).includes(type);
}

/**
 * Processar um lote de usuários do Firebase Auth
 */
async function processUserBatch(users) {
  const results = {
    success: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  for (const user of users) {
    const uid = user.uid;
    const email = user.email;

    try {
      // Buscar documento do usuário no Firestore
      // Convenção: usar email como document ID
      const userDoc = await db.collection('users').doc(email).get();

      if (!userDoc.exists) {
        console.log(`⚠️  [${email}] Documento não encontrado no Firestore - SKIP`);
        results.skipped++;
        results.details.push({ email, status: 'skipped', reason: 'no_firestore_doc' });
        continue;
      }

      const userData = userDoc.data();
      const userType = userData.type;

      // Validar tipo
      if (!userType || !isValidType(userType)) {
        console.log(`⚠️  [${email}] Tipo inválido ou ausente: "${userType}" - SKIP`);
        results.skipped++;
        results.details.push({ email, status: 'skipped', reason: 'invalid_type', type: userType });
        continue;
      }

      // Mapear tipo para role
      const role = TYPE_TO_ROLE_MAP[userType];

      // Verificar se custom claim já existe e está correto
      const currentClaims = user.customClaims || {};
      if (currentClaims.role === role) {
        console.log(`✓  [${email}] Custom claim já correto: role=${role} - SKIP`);
        results.skipped++;
        results.details.push({ email, status: 'skipped', reason: 'already_correct', role });
        continue;
      }

      // Atribuir custom claim
      await auth.setCustomUserClaims(uid, { role });

      console.log(`✅ [${email}] Custom claim atualizado: role=${role} (was: ${currentClaims.role || 'none'})`);
      results.success++;
      results.details.push({ 
        email, 
        status: 'success', 
        role, 
        previousRole: currentClaims.role || null 
      });

    } catch (error) {
      console.error(`❌ [${email}] Erro ao processar:`, error.message);
      results.errors++;
      results.details.push({ email, status: 'error', error: error.message });
    }
  }

  return results;
}

/**
 * Função principal
 */
async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║   BACKFILL CUSTOM CLAIMS — SERVIO.AI                      ║');
  console.log('║   Sincronizando Firebase Auth com Firestore               ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const startTime = Date.now();

  try {
    // Estatísticas globais
    const stats = {
      total: 0,
      success: 0,
      skipped: 0,
      errors: 0,
      allDetails: []
    };

    // Listar todos os usuários (paginado)
    let pageToken;
    let pageCount = 0;

    do {
      pageCount++;
      console.log(`\n📄 Processando página ${pageCount}...`);

      // Listar até 1000 usuários por página (limite da API)
      const listUsersResult = await auth.listUsers(1000, pageToken);
      const users = listUsersResult.users;

      console.log(`   Encontrados ${users.length} usuários nesta página`);

      // Processar lote
      const batchResults = await processUserBatch(users);

      // Acumular estatísticas
      stats.total += users.length;
      stats.success += batchResults.success;
      stats.skipped += batchResults.skipped;
      stats.errors += batchResults.errors;
      stats.allDetails.push(...batchResults.details);

      // Próxima página
      pageToken = listUsersResult.pageToken;

    } while (pageToken);

    // Relatório final
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    RESUMO FINAL                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  Total de usuários processados: ${stats.total}`);
    console.log(`  ✅ Sucesso: ${stats.success}`);
    console.log(`  ⚠️  Ignorados: ${stats.skipped}`);
    console.log(`  ❌ Erros: ${stats.errors}`);
    console.log(`  ⏱️  Tempo total: ${duration}s`);
    console.log('');

    // Salvar relatório detalhado (opcional)
    if (stats.allDetails.length > 0) {
      const reportPath = join(__dirname, `backfill-report-${Date.now()}.json`);
      const { writeFileSync } = await import('fs');
      writeFileSync(reportPath, JSON.stringify(stats, null, 2));
      console.log(`📊 Relatório detalhado salvo em: ${reportPath}`);
      console.log('');
    }

    // Exit code baseado em erros
    process.exit(stats.errors > 0 ? 1 : 0);

  } catch (error) {
    console.error('');
    console.error('❌ ERRO FATAL:', error);
    console.error('');
    process.exit(1);
  }
}

// Executar
main();
