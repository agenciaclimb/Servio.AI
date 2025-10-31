const express = require('express');
const path = require('path');
const { GoogleGenAI, Type } = require('@google/genai');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Middleware de autenticação para o backend de IA
const checkAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
      // Apenas verifica se o token é válido, não precisamos do usuário em si para a IA
      await admin.auth().verifyIdToken(idToken);
      return next();
    } catch (error) {
      console.error('Error while verifying Firebase ID token for AI API:', error);
      return res.status(403).send('Unauthorized: Invalid Token');
    }
  } else {
    return res.status(401).send('Unauthorized: No Token Provided');
  }
};

// Chave de API - No Cloud Run, isso será configurado como uma variável de ambiente
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

// 
const handleApiError = (res, error, apiName) => {
  console.error(`Error in ${apiName}:`, error);
  res.status(500).json({ error: `Falha na API: ${apiName}.` });
};

app.post('/api/enhance-job', checkAuth, async (req, res) => {
      const { prompt, address, fileCount } = req.body;
"${prompt}", endereço: "${address || 'N/A'}", ${fileCount || 0} mídias. Estruture em JSON com "enhancedDescription" (descrição clara com placeholders como "[INFORMAR MEDIDAS]"), "suggestedCategory" ('limpeza', 'reparos', etc.), e "suggestedServiceType" ('personalizado', 'tabelado', 'diagnostico'). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({
      model, contents: requestPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enhancedDescription: { type: Type.STRING },
            suggestedCategory: { type: Type.STRING },
            suggestedServiceType: { type: Type.STRING }
          },
          required: ["enhancedDescription", "suggestedCategory", "suggestedServiceType"]
        }
      }
    });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'enhance-job'); }
});

const calculateCompatibilityScore = async (job, provider) => {
    const weights = {
        proximity: 0.25,
        availability: 0.20,
        specialty: 0.15,
        keywordRelevance: 0.15,
        rating: 0.10,
        certificates: 0.05,
        criminalRecord: 0.05,
        platformActivity: 0.05,
    };

    // 1. Proximity (Simulated)
    const proximityScore = (job.address && provider.location && job.address.includes(provider.location.split(',')[1].trim())) ? 100 : 30;

    // 2. Availability
    const availabilityMap = { 'hoje': 100, 'amanha': 80, '3dias': 60, '1semana': 40 };
    const availabilityScore = availabilityMap[job.urgency] || 50;

    // 3. Specialty Match
    const specialtyScore = provider.specialties?.some(s => job.category.toLowerCase().includes(s.toLowerCase())) ? 100 : 0;

    // 4. Keyword Relevance (using AI)
    const relevanceResponse = await fetch('http://localhost:8080/api/analyze-relevance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: job.description, providerProfile: { headline: provider.headline, bio: provider.bio } }),
    });
    const { relevanceScore } = await relevanceResponse.json();

    // 5. Rating
    const ratingScore = provider.averageRating ? (provider.averageRating / 5) * 100 : 60; // Default score if no rating

    // 6. Certificates
    const certificatesScore = provider.hasCertificates ? 100 : 0;

    // 7. Criminal Record Check
    const criminalRecordScore = provider.hasCriminalRecordCheck ? 100 : 0;

    // 8. Platform Activity (Simulated by number of portfolio items)
    const platformActivityScore = Math.min((provider.portfolio?.length || 0) * 20, 100);

    // Final Weighted Score
    const finalScore = 
        (proximityScore * weights.proximity) +
        (availabilityScore * weights.availability) +
        (specialtyScore * weights.specialty) +
        (relevanceScore * weights.keywordRelevance) +
        (ratingScore * weights.rating) +
        (certificatesScore * weights.certificates) +
        (criminalRecordScore * weights.criminalRecord) +
        (platformActivityScore * weights.platformActivity);

    return Math.round(finalScore);
};

app.post('/api/match-providers', checkAuth, async (req, res) => {
  try {
    const { job, allUsers } = req.body;
    const providers = allUsers.filter(u => u.type === 'prestador' && u.verificationStatus === 'verificado');
v  mise.all(providers.map(async (provider) => {
        const score = await calculateCompatibilityScore(job, provider);
        return {
            providerId: provider.email,
            compatibilityScore: score,
            justification: `Excelente combinação de especialidade e disponibilidade.`, // This could also be generated by AI
            provider: provider
        };
    }));

    const sortedProviders = scoredProviders.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    res.json(sortedProviders.slice(0, 3));
  } catch (error) { handleApiError(res, error, 'match-providers'); }
});

app.post('/api/generate-proposal', checkAuth, async (req, res) => {
  try {
    const { job, provider } = req.body;
    const prompt = `Gere uma mensagem de proposta profissional e amigável. Prestador: ${provider.name}, ${provider.headline}. Job: "${job.description}". A mensagem deve ser curta, se apresentar, mencionar o job e expressar confiança. Responda APENAS com o texto da mensagem.`;

  } catch (error) { handleApiError(res, error, 'generate-proposal'); }
});

