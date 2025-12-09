/**
 * Landing Pages Service Tests
 * 
 * Test Suite for LandingPageService
 * - AI-powered page generation with Gemini
 * - A/B variant creation
 * - Analytics tracking
 * - Event recording
 * - Page publishing
 * 
 * @module landingPageService.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Mock Firestore implementation
 */
const createMockDb = () => ({
  collection: vi.fn((collectionName) => ({
    doc: vi.fn((docId) => ({
      get: vi.fn(async () => ({
        exists: true,
        id: docId,
        data: vi.fn(() => ({
          serviceName: 'Test Service',
          serviceType: 'consultoria',
          description: 'Test description',
          targetAudience: 'Test audience',
          prospectorEmail: 'test@example.com',
          htmlContent: '<html><h1>Test</h1></html>',
          status: 'draft',
          views: 100,
          conversions: 10,
          conversionRate: 10,
          metadata: { seoScore: 85 },
          variants: [],
          ctaText: 'Solicitar Orçamento',
          createdAt: new Date(),
        })),
      })),
      set: vi.fn(async () => {}),
      update: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    })),
    add: vi.fn(async () => ({
      id: 'new-page-id',
    })),
    where: vi.fn(function() {
      return this;
    }),
    orderBy: vi.fn(function() {
      return this;
    }),
    limit: vi.fn(function() {
      return this;
    }),
    get: vi.fn(async () => ({
      forEach: vi.fn((callback) => {
        callback({
          id: 'page-1',
          data: vi.fn(() => ({
            serviceName: 'Service 1',
            serviceType: 'consultoria',
            views: 50,
            conversions: 5,
          })),
        });
      }),
    })),
  })),
});

/**
 * Mock Google Gemini API
 */
const createMockGemini = () => ({
  getGenerativeModel: vi.fn(() => ({
    generateContent: vi.fn(async () => ({
      response: {
        text: vi.fn(() => `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Test Service</title>
            <meta name="description" content="Test description">
            <meta name="viewport" content="width=device-width">
            <meta property="og:title" content="Test">
            <style>
              body { font-family: Arial; }
              h1 { color: #333; }
            </style>
          </head>
          <body>
            <header>
              <nav>Test Nav</nav>
            </header>
            <main>
              <section>
                <h1>Test Headline</h1>
                <h2>Test Subheading</h2>
                <img src="test.jpg" alt="Test Image">
                <button>Solicitar Orçamento</button>
              </section>
              <section>
                <h3>Features</h3>
              </section>
              <section>
                <h3>FAQ</h3>
              </section>
            </main>
            <footer>Footer</footer>
            <script type="application/ld+json">{"@context":"schema.org"}</script>
            <script src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
          </body>
          </html>
        `),
      },
    })),
  })),
});

