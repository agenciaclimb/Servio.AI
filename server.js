const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const { GoogleGenAI, Type } = require('@google/genai');

// Initialize Firebase Admin (idempotent)
try {
  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp();
  }
} catch (_) {
  // noop: allow running without firebase credentials locally
}

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Auth middleware (Firebase ID token)
const checkAuth = async (req, res, next) => {
  const hdr = req.headers.authorization || '';
  if (!hdr.startsWith('Bearer ')) return res.status(401).send('Unauthorized: No Token Provided');
  const idToken = hdr.substring('Bearer '.length);
  try {
    await admin.auth().verifyIdToken(idToken);
    return next();
  } catch (err) {
    console.error('Auth error (AI API):', err);
    return res.status(403).send('Unauthorized: Invalid Token');
  }
};

// Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_THINK = 'gemini-2.5-pro';

// Helpers
const handleApiError = (res, error, apiName) => {
  console.error(`Error in ${apiName}:`, error);
  res.status(500).json({ error: `Falha na API: ${apiName}.` });
};
const safeJSON = (text, fallback = null) => {
  try { return JSON.parse(text); } catch (_) { return fallback; }
};

// ============ AI Endpoints ============

app.post('/api/enhance-job', checkAuth, async (req, res) => {
  try {
    const { prompt, address, fileCount } = req.body;
    const requestPrompt = `Analise e melhore esta solicitação de serviço: "${prompt}". Endereço: "${address || 'N/A'}". Mídias anexadas: ${fileCount || 0}. Estruture em JSON com "enhancedDescription" (clara, com placeholders como "[INFORMAR MEDIDAS]"), "suggestedCategory" ('limpeza', 'reparos', etc.) e "suggestedServiceType" ('personalizado', 'tabelado', 'diagnostico'). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: requestPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enhancedDescription: { type: Type.STRING },
            suggestedCategory: { type: Type.STRING },
            suggestedServiceType: { type: Type.STRING }
          },
          required: ['enhancedDescription', 'suggestedCategory', 'suggestedServiceType']
        }
      }
    });
    res.json(safeJSON(response.text));
  } catch (error) { handleApiError(res, error, 'enhance-job'); }
});

const analyzeRelevanceScore = async (jobDescription, providerProfile) => {
  const prompt = `Analise a relevância do perfil de um prestador para um serviço. Job: "${jobDescription}". Perfil: Título: "${providerProfile.headline}", Bio: "${providerProfile.bio}". Retorne um JSON com "relevanceScore" (0 a 100). Responda APENAS com o JSON.`;
  const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
  const obj = safeJSON(response.text, { relevanceScore: 50 });
  return Math.max(0, Math.min(100, Number(obj.relevanceScore) || 50));
};

app.post('/api/analyze-relevance', checkAuth, async (req, res) => {
  try {
    const { jobDescription, providerProfile } = req.body;
    const relevanceScore = await analyzeRelevanceScore(jobDescription, providerProfile);
    res.json({ relevanceScore });
  } catch (error) { handleApiError(res, error, 'analyze-relevance'); }
});

app.post('/api/match-providers', checkAuth, async (req, res) => {
  try {
    const { job, allUsers } = req.body;
    const providers = (allUsers || []).filter(u => u.type === 'prestador' && u.verificationStatus === 'verificado');

    const weights = { proximity: 0.25, availability: 0.20, specialty: 0.15, keywordRelevance: 0.15, rating: 0.10, certificates: 0.05, criminalRecord: 0.05, platformActivity: 0.05 };
    const tierBonus = { 'Platina': 15, 'Ouro': 10, 'Prata': 5, 'Bronze': 0 };
    const availabilityMap = { hoje: 100, amanha: 80, '3dias': 60, '1semana': 40 };

    const scored = await Promise.all(providers.map(async (provider) => {
      const proximityScore = (job.address && provider.location && job.address.includes((provider.location.split(',')[1] || '').trim())) ? 100 : 30;
      const availabilityScore = availabilityMap[job.urgency] || 50;
      const specialtyScore = (provider.specialties || []).some(s => (job.category || '').toLowerCase().includes(String(s).toLowerCase())) ? 100 : 0;
      const relevanceScore = await analyzeRelevanceScore(job.description, { headline: provider.headline, bio: provider.bio });
      const ratingScore = provider.averageRating ? (provider.averageRating / 5) * 100 : 60;
      const certificatesScore = provider.hasCertificates ? 100 : 0;
      const criminalRecordScore = provider.hasCriminalRecordCheck ? 100 : 0;
      const platformActivityScore = Math.min(((provider.portfolio || []).length) * 20, 100);
      const providerTier = provider.earningsProfile?.tier || 'Bronze';
      const tierScore = tierBonus[providerTier] || 0;

      const finalScore =
        (proximityScore * weights.proximity) +
        (availabilityScore * weights.availability) +
        (specialtyScore * weights.specialty) +
        (relevanceScore * weights.keywordRelevance) +
        (ratingScore * weights.rating) +
        (certificatesScore * weights.certificates) +
        (criminalRecordScore * weights.criminalRecord) +
        (platformActivityScore * weights.platformActivity) +
        tierScore; // **BÔNUS DE DESTAQUE ADICIONADO AQUI**

      return {
        providerId: provider.email,
        compatibilityScore: Math.round(finalScore),
        justification: 'Combinação de especialidade e disponibilidade.',
        provider
      };
    }));

    const sorted = scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    res.json(sorted.slice(0, 3));
  } catch (error) { handleApiError(res, error, 'match-providers'); }
});

app.post('/api/generate-proposal', checkAuth, async (req, res) => {
  try {
    const { job, provider } = req.body;
    const prompt = `Gere uma mensagem de proposta profissional e amigável. Prestador: ${provider.name}, ${provider.headline}. Job: "${job.description}". A mensagem deve ser curta, se apresentar, mencionar o job e expressar confiança. Responda APENAS com o texto da mensagem.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt });
    res.json({ message: (response.text || '').trim() });
  } catch (error) { handleApiError(res, error, 'generate-proposal'); }
});

