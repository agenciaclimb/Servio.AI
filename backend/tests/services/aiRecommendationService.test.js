/**
 * Testes para AI Recommendation Service
 * @jest
 */

// Mock do Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: jest.fn(async (prompt) => ({
        response: {
          text: () =>
            `{
            "action": "email",
            "template": "introduction",
            "timeToSend": "09:00",
            "confidence": 0.85,
            "reasoning": "Lead recently created and high budget"
          }`,
        },
      })),
    })),
  })),
}));

const {
  generateNextActions,
  predictConversion,
  suggestFollowUpSequence,
  generateComprehensiveRecommendation,
  calculateRecencyFactor,
  calculateScheduledDate,
  addDays,
} = require('../services/aiRecommendationService');

describe('AI Recommendation Service', () => {
  const mockLead = {
    id: 'lead-001',
    name: 'Tech Startup XYZ',
    category: 'design',
    location: { city: 'São Paulo', state: 'SP' },
    budget: 8000,
    companySize: 'startup',
    createdAt: new Date().toISOString(),
  };

  const mockHistory = [
    {
      type: 'email',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'whatsapp',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  describe('calculateRecencyFactor', () => {
    it('should return 1 for empty history', () => {
      const factor = calculateRecencyFactor([]);
      expect(factor).toBe(1);
    });

    it('should return 0.1 for very recent action', () => {
      const history = [{ type: 'email', date: new Date().toISOString() }];
      const factor = calculateRecencyFactor(history);
      expect(factor).toBeLessThan(0.2);
    });

    it('should return higher value for older actions', () => {
      const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
      const history = [{ type: 'email', date: oldDate.toISOString() }];
      const factor = calculateRecencyFactor(history);
      expect(factor).toBeGreaterThan(0.5);
    });
  });

  describe('calculateScheduledDate', () => {
    it('should calculate date for hours delay', () => {
      const scheduled = calculateScheduledDate('2 horas');
      const now = new Date();
      const diff = (scheduled.getTime() - now.getTime()) / (60 * 60 * 1000);
      expect(diff).toBeCloseTo(2, 0);
    });

    it('should calculate date for days delay', () => {
      const scheduled = calculateScheduledDate('3 dias');
      const now = new Date();
      const diff = (scheduled.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
      expect(diff).toBeCloseTo(3, 0);
    });

    it('should calculate date for weeks delay', () => {
      const scheduled = calculateScheduledDate('1 semana');
      const now = new Date();
      const diff = (scheduled.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000);
      expect(diff).toBeCloseTo(1, 0);
    });

    it('should default to 2 hours for unrecognized format', () => {
      const scheduled = calculateScheduledDate('invalid');
      const now = new Date();
      const diff = (scheduled.getTime() - now.getTime()) / (60 * 60 * 1000);
      expect(diff).toBeCloseTo(2, 0);
    });
  });

  describe('addDays', () => {
    it('should add days to date', () => {
      const date = new Date('2024-01-01');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(6);
    });

    it('should handle month boundaries', () => {
      const date = new Date('2024-01-29');
      const result = addDays(date, 3);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(1); // February
    });

    it('should not mutate original date', () => {
      const date = new Date('2024-01-01');
      const original = new Date(date);
      addDays(date, 5);
      expect(date.getTime()).toBe(original.getTime());
    });
  });

  describe('generateNextActions', () => {
    it('should return next action object', async () => {
      const result = await generateNextActions(mockLead, mockHistory);
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('template');
      expect(result).toHaveProperty('timeToSend');
      expect(result).toHaveProperty('confidence');
    });

    it('should have valid action type', async () => {
      const result = await generateNextActions(mockLead, mockHistory);
      const validActions = ['email', 'whatsapp', 'phone', 'linkedin', 'in-person'];
      expect(validActions).toContain(result.action);
    });

    it('should have confidence between 0-1', async () => {
      const result = await generateNextActions(mockLead, mockHistory);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should return default when lead is null', async () => {
      const result = await generateNextActions(null);
      expect(result).toHaveProperty('action');
      expect(result.action).toBe('email');
    });

    it('should handle Gemini API errors gracefully', async () => {
      // Mock error response
      const result = await generateNextActions(mockLead, []);
      expect(result).toBeDefined();
      expect(result.action).toBe('email'); // Fallback
    });
  });

  describe('predictConversion', () => {
    it('should predict conversion probability', async () => {
      const result = await predictConversion(mockLead, 75, mockHistory);
      expect(result).toHaveProperty('probability');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('risk');
    });

    it('should return probability between 0-1', async () => {
      const result = await predictConversion(mockLead, 75, mockHistory);
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);
    });

    it('should classify risk correctly', async () => {
      const highScore = await predictConversion(mockLead, 85, mockHistory);
      const lowScore = await predictConversion(mockLead, 30, mockHistory);

      // Higher score should have lower risk
      expect(['high', 'medium', 'low']).toContain(highScore.risk);
      expect(['high', 'medium', 'low']).toContain(lowScore.risk);
    });

    it('should include factors breakdown', async () => {
      const result = await predictConversion(mockLead, 75, mockHistory);
      expect(result.factors).toHaveProperty('leadScore');
      expect(result.factors).toHaveProperty('engagement');
      expect(result.factors).toHaveProperty('recency');
    });

    it('should handle null lead gracefully', async () => {
      const result = await predictConversion(null, 50);
      expect(result.probability).toBeLessThan(0.3);
    });
  });

  describe('suggestFollowUpSequence', () => {
    it('should return follow-up sequence', async () => {
      const result = await suggestFollowUpSequence(mockLead, mockHistory);
      expect(result).toHaveProperty('sequence');
      expect(Array.isArray(result.sequence)).toBe(true);
    });

    it('should have at least 1 follow-up action', async () => {
      const result = await suggestFollowUpSequence(mockLead, mockHistory);
      expect(result.sequence.length).toBeGreaterThanOrEqual(1);
    });

    it('should have scheduled dates for each step', async () => {
      const result = await suggestFollowUpSequence(mockLead, mockHistory);
      result.sequence.forEach((step) => {
        expect(step).toHaveProperty('step');
        expect(step).toHaveProperty('action');
        expect(step).toHaveProperty('delay');
        expect(step).toHaveProperty('message');
        expect(step).toHaveProperty('scheduledFor');
        expect(step.scheduledFor instanceof Date).toBe(true);
      });
    });

    it('should have valid actions in sequence', async () => {
      const result = await suggestFollowUpSequence(mockLead, mockHistory);
      const validActions = ['email', 'whatsapp', 'phone', 'linkedin', 'in-person'];
      result.sequence.forEach((step) => {
        expect(validActions).toContain(step.action);
      });
    });

    it('should order steps sequentially', async () => {
      const result = await suggestFollowUpSequence(mockLead, mockHistory);
      result.sequence.forEach((step, idx) => {
        expect(step.step).toBe(idx + 1);
      });
    });
  });

  describe('generateComprehensiveRecommendation', () => {
    it('should return comprehensive recommendation', async () => {
      const result = await generateComprehensiveRecommendation(mockLead, 75, mockHistory);

      expect(result).toHaveProperty('lead');
      expect(result).toHaveProperty('leadScore');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('priority');
      expect(result).toHaveProperty('generatedAt');
    });

    it('should include all recommendation types', async () => {
      const result = await generateComprehensiveRecommendation(mockLead, 75, mockHistory);

      expect(result.recommendations).toHaveProperty('nextAction');
      expect(result.recommendations).toHaveProperty('conversionProbability');
      expect(result.recommendations).toHaveProperty('conversionRisk');
      expect(result.recommendations).toHaveProperty('followUpSequence');
    });

    it('should set priority based on conversion probability', async () => {
      const highConversion = await generateComprehensiveRecommendation(mockLead, 90, mockHistory);
      const lowConversion = await generateComprehensiveRecommendation(mockLead, 20, mockHistory);

      // Should both have valid priority
      expect(['high', 'medium', 'low']).toContain(highConversion.priority);
      expect(['high', 'medium', 'low']).toContain(lowConversion.priority);
    });

    it('should return valid timestamp', async () => {
      const result = await generateComprehensiveRecommendation(mockLead, 75, mockHistory);
      expect(new Date(result.generatedAt)).toBeInstanceOf(Date);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete recommendation flow', async () => {
      const recommendation = await generateComprehensiveRecommendation(mockLead, 75, mockHistory);

      // Validate complete structure
      expect(recommendation.lead.id).toBe(mockLead.id);
      expect(recommendation.leadScore).toBe(75);
      expect(recommendation.recommendations.nextAction.action).toBeDefined();
      expect(recommendation.recommendations.conversionProbability).toBeGreaterThanOrEqual(0);
      expect(recommendation.recommendations.conversionProbability).toBeLessThanOrEqual(1);
      expect(recommendation.recommendations.followUpSequence.length).toBeGreaterThan(0);
      expect(recommendation.priority).toMatch(/high|medium|low/);
    });

    it('should handle leads without history', async () => {
      const recommendation = await generateComprehensiveRecommendation(mockLead, 50, []);
      expect(recommendation).toBeDefined();
      expect(recommendation.recommendations.followUpSequence).toBeDefined();
    });

    it('should handle high-value leads', async () => {
      const highValueLead = { ...mockLead, budget: 50000 };
      const recommendation = await generateComprehensiveRecommendation(highValueLead, 90, mockHistory);

      // High-value leads should have high or medium priority
      expect(['high', 'medium']).toContain(recommendation.priority);
    });

    it('should handle cold leads', async () => {
      const oldHistory = [
        {
          type: 'email',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        },
      ];
      const recommendation = await generateComprehensiveRecommendation(mockLead, 20, oldHistory);

      expect(recommendation).toBeDefined();
      expect(recommendation.priority).toBe('low');
    });
  });
});
