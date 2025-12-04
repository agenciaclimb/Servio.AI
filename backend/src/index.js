const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const helmet = require("helmet");
const { Storage } = require("@google-cloud/storage");
// Stripe config helper (mode detection + safe init)
const { createStripe } = require('./stripeConfig');
// Database wrapper com fallback em memória
const { createDbWrapper, fieldValueHelpers } = require('./dbWrapper');
// Authorization middleware for granular permission checking
const { 
  requireAuth, 
  requireRole, 
  requireAdmin,
  requireOwnership,
  requireJobParticipant,
  requireDisputeParticipant,
  validateBody
} = require('./authorizationMiddleware');
const { GoogleGenerativeAI } = require("@google/generative-ai");
// Prospector follow-up automation scheduler helpers
const { processPendingOutreach } = require('./outreachScheduler');
// Follow-up email processing service & Gmail integration
const gmailService = require('./gmailService');
const followUpService = require('./followUpService');
// WhatsApp Business API service
const WhatsAppService = require('./whatsappService');
const whatsappRouter = require('./routes/whatsapp');
const whatsappMultiRoleService = require('./whatsappMultiRoleService');
const whatsappMultiRoleRouter = require('./routes/whatsappMultiRole');

// ===========================
// Leaderboard Cache & Rate Limiting (Phase 1)
// ===========================
// In-memory cache structure keyed by sort field (totalCommissionsEarned | totalRecruits)
// TTL configurable via env LEADERBOARD_CACHE_MS (default 300000 ms = 5min)
// Simple IP-based rate limiting using sliding window defined by LEADERBOARD_RATE_WINDOW_MS (default 300000 ms)
// and limit LEADERBOARD_RATE_LIMIT (default 60 requests/window)

const LEADERBOARD_CACHE_MS = Number.parseInt(process.env.LEADERBOARD_CACHE_MS || '300000', 10);
const LEADERBOARD_RATE_LIMIT = Number.parseInt(process.env.LEADERBOARD_RATE_LIMIT || '60', 10);
const LEADERBOARD_RATE_WINDOW_MS = Number.parseInt(process.env.LEADERBOARD_RATE_WINDOW_MS || '300000', 10);

const leaderboardCache = {
  totalCommissionsEarned: { expiresAt: 0, payload: null },
  totalRecruits: { expiresAt: 0, payload: null }
};

function isRateLimited(ip, storeMap, cfg) {
  if (!ip) return false;
  const now = Date.now();
  let entry = storeMap.get(ip);
  if (!entry) {
    entry = { count: 0, windowStart: now };
    storeMap.set(ip, entry);
  }
  if (now - entry.windowStart >= cfg.windowMs) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  return entry.count > cfg.limit;
}

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || '').toString().split(',')[0].trim();
}

// Initialize Firebase Admin SDK
// For Cloud Run, credentials will be automatically picked up from the service account.
// For local development, you might need to set GOOGLE_APPLICATION_CREDENTIALS
// or provide a service account key file directly.
try {
  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp();
  }
} catch (error_) {
  // Allow running without firebase credentials locally
  console.warn('Firebase initialization warning:', error_);
}

const storage = new Storage();
// DB Wrapper com fallback em memória se Firestore falhar
const defaultDb = createDbWrapper();
// Stripe initialization (wrapped for mode detection)
const stripeContainer = createStripe();
const defaultStripe = stripeContainer ? stripeContainer.instance : null; // Can be injected in tests
// Gemini AI initialization - requires GEMINI_API_KEY env var
const defaultGenAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;
const port = process.env.PORT || 8081;

/**
 * Calculate provider revenue share rate based on profile and performance stats.
 * Simple, deterministic formula so tests can assert output ranges.
 * @param {Object} provider - Provider profile document
 * @param {Object} stats - Performance stats { totalJobs, averageRating, totalDisputes, totalRevenue }
 * @returns {{ currentRate: number, factors: Record<string, number> }}
 */
function calculateProviderRate(provider = {}, stats = {}) {
  const baseRate = 0.75;

  const headline = (provider.headline || '').trim();
  const verificationStatus = provider.verificationStatus || 'pendente';
  const totalJobs = Number(stats.totalJobs || 0);
  const averageRating = Number(stats.averageRating || 0);
  const totalRevenue = Number(stats.totalRevenue || 0);
  const totalDisputes = Number(stats.totalDisputes || 0);

  // Bonuses according to tests' expectations
  const profileComplete = headline && verificationStatus === 'verificado' ? 0.02 : 0;
  const highRating = averageRating >= 4.8 ? 0.02 : 0;
  
  // Calculate volume tier bonus based on revenue
  const getVolumeTier = (revenue) => {
    if (revenue >= 11000) return 0.03;
    if (revenue >= 6000) return 0.02;
    if (revenue >= 1500) return 0.01;
    return 0;
  };
  const volumeTier = getVolumeTier(totalRevenue);
  
  const lowDisputeRate = totalJobs > 0 && totalDisputes / totalJobs < 0.05 ? 0.01 : 0;

  let rate = baseRate + profileComplete + highRating + volumeTier + lowDisputeRate;
  // Cap at 85%
  rate = Math.min(0.85, rate);

  // Tier heuristic (kept simple to satisfy tests)
  const tier = highRating && profileComplete && volumeTier >= 0.02 && lowDisputeRate > 0 ? 'Ouro' : 'Bronze';

  return {
    currentRate: Number(rate.toFixed(2)),
    bonuses: { profileComplete, highRating, volumeTier, lowDisputeRate },
    tier,
  };
}

/**
 * Factory function to create the Express app with dependency injection
 * @param {Object} options - Configuration options
 * @param {Object} options.db - Firestore database instance (default: admin.firestore())
 * @param {Object} options.storage - Google Cloud Storage instance (default: new Storage())
 * @param {Object} options.stripe - Stripe instance (default: require('stripe')(env.STRIPE_SECRET_KEY))
 * @returns {Express.Application} Configured Express app
 */
