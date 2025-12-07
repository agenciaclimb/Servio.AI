/**
 * Testes para AI Recommendations Routes
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

// Mock do serviço de IA
jest.mock('../services/aiRecommendationService', () => ({
  generateNextActions: jest.fn(async (lead, history) => ({
    action: 'email',
    template: 'introduction',
    timeToSend: '09:00',
    confidence: 0.85,
    reasoning: 'Lead recently created',
  })),

  predictConversion: jest.fn(async (lead, score, history) => ({
    probability: 0.75,
    factors: {
      leadScore: score / 100,
      engagement: 0.5,
      recency: 0.8,
    },
    risk: 'low',
    highRiskFactors: [],
    positiveFactors: ['recent contact', 'good budget match'],
    timeline: '5-7 days',
    recommendation: 'Continue with current strategy',
  })),

  suggestFollowUpSequence: jest.fn(async (lead, history) => ({
    sequence: [
      {
        step: 1,
        action: 'email',
        delay: '2 horas',
        message: 'Follow-up',
        scheduledFor: new Date(),
      },
      {
        step: 2,
        action: 'email',
        delay: '2 dias',
        message: 'Case study',
        scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    ],
    reasoning: 'Multi-touch approach recommended',
  })),

  generateComprehensiveRecommendation: jest.fn(async (lead, score, history) => ({
    lead: { id: lead.id, name: lead.name, category: lead.category },
    leadScore: score,
    recommendations: {
      nextAction: {
        action: 'email',
        template: 'introduction',
        timeToSend: '09:00',
        confidence: 0.85,
      },
      conversionProbability: 0.75,
      conversionRisk: 'low',
      followUpSequence: [
        {
          step: 1,
          action: 'email',
          delay: '2 horas',
          message: 'Follow-up',
        },
      ],
    },
    priority: 'high',
    generatedAt: new Date().toISOString(),
  })),
}));

let app;

beforeAll(() => {
  const express = require('express');
  app = express();
  app.use(express.json());

  const router = require('../routes/aiRecommendations');
  app.use('/api/prospector', router);
});

describe('AI Recommendations Routes', () => {
  const mockLead = {
    id: 'lead-001',
    name: 'Tech Startup XYZ',
    category: 'design',
    location: { city: 'São Paulo', state: 'SP' },
    budget: 8000,
  };

  const mockHistory = [
    {
      type: 'email',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  describe('POST /api/prospector/ai-recommendations', () => {
    it('should generate comprehensive recommendations', async () => {
      const response = await request(app)
        .post('/api/prospector/ai-recommendations')
        .send({
          prospectorId: 'prospector@test.com',
          lead: mockLead,
          leadScore: 75,
          history: mockHistory,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('lead');
      expect(response.body).toHaveProperty('leadScore');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('priority');
      expect(response.body).toHaveProperty('generatedAt');
    });

    it('should include all recommendation types', async () => {
      const response = await request(app)
        .post('/api/prospector/ai-recommendations')
        .send({
          prospectorId: 'prospector@test.com',
          lead: mockLead,
          leadScore: 75,
          history: mockHistory,
        });

      expect(response.status).toBe(200);
      const { recommendations } = response.body;
      expect(recommendations).toHaveProperty('nextAction');
      expect(recommendations).toHaveProperty('conversionProbability');
      expect(recommendations).toHaveProperty('conversionRisk');
      expect(recommendations).toHaveProperty('followUpSequence');
    });

    it('should return 400 when lead is missing', async () => {
      const response = await request(app)
        .post('/api/prospector/ai-recommendations')
        .send({
          prospectorId: 'prospector@test.com',
          leadScore: 75,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 when not authorized', async () => {
      const response = await request(app)
        .post('/api/prospector/ai-recommendations')
        .send({
          prospectorId: 'other-prospector@test.com',
          lead: mockLead,
          leadScore: 75,
        });

      expect(response.status).toBe(403);
    });

    it('should default leadScore to 50 when not provided', async () => {
      const response = await request(app)
        .post('/api/prospector/ai-recommendations')
        .send({
          prospectorId: 'prospector@test.com',
          lead: mockLead,
        });

      expect(response.status).toBe(200);
      expect(response.body.leadScore).toBe(50); // default value in service
    });
  });

  describe('POST /api/prospector/next-action', () => {
    it('should generate next action', async () => {
      const response = await request(app)
        .post('/api/prospector/next-action')
        .send({
          lead: mockLead,
          history: mockHistory,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('action');
      expect(response.body).toHaveProperty('template');
      expect(response.body).toHaveProperty('timeToSend');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('generatedAt');
    });

    it('should have valid action type', async () => {
      const response = await request(app)
        .post('/api/prospector/next-action')
        .send({
          lead: mockLead,
          history: mockHistory,
        });

      expect(response.status).toBe(200);
      const validActions = ['email', 'whatsapp', 'phone', 'linkedin', 'in-person'];
      expect(validActions).toContain(response.body.action);
    });

    it('should return 400 when lead is missing', async () => {
      const response = await request(app)
        .post('/api/prospector/next-action')
        .send({
          history: mockHistory,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/prospector/conversion-prediction', () => {
    it('should predict conversion probability', async () => {
      const response = await request(app)
        .post('/api/prospector/conversion-prediction')
        .send({
          lead: mockLead,
          leadScore: 75,
          history: mockHistory,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('probability');
      expect(response.body).toHaveProperty('factors');
      expect(response.body).toHaveProperty('risk');
      expect(response.body).toHaveProperty('generatedAt');
    });

    it('should return probability between 0-1', async () => {
      const response = await request(app)
        .post('/api/prospector/conversion-prediction')
        .send({
          lead: mockLead,
          leadScore: 75,
        });

      expect(response.status).toBe(200);
      expect(response.body.probability).toBeGreaterThanOrEqual(0);
      expect(response.body.probability).toBeLessThanOrEqual(1);
    });

    it('should include factor breakdown', async () => {
      const response = await request(app)
        .post('/api/prospector/conversion-prediction')
        .send({
          lead: mockLead,
          leadScore: 75,
        });

      expect(response.status).toBe(200);
      expect(response.body.factors).toHaveProperty('leadScore');
      expect(response.body.factors).toHaveProperty('engagement');
      expect(response.body.factors).toHaveProperty('recency');
    });

    it('should return 400 when lead is missing', async () => {
      const response = await request(app)
        .post('/api/prospector/conversion-prediction')
        .send({
          leadScore: 75,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/prospector/followup-sequence', () => {
    it('should suggest follow-up sequence', async () => {
      const response = await request(app)
        .post('/api/prospector/followup-sequence')
        .send({
          lead: mockLead,
          history: mockHistory,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sequence');
      expect(Array.isArray(response.body.sequence)).toBe(true);
      expect(response.body).toHaveProperty('generatedAt');
    });

    it('should have at least 1 follow-up step', async () => {
      const response = await request(app)
        .post('/api/prospector/followup-sequence')
        .send({
          lead: mockLead,
          history: mockHistory,
        });

      expect(response.status).toBe(200);
      expect(response.body.sequence.length).toBeGreaterThanOrEqual(1);
    });

    it('should have valid actions in sequence', async () => {
      const response = await request(app)
        .post('/api/prospector/followup-sequence')
        .send({
          lead: mockLead,
          history: mockHistory,
        });

      expect(response.status).toBe(200);
      const validActions = ['email', 'whatsapp', 'phone', 'linkedin', 'in-person'];
      response.body.sequence.forEach((step) => {
        expect(validActions).toContain(step.action);
      });
    });

    it('should return 400 when lead is missing', async () => {
      const response = await request(app)
        .post('/api/prospector/followup-sequence')
        .send({
          history: mockHistory,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/prospector/ai-status', () => {
    it('should return AI service status', async () => {
      const response = await request(app)
        .get('/api/prospector/ai-status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should have valid status value', async () => {
      const response = await request(app)
        .get('/api/prospector/ai-status');

      expect(response.status).toBe(200);
      expect(['available', 'not-configured']).toContain(response.body.status);
    });

    it('should specify gemini service', async () => {
      const response = await request(app)
        .get('/api/prospector/ai-status');

      expect(response.status).toBe(200);
      expect(response.body.service).toContain('gemini');
    });
  });

  describe('Authorization checks', () => {
    it('should allow admin to access other prospectors recommendations', async () => {
      jest.spyOn(require('../middleware/auth'), 'requireAuth').mockImplementation((req, res, next) => {
        req.user = {
          email: 'admin@test.com',
          isAdmin: true,
        };
        next();
      });

      const response = await request(app)
        .post('/api/prospector/ai-recommendations')
        .send({
          prospectorId: 'other-prospector@test.com',
          lead: mockLead,
          leadScore: 75,
        });

      expect(response.status).toBe(200);
    });
  });
});
