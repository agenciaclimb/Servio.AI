/**
 * Backend Smoke Test - Cloud Run Endpoints
 * 
 * Valida os principais endpoints do backend deployado no Cloud Run.
 * Testa conectividade, autenticação e respostas esperadas.
 */

const BACKEND_URL = 'https://servio-backend-h5ogjon7aa-uw.a.run.app';

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function testEndpoint(name, method, path, body = null, expectedStatus = 200) {
  const url = `${BACKEND_URL}${path}`;
  log(`\n→ Testing: ${method} ${path}`, 'blue');
  log(`  URL: ${url}`, 'gray');

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
      log(`  Body: ${JSON.stringify(body)}`, 'gray');
    }

    const startTime = Date.now();
    const response = await fetch(url, options);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const contentType = response.headers.get('content-type');
    let data = null;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    const success = response.status === expectedStatus;
    const statusColor = success ? 'green' : 'red';
    const statusSymbol = success ? '✓' : '✗';

    log(`${statusSymbol} Status: ${response.status} (expected ${expectedStatus})`, statusColor);
    log(`  Duration: ${duration}ms`, 'gray');
    log(`  Response: ${JSON.stringify(data).substring(0, 200)}${JSON.stringify(data).length > 200 ? '...' : ''}`, 'gray');

    return {
      name,
      success,
      status: response.status,
      expectedStatus,
      duration,
      data
    };
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return {
      name,
      success: false,
      error: error.message
    };
  }
}

async function runSmokeTests() {
  log('═══════════════════════════════════════════════', 'blue');
  log('  Backend Smoke Test - Cloud Run', 'blue');
  log('═══════════════════════════════════════════════', 'blue');
  log(`  Backend: ${BACKEND_URL}`, 'gray');
  log(`  Date: ${new Date().toISOString()}`, 'gray');
  log('═══════════════════════════════════════════════\n', 'blue');

  const results = [];

  // Test 1: Health Check
  results.push(await testEndpoint(
    'Health Check',
    'GET',
    '/',
    null,
    200
  ));

  // Test 2: List Users (pode falhar se Firestore não tiver dados)
  results.push(await testEndpoint(
    'List Users',
    'GET',
    '/users',
    null,
    200 // Esperamos 200 ou 500 dependendo do estado do Firestore
  ));

  // Test 3: List Jobs
  results.push(await testEndpoint(
    'List Jobs',
    'GET',
    '/jobs',
    null,
    200
  ));

  // Test 4: Generate Upload URL (precisa de payload válido)
  results.push(await testEndpoint(
    'Generate Upload URL',
    'POST',
    '/generate-upload-url',
    {
      fileName: 'test-smoke.jpg',
      contentType: 'image/jpeg',
      jobId: 'smoke-test-job-' + Date.now()
    },
    200
  ));

  // Summary
  log('\n═══════════════════════════════════════════════', 'blue');
  log('  Test Summary', 'blue');
  log('═══════════════════════════════════════════════', 'blue');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;

  results.forEach((result, index) => {
    const symbol = result.success ? '✓' : '✗';
    const color = result.success ? 'green' : 'red';
    const status = result.status ? `(${result.status})` : '(error)';
    log(`${index + 1}. ${symbol} ${result.name} ${status}`, color);
  });

  log(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}`, 
      failed === 0 ? 'green' : 'yellow');
  log('═══════════════════════════════════════════════\n', 'blue');

  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runSmokeTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
