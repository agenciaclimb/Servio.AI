/**
 * Prospector Analytics Service
 * 
 * Provides real-time analytics and metrics for prospector performance.
 * Includes conversion tracking, ROI calculation, and badge progression.
 */

/**
 * Calculate prospector performance metrics
 */
async function calculateProspectorMetrics({ db, prospectorId, timePeriod = 90 }) {
  const cutoffDate = Date.now() - (timePeriod * 24 * 60 * 60 * 1000);

  // Get all providers recruited by this prospector
  const providersSnap = await db.collection('users')
    .where('prospectorId', '==', prospectorId)
    .get();

  const providers = providersSnap.docs.map(d => d.data());
  
  // Get all commissions earned
  const commissionsSnap = await db.collection('commissions')
    .where('prospectorId', '==', prospectorId)
    .where('createdAt', '>=', cutoffDate)
    .get();

  const commissions = commissionsSnap.docs.map(d => d.data());

  // Calculate metrics
  const totalRecruits = providers.length;
  const activeRecruits = providers.filter(p => p.status === 'ativo').length;
  const totalCommissions = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const paidCommissions = commissions.filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  // Get referral link analytics
  const linkSnap = await db.collection('referral_links').doc(prospectorId).get();
  const linkData = linkSnap.exists ? linkSnap.data() : {};
  const clicks = linkData.clicks || 0;
  const conversions = linkData.conversions || 0;
  const conversionRate = clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : '0.00';

  // Calculate average time to first commission
  const firstCommissions = new Map();
  for (const provider of providers) {
    const providerCommissions = commissions.filter(c => c.providerId === provider.email);
    if (providerCommissions.length > 0) {
      const firstCommission = providerCommissions.sort((a, b) => a.createdAt - b.createdAt)[0];
      const recruitDate = provider.memberSince || provider.createdAt;
      const daysDiff = Math.floor((firstCommission.createdAt - recruitDate) / (24 * 60 * 60 * 1000));
      firstCommissions.set(provider.email, daysDiff);
    }
  }

  const avgDaysToFirstCommission = firstCommissions.size > 0
    ? Array.from(firstCommissions.values()).reduce((sum, days) => sum + days, 0) / firstCommissions.size
    : 0;

  // Top performing providers
  const providerCommissions = {};
  for (const commission of commissions) {
    if (!providerCommissions[commission.providerId]) {
      providerCommissions[commission.providerId] = 0;
    }
    providerCommissions[commission.providerId] += commission.amount;
  }

  const topProviders = Object.entries(providerCommissions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([providerId, amount]) => ({
      providerId,
      totalCommissions: amount,
      providerName: providers.find(p => p.email === providerId)?.name || providerId
    }));

  // Recent activity (last 7 days)
  const last7Days = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentRecruits = providers.filter(p => 
    (p.memberSince || p.createdAt) >= last7Days
  ).length;
  const recentCommissions = commissions.filter(c => c.createdAt >= last7Days);
  const recentEarnings = recentCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Referral link clicks by source
  const clicksSnap = await db.collection('referral_clicks')
    .where('prospectorId', '==', prospectorId)
    .where('timestamp', '>=', cutoffDate)
    .get();

  const clicksBySource = {};
  clicksSnap.docs.forEach(doc => {
    const source = doc.data().source || 'web';
    clicksBySource[source] = (clicksBySource[source] || 0) + 1;
  });

  return {
    totalRecruits,
    activeRecruits,
    totalCommissions,
    paidCommissions,
    pendingCommissions,
    clicks,
    conversions,
    conversionRate,
    avgDaysToFirstCommission: Math.round(avgDaysToFirstCommission),
    topProviders,
    recentActivity: {
      recruits: recentRecruits,
      commissions: recentCommissions.length,
      earnings: recentEarnings,
    },
    clicksBySource,
    timePeriod,
  };
}

/**
 * Calculate badge progression for gamification
 */
