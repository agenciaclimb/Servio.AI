/**
 * CSRF PROTECTION MIDDLEWARE
 * 
 * Proteção contra Cross-Site Request Forgery usando tokens
 * - Gera tokens CSRF para cada sessão
 * - Valida tokens em requests POST/PUT/DELETE
 * - Exceções para webhooks e APIs públicas
 * 
 * @module middleware/csrfProtection
 */

const csrf = require('csurf');
const cookieParser = require('cookie-parser');

/**
 * Middleware de proteção CSRF
 * Usa cookies para armazenar tokens
 */
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
    sameSite: 'strict',
    maxAge: 3600000 // 1 hora
  }
});

/**
 * Middleware para adicionar token CSRF no response
 * Envia token no header e no body (para forms)
 */
function addCsrfToken(req, res, next) {
  if (req.csrfToken) {
    // Adicionar token no header
    res.setHeader('X-CSRF-Token', req.csrfToken());

    // Disponibilizar token para o cliente
    res.locals.csrfToken = req.csrfToken();
  }

  next();
}

/**
 * Middleware para exemp

ções CSRF
 * Rotas que não precisam de proteção CSRF (ex: webhooks)
 */
function csrfExempt(exemptPaths = []) {
  return (req, res, next) => {
    // Lista de paths que não precisam CSRF
    const defaultExemptPaths = [
      '/api/stripe-webhook',
      '/api/sendgrid-webhook',
      '/api/twilio-webhook',
      '/api/health',
      '/api/metrics'
    ];

    const allExemptPaths = [...defaultExemptPaths, ...exemptPaths];

    // Se o path é exempto, pular CSRF
    if (allExemptPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Aplicar CSRF protection
    csrfProtection(req, res, next);
  };
}

/**
 * Handler de erro CSRF customizado
 */
function csrfErrorHandler(err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  // Log do erro
  console.warn(`[CSRF_ERROR] Token inválido ou ausente:`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Resposta de erro
  res.status(403).json({
    error: 'Token CSRF inválido ou ausente',
    code: 'CSRF_TOKEN_INVALID',
    message: 'Por favor, recarregue a página e tente novamente'
  });
}

/**
 * Middleware para validar token CSRF em custom headers
 * Útil para SPAs que enviam token via header em vez de form
 */
function validateCsrfHeader(req, res, next) {
  // Métodos que precisam CSRF
  const methodsRequiringCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'];

  if (!methodsRequiringCsrf.includes(req.method)) {
    return next();
  }

  // Token pode vir em header ou cookie
  const tokenFromHeader = req.get('X-CSRF-Token');
  const tokenFromCookie = req.cookies && req.cookies._csrf;

  if (!tokenFromHeader && !tokenFromCookie) {
    return res.status(403).json({
      error: 'Token CSRF ausente',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  // Se token veio no header, validar
  if (tokenFromHeader) {
    // csurf já faz a validação automaticamente
    // este middleware é apenas para logging adicional
    console.log(`[CSRF_VALIDATION] Token presente no header`);
  }

  next();
}

/**
 * Middleware para gerar novo token CSRF em cada request
 * Útil para APIs stateless
 */
function rotateCsrfToken(req, res, next) {
  if (req.csrfToken) {
    const newToken = req.csrfToken();

    // Enviar novo token no response
    res.setHeader('X-CSRF-Token', newToken);
    res.cookie('XSRF-TOKEN', newToken, {
      httpOnly: false, // Precisa ser acessível pelo JS do frontend
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000
    });
  }

  next();
}

/**
 * Função helper para criar endpoint de token CSRF
 * GET /api/csrf-token
 */
function createCsrfTokenEndpoint(app) {
  app.get('/api/csrf-token', cookieParser(), csrfProtection, (req, res) => {
    res.json({
      csrfToken: req.csrfToken(),
      expiresIn: 3600 // segundos
    });
  });
}

/**
 * Configuração completa de CSRF para Express
 */
function setupCsrfProtection(app, options = {}) {
  const exemptPaths = options.exemptPaths || [];

  // 1. Cookie parser (necessário para csurf)
  app.use(cookieParser());

  // 2. CSRF protection com exceções
  app.use(csrfExempt(exemptPaths));

  // 3. Adicionar token em responses
  app.use(addCsrfToken);

  // 4. Rotacionar token (opcional)
  if (options.rotateTokens) {
    app.use(rotateCsrfToken);
  }

  // 5. Endpoint para obter token
  createCsrfTokenEndpoint(app);

  // 6. Error handler
  app.use(csrfErrorHandler);

  console.log('[CSRF_PROTECTION] Configurado com sucesso');
}

module.exports = {
  csrfProtection,
  addCsrfToken,
  csrfExempt,
  csrfErrorHandler,
  validateCsrfHeader,
  rotateCsrfToken,
  createCsrfTokenEndpoint,
  setupCsrfProtection
};
