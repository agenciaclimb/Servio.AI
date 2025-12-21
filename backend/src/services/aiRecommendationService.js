/**
 * AI Recommendation Service
 * Gera recomendações de ações para leads usando Google Gemini API
 * 
 * Funções:
 * - generateNextActions: Qual a melhor ação de contato para este lead?
 * - predictConversion: Qual a probabilidade de conversão?
 * - suggestFollowUpSequence: Qual a sequência recomendada de follow-ups?
 */

const { getPlacesApiKey } = require('../utils/secretHelper');

let cachedGeminiModel = null;

function shouldUseGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  const isExplicitlyDisabled = process.env.DISABLE_EXTERNAL_AI === 'true';
  return !!apiKey && !isTestEnv && !isExplicitlyDisabled;
}

function getGeminiModel() {
  if (!shouldUseGemini()) return null;
  if (cachedGeminiModel) return cachedGeminiModel;

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    cachedGeminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    return cachedGeminiModel;
  } catch (error) {
    console.warn('[aiRecommendationService] Gemini unavailable – running in deterministic mode');
    return null;
  }
}

async function hasPlacesKey() {
  try {
    const key = await getPlacesApiKey();
    return !!key;
  } catch {
    return false;
  }
}

/**
 * Gera próximas ações recomendadas para um lead
 * @param {Object} lead - Dados do lead
 * @param {Object} prospectorHistory - Histórico de interações do prospector com este lead
 * @returns {Promise<Object>} { action, template, timeToSend, confidence }
 */
async function generateNextActions(lead, prospectorHistory = []) {
  try {
    const model = getGeminiModel();

    if (!lead) {
      return {
        action: 'email',
        template: 'introduction',
        timeToSend: '09:00',
        confidence: 0.5,
        reason: 'Lead data missing',
      };
    }

    if (!model) {
      return {
        action: 'email',
        template: prospectorHistory.length > 0 ? 'follow-up' : 'introduction',
        timeToSend: '09:00',
        confidence: 0.6,
        reasoning: 'Gemini desabilitado (modo determinístico)',
      };
    }

    // Preparar contexto para Gemini
    const leadSummary = `
Lead: ${lead.name || 'Unknown'}
Categoria: ${lead.category || 'Not specified'}
Localização: ${lead.location?.city || 'Unknown'}, ${lead.location?.state || 'Unknown'}
Budget: ${lead.budget ? `R$ ${lead.budget}` : 'Not specified'}
Histórico de Contatos: ${prospectorHistory.length} interações

Últimas interações:
${prospectorHistory
  .slice(-3)
  .map((h) => `- ${h.type} em ${new Date(h.date).toLocaleDateString('pt-BR')}`)
  .join('\n')}
    `;

    const prompt = `Baseado no seguinte lead, qual é a ação de contato mais efetiva?

${leadSummary}

Responda em JSON:
{
  "action": "email|whatsapp|phone|linkedin|in-person",
  "template": "introduction|follow-up|proposal|check-in",
  "timeToSend": "HH:MM formato 24h (horário recomendado para enviar)",
  "confidence": número entre 0-1,
  "reasoning": "explicação breve da recomendação"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        action: parsed.action || 'email',
        template: parsed.template || 'introduction',
        timeToSend: parsed.timeToSend || '09:00',
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
        reasoning: parsed.reasoning || 'IA recommendation',
      };
    }

    return {
      action: 'email',
      template: 'introduction',
      timeToSend: '09:00',
      confidence: 0.5,
      reason: 'Could not parse AI response',
    };
  } catch (error) {
    console.error('Error generating next actions:', error);
    return {
      action: 'email',
      template: 'introduction',
      timeToSend: '09:00',
      confidence: 0,
      error: error.message,
    };
  }
}

/**
 * Prediz probabilidade de conversão para um lead
 * @param {Object} lead - Dados do lead
 * @param {number} leadScore - Score do lead (0-100)
 * @param {Object[]} prospectorHistory - Histórico de interações
 * @returns {Promise<Object>} { probability, factors, risk }
 */
async function predictConversion(lead, leadScore = 50, prospectorHistory = []) {
  try {
    const model = getGeminiModel();

    if (!lead) {
      return {
        probability: 0.2,
        factors: { score: 0, engagement: 0, recency: 0 },
        risk: 'high',
        reasoning: 'Insufficient lead data',
      };
    }

    // Calcular indicadores simples
    const recencyScore = calculateRecencyFactor(prospectorHistory);
    const engagementCount = prospectorHistory.length;

    if (!model) {
      const normalizedScore = Math.min(1, Math.max(0, leadScore / 100));
      const engagement = Math.min(1, engagementCount / 5);
      const probability = Math.min(1, Math.max(0, normalizedScore * 0.7 + engagement * 0.2 + recencyScore * 0.1));

      return {
        probability,
        factors: { leadScore, engagement, recency: recencyScore },
        risk: probability < 0.3 ? 'high' : probability < 0.6 ? 'medium' : 'low',
        recommendation: 'Modo determinístico: priorize follow-up e qualificação',
      };
    }

    const prompt = `Analise a probabilidade de conversão deste lead:

Lead: ${lead.name || 'Unknown'}
Categoria: ${lead.category || 'N/A'}
Score de Qualidade: ${leadScore}/100
Contatos Anteriores: ${engagementCount}
Recência (dias desde último contato): ${recencyScore}
Budget: ${lead.budget ? `R$ ${lead.budget}` : 'N/A'}
Tamanho da Empresa: ${lead.companySize || 'N/A'}

Responda em JSON:
{
  "probability": número entre 0-1 (probabilidade de conversão),
  "highRiskFactors": [array de fatores que aumentam risco],
  "positiveFactors": [array de fatores positivos],
  "timelineEstimate": "dias estimados para conversão",
  "recommendation": "ação sugerida para aumentar conversão"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const prob = Math.min(1, Math.max(0, parsed.probability || 0.3));

      return {
        probability: prob,
        factors: {
          leadScore,
          engagement: Math.min(1, engagementCount / 5), // Normalize to 0-1
          recency: recencyScore,
        },
        risk: prob < 0.3 ? 'high' : prob < 0.6 ? 'medium' : 'low',
        highRiskFactors: parsed.highRiskFactors || [],
        positiveFactors: parsed.positiveFactors || [],
        timeline: parsed.timelineEstimate || 'Unknown',
        recommendation: parsed.recommendation || 'Continue with current strategy',
      };
    }

    return {
      probability: leadScore / 100,
      factors: { score: leadScore / 100, engagement: Math.min(1, engagementCount / 5), recency: recencyScore },
      risk: leadScore > 70 ? 'low' : 'medium',
      recommendation: 'Based on lead score',
    };
  } catch (error) {
    console.error('Error predicting conversion:', error);
    return {
      probability: 0.5,
      factors: { score: 0.5, engagement: 0, recency: 0 },
      risk: 'unknown',
      error: error.message,
    };
  }
}

