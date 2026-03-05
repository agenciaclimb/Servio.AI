#!/usr/bin/env node

const endpoints = [
  { path: '/api/jobs', method: 'GET', description: 'Jobs list' },
  { path: '/api/users', method: 'GET', description: 'Users list' },
  { path: '/api/payments', method: 'GET', description: 'Payments list' },
  { path: '/api/prospector/stats', method: 'GET', description: 'Prospector stats' },
  { path: '/api/health', method: 'GET', description: 'Health check' },
];

const backend = 'https://servio-backend-h5ogjon7aa-uw.a.run.app';

async function testEndpoints() {
  console.log('\n🔐 AUTH PROTECTION TEST - Multiple Endpoints');
  console.log('═'.repeat(70));
  console.log('Testing which endpoints enforce authentication\n');

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${backend}${endpoint.path}`, {
        method: endpoint.method,
        timeout: 5000,
      });
      
      const hasAuth = [401, 403, 401].includes(res.status);
      const status = hasAuth ? '🔒' : '🔓';
      
      console.log(`${status} ${endpoint.path.padEnd(35)} → ${res.status} ${hasAuth ? '(Protected)' : '(Public)'}`);
    } catch (e) {
      console.log(`❌ ${endpoint.path.padEnd(35)} → ERROR: ${e.message}`);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('Key Findings:');
  console.log('  🔓 = Endpoint is PUBLIC (no authentication)');
  console.log('  🔒 = Endpoint requires AUTH (401/403)');
}

testEndpoints().catch(console.error);
