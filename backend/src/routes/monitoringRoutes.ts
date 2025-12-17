/**
 * Monitoring Routes
 * Express endpoints for metrics, alerts, and health checks
 * Task 4.4 - Sistema de Monitoramento & Alertas
 */

import { Router, Request, Response } from 'express';
import { logger } from 'firebase-functions';
import MonitoringService from '../services/monitoringService';

const router = Router();

/**
 * POST /api/monitoring/metrics
 * Record metric
 */
router.post('/metrics', async (req: Request, res: Response) => {
  try {
    const { name, value, tags, unit } = req.body;

    if (!name || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, value',
      });
    }

    await MonitoringService.recordMetric({
      name,
      value: Number(value),
      timestamp: new Date(),
      tags,
      unit,
    });

    return res.status(201).json({
      success: true,
      message: 'Metric recorded',
    });
  } catch (error: any) {
    logger.error('Error in POST /metrics', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/monitoring/metrics/batch
 * Record multiple metrics
 */
router.post('/metrics/batch', async (req: Request, res: Response) => {
  try {
    const { metrics } = req.body;

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'metrics must be a non-empty array',
      });
    }

    await MonitoringService.recordMetrics(metrics);

    return res.status(201).json({
      success: true,
      message: `${metrics.length} metrics recorded`,
    });
  } catch (error: any) {
    logger.error('Error in POST /metrics/batch', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/monitoring/metrics/:name
 * Get metrics by name
 */
router.get('/metrics/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { startDate, endDate, limit } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    const maxLimit = limit ? parseInt(limit as string) : 1000;

    const metrics = await MonitoringService.getMetrics(name, start, end, maxLimit);

    return res.status(200).json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  } catch (error: any) {
    logger.error('Error in GET /metrics/:name', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/monitoring/alerts
 * Trigger alert
 */
router.post('/alerts', async (req: Request, res: Response) => {
  try {
    const { name, severity, message, source, metadata } = req.body;

    if (!name || !severity || !message || !source) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, severity, message, source',
      });
    }

    const alertId = await MonitoringService.triggerAlert({
      name,
      severity,
      message,
      source,
      metadata,
    });

    return res.status(201).json({
      success: true,
      alertId,
      message: 'Alert triggered',
    });
  } catch (error: any) {
    logger.error('Error in POST /alerts', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/monitoring/alerts
 * Get active alerts
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { severity } = req.query;

    const alerts = await MonitoringService.getActiveAlerts(severity as any);

    return res.status(200).json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error: any) {
    logger.error('Error in GET /alerts', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /api/monitoring/alerts/:alertId/resolve
 * Resolve alert
 */
router.put('/alerts/:alertId/resolve', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { resolution } = req.body;

    const success = await MonitoringService.resolveAlert(alertId, resolution);

    return res.status(success ? 200 : 400).json({
      success,
      message: success ? 'Alert resolved' : 'Failed to resolve alert',
    });
  } catch (error: any) {
    logger.error('Error in PUT /alerts/:alertId/resolve', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/monitoring/health
 * Health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await MonitoringService.healthCheck();

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      data: health,
    });
  } catch (error: any) {
    logger.error('Error in GET /health', { error: error.message });
    return res.status(503).json({
      success: false,
      error: 'Health check failed',
    });
  }
});

/**
 * GET /api/monitoring/slo
 * Get SLO metrics
 */
router.get('/slo', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const sloMetrics = await MonitoringService.getSLOMetrics(start, end);

    return res.status(200).json({
      success: true,
      data: sloMetrics,
    });
  } catch (error: any) {
    logger.error('Error in GET /slo', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/monitoring/slo/check
 * Check SLO violations
 */
router.post('/slo/check', async (req: Request, res: Response) => {
  try {
    await MonitoringService.checkSLOViolations();

    return res.status(200).json({
      success: true,
      message: 'SLO check completed',
    });
  } catch (error: any) {
    logger.error('Error in POST /slo/check', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
