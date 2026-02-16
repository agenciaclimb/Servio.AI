/**
 * VALIDATION MIDDLEWARE
 *
 * Aplica validação Zod aos requests
 * Integrado com schemas de requestValidators.js
 *
 * @module middleware/validationMiddleware
 */

/**
 * Middleware factory para validar request body com Zod
 * @param {ZodSchema} schema - Schema Zod para validação
 * @returns {Function} Express middleware
 */
function validateRequest(schema) {
  return async (req, res, next) => {
    try {
      // Validar e parsear body
      const validated = await schema.parseAsync(req.body);
      
      // Substituir body original pelo validado (sanitizado)
      req.body = validated;
      
      console.log('[VALIDATION] Request validado:', req.method, req.path);
      next();
    } catch (error) {
      // Erro de validação Zod
      if (error.name === 'ZodError') {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        console.warn('[VALIDATION] Validação falhou:', {
          ip: req.ip,
          path: req.path,
          errors,
        });
        
        return res.status(400).json({
          error: 'Dados inválidos',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
      }
      
      // Erro inesperado
      console.error('[VALIDATION] Erro inesperado:', error);
      return res.status(500).json({
        error: 'Erro ao validar dados',
        code: 'VALIDATION_INTERNAL_ERROR',
      });
    }
  };
}

/**
 * Middleware factory para validar query params com Zod
 * @param {ZodSchema} schema - Schema Zod para validação
 * @returns {Function} Express middleware
 */
function validateQuery(schema) {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated;
      
      console.log('[VALIDATION] Query params validados:', req.method, req.path);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        console.warn('[VALIDATION] Validação de query falhou:', {
          ip: req.ip,
          path: req.path,
          errors,
        });
        
        return res.status(400).json({
          error: 'Parâmetros inválidos',
          code: 'QUERY_VALIDATION_ERROR',
          details: errors,
        });
      }
      
      console.error('[VALIDATION] Erro inesperado na validação de query:', error);
      return res.status(500).json({
        error: 'Erro ao validar parâmetros',
        code: 'QUERY_VALIDATION_INTERNAL_ERROR',
      });
    }
  };
}

/**
 * Middleware factory para validar params (route params) com Zod
 * @param {ZodSchema} schema - Schema Zod para validação
 * @returns {Function} Express middleware
 */
function validateParams(schema) {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated;
      
      console.log('[VALIDATION] Route params validados:', req.method, req.path);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        console.warn('[VALIDATION] Validação de params falhou:', {
          ip: req.ip,
          path: req.path,
          errors,
        });
        
        return res.status(400).json({
          error: 'Parâmetros de rota inválidos',
          code: 'PARAMS_VALIDATION_ERROR',
          details: errors,
        });
      }
      
      console.error('[VALIDATION] Erro inesperado na validação de params:', error);
      return res.status(500).json({
        error: 'Erro ao validar parâmetros de rota',
        code: 'PARAMS_VALIDATION_INTERNAL_ERROR',
      });
    }
  };
}

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
};
