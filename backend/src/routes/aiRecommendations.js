/**
 * Routes para AI Recommendations API
 * Endpoints para gerar recomendações de ações e conversão usando IA
 * 
 * Base path: /api/prospector
 */

const express = require('express');
const {
  generateNextActions,
  predictConversion,
  suggestFollowUpSequence,
  generateComprehensiveRecommendation,
} = require('../services/aiRecommendationService');

function createAiRecommendationsRouter({
  requireAuth = require('../authorizationMiddleware').requireAuth,
  aiService = {
    generateNextActions,
    predictConversion,
    suggestFollowUpSequence,
    generateComprehensiveRecommendation,
  },
} = {}) {
  const router = express.Router();

/**
 * POST /api/prospector/ai-recommendations
 * Gera recomendações completas para um lead
 * 
 * Body:
 * {
 *   "prospectorId": "string",
 *   "lead": {lead object},
 *   "leadScore": number (0-100),
 *   "history": [{type, date}]
 * }
 * 
 * Response: Comprehensive recommendation object
 */
  router.post('/ai-recommendations', requireAuth, async (req, res) => {
  try {
    const { prospectorId, lead, leadScore = 50, history = [] } = req.body;

    // Validar que o prospector só pode ver suas recomendações
    if (prospectorId !== req.user.email && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!lead) {
      return res.status(400).json({ error: 'Lead is required' });
    }

    // Gerar recomendação completa
    const recommendation = await aiService.generateComprehensiveRecommendation(lead, leadScore, history);

    res.json({
      ...recommendation,
      prospectorId,
    });
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * POST /api/prospector/next-action
 * Gera apenas a próxima ação recomendada
 * 
 * Body: { lead, history }
 * Response: { action, template, timeToSend, confidence, reasoning }
 */
  router.post('/next-action', requireAuth, async (req, res) => {
  try {
    const { lead, history = [] } = req.body;

    if (!lead) {
      return res.status(400).json({ error: 'Lead is required' });
    }

    const nextAction = await aiService.generateNextActions(lead, history);

    res.json({
      ...nextAction,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating next action:', error);
    res.status(500).json({ error: 'Failed to generate next action' });
  }
});

/**
 * POST /api/prospector/conversion-prediction
 * Prediz probabilidade de conversão
 * 
 * Body: { lead, leadScore, history }
 * Response: { probability, factors, risk, recommendation }
 */
  router.post('/conversion-prediction', requireAuth, async (req, res) => {
  try {
    const { lead, leadScore = 50, history = [] } = req.body;

    if (!lead) {
      return res.status(400).json({ error: 'Lead is required' });
    }

    const prediction = await aiService.predictConversion(lead, leadScore, history);

    res.json({
      ...prediction,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error predicting conversion:', error);
    res.status(500).json({ error: 'Failed to predict conversion' });
  }
});

/**
 * POST /api/prospector/followup-sequence
 * Sugere sequência de follow-ups
 * 
 * Body: { lead, history }
 * Response: { sequence: [{step, action, delay, message, scheduledFor}] }
 */
  router.post('/followup-sequence', requireAuth, async (req, res) => {
  try {
    const { lead, history = [] } = req.body;

    if (!lead) {
      return res.status(400).json({ error: 'Lead is required' });
    }

    const followUpSequence = await aiService.suggestFollowUpSequence(lead, history);

    res.json({
      ...followUpSequence,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error suggesting follow-up sequence:', error);
    res.status(500).json({ error: 'Failed to suggest follow-up sequence' });
  }
});

/**
 * GET /api/prospector/ai-status
 * Verifica se o serviço de IA está disponível
 */
  router.get('/ai-status', requireAuth, async (req, res) => {
  try {
    // Verificar se GEMINI_API_KEY está configurada
    const hasApiKey = !!process.env.GEMINI_API_KEY;

    res.json({
      status: hasApiKey ? 'available' : 'not-configured',
      service: 'gemini-2.0-flash-exp',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check AI status' });
  }
});

  return router;
}

module.exports = createAiRecommendationsRouter();
module.exports.createAiRecommendationsRouter = createAiRecommendationsRouter;
