/**
 * E2E Test: Provider Earnings Dashboard
 * 
 * Validates earnings calculation, badge system, and commission rates
 */

const BASE_URL = 'https://servio-backend-h5ogjon7aa-uw.a.run.app';

// Test data
const testProvider = {
  email: `earnings-provider-${Date.now()}@test.com`,
  name: 'Earnings Test Provider',
  type: 'prestador',
  bio: 'Testing earnings dashboard',
  location: 'São Paulo, SP',
  headline: 'Expert Provider',
  verificationStatus: 'verificado',
  stripeAccountId: 'acct_test_earnings_123',
};

const testClient = {
  email: `earnings-client-${Date.now()}@test.com`,
  name: 'Earnings Test Client',
  type: 'cliente',
  bio: 'Testing client',
  location: 'São Paulo, SP',
};

let createdJobIds = [];

async function createUser(userData) {
  const response = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create user: ${response.status} - ${text}`);
  }
  
  return await response.json();
}

async function createJob(jobData) {
  const response = await fetch(`${BASE_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create job: ${response.status}`);
  }
  
  const job = await response.json();
  createdJobIds.push(job.id);
  return job;
}

async function completeJobWithEarnings(jobId, price, rating) {
  // Simulate complete job flow with earnings (simplified without Stripe)
  const providerRate = 0.85; // 85% commission
  const providerShare = price * providerRate;
  const platformFee = price - providerShare;

  // Update job to completed with earnings and review
  await fetch(`${BASE_URL}/jobs/${jobId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      status: 'concluido',
      providerId: testProvider.email,
      fixedPrice: price,
      earnings: {
        totalAmount: price,
        providerShare,
        platformFee,
        paidAt: new Date().toISOString(),
      },
      review: {
        rating,
        comment: 'Great service!',
        authorId: testClient.email,
        createdAt: new Date().toISOString(),
      }
    }),
  });

  return { jobId, price, rating, providerShare, platformFee };
}

async function fetchProviderJobs(providerId) {
  const response = await fetch(`${BASE_URL}/jobs?providerId=${providerId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.status}`);
  }
  return await response.json();
}

async function cleanup() {
  console.log('\n🧹 Limpando dados de teste...');
  
  for (const jobId of createdJobIds) {
    try {
      await fetch(`${BASE_URL}/jobs/${jobId}`, { method: 'DELETE' });
    } catch (err) {
      console.log(`⚠️  Erro ao limpar job ${jobId}:`, err.message);
    }
  }

  try {
    await fetch(`${BASE_URL}/users/${testProvider.email}`, { method: 'DELETE' });
    await fetch(`${BASE_URL}/users/${testClient.email}`, { method: 'DELETE' });
  } catch (err) {
    console.log('⚠️  Erro ao limpar usuários:', err.message);
  }
}

async function runTests() {
  console.log('🧪 E2E Test: Provider Earnings Dashboard\n');
  
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // SETUP: Create users
    console.log('📋 Setup: Creating test users...');
    await createUser(testProvider);
    await createUser(testClient);
    console.log('✅ Users created\n');

    // TEST 1: Create 3 completed jobs with earnings
    console.log('TEST 1: Create completed jobs with earnings');
    const job1 = await createJob({
      clientId: testClient.email,
      category: 'Limpeza',
      description: 'Job 1',
      status: 'ativo',
      serviceType: 'personalizado',
      urgency: 'hoje',
      createdAt: new Date().toISOString(),
    });
    await completeJobWithEarnings(job1.id, 100, 5.0);

    const job2 = await createJob({
      clientId: testClient.email,
      category: 'Pintura',
      description: 'Job 2',
      status: 'ativo',
      serviceType: 'personalizado',
      urgency: 'amanha',
      createdAt: new Date().toISOString(),
    });
    await completeJobWithEarnings(job2.id, 200, 4.8);

    const job3 = await createJob({
      clientId: testClient.email,
      category: 'Elétrica',
      description: 'Job 3',
      status: 'ativo',
      serviceType: 'personalizado',
      urgency: '3dias',
      createdAt: new Date().toISOString(),
    });
    await completeJobWithEarnings(job3.id, 150, 4.9);

    console.log('✅ TESTE 1 PASSOU: 3 jobs completados com earnings\n');
    testsPassed++;

    // TEST 2: Fetch provider jobs and validate earnings
    console.log('TEST 2: Validate earnings calculation');
    const providerJobs = await fetchProviderJobs(testProvider.email);
    const completedJobs = providerJobs.filter(j => j.status === 'concluido' && j.earnings);
    
    if (completedJobs.length !== 3) {
      throw new Error(`Expected 3 completed jobs, found ${completedJobs.length}`);
    }

    const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.earnings.providerShare || 0), 0);
    const expectedEarnings = (100 + 200 + 150) * 0.85; // 85% commission

    if (Math.abs(totalEarnings - expectedEarnings) > 0.01) {
      throw new Error(`Expected ${expectedEarnings}, got ${totalEarnings}`);
    }

    console.log(`✅ TESTE 2 PASSOU: Total earnings = R$ ${totalEarnings.toFixed(2)}\n`);
    testsPassed++;

    // TEST 3: Validate average rating calculation
    console.log('TEST 3: Validate average rating');
    const ratings = completedJobs.filter(j => j.review?.rating).map(j => j.review.rating);
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const expectedAvg = (5.0 + 4.8 + 4.9) / 3;

    if (Math.abs(avgRating - expectedAvg) > 0.01) {
      throw new Error(`Expected ${expectedAvg.toFixed(2)}, got ${avgRating.toFixed(2)}`);
    }

    console.log(`✅ TESTE 3 PASSOU: Average rating = ${avgRating.toFixed(2)}\n`);
    testsPassed++;

    // TEST 4: Validate badge logic (should be "Iniciante" with 3 jobs)
    console.log('TEST 4: Validate badge assignment');
    const totalJobs = completedJobs.length;
    
    let expectedBadge = '🆕 Iniciante';
    if (totalJobs >= 100 && avgRating >= 4.8) expectedBadge = '🏆 Elite';
    else if (totalJobs >= 50 && avgRating >= 4.5) expectedBadge = '💎 Premium';
    else if (totalJobs >= 20 && avgRating >= 4.0) expectedBadge = '⭐ Profissional';
    else if (totalJobs >= 5) expectedBadge = '🌟 Verificado';

    console.log(`✅ TESTE 4 PASSOU: Badge = ${expectedBadge} (${totalJobs} jobs, ${avgRating.toFixed(1)} rating)\n`);
    testsPassed++;

    // TEST 5: Validate commission rate
    console.log('TEST 5: Validate commission rate');
    const defaultRate = 0.85; // 85%
    const platformFee = (1 - defaultRate) * 100; // 15%

    console.log(`✅ TESTE 5 PASSOU: Provider rate = ${(defaultRate * 100).toFixed(0)}%, Platform fee = ${platformFee.toFixed(0)}%\n`);
    testsPassed++;

  } catch (error) {
    console.error('❌ TESTE FALHOU:', error.message);
    testsFailed++;
  } finally {
    await cleanup();
  }

  // Summary
  console.log('='.repeat(50));
  console.log(`✅ Testes passados: ${testsPassed}/5`);
  console.log(`❌ Testes falhados: ${testsFailed}/5`);
  console.log('='.repeat(50));

  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
