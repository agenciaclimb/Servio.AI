const express = require('express');
const path = require('path');
const { GoogleGenAI, Type } = require('@google/genai');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Chave de API - No Cloud Run, isso será configurado como uma variável de ambiente
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '/')));

// =================================================================
// ROTAS DA API
// =================================================================

const handleApiError = (res, error, apiName) => {
  console.error(`Error in ${apiName}:`, error);
  res.status(500).json({ error: `Falha na API: ${apiName}.` });
};

app.post('/api/enhance-job', async (req, res) => {
  try {
    const { prompt, address, fileCount } = req.body;
    const requestPrompt = `Analise a solicitação: "${prompt}", endereço: "${address || 'N/A'}", ${fileCount || 0} mídias. Estruture em JSON com "enhancedDescription" (descrição clara com placeholders como "[INFORMAR MEDIDAS]"), "suggestedCategory" ('limpeza', 'reparos', etc.), e "suggestedServiceType" ('personalizado', 'tabelado', 'diagnostico'). Responda APENAS com o JSON.`;
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

app.post('/api/match-providers', async (req, res) => {
  try {
    const { job, allUsers } = req.body;
    const providers = allUsers.filter(u => u.type === 'prestador' && u.verificationStatus === 'verificado');
    const prompt = `Você é um assistente de matchmaking da SERVIO.AI. Encontre os 3 melhores prestadores para o job: { Categoria: ${job.category}, Descrição: "${job.description}", Localização: ${job.address || 'N/A'} }. Candidatos: ${providers.map(p => `{ email: "${p.email}", nome: "${p.name}", titulo: "${p.headline}", especialidades: "${p.specialties?.join(', ')}", local: "${p.location}"}`).join('; ')}. Avalie por relevância, especialidade e proximidade. Responda com um array JSON de até 3 objetos, cada um com "providerId" (o email), "compatibilityScore" (0-100), e "justification" (frase curta e convincente). Responda APENAS com o array JSON.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    const results = JSON.parse(response.text);
    const finalResults = results.map(r => {
        const providerProfile = allUsers.find(u => u.email === r.providerId);
        return {
            ...r,
            provider: {
                id: providerProfile.email, name: providerProfile.name, service: providerProfile.headline,
                location: providerProfile.location, rating: 4.5, bio: providerProfile.bio, headline: providerProfile.headline
            }
        };
    });
    res.json(finalResults);
  } catch (error) { handleApiError(res, error, 'match-providers'); }
});

app.post('/api/generate-proposal', async (req, res) => {
  try {
    const { job, provider } = req.body;
    const prompt = `Gere uma mensagem de proposta profissional e amigável. Prestador: ${provider.name}, ${provider.headline}. Job: "${job.description}". A mensagem deve ser curta, se apresentar, mencionar o job e expressar confiança. Responda APENAS com o texto da mensagem.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    res.json({ message: response.text });
  } catch (error) { handleApiError(res, error, 'generate-proposal'); }
});

app.post('/api/generate-faq', async (req, res) => {
  try {
    const { job } = req.body;
    const prompt = `Gere 3 perguntas e respostas (FAQ) que um prestador poderia ter sobre o job: "${job.description}". Respostas devem ser sugestões para o cliente. Formato: Array JSON com {"question": "...", "answer": "..."}. Responda APENAS com o array JSON.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'generate-faq'); }
});

app.post('/api/identify-item', async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    const prompt = `Analise a imagem e extraia em JSON: "itemName", "category", "brand", "model", "serialNumber". Se não souber, retorne string vazia. Responda APENAS com o JSON.`;
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const response = await ai.models.generateContent({ model, contents: { parts: [{ text: prompt }, imagePart] }, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'identify-item'); }
});

app.post('/api/enhance-profile', async (req, res) => {
  try {
    const { profile } = req.body;
    const prompt = `Otimize este perfil de prestador de serviços. Crie um "suggestedHeadline" (título profissional, curto e impactante) e um "suggestedBio" (biografia em primeira pessoa, destacando experiência e confiança). Perfil: Nome: ${profile.name}, Título Atual: "${profile.headline}", Bio Atual: "${profile.bio}". Responda em JSON com "suggestedHeadline" e "suggestedBio". Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'enhance-profile'); }
});

app.post('/api/generate-seo', async (req, res) => {
  try {
    const { user } = req.body;
    const prompt = `Gere conteúdo de SEO para a página de perfil público deste prestador: ${user.name}, ${user.headline}, localizado em ${user.location}. Crie um JSON com: "seoTitle" (ex: 'Carlos Pereira | Eletricista em São Paulo | SERVIO.AI'), "metaDescription" (até 160 caracteres), "publicHeadline" (uma versão mais amigável do título), e "publicBio" (versão da bio para clientes). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'generate-seo'); }
});

app.post('/api/summarize-reviews', async (req, res) => {
  try {
    const { providerName, reviews } = req.body;
    const prompt = `Resuma as seguintes avaliações para ${providerName} em um parágrafo conciso, destacando os pontos positivos mais comuns e eventuais pontos de melhoria. Avaliações: ${reviews.map(r => `(${r.rating} estrelas) "${r.comment}"`).join('; ')}. Responda APENAS com o resumo em texto.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    res.json({ summary: response.text });
  } catch (error) { handleApiError(res, error, 'summarize-reviews'); }
});

app.post('/api/generate-comment', async (req, res) => {
  try {
    const { rating, category, description } = req.body;
    const prompt = `Gere um comentário de avaliação para um serviço de "${category}" com nota ${rating}/5. A descrição do job era: "${description}". O comentário deve refletir a nota dada. Responda APENAS com o texto do comentário.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    res.json({ comment: response.text });
  } catch (error) { handleApiError(res, error, 'generate-comment'); }
});

app.post('/api/generate-tip', async (req, res) => {
  try {
    const { user } = req.body;
    const prompt = `Gere uma dica rápida e acionável para o prestador ${user.name} melhorar seu perfil na SERVIO.AI. Considere o que está faltando: Título: ${user.headline ? 'OK' : 'Falta'}, Bio: ${user.bio ? 'OK' : 'Falta'}, Especialidades: ${user.specialties?.length > 0 ? 'OK' : 'Falta'}, Portfolio: ${user.portfolio?.length > 0 ? 'OK' : 'Falta'}. Responda APENAS com o texto da dica.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    res.json({ tip: response.text });
  } catch (error) { handleApiError(res, error, 'generate-tip'); }
});

app.post('/api/generate-referral', async (req, res) => {
  try {
    const { senderName } = req.body;
    const prompt = `Gere um email de convite para um colega profissional se juntar à plataforma SERVIO.AI. O remetente é ${senderName}. O email deve ser amigável e destacar os benefícios (mais clientes, pagamento seguro). Formato JSON com "subject" e "body". Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'generate-referral'); }
});

app.post('/api/generate-category-page', async (req, res) => {
  try {
    const { category, location } = req.body;
    const prompt = `Gere conteúdo para uma página de categoria de serviços (landing page). Categoria: "${category}" ${location ? `em "${location}"` : ''}. Crie um JSON com: "title" (título da página, ex: 'Encontre os Melhores Eletricistas em São Paulo'), "introduction" (parágrafo introdutório sobre a importância do serviço), e "faq" (array de 3 objetos com "question" e "answer"). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'generate-category-page'); }
});

app.post('/api/suggest-maintenance', async (req, res) => {
  try {
    const { item } = req.body;
    const prompt = `Este item (${item.name}, marca ${item.brand}, categoria ${item.category}) foi adicionado em ${item.createdAt}. Com base no tipo de item e na data, há alguma manutenção preventiva recomendada (ex: limpeza anual de ar condicionado)? Se sim, retorne um JSON com "suggestionTitle" (ex: "Limpeza de Filtros") e "jobDescription" (descrição pré-preenchida para o job). Se não, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text.trim() || 'null'));
  } catch (error) { handleApiError(res, error, 'suggest-maintenance'); }
});

app.post('/api/propose-schedule', async (req, res) => {
  try {
    const { messages } = req.body;
    const prompt = `Analise este chat e veja se um dia e hora específicos foram combinados para um serviço. Chat: ${messages.map(m => `${m.senderId}: "${m.text}"`).join(' | ')}. Se encontrar uma data e hora claras, retorne um JSON com "date" (YYYY-MM-DD) e "time" (HH:MM). Caso contrário, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text.trim() || 'null'));
  } catch (error) { handleApiError(res, error, 'propose-schedule'); }
});

