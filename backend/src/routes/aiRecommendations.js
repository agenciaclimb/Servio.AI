/**
 * Routes para AI Recommendations API
 * Endpoints para gerar recomendações de ações e conversão usando IA
 * 
 * Base path: /api/prospector
 */

const express = require('express');

module.exports = (dependencies = {}) => {
  const { requireAuth } = dependencies.auth || require('../middleware/auth');
  const aiServiceFactory = dependencies.aiServiceFactory || require('../services/aiRecommendationService');

  const {
    generateNextActions,
    predictConversion,
    suggestFollowUpSequence,
    generateComprehensiveRecommendation,
  } = aiServiceFactory(); // Initialize with default dependencies (or passed if factory supports it, but here we just call it)

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
      if (prospectorId && req.user.email && prospectorId !== req.user.email && !req.user.isAdmin) {
         // Note: Added safety check for req.user.email existence
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (!lead) {
        return res.status(400).json({ error: 'Lead is required' });
      }

      // Gerar recomendação completa
      const recommendation = await generateComprehensiveRecommendation(lead, leadScore, history);

      res.json(recommendation);
    } catch (error) {
      console.error('Error in ai-recommendations:', error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  });

  // POST /api/prospector/next-action
  router.post('/next-action', requireAuth, async (req, res) => {
    try {
      const { lead, history = [] } = req.body;
      if (!lead) return res.status(400).json({ error: 'Lead is required' });

      const result = await generateNextActions(lead, history);
      res.json(result);
    } catch (error) {
       console.error('Error:', error);
       res.status(500).json({ error: 'Internal error' });
    }
  });

  // POST /api/prospector/conversion-prediction
  router.post('/conversion-prediction', requireAuth, async (req, res) => {
    try {
      const { lead, leadScore, history } = req.body;
      if (!lead) return res.status(400).json({ error: 'Lead is required' });

      const result = await predictConversion(lead, leadScore, history);
      res.json(result);
    } catch (error) {
       console.error('Error:', error);
       res.status(500).json({ error: 'Internal error' });
    }
  });

  // POST /api/prospector/followup-sequence
  router.post('/followup-sequence', requireAuth, async (req, res) => {
    try {
      const { lead, history } = req.body;
      if (!lead) return res.status(400).json({ error: 'Lead is required' });

      const result = await suggestFollowUpSequence(lead, history);
      res.json(result);
    } catch (error) {
       console.error('Error:', error);
       res.status(500).json({ error: 'Internal error' });
    }
  });
  
  // GET /api/prospector/ai-status
  router.get('/ai-status', requireAuth, async (req, res) => {
      res.json({
          status: 'available',
          service: 'measured (gemini)',
          timestamp: new Date().toISOString()
      });
  });

  return router;
};
