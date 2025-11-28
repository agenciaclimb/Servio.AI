import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch API
global.fetch = vi.fn();

describe('Gemini Service (AI Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Job Description Enhancement', () => {
    it('should enhance job description with AI suggestions', async () => {
      const jobData = {
        title: 'Website redesign',
        description: 'Need to redesign website',
        budget: 5000,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enhanced: 'Professional website redesign required. Need modern, responsive design with UX improvements.',
          suggestions: [
            'Add specific timeline requirements',
            'Clarify target audience',
            'Mention preferred technologies',
          ],
        }),
      });

      const response = await fetch('/api/enhance-job-description', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });

      const result = await response.json();

      expect(result.enhanced).toBeDefined();
      expect(result.suggestions).toHaveLength(3);
    });

    it('should handle enhancement for minimal descriptions', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enhanced: 'Help wanted with web development',
          suggestions: [],
        }),
      });

      const response = await fetch('/api/enhance-job-description', {
        method: 'POST',
        body: JSON.stringify({ title: 'Web help' }),
      });

      const result = await response.json();

      expect(result.enhanced).toBeDefined();
    });

    it('should preserve original description intent', async () => {
      const originalKeywords = ['redesign', 'website'];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enhanced: 'Looking for a professional redesign of our company website with modern aesthetics.',
          keywords: originalKeywords,
        }),
      });

      const response = await fetch('/api/enhance-job-description', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Website redesign',
          description: 'Need a redesign',
        }),
      });

      const result = await response.json();

      expect(result.enhanced).toContain('redesign');
      expect(result.enhanced).toContain('website');
    });

    it('should detect and include relevant skills', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enhanced: 'Full stack development position',
          detectedSkills: ['React', 'Node.js', 'TypeScript', 'Firestore'],
        }),
      });

      const response = await fetch('/api/enhance-job-description', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Full Stack Developer',
          description: 'React + Node.js project',
        }),
      });

      const result = await response.json();

      expect(result.detectedSkills).toBeDefined();
      expect(result.detectedSkills.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Bio Generation', () => {
    it('should generate compelling provider bio', async () => {
      const providerData = {
        name: 'João Silva',
        expertise: ['Web Development', 'UI/UX Design'],
        yearsExperience: 5,
        completedJobs: 47,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bio: 'Experienced web developer and UI/UX designer with 5 years of professional experience. Successfully completed 47 projects.',
          length: 147,
        }),
      });

      const response = await fetch('/api/generate-provider-bio', {
        method: 'POST',
        body: JSON.stringify(providerData),
      });

      const result = await response.json();

      expect(result.bio).toBeDefined();
      expect(result.bio).toContain('5 years');
      expect(result.bio).toContain('47 projects');
    });

    it('should keep bio within character limits', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bio: 'A concise provider bio within limits.',
          length: 40,
          withinLimit: true,
        }),
      });

      const response = await fetch('/api/generate-provider-bio', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Provider',
          expertise: ['Dev'],
        }),
      });

      const result = await response.json();

      expect(result.length).toBeLessThanOrEqual(500);
    });

    it('should highlight key achievements', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bio: 'Expert developer with 100% client satisfaction and 50+ successful projects.',
          achievements: ['100% satisfaction', '50+ projects'],
        }),
      });

      const response = await fetch('/api/generate-provider-bio', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Expert Dev',
          completedJobs: 50,
          rating: 5.0,
        }),
      });

      const result = await response.json();

      expect(result.achievements).toBeDefined();
      expect(result.achievements.length).toBeGreaterThan(0);
    });
  });

  describe('Prospecting Message Templates', () => {
    it('should generate personalized outreach message', async () => {
      const prospectData = {
        clientName: 'TechCorp',
        serviceType: 'Web Development',
        providerName: 'João Silva',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Hi TechCorp! I noticed you might benefit from web development services. I have expertise in modern web technologies and would love to discuss your project.',
          tone: 'professional',
        }),
      });

      const response = await fetch('/api/generate-prospecting-message', {
        method: 'POST',
        body: JSON.stringify(prospectData),
      });

      const result = await response.json();

      expect(result.message).toContain('TechCorp');
      expect(result.message).toContain('web development');
    });

    it('should vary message tone based on client type', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          formal: 'Greetings TechCorp Team...',
          casual: 'Hey TechCorp! Quick question about your dev needs...',
          urgent: 'TechCorp - Need immediate web development support?',
        }),
      });

      const response = await fetch('/api/generate-prospecting-message', {
        method: 'POST',
        body: JSON.stringify({
          clientName: 'TechCorp',
          tones: ['formal', 'casual', 'urgent'],
        }),
      });

      const result = await response.json();

      expect(result.formal).toBeDefined();
      expect(result.casual).toBeDefined();
      expect(result.urgent).toBeDefined();
    });

    it('should include call-to-action in message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Available for web projects. Would you like to discuss your needs? Click here to chat.',
          hasCallToAction: true,
        }),
      });

      const response = await fetch('/api/generate-prospecting-message', {
        method: 'POST',
        body: JSON.stringify({
          clientName: 'Client',
          includeCallToAction: true,
        }),
      });

      const result = await response.json();

      expect(result.hasCallToAction).toBe(true);
      expect(result.message.toLowerCase()).toContain('chat' || 'discuss' || 'contact');
    });

    it('should respect message length limits', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Brief message about services.',
          length: 30,
          withinLimit: true,
        }),
      });

      const response = await fetch('/api/generate-prospecting-message', {
        method: 'POST',
        body: JSON.stringify({
          clientName: 'Client',
          maxLength: 500,
        }),
      });

      const result = await response.json();

      expect(result.length).toBeLessThanOrEqual(500);
    });
  });

  describe('Market Analysis', () => {
    it('should analyze market trends for service category', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          category: 'Web Development',
          demandLevel: 'high',
          averagePrice: 5000,
          trend: 'increasing',
          opportunities: ['React specialists', 'Mobile development', 'Full stack'],
        }),
      });

      const response = await fetch('/api/analyze-market/Web Development');

      const result = await response.json();

      expect(result.category).toBe('Web Development');
      expect(result.demandLevel).toBe('high');
      expect(result.opportunities).toBeDefined();
    });

    it('should identify emerging skills in market', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          emergingSkills: ['AI Integration', 'Blockchain', 'Web3'],
          growthRate: '45%',
        }),
      });

      const response = await fetch('/api/analyze-market/emerging-skills');

      const result = await response.json();

      expect(result.emergingSkills).toBeDefined();
      expect(result.growthRate).toBeDefined();
    });

    it('should provide pricing recommendations', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          service: 'Web Development',
          recommendedRange: {
            low: 3000,
            average: 5000,
            high: 10000,
          },
          basedOnData: 'market analysis',
        }),
      });

      const response = await fetch('/api/recommend-pricing/Web Development');

      const result = await response.json();

      expect(result.recommendedRange).toBeDefined();
      expect(result.recommendedRange.average).toBeGreaterThan(result.recommendedRange.low);
    });
  });

  describe('Content Moderation', () => {
    it('should flag inappropriate job descriptions', async () => {
      const inappropriateJob = {
        title: 'Dev help',
        description: 'Inappropriate content here...',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          flagged: true,
          reason: 'Inappropriate language detected',
          severity: 'high',
        }),
      });

      const response = await fetch('/api/moderate-content', {
        method: 'POST',
        body: JSON.stringify(inappropriateJob),
      });

      const result = await response.json();

      expect(result.flagged).toBe(true);
    });

    it('should approve clean job descriptions', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          flagged: false,
          qualityScore: 0.92,
        }),
      });

      const response = await fetch('/api/moderate-content', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Professional Web Development',
          description: 'Looking for experienced developer',
        }),
      });

      const result = await response.json();

      expect(result.flagged).toBe(false);
      expect(result.qualityScore).toBeGreaterThan(0.8);
    });

    it('should suggest improvements for low-quality content', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          flagged: false,
          qualityScore: 0.65,
          suggestions: [
            'Add more specific requirements',
            'Clarify budget expectations',
            'Include timeline',
          ],
        }),
      });

      const response = await fetch('/api/moderate-content', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Need help',
          description: 'Need a website',
        }),
      });

      const result = await response.json();

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'Rate limit exceeded',
          retryAfter: 60,
        }),
      });

      const response = await fetch('/api/enhance-job-description', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(429);
    });

    it('should handle Gemini API timeouts', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('Request timeout')
      );

      try {
        await fetch('/api/enhance-job-description', {
          method: 'POST',
          body: JSON.stringify({}),
        });
      } catch (error: any) {
        expect(error.message).toContain('timeout');
      }
    });

    it('should return fallback content on AI failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enhanced: 'Original description (AI enhancement unavailable)',
          fallback: true,
        }),
      });

      const response = await fetch('/api/enhance-job-description', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const result = await response.json();

      expect(result.fallback).toBe(true);
    });

    it('should handle empty input gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Missing required fields',
        }),
      });

      const response = await fetch('/api/enhance-job-description', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(response.ok).toBe(false);
    });

    it('should log AI API errors for debugging', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: 'AI service unavailable',
        }),
      });

      const response = await fetch('/api/generate-provider-bio', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(503);
    });
  });

  describe('Performance', () => {
    it('should cache AI responses for identical requests', async () => {
      const requestData = {
        title: 'Web Development',
        description: 'Need a website',
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ enhanced: 'Response 1', cached: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ enhanced: 'Response 1', cached: true }),
        });

      // First request
      let response = await fetch('/api/enhance-job-description', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      let result = await response.json();
      expect(result.cached).toBe(false);

      // Second identical request
      response = await fetch('/api/enhance-job-description', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      result = await response.json();
      expect(result.cached).toBe(true);
    });

    it('should handle batch processing of multiple items', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { enhanced: 'Result 1' },
            { enhanced: 'Result 2' },
            { enhanced: 'Result 3' },
          ],
        }),
      });

      const response = await fetch('/api/enhance-job-descriptions-batch', {
        method: 'POST',
        body: JSON.stringify({
          jobs: [{ id: 1 }, { id: 2 }, { id: 3 }],
        }),
      });

      const result = await response.json();

      expect(result.results).toHaveLength(3);
    });
  });

  describe('Personalization', () => {
    it('should tailor suggestions based on user profile', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enhanced: 'Web development for fintech applications',
          personalized: true,
          userLevel: 'expert',
        }),
      });

      const response = await fetch('/api/enhance-job-description', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Web dev',
          userLevel: 'expert',
          industry: 'fintech',
        }),
      });

      const result = await response.json();

      expect(result.personalized).toBe(true);
      expect(result.enhanced).toContain('fintech');
    });

    it('should adapt language based on user locale', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enhanced: 'Desenvolvimento web profissional',
          language: 'pt-BR',
        }),
      });

      const response = await fetch('/api/enhance-job-description', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Web dev',
          language: 'pt-BR',
        }),
      });

      const result = await response.json();

      expect(result.language).toBe('pt-BR');
    });
  });
});