app.post('/api/generate-faq', checkAuth, async (req, res) => {
  try {
    const { job } = req.body;
    const prompt = `Gere 3 perguntas e respostas (FAQ) que um prestador poderia ter sobre o job: "${job.description}". Respostas devem ser sugestões para o cliente. Formato: Array JSON com {"question":"...","answer":"..."}. Responda APENAS com o array JSON.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON(response.text, []));
  } catch (error) { handleApiError(res, error, 'generate-faq'); }
});

app.post('/api/identify-item', checkAuth, async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    const prompt = `Analise a imagem e extraia em JSON: "itemName", "category", "brand", "model", "serialNumber". Se não souber, retorne string vazia. Responda APENAS com o JSON.`;
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: { parts: [{ text: prompt }, imagePart] }, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON(response.text, { itemName: '', category: '', brand: '', model: '', serialNumber: '' }));
  } catch (error) { handleApiError(res, error, 'identify-item'); }
});

app.post('/api/enhance-profile', checkAuth, async (req, res) => {
  try {
    const { profile } = req.body;
    const prompt = `Otimize este perfil de prestador de serviços. Crie um "suggestedHeadline" (título profissional, curto e impactante) e um "suggestedBio" (biografia em primeira pessoa, destacando experiência e confiança). Perfil: Nome: ${profile.name}, Título Atual: "${profile.headline}", Bio Atual: "${profile.bio}". Responda APENAS com JSON contendo "suggestedHeadline" e "suggestedBio".`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON(response.text));
  } catch (error) { handleApiError(res, error, 'enhance-profile'); }
});

app.post('/api/generate-seo', checkAuth, async (req, res) => {
  try {
    const { user } = req.body;
    const prompt = `Gere conteúdo de SEO para a página de perfil público deste prestador: ${user.name}, ${user.headline}, localizado em ${user.location}. Crie um JSON com: "seoTitle" (ex: 'Carlos Pereira | Eletricista em São Paulo | SERVIO.AI'), "metaDescription" (até 160 caracteres), "publicHeadline" (uma versão mais amigável do título) e "publicBio" (versão da bio para clientes). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON(response.text));
  } catch (error) { handleApiError(res, error, 'generate-seo'); }
});

app.post('/api/summarize-reviews', checkAuth, async (req, res) => {
  try {
    const { providerName, reviews } = req.body;
    const prompt = `Resuma as seguintes avaliações para ${providerName} em um parágrafo conciso, destacando os pontos positivos mais comuns e eventuais pontos de melhoria. Avaliações: ${(reviews || []).map(r => `(${r.rating} estrelas) "${r.comment}"`).join('; ')}. Responda APENAS com o resumo.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt });
    res.json({ summary: (response.text || '').trim() });
  } catch (error) { handleApiError(res, error, 'summarize-reviews'); }
});

app.post('/api/generate-comment', checkAuth, async (req, res) => {
  try {
    const { category, rating, description } = req.body;
    const prompt = `Gere um comentário de avaliação para um serviço de "${category}" com nota ${rating}/5. A descrição do job era: "${description}". O comentário deve refletir a nota dada. Responda APENAS com o texto do comentário.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt });
    res.json({ comment: (response.text || '').trim() });
  } catch (error) { handleApiError(res, error, 'generate-comment'); }
});

