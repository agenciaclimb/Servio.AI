/**
 * CSRF PROTECTION MIDDLEWARE V2
 *
 * Implementação manual robusta de Double Submit Cookie Pattern
 * - Não depende de bibliotecas externas problemáticas
 * - Token gerado via crypto nativo do Node.js
 * - Cookie HttpOnly + header validation
 * - Production-ready para Google Cloud Run
 *
 * OWASP: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie
 *
 * @module middleware/csrfProtectionV2
 */

const crypto = require('crypto');
const cookieParser = require('cookie-parser');

/**
 * Gera token CSRF criptograficamente seguro
 * @returns {string} Token de 64 caracteres hexadecimais
 */
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware para adicionar cookie e header CSRF
 * Gera novo token se não existir ou se forçado
 */
function addCsrfToken(req, res, next) {
  try {
    const cookieName = 'XSRF-TOKEN';
    const headerName = 'X-XSRF-TOKEN';
    
    // Verificar se já existe token válido no cookie
    let token = req.cookies?.[cookieName];
    
    // Gerar novo token se não existe ou se rotação forçada
    if (!token || req.rotateCsrf) {
      token = generateCsrfToken();
      
      // Configurar cookie com token
      res.cookie(cookieName, token, {
        httpOnly: false, // MUST be false para JavaScript poder ler (Double Submit Cookie pattern)
        secure: process.env.NODE_ENV === 'production', // HTTPS only em produção
        sameSite: 'lax', // Proteção adicional contra CSRF
        path: '/',
        maxAge: 3600000, // 1 hora
      });
      
      console.log('[CSRF-V2] Novo token gerado:', token.substring(0, 8) + '...');
    }
    
    // Adicionar token ao response header para frontend acessar
    res.setHeader(headerName, token);
    res.locals.csrfToken = token;
    
    next();
  } catch (error) {
    console.error('[CSRF-V2] Erro ao gerar token:', error);
    return res.status(500).json({
      error: 'Erro ao gerar token de segurança',
      code: 'CSRF_GENERATION_ERROR',
    });
  }
}

/**
 * Middleware de validação CSRF
 * Verifica se token do cookie === token do header
 */
function validateCsrfToken(req, res, next) {
  const cookieName = 'XSRF-TOKEN';
  const headerName = 'x-xsrf-token'; // Express normaliza headers para lowercase
  
  // Ignorar métodos seguros (não alteram estado)
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }
  
  // Obter tokens
  const cookieToken = req.cookies?.[cookieName];
  const headerToken = req.headers[headerName] || req.headers['x-csrf-token']; // Fallback
  
  // Validar presença
  if (!cookieToken) {
    console.warn('[CSRF-V2] Token ausente no cookie:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    return res.status(403).json({
      error: 'Token CSRF ausente',
      code: 'CSRF_TOKEN_MISSING',
      message: 'Por favor, recarregue a página e tente novamente',
    });
  }
  
  if (!headerToken) {
    console.warn('[CSRF-V2] Token ausente no header:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    return res.status(403).json({
      error: 'Token CSRF ausente no header',
      code: 'CSRF_HEADER_MISSING',
      message: 'Requisição inválida. Recarregue a página.',
    });
  }
  
  // Validar igualdade (timing-safe comparison)
  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    console.warn('[CSRF-V2] Tokens não correspondem:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      cookiePrefix: cookieToken.substring(0, 8),
      headerPrefix: headerToken.substring(0, 8),
    });
    return res.status(403).json({
      error: 'Token CSRF inválido',
      code: 'CSRF_TOKEN_MISMATCH',
      message: 'Token de segurança inválido. Recarregue a página.',
    });
  }
  
  // Validação bem-sucedida
  console.log('[CSRF-V2] Token validado com sucesso:', req.method, req.path);
  next();
}

/**
 * Middleware para rotação de token CSRF
 * Usar após login, logout, operações sensíveis
 */
function rotateCsrfToken(req, res, next) {
  req.rotateCsrf = true; // Flag para addCsrfToken gerar novo token
  console.log('[CSRF-V2] Rotação de token agendada para:', req.path);
  next();
}

/**
 * Setup completo de CSRF protection
 * @param {Express.Application} app - Express app
 * @param {Object} options - Opções de configuração
 * @param {Array<string>} options.exempt - Rotas isentas de validação CSRF
 * @param {boolean} options.enableRotation - Habilitar rotação em rotas específicas
 */
function setupCsrfProtection(app, options = {}) {
  const {
    exempt = ['/api/stripe-webhook', '/api/webhooks/*', '/api/health', '/api/version', '/api/routes'],
    enableRotation = true,
  } = options;

  console.log('[CSRF-V2] Configurando proteção CSRF...');
  console.log('[CSRF-V2] Rotas isentas:', exempt);

  // 1. Cookie parser (necessário para ler cookies)
  if (!app._router || !app._router.stack.some(layer => layer.name === 'cookieParser')) {
    app.use(cookieParser());
    console.log('[CSRF-V2] Cookie parser ativado');
  }

  // 2. Middleware global: adiciona token em TODAS as respostas
  app.use((req, res, next) => {
    // Verificar se rota está isenta
    const path = req.path || req.url;
    const isExempt = exempt.some(exemptPath => {
      if (exemptPath.endsWith('*')) {
        const prefix = exemptPath.slice(0, -1);
        return path.startsWith(prefix);
      }
      return path === exemptPath;
    });

    if (isExempt) {
      console.log(`[CSRF-V2] Rota isenta: ${path}`);
      return next(); // Pula CSRF completamente
    }

    // Adicionar token ao response (sempre, mesmo em GET)
    addCsrfToken(req, res, () => {
      // Validar token apenas em métodos não seguros
      validateCsrfToken(req, res, next);
    });
  });

  console.log('[CSRF-V2] Proteção CSRF ativada com sucesso');
}

/**
 * Criar endpoint para obter token CSRF (usado pelo frontend)
 * GET /api/csrf-token
 */
function createCsrfTokenEndpoint(app) {
  app.get('/api/csrf-token', (req, res) => {
    // addCsrfToken já foi executado pelo middleware global
    const token = res.locals.csrfToken || req.cookies?.['XSRF-TOKEN'];
    
    if (!token) {
      return res.status(500).json({
        error: 'Token CSRF não disponível',
        code: 'CSRF_UNAVAILABLE',
      });
    }

    res.json({
      token,
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    });
  });

  console.log('[CSRF-V2] Endpoint /api/csrf-token criado');
}

module.exports = {
  setupCsrfProtection,
  createCsrfTokenEndpoint,
  rotateCsrfToken,
  addCsrfToken,
  validateCsrfToken,
};
