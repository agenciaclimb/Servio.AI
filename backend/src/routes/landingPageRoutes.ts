/**
 * Landing Page Routes
 * Express endpoints for AI landing page generation and A/B testing
 * Task 4.3 - Landing Pages com IA
 */

import { Router, Request, Response } from 'express';
import { logger } from 'firebase-functions';
import LandingPageService from '../services/landingPageService';

const router = Router();

/**
 * POST /api/landing-pages/generate
 * Generate new landing page
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { briefing, userId } = req.body;

    if (!briefing || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: briefing, userId',
      });
    }

    if (!briefing.serviceType || !briefing.targetAudience) {
      return res.status(400).json({
        success: false,
        error: 'Briefing missing required fields: serviceType, targetAudience',
      });
    }

    const page = await LandingPageService.generateLandingPage(briefing, userId);

    return res.status(201).json({
      success: true,
      data: page,
    });
  } catch (error: any) {
    logger.error('Error in /generate', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/landing-pages/:pageId
 * Get landing page details
 */
router.get('/:pageId', async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;

    const page = await LandingPageService.getLandingPage(pageId);

    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Landing page not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error: any) {
    logger.error('Error in GET /:pageId', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/landing-pages/user/:userId
 * Get user's landing pages
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const pages = await LandingPageService.getUserLandingPages(userId, limit);

    return res.status(200).json({
      success: true,
      data: pages,
      count: pages.length,
    });
  } catch (error: any) {
    logger.error('Error in GET /user/:userId', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/landing-pages/:pageId/view
 * Record page view for A/B testing
 */
router.post('/:pageId/view', async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    const { variant } = req.body;

    if (!variant) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: variant',
      });
    }

    await LandingPageService.recordPageView(pageId, variant);

    return res.status(200).json({
      success: true,
      message: 'Page view recorded',
    });
  } catch (error: any) {
    logger.error('Error in POST /:pageId/view', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/landing-pages/:pageId/conversion
 * Record conversion for A/B testing
 */
router.post('/:pageId/conversion', async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    const { variant, amount } = req.body;

    if (!variant) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: variant',
      });
    }

    await LandingPageService.recordConversion(pageId, variant, amount);

    return res.status(200).json({
      success: true,
      message: 'Conversion recorded',
    });
  } catch (error: any) {
    logger.error('Error in POST /:pageId/conversion', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/landing-pages/:pageId/ab-results
 * Get A/B test results
 */
router.get('/:pageId/ab-results', async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;

    const results = await LandingPageService.getABTestResults(pageId);

    if (!results) {
      return res.status(404).json({
        success: false,
        error: 'No A/B test data found',
      });
    }

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    logger.error('Error in GET /:pageId/ab-results', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/landing-pages/:pageId
 * Delete landing page
 */
router.delete('/:pageId', async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;

    const success = await LandingPageService.deleteLandingPage(pageId);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to delete landing page',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Landing page deleted',
    });
  } catch (error: any) {
    logger.error('Error in DELETE /:pageId', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/landing-pages/health
 * Health check
 */
router.get('/health', (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    service: 'landing-page-generator',
    timestamp: new Date(),
  });
});

export default router;
