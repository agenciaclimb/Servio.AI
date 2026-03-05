#!/usr/bin/env node

/**
 * Auth Debug Script - Test /api/jobs authentication flow
 * Run with: node scripts/test-auth-flow.mjs
 */

const backend = 'https://servio-backend-h5ogjon7aa-uw.a.run.app';

async function testAuthFlow() {
  console.log('\n🔐 AUTHENTICATION FLOW TEST');
  console.log('═'.repeat(60));

  // Test 1: GET /api/jobs WITHOUT auth
  console.log('\n1️⃣  GET /api/jobs WITHOUT Authorization header');
  try {
    const res1 = await fetch(`${backend}/api/jobs`);
    console.log(`   Status: ${res1.status} ${res1.statusText}`);
    if (res1.status === 401) {
      console.log('   ✅ Expected: 401 Unauthorized (no token)');
    } else if (res1.status === 200) {
      console.log('   ⚠️  Got 200 - public endpoint or auth not enforced');
    } else {
      console.log(`   ⚠️  Unexpected status`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  // Test 2: GET /api/jobs WITH invalid auth
  console.log('\n2️⃣  GET /api/jobs WITH invalid Authorization header');
  try {
    const res2 = await fetch(`${backend}/api/jobs`, {
      headers: {
        'Authorization': 'Bearer invalid-token-123',
      },
    });
    console.log(`   Status: ${res2.status} ${res2.statusText}`);
    if (res2.status === 401) {
      console.log('   ✅ Expected: 401 Unauthorized (invalid token)');
    } else {
      console.log(`   ⚠️  Status: ${res2.status}`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  // Test 3: GET /api/health (should always work)
  console.log('\n3️⃣  GET /api/health (public endpoint)');
  try {
    const res3 = await fetch(`${backend}/api/health`);
    console.log(`   Status: ${res3.status} ${res3.statusText}`);
    const data = await res3.json();
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  // Test 4: GET /api/csrf-token
  console.log('\n4️⃣  GET /api/csrf-token (obtém token CSRF)');
  try {
    const res4 = await fetch(`${backend}/api/csrf-token`);
    console.log(`   Status: ${res4.status} ${res4.statusText}`);
    if (res4.ok) {
      const data = await res4.json();
      console.log(`   ✅ CSRF token obtained, cookie should be set`);
    } else {
      console.log(`   ❌ Failed to get CSRF token`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  // Test 5: Check endpoint structure
  console.log('\n5️⃣  /api/jobs endpoint details');
  try {
    const res5 = await fetch(`${backend}/api/jobs`, {
      method: 'OPTIONS',
    });
    console.log(`   Status: ${res5.status} ${res5.statusText}`);
    const corsHeaders = {
      origin: res5.headers.get('access-control-allow-origin'),
      methods: res5.headers.get('access-control-allow-methods'),
      headers: res5.headers.get('access-control-allow-headers'),
    };
    console.log(`   CORS Headers:`, corsHeaders);
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Auth Flow Test Complete\n');
  console.log('📝 NEXT STEPS:');
  console.log('1. Verify status codes above');
  console.log('2. If /api/jobs returns 200 without token, auth is not enforced');
  console.log('3. Check backend logs for [Auth] messages');
  console.log('4. Run with VITE_DEBUG=true for frontend logs');
}

testAuthFlow().catch(console.error);