app.post('/api/analyze-relevance', checkAuth, async (req, res) => {
    try {
        const { jobDescription, providerProfile } = req.body;
        const prompt = `Analise a relevância do perfil de um prestador para um serviço. Job: "${jobDescription}". Perfil: Título: "${providerProfile.headline}", Bio: "${providerProfile.bio}". Retorne um JSON com "relevanceScore" (um número de 0 a 100). Responda APENAS com o JSON.`;
        const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
        res.json(JSON.parse(response.text));
    } catch (error) {analyze-relevance');
    }
});

app.post('/api/generate-faq', checkAuth, async (req, res) => {
  try {
    const { job } = req.body;
    const prompt = `Gere 3 perguntas e respostas (FAQ) que um prestador poderia ter sobre o job: "${job.description}". Respostas devem ser sugestões para o cliente. Formato: Array JSON com {"question": "...", "answer": "..."}. Responda APENAS com o array JSON.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'generate-faq'); }
});
app.post('/api/identify-item', checkAuth, async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    const prompt = `Analise a imagem e extraia em JSON: "itemName", "category", "brand", "model", "serialNumber". Se não souber, retorne string vazia. Responda APENAS com o JSON.`;
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const response = await ai.models.generateContent({ model, contents: { parts: [{ text: prompt }, imagePart] }, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));


app.post('/api/enhance-profile', checkAuth, async (req, res) => {
  try {
    const { profile } = req.body;
    const prompt = `Otimize este perfil de prestador de serviços. Crie um "suggestedHeadline" (título profissional, curto e impactante) e um "suggestedBio" (biografia em primeira pessoa, destacando experiência e confiança). Perfil: Nome: ${profile.name}, Título Atual: "${profile.headline}", Bio Atual: "${profile.bio}". Responda em JSON com "suggestedHeadline" e "suggestedBio". Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'enhance-profile'); }
});

app.post('/api/generate-seo', chet
    const { user } = req.body;
    const prompt = `Gere conteúdo de SEO para a página de perfil público deste prestador: ${user.name}, ${user.headline}, localizado em ${user.location}. Crie um JSON com: "seoTitle" (ex: 'Carlos Pereira | Eletricista em São Paulo | SERVIO.AI'), "metaDescription" (até 160 caracteres), "publicHeadline" (uma versão mais amigável do título), e "publicBio" (versão da bio para clientes). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'generate-seo'); }
});
app.post('/api/summarize-reviews', checkAuth, async (req, res) => {

    const { providerName, reviews } = req.body;
    const prompt = `Resuma as seguintes avaliações para ${providerName} em um parágrafo conciso, destacando os pontos positivos mais comuns e eventuais pontos de melhoria. Avaliações: ${reviews.map(r => `(${r.rating} estrelas) "${r.comment}"`).join('; ')}. Responda APENAS com o resumo em texto.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    res.json({ summary: response.text });
  } catch (error) { handleApiError(res, error, 'summarize-reviews'); }
});

app  try {

    const prompt = `Gere um comentário de avaliação para um serviço de "${category}" com nota ${rating}/5. A descrição do job era: "${description}". O comentário deve refletir a nota dada. Responda APENAS com o texto do comentário.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    res.json({ comment: response.text });
  } catch (error) { handleApiError(res, error, 'generate-comment'); }
});

app.post('/api/generate-tip', checkAuth, async (req, res) => {
  try {
    const { user } = req.body;
    const prompt = `Gere uma dica ds.generateContent({ model, contents: prompt });
    res.json({ tip: response.text });
  } catch (error) { handleApiError(res, error, 'generate-tip'); }
});

app.post('/api/generate-referral', checkAuth, async (req, res) => {
  try {
    const { senderName } = req.body;
    const prompt = `Gere um email de convite para um colega profissional se juntar à plataforma SERVIO.AI. O remetente é ${senderName}. O email deve ser amigável e destacar os benefícios (mais clientes, pagamento seguro). Formato JSON com "subject" e "body". Responda APENAS com o JSON.`;
    const response = await ai.le.text));
  } catch (error) { handleApiError(res, error, 'generate-referral'); }
});

app.post('/api/generate-category-page', checkAuth, async (req, res) => {
  try {
    const { category, location } = req.body;
    const prompt = `Gere conteúdo para uma página de categoria de serviços (landing page). Categoria: "${category}" ${location ? `em "${location}"` : ''}. Crie um JSON com: "title" (título da página, ex: 'Encontre os Melhores Eletricistas em São Paulo'), "introduction" (parágrafo introdutório sobre a importância do serviço), e "faq" (array de 3 objetos com "question" e "answer"). Responda APENAS com o JSON.`;

  } catch (error) { handleApiError(res, error, 'generate-category-page'); }
});

