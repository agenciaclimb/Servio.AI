/**
 * Prospector Analytics Service
 * Aggregates and analyzes prospecting campaign data
 */

const admin = require('firebase-admin');
const db = admin.firestore();

const prospectorAnalyticsService = {
  /**
   * Get metrics timeline for the past 30 days
   */
  async getMetricsTimeline() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      // Read from aggregated daily collection (produzido pelo scheduler)
      const snapshot = await db.collection('analytics_daily')
        .where('date', '>=', thirtyDaysAgo)
        .orderBy('date', 'asc')
        .get();

      const timeline = snapshot.docs.map(doc => {
        const data = doc.data() || {};
        const dateVal = data.date?.toDate?.() ? data.date.toDate() : (data.date || new Date());
        const dateStr = dateVal.toISOString().split('T')[0];

        return {
          date: dateStr,
          outreach: data.totalOutreach || 0,
          conversions: data.totalConversions || 0,
          followUp: data.totalFollowUps || 0,
          revenue: data.totalRevenue || 0,
          conversionRate: data.conversionRate || 0,
          campaignCount: data.campaignCount || 0
        };
      });

      return {
        success: true,
        data: timeline,
        period: '30 days',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Analytics] Error getting metrics timeline:', error);
      throw error;
    }
  },

  /**
   * Calculate campaign performance metrics
   */
  async calculateCampaignMetrics() {
    try {
      const snapshot = await db.collection('prospector_campaigns')
        .where('status', '==', 'active')
        .get();

      const campaigns = [];
      let totalLeads = 0;
      let totalConverted = 0;
      let totalRevenue = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        const leads = data.totalOutreach || 0;
        const converted = data.totalConversions || 0;
        const conversionRate = leads > 0 ? (converted / leads) * 100 : 0;

        campaigns.push({
          id: doc.id,
          name: data.name || 'Unnamed Campaign',
          status: data.status,
          leads,
          converted,
          conversionRate,
          revenue: data.totalRevenue || 0,
          createdAt: data.createdAt?.toDate?.() || null,
          updatedAt: data.updatedAt?.toDate?.() || null
        });

        totalLeads += leads;
        totalConverted += converted;
        totalRevenue += data.totalRevenue || 0;
      });

      // Sort by conversion rate (highest first)
      campaigns.sort((a, b) => b.conversionRate - a.conversionRate);

      return {
        success: true,
        campaigns,
        totals: {
          totalLeads,
          totalConverted,
          overallConversionRate: totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0,
          totalRevenue
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Analytics] Error calculating campaign metrics:', error);
      throw error;
    }
  },

  /**
   * Run daily rollup - aggregates daily analytics
   */
  async runDailyRollup() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const snapshot = await db.collection('prospector_campaigns')
        .where('updatedAt', '>=', today)
        .where('updatedAt', '<', tomorrow)
        .get();

      let totalOutreach = 0;
      let totalConversions = 0;
      let totalFollowUps = 0;
      let totalRevenue = 0;
      let campaignCount = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        totalOutreach += data.totalOutreach || 0;
        totalConversions += data.totalConversions || 0;
        totalFollowUps += data.totalFollowUps || 0;
        totalRevenue += data.totalRevenue || 0;
        campaignCount += 1;
      });

      // Store daily rollup
      const dateStr = today.toISOString().split('T')[0];
      await db.collection('analytics_daily')
        .doc(dateStr)
        .set({
          date: today,
          totalOutreach,
          totalConversions,
          totalFollowUps,
          totalRevenue,
          conversionRate: totalOutreach > 0 ? (totalConversions / totalOutreach) * 100 : 0,
          campaignCount,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

      return {
        success: true,
        metrics: {
          totalOutreach,
          totalConversions,
          totalFollowUps,
          totalRevenue,
          conversionRate: totalOutreach > 0 ? (totalConversions / totalOutreach) * 100 : 0,
          campaignCount
        },
        date: dateStr,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Analytics] Error running daily rollup:', error);
      throw error;
    }
  },

  /**
   * Get performance by channel (email, WhatsApp, SMS)
   */
  async getChannelPerformance() {
    try {
      const snapshot = await db.collection('outreach_messages')
        .where('timestamp', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .get();

      const channelStats = {
        email: { sent: 0, opened: 0, clicked: 0, converted: 0 },
        whatsapp: { sent: 0, opened: 0, clicked: 0, converted: 0 },
        sms: { sent: 0, opened: 0, clicked: 0, converted: 0 }
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        const channel = data.channel || 'email';
        
        if (channelStats[channel]) {
          channelStats[channel].sent += 1;
          if (data.opened) channelStats[channel].opened += 1;
          if (data.clicked) channelStats[channel].clicked += 1;
          if (data.converted) channelStats[channel].converted += 1;
        }
      });

      // Calculate rates
      const channelPerformance = Object.entries(channelStats).map(([channel, stats]) => ({
        channel,
        sent: stats.sent,
        openRate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
        clickRate: stats.sent > 0 ? (stats.clicked / stats.sent) * 100 : 0,
        conversionRate: stats.sent > 0 ? (stats.converted / stats.sent) * 100 : 0
      }));

      return {
        success: true,
        channels: channelPerformance,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Analytics] Error getting channel performance:', error);
      throw error;
    }
  },

  /**
   * Get top performing prospects
   */
  async getTopProspects(limit = 10) {
    try {
      const snapshot = await db.collection('prospects')
        .orderBy('conversionScore', 'desc')
        .limit(limit)
        .get();

      const topProspects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        score: doc.data().conversionScore || 0,
        status: doc.data().status || 'pending'
      }));

      return {
        success: true,
        prospects: topProspects,
        count: topProspects.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Analytics] Error getting top prospects:', error);
      throw error;
    }
  }
};

module.exports = prospectorAnalyticsService;