app.post('/api/generate-tip', checkAuth, async (req, res) => {
  try {
    const { user } = req.body;
    const prompt = `Analise o perfil do prestador ${user.name} (título: ${user.headline}). Gere uma dica prática e curta para melhorar o perfil (até 200 caracteres). Responda APENAS com o texto.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt });
    res.json({ tip: (response.text || '').trim() });
  } catch (error) { handleApiError(res, error, 'generate-tip'); }
});

app.post('/api/generate-referral', checkAuth, async (req, res) => {
  try {
    const { senderName } = req.body;
    const prompt = `Gere um email de convite para um colega profissional se juntar à plataforma SERVIO.AI. O remetente é ${senderName}. O email deve ser amigável e destacar os benefícios (mais clientes, pagamento seguro). Formato JSON com "subject" e "body". Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON(response.text));
  } catch (error) { handleApiError(res, error, 'generate-referral'); }
});

app.post('/api/generate-category-page', checkAuth, async (req, res) => {
  try {
    const { category, location } = req.body;
    const prompt = `Gere conteúdo para uma página de categoria de serviços (landing page). Categoria: "${category}" ${location ? `em "${location}"` : ''}. Crie um JSON com: "title" (título), "introduction" (parágrafo introdutório) e "faq" (array de 3 objetos {question, answer}). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON(response.text));
  } catch (error) { handleApiError(res, error, 'generate-category-page'); }
});

app.post('/api/suggest-maintenance', checkAuth, async (req, res) => {
  try {
    const { item } = req.body;
    const prompt = `Este item (${item.name}, marca ${item.brand}, categoria ${item.category}) foi adicionado em ${item.createdAt}. Com base no tipo e idade do item, há manutenção preventiva recomendada? Se sim, retorne JSON com "suggestionTitle" e "jobDescription". Se não, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON(response.text));
  } catch (error) { handleApiError(res, error, 'suggest-maintenance'); }
});

app.post('/api/propose-schedule', checkAuth, async (req, res) => {
  try {
    const { messages } = req.body;
    const prompt = `Analise este chat e veja se um dia e hora específicos foram combinados para um serviço. Chat: ${(messages || []).map(m => `${m.senderId}: "${m.text}"`).join(' | ')}. Se encontrar uma data e hora claras, retorne JSON com "date" (YYYY-MM-DD) e "time" (HH:MM). Caso contrário, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON((response.text || '').trim()));
  } catch (error) { handleApiError(res, error, 'propose-schedule'); }
});

app.post('/api/get-chat-assistance', checkAuth, async (req, res) => {
  try {
    const { messages, currentUserType } = req.body;
    const prompt = `Você é um assistente de chat para a plataforma SERVIO.AI. Analise o chat: ${(messages || []).map(m => `${m.senderId}: "${m.text}"`).join(' | ')}. O usuário atual é um ${currentUserType}. Sugira a próxima ação lógica em formato JSON com "name" ('clarify_scope', 'propose_schedule', 'summarize_agreement'), "args" (objeto com dados relevantes) e "displayText" (texto para o botão). Se não houver sugestão clara, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON((response.text || '').trim()));
  } catch (error) { handleApiError(res, error, 'get-chat-assistance'); }
});

app.post('/api/suggest-chat-reply', checkAuth, async (req, res) => {
  try {
    const { messages, currentUserType } = req.body;
    if (!messages || !currentUserType || messages.length === 0) {
      return res.status(400).json({ error: 'Histórico de mensagens e tipo de usuário são obrigatórios.' });
    }

    const prompt = `Você é um assistente de comunicação para a plataforma SERVIO.AI. Analise o histórico do chat entre um cliente e um prestador de serviço. O usuário atual é um "${currentUserType}". Com base na última mensagem, sugira até 3 respostas curtas, úteis e profissionais para ele. Retorne um array JSON de strings. Se não houver sugestão clara, retorne um array vazio. Histórico: ${messages.map(m => `${m.senderId === 'system' ? 'Sistema' : (m.senderId.includes('cliente') ? 'Cliente' : 'Prestador')}: "${m.text}"`).join(' | ')}. Responda APENAS com o array JSON.`;
    
    const response = await ai.models.generateContent({ 
      model: MODEL_FAST, 
      contents: prompt, 
      config: { responseMimeType: 'application/json' } 
    });
    
    res.json(safeJSON(response.text, []));
  } catch (error) { 
    handleApiError(res, error, 'suggest-chat-reply'); 
  }
});

app.post('/api/analyze-sentiment', checkAuth, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || messages.length < 2) {
      return res.json(null); // Não analisa chats muito curtos
    }

    const prompt = `Você é um analista de sentimento para a plataforma SERVIO.AI. Analise o tom geral do chat entre um cliente e um prestador. O histórico é: ${messages.map(m => `${m.senderId.includes('cliente') ? 'Cliente' : 'Prestador'}: "${m.text}"`).join(' | ')}. Retorne um JSON com "sentiment" ('positivo', 'neutro', 'negativo', 'frustrado'), "isAlertable" (boolean, true se for negativo ou frustrado) e "reason" (explicação curta). Responda APENAS com o JSON.`;
    
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON(response.text));
  } catch (error) { handleApiError(res, error, 'analyze-sentiment'); }
});