app.post('/api/suggest-maintenance', checkAuth, async (req, res) => {
  try {
    const { item } = req.body;
    const prompt = `Este item (${item.name}, marca ${item.brand}, categoria ${item.category}) foi adicionado em ${item.createdAt}. Com base no tipo de item e na data, há alguma manutenção preventiva recomendada (ex: limpeza anual de ar condicionado)? Se sim, retorne um JSON com "suggestionTitle" (ex: "Limpeza de Filtros") e "jobDescription" (descrição pré-preenchida para o job). Se não, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
enance'); }
});

app.post('/api/propose-schedule', checkAuth, async (req, res) => {
  try {
    const { messages } = req.body;
    const prompt = `Analise este chat e veja se um dia e hora específicos foram combinados para um serviço. Chat: ${messages.map(m => `${m.senderId}: "${m.text}"`).join(' | ')}. Se encontrar uma data e hora claras, retorne um JSON com "date" (YYYY-MM-DD) e "time" (HH:MM). Caso contrário, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text.trim() || 'null'));
  } catch (error) { handleApiError(res, error, 'propose-schedule'); }
});
app.post('/api/get-chat-assistance', checkAuth, async (req, res) => {
  try {
    const { messages, currentUserType } = req.body;
    const prompt = `Você é um assistente de chat para a plataforma SERVIO.AI. Analise o chat: ${messages.map(m => `${m.senderId}: "${m.text}"`).join(' | ')}. O usuário atual é um ${currentUserType}. Sugira a próxima ação lógica em formato JSON com "name" ('clarify_scope', 'propose_schedule', 'summarize_agreement'), "args" (objeto com dados relevantes), e "displayText" (texto para o botão). Se não houver sugestão clara, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text.trim() || 'null'));
  }});

app.post('/api/parse-search', checkAuth, async (req, res) => {
  try {
    const { query } = req.body;
    const prompt = `Analise a busca: "${query}". Extraia em JSON: "service" (serviço principal), "location" (cidade ou bairro), e "attributes" (array de palavras-chave como 'certificado', 'verificado', 'urgente', 'imediata'). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'parse-search'); }
});
es) => {
  try {
    const { base64Image, mimeType } = req.body;
    const prompt = `Analise a imagem deste documento de identidade (RG ou CNH). Extraia em JSON o "fullName" e o "cpf". Se não encontrar, retorne strings vazias. Responda APENAS com o JSON.`;
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const response = await ai.models.generateContent({ model, contents: { parts: [{ text: prompt }, imagePart] }, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'extract-document'); }
});
req, res) => {
  try {
    const { messages, clientName, providerName } = req.body;
    const prompt = `Você é um mediador de disputas da SERVIO.AI. Analise este chat de disputa entre ${clientName} (cliente) e ${providerName} (prestador): ${messages.map(m => `${m.senderId === 'cliente@servio.ai' ? clientName : providerName}: "${m.text}"`).join(' | ')}. Gere um JSON com: "summary" (resumo imparcial do problema), "analysis" (análise dos pontos de cada um), e "suggestion" (sugestão de resolução, como reembolso parcial, total ou pagamento ao prestador). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'mediate-dispute'); }
});

app.post('/api/analyze-fraud', checkAuth, async (req, res) => {
  try {eq.body;
    const prompt = `Analise esta ação para comportamento potencialmente fraudulento. Ação: ${context.type}, Dados: ${JSON.stringify(context.data)}. Prestador: ${provider.name}. Padrões suspeitos incluem propostas muito baixas, atualizações de perfil com informações inconsistentes, etc. Retorne JSON com "isSuspicious" (boolean), "riskScore" (0-100), e "reason" (explicação). Se não for suspeito, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text.trim() || 'null'));
  } catch (error) { handleApiError(res, error, 'analyze-fraud'); }
});

app.post('/api/analyze-provider-behavior', checkAuth, async (req, res) => {
  t    const { provider, contextAction } = req.body; // contextAction: { type: 'PROPOSAL_SUBMITTED', data: { ... } }
to potencialmente fraudulento ou de baixa qualidade. Ação: ${contextAction.type}, Dados da Ação: ${JSON.stringify(contextAction.data)}. Perfil do Prestador: { nome: "${provider.name}", especialidades: "${provider.specialties?.join(', ')}", bio: "${provider.bio}" }. Padrões suspeitos incluem propostas genéricas, preços muito baixos/altos para o serviço, ou ações inconsistentes com o perfil. Retorne um JSON com "isSuspicious" (boolean), "riskScore" (0-100), e "reason" (explicação concisa). Se não for suspeito, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text.trim() || 'null'));
  } catch (error) {
    handleApiError(res, error, 'analyze-provider-behavior');
  }
});

// Servir arquivos estáticos do frontend


// =================================================================
// Rota "catch-all" para servir o index.html
// =================================================================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor ouvindo na porta ${port}`);
});
