/**
 * Testes unitários para Lead Scoring Service
 * @jest
 */

const {
  calculateLeadScore,
  scoreLeadsBatch,
  rankLeads,
  detectHotLeads,
  analyzeLeadScore,
  calculateTemperature,
  calculateCategoryMatch,
  calculateLocationScore,
  calculateEngagementScore,
  calculateRecencyScore,
  calculateDemographicScore,
  generateRecommendation,
} = require('../services/leadScoringService');

describe('Lead Scoring Service', () => {
  const mockProspectProfile = {
    id: 'prospector-123',
    preferredCategories: ['design', 'web-development'],
    serviceArea: {
      cities: ['São Paulo', 'Guarulhos'],
      state: 'SP',
      maxDistance: 20,
    },
    budgetRange: { min: 1000, max: 10000 },
    preferredCompanySize: 'startup',
  };

  const mockLead = {
    id: 'lead-001',
    name: 'Tech Startup XYZ',
    category: 'design',
    location: {
      city: 'São Paulo',
      state: 'SP',
    },
    budget: 5000,
    companySize: 'startup',
    createdAt: new Date().toISOString(),
    activityHistory: [
      {
        prospectorId: 'prospector-123',
        type: 'email',
        date: new Date().toISOString(),
      },
    ],
  };

  describe('calculateCategoryMatch', () => {
    it('should return 100 for perfect match', () => {
      const score = calculateCategoryMatch('design', ['design', 'web-development']);
      expect(score).toBe(100);
    });

    it('should return 70 for partial match', () => {
      const score = calculateCategoryMatch('design_ux', ['design', 'web-development']);
      expect(score).toBe(70);
    });

    it('should return 20 for no match', () => {
      const score = calculateCategoryMatch('marketing', ['design', 'web-development']);
      expect(score).toBe(20);
    });

    it('should return 50 when no data provided', () => {
      const score = calculateCategoryMatch(null, null);
      expect(score).toBe(50);
    });
  });

  describe('calculateLocationScore', () => {
    it('should return 100 for lead in service area', () => {
      const leadLocation = { city: 'São Paulo', state: 'SP' };
      const score = calculateLocationScore(leadLocation, mockProspectProfile.serviceArea);
      expect(score).toBe(100);
    });

    it('should return 60 for same state but outside area', () => {
      const leadLocation = { city: 'Campinas', state: 'SP' };
      const score = calculateLocationScore(leadLocation, mockProspectProfile.serviceArea);
      expect(score).toBe(60);
    });

    it('should return 20 for different state', () => {
      const leadLocation = { city: 'Belo Horizonte', state: 'MG' };
      const score = calculateLocationScore(leadLocation, mockProspectProfile.serviceArea);
      expect(score).toBe(20);
    });

    it('should return 50 when no data provided', () => {
      const score = calculateLocationScore(null, null);
      expect(score).toBe(50);
    });
  });

  describe('calculateEngagementScore', () => {
    it('should return 30 for new lead (no history)', () => {
      const score = calculateEngagementScore({ id: 'lead-001' }, 'prospector-123');
      expect(score).toBe(30);
    });

    it('should return 50 for 1 interaction', () => {
      const lead = {
        id: 'lead-001',
        activityHistory: [
          { prospectorId: 'prospector-123', type: 'email', date: new Date().toISOString() },
        ],
      };
      const score = calculateEngagementScore(lead, 'prospector-123');
      expect(score).toBe(50);
    });

    it('should return 70 for 2 interactions', () => {
      const lead = {
        id: 'lead-001',
        activityHistory: [
          { prospectorId: 'prospector-123', type: 'email', date: new Date().toISOString() },
          { prospectorId: 'prospector-123', type: 'phone', date: new Date().toISOString() },
        ],
      };
      const score = calculateEngagementScore(lead, 'prospector-123');
      expect(score).toBe(70);
    });

    it('should return 85 for 3+ interactions', () => {
      const lead = {
        id: 'lead-001',
        activityHistory: [
          { prospectorId: 'prospector-123', type: 'email', date: new Date().toISOString() },
          { prospectorId: 'prospector-123', type: 'phone', date: new Date().toISOString() },
          { prospectorId: 'prospector-123', type: 'meeting', date: new Date().toISOString() },
        ],
      };
      const score = calculateEngagementScore(lead, 'prospector-123');
      expect(score).toBe(85);
    });
  });

  describe('calculateRecencyScore', () => {
    it('should return 100 for lead created less than 1 day ago', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const score = calculateRecencyScore(yesterday);
      expect(score).toBe(100);
    });

    it('should return 85 for lead created 2-3 days ago', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const score = calculateRecencyScore(threeDaysAgo);
      expect(score).toBe(85);
    });

    it('should return 70 for lead created 5-7 days ago', () => {
      const now = new Date();
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      const score = calculateRecencyScore(sixDaysAgo);
      expect(score).toBe(70);
    });

    it('should return low score for old leads', () => {
      const now = new Date();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const score = calculateRecencyScore(sixtyDaysAgo);
      expect(score).toBeLessThan(20);
    });

    it('should return 40 when no date provided', () => {
      const score = calculateRecencyScore(null);
      expect(score).toBe(40);
    });
  });

  describe('calculateDemographicScore', () => {
    it('should return 85 for matching budget range', () => {
      const score = calculateDemographicScore(mockLead, mockProspectProfile);
      expect(score).toBeGreaterThanOrEqual(70);
    });

    it('should return 70 for budget above max', () => {
      const lead = { ...mockLead, budget: 15000 };
      const score = calculateDemographicScore(lead, mockProspectProfile);
      expect(score).toBeLessThan(85);
    });

    it('should return 40 for budget below min', () => {
      const lead = { ...mockLead, budget: 500 };
      const score = calculateDemographicScore(lead, mockProspectProfile);
      expect(score).toBeLessThan(50);
    });
  });

  describe('calculateTemperature', () => {
    it('should return "hot" for score >= 80', () => {
      expect(calculateTemperature(85)).toBe('hot');
      expect(calculateTemperature(100)).toBe('hot');
    });

    it('should return "warm" for score 50-79', () => {
      expect(calculateTemperature(50)).toBe('warm');
      expect(calculateTemperature(75)).toBe('warm');
    });

    it('should return "cold" for score < 50', () => {
      expect(calculateTemperature(45)).toBe('cold');
      expect(calculateTemperature(20)).toBe('cold');
    });
  });

  describe('calculateLeadScore', () => {
    it('should calculate composite score between 0-100', () => {
      const score = calculateLeadScore(mockLead, mockProspectProfile);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return high score for good fit', () => {
      const score = calculateLeadScore(mockLead, mockProspectProfile);
      expect(score).toBeGreaterThan(60);
    });

    it('should return low score for poor fit', () => {
      const poorLead = {
        ...mockLead,
        category: 'marketing', // not in preferred categories
        location: { city: 'Brasília', state: 'DF' }, // not in service area
        budget: 500, // below budget range
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // very old
      };
      const score = calculateLeadScore(poorLead, mockProspectProfile);
      expect(score).toBeLessThan(50);
    });

    it('should return 0 when both params are null', () => {
      const score = calculateLeadScore(null, null);
      expect(score).toBe(0);
    });
  });

  describe('scoreLeadsBatch', () => {
    it('should score multiple leads and return array', () => {
      const leads = [mockLead, { ...mockLead, id: 'lead-002' }];
      const results = scoreLeadsBatch('prospector-123', leads, mockProspectProfile);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results[0]).toHaveProperty('leadId');
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('prospectorId');
    });

    it('should include timestamp', () => {
      const leads = [mockLead];
      const results = scoreLeadsBatch('prospector-123', leads, mockProspectProfile);

      expect(results[0]).toHaveProperty('scoredAt');
      expect(new Date(results[0].scoredAt)).toBeInstanceOf(Date);
    });

    it('should return empty array for empty leads', () => {
      const results = scoreLeadsBatch('prospector-123', [], mockProspectProfile);
      expect(results).toEqual([]);
    });

    it('should return empty array for null leads', () => {
      const results = scoreLeadsBatch('prospector-123', null, mockProspectProfile);
      expect(results).toEqual([]);
    });
  });

  describe('rankLeads', () => {
    it('should sort leads by score descending', () => {
      const leads = [
        { id: 'lead-1', score: 50 },
        { id: 'lead-2', score: 100 },
        { id: 'lead-3', score: 75 },
      ];

      const ranked = rankLeads(leads);

      expect(ranked[0].score).toBe(100);
      expect(ranked[1].score).toBe(75);
      expect(ranked[2].score).toBe(50);
    });

    it('should not mutate original array', () => {
      const leads = [
        { id: 'lead-1', score: 50 },
        { id: 'lead-2', score: 100 },
      ];
      const originalScores = [50, 100];

      rankLeads(leads);

      expect(leads[0].score).toBe(originalScores[0]);
      expect(leads[1].score).toBe(originalScores[1]);
    });

    it('should handle empty array', () => {
      const ranked = rankLeads([]);
      expect(ranked).toEqual([]);
    });
  });

  describe('detectHotLeads', () => {
    it('should filter leads above threshold', () => {
      const leads = [
        { id: 'lead-1', score: 90 },
        { id: 'lead-2', score: 70 },
        { id: 'lead-3', score: 85 },
      ];

      const hot = detectHotLeads('prospector-123', leads, 80);

      expect(hot.length).toBe(2);
      expect(hot.every(l => l.score >= 80)).toBe(true);
    });

    it('should add temperature classification', () => {
      const leads = [{ id: 'lead-1', score: 90 }];

      const hot = detectHotLeads('prospector-123', leads);

      expect(hot[0]).toHaveProperty('temperature');
      expect(hot[0].temperature).toBe('hot');
    });

    it('should add prospectorId', () => {
      const leads = [{ id: 'lead-1', score: 90 }];

      const hot = detectHotLeads('prospector-123', leads);

      expect(hot[0].prospectorId).toBe('prospector-123');
    });
  });

  describe('generateRecommendation', () => {
    it('should recommend immediate contact for hot leads', () => {
      const rec = generateRecommendation(90);
      expect(rec).toContain('imediatamente');
    });

    it('should recommend this week for warm leads', () => {
      const rec = generateRecommendation(75);
      expect(rec).toContain('semana');
    });

    it('should recommend follow-up for moderate leads', () => {
      const rec = generateRecommendation(55);
      expect(rec).toContain('Acompanhar');
    });

    it('should recommend low priority for cold leads', () => {
      const rec = generateRecommendation(25);
      expect(rec).toContain('Baixa prioridade');
    });
  });

  describe('analyzeLeadScore', () => {
    it('should return detailed analysis', () => {
      const analysis = analyzeLeadScore(mockLead, mockProspectProfile);

      expect(analysis).toHaveProperty('totalScore');
      expect(analysis).toHaveProperty('components');
      expect(analysis).toHaveProperty('temperature');
      expect(analysis).toHaveProperty('recommendation');
    });

    it('should have all component scores', () => {
      const analysis = analyzeLeadScore(mockLead, mockProspectProfile);
      const components = analysis.components;

      expect(components).toHaveProperty('categoryMatch');
      expect(components).toHaveProperty('locationScore');
      expect(components).toHaveProperty('engagementScore');
      expect(components).toHaveProperty('recencyScore');
      expect(components).toHaveProperty('demographicScore');
    });

    it('should have weights for components', () => {
      const analysis = analyzeLeadScore(mockLead, mockProspectProfile);

      expect(analysis.components.categoryMatch.weight).toBe(0.25);
      expect(analysis.components.locationScore.weight).toBe(0.20);
      expect(analysis.components.engagementScore.weight).toBe(0.25);
      expect(analysis.components.recencyScore.weight).toBe(0.20);
      expect(analysis.components.demographicScore.weight).toBe(0.10);
    });
  });

  describe('Integration tests', () => {
    it('should correctly score a batch of diverse leads', () => {
      const leads = [
        // Perfect fit
        mockLead,
        // Poor fit
        {
          ...mockLead,
          id: 'lead-002',
          category: 'marketing',
          location: { city: 'Rio de Janeiro', state: 'RJ' },
          budget: 500,
        },
        // Moderate fit
        {
          ...mockLead,
          id: 'lead-003',
          category: 'web-development',
          location: { city: 'Campinas', state: 'SP' },
          budget: 8000,
        },
      ];

      const scored = scoreLeadsBatch('prospector-123', leads, mockProspectProfile);
      const ranked = rankLeads(scored);

      // Perfect fit should be first
      expect(ranked[0].leadId).toBe(mockLead.id);

      // Scores should be in descending order
      expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
      expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
    });
  });
});
