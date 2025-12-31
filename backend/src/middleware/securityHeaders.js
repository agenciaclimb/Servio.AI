/**
 * SECURITY HEADERS MIDDLEWARE
 *
 * Implementa headers de segurança usando helmet.js
 * - Content Security Policy (CSP)
 * - HSTS (HTTP Strict Transport Security)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 *
 * @module middleware/securityHeaders
 */

const helmet = require('helmet');

/**
 * Configuração de Content Security Policy
 */
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // TODO: Remover quando possível (usar nonces)
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://js.stripe.com',
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // TODO: Remover quando possível
    'https://fonts.googleapis.com',
  ],
  imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  connectSrc: [
    "'self'",
    'https://api.servio.ai',
    'https://servio-backend-v2-1000250760228.us-west1.run.app',
    'https://firestore.googleapis.com',
    'https://www.google-analytics.com',
    'https://api.stripe.com',
  ],
  frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  manifestSrc: ["'self'"],
  workerSrc: ["'self'", 'blob:'],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
  baseUri: ["'self'"],
  upgradeInsecureRequests: [],
};

/**
 * Middleware principal de headers de segurança
 */
const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: cspDirectives,
    reportOnly: false, // Mudar para true em desenvolvimento se necessário
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options (previne clickjacking)
  frameguard: {
    action: 'deny', // Ou 'sameorigin' se precisar de iframes
  },

  // X-Content-Type-Options (previne MIME sniffing)
  noSniff: true,

  // X-XSS-Protection (proteção XSS legada)
  xssFilter: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Remove X-Powered-By header (esconde tech stack)
  hidePoweredBy: true,

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },

  // IE No Open (previne download automático)
  ieNoOpen: true,

  // Don't Download IE from Other Sites
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
});

/**
 * Middleware de sanitização XSS
 * Remove tags HTML potencialmente perigosas de req.body
 */
const xss = require('xss');

function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Sanitizar strings
        req.body[key] = xss(req.body[key], {
          whiteList: {}, // Não permitir nenhuma tag HTML
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script', 'style'],
        });
      } else if (Array.isArray(req.body[key])) {
        // Sanitizar arrays de strings
        req.body[key] = req.body[key].map(item => {
          if (typeof item === 'string') {
            return xss(item, {
              whiteList: {},
              stripIgnoreTag: true,
            });
          }
          return item;
        });
      }
    });
  }

  next();
}

/**
 * Middleware para URLs query strings
 */
function sanitizeQuery(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key], {
          whiteList: {},
          stripIgnoreTag: true,
        });
      }
    });
  }

  next();
}

/**
 * Middleware para prevenir path traversal attacks
 */
function preventPathTraversal(req, res, next) {
  const suspiciousPatterns = [
    /\.\./g, // Parent directory references
    /\\/g, // Backslashes
    /~\//g, // Home directory references
    /%2e%2e/gi, // Encoded parent directory
    /%5c/gi, // Encoded backslash
  ];

  const checkString = str => {
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };

  // Verificar path
  if (checkString(req.path)) {
    return res.status(400).json({
      error: 'Invalid path detected',
      code: 'PATH_TRAVERSAL_ATTEMPT',
    });
  }

  // Verificar query params
  if (req.query) {
    const queryValues = Object.values(req.query).join('');
    if (checkString(queryValues)) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        code: 'PATH_TRAVERSAL_ATTEMPT',
      });
    }
  }

  next();
}

/**
 * Middleware para adicionar headers customizados de segurança
 */
function customSecurityHeaders(req, res, next) {
  // Prevenir MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Forçar HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Política de Permissions
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Cross-Origin Policies
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  next();
}

module.exports = {
  securityHeaders,
  sanitizeInput,
  sanitizeQuery,
  preventPathTraversal,
  customSecurityHeaders,
};
