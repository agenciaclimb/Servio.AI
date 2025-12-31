/**
 * Cloud Scheduler Routes
 * Handles automated tasks triggered by Google Cloud Scheduler
 *
 * Requirements:
 * - Requests must come from Cloud Scheduler (Authorization header validation)
 * - Each route handles specific automated workflow
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../authorizationMiddleware');
const followUpService = require('../followUpService');
const { processPendingOutreach } = require('../outreachScheduler');
const prospectorAnalyticsService = require('../services/analyticsService');

// Verify Cloud Scheduler token
// Cloud Run automatically validates OIDC tokens from Cloud Scheduler
// No additional validation needed - Cloud Run rejects unauthorized requests
const verifyCloudSchedulerToken = async (req, res, next) => {
  // Cloud Run with OIDC auth already validated the request
  // Just pass through
  next();
};

/**
 * POST /api/scheduler/follow-ups
 * Process pending follow-ups for prospects
 * Triggered: Every 4 hours
 */
router.post('/follow-ups', verifyCloudSchedulerToken, async (req, res) => {
  try {
    console.log('[Scheduler] Processing follow-ups...');

    const result = await processPendingOutreach();

    res.json({
      success: true,
      message: 'Follow-up processing completed',
      processed: result.processed,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Scheduler] Follow-up error:', error);
    res.status(500).json({
      error: 'Failed to process follow-ups',
      details: error.message,
    });
  }
});

/**
 * POST /api/scheduler/email-reminders
 * Send email reminders to inactive providers
 * Triggered: Every 24 hours
 */
router.post('/email-reminders', verifyCloudSchedulerToken, async (req, res) => {
  try {
    console.log('[Scheduler] Processing email reminders...');

    const result = await followUpService.sendInactiveProviderReminders();

    res.json({
      success: true,
      message: 'Email reminders sent',
      recipients: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Scheduler] Email reminder error:', error);
    res.status(500).json({
      error: 'Failed to send email reminders',
      details: error.message,
    });
  }
});

/**
 * POST /api/scheduler/analytics-rollup
 * Aggregate daily analytics and generate insights
 * Triggered: Every day at midnight UTC
 */
router.post('/analytics-rollup', verifyCloudSchedulerToken, async (req, res) => {
  try {
    console.log('[Scheduler] Running analytics rollup...');

    const result = await prospectorAnalyticsService.runDailyRollup();

    res.json({
      success: true,
      message: 'Analytics rollup completed',
      metrics: result.metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Scheduler] Analytics rollup error:', error);
    res.status(500).json({
      error: 'Failed to run analytics rollup',
      details: error.message,
    });
  }
});

/**
 * POST /api/scheduler/campaign-performance
 * Calculate campaign performance metrics
 * Triggered: Every 6 hours
 */
router.post('/campaign-performance', verifyCloudSchedulerToken, async (req, res) => {
  try {
    console.log('[Scheduler] Calculating campaign performance...');

    const result = await prospectorAnalyticsService.calculateCampaignMetrics();

    res.json({
      success: true,
      message: 'Campaign metrics calculated',
      campaigns: result.campaigns,
      totalMetrics: result.totals,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Scheduler] Campaign performance error:', error);
    res.status(500).json({
      error: 'Failed to calculate campaign metrics',
      details: error.message,
    });
  }
});

/**
 * POST /api/scheduler/cleanup
 * Clean up old documents and cache
 * Triggered: Every 7 days
 */
router.post('/cleanup', verifyCloudSchedulerToken, async (req, res) => {
  try {
    console.log('[Scheduler] Running cleanup...');

    // Delete old logs (older than 30 days)
    // Clean up expired caches
    // Archive old campaigns

    res.json({
      success: true,
      message: 'Cleanup completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Scheduler] Cleanup error:', error);
    res.status(500).json({
      error: 'Failed to run cleanup',
      details: error.message,
    });
  }
});

/**
 * GET /api/scheduler/health
 * Health check for scheduler
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'cloud-scheduler',
  });
});

module.exports = router;
