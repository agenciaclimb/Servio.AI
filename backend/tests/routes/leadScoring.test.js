/**
 * Testes para Lead Scoring Routes
 * @jest
 */

const request = require('supertest');

// Mock do middleware de auth
jest.mock('../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = {
      email: 'prospector@test.com',
      isAdmin: false,
    };
    next();
  },
}));

// Mock do serviço de scoring
jest.mock('../services/leadScoringService', () => ({
  calculateLeadScore: jest.fn((lead, profile) => 75),
  scoreLeadsBatch: jest.fn((prospId, leads, profile) =>
    leads.map((l, i) => ({
      leadId: l.id,
      prospectorId: prospId,
      score: 75 - i * 10,
      scoredAt: new Date().toISOString(),
    }))
  ),
  rankLeads: jest.fn((leads) => [...leads].sort((a, b) => b.score - a.score)),
  detectHotLeads: jest.fn((prospId, leads, threshold = 80) =>
    leads.filter((l) => l.score >= threshold)
  ),
  analyzeLeadScore: jest.fn((lead, profile) => ({
    totalScore: 75,
    components: {
      categoryMatch: { value: 100, weight: 0.25 },
      locationScore: { value: 60, weight: 0.20 },
      engagementScore: { value: 70, weight: 0.25 },
      recencyScore: { value: 80, weight: 0.20 },
      demographicScore: { value: 75, weight: 0.10 },
    },
    temperature: 'warm',
    recommendation: 'Acompanhar - lead em potencial',
  })),
}));

let app;
let router;

beforeAll(() => {
  // Simular Express app com router
  const express = require('express');
  app = express();
  app.use(express.json());

  router = require('../routes/leadScoring');
  app.use('/api/prospector', router);
});