/**
 * Sugere sequência de follow-ups para um lead
 * @param {Object} lead - Dados do lead
 * @param {Object[]} pastActions - Ações já tomadas com este lead
 * @returns {Promise<Object>} { sequence: [{action, delay, message}] }
 */
async function suggestFollowUpSequence(lead, pastActions = []) {
  try {
    const model = getGeminiModel();

    if (!lead) {
      return {
        sequence: [
          { action: 'email', delay: '2 horas', step: 1, message: 'Introdução inicial' },
          { action: 'email', delay: '2 dias', step: 2, message: 'Follow-up com case study' },
          { action: 'phone', delay: '5 dias', step: 3, message: 'Contato direto' },
        ],
        reasoning: 'Default sequence - lead data missing',
      };
    }

    if (!model) {
      return {
        sequence: [
          {
            step: 1,
            action: 'email',
            delay: '2 horas',
            message: 'Follow-up',
            scheduledFor: calculateScheduledDate('2 horas'),
          },
          {
            step: 2,
            action: 'email',
            delay: '2 dias',
            message: 'Case study',
            scheduledFor: calculateScheduledDate('2 dias'),
          },
        ],
        reasoning: 'Gemini desabilitado (modo determinístico)',
      };
    }

    const actionsLog = pastActions
      .map((a) => `${a.type} em ${new Date(a.date).toLocaleDateString('pt-BR')}`)
      .slice(-3)
      .join(', ');

    const prompt = `Sugira uma sequência de follow-ups para este lead:

Lead: ${lead.name || 'Unknown'}
Categoria: ${lead.category || 'N/A'}
Ações Anteriores: ${actionsLog || 'Nenhuma'}
Urgência: ${lead.budget > 10000 ? 'Alta' : 'Normal'}

Responda em JSON:
{
  "sequence": [
    { "step": 1, "action": "email|whatsapp|phone", "delay": "X horas/dias", "message": "conteúdo sugerido" },
    { "step": 2, "action": "...", "delay": "...", "message": "..." }
  ],
  "reasoning": "por que esta sequência é efetiva"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        sequence: (parsed.sequence || []).map((step, idx) => ({
          step: idx + 1,
          action: step.action || 'email',
          delay: step.delay || '2 dias',
          message: step.message || 'Follow-up',
          scheduledFor: calculateScheduledDate(step.delay),
        })),
        reasoning: parsed.reasoning || 'IA-generated sequence',
      };
    }

    return {
      sequence: [
        { step: 1, action: 'email', delay: '2 horas', message: 'Initial follow-up', scheduledFor: new Date() },
        { step: 2, action: 'email', delay: '2 dias', message: 'Case study', scheduledFor: addDays(new Date(), 2) },
      ],
      reasoning: 'Default sequence',
    };
  } catch (error) {
    console.error('Error suggesting follow-up sequence:', error);
    return {
      sequence: [
        { step: 1, action: 'email', delay: '2 horas', message: 'Follow-up', scheduledFor: new Date() },
      ],
      error: error.message,
      reasoning: 'Error occurred',
    };
  }
}

/**
 * Helper: Calcula fator de recência (0-1)
 * @param {Object[]} history - Histórico de ações
 * @returns {number}
 */
function calculateRecencyFactor(history) {
  if (!history || history.length === 0) return 1; // Nunca foi contatado

  const lastAction = new Date(history[history.length - 1].date);
  const daysSinceLastAction = (Date.now() - lastAction.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLastAction <= 1) return 0.1; // Muito recente
  if (daysSinceLastAction <= 7) return 0.3;
  if (daysSinceLastAction <= 30) return 0.6;
  return 1; // Muito tempo atrás
}

/**
 * Helper: Calcula data de agendamento baseado em string de delay
 * @param {string} delayStr - Ex: "2 horas", "3 dias"
 * @returns {Date}
 */
function calculateScheduledDate(delayStr) {
  const now = new Date();

  if (delayStr.includes('hora')) {
    const hours = parseInt(delayStr) || 2;
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  if (delayStr.includes('dia')) {
    const days = parseInt(delayStr) || 1;
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  if (delayStr.includes('semana')) {
    const weeks = parseInt(delayStr) || 1;
    return new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
  }

  // Default: 2 horas
  return new Date(now.getTime() + 2 * 60 * 60 * 1000);
}

/**
 * Helper: Adiciona dias a uma data
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
function addDays(date, days) {
  const isMidnightUTC =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

  // Dates criadas via new Date('YYYY-MM-DD') são interpretadas como UTC.
  // Em timezones negativos isso vira "dia anterior" no horário local, quebrando testes.
  const looksLikeDateOnlyUTC =
    isMidnightUTC && (date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0);

  if (looksLikeDateOnlyUTC) {
    const baseUtc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    baseUtc.setUTCDate(baseUtc.getUTCDate() + days);
    return new Date(baseUtc.getUTCFullYear(), baseUtc.getUTCMonth(), baseUtc.getUTCDate());
  }

  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Gera recomendação completa para um lead
 * @param {Object} lead
 * @param {number} leadScore
 * @param {Object[]} history
 * @returns {Promise<Object>} Recomendação consolidada
 */
async function generateComprehensiveRecommendation(lead, leadScore = 50, history = []) {
  const [nextActions, conversion, followUpSequence] = await Promise.all([
    generateNextActions(lead, history),
    predictConversion(lead, leadScore, history),
    suggestFollowUpSequence(lead, history),
  ]);

  return {
    lead: {
      id: lead.id,
      name: lead.name,
      category: lead.category,
    },
    leadScore,
    recommendations: {
      nextAction: nextActions,
      conversionProbability: conversion.probability,
      conversionRisk: conversion.risk,
      followUpSequence: followUpSequence.sequence,
    },
    priority: conversion.probability > 0.7 ? 'high' : conversion.probability > 0.4 ? 'medium' : 'low',
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  generateNextActions,
  predictConversion,
  suggestFollowUpSequence,
  generateComprehensiveRecommendation,
  // Helpers
  calculateRecencyFactor,
  calculateScheduledDate,
  addDays,
};
