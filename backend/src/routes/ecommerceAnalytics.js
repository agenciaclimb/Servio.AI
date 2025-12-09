const express = require('express');
const {
  getDashboardMetrics,
  getRevenueMetrics,
  getFunnelMetrics,
  buildCustomReport,
  generateCSVExport,
  generatePDFExport,
  scheduleReport,
  analyzeCohorts,
  trackEvent,
} = require('../services/ecommerceAnalyticsService');

module.exports = function createEcommerceAnalyticsRouter(db) {
  const router = express.Router();

  /**
   * GET /api/ecommerce-analytics/dashboard
   * Real-time dashboard metrics
   */
  router.get('/dashboard', async (req, res) => {
    try {
      const { dateRange = 'last30days' } = req.query;
      const metrics = await getDashboardMetrics(db, dateRange);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('[Ecommerce Analytics] Dashboard error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/ecommerce-analytics/revenue
   * Revenue metrics with aggregation
   */
  router.get('/revenue', async (req, res) => {
    try {
      const { granularity = 'daily', dateRange = 'last30days' } = req.query;
      const metrics = await getRevenueMetrics(db, granularity, dateRange);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('[Ecommerce Analytics] Revenue error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/ecommerce-analytics/funnel
   * Conversion funnel analysis
   */
  router.get('/funnel', async (req, res) => {
    try {
      const { dateRange = 'last30days' } = req.query;
      const metrics = await getFunnelMetrics(db, dateRange);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('[Ecommerce Analytics] Funnel error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/ecommerce-analytics/reports/custom
   * Build custom report with filters
   */
  router.post('/reports/custom', async (req, res) => {
    try {
      const filters = req.body.filters || {};
      const report = await buildCustomReport(db, filters);
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('[Ecommerce Analytics] Custom report error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/ecommerce-analytics/reports/:id/export
   * Export report (CSV or PDF)
   */
  router.get('/reports/:id/export', async (req, res) => {
    try {
      const { format = 'csv' } = req.query;

      // For demo, generate sample export
      const ordersSnapshot = await db.collection('orders').limit(10).get();
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let exportData;
      let contentType;
      let filename;

      if (format === 'pdf') {
        exportData = generatePDFExport(orders);
        contentType = 'application/json';
        filename = 'report.json';
      } else {
        exportData = generateCSVExport(orders);
        contentType = 'text/csv';
        filename = 'report.csv';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } catch (error) {
      console.error('[Ecommerce Analytics] Export error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/ecommerce-analytics/reports/schedule
   * Schedule report for email delivery
   */
  router.post('/reports/schedule', async (req, res) => {
    try {
      const reportConfig = req.body;
      const scheduled = await scheduleReport(db, reportConfig);
      res.json({ success: true, data: scheduled });
    } catch (error) {
      console.error('[Ecommerce Analytics] Schedule report error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/ecommerce-analytics/cohorts
   * User cohort analysis
   */
  router.get('/cohorts', async (req, res) => {
    try {
      const { dateRange = 'last90days' } = req.query;
      const cohorts = await analyzeCohorts(db, dateRange);
      res.json({ success: true, data: cohorts });
    } catch (error) {
      console.error('[Ecommerce Analytics] Cohorts error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/ecommerce-analytics/events
   * Track custom events
   */
  router.post('/events', async (req, res) => {
    try {
      const eventData = req.body;
      const event = await trackEvent(db, eventData);
      res.json({ success: true, data: event });
    } catch (error) {
      console.error('[Ecommerce Analytics] Event tracking error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  return router;
};