app.post('/api/generate-earnings-tip', checkAuth, async (req, res) => {
  try {
    // Em um app real, buscaríamos o usuário e suas estatísticas do DB
    const { userId } = req.body; 
    const prompt = `Sou um prestador de serviço na plataforma SERVIO.AI. Meu email é ${userId}. Quero aumentar meus ganhos. Analise meu perfil (hipoteticamente, se não tiver acesso) e me dê uma dica curta, prática e motivacional sobre o que focar primeiro para melhorar meu percentual de ganhos. Seja específico, por exemplo, 'focar em conseguir boas avaliações para atingir o bônus de 2%'. Responda APENAS com o texto da dica.`;
    
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt });
    res.json({ tip: (response.text || 'Concentre-se em oferecer um excelente atendimento para garantir avaliações de 5 estrelas. Isso não só atrai mais clientes, mas também aumenta seus ganhos!').trim() });

  } catch (error) {
    handleApiError(res, error, 'generate-earnings-tip');
  }
});

app.post('/api/parse-search', checkAuth, async (req, res) => {
  try {
    const { query } = req.body;
    const prompt = `Analise a busca: "${query}". Extraia em JSON: "service" (serviço principal), "location" (cidade ou bairro) e "attributes" (array de palavras-chave como 'certificado', 'verificado', 'urgente', 'imediata'). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON(response.text));
  } catch (error) { handleApiError(res, error, 'parse-search'); }
});

app.post('/api/extract-document', checkAuth, async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    const prompt = `Analise a imagem deste documento de identidade (RG ou CNH). Extraia em JSON o "fullName" e o "cpf". Se não encontrar, retorne strings vazias. Responda APENAS com o JSON.`;
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: { parts: [{ text: prompt }, imagePart] }, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON(response.text, { fullName: '', cpf: '' }));
  } catch (error) { handleApiError(res, error, 'extract-document'); }
});

app.post('/api/mediate-dispute', checkAuth, async (req, res) => {
  try {
    const { messages, clientName, providerName } = req.body;
    const prompt = `Você é um mediador de disputas da SERVIO.AI. Analise este chat de disputa entre ${clientName} (cliente) e ${providerName} (prestador): ${(messages || []).map(m => `${m.senderId === 'cliente@servio.ai' ? clientName : providerName}: "${m.text}"`).join(' | ')}. Gere um JSON com: "summary" (resumo imparcial do problema), "analysis" (análise dos pontos de cada um) e "suggestion" (sugestão de resolução). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model: MODEL_THINK, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON(response.text));
  } catch (error) { handleApiError(res, error, 'mediate-dispute'); }
});

app.post('/api/analyze-fraud', checkAuth, async (req, res) => {
  try {
    const { provider, context } = req.body; // context: { type, data }
    const prompt = `Analise esta ação para comportamento potencialmente fraudulento. Ação: ${context.type}, Dados: ${JSON.stringify(context.data)}. Prestador: ${provider.name}. Padrões suspeitos incluem propostas muito baixas, atualizações de perfil inconsistentes, etc. Retorne JSON com "isSuspicious" (boolean), "riskScore" (0-100) e "reason" (explicação). Se não for suspeito, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON((response.text || '').trim()));
  } catch (error) { handleApiError(res, error, 'analyze-fraud'); }
});

app.post('/api/analyze-provider-behavior', checkAuth, async (req, res) => {
  try {
    const { provider, contextAction } = req.body; // contextAction: { type, data }
    const prompt = `Analise o comportamento de um prestador quanto a potencial fraude/baixa qualidade. Ação: ${contextAction.type}, Dados: ${JSON.stringify(contextAction.data)}. Perfil: nome "${provider.name}", especialidades "${(provider.specialties || []).join(', ')}", bio "${provider.bio}". Retorne JSON com "isSuspicious" (boolean), "riskScore" (0-100) e "reason". Se não for suspeito, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt, config: { responseMimeType: 'application/json' } });
    res.json(safeJSON((response.text || '').trim()));
  } catch (error) { handleApiError(res, error, 'analyze-provider-behavior'); }
});

// Catch-all (optional): serve index.html if present; otherwise 404
app.get('*', (req, res) => {
  const index = path.join(__dirname, 'index.html');
  res.sendFile(index, (err) => {
    if (err) res.status(404).send('Not Found');
  });
});

app.listen(port, () => {
  console.log(`AI Server listening on port ${port}`);
});
