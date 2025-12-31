/**
 * CSRF PROTECTION MIDDLEWARE
 *
 * Proteção contra Cross-Site Request Forgery usando csrf-csrf (moderna)
 * - Double CSRF tokens (cookie + header)
 * - Cookies HttpOnly com prefix __Host-
 * - Exclusão automática de webhooks
 * - Rotação de tokens
 *
 * @module middleware/csrfProtection
 */

const { doubleCsrf } = require('csrf-csrf');
const cookieParser = require('cookie-parser');

/**
 * Configuração do double CSRF
 */
const csrfSecret = process.env.CSRF_SECRET;

if (!csrfSecret && process.env.NODE_ENV === 'production') {
  throw new Error(
    'CSRF_SECRET environment variable must be set in production. ' +
      'Please configure a strong, random secret of at least 64 characters.'
  );
}

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => csrfSecret || 'change-me-in-production-random-64-chars-minimum',
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000, // 1 hora
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

/**
 * Middleware para adicionar token CSRF ao response
 */
function addCsrfToken(req, res, next) {
  try {
    const token = generateToken(req, res);
    res.locals.csrfToken = token;
    res.setHeader('X-CSRF-Token', token);
    next();
  } catch (error) {
    console.error('[CSRF] Erro ao gerar token:', error);
    return res.status(500).json({
      error: 'Erro ao gerar token de segurança',
      code: 'CSRF_GENERATION_ERROR',
    });
  }
}

/**
 * Middleware para exemption de CSRF em rotas específicas
 * @param {Array<string>} exemptPaths - Paths que não precisam de CSRF
 */
function csrfExempt(exemptPaths = []) {
  return (req, res, next) => {
    const path = req.path || req.url;
    const isExempt = exemptPaths.some(exemptPath => {
      if (exemptPath.endsWith('*')) {
        const prefix = exemptPath.slice(0, -1);
        return path.startsWith(prefix);
      }
      return path === exemptPath;
    });

    if (isExempt) {
      console.log(`[CSRF] Exempting path: ${path}`);
      return next();
    }

    return doubleCsrfProtection(req, res, next);
  };
}

/**
 * Error handler para erros de CSRF
 */
function csrfErrorHandler(err, req, res, next) {
  if (err.code === 'EBADCSRFTOKEN' || err.message.includes('csrf')) {
    console.warn('[CSRF] Token inválido ou ausente:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      headers: req.headers,
    });

    return res.status(403).json({
      error: 'Token CSRF inválido ou ausente',
      code: 'CSRF_VALIDATION_FAILED',
      message: 'Por favor, recarregue a página e tente novamente',
    });
  }

  next(err);
}

/**
 * Middleware para rotação de token CSRF
 * Gera novo token após operações sensíveis (login, logout, etc.)
 */
function rotateCsrfToken(req, res, next) {
  try {
    const newToken = generateToken(req, res, true); // Force new token
    res.setHeader('X-New-CSRF-Token', newToken);
    console.log('[CSRF] Token rotacionado para sessão:', req.sessionID || req.ip);
    next();
  } catch (error) {
    console.error('[CSRF] Erro ao rotacionar token:', error);
    // Não bloqueia requisição, apenas loga erro
    next();
  }
}

/**
 * Setup completo de CSRF protection
 * @param {Express.Application} app - Express app
 * @param {Object} options - Opções de configuração
 */
function setupCsrfProtection(app, options = {}) {
  const { exempt = ['/api/stripe-webhook', '/api/webhooks/*'], enableRotation = true } = options;

  // 1. Cookie parser (necessário para csrf-csrf)
  app.use(cookieParser());

  // 2. Aplicar CSRF com exemptions
  app.use(csrfExempt(exempt));

  // 3. Adicionar token em todas as respostas
  app.use(addCsrfToken);

  // 4. Error handler para CSRF
  app.use(csrfErrorHandler);

  console.log('[CSRF] Protection configurada com exemptions:', exempt);

  // 5. Rotação automática (opcional)
  if (enableRotation) {
    app.use('/api/login', rotateCsrfToken);
    app.use('/api/logout', rotateCsrfToken);
  }
}

/**
 * Endpoint para obter token CSRF
 * GET /api/csrf-token
 */
function createCsrfTokenEndpoint(app) {
  app.get('/api/csrf-token', (req, res) => {
    try {
      const token = generateToken(req, res);
      res.json({
        csrfToken: token,
        expiresIn: 3600000, // 1 hora em ms
      });
    } catch (error) {
      console.error('[CSRF] Erro ao gerar token no endpoint:', error);
      res.status(500).json({
        error: 'Erro ao gerar token',
        code: 'CSRF_GENERATION_ERROR',
      });
    }
  });
}

module.exports = {
  csrfProtection: doubleCsrfProtection,
  addCsrfToken,
  csrfExempt,
  csrfErrorHandler,
  rotateCsrfToken,
  setupCsrfProtection,
  createCsrfTokenEndpoint,
  generateToken,
};
