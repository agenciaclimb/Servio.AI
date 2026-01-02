/**
 * RATE LIMITER MIDDLEWARE
 *
 * Implementa rate limiting em 4 níveis:
 * - Global: 1000 req/15min
 * - Auth: 5 tentativas/15min
 * - API: 100 req/min
 * - Payment: 10 req/min
 *
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter Global
 * Aplica limite para todas as requisições do sistema
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por janela
  message: {
    error: 'Muitas requisições. Tente novamente mais tarde.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutos',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests se for configuração especial
  skipSuccessfulRequests: false,
  // Handler customizado para logging
  handler: (req, res) => {
    console.warn(`[RATE_LIMIT] IP ${req.ip} excedeu limite global`);
    res.status(429).json({
      error: 'Muitas requisições. Tente novamente mais tarde.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutos',
    });
  },
});

/**
 * Rate Limiter para Auth (Login/Registro)
 * Protege contra brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por janela
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Não conta requisições bem-sucedidas (login válido)
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    console.warn(`[AUTH_RATE_LIMIT] IP ${req.ip} excedeu limite de tentativas de login`);
    res.status(429).json({
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutos',
    });
  },
});

/**
 * Rate Limiter para API (CRUD de recursos)
 * Protege contra spam de criação de recursos
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // máximo 100 requests por minuto
  message: {
    error: 'Muitas requisições para a API. Tente novamente em 1 minuto.',
    code: 'API_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minuto',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[API_RATE_LIMIT] IP ${req.ip} excedeu limite de API requests`);
    res.status(429).json({
      error: 'Muitas requisições para a API. Tente novamente em 1 minuto.',
      code: 'API_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minuto',
    });
  },
});

/**
 * Rate Limiter para Payments
 * Extra proteção para operações financeiras
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requests de payment por minuto
  message: {
    error: 'Muitas requisições de pagamento. Tente novamente em 1 minuto.',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minuto',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    console.warn(`[PAYMENT_RATE_LIMIT] IP ${req.ip} excedeu limite de payment requests`);
    res.status(429).json({
      error: 'Muitas requisições de pagamento. Tente novamente em 1 minuto.',
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minuto',
    });
  },
});

/**
 * Rate Limiter para webhooks (Stripe, SendGrid, etc.)
 * Proteção contra replay attacks
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 50, // máximo 50 webhooks por minuto
  message: {
    error: 'Muitos webhooks recebidos. Tente novamente em 1 minuto.',
    code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minuto',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[WEBHOOK_RATE_LIMIT] IP ${req.ip} excedeu limite de webhooks`);
    res.status(429).json({
      error: 'Muitos webhooks recebidos. Tente novamente em 1 minuto.',
      code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minuto',
    });
  },
});

/**
 * Função helper para criar limiters customizados
 * @param {Object} options - Opções do rate limiter
 * @param {number} options.windowMs - Janela de tempo em ms
 * @param {number} options.max - Máximo de requests na janela
 * @param {string} options.message - Mensagem de erro
 * @param {boolean} options.skipSuccessfulRequests - Pular requests bem-sucedidas
 * @returns {Function} Express middleware
 */
function createCustomLimiter({ windowMs, max, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message || 'Muitas requisições',
      code: 'CUSTOM_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      console.warn(`[CUSTOM_RATE_LIMIT] IP ${req.ip} excedeu limite customizado`);
      res.status(429).json({
        error: message || 'Muitas requisições',
        code: 'CUSTOM_RATE_LIMIT_EXCEEDED',
      });
    },
  });
}

module.exports = {
  globalLimiter,
  authLimiter,
  apiLimiter,
  paymentLimiter,
  webhookLimiter,
  createCustomLimiter,
};