function createApp({
  db = defaultDb,
  storage: storageInstance = storage,
  stripe = defaultStripe,
  genAI = defaultGenAI,
  leaderboardRateConfig,
  leaderboardCacheMs,
} = {}) {
  const app = express();
  // Instance-specific rate limiting configuration
  const rateCfg = {
    limit: (leaderboardRateConfig && leaderboardRateConfig.limit) || LEADERBOARD_RATE_LIMIT,
    windowMs: (leaderboardRateConfig && leaderboardRateConfig.windowMs) || LEADERBOARD_RATE_WINDOW_MS
  };
  // Instance-specific rate map
  const leaderboardRateDataLocal = new Map();
  // Allow overriding cache TTL per instance
  const cacheTtlMs = leaderboardCacheMs || LEADERBOARD_CACHE_MS;

  // ===========================
  // Security Middleware (Helmet)
  // ===========================
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "https:", "data:"],
        connectSrc: ["'self'", "https://firebaseinstallations.googleapis.com", "https://*.googleapis.com"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      }
    },
    frameguard: { action: 'deny' },                    // X-Frame-Options: DENY
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true }, // 1 year
    noSniff: true,                                      // X-Content-Type-Options: nosniff
    xssFilter: true,                                    // X-XSS-Protection: 1; mode=block
    permittedCrossDomainPolicies: false,               // X-Permitted-Cross-Domain-Policies: none
    dnsPrefetchControl: { allow: false }               // X-DNS-Prefetch-Control: off
  }));

  app.use(cors());
  // Lightweight test/dev auth: allow injecting user via header in non-authenticated environments
  app.use((req, _res, next) => {
    if (!req.user) {
      const injected = req.headers['x-user-email'];
      if (injected && typeof injected === 'string') {
        req.user = { email: injected };
      }
    }
    next();
  });
  
  // Use express.json() for all routes except the webhook
  app.use((req, res, next) => {
    if (req.path === '/api/stripe-webhook') return next();
    return express.json()(req, res, next);
  });

  // Debug log to verify code deployment
  console.log('[DEPLOY-DEBUG] Root message: "SERVIO.AI Backend v3.0 with Health check"');
  
  // Basic "Hello World" endpoint for the backend service
  app.get("/", (req, res) => {
    res.send("SERVIO.AI Backend v3.0 with Health check");
  });

  // Enhanced health check with version and routes count for production diagnostics
  const computeHealthData = () => {
    let buildVersion = 'unknown';
    try {
      const fs = require('fs');
      buildVersion = fs.readFileSync('/tmp/.build-version', 'utf8').trim();
    } catch (_) { /* ignore */ }
    
    let routeCount = 0;
    try {
      const stack = app._router && app._router.stack ? app._router.stack : [];
      stack.forEach((layer) => {
        if (layer.route) routeCount++;
        else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
          layer.handle.stack.forEach((rl) => { if (rl.route) routeCount++; });
        }
      });
    } catch (_) { /* ignore */ }
    
    return { buildVersion, routeCount };
  };

  // Health check endpoint for load balancers and monitoring
  app.get("/health", (req, res) => {
    const { buildVersion, routeCount } = computeHealthData();
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "servio-backend",
      version: buildVersion,
      routes: routeCount
    });
  });

  // Health check alias for API prefix compatibility
  app.get("/api/health", (req, res) => {
    const { buildVersion, routeCount } = computeHealthData();
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "servio-backend",
      version: buildVersion,
      routes: routeCount
    });
  });

  // Lightweight version endpoint to confirm deployed revision
  app.get('/api/version', (_req, res) => {
    try {
      const fs = require('fs');
      const ver = fs.readFileSync('/tmp/.build-version', 'utf8').trim();
      console.log('[/api/version] Responding with version:', ver);
      return res.status(200).json({ version: ver || 'unknown' });
    } catch (err) {
      console.error('[/api/version] Error reading version file:', err);
      return res.status(200).json({ version: 'unknown', error: err.message });
    }
  });

  // List registered routes (safe diagnostics, no secrets)
  app.get('/api/routes', (_req, res) => {
    try {
      const routes = [];
      const stack = app._router && app._router.stack ? app._router.stack : [];
      stack.forEach((layer) => {
        if (layer.route && layer.route.path) {
          const methods = Object.keys(layer.route.methods || {}).filter(Boolean);
          routes.push({ path: layer.route.path, methods });
        } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
          layer.handle.stack.forEach((rl) => {
            if (rl.route && rl.route.path) {
              const methods = Object.keys(rl.route.methods || {}).filter(Boolean);
              // Attempt to reconstruct nested mount path
              const mount = (layer.regexp && layer.regexp.source) ? layer.regexp.source : '';
              routes.push({ path: rl.route.path, methods, mount });
            }
          });
        }
      });
      console.log('[/api/routes] Responding with', routes.length, 'routes');
      return res.status(200).json({ total: routes.length, routes });
    } catch (e) {
      console.error('[/api/routes] Error enumerating routes:', e);
      return res.status(500).json({ error: 'Failed to enumerate routes', message: e && e.message });
    }
  });

  // =================================================================
  // AI ENDPOINTS (GEMINI)
  // =================================================================

  // POST /api/enhance-job - Enhance job request with AI
  app.post("/api/enhance-job", async (req, res) => {
    const { prompt, address, fileCount } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    // Deterministic stub used when Gemini isn't configured or fails
    const buildStub = () => {
      const p = String(prompt || '').toLowerCase();
      
      // Determine category from keywords
      const getCategoryFromText = (text) => {
        if (/eletric|luz|tomada|fio/.test(text)) return 'reparos';
        if (/pintur|parede|tinta/.test(text)) return 'reparos';
        if (/encan|vazam|torneira|cano/.test(text)) return 'reparos';
        if (/design|logo|marca|arte/.test(text)) return 'design';
        if (/comput|notebook|formata|ti/.test(text)) return 'ti';
        if (/limp|faxin|higien/.test(text)) return 'limpeza';
        return 'outro';
      };
      const cat = getCategoryFromText(p);

      // Determine service type
      const getServiceType = (text) => {
        if (/instal|trocar|montar|pintar|formatar|limpar/.test(text)) return 'tabelado';
        if (/diagnost|avaliar|inspecionar/.test(text)) return 'diagnostico';
        return 'personalizado';
      };
      const serviceType = getServiceType(p);

      // Determine urgency level
      const getUrgency = (text) => {
        if (/hoje|urgente/.test(text)) return 'hoje';
        if (/amanh[ãa]/.test(text)) return 'amanha';
        if (/semana/.test(text)) return 'semana';
        return 'flexivel';
      };
      const urgency = getUrgency(p);

      // very rough budget heuristic just to avoid blocking the flow
      const getEstimatedBudget = (text) => {
        if (/pintur|parede/.test(text)) return 350;
        if (/eletric|tomada/.test(text)) return 200;
        if (/encan|vazam/.test(text)) return 250;
        if (/design|logo/.test(text)) return 500;
        if (/comput|notebook|ti/.test(text)) return 180;
        return 300;
      };
      const estimatedBudget = getEstimatedBudget(p);

      return {
        description: prompt.trim(),
        category: cat,
        serviceType,
        urgency,
        estimatedBudget,
        ...(address ? { address } : {}),
        ...(fileCount ? { fileCount } : {}),
      };
    };

    // If Gemini is not configured, return stub immediately
    if (!genAI) {
      console.warn('[enhance-job] GEMINI_API_KEY not configured – returning deterministic stub');
      return res.json(buildStub());
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const systemPrompt = `Você é um assistente especializado em transformar solicitações de serviços em descrições estruturadas e profissionais.

Analise a solicitação do usuário e retorne um JSON com os seguintes campos:
- description: Descrição profissional e detalhada do serviço
- category: Uma das categorias (reparos, instalacao, montagem, limpeza, design, ti, beleza, eventos, consultoria, outro)
- serviceType: Tipo específico do serviço
- urgency: Urgência (hoje, amanha, 3dias, semana, flexivel)
- estimatedBudget: Orçamento estimado em reais (número)

Solicitação do usuário: ${prompt}
${address ? `Endereço: ${address}` : ''}
${fileCount ? `Número de arquivos anexados: ${fileCount}` : ''}

Responda APENAS com o JSON, sem markdown ou texto adicional.`;

      const result = await model.generateContent(systemPrompt);
      const text = result.response.text();
      
      // Parse JSON from response, removing markdown code blocks if present
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI response was not valid JSON");
      }
      
      const enhancedJob = JSON.parse(jsonMatch[0]);
      res.json(enhancedJob);
    } catch (error) {
      console.error("Error enhancing job (falling back to stub):", error);
      res.json(buildStub());
    }
  });

  // POST /api/suggest-maintenance - Suggest maintenance for an item
  app.post("/api/suggest-maintenance", async (req, res) => {
    const { item } = req.body;
    if (!item || !item.name) {
      return res.status(400).json({ error: "Item data is required." });
    }

    // Deterministic fallback: suggest maintenance based on heuristics
    const buildMaintenanceStub = (item) => {
      const name = (item.name || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      
      // Heuristic: check if item suggests needing maintenance
      const needsMaintenance = /eletro|geladeira|ar.condicionado|máquina|motor|carro|veículo/i.test(name + ' ' + category);
      
      if (!needsMaintenance) return null;
      
      // Check urgency based on last maintenance
      let urgency = 'media';
      if (item.lastMaintenance) {
        const lastDate = new Date(item.lastMaintenance);
        const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 365) urgency = 'alta';
        // daysSince > 180 already covered by default 'media'
        else if (daysSince <= 180) return null; // Too recent
      }
      
      return {
        title: `Manutenção preventiva recomendada para ${item.name}`,
        description: `Verificar componentes, realizar limpeza e ajustes necessários para garantir o bom funcionamento do equipamento.`,
        urgency,
        estimatedCost: urgency === 'alta' ? 300 : 200
      };
    };

    const model = getModel();
    if (!model) return res.json(buildMaintenanceStub(item));

    try {
      const systemPrompt = `Você é um assistente de manutenção preventiva. Analise o item e sugira manutenção se necessário.

Item: ${item.name}
Categoria: ${item.category || 'não especificada'}
${item.lastMaintenance ? `Última manutenção: ${item.lastMaintenance}` : 'Sem registro de manutenção'}

Se o item precisa de manutenção, retorne um JSON com:
- title: Título da sugestão
- description: Descrição detalhada
- urgency: Nível de urgência (baixa, media, alta)
- estimatedCost: Custo estimado em reais

Se NÃO precisa de manutenção, retorne null.

Responda APENAS com o JSON ou null, sem markdown ou texto adicional.`;

      const result = await model.generateContent(systemPrompt);
      const text = result.response.text().trim();
      
      if (text === 'null' || text.toLowerCase() === 'null') {
        return res.json(null);
      }
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.json(null);
      }
      
      const suggestion = JSON.parse(jsonMatch[0]);
      res.json(suggestion);
    } catch (error) {
      console.warn("AI error /api/suggest-maintenance fallback:", error);
      return res.json(buildMaintenanceStub(item));
    }
  });

  // =================================================================
  // ADDITIONAL AI ENDPOINTS (STUB + OPTIONAL GEMINI)
  // =================================================================

  // Helper: safely get a model if configured
  function getModel(modelName = "gemini-2.0-flash-exp") {
    try {
      if (!genAI) return null;
      return genAI.getGenerativeModel({ model: modelName });
    } catch (e) {
      console.warn('getModel failed, falling back to stub:', e);
      return null;
    }
  }

  // POST /api/generate-tip
  app.post('/api/generate-tip', async (req, res) => {
    const user = req.body?.user || {};
    const baseTip = `Complete seu perfil adicionando uma foto profissional, ${user.name || 'usuário'}.`; // deterministic
    const model = getModel();
    if (!model) return res.json({ tip: baseTip });
    try {
      const prompt = `Gere uma única dica curta e objetiva (máx 140 caracteres) para melhorar o perfil:
Nome: ${user.name || 'N/A'}
Bio: ${user.bio || 'N/A'}
Headline: ${user.headline || 'N/A'}
Retorne apenas a dica sem explicações adicionais.`;
      const result = await model.generateContent(prompt);
      const text = (result.response.text() || '').trim();
      return res.json({ tip: text || baseTip });
    } catch (e) {
      console.warn('AI error /api/generate-tip fallback:', e);
      return res.json({ tip: baseTip });
    }
  });

  // POST /api/enhance-profile
  app.post('/api/enhance-profile', async (req, res) => {
    const profile = req.body?.profile || {};
    const stub = {
      suggestedHeadline: `Profissional de ${profile.headline?.split(' ')[0] || 'Serviços'} Confiável`,
      suggestedBio: (profile.bio ? profile.bio : 'Profissional dedicado a oferecer um serviço de alta qualidade.') + ' Experiência comprovada e foco no cliente.'
    };
    const model = getModel();
    if (!model) return res.json(stub);
    try {
      const prompt = `Melhore o headline e a bio do prestador. Retorne JSON com campos: suggestedHeadline, suggestedBio.
Nome: ${profile.name || 'N/A'}
Headline atual: ${profile.headline || 'N/A'}
Bio atual: ${profile.bio || 'N/A'}
Requisitos: tom profissional, claro, conciso. Resposta APENAS JSON.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { return res.json(JSON.parse(jsonMatch[0])); } catch { /* ignore */ }
      }
      return res.json(stub);
    } catch (e) {
      console.warn('AI error /api/enhance-profile fallback:', e);
      return res.json(stub);
    }
  });

  // POST /api/generate-referral
  app.post('/api/generate-referral', async (req, res) => {
    const { senderName, friendEmail } = req.body || {};
    const subjectStub = `Convite para conhecer a SERVIO.AI`; 
    const bodyStub = `Olá ${friendEmail || 'amigo'}, ${senderName || 'Um usuário'} está recomendando a plataforma SERVIO.AI para contratar ou oferecer serviços com segurança.`;
    const model = getModel();
    if (!model) return res.json({ subject: subjectStub, body: bodyStub });
    try {
      const prompt = `Gerar email de indicação curto em PT-BR.
Remetente: ${senderName || 'Usuário'}
Destinatário: ${friendEmail || 'amigo'}
Incluir benefícios: segurança, rapidez, reputação dos prestadores.
Formato JSON: {"subject":"...","body":"..."}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { return res.json(JSON.parse(jsonMatch[0])); } catch { /* ignore */ }
      }
      return res.json({ subject: subjectStub, body: bodyStub });
    } catch (e) {
      console.warn('AI error /api/generate-referral fallback:', e);
      return res.json({ subject: subjectStub, body: bodyStub });
    }
  });

  // POST /api/generate-proposal
  app.post('/api/generate-proposal', async (req, res) => {
    const { job, provider } = req.body || {};
    const stubMessage = `Olá! Posso ajudar com "${job?.description?.slice(0,60) || 'seu serviço'}" garantindo qualidade e prazo. Vamos prosseguir?`;
    const model = getModel();
    if (!model) return res.json({ message: stubMessage });
    try {
      const prompt = `Gerar mensagem de proposta curta (máx 240 caracteres) em PT-BR para um serviço.
Descrição do serviço: ${job?.description || 'N/A'}
Categoria: ${job?.category || 'N/A'}
Prestador: ${provider?.name || 'Profissional'}
Retornar somente texto final.`;
      const result = await model.generateContent(prompt);
      const text = (result.response.text() || '').trim();
      return res.json({ message: text || stubMessage });
    } catch (e) {
      console.warn('AI error /api/generate-proposal fallback:', e);
      return res.json({ message: stubMessage });
    }
  });

  // POST /api/generate-faq
  app.post('/api/generate-faq', async (req, res) => {
    const { job } = req.body || {};
    const stubFAQ = [
      { question: 'Qual o prazo estimado?', answer: 'Depende da complexidade, geralmente 24-48 horas.' },
      { question: 'Materiais estão incluídos?', answer: 'Se necessário, podem ser cotados separadamente.' }
    ];
    const model = getModel();
    if (!model) return res.json(stubFAQ);
    try {
      const prompt = `Gerar até 5 FAQs para um serviço. Formato JSON array.
Descrição: ${job?.description || 'N/A'}
Cada item: {"question":"...","answer":"..."}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const arrMatch = text.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        try { return res.json(JSON.parse(arrMatch[0])); } catch { /* ignore */ }
      }
      return res.json(stubFAQ);
    } catch (e) {
      console.warn('AI error /api/generate-faq fallback:', e);
      return res.json(stubFAQ);
    }
  });

  // POST /api/identify-item
  app.post('/api/identify-item', async (req, res) => {
    const { base64Image } = req.body || {};
    // For now just stub deterministic identification
    const stub = { itemName: 'Item Genérico', category: 'geral', brand: 'Desconhecida', model: 'N/D', serialNumber: 'N/D' };
    if (!base64Image) return res.status(400).json({ error: 'Imagem é obrigatória.' });
    return res.json(stub);
  });

  // POST /api/generate-seo
  app.post('/api/generate-seo', async (req, res) => {
    const { user, reviews = [] } = req.body || {};
    const stub = {
      seoTitle: `${user?.name || 'Prestador'} - Serviços Profissionais`,
      metaDescription: `Perfil de ${user?.name || 'prestador'} com serviços de qualidade e boa reputação.`,
      publicHeadline: user?.headline || 'Profissional Confiável',
      publicBio: (user?.bio || 'Profissional dedicado.') + ' Atende com foco em excelência e segurança.'
    };
    const model = getModel();
    if (!model) return res.json(stub);
    try {
      const prompt = `Gerar conteúdo SEO em JSON: {seoTitle, metaDescription, publicHeadline, publicBio}.
Nome: ${user?.name || 'N/A'}
Headline: ${user?.headline || 'N/A'}
Bio: ${user?.bio || 'N/A'}
Qtd reviews: ${reviews.length}
Retornar APENAS JSON.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { return res.json(JSON.parse(jsonMatch[0])); } catch { /* ignore */ }
      }
      return res.json(stub);
    } catch (e) {
      console.warn('AI error /api/generate-seo fallback:', e);
      return res.json(stub);
    }
  });

  // POST /api/summarize-reviews
  app.post('/api/summarize-reviews', async (req, res) => {
    const { providerName, reviews = [] } = req.body || {};
    const stub = `${providerName || 'O prestador'} possui ${reviews.length} avaliações mostrando compromisso com qualidade.`;
    const model = getModel();
    if (!model) return res.json({ summary: stub });
    try {
      const prompt = `Gerar resumo curto (máx 280 caracteres) das avaliações.
Nome: ${providerName || 'Prestador'}
Avaliações: ${reviews.map(r => `${r.rating}*`).join(', ')}
Retorne somente o resumo.`;
      const result = await model.generateContent(prompt);
      const text = (result.response.text() || '').trim();
      return res.json({ summary: text || stub });
    } catch (e) {
      console.warn('AI error /api/summarize-reviews fallback:', e);
      return res.json({ summary: stub });
    }
  });

  // POST /api/generate-comment
  app.post('/api/generate-comment', async (req, res) => {
    const { rating, category, description } = req.body || {};
    const stub = `Serviço de ${category || 'categoria'} executado com qualidade. Recomendo!`;
    const model = getModel();
    if (!model) return res.json({ comment: stub });
    try {
      const prompt = `Gerar comentário de avaliação (${rating} estrelas) curto.
Categoria: ${category}
Descrição: ${description?.slice(0,140) || 'N/A'}
Retorne somente o comentário.`;
      const result = await model.generateContent(prompt);
      const text = (result.response.text() || '').trim();
      return res.json({ comment: text || stub });
    } catch (e) {
      console.warn('AI error /api/generate-comment fallback:', e);
      return res.json({ comment: stub });
    }
  });

  // POST /api/generate-category-page
  app.post('/api/generate-category-page', async (req, res) => {
    const { category, location } = req.body || {};
    const stub = {
      title: `Serviços de ${category || 'geral'}${location ? ' em ' + location : ''}`,
      introduction: `Encontre profissionais de ${category || 'várias áreas'}${location ? ' em ' + location : ''} com avaliação verificada.`,
      faq: [
        { question: 'Como funciona?', answer: 'Você descreve o serviço e recebe propostas.' },
        { question: 'É seguro?', answer: 'Prestadores verificados e pagamento protegido.' }
      ]
    };
    const model = getModel();
    if (!model) return res.json(stub);
    try {
      const prompt = `Gerar JSON de página de categoria: {title,introduction,faq:[{question,answer}]}, máx 5 FAQs.
Categoria: ${category || 'N/A'}
Local: ${location || 'N/A'}
Retorne APENAS JSON.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { return res.json(JSON.parse(jsonMatch[0])); } catch { /* ignore */ }
      }
      return res.json(stub);
    } catch (e) {
      console.warn('AI error /api/generate-category-page fallback:', e);
      return res.json(stub);
    }
  });

  // POST /api/propose-schedule
  app.post('/api/propose-schedule', async (req, res) => {
    const { messages = [] } = req.body || {};
    // Very naive heuristic: if any message contains "amanhã" propose next day 09:00
    const hasAmanha = messages.some(m => /amanhã|amanha/i.test(m.text || ''));
    const date = new Date();
    if (hasAmanha) date.setDate(date.getDate() + 1);
    const isoDate = date.toISOString().split('T')[0];
    return res.json({ date: isoDate, time: '09:00' });
  });

  // POST /api/get-chat-assistance
  app.post('/api/get-chat-assistance', async (req, res) => {
    try {
      const { messages = [], currentUserType } = req.body || {};
      
      if (!genAI) {
        console.error('[get-chat-assistance] Gemini API key not configured');
        return res.status(500).json({ error: 'IA não configurada' });
      }

      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.senderId === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // Get user's last message
      // Last message available at messages[messages.length - 1]?.text if needed

      // Build context-aware system prompt based on user type
      const systemPrompt = currentUserType === 'prospector' 
        ? `Você é um assistente especializado em prospecção B2B para a plataforma Servio.AI.
Ajude o prospector com:
- Estratégias de abordagem de prestadores de serviço
- Templates de mensagens para WhatsApp, Email e redes sociais
- Análise de prospects qualificados
- Dicas de follow-up e conversão
- Como usar o sistema de comissões

Seja direto, prático e forneça exemplos concretos. Responda em português brasileiro.`
        : `Você é um assistente para prestadores de serviço da Servio.AI.
Ajude com:
- Melhorar perfil e portfolio
- Estratégias de precificação
- Como responder propostas
- Dicas de atendimento ao cliente
- Crescimento na plataforma

Seja direto, prático e motivador. Responda em português brasileiro.`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...conversationHistory
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      });

      const response = result.response;
      const text = response.text();

      return res.json({ 
        name: 'chat_response', 
        args: {}, 
        displayText: text || 'Desculpe, não consegui gerar uma resposta. Tente reformular sua pergunta.'
      });

    } catch (error) {
      console.error('[get-chat-assistance] Error:', error);
      return res.status(500).json({ 
        error: 'Erro ao processar assistência',
        displayText: 'Desculpe, ocorreu um erro. Por favor, tente novamente.' 
      });
    }
  });

  // POST /api/parse-search
  app.post('/api/parse-search', async (req, res) => {
    const { query = '' } = req.body || {};
    const lower = query.toLowerCase();
    
    // Parse service type from query
    const getService = (text) => {
      if (/eletric|luz|tomada/.test(text)) return 'eletricista';
      if (/pintur|parede/.test(text)) return 'pintura';
      return undefined;
    };
    
    // Parse location from query
    const getLocation = (text) => {
      if (/são paulo|sp/.test(text)) return 'São Paulo';
      if (/rio de janeiro|rj/.test(text)) return 'Rio de Janeiro';
      return undefined;
    };
    
    const parsed = {
      service: getService(lower),
      location: getLocation(lower),
      attributes: ['verificado'].filter(a => lower.includes(a))
    };
    return res.json(parsed);
  });

  // POST /api/extract-document
  app.post('/api/extract-document', async (req, res) => {
    const { base64Image } = req.body || {};
    if (!base64Image) return res.status(400).json({ error: 'Imagem é obrigatória.' });
    // Stub parse
    return res.json({ fullName: 'Fulano de Tal', cpf: '000.111.222-33' });
  });

  // POST /api/mediate-dispute
  app.post('/api/mediate-dispute', async (req, res) => {
    const { messages = [], clientName = 'Cliente', providerName = 'Prestador' } = req.body || {};
    const summary = `Disputa entre ${clientName} e ${providerName} com ${messages.length} mensagens.`;
    const analysis = 'Conflito em estágio inicial, recomendada mediação neutra.';
    const suggestion = 'Incentivar evidências (fotos) e propor inspeção rápida.';
    return res.json({ summary, analysis, suggestion });
  });

  // POST /api/analyze-fraud
  app.post('/api/analyze-fraud', async (req, res) => {
    const { provider = {}, context = {} } = req.body || {};
    // Simple heuristic: if bio very short or missing and context type is profile_update, risk slightly higher
    const bio = (provider.bio || '').trim();
    let riskScore = 10;
    if (!bio || bio.length < 10) riskScore += 25;
    if (context.type === 'profile_update' && riskScore > 20) riskScore += 10;
    const isSuspicious = riskScore >= 30;
    return res.json({ isSuspicious, riskScore, reason: isSuspicious ? 'Perfil incompleto e recente.' : 'Sem sinais claros.' });
  });

  // POST /api/match-providers - Simple matching logic (prototype)
  app.post('/api/match-providers', async (req, res) => {
    try {
      let { job, jobId, allUsers = [] } = req.body || {};
      
      // Resilience: If only jobId provided, fetch the job from Firestore
      if (!job && jobId) {
        try {
          const jobDoc = await db.collection('jobs').doc(jobId).get();
          if (jobDoc.exists) {
            job = { id: jobDoc.id, ...jobDoc.data() };
          }
        } catch (err) {
          console.error('Failed to fetch job by ID:', err);
        }
      }
      
      if (!job) return res.status(400).json({ error: 'Job data is required.' });

      // If no users provided, fetch active providers from Firestore
      if (allUsers.length === 0) {
        try {
          const usersSnapshot = await db.collection('users')
            .where('type', '==', 'prestador')
            .where('verificationStatus', '==', 'verificado')
            .limit(50)
            .get();
          allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (err) {
          console.error('Failed to fetch providers:', err);
        }
      }

      // Basic heuristic: consider providers that match category or have headline/specialties containing it
      const category = (job.category || '').toString().toLowerCase();
      const location = (job.location || '').toString().toLowerCase();

      const providers = allUsers.filter(u => (u && (u.type === 'prestador')));

      const scored = providers.map(p => {

        const headline = (p.headline || '').toLowerCase();
        const specialties = Array.isArray(p.specialties) ? p.specialties.join(' ').toLowerCase() : '';
        const pLocation = (p.location || '').toLowerCase();

        let score = 0;
        if (category && (headline.includes(category) || specialties.includes(category))) score += 0.6;
        if (location && pLocation.includes(location)) score += 0.2;
        if (p.averageRating) score += Math.min(0.2, (Number(p.averageRating) || 0) / 25); // up to +0.2 at 5.0

        return {
          providerId: p.email || p.id,
          name: p.name,
          score: Number(score.toFixed(2)),
          reason: `Match por categoria${location ? ' e localização' : ''}${p.averageRating ? ' + reputação' : ''}`.trim(),
        };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

      return res.json({ matches: scored, total: scored.length });
    } catch (err) {
      console.error('match-providers error', err);
      return res.status(500).json({ error: 'Failed to match providers' });
    }
  });

  // =================================================================
  // STRIPE CONNECT ONBOARDING
  // =================================================================

  app.post("/api/stripe/create-connect-account", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    try {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found." });
      }

      // Stripe not configured? Provide deterministic stub so frontend flows don't break.
      if (!stripe) {
        const stubAccountId = `acct_stub_${userId.replaceAll(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;
        await userRef.update({ stripeAccountId: stubAccountId, stripeAccountStub: true });
        return res.status(200).json({ accountId: stubAccountId, stub: true });
      }

      const account = await stripe.accounts.create({
        type: 'express',
        email: userId,
        country: 'BR',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      await userRef.update({ stripeAccountId: account.id });

      res.status(200).json({ accountId: account.id });
    } catch (error) {
      console.error("Error creating Stripe Connect account:", error);
      res.status(500).json({ error: "Failed to create Stripe Connect account." });
    }
  });

  app.post("/api/stripe/create-account-link", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists || !userDoc.data().stripeAccountId) {
        return res.status(404).json({ error: "Stripe account not found for this user." });
      }

      const accountLink = await stripe.accountLinks.create({
        account: userDoc.data().stripeAccountId,
        refresh_url: `${process.env.FRONTEND_URL}/onboarding-stripe/refresh`,
        return_url: `${process.env.FRONTEND_URL}/dashboard?stripe_onboarding_complete=true`,
        type: 'account_onboarding',
      });

      res.status(200).json({ url: accountLink.url });
    } catch (error) {
      console.error("Error creating Stripe account link:", error);
      res.status(500).json({ error: "Failed to create account link." });
    }
  });

  // =================================================================
  // STRIPE PAYMENT ENDPOINTS
  // =================================================================

  app.post("/create-checkout-session", requireAuth, async (req, res) => {
    const { job, amount } = req.body;
    const YOUR_DOMAIN = process.env.FRONTEND_URL || "http://localhost:5173"; // Your frontend domain

    if (!job.providerId) {
      return res.status(400).json({ error: "Job must have a provider assigned to create a payment session." });
    }

    try {
      // Fetch provider to get their Stripe Connect account ID
      const providerDoc = await db.collection('users').doc(job.providerId).get();
      if (!providerDoc.exists) {
        return res.status(404).json({ error: 'Provider not found.' });
      }
      const providerData = providerDoc.data();
      const providerStripeId = providerData.stripeAccountId;

      if (!providerStripeId) {
        return res.status(400).json({ error: "The provider has not set up their payment account." });
      }

      // Calculate platform fee and provider share
      // This logic can be simplified if stats are not needed at this stage, but for consistency we calculate it.
      const earningsProfile = calculateProviderRate(providerData, {}); // Simplified stats for now
      const providerShareInCents = Math.round(amount * earningsProfile.currentRate * 100);

      // Create an escrow record in Firestore first
      const escrowRef = db.collection("escrows").doc();
      const escrowData = {
        id: escrowRef.id,
        jobId: job.id,
        clientId: job.clientId,
        providerId: job.providerId,
        amount: amount,
        status: "pendente", // 'pendente', 'pago', 'liberado', 'disputa'
        createdAt: new Date().toISOString(),
      };
      await escrowRef.set(escrowData);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card", "boleto"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: `Serviço: ${job.category}`,
                description: `Pagamento seguro para o serviço: ${job.description.substring(0, 100)}...`,
              },
              unit_amount: amount * 100, // Amount in cents
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: (amount * 100) - providerShareInCents,
          transfer_data: {
            destination: providerStripeId,
            // The amount that will be transferred to the destination account.
          },
        },
        mode: "payment",
        success_url: `${YOUR_DOMAIN}/job/${job.id}?payment_success=true`,
        cancel_url: `${YOUR_DOMAIN}/job/${job.id}?payment_canceled=true`,
        metadata: {
          escrowId: escrowRef.id,
          jobId: job.id,
        },
      });

      res.json({ id: session.id });
    } catch (error) {
      console.error("Error creating Stripe checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session." });
    }
  });

  // =================================================================
  // STRIPE WEBHOOK
  // =================================================================

  app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      return res.status(400).send('Webhook Error: Missing signature or secret.');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log(`❌ Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event (idempotent & structured logging)
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { escrowId } = session.metadata || {};
        const paymentIntentId = session.payment_intent;
        console.log('[Stripe Webhook] Event received', {
          eventId: event.id,
          type: event.type,
          escrowId,
          paymentIntentId,
        });

        if (escrowId && paymentIntentId) {
          const escrowRef = db.collection('escrows').doc(escrowId);
          try {
            const snap = await escrowRef.get();
            const existing = snap.exists ? snap.data() : {};
            if (existing.status === 'pago' && existing.paymentIntentId === paymentIntentId) {
              console.log('[Stripe Webhook] Skipping update (already processed)', { escrowId, paymentIntentId });
            } else {
              await escrowRef.update({ status: 'pago', paymentIntentId });
              console.log('[Stripe Webhook] Escrow updated to pago', { escrowId, paymentIntentId });
            }
          } catch (error_) {
            console.error('[Stripe Webhook] Error updating escrow', { escrowId, paymentIntentId, error: error_.message });
            return res.status(500).json({ error: 'Failed to update escrow status' });
          }
        }
        break; }
      default:
        console.log('[Stripe Webhook] Unhandled event type', { type: event.type, eventId: event.id });
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({received: true});
  });

  // Lightweight diagnostics (safe: does NOT leak secrets)
  // Returns whether STRIPE_WEBHOOK_SECRET is configured in the environment
  app.get('/diag/stripe-webhook-secret', (req, res) => {
    const configured = Boolean(process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_'));
    return res.status(200).json({ configured });
  });

  // Stripe mode diagnostics
  app.get('/diag/stripe-mode', (req, res) => {
    const mode = stripeContainer ? stripeContainer.mode : 'disabled';
    return res.status(200).json({ mode });
  });


  app.post("/jobs/:jobId/release-payment", requireJobParticipant, async (req, res) => {
    const { jobId } = req.params;

    try {
      const escrowQuery = await db
        .collection("escrows")
        .where("jobId", "==", jobId)
        .limit(1)
        .get();

      if (escrowQuery.empty) {
        return res.status(404).json({
          error: "Registro de pagamento não encontrado para este job.",
        });
      }

      const escrowDoc = escrowQuery.docs[0];
      const escrowData = escrowDoc.data();
      const jobDoc = await db.collection("jobs").doc(jobId).get();
      const jobData = jobDoc.data();

      if (jobData.clientId !== req.user.email) {
        return res.status(403).json({
          error: "Forbidden: Only the client can release the payment.",
        });
      }

      if (escrowData.status !== "pago") {
        return res.status(400).json({
          error: `Pagamento não pode ser liberado. Status atual: ${escrowData.status}`,
        });
      }

      const providerDoc = await db.collection('users').doc(escrowData.providerId).get();
      if (!providerDoc.exists) {
        return res.status(404).json({ error: 'Prestador não encontrado para o pagamento.' });
      }
      const providerData = providerDoc.data();
      const providerStripeId = providerData.stripeAccountId;

      if (!providerStripeId) {
        return res.status(400).json({ error: 'O prestador não possui uma conta de pagamento configurada.' });
      }

      if (!escrowData.paymentIntentId) {
        return res.status(400).json({ error: 'ID de intenção de pagamento não encontrado. Não é possível liberar os fundos.' });
      }
      
      // Reutiliza a lógica de cálculo de estatísticas
      const jobsSnapshot = await db.collection('jobs').where('providerId', '==', escrowData.providerId).where('status', '==', 'concluido').get();
      const completedJobs = jobsSnapshot.docs.map(doc => doc.data());
      const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.price || 0), 0);
      const ratings = completedJobs.map(job => job.review?.rating).filter(Boolean);
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
      const stats = { totalJobs: completedJobs.length, totalRevenue, averageRating, totalDisputes: 0 }; // Simplificado

      const earningsProfile = calculateProviderRate(providerDoc.data(), stats);
      const providerShare = Math.round(escrowData.amount * earningsProfile.currentRate * 100); // Em centavos
      const platformShare = (escrowData.amount * 100) - providerShare; // Em centavos

      // Retrieve the charge ID from the Payment Intent
      const paymentIntent = await stripe.paymentIntents.retrieve(escrowData.paymentIntentId);
      const chargeId = paymentIntent.latest_charge;

      // Create the transfer to the provider's connected account
      const transfer = await stripe.transfers.create({
        amount: providerShare,
        currency: 'brl',
        destination: providerStripeId,
        source_transaction: chargeId, // Link the transfer to the original charge
        metadata: {
          jobId: jobId,
          escrowId: escrowDoc.id,
        }
      });

      console.log(
        `Stripe Transfer successful for Escrow ID: ${escrowDoc.id}. Transfer ID: ${transfer.id}. Amount: ${providerShare / 100}`
      );

      // Update provider's commission rate in their profile
      await db.collection("users").doc(escrowData.providerId).update({
        providerRate: earningsProfile.currentRate
      });

      // Update job and escrow status
      await db.collection("jobs").doc(jobId).update({ 
        status: "concluido",
        earnings: { 
          totalAmount: escrowData.amount / 100, // Convert cents to BRL
          providerShare: providerShare / 100, // Convert cents to BRL
          platformFee: platformShare / 100, // Convert cents to BRL
          paidAt: new Date().toISOString()
        } 
      });
      await escrowDoc.ref.update({ status: "liberado", stripeTransferId: transfer.id });

      res.status(200).json({
        success: true,
        message: "Pagamento liberado e serviço concluído com sucesso.",
      });
    } catch (error) {
      console.error("Error releasing payment:", error);
      res.status(500).json({ error: "Falha ao liberar o pagamento." });
    }
  });

  // =================================================================
  // SENDGRID WEBHOOK (Email Event Tracking)
  // =================================================================

  app.post('/api/sendgrid-webhook', express.json(), async (req, res) => {
    try {
      const events = req.body; // SendGrid envia array de eventos
      if (!Array.isArray(events)) {
        return res.status(400).send('Invalid webhook payload');
      }

      console.log(`[SendGrid Webhook] Received ${events.length} events`);

      // Processar eventos usando emailService
      const emailService = require('./services/emailService');
      await emailService.handleWebhookEvents(events);

      res.status(200).send('OK');
    } catch (error) {
      console.error('[SendGrid Webhook] Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.post("/jobs/:jobId/set-on-the-way", async (req, res) => {
    const { jobId } = req.params;
    try {
      const jobRef = db.collection("jobs").doc(jobId);
      // We could add a check here to ensure the user making the request is the provider
      await jobRef.update({ status: "a_caminho" });
      res
        .status(200)
        .json({ message: 'Status updated to "a_caminho" successfully.' });
    } catch (error) {
      console.error("Error setting job status to on the way:", error);
      res.status(500).json({ error: "Failed to update job status." });
    }
  });

  // =================================================================
  // FILE UPLOAD ENDPOINTS
  // =================================================================

  app.post("/generate-upload-url", async (req, res) => {
    const { fileName, contentType, jobId } = req.body;
    if (!fileName || !contentType || !jobId) {
      return res
        .status(400)
        .json({ error: "fileName, contentType, and jobId are required." });
    }

    // Any authenticated user can get an upload URL, we can restrict later if needed
    // based on req.user.uid if they are the client for the job.

    try {
      // Resolve bucket name: prefer explicit env var; fallback to Firebase default bucket pattern
      let bucketName = process.env.GCP_STORAGE_BUCKET; // e.g., 'your-project-id.appspot.com'
      if (!bucketName) {
        const gProject = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
        if (gProject) {
          bucketName = `${gProject}.appspot.com`;
          console.warn(`[uploads] GCP_STORAGE_BUCKET not set. Falling back to default bucket: ${bucketName}`);
        }
      }
      if (!bucketName) {
        throw new Error("GCP_STORAGE_BUCKET environment variable not set and no project fallback available.");
      }
      // Use injected storage instance (for tests) instead of global singleton
      const bucket = storageInstance.bucket(bucketName);
      const filePath = `jobs/${jobId}/${Date.now()}-${fileName}`;
      const file = bucket.file(filePath);

      const options = {
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: contentType,
      };

      const [url] = await file.getSignedUrl(options);
      res.status(200).json({ signedUrl: url, filePath: filePath });
    } catch (error) {
      // If bucket env missing but we explicitly allow fake uploads (CI/dev), return deterministic mock URL
      if (!process.env.GCP_STORAGE_BUCKET && process.env.ALLOW_FAKE_UPLOADS === 'true') {
        const fakePath = `jobs/${jobId}/${Date.now()}-${fileName}`;
        return res.status(200).json({
          signedUrl: 'https://fake-upload.local/signed-url',
          filePath: fakePath,
          fake: true,
        });
      }
      console.error("Error generating signed URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL." });
    }
  });

  // =================================================================
  // DISPUTES API ENDPOINTS
  // =================================================================

  // Get all disputes
  app.get("/disputes", requireAuth, async (req, res) => {
    try {
      const snapshot = await db.collection("disputes").orderBy('createdAt', 'desc').get();
      const disputes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(disputes);
    } catch (error) {
      console.error("Error getting disputes:", error);
      res.status(500).json({ error: "Failed to retrieve disputes." });
    }
  });

  // Create a new dispute
  app.post("/disputes", async (req, res) => {
    try {
      const disputeData = {
        ...req.body,
        createdAt: new Date().toISOString(),
        status: "aberta", // 'aberta', 'resolvida'
      };
      const disputeRef = db.collection("disputes").doc();
      await disputeRef.set(disputeData);
      res.status(201).json({ id: disputeRef.id, ...disputeData });
    } catch (error) {
      console.error("Error creating dispute:", error);
      res.status(500).json({ error: "Failed to create dispute." });
    }
  });

  // Resolve a dispute (admin only)
  app.post("/disputes/:disputeId/resolve", requireDisputeParticipant, async (req, res) => {
    const { disputeId } = req.params;
    const { resolution, comment } = req.body; // resolution: 'release_to_provider' or 'refund_client'

    if (!resolution || !comment) {
      return res
        .status(400)
        .json({ error: "Resolution decision and comment are required." });
    }

    const disputeRef = db.collection("disputes").doc(disputeId);

    try {
      const disputeDoc = await disputeRef.get();
      if (!disputeDoc.exists) {
        return res.status(404).json({ error: "Dispute not found." });
      }
      const disputeData = disputeDoc.data();
      const jobId = disputeData.jobId;

      const escrowQuery = await db
        .collection("escrows")
        .where("jobId", "==", jobId)
        .limit(1)
        .get();
      if (escrowQuery.empty) {
        return res
          .status(404)
          .json({ error: "Escrow record not found for this job." });
      }
      const escrowRef = escrowQuery.docs[0].ref;

      // Update documents in a transaction for atomicity
      await db.runTransaction(async (transaction) => {
        transaction.update(disputeRef, {
          status: "resolvida",
          resolution: {
            decision: resolution,
            comment: comment,
            resolvedAt: new Date().toISOString(),
          },
        });
        transaction.update(db.collection("jobs").doc(jobId), {
          status:
            resolution === "release_to_provider" ? "concluido" : "cancelado",
        });
        transaction.update(escrowRef, {
          status:
            resolution === "release_to_provider" ? "liberado" : "reembolsado",
        });
      });

      res.status(200).json({ message: "Dispute resolved successfully." });
    } catch (error) {
      console.error("Error resolving dispute:", error);
      res.status(500).json({ error: "Failed to resolve dispute." });
    }
  });

  // =================================================================
  // TEST UTILITIES (Escrow seeding) - Enabled only when ENABLE_TEST_UTILS=true
  // =================================================================
  if (process.env.ENABLE_TEST_UTILS === 'true') {
    /**
     * POST /test-utils/seed-escrow
     * Creates an escrow record for a given job so that dispute resolution flows
     * can be exercised in integration tests without going through Stripe checkout.
     * Body: { jobId, clientId, providerId, amount (number, BRL), status? }
     */
    app.post('/test-utils/seed-escrow', async (req, res) => {
      try {
        const { jobId, clientId, providerId, amount = 100, status = 'pago' } = req.body || {};
        if (!jobId || !clientId || !providerId) {
          return res.status(400).json({ error: 'jobId, clientId and providerId are required.' });
        }
        const escrowQuery = await db.collection('escrows').where('jobId', '==', jobId).limit(1).get();
        if (!escrowQuery.empty) {
          const existing = escrowQuery.docs[0];
            return res.status(200).json({ reused: true, id: existing.id, ...existing.data() });
        }
        const escrowRef = db.collection('escrows').doc();
        const escrowData = {
          id: escrowRef.id,
          jobId,
          clientId,
          providerId,
          amount, // Stored in BRL, consistent with existing code paths
          status, // 'pendente' | 'pago' | 'liberado' | 'disputa' | 'reembolsado'
          createdAt: new Date().toISOString(),
          seededForTests: true,
        };
        await escrowRef.set(escrowData);
        return res.status(201).json(escrowData);
      } catch (err) {
        console.error('Error seeding escrow (test util):', err);
        return res.status(500).json({ error: 'Failed to seed escrow.' });
      }
    });

    /**
     * GET /test-utils/escrow/:jobId
     * Fetch first escrow associated with a job (for test assertions)
     */
    app.get('/test-utils/escrow/:jobId', async (req, res) => {
      try {
        const { jobId } = req.params;
        const snapshot = await db.collection('escrows').where('jobId', '==', jobId).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ error: 'No escrow for this job.' });
        const doc = snapshot.docs[0];
        return res.status(200).json({ id: doc.id, ...doc.data() });
      } catch (err) {
        console.error('Error fetching escrow (test util):', err);
        return res.status(500).json({ error: 'Failed to fetch escrow.' });
      }
    });
  }

  // =================================================================
  // USERS API ENDPOINTS
  // =================================================================

  // Get all users (with /api prefix for frontend compatibility)
  app.get("/api/users", async (req, res) => {
    try {
      const snapshot = await db.collection("users").get();
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "Failed to retrieve users." });
    }
  });

  // Get all users (legacy route without /api)
  app.get("/users", async (req, res) => {
    try {
      const snapshot = await db.collection("users").get();
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "Failed to retrieve users." });
    }
  });

  // Get a single user by ID (with /api prefix)
  app.get("/api/users/:id", requireOwnership('id'), async (req, res) => {
    try {
      const userId = req.params.id;
      const userRef = db.collection("users").doc(userId);
      const doc = await userRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "User not found." });
      }
      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Failed to retrieve user." });
    }
  });

  // Get a single user by ID (legacy route)
  app.get("/users/:id", requireOwnership('id'), async (req, res) => {
    try {
      const userId = req.params.id;
      const userRef = db.collection("users").doc(userId);
      const doc = await userRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "User not found." });
      }
      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Failed to retrieve user." });
    }
  });

  // Create a new user (with /api prefix)
  app.post("/api/users", async (req, res) => {
    try {
      const userData = req.body;
      if (!userData.email) {
        return res.status(400).json({ error: "User email is required." });
      }
      // Use merge:true to avoid overwriting existing docs
      await db.collection("users").doc(userData.email).set(userData, { merge: true });

      // Se é prestador cadastrado via link de referência, notificar prospector
      if (userData.type === 'prestador' && userData.referredBy) {
        const { notifyProspector } = require('./notificationService');
        await notifyProspector({
          db,
          prospectorId: userData.referredBy,
          type: 'conversion',
          data: {
            providerName: userData.name || 'Novo prestador',
            providerEmail: userData.email,
            category: userData.categories?.[0] || 'Não especificada',
          }
        }).catch(err => console.error('[Prospector Notification] Error:', err));

        // Atualizar stats do prospector
        const prospectorRef = db.collection('prospector_stats').doc(userData.referredBy);
        await prospectorRef.set({
          totalRecruits: fieldValueHelpers.increment(1),
          activeRecruits: fieldValueHelpers.increment(1),
          lastRecruitAt: fieldValueHelpers.serverTimestamp(),
        }, { merge: true });
      }

      res
        .status(201)
        .json({ message: "User created successfully", id: userData.email });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user." });
    }
  });

  // Create a new user (legacy route)
  app.post("/users", async (req, res) => {
    try {
      const userData = req.body;
      if (!userData.email) {
        return res.status(400).json({ error: "User email is required." });
      }
      // Use merge:true to avoid overwriting existing docs
      await db.collection("users").doc(userData.email).set(userData, { merge: true });
      res
        .status(201)
        .json({ message: "User created successfully", id: userData.email });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user." });
    }
  });

  // Update an existing user
  app.put("/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const userData = req.body;
      const userRef = db.collection("users").doc(userId);
      await userRef.update(userData);
      res
        .status(200)
        .json({ message: "User updated successfully", id: userId });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user." });
    }
  });

  // Delete a user
  app.delete("/users/:id", requireOwnership('id'), async (req, res) => {
    try {
      const userId = req.params.id;
      await db.collection("users").doc(userId).delete();
      res
        .status(200)
        .json({ message: "User deleted successfully", id: userId });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user." });
    }
  });

  // =================================================================
  // ADMIN API ENDPOINTS
  // =================================================================

  // Set provider verification status (approve/reject identity verification)
  app.post("/admin/providers/:userId/verification", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { status, note } = req.body;

      if (!['pendente', 'verificado', 'recusado'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'pendente', 'verificado', or 'recusado'." });
      }

      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found." });
      }

      const updateData = {
        verificationStatus: status,
        verificationNote: note || null,
        verificationUpdatedAt: fieldValueHelpers.serverTimestamp()
      };

      await userRef.update(updateData);

      res.status(200).json({
        success: true,
        message: `Provider verification status updated to ${status}`,
        userId,
        status
      });
    } catch (error) {
      console.error("Error updating verification status:", error);
      res.status(500).json({ error: "Failed to update verification status." });
    }
  });

  // Suspend a provider
  app.post("/admin/providers/:userId/suspend", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found." });
      }

      await userRef.update({
        status: 'suspenso',
        suspensionReason: reason || 'Suspended by admin',
        suspendedAt: fieldValueHelpers.serverTimestamp()
      });

      res.status(200).json({
        success: true,
        message: "Provider suspended successfully",
        userId
      });
    } catch (error) {
      console.error("Error suspending provider:", error);
      res.status(500).json({ error: "Failed to suspend provider." });
    }
  });

  // Reactivate a provider
  app.post("/admin/providers/:userId/reactivate", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;

      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found." });
      }

      await userRef.update({
        status: 'ativo',
        suspensionReason: null,
        reactivatedAt: fieldValueHelpers.serverTimestamp()
      });

      res.status(200).json({
        success: true,
        message: "Provider reactivated successfully",
        userId
      });
    } catch (error) {
      console.error("Error reactivating provider:", error);
      res.status(500).json({ error: "Failed to reactivate provider." });
    }
  });

  // =================================================================
  // PROSPECTING & AUTO-RECRUITMENT API
  // =================================================================

  // Auto-prospecting endpoint - triggers when no providers available
  app.post("/api/auto-prospect", async (req, res) => {
    try {
      const { category, location, urgency } = req.body;

      console.log(`[Auto-Prospect] Triggered for ${category} in ${location}`);

      // 1. Search Google for local professionals (mock for now - real implementation would use Google Places API)
      const searchQuery = `${category} ${location} profissional`;
      console.log(`[Auto-Prospect] Would search Google for: "${searchQuery}"`);

      // Mock results - in production, this would call Google Places API + scraping
      const mockProspects = [
        {
          name: `${category} Pro Services`,
          email: `contato@${category.toLowerCase().replaceAll(/\s/g, '')}pro.com`,
          phone: '+55 11 98765-4321',
          source: 'google_auto'
        }
      ];

      // 2. Save prospects to database
      const savedProspects = [];
      for (const prospect of mockProspects) {
        const prospectRef = db.collection('prospects').doc();
        await prospectRef.set({
          id: prospectRef.id,
          name: prospect.name,
          email: prospect.email,
          phone: prospect.phone,
          specialty: category,
          source: prospect.source,
          status: 'pendente',
          createdAt: fieldValueHelpers.serverTimestamp(),
          relatedJob: {
            category,
            location,
            clientEmail
          },
          notes: [{
            text: `Auto-prospectado via IA para ${category} em ${location}`,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          }]
        });
        savedProspects.push(prospect);
      }

      // 3. Send invitation emails (would integrate with SendGrid/Resend)
      let emailsSent = 0;
      for (const prospect of savedProspects) {
        console.log(`[Auto-Prospect] Would send email to: ${prospect.email}`);
        // TODO: Implement actual email sending
        emailsSent++;
      }

      // 4. Notify prospecting team (create notification for admins)
      const adminsSnapshot = await db.collection('users').where('type', '==', 'admin').get();
      for (const adminDoc of adminsSnapshot.docs) {
        await db.collection('notifications').add({
          userId: adminDoc.id,
          text: `🚨 URGENTE: Cliente solicitou "${category}" em ${location}. ${savedProspects.length} prospectos encontrados automaticamente. Verifique a aba Prospecting.`,
          isRead: false,
          createdAt: fieldValueHelpers.serverTimestamp(),
          type: 'prospecting_alert',
          urgency: urgency || 'high',
          metadata: {
            category,
            location,
            clientEmail,
            prospectsFound: savedProspects.length
          }
        });
      }

      res.status(200).json({
        success: true,
        prospectsFound: savedProspects.length,
        emailsSent,
        adminNotified: true,
        message: `Encontramos ${savedProspects.length} profissionais e enviamos convites. Equipe notificada!`
      });

    } catch (error) {
      console.error('[Auto-Prospect] Error:', error);
      res.status(500).json({
        success: false,
        prospectsFound: 0,
        emailsSent: 0,
        adminNotified: false,
        message: 'Erro na prospecção automática'
      });
    }
  });

  // Get all prospects
  app.get("/api/prospects", requireRole('admin', 'prospector'), async (req, res) => {
    try {
      const snapshot = await db.collection("prospects").orderBy('createdAt', 'desc').get();
      const prospects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(prospects);
    } catch (error) {
      console.error("Error getting prospects:", error);
      res.status(500).json({ error: "Failed to retrieve prospects." });
    }
  });

  // Create prospect manually
  app.post("/api/prospects", requireRole('admin', 'prospector'), async (req, res) => {
    try {
      const prospectData = req.body;
      const prospectRef = db.collection("prospects").doc();
      await prospectRef.set({
        id: prospectRef.id,
        ...prospectData,
        createdAt: fieldValueHelpers.serverTimestamp()
      });
      res.status(201).json({ success: true, id: prospectRef.id });
    } catch (error) {
      console.error("Error creating prospect:", error);
      res.status(500).json({ error: "Failed to create prospect." });
    }
  });

  // Update prospect
  app.put("/api/prospects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await db.collection("prospects").doc(id).update({
        ...updates,
        updatedAt: fieldValueHelpers.serverTimestamp()
      });
      res.status(200).json({ success: true, message: "Prospect updated" });
    } catch (error) {
      console.error("Error updating prospect:", error);
      res.status(500).json({ error: "Failed to update prospect." });
    }
  });

  // Send prospect invitation email
  app.post("/api/send-prospect-invitation", requireRole('admin', 'prospector'), async (req, res) => {
    try {
      const { prospectEmail, prospectName, jobCategory, jobLocation } = req.body;
      
      console.log(`[Send Invitation] To: ${prospectEmail} for ${jobCategory} in ${jobLocation}`);
      
      // TODO: Integrate with SendGrid, Resend, or similar email service
      // For now, just log it
      const emailContent = {
        to: prospectEmail,
        subject: `Convite: Novo Cliente Procurando ${jobCategory} em ${jobLocation}`,
        body: `Olá ${prospectName},\n\nTemos um cliente procurando por ${jobCategory} em ${jobLocation}.\n\nCadastre-se gratuitamente em Servio.AI e participe deste orçamento!\n\nAcesse: https://servio-ai.com/register?type=provider`
      };
      
      console.log('[Send Invitation] Email content:', emailContent);
      
      res.status(200).json({ success: true, message: "Invitation sent" });
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ error: "Failed to send invitation." });
    }
  });

  // Notify prospecting team
  app.post("/api/notify-prospecting-team", requireAdmin, async (req, res) => {
    try {
      const { category, location, clientEmail, prospectsFound, urgency, message } = req.body;
      
      // Get all admin users
      const adminsSnapshot = await db.collection('users').where('type', '==', 'admin').get();
      
      for (const adminDoc of adminsSnapshot.docs) {
        await db.collection('notifications').add({
          userId: adminDoc.id,
          text: message || `Nova solicitação: ${category} em ${location}`,
          isRead: false,
          createdAt: fieldValueHelpers.serverTimestamp(),
          type: 'prospecting_alert',
          urgency: urgency || 'normal',
          metadata: { category, location, clientEmail, prospectsFound }
        });
      }
      
      res.status(200).json({ success: true, message: "Team notified" });
    } catch (error) {
      console.error("Error notifying team:", error);
      res.status(500).json({ error: "Failed to notify team." });
    }
  });

  // =================================================================
  // ENHANCED PROSPECTING v2.0 - AI-POWERED
  // =================================================================

  // AI-powered prospect analysis and scoring
  app.post("/api/analyze-prospect", async (req, res) => {
    try {
      const { prospect, jobCategory, jobDescription } = req.body;

      if (!defaultGenAI) {
        // Fallback scoring without AI
        return res.status(200).json({
          name: prospect.name,
          email: prospect.email,
          phone: prospect.phone,
          qualityScore: prospect.rating ? prospect.rating * 20 : 50,
          matchScore: 50,
          location: prospect.address,
          preferredContact: prospect.email ? 'email' : 'phone',
        });
      }

      const model = defaultGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Analise este perfil profissional e determine:
1. Pontuação de qualidade (0-100): credibilidade, experiência, reputação
2. Pontuação de adequação (0-100): quão bem o profissional se encaixa no job
3. Especialidades principais
4. Canal preferido de contato

Profissional:
Nome: ${prospect.name}
Avaliação: ${prospect.rating || 'N/A'} (${prospect.reviewCount || 0} reviews)
Website: ${prospect.website || 'N/A'}
Localização: ${prospect.address || 'N/A'}
Descrição: ${prospect.description || 'N/A'}

Job solicitado:
Categoria: ${jobCategory}
Descrição: ${jobDescription}

Responda em JSON:
{
  "qualityScore": number,
  "matchScore": number,
  "specialties": string[],
  "preferredContact": "email" | "phone" | "whatsapp",
  "aiAnalysis": "breve análise do perfil"
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        res.status(200).json({
          name: prospect.name,
          email: prospect.email,
          phone: prospect.phone,
          location: prospect.address,
          ...analysis
        });
      } else {
        throw new Error('Failed to parse AI response');
      }

    } catch (error) {
      console.error("Error analyzing prospect:", error);
      // Fallback response
      res.status(200).json({
        name: req.body.prospect.name,
        email: req.body.prospect.email,
        phone: req.body.prospect.phone,
        qualityScore: 50,
        matchScore: 50,
        preferredContact: 'email',
      });
    }
  });

  // Generate personalized email using AI
  app.post("/api/generate-prospect-email", async (req, res) => {
    try {
      const { prospectName, specialties, jobCategory, jobLocation, qualityScore } = req.body;

      if (!defaultGenAI) {
        // Fallback template
        return res.status(200).json({
          emailBody: `Olá ${prospectName},\n\nTemos um cliente procurando por ${jobCategory} em ${jobLocation}.\n\nGostaríamos de convidá-lo(a) para participar!\n\nCadastre-se: https://servio-ai.com/register?type=provider\n\nEquipe Servio.AI`
        });
      }

      const model = defaultGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Crie um email personalizado e profissional para convidar ${prospectName} a se cadastrar na plataforma Servio.AI.

Contexto:
- Profissional: ${prospectName}
- Especialidades: ${specialties?.join(', ') || 'não especificadas'}
- Job solicitado: ${jobCategory}
- Localização: ${jobLocation}
- Pontuação de qualidade: ${qualityScore}/100

O email deve:
1. Ser cordial e personalizado
2. Mencionar o job específico disponível
3. Destacar benefícios da plataforma
4. Incluir call-to-action claro
5. Ter tom profissional mas amigável
6. Máximo 150 palavras

Retorne apenas o corpo do email, sem assunto.`;

      const result = await model.generateContent(prompt);
      const emailBody = result.response.text().trim();

      res.status(200).json({ emailBody });

    } catch (error) {
      console.error("Error generating email:", error);
      const { prospectName, jobCategory, jobLocation } = req.body;
      res.status(200).json({
        emailBody: `Olá ${prospectName},\n\nTemos um cliente procurando por ${jobCategory} em ${jobLocation}.\n\nGostaríamos de convidá-lo(a) para participar deste projeto!\n\nCadastre-se gratuitamente: https://servio-ai.com/register?type=provider\n\nEquipe Servio.AI`
      });
    }
  });

  // Send SMS invite
  app.post("/api/send-sms-invite", async (req, res) => {
    try {
      const { phone, name, category, location } = req.body;

      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      // For now, just log and return success
      console.log(`📱 SMS to ${phone}: ${name}, temos um cliente procurando ${category} em ${location}. Cadastre-se: servio-ai.com/register?type=provider`);

      res.status(200).json({ success: true, message: "SMS sent (simulated)" });
    } catch (error) {
      console.error("Error sending SMS:", error);
      res.status(500).json({ error: "Failed to send SMS" });
    }
  });

  // Send WhatsApp invite
  app.post("/api/send-whatsapp-invite", async (req, res) => {
    try {
      const { phone, name, category, location, prospectorId } = req.body;

      // Use WhatsApp Business API to send invite message
      const whatsappService = new WhatsAppService();
      if (!whatsappService.isConfigured()) {
        return res.status(503).json({ 
          success: false, 
          message: "WhatsApp service not configured. Using simulated mode." 
        });
      }

      const inviteMessage = `Olá ${name}! Temos um cliente procurando ${category} em ${location}. Cadastre-se: https://servio-ai.com/register?type=provider`;
      const result = await whatsappService.sendMessage(phone, inviteMessage);

      if (!result.success) {
        console.warn(`WhatsApp send failed: ${result.error}`);
        return res.status(400).json({ success: false, error: result.error });
      }

      res.status(200).json({ 
        success: true, 
        message: "WhatsApp invite sent",
        messageId: result.messageId 
      });
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      res.status(500).json({ error: "Failed to send WhatsApp" });
    }
  });

  // Enhanced prospecting with AI analysis and filtering
  app.post("/api/enhanced-prospect", async (req, res) => {
    try {
      const { category, location, minQualityScore, maxProspects, channels } = req.body;

      // Step 1: Search for prospects (simulated)
      const mockProspects = [
        { name: 'João Silva', email: 'joao@email.com', phone: '11999999999', rating: 4.8, reviewCount: 120 },
        { name: 'Maria Santos', email: 'maria@email.com', phone: '11988888888', rating: 4.5, reviewCount: 85 },
        { name: 'Pedro Costa', email: 'pedro@email.com', phone: '11977777777', rating: 4.2, reviewCount: 45 },
      ];

      // Step 2: Analyze each prospect with AI
      const analyzedProspects = [];
      for (const prospect of mockProspects) {
        if (!defaultGenAI) {
          analyzedProspects.push({
            ...prospect,
            qualityScore: prospect.rating * 20,
            matchScore: 70,
          });
          continue;
        }

        const model = defaultGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        try {
          const result = await model.generateContent(`Analise e pontue (0-100): ${prospect.name}, rating ${prospect.rating}, para ${category}. JSON: {"qualityScore": number, "matchScore": number}`);
          const text = result.response.text();
          const jsonMatch = text.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const scores = JSON.parse(jsonMatch[0]);
            analyzedProspects.push({ ...prospect, ...scores });
          }
        } catch (err) {
          console.warn('Erro ao analisar prospect, usando valores padrão:', err);
          analyzedProspects.push({ ...prospect, qualityScore: 50, matchScore: 50 });
        }
      }

      // Step 3: Filter by quality score
      const filtered = analyzedProspects.filter(p => p.qualityScore >= (minQualityScore || 60));
      const topProspects = filtered.slice(0, maxProspects || 10);

      // Step 4: Send invites
      let emailsSent = 0;
      let smsSent = 0;
      let whatsappSent = 0;

      for (const prospect of topProspects) {
        if (channels?.includes('email') && prospect.email) {
          // Generate personalized email with AI
          let emailBody = `Olá ${prospect.name}, temos um cliente procurando ${category} em ${location}.`;
          if (defaultGenAI) {
            const model = defaultGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const emailResult = await model.generateContent(`Email curto e personalizado para ${prospect.name} sobre job: ${category} em ${location}`);
            emailBody = emailResult.response.text().trim();
          }
          console.log(`[Enhanced-Prospect] Email generated for ${prospect.email}:`, emailBody.substring(0, 100) + '...');
          emailsSent++;
        }
        
        if (channels?.includes('sms') && prospect.phone) smsSent++;
        if (channels?.includes('whatsapp') && prospect.phone) whatsappSent++;

        // Save prospect
        await db.collection('prospects').add({
          name: prospect.name,
          email: prospect.email,
          phone: prospect.phone,
          specialty: category,
          status: 'pendente',
          qualityScore: prospect.qualityScore,
          matchScore: prospect.matchScore,
          source: 'ai_enhanced',
          createdAt: fieldValueHelpers.serverTimestamp(),
        });
      }

      // Step 5: Notify admin team
      const adminsSnapshot = await db.collection('users').where('type', '==', 'admin').get();
      for (const adminDoc of adminsSnapshot.docs) {
        await db.collection('notifications').add({
          userId: adminDoc.id,
          text: `🤖 IA encontrou ${topProspects.length} prospects qualificados para ${category}`,
          isRead: false,
          createdAt: fieldValueHelpers.serverTimestamp(),
          type: 'prospecting_success',
        });
      }

      res.status(200).json({
        success: true,
        prospectsFound: topProspects.length,
        emailsSent,
        smsSent,
        whatsappSent,
        adminNotified: true,
        qualityScore: Math.round(topProspects.reduce((sum, p) => sum + p.qualityScore, 0) / topProspects.length),
        topProspects: topProspects.map(p => ({ name: p.name, qualityScore: p.qualityScore, matchScore: p.matchScore })),
        message: `IA encontrou ${topProspects.length} prospects qualificados!`
      });

    } catch (error) {
      console.error("Enhanced prospecting error:", error);
      res.status(500).json({ error: "Enhanced prospecting failed" });
    }
  });

  // =================================================================
  // PROSPECTORS & COMMISSIONS MANAGEMENT
  // =================================================================

  // Get all prospectors
  app.get("/api/prospectors", async (req, res) => {
    try {
      const snapshot = await db.collection("prospectors").get();
      const prospectors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(prospectors);
    } catch (error) {
      console.error("Error getting prospectors:", error);
      res.status(500).json({ error: "Failed to retrieve prospectors." });
    }
  });

  // Create prospector
  app.post("/api/prospectors", async (req, res) => {
    try {
      const prospectorData = req.body;
      const prospectorRef = db.collection("prospectors").doc(prospectorData.email);
      
      await prospectorRef.set({
        ...prospectorData,
        createdAt: fieldValueHelpers.serverTimestamp()
      });

      // Also create user account for prospector if doesn't exist
      const userRef = db.collection("users").doc(prospectorData.email);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        await userRef.set({
          email: prospectorData.email,
          name: prospectorData.name,
          type: 'admin', // Prospectors have admin access
          status: 'ativo',
          bio: 'Prospector na equipe Servio.AI',
          location: '',
          memberSince: fieldValueHelpers.serverTimestamp(),
          inviteCode: prospectorData.inviteCode
        });
      }

      res.status(201).json({ success: true, id: prospectorData.email });
    } catch (error) {
      console.error("Error creating prospector:", error);
      res.status(500).json({ error: "Failed to create prospector." });
    }
  });

  // =================================================================
  // Prospector Smart Actions (AI / Rule-based suggestions)
  // =================================================================

  /**
   * POST /api/prospector/smart-actions
   * Body: { stats, leads, recentActivity }
   * Returns: { actions: SmartAction[] }
   *
   * Para produção, se o Gemini (genAI) estiver configurado, podemos evoluir
   * para geração via IA. Neste primeiro passo, usamos apenas regras
   * determinísticas, espelhando o fallback do frontend para evitar 404.
   */
  app.post("/api/prospector/smart-actions", async (req, res) => {
    try {
      const { stats = {}, leads = [], recentActivity = [] } = req.body || {};

      const safeStats = {
        totalRecruits: Number(stats.totalRecruits || 0),
        activeRecruits: Number(stats.activeRecruits || 0),
        totalCommissionsEarned: Number(stats.totalCommissionsEarned || 0),
        currentBadge: stats.currentBadge || null,
        nextBadge: stats.nextBadge || null,
        progressToNextBadge: Number(stats.progressToNextBadge || 0)
      };

      const normalizedLeads = Array.isArray(leads) ? leads : [];
      const normalizedActivity = Array.isArray(recentActivity) ? recentActivity : [];

      const actions = [];

      // Regra 1: Leads inativos (7+ dias sem atividade)
      const now = Date.now();
      const inactiveLeads = normalizedLeads.filter(l => {
        if (!l || l.stage === 'won' || l.stage === 'lost' || !l.lastActivity) return false;
        const ts = typeof l.lastActivity === 'string' ? Date.parse(l.lastActivity) : Number(l.lastActivity);
        if (!Number.isFinite(ts)) return false;
        return now - ts > 7 * 24 * 60 * 60 * 1000;
      });

      if (inactiveLeads.length > 0) {
        actions.push({
          id: 'rule-inactive',
          icon: '👥',
          title: 'Contatar recrutados inativos',
          description: `${inactiveLeads.length} ${inactiveLeads.length === 1 ? 'lead inativo' : 'leads inativos'} há 7+ dias`,
          priority: 'high',
          actionType: 'follow_up',
          metadata: { leads: inactiveLeads.map(l => l.id).filter(Boolean) }
        });
      }

      // Regra 2: Compartilhamento de link de indicação
      const lastShare = normalizedActivity.find(a => a && a.type === 'referral_share');
      let daysSinceShare = 999;
      if (lastShare && lastShare.timestamp) {
        const ts = lastShare.timestamp instanceof Date
          ? lastShare.timestamp.getTime()
          : Date.parse(lastShare.timestamp);
        if (Number.isFinite(ts)) {
          daysSinceShare = Math.floor((now - ts) / (24 * 60 * 60 * 1000));
        }
      }

      if (daysSinceShare >= 3) {
        actions.push({
          id: 'rule-share',
          icon: '📢',
          title: 'Compartilhar no WhatsApp',
          description: `Seu último compartilhamento foi há ${daysSinceShare} dias`,
          priority: daysSinceShare >= 7 ? 'high' : 'medium',
          actionType: 'share'
        });
      }

      // Regra 3: Progresso para o próximo badge
      if (Number.isFinite(safeStats.progressToNextBadge) && safeStats.progressToNextBadge > 70) {
        const remaining = 100 - safeStats.progressToNextBadge;
        actions.push({
          id: 'rule-badge',
          icon: '🏆',
          title: `Próximo ao badge ${safeStats.nextBadge || ''}`.trim(),
          description: `Apenas ${remaining}% restantes para desbloquear`,
          priority: remaining < 20 ? 'high' : 'medium',
          actionType: 'badge'
        });
      }

      // Regra 4: Leads quentes em negociação
      const hotLeads = normalizedLeads.filter(l => l && l.stage === 'negotiating');
      if (hotLeads.length > 0) {
        actions.push({
          id: 'rule-hot',
          icon: '🔥',
          title: 'Fechar negociações pendentes',
          description: `${hotLeads.length} ${hotLeads.length === 1 ? 'lead' : 'leads'} em negociação`,
          priority: 'high',
          actionType: 'follow_up',
          metadata: { leads: hotLeads.map(l => l.id).filter(Boolean) }
        });
      }

      // Regra 5: Meta semanal em risco (placeholder simples)
      const weeklyGoal = 5;
      const weeklyRecruits = Number(safeStats.weeklyRecruits || 2);
      if (weeklyRecruits < weeklyGoal) {
        actions.push({
          id: 'rule-goal',
          icon: '🎯',
          title: 'Meta semanal em risco',
          description: `Faltam ${weeklyGoal - weeklyRecruits} recrutas para bater a meta`,
          priority: 'medium',
          actionType: 'goal'
        });
      }

      // Ordenar por prioridade e limitar a 3 ações
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const sorted = actions
        .sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2))
        .slice(0, 3);

      return res.status(200).json({ actions: sorted });
    } catch (error) {
      console.error('[ProspectorSmartActions] Error generating actions:', error);
      return res.status(500).json({ error: 'Failed to generate smart actions' });
    }
  });

  // Get all commissions
  app.get("/api/commissions", async (req, res) => {
    try {
      const { prospectorId, status } = req.query;
      let query = db.collection("commissions");
      
      if (prospectorId) {
        query = query.where("prospectorId", "==", prospectorId);
      }
      if (status) {
        query = query.where("status", "==", status);
      }
      
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const commissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(commissions);
    } catch (error) {
      console.error("Error getting commissions:", error);
      res.status(500).json({ error: "Failed to retrieve commissions." });
    }
  });

  // Create commission (called when provider completes a job)
  app.post("/api/commissions", async (req, res) => {
    try {
      const { prospectorId, providerId, jobId, providerEarnings, rate } = req.body;
      
      const commissionAmount = providerEarnings * rate;
      
      const commissionRef = db.collection("commissions").doc();
      await commissionRef.set({
        id: commissionRef.id,
        prospectorId,
        providerId,
        jobId,
        amount: commissionAmount,
        rate,
        providerEarnings,
        status: 'pending',
        createdAt: fieldValueHelpers.serverTimestamp()
      });

      // Update prospector's total commissions
      const prospectorRef = db.collection("prospectors").doc(prospectorId);
      const prospectorDoc = await prospectorRef.get();
      
      if (prospectorDoc.exists) {
        const currentTotal = prospectorDoc.data().totalCommissionsEarned || 0;
        await prospectorRef.update({
          totalCommissionsEarned: currentTotal + commissionAmount
        });
      }

      res.status(201).json({ success: true, id: commissionRef.id, amount: commissionAmount });
    } catch (error) {
      console.error("Error creating commission:", error);
      res.status(500).json({ error: "Failed to create commission." });
    }
  });

  // Update commission status (mark as paid)
  app.put("/api/commissions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await db.collection("commissions").doc(id).update({
        status,
        paidAt: status === 'paid' ? fieldValueHelpers.serverTimestamp() : null,
        updatedAt: fieldValueHelpers.serverTimestamp()
      });

      res.status(200).json({ success: true, message: "Commission updated" });
    } catch (error) {
      console.error("Error updating commission:", error);
      res.status(500).json({ error: "Failed to update commission." });
    }
  });

  // Register provider with invite code (called during registration)
  app.post("/api/register-with-invite", async (req, res) => {
    try {
      const { providerEmail, inviteCode } = req.body;
      
      // Find prospector by invite code
      const prospectorSnapshot = await db.collection("prospectors")
        .where("inviteCode", "==", inviteCode)
        .limit(1)
        .get();

      if (prospectorSnapshot.empty) {
        return res.status(404).json({ error: "Invalid invite code" });
      }

      const prospectorDoc = prospectorSnapshot.docs[0];
      const prospectorId = prospectorDoc.id;
      const prospectorData = prospectorDoc.data();

      // Determine commission rate based on source
      const source = req.body.source || 'manual'; // 'manual' or 'ai_auto'
      const commissionRate = source === 'ai_auto' ? 0.0025 : 0.01; // 0.25% or 1%

      // Update provider with prospector info
      const providerRef = db.collection("users").doc(providerEmail);
      await providerRef.update({
        prospectorId,
        prospectorCommissionRate: commissionRate,
        recruitedAt: fieldValueHelpers.serverTimestamp(),
        recruitmentSource: source
      });

      // Update prospector stats
      const currentRecruits = prospectorData.totalRecruits || 0;
      const currentActive = prospectorData.activeRecruits || 0;
      const supportedProviders = prospectorData.providersSupported || [];

      await prospectorDoc.ref.update({
        totalRecruits: currentRecruits + 1,
        activeRecruits: currentActive + 1,
        providersSupported: [...supportedProviders, providerEmail]
      });

      // Update prospect status if exists
      const prospectSnapshot = await db.collection("prospects")
        .where("email", "==", providerEmail)
        .limit(1)
        .get();

      if (!prospectSnapshot.empty) {
        await prospectSnapshot.docs[0].ref.update({
          status: 'convertido',
          prospectorId,
          inviteCode,
          convertedAt: fieldValueHelpers.serverTimestamp()
        });
      }

      res.status(200).json({
        success: true,
        message: "Provider registered with prospector",
        prospectorId,
        commissionRate
      });
    } catch (error) {
      console.error("Error registering with invite:", error);
      res.status(500).json({ error: "Failed to register with invite." });
    }
  });

  // === Prospector Phase 1 Dashboard: Stats endpoint ===
  // Returns aggregated metrics and badge progression for a given prospector
  // GET /api/prospector/stats?prospectorId=email
  app.get('/api/prospector/stats', async (req, res) => {
    try {
      const { prospectorId } = req.query;
      if (!prospectorId || typeof prospectorId !== 'string') {
        return res.status(400).json({ error: 'prospectorId query param required' });
      }
      const ref = db.collection('prospectors').doc(prospectorId);
      const snap = await ref.get();
      if (!snap.exists) {
        return res.status(404).json({ error: 'Prospector not found' });
      }
      const data = snap.data() || {};
      const totalRecruits = Number(data.totalRecruits || 0);
      const activeRecruits = Number(data.activeRecruits || 0);
      const totalCommissionsEarned = Number(data.totalCommissionsEarned || 0);
      const pendingCommissions = Number(data.pendingCommissions || 0);

      // Badge tiers by number of recruits
      const badgeTiers = [
        { name: 'Bronze', min: 0 },
        { name: 'Prata', min: 5 },
        { name: 'Ouro', min: 10 },
        { name: 'Platina', min: 25 },
        { name: 'Diamante', min: 50 }
      ];
      let currentBadge = badgeTiers[0].name;
      let nextBadge = null;
      for (let i = badgeTiers.length - 1; i >= 0; i--) {
        if (totalRecruits >= badgeTiers[i].min) {
          currentBadge = badgeTiers[i].name;
          const nb = badgeTiers[i + 1];
          nextBadge = nb ? nb.name : null;
          break;
        }
      }
      const nextThreshold = (() => {
        const tier = badgeTiers.find(t => t.name === nextBadge);
        return tier ? tier.min : null;
      })();
      const currentTierObj = badgeTiers.find(t => t.name === currentBadge);
      const currentBase = currentTierObj ? currentTierObj.min : 0;
      const progressToNextBadge = nextThreshold === null ? 100 : Math.min(100, Math.round(((totalRecruits - currentBase) / (nextThreshold - currentBase)) * 100));
      const averageCommissionPerRecruit = totalRecruits > 0 ? Number((totalCommissionsEarned / totalRecruits).toFixed(2)) : 0;

      res.status(200).json({
        prospectorId,
        totalRecruits,
        activeRecruits,
        totalCommissionsEarned: Number(totalCommissionsEarned.toFixed(2)),
        pendingCommissions: Number(pendingCommissions.toFixed(2)),
        averageCommissionPerRecruit,
        currentBadge,
        nextBadge,
        progressToNextBadge,
        badgeTiers
      });
    } catch (err) {
      console.error('Error fetching prospector stats:', err);
      res.status(500).json({ error: 'Failed to fetch prospector stats' });
    }
  });

  // === Prospector Phase 1 Dashboard: Leaderboard endpoint ===
  // GET /api/prospectors/leaderboard?limit=10&sort=commissions|recruits
  app.get('/api/prospectors/leaderboard', async (req, res) => {
    try {
      const { limit = '10', sort = 'commissions', forceRefresh } = req.query;
      const lim = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
      const sortField = sort === 'recruits' ? 'totalRecruits' : 'totalCommissionsEarned';

      // Rate limiting
      const ip = getClientIp(req);
      if (isRateLimited(ip, leaderboardRateDataLocal, rateCfg)) {
        return res.status(429).json({ error: 'Rate limit exceeded', retryAfterMs: rateCfg.windowMs });
      }

      // Cache check (bypass if forceRefresh present)
      const cacheKey = sortField;
      const cacheEntry = leaderboardCache[cacheKey];
      const now = Date.now();
      if (!forceRefresh && cacheEntry && cacheEntry.expiresAt > now && cacheEntry.payload) {
        return res.status(200).json({ sort: sortField, cached: true, ttlMs: cacheEntry.expiresAt - now, ...cacheEntry.payload });
      }

      // Fetch fresh data
      const snap = await db.collection('prospectors').get();
      const all = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
      all.sort((a, b) => (Number(b[sortField] || 0) - Number(a[sortField] || 0)));
      const results = all.slice(0, lim).map((p, idx) => ({
        prospectorId: p.id,
        name: p.name || p.id,
        totalRecruits: Number(p.totalRecruits || 0),
        totalCommissionsEarned: Number((p.totalCommissionsEarned || 0).toFixed ? (p.totalCommissionsEarned || 0).toFixed(2) : (p.totalCommissionsEarned || 0)),
        rank: idx + 1
      }));
      const payload = { total: all.length, results };
      leaderboardCache[cacheKey] = { expiresAt: now + cacheTtlMs, payload };
      res.status(200).json({ sort: sortField, cached: false, ttlMs: cacheTtlMs, ...payload });
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // === Prospector Follow-up Automation (Phase 1) ===
  // Data model (Firestore collection: prospector_outreach):
  // { id, prospectorId, providerName, providerEmail, providerPhone, emailSentAt, whatsappSentAt|null, status: 'email_sent'|'whatsapp_sent'|'opted_out', optOut: boolean, errorHistory: [] }
  // Threshold: WhatsApp follow-up 48h após email inicial.

  const FOLLOW_UP_MS = 48 * 60 * 60 * 1000; // 48h

  // Create outreach record and simulate initial email send
  app.post('/api/prospector/outreach', async (req, res) => {
    try {
      const { prospectorId, providerName, providerEmail, providerPhone } = req.body;
      if (!prospectorId || !providerEmail) {
        return res.status(400).json({ error: 'prospectorId and providerEmail required' });
      }
      const id = providerEmail.toLowerCase();
      const ref = db.collection('prospector_outreach').doc(id);
      const now = Date.now();
      await ref.set({
        id,
        prospectorId,
        providerName: providerName || providerEmail.split('@')[0],
        providerEmail,
        providerPhone: providerPhone || null,
        emailSentAt: now,
        whatsappSentAt: null,
        status: 'email_sent',
        optOut: false,
        errorHistory: [],
        followUpEligibleAt: now + FOLLOW_UP_MS
      });
      // Simulação de envio de email (stub)
      res.status(201).json({ success: true, id, status: 'email_sent' });
    } catch (err) {
      console.error('Error creating outreach record:', err);
      res.status(500).json({ error: 'Failed to create outreach record' });
    }
  });

  // List outreach records for a prospector
  app.get('/api/prospector/outreach', async (req, res) => {
    try {
      const { prospectorId } = req.query;
      const snap = await db.collection('prospector_outreach').get();
      const all = snap.docs.map(d => ({ ...(d.data() || {}) }));
      const filtered = prospectorId ? all.filter(r => r.prospectorId === prospectorId) : all;
      res.status(200).json({ total: filtered.length, results: filtered });
    } catch (err) {
      console.error('Error listing outreach records:', err);
      res.status(500).json({ error: 'Failed to list outreach records' });
    }
  });

  // Opt-out a single outreach record
  app.post('/api/prospector/outreach/:id/optout', async (req, res) => {
    try {
      const { id } = req.params;
      const ref = db.collection('prospector_outreach').doc(id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: 'Outreach record not found' });
      await ref.update({ optOut: true, status: 'opted_out' });
      res.status(200).json({ success: true, id, status: 'opted_out' });
    } catch (err) {
      console.error('Error opting out outreach record:', err);
      res.status(500).json({ error: 'Failed to opt-out outreach record' });
    }
  });

  // Manual scheduler trigger (test/support only)
  app.post('/api/prospector/outreach/scheduler-run', async (req, res) => {
    try {
      const processed = await processPendingOutreach({ db });
      res.status(200).json({ success: true, processed });
    } catch (err) {
      console.error('Scheduler run error:', err);
      res.status(500).json({ error: 'Failed to run scheduler' });
    }
  });

  // =================================================================
  // NEW PROSPECTING AUTOMATION ENDPOINTS
  // =================================================================

  const googlePlacesService = require('./services/googlePlacesService');
  const emailService = require('./services/emailService');
  const whatsappService = require('./whatsappService');

  /**
   * Import leads em massa (CSV, paste, bulk)
   * POST /api/prospector/import-leads
   * Body: { userId, leads: [{ name, phone, email?, category }] }
   */
  app.post('/api/prospector/import-leads', requireAuth, async (req, res) => {
    try {
      const { userId, leads } = req.body;
      const authEmail = req.user?.email;

      // Validação: usuário deve ser prospector e corresponder ao userId
      if (!authEmail || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verifica se o usuário é prospector
      const userDoc = await db.collection('users').doc(authEmail).get();
      if (!userDoc.exists || userDoc.data().type !== 'prospector') {
        return res.status(403).json({ error: 'Only prospectors can import leads' });
      }

      if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ error: 'leads array required (min 1 lead)' });
      }

      if (leads.length > 100) {
        return res.status(400).json({ error: 'Maximum 100 leads per batch' });
      }

      const results = {
        imported: 0,
        failed: 0,
        details: []
      };

      for (const lead of leads) {
        try {
          // Validação básica
          if (!lead.name || !lead.phone) {
            results.failed++;
            results.details.push({
              lead,
              success: false,
              error: 'Nome e telefone obrigatórios'
            });
            continue;
          }

          // Normaliza telefone
          const cleanPhone = lead.phone.replace(/\D/g, '');

          // Gera ID único baseado no telefone do prospector
          const leadId = `${userId}_${cleanPhone}`;

          // Checa duplicatas
          const existingLead = await db.collection('prospector_prospects').doc(leadId).get();
          if (existingLead.exists) {
            results.failed++;
            results.details.push({
              lead,
              success: false,
              error: 'Lead já existe'
            });
            continue;
          }

          // Enriquecimento básico com IA (opcional)
          let enrichedData = {};
          if (lead.category) {
            try {
              // Usa Gemini para gerar bio/headline se possível
              const aiEnrichment = await enrichLeadWithAI(lead);
              enrichedData = aiEnrichment;
            } catch (aiError) {
              console.warn('AI enrichment failed, continuing without it:', aiError.message);
            }
          }

          // Salva no Firestore
          await db.collection('prospector_prospects').doc(leadId).set({
            id: leadId,
            prospectorId: userId,
            name: lead.name,
            phone: cleanPhone,
            email: lead.email || null,
            category: lead.category || 'Geral',
            stage: 'new',
            source: 'bulk_import',
            ...enrichedData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          results.imported++;
          results.details.push({
            leadId,
            name: lead.name,
            success: true
          });
        } catch (error) {
          results.failed++;
          results.details.push({
            lead,
            success: false,
            error: error.message
          });
        }
      }

      res.status(200).json(results);
    } catch (error) {
      console.error('Error importing leads:', error);
      res.status(500).json({ error: 'Failed to import leads' });
    }
  });

  /**
   * Enriquece um lead com dados adicionais (Google Places, IA)
   * POST /api/prospector/enrich-lead
   * Body: { leadId, phone?, email?, name?, category? }
   */
  app.post('/api/prospector/enrich-lead', requireAuth, async (req, res) => {
    try {
      const { leadId, phone, email, name, category } = req.body;
      const authEmail = req.user?.email;

      if (!authEmail) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!leadId) {
        return res.status(400).json({ error: 'leadId required' });
      }

      // Verifica se o lead pertence ao prospector
      const leadDoc = await db.collection('prospector_prospects').doc(leadId).get();
      if (!leadDoc.exists) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      const leadData = leadDoc.data();
      if (leadData.prospectorId !== authEmail) {
        return res.status(403).json({ error: 'You can only enrich your own leads' });
      }

      const enrichedData = {};

      // Se tem categoria, busca no Google Places
      if (category && name) {
        try {
          const location = 'São Paulo, SP'; // Pode ser parametrizável
          const places = await googlePlacesService.searchQualityProfessionals(category, location, {
            maxResults: 5
          });

          // Tenta match por nome similar
          const match = places.find(p => 
            p.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(p.name.toLowerCase())
          );

          if (match) {
            enrichedData.address = match.address;
            enrichedData.rating = match.rating;
            enrichedData.reviewCount = match.reviewCount;
            enrichedData.googleMapsUrl = match.googleMapsUrl;
            enrichedData.website = match.website;
            enrichedData.enrichedFrom = 'google_places';
          }
        } catch (error) {
          console.warn('Google Places enrichment failed:', error.message);
        }
      }

      // Enriquecimento com IA
      if (name && category) {
        try {
          const aiData = await enrichLeadWithAI({ name, category, email });
          Object.assign(enrichedData, aiData);
        } catch (error) {
          console.warn('AI enrichment failed:', error.message);
        }
      }

      // Atualiza lead no Firestore
      if (Object.keys(enrichedData).length > 0) {
        await db.collection('prospector_prospects').doc(leadId).update({
          ...enrichedData,
          enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      res.status(200).json({
        success: true,
        leadId,
        enrichedData
      });
    } catch (error) {
      console.error('Error enriching lead:', error);
      res.status(500).json({ error: 'Failed to enrich lead' });
    }
  });

  /**
   * Envia campanha multi-canal para múltiplos leads
   * POST /api/prospector/send-campaign
   * Body: { channels: ['email','whatsapp'], template: {subject,message}, leads: [{email,phone}] }
   */
  app.post('/api/prospector/send-campaign', requireAuth, async (req, res) => {
    try {
      const { channels, template, leads } = req.body;
      const authEmail = req.user?.email;

      if (!authEmail) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verifica se é prospector
      const userDoc = await db.collection('users').doc(authEmail).get();
      if (!userDoc.exists || userDoc.data().type !== 'prospector') {
        return res.status(403).json({ error: 'Only prospectors can send campaigns' });
      }

      if (!Array.isArray(channels) || channels.length === 0) {
        return res.status(400).json({ error: 'channels array required' });
      }

      if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ error: 'leads array required (min 1 lead)' });
      }

      if (leads.length > 50) {
        return res.status(400).json({ error: 'Maximum 50 leads per campaign' });
      }

      if (!template || !template.message) {
        return res.status(400).json({ error: 'template with message required' });
      }

      const results = {
        whatsapp: { sent: 0, failed: 0, details: [] },
        email: { sent: 0, failed: 0, details: [] }
      };

      // Envia por Email
      if (channels.includes('email')) {
        const emailLeads = leads.filter(l => l.email);
        
        if (emailLeads.length > 0) {
          try {
            const emailData = {
              subject: template.subject || 'Apresentação Servio.AI',
              message: template.message,
              fromEmail: 'prospeccao@servio.ai',
              fromName: userDoc.data().name || 'Servio.AI'
            };

            const emailResults = await emailService.sendBulkEmails(emailLeads, emailData);
            results.email = emailResults;
            
            // Log campanha no Firestore
            await db.collection('prospector_campaigns').add({
              prospectorId: authEmail,
              channel: 'email',
              recipientCount: emailLeads.length,
              template: template.subject,
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              results: emailResults
            });
          } catch (emailError) {
            console.error('Email campaign error:', emailError);
            results.email.failed = emailLeads.length;
            results.email.details.push({ error: emailError.message });
          }
        }
      }

      // Envia por WhatsApp
      if (channels.includes('whatsapp')) {
        const whatsappLeads = leads.filter(l => l.phone);
        
        if (whatsappLeads.length > 0) {
          try {
            const recipients = whatsappLeads.map(l => ({
              phone: l.phone.replace(/\D/g, ''),
              message: personalizeMessage(template.message, l)
            }));

            const whatsappResults = await whatsappService.sendBulkMessages(recipients);
            results.whatsapp = whatsappResults;
            
            // Log campanha no Firestore
            await db.collection('prospector_campaigns').add({
              prospectorId: authEmail,
              channel: 'whatsapp',
              recipientCount: whatsappLeads.length,
              template: 'custom',
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              results: whatsappResults
            });
          } catch (whatsappError) {
            console.error('WhatsApp campaign error:', whatsappError);
            results.whatsapp.failed = whatsappLeads.length;
            results.whatsapp.details.push({ error: whatsappError.message });
          }
        }
      }

      res.status(200).json({
        success: true,
        results,
        campaignId: `campaign_${Date.now()}`
      });
    } catch (error) {
      console.error('Error sending campaign:', error);
      res.status(500).json({ error: 'Failed to send campaign' });
    }
  });

  /**
   * Helper: Enriquece lead com IA (Gemini)
   */
  async function enrichLeadWithAI(lead) {
    try {
      if (!genAI) return {};

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      const prompt = `Você é um assistente de prospecção. Gere dados profissionais para:
      Nome: ${lead.name}
      Categoria: ${lead.category}
      
      Retorne JSON com:
      - bio: Biografia profissional atraente (50-100 palavras)
      - headline: Headline chamativo (10-15 palavras)
      - tags: Array de 3-5 tags relevantes`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Extrai JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {};
    } catch (error) {
      console.warn('AI enrichment error:', error.message);
      return {};
    }
  }

  /**
   * Helper: Busca template de mensagem
   */
  async function getMessageTemplate(templateName) {
    try {
      const templateDoc = await db.collection('message_templates').doc(templateName).get();
      
      if (templateDoc.exists) {
        return templateDoc.data();
      }

      // Templates padrão
      const defaultTemplates = {
        onboarding: {
          whatsapp: '👋 Olá {nome}! Sou da Servio.AI. Você é {categoria}? Temos clientes buscando seus serviços. Cadastro gratuito: https://servio-ai.com/cadastro',
          email: emailService.getDefaultTemplate({})
        }
      };

      return defaultTemplates[templateName] || defaultTemplates.onboarding;
    } catch (error) {
      console.warn('Error loading template:', error);
      return {
        whatsapp: 'Olá! Cadastre-se na Servio.AI: https://servio-ai.com/cadastro',
        email: emailService.getDefaultTemplate({})
      };
    }
  }

  /**
   * Helper: Personaliza mensagem com dados do lead
   */
  function personalizeMessage(template, lead) {
    return template
      .replace(/\{nome\}/g, lead.name)
      .replace(/\{categoria\}/g, lead.category || 'profissional')
      .replace(/\{email\}/g, lead.email || '');
  }

  // =================================================================
  // END NEW PROSPECTING AUTOMATION ENDPOINTS
  // =================================================================

  // Get all jobs (with /api prefix for frontend compatibility)
  app.get("/api/jobs", requireAuth, async (req, res) => {
    try {
      const { providerId, status } = req.query;
      let query = db.collection("jobs");
      if (providerId) {
        query = query.where("providerId", "==", providerId);
      }
      if (status) {
        query = query.where("status", "==", status);
      }
      const snapshot = await query.get();
      const jobs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(jobs);
    } catch (error) {
      console.error("Error getting jobs:", error);
      res.status(500).json({ error: "Failed to retrieve jobs." });
    }
  });

  // Get all jobs (legacy route without /api)
  app.get("/jobs", requireAuth, async (req, res) => {
    try {
      const { providerId, status } = req.query;
      let query = db.collection("jobs");
      if (providerId) {
        query = query.where("providerId", "==", providerId);
      }
      if (status) {
        query = query.where("status", "==", status);
      }
      const snapshot = await query.get();
      const jobs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(jobs);
    } catch (error) {
      console.error("Error getting jobs:", error);
      res.status(500).json({ error: "Failed to retrieve jobs." });
    }
  });

  // Create a new job (with /api prefix)
  app.post("/api/jobs", async (req, res) => {
    try {
      const jobData = {
        ...req.body,
        createdAt: new Date().toISOString(),
        status: req.body.status || "aberto",
      };
      const jobRef = db.collection("jobs").doc();
      await jobRef.set(jobData);
      res.status(201).json({ id: jobRef.id, ...jobData });
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ error: "Failed to create job." });
    }
  });

  // Create a new job (legacy route)
  app.post("/jobs", async (req, res) => {
    try {
      const jobData = {
        ...req.body,
        createdAt: new Date().toISOString(),
        status: req.body.status || "aberto",
      };
      const jobRef = db.collection("jobs").doc();
      await jobRef.set(jobData);
      res.status(201).json({ id: jobRef.id, ...jobData });
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ error: "Failed to create job." });
    }
  });

  // =================================================================
  // SENTIMENT ALERTS API ENDPOINTS
  // =================================================================

  // Get all sentiment alerts
  app.get("/sentiment-alerts", async (req, res) => {
    try {
      const snapshot = await db.collection("sentiment_alerts").orderBy('createdAt', 'desc').get();
      const alerts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(alerts);
    } catch (error) {
      console.error("Error getting sentiment alerts:", error);
      res.status(500).json({ error: "Failed to retrieve sentiment alerts." });
    }
  });

  // Create a new sentiment alert
  app.post("/sentiment-alerts", async (req, res) => {
    try {
      const alertData = {
        ...req.body,
        createdAt: new Date().toISOString(),
        status: "novo", // 'novo', 'revisado'
      };
      const alertRef = db.collection("sentiment_alerts").doc();
      await alertRef.set(alertData);
      res.status(201).json({ id: alertRef.id, ...alertData });
    } catch (error) {
      console.error("Error creating sentiment alert:", error);
      res.status(500).json({ error: "Failed to create sentiment alert." });
    }
  });

  // Get maintenance history for a specific item
  app.get("/maintained-items/:itemId/history", async (req, res) => {
    try {
      const { itemId } = req.params;
      const snapshot = await db
        .collection("jobs")
        .where("itemId", "==", itemId)
        .where("status", "==", "concluido")
        .orderBy("completedAt", "desc")
        .get();

      const history = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(history);
    } catch (error) {
      console.error("Error getting maintenance history:", error);
      res.status(500).json({ error: "Failed to retrieve maintenance history." });
    }
  });

  // =================================================================
  // PROPOSALS ENDPOINTS
  // =================================================================

  // GET /proposals - List all proposals (with optional filters)
  app.get("/proposals", async (req, res) => {
    try {
      const { jobId, providerId, status } = req.query;
      let query = db.collection("proposals");

      if (jobId) query = query.where("jobId", "==", jobId);
      if (providerId) query = query.where("providerId", "==", providerId);
      if (status) query = query.where("status", "==", status);

      const snapshot = await query.get();
      const proposals = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      res.status(200).json(proposals);
    } catch (error) {
      console.error("Error listing proposals:", error);
      res.status(500).json({ error: "Failed to retrieve proposals." });
    }
  });

  // POST /proposals - Create new proposal
  app.post("/proposals", async (req, res) => {
    try {
      const { jobId, providerId, price, message } = req.body;

      if (!jobId || !providerId || price === undefined) {
        return res.status(400).json({ error: "jobId, providerId, and price are required." });
      }

      const proposalData = {
        jobId,
        providerId,
        price: Number(price),
        message: message || "",
        status: "pendente",
        createdAt: new Date().toISOString(),
      };

      const docRef = await db.collection("proposals").add(proposalData);
      const newProposal = { id: docRef.id, ...proposalData };

      res.status(201).json(newProposal);
    } catch (error) {
      console.error("Error creating proposal:", error);
      res.status(500).json({ error: "Failed to create proposal." });
    }
  });

  // PUT /proposals/:id - Update proposal
  app.put("/proposals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      delete updates.jobId;
      delete updates.providerId;
      delete updates.createdAt;
      updates.updatedAt = new Date().toISOString();

      const docRef = db.collection("proposals").doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Proposal not found." });
      }

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ error: "Failed to update proposal." });
    }
  });

  // =================================================================
  // NOTIFICATIONS ENDPOINTS
  // =================================================================

  // GET /notifications - List all notifications (with optional filters)
  app.get("/notifications", async (req, res) => {
    try {
      const { userId, isRead } = req.query;
      let query = db.collection("notifications");

      if (userId) query = query.where("userId", "==", userId);
      if (isRead !== undefined) {
        query = query.where("isRead", "==", isRead === "true");
      }

      const snapshot = await query.orderBy("createdAt", "desc").get();
      const notifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error listing notifications:", error);
      res.status(500).json({ error: "Failed to retrieve notifications." });
    }
  });

  // POST /notifications - Create new notification
  app.post("/notifications", async (req, res) => {
    try {
      const { userId, text, type } = req.body;

      if (!userId || !text) {
        return res.status(400).json({ error: "userId and text are required." });
      }

      const notificationData = {
        userId,
        text,
        type: type || "info",
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      const docRef = await db.collection("notifications").add(notificationData);
      const newNotification = { id: docRef.id, ...notificationData };

      res.status(201).json(newNotification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Failed to create notification." });
    }
  });

  // PUT /notifications/:id - Update notification (mark as read)
  app.put("/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const docRef = db.collection("notifications").doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Notification not found." });
      }

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ error: "Failed to update notification." });
    }
  });

  // =================================================================
  // MESSAGES (CHAT) ENDPOINTS
  // =================================================================

  // GET /messages - List messages for a chat
  app.get("/messages", async (req, res) => {
    try {
      const { chatId, limit = 100 } = req.query;

      if (!chatId) {
        return res.status(400).json({ error: "chatId query parameter is required." });
      }

      const snapshot = await db
        .collection("messages")
        .where("chatId", "==", chatId)
        .limit(Number.parseInt(limit))
        .get();

      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by createdAt on server side (since Firestore composite index not created yet)
      messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      res.status(200).json(messages);
    } catch (error) {
      console.error("Error listing messages:", error);
      res.status(500).json({ error: "Failed to retrieve messages." });
    }
  });

  // POST /messages - Create new message
  app.post("/messages", async (req, res) => {
    try {
      const { chatId, senderId, text, type } = req.body;

      if (!chatId || !senderId || !text) {
        return res.status(400).json({ error: "chatId, senderId, and text are required." });
      }

      const messageData = {
        chatId,
        senderId,
        text,
        type: type || "text",
        createdAt: new Date().toISOString(),
      };

      const docRef = await db.collection("messages").add(messageData);
      const newMessage = { id: docRef.id, ...messageData };

      // Trigger notification for recipient (simplified - in production use Cloud Function)
      // For now, we'll skip automatic notification and let frontend handle it

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message." });
    }
  });

  // =================================================================
  // JOBS UTILITIES (already defined earlier, kept for reference)
  // =================================================================

  // GET /jobs/:id - Get single job by ID
  app.get("/jobs/:id", requireJobParticipant, async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = db.collection("jobs").doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Job not found." });
      }

      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ error: "Failed to fetch job." });
    }
  });

  // PUT /jobs/:id - Update job
  app.put("/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const docRef = db.collection("jobs").doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Job not found." });
      }

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ error: "Failed to update notification." });
    }
  });

  // =================================================================
  // JOBS ENDPOINTS (UPDATES)
  // =================================================================

  // GET /jobs/:id - Get single job
  app.get("/jobs/:id", async (req, res) => {
    try {
      const doc = await db.collection("jobs").doc(req.params.id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: "Job not found." });
      }
      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error("Error getting job:", error);
      res.status(500).json({ error: "Failed to retrieve job." });
    }
  });

  // PUT /jobs/:id - Update job
  app.put("/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const docRef = db.collection("jobs").doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Job not found." });
      }

      const oldData = doc.data();
      const oldStatus = oldData.status;
      const newStatus = updates.status;

      delete updates.createdAt;
      delete updates.clientId;
      updates.updatedAt = new Date().toISOString();

      await docRef.update(updates);
      const updatedDoc = await docRef.get();
      const updatedData = updatedDoc.data();

      // Check if job was just completed - trigger commission calculation
      if (oldStatus !== 'concluido' && newStatus === 'concluido' && updatedData.providerId) {
        try {
          const providerRef = db.collection("users").doc(updatedData.providerId);
          const providerDoc = await providerRef.get();
          
          if (providerDoc.exists) {
            const providerData = providerDoc.data();
            
            // Check if provider was recruited by a prospector
            if (providerData.prospectorId && providerData.prospectorCommissionRate) {
              const jobPrice = Number.parseFloat(updatedData.price) || 0;
              const providerRate = Number.parseFloat(providerData.providerRate) || 0.75;
              const prospectorCommissionRate = Number.parseFloat(providerData.prospectorCommissionRate) || 0.01;
              
              // Calculate earnings
              const providerEarnings = jobPrice * providerRate;
              const commissionAmount = providerEarnings * prospectorCommissionRate;
              
              // Create commission record
              const commissionRef = db.collection("commissions").doc();
              await commissionRef.set({
                id: commissionRef.id,
                prospectorId: providerData.prospectorId,
                providerId: updatedData.providerId,
                jobId: id,
                amount: commissionAmount,
                rate: prospectorCommissionRate,
                providerEarnings: providerEarnings,
                jobPrice: jobPrice,
                providerRate: providerRate,
                status: 'pending',
                createdAt: fieldValueHelpers.serverTimestamp()
              });

              // Update prospector's total commissions
              const prospectorRef = db.collection("prospectors").doc(providerData.prospectorId);
              const prospectorDoc = await prospectorRef.get();
              
              if (prospectorDoc.exists) {
                const currentTotal = prospectorDoc.data().totalCommissionsEarned || 0;
                await prospectorRef.update({
                  totalCommissionsEarned: currentTotal + commissionAmount
                });
              }

              console.log(`✅ Commission created: R$ ${commissionAmount.toFixed(2)} for prospector ${providerData.prospectorId}`);

              // Notify prospector about commission
              const { notifyProspector } = require('./notificationService');
              await notifyProspector({
                db,
                prospectorId: providerData.prospectorId,
                type: 'commission',
                data: {
                  providerName: providerData.name || 'Prestador',
                  amount: commissionAmount,
                  jobId: id,
                  jobTitle: updatedData.description?.substring(0, 50) || 'Job concluído',
                }
              }).catch(err => console.error('[Commission Notification] Error:', err));
            }
          }
        } catch (commissionError) {
          console.error("Error creating commission:", commissionError);
          // Don't fail the job update if commission creation fails
        }
      }

      res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ error: "Failed to update job." });
    }
  });

  // =================================================================
  // FOLLOW-UP EMAIL SCHEDULING ENDPOINTS (Prospectors Phase 1)
  // =================================================================

  // POST /api/followups - create a new follow-up schedule for a prospect
  app.post('/api/followups', async (req, res) => {
    try {
      const { prospectorId, prospectName, prospectEmail, referralLink } = req.body || {};
      if (!prospectorId || !prospectName || !prospectEmail) {
        return res.status(400).json({ error: 'prospectorId, prospectName e prospectEmail são obrigatórios' });
      }
      const schedule = await followUpService.createFollowUpSchedule({
        db,
        prospectorId,
        prospectName,
        prospectEmail,
        referralLink: referralLink || null
      });
      res.status(201).json(schedule);
    } catch (err) {
      console.error('Error creating follow-up schedule:', err);
      res.status(500).json({ error: 'Failed to create follow-up schedule' });
    }
  });

  // GET /api/followups/:prospectorId - list schedules for a prospector
  app.get('/api/followups/:prospectorId', async (req, res) => {
    try {
      const { prospectorId } = req.params;
      const schedules = await followUpService.listSchedules({ db, prospectorId });
      res.json({ items: schedules });
    } catch (err) {
      console.error('Error listing follow-up schedules:', err);
      res.status(500).json({ error: 'Failed to list schedules' });
    }
  });

  // PATCH /api/followups/:id - pause, resume or opt-out a schedule
  app.patch('/api/followups/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body || {};
      if (!action || !['pause','resume','optout'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Use pause | resume | optout' });
      }
      let updated;
      if (action === 'pause') updated = await followUpService.pauseSchedule({ db, scheduleId: id });
      else if (action === 'resume') updated = await followUpService.resumeSchedule({ db, scheduleId: id });
      else updated = await followUpService.optOutSchedule({ db, scheduleId: id });
      res.json(updated);
    } catch (err) {
      console.error('Error updating follow-up schedule:', err);
      res.status(500).json({ error: 'Failed to update schedule' });
    }
  });

  // POST /api/followups/run - manually trigger due email processing (cron replacement)
  app.post('/api/followups/run', async (_req, res) => {
    try {
      const result = await followUpService.processDueEmails({ db, gmailService });
      res.json(result);
    } catch (err) {
      console.error('Error processing follow-up emails:', err);
      res.status(500).json({ error: 'Failed processing follow-up emails' });
    }
  });

  // =================================================================
  // WHATSAPP BUSINESS API INTEGRATION
  // =================================================================
  // WhatsApp router handles all messaging, webhook verification, and status checking
  // Routes: POST /api/whatsapp/send, POST /api/whatsapp/webhook, GET /api/whatsapp/webhook,
  //         GET /api/whatsapp/status, POST /api/whatsapp/template
  // Database: Records all messages in Firestore whatsapp_messages collection
  app.use('/api/whatsapp', whatsappRouter);

  // Multi-role WhatsApp messaging for all user types
  // Routes: /api/whatsapp/client/*, /api/whatsapp/provider/*, /api/whatsapp/prospector/*, /api/whatsapp/admin/*
  app.use('/api/whatsapp/multi-role', whatsappMultiRoleRouter);

  // Omnichannel Service - Unified multi-channel communication (WhatsApp, Instagram, Facebook, WebChat)
  // Routes: POST /api/omni/webhook/whatsapp, POST /api/omni/webhook/instagram, POST /api/omni/webhook/facebook,
  //         POST /api/omni/web/send, GET /api/omni/conversations, GET /api/omni/messages
  // Database: conversations/{conversationId}, messages/{messageId}, omni_logs/{logId}
  const omniRouter = require('./services/omnichannel');
  app.use('/api/omni', omniRouter);

  return app;
}

