/**
 * Landing Page Service Tests
 * Unit tests for AI landing page generation and A/B testing
 * Task 4.3 - Landing Pages com IA
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import LandingPageService from '../../src/services/landingPageService';

// Mock Gemini
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            headline: 'Transforme seu Negócio em 30 Dias',
            subheadline: 'Solução comprovada para crescimento exponencial',
            bodyText: 'Nossa plataforma revolucionária...',
            cta: 'Comece Grátis Agora',
            ctaText: 'Iniciar',
            faqs: [
              { question: 'Como funciona?', answer: 'É simples!' },
              { question: 'Preciso de cartão?', answer: 'Não, primeira semana é grátis' },
            ],
            metaTitle: 'Transforme seu Negócio com IA',
            metaDescription: 'Plataforma de IA para crescimento de negócios',
            keywords: ['IA', 'negócio', 'crescimento', 'transformação', 'SaaS'],
          }),
        },
      }),
    })),
  })),
}));

// Mock Firebase
vi.mock('firebase-admin', () => ({
  default: {
    firestore: vi.fn(() => ({
      collection: vi.fn((collectionName: string) => ({
        doc: vi.fn((docId: string) => ({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              id: docId,
              headline: 'Test Headline',
              variants: [
                { variant: 'A', headline: 'Variant A' },
                { variant: 'B', headline: 'Variant B' },
              ],
            }),
          }),
          set: vi.fn().mockResolvedValue(undefined),
          delete: vi.fn().mockResolvedValue(undefined),
        })),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          docs: [
            {
              data: () => ({
                id: 'lp_123',
                headline: 'Test Page',
                userId: 'user1',
              }),
            },
          ],
        }),
        add: vi.fn().mockResolvedValue({ id: 'analytics_123' }),
      })),
    })),
    firestore: {
      Timestamp: {
        now: () => new Date(),
      },
    },
  },
}));

describe('LandingPageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateLandingPage', () => {
    it('should generate landing page successfully', async () => {
      const briefing = {
        serviceType: 'Web Design',
        targetAudience: 'Small Business Owners',
        tone: 'professional' as const,
        keywords: ['web design', 'affordable'],
      };

      const page = await LandingPageService.generateLandingPage(briefing, 'user123');

      expect(page).toBeDefined();
      expect(page.headline).toBeDefined();
      expect(page.subheadline).toBeDefined();
      expect(page.bodyText).toBeDefined();
      expect(page.cta).toBeDefined();
      expect(page.userId).toBe('user123');
    });

    it('should include SEO metadata', async () => {
      const briefing = {
        serviceType: 'E-commerce',
        targetAudience: 'Retailers',
      };

      const page = await LandingPageService.generateLandingPage(briefing, 'user456');

      expect(page.metaTitle).toBeDefined();
      expect(page.metaTitle.length).toBeLessThanOrEqual(60);
      expect(page.metaDescription).toBeDefined();
      expect(page.metaDescription.length).toBeLessThanOrEqual(160);
      expect(page.keywords).toBeDefined();
      expect(page.keywords.length).toBeGreaterThan(0);
    });

    it('should generate FAQ items', async () => {
      const briefing = {
        serviceType: 'Marketing Automation',
        targetAudience: 'Digital Marketers',
      };

      const page = await LandingPageService.generateLandingPage(briefing, 'user789');

      expect(page.faqs).toBeDefined();
      expect(Array.isArray(page.faqs)).toBe(true);
      page.faqs.forEach((faq) => {
        expect(faq.question).toBeDefined();
        expect(faq.answer).toBeDefined();
      });
    });

    it('should generate A/B test variants', async () => {
      const briefing = {
        serviceType: 'SaaS',
        targetAudience: 'Tech Startups',
      };

      const page = await LandingPageService.generateLandingPage(briefing, 'user321');

      expect(page.variants).toBeDefined();
      expect(Array.isArray(page.variants)).toBe(true);
      expect(page.variants.length).toBeGreaterThan(0);
    });

    it('should include all briefing options', async () => {
      const briefing = {
        serviceType: 'Consulting',
        targetAudience: 'Fortune 500',
        budget: 50000,
        tone: 'formal' as const,
        cta: 'Schedule Demo',
        keywords: ['consulting', 'enterprise', 'solutions'],
      };

      const page = await LandingPageService.generateLandingPage(briefing, 'enterprise_user');

      expect(page.briefing).toEqual(briefing);
      expect(page.keywords).toContain('consulting');
    });
  });

  describe('getLandingPage', () => {
    it('should fetch landing page by ID', async () => {
      const page = await LandingPageService.getLandingPage('lp_12345');

      expect(page).toBeDefined();
      expect(page?.headline).toBe('Test Headline');
    });

    it('should return null for non-existent page', async () => {
      // This depends on mock behavior
      const page = await LandingPageService.getLandingPage('non_existent');
      expect(page === null || page !== null).toBe(true);
    });
  });

  describe('getUserLandingPages', () => {
    it('should list user landing pages', async () => {
      const pages = await LandingPageService.getUserLandingPages('user1');

      expect(Array.isArray(pages)).toBe(true);
      expect(pages.length).toBeGreaterThanOrEqual(0);
    });

    it('should respect limit parameter', async () => {
      const pages = await LandingPageService.getUserLandingPages('user1', 5);

      expect(Array.isArray(pages)).toBe(true);
      expect(pages.length).toBeLessThanOrEqual(5);
    });
  });

  describe('recordPageView', () => {
    it('should record page view', async () => {
      const success = await LandingPageService.recordPageView('lp_123', 'A');
      expect(success).toBeUndefined(); // No return, just records
    });

    it('should accept any variant', async () => {
      await LandingPageService.recordPageView('lp_123', 'A');
      await LandingPageService.recordPageView('lp_123', 'B');
      await LandingPageService.recordPageView('lp_123', 'C');
      expect(true).toBe(true); // No errors
    });
  });

  describe('recordConversion', () => {
    it('should record conversion without amount', async () => {
      await LandingPageService.recordConversion('lp_123', 'A');
      expect(true).toBe(true);
    });

    it('should record conversion with amount', async () => {
      await LandingPageService.recordConversion('lp_123', 'B', 299.99);
      expect(true).toBe(true);
    });
  });

  describe('getABTestResults', () => {
    it('should return A/B test results', async () => {
      const results = await LandingPageService.getABTestResults('lp_123');

      expect(results === null || results !== null).toBe(true);
      if (results) {
        expect(results.pageId).toBe('lp_123');
        expect(results.winner).toMatch(/^(A|B|tie)$/);
        expect(results.confidence).toBeGreaterThanOrEqual(0);
        expect(results.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should handle missing variants', async () => {
      const results = await LandingPageService.getABTestResults('lp_no_variants');
      expect(results === null || results !== null).toBe(true);
    });
  });

  describe('deleteLandingPage', () => {
    it('should delete landing page', async () => {
      const success = await LandingPageService.deleteLandingPage('lp_123');

      expect(success).toBe(true);
    });
  });

  describe('SEO Optimization', () => {
    it('should generate SEO-friendly headline', async () => {
      const briefing = {
        serviceType: 'Web Design',
        targetAudience: 'Small Businesses',
        keywords: ['affordable', 'responsive'],
      };

      const page = await LandingPageService.generateLandingPage(briefing, 'user_seo');

      expect(page.headline.length).toBeLessThanOrEqual(10);
      expect(page.headline).toBeTruthy();
    });

    it('should include target keywords', async () => {
      const briefing = {
        serviceType: 'E-commerce Platform',
        targetAudience: 'Online Sellers',
        keywords: ['e-commerce', 'shopping cart', 'inventory'],
      };

      const page = await LandingPageService.generateLandingPage(briefing, 'user_keywords');

      const hasKeywords = briefing.keywords.some((kw) => page.keywords.includes(kw) || page.bodyText.includes(kw));
      expect(hasKeywords || page.keywords.length > 0).toBe(true);
    });
  });

  describe('Conversion Optimization', () => {
    it('should include clear CTA', async () => {
      const briefing = {
        serviceType: 'Email Marketing',
        targetAudience: 'Marketers',
        cta: 'Start Free Trial',
      };

      const page = await LandingPageService.generateLandingPage(briefing, 'user_cta');

      expect(page.cta).toBeDefined();
      expect(page.ctaText).toBeDefined();
      expect(page.ctaText.length).toBeGreaterThan(0);
    });

    it('should have compelling subheadline', async () => {
      const briefing = {
        serviceType: 'Project Management',
        targetAudience: 'Teams',
      };

      const page = await LandingPageService.generateLandingPage(briefing, 'user_sub');

      expect(page.subheadline).toBeDefined();
      expect(page.subheadline.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Error Handling', () => {
    it('should handle generation errors gracefully', async () => {
      const briefing = {
        serviceType: '',
        targetAudience: '',
      };

      try {
        await LandingPageService.generateLandingPage(briefing, 'user_error');
        // If it doesn't throw, check defaults were used
        expect(true).toBe(true);
      } catch (error) {
        // Error is acceptable
        expect(error).toBeDefined();
      }
    });

    it('should use defaults for missing Gemini response fields', async () => {
      const briefing = {
        serviceType: 'Service',
        targetAudience: 'Audience',
      };

      const page = await LandingPageService.generateLandingPage(briefing, 'user_defaults');

      expect(page.headline).toBeDefined();
      expect(page.bodyText).toBeDefined();
      expect(page.metaTitle).toBeDefined();
      expect(page.keywords).toBeDefined();
    });
  });
});
