/**
 * Analytics Routes
 * Endpoints for retrieving prospecting and campaign analytics
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../authorizationMiddleware');
const analyticsService = require('../services/analyticsService');

/**
 * GET /api/analytics/metrics-timeline
 * Get metrics timeline for past 30 days
 */
router.get('/metrics-timeline', requireAuth, requireRole(['prospector', 'admin']), async (req, res) => {
  try {
    const result = await analyticsService.getMetricsTimeline();
    res.json(result);
  } catch (error) {
    console.error('[Analytics] Metrics timeline error:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics timeline',
      details: error.message
    });
  }
});

/**
 * GET /api/analytics/campaign-performance
 * Get campaign performance metrics
 */
router.get('/campaign-performance', requireAuth, requireRole(['prospector', 'admin']), async (req, res) => {
  try {
    const result = await analyticsService.calculateCampaignMetrics();
    res.json(result);
  } catch (error) {
    console.error('[Analytics] Campaign performance error:', error);
    res.status(500).json({
      error: 'Failed to fetch campaign performance',
      details: error.message
    });
  }
});

/**
 * GET /api/analytics/channel-performance
 * Get performance by channel (email, WhatsApp, SMS)
 */
router.get('/channel-performance', requireAuth, requireRole(['prospector', 'admin']), async (req, res) => {
  try {
    const result = await analyticsService.getChannelPerformance();
    res.json(result);
  } catch (error) {
    console.error('[Analytics] Channel performance error:', error);
    res.status(500).json({
      error: 'Failed to fetch channel performance',
      details: error.message
    });
  }
});

/**
 * GET /api/analytics/top-prospects
 * Get top performing prospects
 */
router.get('/top-prospects', requireAuth, requireRole(['prospector', 'admin']), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const result = await analyticsService.getTopProspects(limit);
    res.json(result);
  } catch (error) {
    console.error('[Analytics] Top prospects error:', error);
    res.status(500).json({
      error: 'Failed to fetch top prospects',
      details: error.message
    });
  }
});

module.exports = router;