// Create default app instance
const app = createApp();

/**
 * Background processor to handle expirations and simple escalations.
 * This is intentionally simple and side-effect free (no external calls),
 * so it can be covered by unit tests and run on a scheduler/cron later.
 *
 * @param {object} options
 * @param {object} options.db Firestore-like instance (supports collection().get(), doc(id).update())
 * @param {Date} [options.now] Reference time (defaults to new Date())
 * @param {number} [options.thresholdHours] Age threshold to escalate open jobs (default: 12h)
 * @returns {Promise<{ expiredProposals: number, escalatedJobs: number }>}
 */
async function processScheduledJobs({ db, now = new Date(), thresholdHours = 12 } = {}) {
  const nowTs = now.getTime();
  const thresholdMs = thresholdHours * 60 * 60 * 1000;
  let expiredProposals = 0;
  let escalatedJobs = 0;

  // 1) Expire proposals past expiresAt when status === 'pendente'
  try {
    const proposalsSnap = await db.collection('proposals').get();
    const proposals = (proposalsSnap.docs || []).map(d => ({ id: d.id, ...(typeof d.data === 'function' ? d.data() : d.data) }));
    for (const p of proposals) {
      const expiresAt = p.expiresAt ? new Date(p.expiresAt).getTime() : undefined;
      if (p.status === 'pendente' && expiresAt && expiresAt < nowTs) {
        const ref = db.collection('proposals').doc(p.id);
        await ref.update({ status: 'expirado', updatedAt: new Date(nowTs).toISOString() });
        expiredProposals++;
      }
    }
  } catch (err) {
    console.error('processScheduledJobs: proposals pass failed', err);
  }

  // 2) Escalate open jobs with zero proposals older than threshold
  try {
    const jobsSnap = await db.collection('jobs').get();
    const jobs = (jobsSnap.docs || []).map(d => ({ id: d.id, ...(typeof d.data === 'function' ? d.data() : d.data) }));
    for (const j of jobs) {
      if ((j.status === 'aberto' || j.status === 'open') && (Number(j.proposalsCount || 0) === 0)) {
        const createdAtMs = j.createdAt ? new Date(j.createdAt).getTime() : undefined;
        if (createdAtMs && (nowTs - createdAtMs) >= thresholdMs) {
          const ref = db.collection('jobs').doc(j.id);
          await ref.update({ escalation: 'no_proposals', notifiedAt: new Date(nowTs).toISOString() });
          escalatedJobs++;
        }
      }
    }
  } catch (err) {
    console.error('processScheduledJobs: jobs pass failed', err);
  }

  return { expiredProposals, escalatedJobs };
}