describe('Lead Scoring Routes', () => {
  const mockLead = {
    id: 'lead-001',
    category: 'design',
    location: { city: 'São Paulo', state: 'SP' },
    budget: 5000,
    createdAt: new Date().toISOString(),
  };

  const mockProfile = {
    id: 'prospector-001',
    preferredCategories: ['design'],
    serviceArea: { cities: ['São Paulo'] },
    budgetRange: { min: 1000, max: 10000 },
  };

  describe('POST /api/prospector/score-lead', () => {
    it('should score a single lead', async () => {
      const response = await request(app)
        .post('/api/prospector/score-lead')
        .send({
          leadId: 'lead-001',
          prospectorId: 'prospector@test.com',
          lead: mockLead,
          prospectProfile: mockProfile,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('leadId');
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('analysis');
      expect(response.body).toHaveProperty('recommendation');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 400 when lead is missing', async () => {
      const response = await request(app)
        .post('/api/prospector/score-lead')
        .send({
          leadId: 'lead-001',
          prospectorId: 'prospector@test.com',
          prospectProfile: mockProfile,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 when user is not authorized', async () => {
      const response = await request(app)
        .post('/api/prospector/score-lead')
        .send({
          leadId: 'lead-001',
          prospectorId: 'other-prospector@test.com',
          lead: mockLead,
          prospectProfile: mockProfile,
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/prospector/leads-batch-score', () => {
    it('should score multiple leads', async () => {
      const leads = [
        { ...mockLead, id: 'lead-001' },
        { ...mockLead, id: 'lead-002' },
      ];

      const response = await request(app)
        .post('/api/prospector/leads-batch-score')
        .send({
          prospectorId: 'prospector@test.com',
          leads,
          prospectProfile: mockProfile,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('prospectorId');
      expect(response.body).toHaveProperty('totalLeads');
      expect(response.body).toHaveProperty('scoredLeads');
      expect(Array.isArray(response.body.scoredLeads)).toBe(true);
      expect(response.body.scoredLeads.length).toBe(2);
    });

    it('should return 400 when leads array is empty', async () => {
      const response = await request(app)
        .post('/api/prospector/leads-batch-score')
        .send({
          prospectorId: 'prospector@test.com',
          leads: [],
          prospectProfile: mockProfile,
        });

      expect(response.status).toBe(400);
    });

    it('should return leads sorted by score descending', async () => {
      const leads = [
        { ...mockLead, id: 'lead-001' },
        { ...mockLead, id: 'lead-002' },
        { ...mockLead, id: 'lead-003' },
      ];

      const response = await request(app)
        .post('/api/prospector/leads-batch-score')
        .send({
          prospectorId: 'prospector@test.com',
          leads,
          prospectProfile: mockProfile,
        });

      expect(response.status).toBe(200);
      const scores = response.body.scoredLeads.map((l) => l.score);
      expect(scores[0]).toBeGreaterThanOrEqual(scores[1]);
      expect(scores[1]).toBeGreaterThanOrEqual(scores[2]);
    });
  });

  describe('GET /api/prospector/top-leads', () => {
    it('should return top leads for prospector', async () => {
      const response = await request(app)
        .get('/api/prospector/top-leads')
        .query({
          prospectorId: 'prospector@test.com',
          limit: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('prospectorId');
      expect(response.body).toHaveProperty('topLeads');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.limit).toBe(10);
    });

    it('should return 400 when prospectorId is missing', async () => {
      const response = await request(app)
        .get('/api/prospector/top-leads')
        .query({ limit: 10 });

      expect(response.status).toBe(400);
    });

    it('should default limit to 10', async () => {
      const response = await request(app)
        .get('/api/prospector/top-leads')
        .query({ prospectorId: 'prospector@test.com' });

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(10);
    });

    it('should respect custom limit', async () => {
      const response = await request(app)
        .get('/api/prospector/top-leads')
        .query({
          prospectorId: 'prospector@test.com',
          limit: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(20);
    });
  });

  describe('GET /api/prospector/hot-leads', () => {
    it('should return hot leads for prospector', async () => {
      const response = await request(app)
        .get('/api/prospector/hot-leads')
        .query({
          prospectorId: 'prospector@test.com',
          threshold: 80,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('prospectorId');
      expect(response.body).toHaveProperty('hotLeads');
      expect(response.body).toHaveProperty('threshold');
      expect(response.body.threshold).toBe(80);
    });

    it('should default threshold to 80', async () => {
      const response = await request(app)
        .get('/api/prospector/hot-leads')
        .query({ prospectorId: 'prospector@test.com' });

      expect(response.status).toBe(200);
      expect(response.body.threshold).toBe(80);
    });

    it('should return 400 when prospectorId is missing', async () => {
      const response = await request(app)
        .get('/api/prospector/hot-leads')
        .query({ threshold: 80 });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/prospector/analyze-lead', () => {
    it('should analyze a lead and return detailed breakdown', async () => {
      const response = await request(app)
        .post('/api/prospector/analyze-lead')
        .send({
          lead: mockLead,
          prospectProfile: mockProfile,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalScore');
      expect(response.body).toHaveProperty('components');
      expect(response.body).toHaveProperty('temperature');
      expect(response.body).toHaveProperty('recommendation');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should have all component breakdowns', async () => {
      const response = await request(app)
        .post('/api/prospector/analyze-lead')
        .send({
          lead: mockLead,
          prospectProfile: mockProfile,
        });

      expect(response.status).toBe(200);
      const { components } = response.body;
      expect(components).toHaveProperty('categoryMatch');
      expect(components).toHaveProperty('locationScore');
      expect(components).toHaveProperty('engagementScore');
      expect(components).toHaveProperty('recencyScore');
      expect(components).toHaveProperty('demographicScore');
    });

    it('should return 400 when lead is missing', async () => {
      const response = await request(app)
        .post('/api/prospector/analyze-lead')
        .send({
          prospectProfile: mockProfile,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Authorization checks', () => {
    it('should allow admin to view other prospectors scores', async () => {
      // Simular admin
      const originalAuth = require('../middleware/auth').requireAuth;

      jest.spyOn(require('../middleware/auth'), 'requireAuth').mockImplementation((req, res, next) => {
        req.user = {
          email: 'admin@test.com',
          isAdmin: true,
        };
        next();
      });

      const response = await request(app)
        .post('/api/prospector/score-lead')
        .send({
          leadId: 'lead-001',
          prospectorId: 'other-prospector@test.com',
          lead: mockLead,
          prospectProfile: mockProfile,
        });

      expect(response.status).toBe(200);

      // Restore original
      jest.spyOn(require('../middleware/auth'), 'requireAuth').mockImplementation(originalAuth);
    });
  });
});
