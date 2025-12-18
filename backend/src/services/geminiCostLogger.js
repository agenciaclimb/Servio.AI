/**
 * Gemini AI Cost Logger
 * 
 * Track and log Gemini API usage metrics:
 * - Token count (input/output)
 * - Model used
 * - Latency
 * - Cost estimation
 * - Success/failure rates
 * 
 * Protocolo Supremo v4 - Task 2.2
 */

const { db } = require('../firebaseAdmin');

/**
 * Modelo de pricing Gemini (atualizado 12/2025)
 * Fonte: https://ai.google.dev/pricing
 */
const GEMINI_PRICING = {
  'gemini-2.0-flash-exp': {
    inputPer1M: 0,      // Free tier até 02/2025
    outputPer1M: 0,
  },
  'gemini-1.5-flash': {
    inputPer1M: 0.075,  // $0.075 por 1M tokens
    outputPer1M: 0.30,  // $0.30 por 1M tokens
  },
  'gemini-1.5-pro': {
    inputPer1M: 1.25,   // $1.25 por 1M tokens
    outputPer1M: 5.00,  // $5.00 por 1M tokens
  },
};

/**
 * Calcular custo estimado
 * @param {string} model - Nome do modelo
 * @param {number} inputTokens - Tokens de input
 * @param {number} outputTokens - Tokens de output
 * @returns {number} Custo em USD
 */
function calculateCost(model, inputTokens, outputTokens) {
  const pricing = GEMINI_PRICING[model] || GEMINI_PRICING['gemini-1.5-flash'];
  
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
  
  return inputCost + outputCost;
}

/**
 * Log de uso Gemini
 * @param {Object} params - Parâmetros do log
 * @param {string} params.endpoint - Endpoint chamado (/api/enhance-job, etc)
 * @param {string} params.model - Modelo usado
 * @param {number} params.latencyMs - Latência em ms
 * @param {number} params.inputTokens - Tokens de input
 * @param {number} params.outputTokens - Tokens de output
 * @param {boolean} params.success - Se a chamada foi bem-sucedida
 * @param {string} [params.error] - Mensagem de erro (se houver)
 * @param {string} [params.userId] - ID do usuário (email)
 * @returns {Promise<void>}
 */
async function logGeminiUsage({
  endpoint,
  model,
  latencyMs,
  inputTokens,
  outputTokens,
  success,
  error = null,
  userId = 'anonymous',
}) {
  try {
    const cost = calculateCost(model, inputTokens, outputTokens);
    
    const logEntry = {
      endpoint,
      model,
      latencyMs,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost,
      success,
      error,
      userId,
      timestamp: new Date().toISOString(),
    };

    // Salvar em Firestore (coleção gemini_logs)
    await db.collection('gemini_logs').add(logEntry);

    // Log estruturado no console (para Cloud Logging)
    console.log(JSON.stringify({
      severity: success ? 'INFO' : 'ERROR',
      message: `Gemini API call: ${endpoint}`,
      gemini: logEntry,
    }));
  } catch (logError) {
    // Não deixar erro de logging quebrar a aplicação
    console.error('Failed to log Gemini usage:', logError);
  }
}

/**
 * Middleware para capturar métricas Gemini
 * Usar DEPOIS da chamada Gemini, não antes
 * 
 * @param {string} endpoint - Nome do endpoint
 * @returns {Function} Wrapper function
 */
function withGeminiLogging(endpoint) {
  return async (geminiCallFn, userId = 'anonymous') => {
    const startTime = Date.now();
    let inputTokens = 0;
    let outputTokens = 0;
    let model = 'gemini-2.0-flash-exp'; // Default
    let success = false;
    let error = null;

    try {
      const result = await geminiCallFn();
      
      // Extrair métricas do resultado (se disponível)
      if (result?.usageMetadata) {
        inputTokens = result.usageMetadata.promptTokenCount || 0;
        outputTokens = result.usageMetadata.candidatesTokenCount || 0;
      }
      if (result?.model) {
        model = result.model;
      }

      success = true;
      return result;
    } catch (err) {
      error = err.message;
      throw err;
    } finally {
      const latencyMs = Date.now() - startTime;
      
      // Log assíncrono (não bloquear resposta)
      logGeminiUsage({
        endpoint,
        model,
        latencyMs,
        inputTokens,
        outputTokens,
        success,
        error,
        userId,
      }).catch(console.error);
    }
  };
}

/**
 * Obter estatísticas de uso (últimas 24h)
 * @returns {Promise<Object>} Estatísticas agregadas
 */
async function getUsageStats() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const snapshot = await db
    .collection('gemini_logs')
    .where('timestamp', '>=', oneDayAgo.toISOString())
    .get();

  const stats = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    totalCost: 0,
    totalTokens: 0,
    avgLatencyMs: 0,
    byModel: {},
    byEndpoint: {},
  };

  let totalLatency = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    stats.totalCalls++;
    stats.totalCost += data.cost || 0;
    stats.totalTokens += data.totalTokens || 0;
    totalLatency += data.latencyMs || 0;

    if (data.success) {
      stats.successfulCalls++;
    } else {
      stats.failedCalls++;
    }

    // Agregar por modelo
    if (!stats.byModel[data.model]) {
      stats.byModel[data.model] = { calls: 0, cost: 0 };
    }
    stats.byModel[data.model].calls++;
    stats.byModel[data.model].cost += data.cost || 0;

    // Agregar por endpoint
    if (!stats.byEndpoint[data.endpoint]) {
      stats.byEndpoint[data.endpoint] = { calls: 0, cost: 0 };
    }
    stats.byEndpoint[data.endpoint].calls++;
    stats.byEndpoint[data.endpoint].cost += data.cost || 0;
  });

  stats.avgLatencyMs = stats.totalCalls > 0 ? totalLatency / stats.totalCalls : 0;

  return stats;
}

module.exports = {
  logGeminiUsage,
  withGeminiLogging,
  getUsageStats,
  calculateCost,
  GEMINI_PRICING,
};