function calculateBadges(metrics) {
  const badges = [];

  // Recruiter badges
  if (metrics.totalRecruits >= 100) {
    badges.push({ name: 'Elite Recruiter', tier: 'platinum', icon: '👑', description: '100+ prestadores recrutados' });
  } else if (metrics.totalRecruits >= 50) {
    badges.push({ name: 'Master Recruiter', tier: 'gold', icon: '🥇', description: '50+ prestadores recrutados' });
  } else if (metrics.totalRecruits >= 25) {
    badges.push({ name: 'Pro Recruiter', tier: 'silver', icon: '🥈', description: '25+ prestadores recrutados' });
  } else if (metrics.totalRecruits >= 10) {
    badges.push({ name: 'Recruiter', tier: 'bronze', icon: '🥉', description: '10+ prestadores recrutados' });
  } else if (metrics.totalRecruits >= 5) {
    badges.push({ name: 'Rising Star', tier: 'bronze', icon: '⭐', description: '5+ prestadores recrutados' });
  }

  // Earnings badges
  if (metrics.totalCommissions >= 10000) {
    badges.push({ name: 'Money Maker', tier: 'platinum', icon: '💰', description: 'R$ 10.000+ em comissões' });
  } else if (metrics.totalCommissions >= 5000) {
    badges.push({ name: 'Big Earner', tier: 'gold', icon: '💵', description: 'R$ 5.000+ em comissões' });
  } else if (metrics.totalCommissions >= 1000) {
    badges.push({ name: 'Earner', tier: 'silver', icon: '💸', description: 'R$ 1.000+ em comissões' });
  } else if (metrics.totalCommissions >= 500) {
    badges.push({ name: 'First Earnings', tier: 'bronze', icon: '💳', description: 'R$ 500+ em comissões' });
  }

  // Conversion rate badges
  const rate = parseFloat(metrics.conversionRate);
  if (rate >= 50) {
    badges.push({ name: 'Conversion Master', tier: 'platinum', icon: '🎯', description: '50%+ taxa de conversão' });
  } else if (rate >= 30) {
    badges.push({ name: 'Conversion Pro', tier: 'gold', icon: '🎲', description: '30%+ taxa de conversão' });
  } else if (rate >= 15) {
    badges.push({ name: 'Good Converter', tier: 'silver', icon: '📈', description: '15%+ taxa de conversão' });
  } else if (rate >= 5) {
    badges.push({ name: 'Converter', tier: 'bronze', icon: '📊', description: '5%+ taxa de conversão' });
  }

  // Streak badges (active providers still completing jobs)
  const activeRate = metrics.totalRecruits > 0 
    ? (metrics.activeRecruits / metrics.totalRecruits) * 100 
    : 0;
  if (activeRate >= 80 && metrics.totalRecruits >= 10) {
    badges.push({ name: 'Quality Recruiter', tier: 'gold', icon: '✨', description: '80%+ dos recrutas ativos' });
  } else if (activeRate >= 60 && metrics.totalRecruits >= 5) {
    badges.push({ name: 'Good Recruiter', tier: 'silver', icon: '👍', description: '60%+ dos recrutas ativos' });
  }

  // Speed badges (fast to first commission)
  if (metrics.avgDaysToFirstCommission <= 3 && metrics.totalRecruits >= 5) {
    badges.push({ name: 'Speed Demon', tier: 'gold', icon: '⚡', description: 'Primeira comissão em ≤3 dias (média)' });
  } else if (metrics.avgDaysToFirstCommission <= 7 && metrics.totalRecruits >= 3) {
    badges.push({ name: 'Fast Starter', tier: 'silver', icon: '🚀', description: 'Primeira comissão em ≤7 dias (média)' });
  }

  return badges;
}

/**
 * Get prospector leaderboard
 */
async function getLeaderboard({ db, sortBy = 'totalCommissions', limit = 10 }) {
  const snap = await db.collection('prospectors').get();
  const prospectors = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Sort by specified field
  const sorted = prospectors.sort((a, b) => {
    const aValue = a[sortBy] || 0;
    const bValue = b[sortBy] || 0;
    return bValue - aValue;
  });

  return sorted.slice(0, limit).map((p, index) => ({
    rank: index + 1,
    prospectorId: p.id,
    prospectorName: p.name,
    totalRecruits: p.totalRecruits || 0,
    totalCommissions: p.totalCommissionsEarned || 0,
    conversionRate: p.conversionRate || 0,
    badges: calculateBadges({
      totalRecruits: p.totalRecruits || 0,
      totalCommissions: p.totalCommissionsEarned || 0,
      conversionRate: p.conversionRate || 0,
      activeRecruits: p.activeRecruits || 0,
      avgDaysToFirstCommission: p.avgDaysToFirstCommission || 0,
    }).length,
  }));
}

/**
 * Export weekly/monthly reports
 */
async function generateReport({ db, prospectorId, period = 'week' }) {
  const days = period === 'week' ? 7 : 30;
  const metrics = await calculateProspectorMetrics({ db, prospectorId, timePeriod: days });
  const badges = calculateBadges(metrics);

  const report = {
    period,
    generatedAt: Date.now(),
    prospectorId,
    summary: {
      recruits: metrics.totalRecruits,
      earnings: metrics.totalCommissions,
      conversionRate: metrics.conversionRate,
      activeProv iders: metrics.activeRecruits,
    },
    recentActivity: metrics.recentActivity,
    topProviders: metrics.topProviders,
    badges,
    clicksBySource: metrics.clicksBySource,
  };

  // Store report in Firestore
  await db.collection('prospector_reports').add({
    prospectorId,
    report,
    period,
    createdAt: Date.now(),
  });

  return report;
}

module.exports = {
  calculateProspectorMetrics,
  calculateBadges,
  getLeaderboard,
  generateReport,
};
