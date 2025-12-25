/**
 * Testes para AI Recommendations Routes
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import the factory (it's CJS, so default export might vary)
import aiRecommendationsFactory from '../../src/routes/aiRecommendations.js';

describe('AI Recommendations Routes', () => {
  let app;

  beforeAll(async () => {
    vi.resetModules(); // Cleanup

    // Create a manual mock for auth that ALLOWS everything
    const mockAuthMiddleware = {
      requireAuth: (req, res, next) => {
        req.user = {
          email: 'prospector@test.com',
          isAdmin: false,
          type: 'admin' // Ensure rate limit bypass if needed
        };
        next();
      }
    };

    // Mock AI Service Factory
    const mockAiServiceFactory = () => ({
        generateNextActions: vi.fn(async (lead, history) => ({
          action: 'email',
          template: 'introduction',
          timeToSend: '09:00',
          confidence: 0.85,
          reasoning: 'Lead recently created',
        })),

        predictConversion: vi.fn(async (lead, score, history) => ({
          probability: 0.75,
          factors: {
            leadScore: score / 100,
            engagement: 0.5,
            recency: 0.8,
          },
          recommendation: 'Continue with current strategy',
        })),

        suggestFollowUpSequence: vi.fn(async (lead, history) => ({
          sequence: [
            {
              step: 1,
              action: 'email',
              delay: '2 horas',
              message: 'Follow-up',
            }
          ]
        })),

        generateComprehensiveRecommendation: vi.fn(async (lead, score, history) => ({
           lead: { id: lead.id },
           recommendations: { nextAction: {} },
           leadScore: score // Echo back for test
        })),
    });

    // Instantiate Router with MOCKS injected
    // Note: aiRecommendationsFactory is a function now
    // Handle CJS import default
    let factory = aiRecommendationsFactory;
    if (factory.default) factory = factory.default;
    
    const router = factory({
        auth: mockAuthMiddleware,
        aiServiceFactory: mockAiServiceFactory
    });

    app = express();
    app.use(express.json());
    app.use('/api/prospector', router);
  });

  const mockLead = {
    id: 'lead-001',
    name: 'Tech Startup XYZ',
  };

  const mockHistory = [];

  it('should generate comprehensive recommendations', async () => {
    const response = await request(app)
      .post('/api/prospector/ai-recommendations')
      .send({
        lead: mockLead,
        leadScore: 85,
        interactionHistory: mockHistory,
        prospectorId: 'prospector@test.com' // Match mock user
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('lead');
    expect(response.body).toHaveProperty('leadScore');
  });

  it('should include all recommendation types', async () => {
    const response = await request(app)
        .post('/api/prospector/ai-recommendations')
        .send({
          lead: mockLead,
          leadScore: 85,
          interactionHistory: mockHistory,
          prospectorId: 'prospector@test.com'
        });

    expect(response.status).toBe(200);
    const { recommendations } = response.body;
    expect(recommendations).toHaveProperty('nextAction');
  });

  it('should return 400 when lead is missing', async () => {
    const response = await request(app)
      .post('/api/prospector/ai-recommendations')
      .send({
        leadScore: 85,
        prospectorId: 'prospector@test.com'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });


  // POST /api/prospector/next-action
  describe('POST /api/prospector/next-action', () => {
    it('should generate next action', async () => {
      const response = await request(app)
        .post('/api/prospector/next-action')
        .send({ lead: mockLead, interactionHistory: mockHistory });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('action');
    });

     it('should return 400 when lead is missing', async () => {
      const response = await request(app)
        .post('/api/prospector/next-action')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/prospector/conversion-prediction', () => {
    it('should predict conversion probability', async () => {
      const response = await request(app)
        .post('/api/prospector/conversion-prediction')
        .send({ lead: mockLead, leadScore: 85, interactionHistory: mockHistory });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('probability');
    });
  });

  describe('POST /api/prospector/followup-sequence', () => {
    it('should suggest follow-up sequence', async () => {
      const response = await request(app)
          .post('/api/prospector/followup-sequence')
          .send({ lead: mockLead, interactionHistory: mockHistory });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sequence');
    });
  });
});
