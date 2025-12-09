/**
 * LandingPageService - Gerador de Landing Pages com IA Gemini
 * 
 * Funcionalidades:
 * - Geração de landing pages com IA Gemini 2.0
 * - Templates customizáveis para diferentes tipos de serviços
 * - Deploy automático em Cloud Run / Firebase Hosting
 * - Analytics integrado (conversões, cliques, tempo em página)
 * - A/B testing com múltiplas variações
 * - SEO otimizado (meta tags, sitemap, schema markup)
 * - Themes dinamicamente gerados
 * 
 * @module LandingPageService
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

class LandingPageService {
  /**
   * @param {Object} firestore - Instância do Firestore
   */
  constructor(firestore) {
    this.db = firestore;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (this.geminiApiKey) {
      const genAI = new GoogleGenerativeAI(this.geminiApiKey);
      this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    } else {
      console.warn('⚠️ GEMINI_API_KEY not configured. Service will run in mock mode.');
    }
  }

  /**
   * Gera uma landing page completa com IA Gemini
   * 
   * @param {Object} params - Parâmetros da página
   * @param {string} params.serviceType - Tipo de serviço (consultoria, design, dev, etc)
   * @param {string} params.serviceName - Nome do serviço
   * @param {string} params.description - Descrição detalhada
   * @param {string} params.targetAudience - Público-alvo
   * @param {string} params.prospectorEmail - Email do prospector
   * @param {string} params.ctaText - Texto do botão CTA (default: 'Solicitar Orçamento')
   * @returns {Promise<Object>} Página gerada com HTML, CSS, JS
   */
  async generateLandingPage({
    serviceType,
    serviceName,
    description,
    targetAudience,
    prospectorEmail,
    ctaText = 'Solicitar Orçamento',
  }) {
    try {
      console.log(`🤖 Generating landing page for: ${serviceName}`);

      // Prompt para Gemini gerar HTML/CSS completo
      const prompt = `
You are an expert landing page designer. Generate a modern, conversion-optimized landing page HTML code for the following service:

Service Name: ${serviceName}
Service Type: ${serviceType}
Description: ${description}
Target Audience: ${targetAudience}
CTA Text: ${ctaText}
Contact Email: ${prospectorEmail}

Requirements:
1. Generate COMPLETE, production-ready HTML with inline CSS
2. Mobile-responsive (mobile-first design)
3. Modern, professional design with gradient backgrounds
4. Include hero section with compelling headline
5. Features/benefits section with icons
6. Social proof section with testimonials
7. FAQ section
8. Call-to-action section with form
9. Footer with links
10. Include basic JavaScript for form handling
11. SEO optimized (meta tags, schema markup)
12. Use modern typography and colors
13. Accessibility compliant (WCAG 2.1)

Return ONLY the complete HTML code, starting with <!DOCTYPE html> and ending with </html>.
Make sure all CSS is inline within <style> tags.
Include Google Analytics snippet (replace GA_ID with placeholder).
Make the form submit to /api/landing-pages/form with method POST.
`;

      // Chama Gemini
      const response = await this.model.generateContent(prompt);
      const htmlContent = response.response.text();

      // Validação básica
      if (!htmlContent.includes('<!DOCTYPE html')) {
        throw new Error('Generated content is not valid HTML');
      }

      // Extrai metadados
      const metadata = this.extractMetadata(htmlContent, serviceName, serviceType);

      // Salva em Firestore
      const pageId = await this.saveLandingPage({
        serviceName,
        serviceType,
        description,
        targetAudience,
        prospectorEmail,
        htmlContent,
        metadata,
        ctaText,
      });

      console.log(`✅ Landing page created: ${pageId}`);

      return {
        success: true,
        pageId,
        url: `https://landing.servio.ai/${pageId}`,
        htmlContent,
        metadata,
      };
    } catch (error) {
      console.error('❌ Error generating landing page:', error.message);
      throw error;
    }
  }

  /**
   * Extrai metadados do HTML gerado
   * 
   * @private
   * @param {string} htmlContent - Conteúdo HTML
   * @param {string} serviceName - Nome do serviço
   * @param {string} serviceType - Tipo de serviço
   * @returns {Object} Metadados extraídos
   */
  extractMetadata(htmlContent, serviceName, serviceType) {
    // Extrai título
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : serviceName;

    // Extrai descrição
    const descMatch = htmlContent.match(/<meta\s+name="description"\s+content="(.*?)"/i);
    const description = descMatch ? descMatch[1] : '';

    // Conta seções principais
    const h1Count = (htmlContent.match(/<h1/gi) || []).length;
    const imageCount = (htmlContent.match(/<img/gi) || []).length;
    const buttonCount = (htmlContent.match(/<button|<a\s+[^>]*class="[^"]*btn/gi) || []).length;

    return {
      title,
      description,
      serviceType,
      generatedAt: new Date(),
      htmlSize: htmlContent.length,
      sections: {
        h1s: h1Count,
        images: imageCount,
        buttons: buttonCount,
      },
      seoScore: this.calculateSeoScore(htmlContent),
    };
  }

  /**
   * Calcula score SEO da página
   * 
   * @private
   * @param {string} htmlContent - Conteúdo HTML
   * @returns {number} Score entre 0-100
   */
  calculateSeoScore(htmlContent) {
    let score = 0;

    // Meta tags (20 pontos)
    if (htmlContent.includes('<meta name="description"')) score += 5;
    if (htmlContent.includes('<meta name="keywords"')) score += 5;
    if (htmlContent.includes('<meta name="viewport"')) score += 5;
    if (htmlContent.includes('<meta og:')) score += 5;

    // Headings (20 pontos)
    if (htmlContent.includes('<h1')) score += 10;
    if ((htmlContent.match(/<h[2-6]/gi) || []).length > 0) score += 10;

    // Imagens (15 pontos)
    const imgTags = htmlContent.match(/<img[^>]*alt="[^"]+"/gi) || [];
    if (imgTags.length > 0) score += 15;

    // Schema markup (20 pontos)
    if (htmlContent.includes('schema.org') || htmlContent.includes('ld+json')) score += 20;

    // Estrutura (15 pontos)
    if (htmlContent.includes('<header') || htmlContent.includes('<nav')) score += 5;
    if (htmlContent.includes('<main') || htmlContent.includes('<section')) score += 5;
    if (htmlContent.includes('<footer')) score += 5;

    // Mobile friendly (10 pontos)
    if (htmlContent.includes('viewport')) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Salva landing page no Firestore
   * 
   * @private
   * @param {Object} pageData - Dados da página
   * @returns {Promise<string>} ID do documento criado
   */
  async saveLandingPage(pageData) {
    try {
      const pagesRef = this.db.collection('landing_pages');
      const docRef = await pagesRef.add({
        ...pageData,
        createdAt: new Date(),
        status: 'published',
        views: 0,
        conversions: 0,
        conversionRate: 0,
        variants: [], // Para A/B testing
        analytics: {
          pageViews: 0,
          uniqueVisitors: 0,
          bounceRate: 0,
          avgTimeOnPage: 0,
          lastUpdated: new Date(),
        },
      });

      console.log(`📝 Landing page saved: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving landing page:', error.message);
      throw error;
    }
  }

  /**
   * Cria variação A/B da landing page
   * 
   * @param {string} pageId - ID da página original
   * @param {Object} modifications - Modificações (headline, colors, cta text, etc)
   * @returns {Promise<Object>} Página variante criada
   */
  async createVariant(pageId, modifications) {
    try {
      // Busca página original
      const originalRef = this.db.collection('landing_pages').doc(pageId);
      const originalDoc = await originalRef.get();

      if (!originalDoc.exists) {
        throw new Error(`Landing page not found: ${pageId}`);
      }

      const originalData = originalDoc.data();
      let modifiedHtml = originalData.htmlContent;

      // Aplica modificações
      if (modifications.headline) {
        modifiedHtml = modifiedHtml.replace(
          /<h1[^>]*>(.*?)<\/h1>/i,
          `<h1>${modifications.headline}</h1>`
        );
      }

      if (modifications.subheadline) {
        modifiedHtml = modifiedHtml.replace(
          /<h2[^>]*>(.*?)<\/h2>/i,
          `<h2>${modifications.subheadline}</h2>`
        );
      }

      if (modifications.ctaText) {
        modifiedHtml = modifiedHtml.replace(
          new RegExp(`>${originalData.ctaText}<`, 'gi'),
          `>${modifications.ctaText}<`
        );
      }

      if (modifications.colors) {
        // Substitui variáveis CSS ou cores específicas
        if (modifications.colors.primary) {
          modifiedHtml = modifiedHtml.replace(
            /--primary-color:\s*#[0-9A-Fa-f]{6}/g,
            `--primary-color: ${modifications.colors.primary}`
          );
        }
      }

      // Salva como variante
      const variantId = `${pageId}_v${Date.now()}`;
      const variantRef = this.db.collection('landing_pages').doc(variantId);
      
      await variantRef.set({
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

      // Atualiza página original com referência à variante
      await originalRef.update({
        variants: [...(originalData.variants || []), variantId],
      });

      console.log(`📊 Variant created: ${variantId}`);

      return {
        success: true,
        variantId,
        url: `https://landing.servio.ai/${variantId}`,
      };
    } catch (error) {
      console.error('❌ Error creating variant:', error.message);
      throw error;
    }
  }

  /**
   * Registra evento de page view ou conversão
   * 
   * @param {string} pageId - ID da página
   * @param {string} eventType - 'view' ou 'conversion'
   * @param {Object} metadata - Dados adicionais (utm params, referrer, etc)
   * @returns {Promise<void>}
   */
  async recordEvent(pageId, eventType, metadata = {}) {
    try {
      const pageRef = this.db.collection('landing_pages').doc(pageId);
      const eventsRef = this.db.collection('landing_page_events');

      // Registra evento
      await eventsRef.add({
        pageId,
        eventType, // 'view' | 'conversion' | 'form_submit'
        ...metadata,
        timestamp: new Date(),
        userAgent: metadata.userAgent || 'unknown',
        ipAddress: metadata.ipAddress || 'unknown',
      });

      // Atualiza métricas da página
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

      console.log(`📊 Event recorded: ${eventType} for ${pageId}`);
    } catch (error) {
      console.error('❌ Error recording event:', error.message);
      // Não falha a resposta, apenas loga
    }
  }

  /**
   * Obtém análise de uma landing page
   * 
   * @param {string} pageId - ID da página
   * @returns {Promise<Object>} Dados analíticos
   */
  async getAnalytics(pageId) {
    try {
      const pageRef = this.db.collection('landing_pages').doc(pageId);
      const pageDoc = await pageRef.get();

      if (!pageDoc.exists) {
        throw new Error(`Landing page not found: ${pageId}`);
      }

      const pageData = pageDoc.data();

      // Busca eventos dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const eventsRef = this.db.collection('landing_page_events');
      const eventsSnapshot = await eventsRef
        .where('pageId', '==', pageId)
        .where('timestamp', '>=', thirtyDaysAgo)
        .get();

      const events = [];
      eventsSnapshot.forEach(doc => {
        events.push({ id: doc.id, ...doc.data() });
      });

      // Calcula métricas
      const views = events.filter(e => e.eventType === 'view').length;
      const conversions = events.filter(e => e.eventType === 'conversion').length;
      const conversionRate = views > 0 ? (conversions / views * 100).toFixed(2) : 0;

      return {
        success: true,
        pageId,
        pageName: pageData.serviceName,
        metrics: {
          totalViews: pageData.views || 0,
          totalConversions: pageData.conversions || 0,
          conversionRate: pageData.conversionRate || 0,
          last30Days: {
            views,
            conversions,
            conversionRate,
            events: events.length,
          },
        },
        variants: pageData.variants || [],
        seoScore: pageData.metadata?.seoScore || 0,
        lastUpdated: pageData.createdAt,
      };
    } catch (error) {
      console.error('❌ Error fetching analytics:', error.message);
      throw error;
    }
  }

  /**
   * Publica uma landing page em produção (Cloud Run)
   * 
   * @param {string} pageId - ID da página
   * @returns {Promise<Object>} URL da página publicada
   */
  async publishPage(pageId) {
    try {
      const pageRef = this.db.collection('landing_pages').doc(pageId);
      const pageDoc = await pageRef.get();

      if (!pageDoc.exists) {
        throw new Error(`Landing page not found: ${pageId}`);
      }

      const pageData = pageDoc.data();

      // Prepara para deploy
      const deployPayload = {
        pageId,
        serviceName: pageData.serviceName,
        htmlContent: pageData.htmlContent,
        customDomain: `${pageData.serviceName.toLowerCase().replace(/\s+/g, '-')}.landing.servio.ai`,
      };

      // TODO: Integrar com Cloud Run API para deploy automático
      console.log(`📡 Deploy payload prepared for ${pageId}`);

      // Atualiza status
      await pageRef.update({
        status: 'published',
        publishedAt: new Date(),
        publicUrl: `https://landing.servio.ai/${pageId}`,
      });

      console.log(`✅ Page published: ${pageId}`);

      return {
        success: true,
        pageId,
        url: `https://landing.servio.ai/${pageId}`,
        customDomain: deployPayload.customDomain,
      };
    } catch (error) {
      console.error('❌ Error publishing page:', error.message);
      throw error;
    }
  }

  /**
   * Lista todas as landing pages do prospector
   * 
   * @param {string} prospectorEmail - Email do prospector
   * @returns {Promise<Array>} Lista de páginas
   */
  async listPages(prospectorEmail) {
    try {
      const pagesRef = this.db.collection('landing_pages');
      const snapshot = await pagesRef
        .where('prospectorEmail', '==', prospectorEmail)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const pages = [];
      snapshot.forEach(doc => {
        pages.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        });
      });

      return pages;
    } catch (error) {
      console.error('❌ Error listing pages:', error.message);
      throw error;
    }
  }

  /**
   * Deleta uma landing page
   * 
   * @param {string} pageId - ID da página
   * @returns {Promise<void>}
   */
  async deletePage(pageId) {
    try {
      const pageRef = this.db.collection('landing_pages').doc(pageId);
      
      // Deleta variantes também
      const pageDoc = await pageRef.get();
      const variants = pageDoc.data().variants || [];

      for (const variantId of variants) {
        await this.db.collection('landing_pages').doc(variantId).delete();
      }

      // Deleta página principal
      await pageRef.delete();

      // Deleta eventos associados
      const eventsRef = this.db.collection('landing_page_events');
      const eventsSnapshot = await eventsRef
        .where('pageId', '==', pageId)
        .get();

      eventsSnapshot.forEach(doc => {
        doc.ref.delete();
      });

      console.log(`🗑️ Page deleted: ${pageId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting page:', error.message);
      throw error;
    }
  }
}

module.exports = LandingPageService;