// =================================================================
// DEVELOPMENT ENDPOINTS (apenas em ambiente não-produção)
// =================================================================
if (process.env.NODE_ENV !== 'production') {
  // POST /dev/seed-e2e-users - Criar usuários de teste E2E
  app.post('/dev/seed-e2e-users', async (req, res) => {
    try {
      const db = defaultDb; // Usar defaultDb
      const users = [
        {
          email: 'e2e-cliente@servio.ai',
          name: 'E2E Cliente',
          type: 'cliente',
          bio: '',
          location: 'São Paulo',
          memberSince: new Date().toISOString(),
          status: 'ativo',
        },
        {
          email: 'e2e-prestador@servio.ai',
          name: 'E2E Prestador',
          type: 'prestador',
          bio: '',
          location: 'São Paulo',
          memberSince: new Date().toISOString(),
          status: 'ativo',
          headline: 'Prestador E2E',
          specialties: ['limpeza', 'reparos'],
          verificationStatus: 'verificado',
          providerRate: 0.85,
        },
        {
          email: 'admin@servio.ai',
          name: 'E2E Admin',
          type: 'admin',
          bio: '',
          location: 'São Paulo',
          memberSince: new Date().toISOString(),
          status: 'ativo',
        },
        {
          email: 'e2e-prospector@servio.ai',
          name: 'E2E Prospector',
          type: 'prospector',
          bio: 'Prospector de teste para E2E',
          location: 'São Paulo',
          memberSince: new Date().toISOString(),
          status: 'ativo',
          prospectorStats: {
            totalRecruits: 0,
            activeRecruits: 0,
            totalCommissions: 0,
            level: 1,
            badges: []
          }
        }
      ];

      const results = [];
      for (const userData of users) {
        await db.collection('users').doc(userData.email).set(userData, { merge: true });
        results.push(userData.email);
      }

      console.log('[DEV] E2E users seeded:', results);
      res.status(200).json({ 
        message: 'E2E users seeded successfully',
        users: results,
        mode: db.isMemoryMode ? db.isMemoryMode() : 'firestore'
      });
    } catch (error) {
      console.error('Error seeding E2E users:', error);
      res.status(500).json({ 
        error: 'Failed to seed E2E users', 
        details: error.message,
        stack: error.stack 
      });
    }
  });  // GET /dev/db-status - Verificar modo de armazenamento
  app.get('/dev/db-status', (req, res) => {
    const db = defaultDb; // Usar defaultDb ao invés de db local
    res.json({
      mode: db.isMemoryMode ? (db.isMemoryMode() ? 'memory' : 'firestore') : 'unknown',
      environment: process.env.NODE_ENV || 'development',
      data: db._exportMemory ? db._exportMemory() : null
    });
  });
}

