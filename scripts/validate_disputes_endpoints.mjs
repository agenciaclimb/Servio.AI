#!/usr/bin/env node

/**
 * Script de validação rápida dos novos endpoints de disputas
 * Roda após o deploy do backend para confirmar disponibilidade
 */

const BASE_URL = 'https://servio-backend-h5ogjon7aa-uw.a.run.app';

async function validateEndpoints() {
  console.log('🔍 Validando novos endpoints de disputas...\n');

  const tests = [
    {
      name: 'GET /disputes',
      url: `${BASE_URL}/disputes`,
      method: 'GET',
      expectedStatus: [200, 201],
    },
    {
      name: 'POST /disputes',
      url: `${BASE_URL}/disputes`,
      method: 'POST',
      expectedStatus: [200, 201, 400], // 400 se payload inválido é ok
      body: {
        jobId: 'test-validation',
        initiatedBy: 'test@example.com',
        reason: 'Validation test',
        description: 'Testing endpoint availability',
      },
    },
    {
      name: 'GET /sentiment-alerts',
      url: `${BASE_URL}/sentiment-alerts`,
      method: 'GET',
      expectedStatus: [200, 201],
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const isExpected = test.expectedStatus.includes(response.status);

      if (isExpected) {
        console.log(`✅ ${test.name}: ${response.status}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: ${response.status} (esperado: ${test.expectedStatus.join(' ou ')})`);
        failed++;
      }

      // Log response preview
      const text = await response.text();
      if (text.length > 0 && text.length < 200) {
        console.log(`   Response: ${text}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('─'.repeat(50));
  console.log(`📊 Resultado: ${passed} passou, ${failed} falhou\n`);

  if (failed === 0) {
    console.log('✅ Todos os endpoints estão disponíveis e respondendo corretamente!');
    process.exit(0);
  } else {
    console.log('⚠️  Alguns endpoints falharam. Verifique os logs do Cloud Run.');
    console.log('   Comando: gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend" --limit 50 --format json');
    process.exit(1);
  }
}

validateEndpoints().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