app.post('/api/get-chat-assistance', async (req, res) => {
  try {
    const { messages, currentUserType } = req.body;
    const prompt = `Você é um assistente de chat para a plataforma SERVIO.AI. Analise o chat: ${messages.map(m => `${m.senderId}: "${m.text}"`).join(' | ')}. O usuário atual é um ${currentUserType}. Sugira a próxima ação lógica em formato JSON com "name" ('clarify_scope', 'propose_schedule', 'summarize_agreement'), "args" (objeto com dados relevantes), e "displayText" (texto para o botão). Se não houver sugestão clara, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text.trim() || 'null'));
  } catch (error) { handleApiError(res, error, 'get-chat-assistance'); }
});

app.post('/api/parse-search', async (req, res) => {
  try {
    const { query } = req.body;
    const prompt = `Analise a busca: "${query}". Extraia em JSON: "service" (serviço principal), "location" (cidade ou bairro), e "attributes" (array de palavras-chave como 'certificado', 'verificado', 'urgente', 'imediata'). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'parse-search'); }
});

app.post('/api/extract-document', async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    const prompt = `Analise a imagem deste documento de identidade (RG ou CNH). Extraia em JSON o "fullName" e o "cpf". Se não encontrar, retorne strings vazias. Responda APENAS com o JSON.`;
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const response = await ai.models.generateContent({ model, contents: { parts: [{ text: prompt }, imagePart] }, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'extract-document'); }
});