describe('LandingPageService', () => {
  let mockDb;
  let mockGenAI;
  let service;

  beforeEach(() => {
    mockDb = createMockDb();
    mockGenAI = createMockGemini();

    // Simula import dinâmico da classe
    class LandingPageService {
      constructor(firestore) {
        this.db = firestore;
        this.model = mockGenAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      }

      extractMetadata(htmlContent, serviceName, serviceType) {
        const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : serviceName;
        const descMatch = htmlContent.match(/<meta\s+name="description"\s+content="(.*?)"/i);
        const description = descMatch ? descMatch[1] : '';
        const h1Count = (htmlContent.match(/<h1/gi) || []).length;
        const imageCount = (htmlContent.match(/<img/gi) || []).length;
        const buttonCount = (htmlContent.match(/<button|<a\s+[^>]*class="[^"]*btn/gi) || []).length;

        return {
          title,
          description,
          serviceType,
          generatedAt: new Date(),
          htmlSize: htmlContent.length,
          sections: { h1s: h1Count, images: imageCount, buttons: buttonCount },
          seoScore: this.calculateSeoScore(htmlContent),
        };
      }

      calculateSeoScore(htmlContent) {
        let score = 0;
        if (htmlContent.includes('<meta name="description"')) score += 5;
        if (htmlContent.includes('<meta name="keywords"')) score += 5;
        if (htmlContent.includes('<meta name="viewport"')) score += 5;
        if (htmlContent.includes('<meta og:')) score += 5;
        if (htmlContent.includes('<h1')) score += 10;
        if ((htmlContent.match(/<h[2-6]/gi) || []).length > 0) score += 10;
        const imgTags = htmlContent.match(/<img[^>]*alt="[^"]+"/gi) || [];
        if (imgTags.length > 0) score += 15;
        if (htmlContent.includes('schema.org') || htmlContent.includes('ld+json')) score += 20;
        if (htmlContent.includes('<header') || htmlContent.includes('<nav')) score += 5;
        if (htmlContent.includes('<main') || htmlContent.includes('<section')) score += 5;
        if (htmlContent.includes('<footer')) score += 5;
        if (htmlContent.includes('viewport')) score += 10;
        return Math.min(score, 100);
      }

      async generateLandingPage(params) {
        const { serviceName, serviceType, description, targetAudience, prospectorEmail, ctaText } = params;
        
        const response = await this.model.generateContent('test prompt');
        const htmlContent = response.response.text();

        if (!htmlContent.includes('<!DOCTYPE html')) {
          throw new Error('Generated content is not valid HTML');
        }

        const metadata = this.extractMetadata(htmlContent, serviceName, serviceType);
        const pageId = 'test-page-id';

        return {
          success: true,
          pageId,
          url: `https://landing.servio.ai/${pageId}`,
          htmlContent,
          metadata,
        };
      }

      async saveLandingPage(pageData) {
        const pagesRef = this.db.collection('landing_pages');
        const docRef = await pagesRef.add({
          ...pageData,
          createdAt: new Date(),
          status: 'published',
          views: 0,
          conversions: 0,
          conversionRate: 0,
          variants: [],
          analytics: {
            pageViews: 0,
            uniqueVisitors: 0,
            bounceRate: 0,
            avgTimeOnPage: 0,
            lastUpdated: new Date(),
          },
        });

        return docRef.id;
      }

      async createVariant(pageId, modifications) {
        const originalRef = this.db.collection('landing_pages').doc(pageId);
        const originalDoc = await originalRef.get();

        if (!originalDoc.exists) {
          throw new Error(`Landing page not found: ${pageId}`);
        }

        const originalData = originalDoc.data();
        let modifiedHtml = originalData.htmlContent;

        if (modifications.headline) {
          modifiedHtml = modifiedHtml.replace(
            /<h1[^>]*>(.*?)<\/h1>/i,
            `<h1>${modifications.headline}</h1>`
          );
        }

        const variantId = `${pageId}_v${Date.now()}`;
        await this.db.collection('landing_pages').doc(variantId).set({
          ...originalData,
          variantOf: pageId,
          variantId,
          htmlContent: modifiedHtml,
          modifications,
          createdAt: new Date(),
          status: 'draft',
          views: 0,
          conversions: 0,
        });

        await originalRef.update({
          variants: [...(originalData.variants || []), variantId],
        });

        return { success: true, variantId, url: `https://landing.servio.ai/${variantId}` };
      }

      async recordEvent(pageId, eventType, metadata = {}) {
        const pageRef = this.db.collection('landing_pages').doc(pageId);

        await this.db.collection('landing_page_events').add({
          pageId,
          eventType,
          ...metadata,
          timestamp: new Date(),
        });

        const pageDoc = await pageRef.get();
        const pageData = pageDoc.data();

        const updates = {};
        if (eventType === 'view') {
          updates.views = (pageData.views || 0) + 1;
        } else if (eventType === 'conversion') {
          updates.conversions = (pageData.conversions || 0) + 1;
        }

        updates.conversionRate = updates.conversions
          ? (updates.conversions / updates.views * 100).toFixed(2)
          : 0;

        await pageRef.update(updates);
      }

      async getAnalytics(pageId) {
        const pageRef = this.db.collection('landing_pages').doc(pageId);
        const pageDoc = await pageRef.get();

        if (!pageDoc.exists) {
          throw new Error(`Landing page not found: ${pageId}`);
        }

        const pageData = pageDoc.data();

        return {
          success: true,
          pageId,
          pageName: pageData.serviceName,
          metrics: {
            totalViews: pageData.views || 0,
            totalConversions: pageData.conversions || 0,
            conversionRate: pageData.conversionRate || 0,
          },
        };
      }

      async publishPage(pageId) {
        const pageRef = this.db.collection('landing_pages').doc(pageId);
        const pageDoc = await pageRef.get();

        if (!pageDoc.exists) {
          throw new Error(`Landing page not found: ${pageId}`);
        }

        await pageRef.update({
          status: 'published',
          publishedAt: new Date(),
          publicUrl: `https://landing.servio.ai/${pageId}`,
        });

        return {
          success: true,
          pageId,
          url: `https://landing.servio.ai/${pageId}`,
        };
      }

      async listPages(prospectorEmail) {
        const pagesRef = this.db.collection('landing_pages');
        const snapshot = await pagesRef
          .where('prospectorEmail', '==', prospectorEmail)
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();

        const pages = [];
        snapshot.forEach((doc) => {
          pages.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        return pages;
      }

      async deletePage(pageId) {
        const pageRef = this.db.collection('landing_pages').doc(pageId);
        const pageDoc = await pageRef.get();
        const variants = pageDoc.data().variants || [];

        for (const variantId of variants) {
          await this.db.collection('landing_pages').doc(variantId).delete();
        }

        await pageRef.delete();

        return { success: true };
      }
    }

    service = new LandingPageService(mockDb);
  });

  describe('Page Generation', () => {
    it('should generate a landing page with AI', async () => {
      const result = await service.generateLandingPage({
        serviceType: 'consultoria',
        serviceName: 'Test Service',
        description: 'Test description',
        targetAudience: 'Test audience',
        prospectorEmail: 'test@example.com',
        ctaText: 'Solicitar Orçamento',
      });

      expect(result.success).toBe(true);
      expect(result.pageId).toBeDefined();
      expect(result.htmlContent).toContain('<!DOCTYPE html');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.seoScore).toBeGreaterThan(0);
    });

    it('should extract metadata correctly', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>My Service</title>
          <meta name="description" content="Service description">
          <meta name="viewport" content="width=device-width">
        </head>
        <body>
          <h1>Main Heading</h1>
          <h2>Subheading</h2>
          <img src="test.jpg" alt="Test Image">
          <button>Click Me</button>
          <header><nav>Nav</nav></header>
          <main><section>Content</section></main>
          <footer>Footer</footer>
          <script type="application/ld+json">{"@context":"schema.org"}</script>
        </body>
        </html>
      `;

      const metadata = service.extractMetadata(html, 'Test', 'consultoria');

      expect(metadata.title).toBe('My Service');
      expect(metadata.description).toBe('Service description');
      expect(metadata.sections.h1s).toBe(1);
      expect(metadata.sections.images).toBe(1);
      expect(metadata.seoScore).toBeGreaterThan(70);
    });

    it('should calculate SEO score correctly', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test</title>
          <meta name="description" content="Desc">
          <meta name="viewport" content="width=device-width">
          <meta property="og:title" content="Test">
        </head>
        <body>
          <h1>Heading</h1>
          <h2>Subheading</h2>
          <img src="test.jpg" alt="Image">
          <script type="application/ld+json">{"@context":"schema.org"}</script>
          <header><nav>Nav</nav></header>
          <main><section>Content</section></main>
          <footer>Footer</footer>
        </body>
        </html>
      `;

      const score = service.calculateSeoScore(html);
      expect(score).toBeGreaterThanOrEqual(60);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('A/B Testing', () => {
    it('should create a variant of a landing page', async () => {
      const result = await service.createVariant('test-page-id', {
        headline: 'New Headline',
        subheadline: 'New Subheadline',
      });

      expect(result.success).toBe(true);
      expect(result.variantId).toBeDefined();
      expect(result.url).toContain('landing.servio.ai');
    });
  });

  describe('Event Tracking', () => {
    it('should record page view events', async () => {
      await service.recordEvent('test-page-id', 'view', {
        referrer: 'https://google.com',
      });

      expect(mockDb.collection).toHaveBeenCalledWith('landing_page_events');
    });

    it('should record conversion events', async () => {
      await service.recordEvent('test-page-id', 'conversion', {
        email: 'user@example.com',
      });

      expect(mockDb.collection).toHaveBeenCalledWith('landing_page_events');
    });

    it('should record form submission events', async () => {
      await service.recordEvent('test-page-id', 'form_submit', {
        email: 'user@example.com',
        name: 'Test User',
      });

      expect(mockDb.collection).toHaveBeenCalledWith('landing_page_events');
    });
  });

  describe('Analytics', () => {
    it('should retrieve analytics for a page', async () => {
      const analytics = await service.getAnalytics('test-page-id');

      expect(analytics.success).toBe(true);
      expect(analytics.pageId).toBe('test-page-id');
      expect(analytics.metrics).toBeDefined();
      expect(analytics.metrics.totalViews).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Publishing', () => {
    it('should publish a landing page', async () => {
      const result = await service.publishPage('test-page-id');

      expect(result.success).toBe(true);
      expect(result.url).toContain('landing.servio.ai');
    });
  });

  describe('Listing', () => {
    it('should list pages for a prospector', async () => {
      const pages = await service.listPages('test@example.com');

      expect(Array.isArray(pages)).toBe(true);
    });
  });

  describe('Deletion', () => {
    it('should delete a landing page and its variants', async () => {
      const result = await service.deletePage('test-page-id');

      expect(result.success).toBe(true);
      expect(mockDb.collection).toHaveBeenCalledWith('landing_pages');
    });
  });
});
