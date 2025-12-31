/**
 * Landing Pages API Routes
 *
 * Endpoints:
 * POST   /api/landing-pages/generate     - Gera landing page com IA
 * POST   /api/landing-pages/:id/variant  - Cria variante A/B
 * POST   /api/landing-pages/:id/publish  - Publica página
 * GET    /api/landing-pages/:id          - Obtém página
 * GET    /api/landing-pages              - Lista páginas do usuário
 * GET    /api/landing-pages/:id/analytics - Análise de conversão
 * POST   /api/landing-pages/:id/event    - Registra evento (view/conversion)
 * DELETE /api/landing-pages/:id          - Deleta página
 * POST   /api/landing-pages/form         - Submissão de formulário
 *
 * @module landingPages
 */

const express = require('express');

/**
 * Factory function para criar router
 *
 * @param {Object} dependencies - Injeção de dependências
 * @param {Object} dependencies.db - Firestore instance
 * @param {LandingPageService} dependencies.landingPageService - Service
 * @returns {Router} Express router configurado
 */
function createLandingPagesRouter({ db, landingPageService }) {
  const router = express.Router();

  // Middleware para validar autenticação
  const requireAuth = (req, res, next) => {
    const email = req.headers['x-user-email'];
    if (!email) {
      return res.status(401).json({ error: 'Unauthorized. Missing x-user-email header.' });
    }
    req.userEmail = email;
    next();
  };

  /**
   * POST /api/landing-pages/generate
   * Gera uma landing page completa com IA Gemini
   */
  router.post('/generate', requireAuth, async (req, res) => {
    try {
      const { serviceType, serviceName, description, targetAudience, ctaText } = req.body;

      // Validação
      if (!serviceType || !serviceName || !description || !targetAudience) {
        return res.status(400).json({
          error: 'Missing required fields: serviceType, serviceName, description, targetAudience',
        });
      }

      console.log(`📄 Generating landing page for ${serviceName}`);

      const result = await landingPageService.generateLandingPage({
        serviceType,
        serviceName,
        description,
        targetAudience,
        prospectorEmail: req.userEmail,
        ctaText,
      });

      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('❌ Generate error:', error.message);
      res.status(500).json({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  });

  /**
   * GET /api/landing-pages/:id
   * Obtém uma landing page específica (sem HTML)
   */
  router.get('/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const pageRef = db.collection('landing_pages').doc(id);
      const pageDoc = await pageRef.get();

      if (!pageDoc.exists) {
        return res.status(404).json({ error: 'Landing page not found' });
      }

      const pageData = pageDoc.data();

      // Verifica permissão
      if (pageData.prospectorEmail !== req.userEmail) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Não retorna HTML completo por performance
      const { htmlContent, ...pageInfo } = pageData;

      res.json({
        success: true,
        page: {
          id,
          ...pageInfo,
          htmlSize: htmlContent?.length || 0,
        },
      });
    } catch (error) {
      console.error('❌ Get page error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/landing-pages
   * Lista todas as landing pages do usuário
   */
  router.get('/', requireAuth, async (req, res) => {
    try {
      const pages = await landingPageService.listPages(req.userEmail);

      // Remove HTML completo da resposta
      const sanitizedPages = pages.map(page => {
        const { htmlContent, ...pageInfo } = page;
        return {
          ...pageInfo,
          htmlSize: htmlContent?.length || 0,
        };
      });

      res.json({
        success: true,
        pages: sanitizedPages,
        total: sanitizedPages.length,
      });
    } catch (error) {
      console.error('❌ List pages error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/landing-pages/:id/variant
   * Cria uma variante A/B da landing page
   */
  router.post('/:id/variant', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const modifications = req.body;

      if (!modifications || Object.keys(modifications).length === 0) {
        return res.status(400).json({
          error: 'No modifications provided. Send headline, subheadline, ctaText, or colors.',
        });
      }

      console.log(`📊 Creating variant for ${id}`);

      const result = await landingPageService.createVariant(id, modifications);

      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('❌ Variant error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/landing-pages/:id/publish
   * Publica landing page em produção
   */
  router.post('/:id/publish', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      console.log(`📡 Publishing landing page ${id}`);

      const result = await landingPageService.publishPage(id);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('❌ Publish error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/landing-pages/:id/analytics
   * Retorna análise de conversão e performance
   */
  router.get('/:id/analytics', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const analytics = await landingPageService.getAnalytics(id);

      res.json({
        success: true,
        ...analytics,
      });
    } catch (error) {
      console.error('❌ Analytics error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/landing-pages/:id/event
   * Registra evento de page view ou conversão
   *
   * Pode ser chamado:
   * 1. Do frontend ao carregar página (view)
   * 2. Quando usuário preenche form (conversion)
   * 3. De webhook externo
   */
  router.post('/:id/event', async (req, res) => {
    try {
      const { id } = req.params;
      const { eventType, metadata } = req.body;

      if (!['view', 'conversion', 'form_submit'].includes(eventType)) {
        return res.status(400).json({
          error: 'Invalid eventType. Use: view, conversion, or form_submit',
        });
      }

      console.log(`📊 Recording ${eventType} for page ${id}`);

      await landingPageService.recordEvent(id, eventType, {
        ...metadata,
        userAgent: req.get('user-agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error('❌ Event error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/landing-pages/:id
   * Deleta uma landing page e suas variantes
   */
  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Verifica permissão
      const pageRef = db.collection('landing_pages').doc(id);
      const pageDoc = await pageRef.get();

      if (!pageDoc.exists) {
        return res.status(404).json({ error: 'Landing page not found' });
      }

      if (pageDoc.data().prospectorEmail !== req.userEmail) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      console.log(`🗑️ Deleting landing page ${id}`);

      await landingPageService.deletePage(id);

      res.json({ success: true, message: 'Landing page deleted' });
    } catch (error) {
      console.error('❌ Delete error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/landing-pages/form
   * Recebe submissão de formulário da landing page
   * Salva em Firestore e integra com CRM (se disponível)
   */
  router.post('/form', async (req, res) => {
    try {
      const { pageId, name, email, phone, message } = req.body;

      // Validação
      if (!pageId || !email) {
        return res.status(400).json({
          error: 'Missing required fields: pageId, email',
        });
      }

      console.log(`📝 Form submission from ${email} on page ${pageId}`);

      // Salva submission em Firestore
      const submissionsRef = db.collection('landing_page_submissions');
      await submissionsRef.add({
        pageId,
        name: name || 'Anonymous',
        email,
        phone: phone || '',
        message: message || '',
        submittedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Registra como conversion
      await landingPageService.recordEvent(pageId, 'form_submit', {
        email,
        name,
      });

      // TODO: Integrar com CRM (Pipedrive/HubSpot)
      console.log(`✅ Form saved and marked as conversion for ${pageId}`);

      res.json({
        success: true,
        message: 'Form received. We will contact you soon!',
      });
    } catch (error) {
      console.error('❌ Form submission error:', error.message);
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /api/landing-pages/:id/html
   * Retorna HTML completo para renderização/preview
   * Apenas para proprietário da página
   */
  router.get('/:id/html', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const pageRef = db.collection('landing_pages').doc(id);
      const pageDoc = await pageRef.get();

      if (!pageDoc.exists) {
        return res.status(404).json({ error: 'Landing page not found' });
      }

      const pageData = pageDoc.data();

      // Verifica permissão
      if (pageData.prospectorEmail !== req.userEmail) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Retorna HTML com injeção de analytics
      const htmlWithAnalytics = pageData.htmlContent.replace(
        '</body>',
        `
        <script>
          // Registra page view ao carregar
          fetch('/api/landing-pages/${id}/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'view',
              metadata: { referrer: document.referrer }
            })
          });
        </script>
        </body>
        `
      );

      res.type('text/html').send(htmlWithAnalytics);
    } catch (error) {
      console.error('❌ HTML retrieval error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createLandingPagesRouter;