app.post('/api/mediate-dispute', async (req, res) => {
  try {
    const { messages, clientName, providerName } = req.body;
    const prompt = `Você é um mediador de disputas da SERVIO.AI. Analise este chat de disputa entre ${clientName} (cliente) e ${providerName} (prestador): ${messages.map(m => `${m.senderId === 'cliente@servio.ai' ? clientName : providerName}: "${m.text}"`).join(' | ')}. Gere um JSON com: "summary" (resumo imparcial do problema), "analysis" (análise dos pontos de cada um), e "suggestion" (sugestão de resolução, como reembolso parcial, total ou pagamento ao prestador). Responda APENAS com o JSON.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text));
  } catch (error) { handleApiError(res, error, 'mediate-dispute'); }
});

app.post('/api/analyze-fraud', async (req, res) => {
  try {
    const { provider, context } = req.body;
    const prompt = `Analise esta ação para comportamento potencialmente fraudulento. Ação: ${context.type}, Dados: ${JSON.stringify(context.data)}. Prestador: ${provider.name}. Padrões suspeitos incluem propostas muito baixas, atualizações de perfil com informações inconsistentes, etc. Retorne JSON com "isSuspicious" (boolean), "riskScore" (0-100), e "reason" (explicação). Se não for suspeito, retorne null. Responda APENAS com o JSON ou null.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text.trim() || 'null'));
  } catch (error) { handleApiError(res, error, 'analyze-fraud'); }
});


// =================================================================
// Rota "catch-all" para servir o index.html
// =================================================================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor ouvindo na porta ${port}`);
});
