/**
 * Diagnóstico detalhado dos endpoints Firestore do backend
 * Testa conectividade e analisa erros específicos
 */

const BASE_URL = 'https://servio-backend-h5ogjon7aa-uw.a.run.app';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testWithDetails(endpoint, method = 'GET', body = null) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}Testing: ${method} ${endpoint}${colors.reset}`);
  
  try {
    const startTime = Date.now();
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Servio-Diagnostic-Script/1.0'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const duration = Date.now() - startTime;
    
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    console.log(`Status: ${response.status} ${response.ok ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Content-Type: ${contentType || 'N/A'}`);
    
    // Headers relevantes
    const relevantHeaders = ['x-cloud-trace-context', 'x-powered-by', 'server'];
    console.log('\nRelevant Headers:');
    relevantHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        console.log(`  ${header}: ${value}`);
      }
    });
    
    console.log('\nResponse Body:');
    if (typeof responseData === 'object') {
      console.log(JSON.stringify(responseData, null, 2));
    } else {
      console.log(responseData);
    }
    
    // Análise específica para erros Firestore
    if (response.status === 500 && responseData.error) {
      console.log(`\n${colors.yellow}⚠ Análise do Erro:${colors.reset}`);
      
      if (responseData.error.includes('retrieve users') || responseData.error.includes('retrieve jobs')) {
        console.log('  • Tipo: Erro de leitura Firestore');
        console.log('  • Possíveis causas:');
        console.log('    1. Service Account do Cloud Run sem permissões Firestore');
        console.log('    2. Firestore Security Rules bloqueando acesso backend');
        console.log('    3. Coleções "users" ou "jobs" não existem');
        console.log('    4. Problema de conectividade Firestore → Cloud Run');
        console.log('\n  • Verificações necessárias:');
        console.log('    □ IAM: Cloud Run SA precisa de roles/datastore.user');
        console.log('    □ Security Rules: Permitir acesso para backend');
        console.log('    □ Firestore: Confirmar existência das coleções');
      }
    }
    
    return { success: response.ok, status: response.status, data: responseData };
    
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    console.log(`Stack: ${error.stack}`);
    return { success: false, error: error.message };
  }
}

async function checkCloudRunServiceAccount() {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}Verificando configuração do Cloud Run${colors.reset}\n`);
  
  console.log('Para verificar a Service Account do Cloud Run:');
  console.log(`${colors.yellow}gcloud run services describe servio-backend --region=us-west1 --format="value(spec.template.spec.serviceAccountName)"${colors.reset}\n`);
  
  console.log('Para adicionar permissões Firestore:');
  console.log(`${colors.yellow}gcloud projects add-iam-policy-binding gen-lang-client-0737507616 \\`);
  console.log(`  --member="serviceAccount:[SA_EMAIL]" \\`);
  console.log(`  --role="roles/datastore.user"${colors.reset}\n`);
}

async function checkFirestoreCollections() {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}Verificando coleções no Firestore${colors.reset}\n`);
  
  console.log('Acesse o Console Firebase:');
  console.log(`${colors.yellow}https://console.firebase.google.com/project/gen-lang-client-0737507616/firestore/databases/-default-/data${colors.reset}\n`);
  
  console.log('Verifique se existem as coleções:');
  console.log('  □ users');
  console.log('  □ jobs');
  console.log('  □ (outras coleções necessárias)');
}

// ============================================================
// EXECUÇÃO PRINCIPAL
// ============================================================

console.log(`${colors.green}
╔════════════════════════════════════════════════════════════╗
║   DIAGNÓSTICO FIRESTORE - SERVIO.AI BACKEND               ║
║   Cloud Run: servio-backend                                ║
║   Project: gen-lang-client-0737507616                      ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

// Teste 1: Health Check
await testWithDetails('/');

// Teste 2: Users endpoint (Firestore)
await testWithDetails('/users');

// Teste 3: Jobs endpoint (Firestore)
await testWithDetails('/jobs');

// Teste 4: Generate Upload URL (Cloud Storage - funciona)
await testWithDetails('/generate-upload-url', 'POST', {
  fileName: 'diagnostic-test.jpg',
  contentType: 'image/jpeg'
});

// Informações adicionais
await checkCloudRunServiceAccount();
await checkFirestoreCollections();

console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.green}Diagnóstico completo!${colors.reset}\n`);
