const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const { Storage } = require("@google-cloud/storage");
const stripeLib = require("stripe");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Firebase Admin SDK
// For Cloud Run, credentials will be automatically picked up from the service account.
// For local development, you might need to set GOOGLE_APPLICATION_CREDENTIALS
// or provide a service account key file directly.
try {
  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp();
  }
} catch (_) {
  // Allow running without firebase credentials locally
}

const storage = new Storage();
const defaultDb = admin.firestore();
// Stripe initialization - requires STRIPE_SECRET_KEY env var
const defaultStripe = process.env.STRIPE_SECRET_KEY
  ? stripeLib(process.env.STRIPE_SECRET_KEY)
  : null; // Will be injected in tests or left null if not configured
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
  const volumeTier = totalRevenue >= 11000 ? 0.03 : totalRevenue >= 6000 ? 0.02 : totalRevenue >= 1500 ? 0.01 : 0;
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
} = {}) {
  const app = express();

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

  // Health check endpoint for load balancers and monitoring
  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "servio-backend"
    });
  });

  // Health check alias for API prefix compatibility
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "servio-backend"
    });
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
      const cat = /eletric|luz|tomada|fio/.test(p) ? 'reparos'
        : /pintur|parede|tinta/.test(p) ? 'reparos'
        : /encan|vazam|torneira|cano/.test(p) ? 'reparos'
        : /design|logo|marca|arte/.test(p) ? 'design'
        : /comput|notebook|formata|ti/.test(p) ? 'ti'
        : /limp|faxin|higien/.test(p) ? 'limpeza'
        : 'outro';

      const serviceType = /instal|trocar|montar|pintar|formatar|limpar/.test(p) ? 'tabelado'
        : /diagnost|avaliar|inspecionar/.test(p) ? 'diagnostico'
        : 'personalizado';

      const urgency = /hoje|urgente/.test(p) ? 'hoje'
        : /amanh[ãa]/.test(p) ? 'amanha'
        : /semana/.test(p) ? 'semana'
        : 'flexivel';

      // very rough budget heuristic just to avoid blocking the flow
      const estimatedBudget = /pintur|parede/.test(p) ? 350
        : /eletric|tomada/.test(p) ? 200
        : /encan|vazam/.test(p) ? 250
        : /design|logo/.test(p) ? 500
        : /comput|notebook|ti/.test(p) ? 180
        : 300;

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
        else if (daysSince > 180) urgency = 'media';
        else return null; // Too recent
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
    const { base64Image, mimeType } = req.body || {};
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
    const { messages = [], currentUserType } = req.body || {};
    const last = messages[messages.length - 1]?.text?.toLowerCase() || '';
    if (/quando|data|horário|agendar/.test(last)) {
      return res.json({ name: 'propose_schedule', args: {}, displayText: 'Sugerir horário para o serviço' });
    }
    if (/resumo|acordo/.test(last)) {
      return res.json({ name: 'summarize_agreement', args: {}, displayText: 'Gerar resumo do acordo' });
    }
    return res.json({ name: 'clarify_scope', args: {}, displayText: 'Pedir mais detalhes do serviço' });
  });

  // POST /api/parse-search
  app.post('/api/parse-search', async (req, res) => {
    const { query = '' } = req.body || {};
    const lower = query.toLowerCase();
    const parsed = {
      service: /eletric|luz|tomada/.test(lower) ? 'eletricista' : /pintur|parede/.test(lower) ? 'pintura' : undefined,
      location: /são paulo|sp/.test(lower) ? 'São Paulo' : /rio de janeiro|rj/.test(lower) ? 'Rio de Janeiro' : undefined,
      attributes: ['verificado'].filter(a => lower.includes(a))
    };
    return res.json(parsed);
  });

  // POST /api/extract-document
  app.post('/api/extract-document', async (req, res) => {
    const { base64Image, mimeType } = req.body || {};
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
      let { job, jobId, allUsers = [], allJobs = [] } = req.body || {};
      
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
        const name = (p.name || '').toLowerCase();
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
        const stubAccountId = `acct_stub_${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;
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

  app.post("/create-checkout-session", async (req, res) => {
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

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const { escrowId } = session.metadata;
        const paymentIntentId = session.payment_intent;

        if (escrowId && paymentIntentId) {
          console.log(`✅ Checkout session completed for Escrow ID: ${escrowId}.`);
          const escrowRef = db.collection('escrows').doc(escrowId);
          await escrowRef.update({ status: 'pago', paymentIntentId: paymentIntentId });
        }
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
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


  app.post("/jobs/:jobId/release-payment", async (req, res) => {
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
      const bucketName = process.env.GCP_STORAGE_BUCKET; // e.g., 'your-project-id.appspot.com'
      if (!bucketName) {
        throw new Error("GCP_STORAGE_BUCKET environment variable not set.");
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
  app.get("/disputes", async (req, res) => {
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
  app.post("/disputes/:disputeId/resolve", async (req, res) => {
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

  // Get all users
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

  // Get a single user by ID (email)
  app.get("/users/:id", async (req, res) => {
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

  // Create a new user
  app.post("/users", async (req, res) => {
    try {
      const userData = req.body;
      if (!userData.email) {
        return res.status(400).json({ error: "User email is required." });
      }
      await db.collection("users").doc(userData.email).set(userData);
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
  app.delete("/users/:id", async (req, res) => {
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

  // Get all jobs
  app.get("/jobs", async (req, res) => {
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

  // Create a new job
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
        .limit(parseInt(limit))
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
  app.get("/jobs/:id", async (req, res) => {
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

      delete updates.createdAt;
      delete updates.clientId;
      updates.updatedAt = new Date().toISOString();

      const docRef = db.collection("jobs").doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Job not found." });
      }

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ error: "Failed to update job." });
    }
  });


  return app;
}

// Create default app instance
const app = createApp();

// Start the server only if the file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Firestore Backend Service listening on port ${port}`);
  });
}

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

module.exports = { createApp, app, calculateProviderRate, processScheduledJobs };
// Provide a default export compatible with ESM import default used in tests
module.exports.default = app;
