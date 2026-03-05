#!/usr/bin/env node

/**
 * Production Validation Script
 * Validates all critical endpoints and components for Servio.AI production
 */

const backend = 'https://servio-backend-h5ogjon7aa-uw.a.run.app';
const frontend = 'https://gen-lang-client-0737507616.web.app';

const results = {
  timestamp: new Date().toISOString(),
  components: {},
  criticalIssues: [],
  warnings: [],
  recommendations: [],
};

async function testEndpoint(name, url, method = 'GET', config = {}) {
  console.log(`\n📍 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Servio-Production-Validator/1.0',
        ...config.headers,
      },
      timeout: 10000,
    };

    const response = await fetch(url, options);
    const status = response.status;
    const statusText = response.statusText;
    
    // Try to parse response body
    let body = null;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        body = await response.json();
      } catch (e) {
        body = await response.text();
      }
    } else {
      body = await response.text();
    }

    const isHealthy = status >= 200 && status < 300;
    const result = {
      status,
      statusText,
      healthy: isHealthy,
      responseTime: 'N/A',
      body: typeof body === 'object' ? JSON.stringify(body).substring(0, 200) : body.substring(0, 200),
    };

    results.components[name] = result;

    if (isHealthy) {
      console.log(`   ✅ Status: ${status} ${statusText}`);
      console.log(`   Response: ${result.body}`);
    } else {
      console.log(`   ❌ Status: ${status} ${statusText}`);
      if (status >= 500) {
        results.criticalIssues.push(`${name}: Server error ${status}`);
      } else if (status >= 400) {
        results.warnings.push(`${name}: Client error ${status}`);
      }
    }

    return isHealthy;
  } catch (error) {
    const result = {
      status: 'TIMEOUT/ERROR',
      healthy: false,
      error: error.message,
    };
    results.components[name] = result;
    console.log(`   ❌ ERROR: ${error.message}`);
    results.criticalIssues.push(`${name}: ${error.message}`);
    return false;
  }
}

async function testCORS() {
  console.log(`\n📍 Testing: CORS Configuration`);
  console.log(`   URL: ${backend}/api/health (OPTIONS)`);

  try {
    const response = await fetch(backend + '/api/health', {
      method: 'OPTIONS',
      headers: {
        'Origin': frontend,
        'Access-Control-Request-Method': 'POST',
      },
    });

    const corsHeaders = {
      allowOrigin: response.headers.get('access-control-allow-origin'),
      allowMethods: response.headers.get('access-control-allow-methods'),
      allowHeaders: response.headers.get('access-control-allow-headers'),
    };

    const corsOk = corsHeaders.allowOrigin && corsHeaders.allowMethods;

    results.components['CORS Config'] = {
      status: response.status,
      headers: corsHeaders,
      healthy: corsOk,
    };

    if (corsOk) {
      console.log(`   ✅ CORS Enabled`);
      console.log(`   Allow-Origin: ${corsHeaders.allowOrigin}`);
      console.log(`   Allow-Methods: ${corsHeaders.allowMethods}`);
    } else {
      console.log(`   ❌ CORS NOT properly configured`);
      results.criticalIssues.push('CORS: Missing or misconfigured headers');
    }

    return corsOk;
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.criticalIssues.push(`CORS test failed: ${error.message}`);
    return false;
  }
}

async function testFirebaseHosting() {
  console.log(`\n📍 Testing: Firebase Hosting Rewrites`);
  console.log(`   URL: ${frontend}`);

  try {
    const response = await fetch(frontend);
    const status = response.status;
    const isHealthy = status === 200;

    results.components['Firebase Hosting'] = {
      status,
      healthy: isHealthy,
    };

    if (isHealthy) {
      console.log(`   ✅ Status: ${status}`);
    } else {
      console.log(`   ❌ Status: ${status}`);
      results.criticalIssues.push(`Firebase Hosting returning ${status}`);
    }

    return isHealthy;
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.criticalIssues.push(`Firebase Hosting: ${error.message}`);
    return false;
  }
}

async function runValidation() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 SERVIO.AI PRODUCTION VALIDATION');
  console.log('='.repeat(60));

  // Test critical endpoints
  await testEndpoint('Health Check', `${backend}/api/health`);
  
  // Test CSRF Token (correct endpoint is /api/csrf)
  await testEndpoint('CSRF Token Endpoint', `${backend}/api/csrf`, 'GET');

  // Test CORS
  await testCORS();

  // Test Firebase
  await testFirebaseHosting();

  // Test Firebase Hosting rewrites (SPA should serve index.html for any route)
  console.log('\n📍 Testing: Firebase Hosting SPA Rewrite');
  try {
    const response = await fetch(frontend + '/some-fake-route-for-spa');
    const isHealthy = response.status === 200;
    results.components['SPA Rewrite'] = {
      status: response.status,
      healthy: isHealthy,
    };
    console.log(`   ${isHealthy ? '✅' : '❌'} Status: ${response.status}`);
    if (!isHealthy) {
      results.warnings.push('SPA Rewrite: Page not redirected to index.html');
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.criticalIssues.push(`SPA Rewrite test failed: ${error.message}`);
  }

  // Test jobs endpoint (this one actually exists and returns data)
  await testEndpoint('Jobs List Endpoint', `${backend}/api/jobs`, 'GET', {
    headers: { 'Authorization': 'Bearer TEST' },
  });

  // Test Stripe webhook endpoint (should reject without proper webhook header)
  console.log('\n📍 Testing: Stripe Webhook Handler');
  console.log(`   URL: ${backend}/api/stripe-webhook`);
  try {
    const response = await fetch(`${backend}/api/stripe-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const result = {
      status: response.status,
      healthy: [204, 400, 401, 403].includes(response.status), // Should validate signature
    };
    results.components['Stripe Webhook'] = result;
    if (response.status === 400 || response.status === 401) {
      console.log(`   ✅ Status: ${response.status} (properly rejecting unsigned requests)`);
    } else {
      console.log(`   ⚠️  Status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.warnings.push(`Stripe webhook test error: ${error.message}`);
  }

  // Test image upload capability via identify-item endpoint
  console.log('\n📍 Testing: Gemini Identify-Item Endpoint');
  console.log(`   URL: ${backend}/api/identify-item`);
  try {
    const response = await fetch(`${backend}/api/identify-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'test-token', // Missing real CSRF should fail safely
      },
      body: JSON.stringify({ base64Image: 'invalid' }),
    });
    const isProtected = response.status === 403 || response.status === 400;
    results.components['Identify-Item Endpoint'] = {
      status: response.status,
      healthy: isProtected, // Should be protected or reject invalid input
    };
    if (isProtected) {
      console.log(`   ✅ Status: ${response.status} (properly protected)`);
    } else {
      console.log(`   ⚠️  Status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.warnings.push(`Identify-item test error: ${error.message}`);
  }

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION REPORT');
  console.log('='.repeat(60));

  const healthyCount = Object.values(results.components).filter(c => c.healthy).length;
  const totalCount = Object.keys(results.components).length;

  console.log(`\n✅ Healthy: ${healthyCount}/${totalCount}`);
  
  if (results.criticalIssues.length > 0) {
    console.log(`\n🔴 CRITICAL ISSUES (${results.criticalIssues.length}):`);
    results.criticalIssues.forEach(issue => console.log(`   • ${issue}`));
  } else {
    console.log('\n🟢 No critical issues detected');
  }

  if (results.warnings.length > 0) {
    console.log(`\n🟡 WARNINGS (${results.warnings.length}):`);
    results.warnings.forEach(warning => console.log(`   • ${warning}`));
  }

  const isReady = results.criticalIssues.length === 0 && healthyCount >= totalCount - 2;

  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL STATUS');
  console.log('='.repeat(60));
  console.log(`READY FOR PUBLIC USERS: ${isReady ? '✅ YES' : '❌ NO'}`);
  console.log(`Overall Health: ${Math.round((healthyCount / totalCount) * 100)}%`);
  console.log(`Timestamp: ${results.timestamp}`);
  console.log('='.repeat(60));

  // Return exit code
  process.exit(results.criticalIssues.length > 0 ? 1 : 0);
}

runValidation().catch(error => {
  console.error('Validation script error:', error);
  process.exit(1);
});
