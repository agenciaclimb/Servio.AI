// Script para diagnosticar EXATAMENTE qual é o problema do backend
// Faz chamadas HTTP e analisa respostas

import https from 'https';

const BACKEND_URL = 'https://servio-backend-h5ogjon7aa-uw.a.run.app';

async function testEndpoint(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data),
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ error: error.message });
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO BACKEND\n');
  console.log('=' .repeat(60));

  // 1. Health check
  console.log('\n1️⃣  HEALTH CHECK:');
  const health = await testEndpoint('/');
  console.log(`Status: ${health.status}`);
  console.log(`Resposta: ${JSON.stringify(health.body, null, 2)}`);

  // 2. GET /users (deve falhar)
  console.log('\n2️⃣  GET /users (esperado: 500):');
  const users = await testEndpoint('/users');
  console.log(`Status: ${users.status}`);
  console.log(`Resposta: ${JSON.stringify(users.body, null, 2)}`);
  console.log(`Headers relevantes:`);
  console.log(`  - x-cloud-trace-context: ${users.headers['x-cloud-trace-context']}`);
  console.log(`  - x-powered-by: ${users.headers['x-powered-by']}`);

  // 3. GET /jobs (deve falhar)
  console.log('\n3️⃣  GET /jobs (esperado: 500):');
  const jobs = await testEndpoint('/jobs');
  console.log(`Status: ${jobs.status}`);
  console.log(`Resposta: ${JSON.stringify(jobs.body, null, 2)}`);

  // 4. POST /generate-upload-url (deve funcionar - Cloud Storage)
  console.log('\n4️⃣  POST /generate-upload-url (deve funcionar):');
  const upload = await testEndpoint('/generate-upload-url', 'POST', {
    filename: 'test.jpg',
    contentType: 'image/jpeg',
  });
  console.log(`Status: ${upload.status}`);
  if (upload.status === 200) {
    console.log(`✅ Cloud Storage funcionando!`);
    console.log(`URL gerada: ${upload.body.url?.substring(0, 80)}...`);
  } else {
    console.log(`❌ Erro: ${JSON.stringify(upload.body, null, 2)}`);
  }

  // ANÁLISE
  console.log('\n' + '='.repeat(60));
  console.log('📊 ANÁLISE:');
  console.log('=' + '.'.repeat(59));

  if (health.status === 200) {
    console.log('✅ Express server: FUNCIONANDO');
  } else {
    console.log('❌ Express server: COM PROBLEMAS');
  }

  if (upload.status === 200) {
    console.log('✅ Cloud Storage: FUNCIONANDO (Service Account tem permissões)');
  } else {
    console.log('❌ Cloud Storage: FALHOU');
  }

  if (users.status === 500 && jobs.status === 500) {
    console.log('❌ Firestore: FALHOU (ambos endpoints retornam 500)');
    console.log('\n🔍 POSSÍVEIS CAUSAS:');
    console.log('   1. Backend conectando ao Firestore do projeto ERRADO');
    console.log('   2. Service Account sem role "Cloud Datastore User"');
    console.log('   3. Coleções users/jobs não existem (mas retornaria [] vazio, não 500)');
    console.log('   4. Firestore Security Rules bloqueando Admin SDK');
    console.log('\n💡 PRÓXIMO PASSO:');
    console.log('   Ver logs do Cloud Run para erro exato:');
    console.log('   https://console.cloud.google.com/run/detail/us-west1/servio-backend/logs?project=gen-lang-client-0737507616');
  }

  console.log('\n' + '='.repeat(60));
}

diagnose().catch(console.error);