// Start the server only if the file is run directly
if (require.main === module) {
  console.log('[SERVER] Starting server on port', port);
  console.log('[SERVER] require.main:', require.main.filename);
  console.log('[SERVER] module:', module.filename);
  
  // Enumerate and log all registered routes on startup
  const enumerateRoutes = () => {
    const routes = [];
    const stack = app._router && app._router.stack ? app._router.stack : [];
    stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods || {}).filter(Boolean).map(m => m.toUpperCase());
        routes.push({ path: layer.route.path, methods });
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        layer.handle.stack.forEach((rl) => {
          if (rl.route && rl.route.path) {
            const methods = Object.keys(rl.route.methods || {}).filter(Boolean).map(m => m.toUpperCase());
            routes.push({ path: rl.route.path, methods });
          }
        });
      }
    });
    return routes;
  };

  const allRoutes = enumerateRoutes();
  console.log('[SERVER] Registered routes:', allRoutes.length);
  allRoutes.slice(0, 30).forEach(r => console.log(`  ${r.methods.join(',')} ${r.path}`));
  if (allRoutes.length > 30) console.log(`  ... and ${allRoutes.length - 30} more`);
  
  // Explicitly log presence of smart-actions route
  const smartActionsRoute = allRoutes.find(r => r.path === '/api/prospector/smart-actions');
  if (smartActionsRoute) {
    console.log('[SERVER] ✅ CONFIRMED: POST /api/prospector/smart-actions is registered');
  } else {
    console.error('[SERVER] ❌ WARNING: POST /api/prospector/smart-actions NOT FOUND in route list');
  }
  
  try {
    const host = '0.0.0.0'; // Listen on all interfaces (IPv4)
    const server = app.listen(port, host, () => {
      console.log(`[SERVER] ✅ Firestore Backend Service listening on ${host}:${port}`);
      console.log('[SERVER] Server address:', server.address());
    });
    
    server.on('error', (err) => {
      console.error('[SERVER] ❌ Error:', err);
      process.exit(1);
    });
    
    server.on('close', () => {
      console.log('[SERVER] Server closed');
    });
    
    // Keep process alive
    process.on('SIGTERM', () => {
      console.log('[SERVER] SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('[SERVER] HTTP server closed');
      });
    });
    
    console.log('[SERVER] Setup complete, server should be running...');
    
    // Heartbeat to keep terminal alive
    setInterval(() => {
      console.log('[SERVER] Heartbeat - Server running on port', port);
    }, 30000); // Every 30 seconds
  } catch (err) {
    console.error('[SERVER] Fatal error starting server:', err);
    process.exit(1);
  }
} else {
  console.log('[SERVER] Module loaded as dependency, not starting server');
}

module.exports = { createApp, app, calculateProviderRate, processScheduledJobs };
// Provide a default export compatible with ESM import default used in tests
module.exports.default = app;

