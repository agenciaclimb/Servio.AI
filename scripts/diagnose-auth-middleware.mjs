#!/usr/bin/env node

/**
 * Backend Auth Middleware Diagnostic
 * Verifies if requireAuth middleware is properly rejecting unauthenticated requests
 */

const backend = 'https://servio-backend-h5ogjon7aa-uw.a.run.app';

async function diagnoseAuth() {
  console.log('\n🔍 BACKEND AUTH MIDDLEWARE DIAGNOSTIC');
  console.log('═'.repeat(70));

  // Test 1: Verify middleware is running
  console.log('\n1️⃣  Testing /api/jobs WITHOUT Authorization');
  console.log('   Expected: 401 Unauthorized (requireAuth should block)');
  try {
    const res = await fetch(`${backend}/api/jobs`, {
      headers: {
        'X-Debug': 'true', // Try to trigger debug logging
      },
    });
    console.log(`   Actual: ${res.status} ${res.statusText}`);
    
    if (res.status === 401) {
      console.log('   ✅ PASS: Auth middleware working');
    } else if (res.status === 200) {
      console.log('   ❌ FAIL: Auth middleware NOT working - endpoint is public');
      console.log('   Possible causes:');
      console.log('      - requireAuth middleware not applied to route');
      console.log('      - middleware is bypassed somewhere');
      console.log('      - route registered after auth middleware removed it');
    }
    
    const data = await res.json();
    console.log(`   Response:`, JSON.stringify(data).substring(0, 200));
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
  }

  // Test 2: Try with valid-looking bearer token
  console.log('\n2️⃣  Testing /api/jobs WITH Bearer token (invalid)');
  console.log('   Expected: 401 (token verification fails)');
  try {
    // Use a placeholder - never commit real tokens
    const fakeToken = 'jwt_test_' + 'x'.repeat(100); 
    const res = await fetch(`${backend}/api/jobs`, {
      headers: {
        'Authorization': `Bearer ${fakeToken}`,
      },
    });
    console.log(`   Actual: ${res.status} ${res.statusText}`);
    
    if (res.status === 401) {
      console.log('   ✅ PASS: Invalid token rejected');
    } else if (res.status === 200) {
      console.log('   ❌ FAIL: Invalid token accepted as valid');
    }
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
  }

  // Test 3: Check public health endpoint
  console.log('\n3️⃣  Testing /api/health (public endpoint)');
  console.log('   Expected: 200 OK');
  try {
    const res = await fetch(`${backend}/api/health`);
    console.log(`   Actual: ${res.status} ${res.statusText}`);
    if (res.status === 200) {
      console.log('   ✅ PASS: Public endpoint working');
    }
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
  }

  // Test 4: Check if there's a fallback /jobs route
  console.log('\n4️⃣  Testing /jobs (legacy route)');
  try {
    const res = await fetch(`${backend}/jobs`);
    console.log(`   Status: ${res.status} ${res.statusText}`);
    if (res.status === 200) {
      console.log('   ℹ️  Legacy /jobs route is public');
      console.log('   (Frontend should use /api/jobs)');
    }
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
  }

  // Test 5: Check if Firebase Admin SDK is working
  console.log('\n5️⃣  Testing Firebase-related endpoints');
  try {
    const res = await fetch(`${backend}/api/identify-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image: 'invalid' }),
    });
    console.log(`   /api/identify-item: ${res.status} ${res.statusText}`);
  } catch (e) {
    console.log(`   ERROR: ${e.message}`);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📋 DIAGNOSIS SUMMARY');
  console.log('═'.repeat(70));
  console.log(`
If /api/jobs returns 200 WITHOUT Authorization header:
❌ Auth middleware is NOT protecting the endpoint

Root Causes:
1. requireAuth middleware is not applied to route
2. Middleware was removed or disabled
3. Route order issue - another route matches first
4. Firebase Admin SDK not initialized

Fix Steps:
1. Check if 'requireAuth' is imported and applied to /api/jobs
2. Verify Firebase Admin SDK initialization with GOOGLE_APPLICATION_CREDENTIALS
3. Check middleware order - auth middleware must come before routes
4. Look for environment variables that disable auth (NODE_ENV, DISABLE_AUTH, etc.)
5. Check Cloud Run logs: gcloud functions logs read servio-backend

Cloud Run Logs:
  gcloud functions logs read servio-backend --limit 50 --project gen-lang-client-0737507616
  `);

  console.log('\n✅ Diagnostic complete\n');
}

diagnoseAuth().catch(console.error);
