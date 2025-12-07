/**
 * Routes para Lead Scoring API
 * Endpoints para calcular e recuperar scores de leads
 * 
 * Base path: /api/prospector
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  calculateLeadScore,
  scoreLeadsBatch,
  rankLeads,
  detectHotLeads,
  analyzeLeadScore,
} = require('../services/leadScoringService');

const router = express.Router();

/**
 * POST /api/prospector/score-lead
 * Calcula o score de um lead específico
 * 
 * Body:
 * {
 *   "leadId": "string",
 *   "prospectorId": "string",
 *   "lead": {lead object},
 *   "prospectProfile": {profile object}
 * }
 * 
 * Response: { leadId, score, analysis, recommendation }
 */
router.post('/score-lead', requireAuth, async (req, res) => {
  try {
    const { leadId, prospectorId, lead, prospectProfile } = req.body;

    // Validar que o prospector só pode ver seus próprios scores
    if (prospectorId !== req.user.email && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!lead || !prospectProfile) {
      return res.status(400).json({ error: 'Lead and prospectProfile are required' });
    }

    // Calcular score
    const score = calculateLeadScore(lead, prospectProfile);
    const analysis = analyzeLeadScore(lead, prospectProfile);

    res.json({
      leadId,
      score,
      analysis,
      recommendation: analysis.recommendation,
      temperature: analysis.temperature,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error scoring lead:', error);
    res.status(500).json({ error: 'Failed to score lead' });
  }
});

/**
 * POST /api/prospector/leads-batch-score
 * Calcula scores para múltiplos leads
 * 
 * Body:
 * {
 *   "prospectorId": "string",
 *   "leads": [{ id, category, location, ... }],
 *   "prospectProfile": {profile object}
 * }
 * 
 * Response: [{ leadId, score, temperature, timestamp }]
 */
router.post('/leads-batch-score', requireAuth, async (req, res) => {
  try {
    const { prospectorId, leads, prospectProfile } = req.body;

    // Validar que o prospector só pode ver seus próprios scores
    if (prospectorId !== req.user.email && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'Leads array is required and must not be empty' });
    }

    if (!prospectProfile) {
      return res.status(400).json({ error: 'prospectProfile is required' });
    }

    // Calcular scores em batch
    const scored = scoreLeadsBatch(prospectorId, leads, prospectProfile);
    const ranked = rankLeads(scored);

    res.json({
      prospectorId,
      totalLeads: leads.length,
      scoredLeads: ranked,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error batch scoring leads:', error);
    res.status(500).json({ error: 'Failed to score leads batch' });
  }
});

/**
 * GET /api/prospector/top-leads
 * Recupera os melhores leads para um prospector
 * 
 * Query params:
 * - prospectorId: string (required)
 * - limit: number (default: 10)
 * - threshold: number (default: 0) - score mínimo
 * 
 * Response: { prospectorId, topLeads: [], timestamp }
 */
router.get('/top-leads', requireAuth, async (req, res) => {
  try {
    const { prospectorId, limit = 10, threshold = 0 } = req.query;

    // Validar que o prospector só pode ver seus próprios leads
    if (prospectorId !== req.user.email && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!prospectorId) {
      return res.status(400).json({ error: 'prospectorId is required' });
    }

    // Aqui seria feito um query ao Firestore para pegar leads do prospector
    // Por enquanto, retornamos estrutura vazia como exemplo
    const topLeads = [];

    res.json({
      prospectorId,
      topLeads,
      limit: parseInt(limit),
      threshold: parseInt(threshold),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching top leads:', error);
    res.status(500).json({ error: 'Failed to fetch top leads' });
  }
});

/**
 * GET /api/prospector/hot-leads
 * Recupera leads "quentes" (high priority)
 * 
 * Query params:
 * - prospectorId: string (required)
 * - threshold: number (default: 80) - score mínimo para "hot"
 * - limit: number (default: 20)
 * 
 * Response: { prospectorId, hotLeads: [], count }
 */
router.get('/hot-leads', requireAuth, async (req, res) => {
  try {
    const { prospectorId, threshold = 80, limit = 20 } = req.query;

    // Validar que o prospector só pode ver seus próprios leads
    if (prospectorId !== req.user.email && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!prospectorId) {
      return res.status(400).json({ error: 'prospectorId is required' });
    }

    // Aqui seria feito um query ao Firestore com filtro de score >= threshold
    const hotLeads = [];

    res.json({
      prospectorId,
      hotLeads,
      threshold: parseInt(threshold),
      count: hotLeads.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching hot leads:', error);
    res.status(500).json({ error: 'Failed to fetch hot leads' });
  }
});

/**
 * POST /api/prospector/analyze-lead
 * Analisa um lead e retorna breakdown detalhado do score
 * 
 * Body: { lead, prospectProfile }
 * 
 * Response: {
 *   score,
 *   components: { categoryMatch, location, engagement, recency, demographic },
 *   temperature,
 *   recommendation
 * }
 */
router.post('/analyze-lead', requireAuth, async (req, res) => {
  try {
    const { lead, prospectProfile } = req.body;

    if (!lead || !prospectProfile) {
      return res.status(400).json({ error: 'Lead and prospectProfile are required' });
    }

    const analysis = analyzeLeadScore(lead, prospectProfile);

    res.json({
      ...analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing lead:', error);
    res.status(500).json({ error: 'Failed to analyze lead' });
  }
});

module.exports = router;
