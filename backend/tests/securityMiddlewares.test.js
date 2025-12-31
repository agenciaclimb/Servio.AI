import { describe, it, expect, vi } from 'vitest';
import {
  globalLimiter,
  authLimiter,
  apiLimiter,
  paymentLimiter,
  webhookLimiter,
  createCustomLimiter,
} from '../src/middleware/rateLimiter.js';
import { csrfExempt, csrfErrorHandler } from '../src/middleware/csrfProtection.js';
import {
  sanitizeInput,
  sanitizeQuery,
  preventPathTraversal,
} from '../src/middleware/securityHeaders.js';
import { createJobSchema, loginSchema } from '../src/validators/requestValidators.js';

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  res.setHeader = vi.fn();
  return res;
}

function mockNext() {
  return vi.fn();
}

describe('rateLimiter middleware', () => {
  it('globalLimiter should be a valid express middleware', () => {
    expect(globalLimiter).toBeDefined();
    expect(typeof globalLimiter).toBe('function');
  });

  it('authLimiter should be a valid express middleware', () => {
    expect(authLimiter).toBeDefined();
    expect(typeof authLimiter).toBe('function');
  });

  it('createCustomLimiter should return a configured limiter', () => {
    const custom = createCustomLimiter({ windowMs: 1000, max: 1, message: 'Custom limit' });
    expect(custom).toBeDefined();
    expect(typeof custom).toBe('function');
  });
});

describe('csrfProtection helpers', () => {
  it('csrfExempt should bypass configured paths', () => {
    const middleware = csrfExempt(['/api/stripe-webhook']);
    const next = mockNext();
    const req = { path: '/api/stripe-webhook' };
    const res = mockRes();
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('csrfErrorHandler should return 403 on CSRF error', () => {
    const err = { code: 'EBADCSRFTOKEN', message: 'csrf invalid' };
    const req = { ip: '4.4.4.4', path: '/api/test', method: 'POST', headers: {} };
    const res = mockRes();
    const next = mockNext();
    csrfErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token CSRF inválido ou ausente',
      code: 'CSRF_VALIDATION_FAILED',
      message: 'Por favor, recarregue a página e tente novamente',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('securityHeaders sanitizers', () => {
  it('sanitizeInput should strip script tags', () => {
    const req = { body: { comment: '<script>alert(1)</script>ok' } };
    const res = mockRes();
    const next = mockNext();
    sanitizeInput(req, res, next);
    expect(req.body.comment).not.toContain('<script>');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sanitizeQuery should clean query strings', () => {
    const req = { query: { q: '<img src=x onerror=alert(1)>' } };
    const res = mockRes();
    const next = mockNext();
    sanitizeQuery(req, res, next);
    expect(req.query.q).not.toContain('<img');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('preventPathTraversal should block suspicious paths', () => {
    const req = { path: '../etc/passwd', query: {} };
    const res = mockRes();
    const next = mockNext();
    preventPathTraversal(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid path detected',
      code: 'PATH_TRAVERSAL_ATTEMPT',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requestValidators schemas', () => {
  it('createJobSchema should pass with valid payload', () => {
    const result = createJobSchema.safeParse({
      titulo: 'Título válido',
      descricao: 'Descrição válida para o job em questão',
      orcamento: 100,
      localizacao: 'São Paulo',
      categoria: 'dev',
      tags: ['node', 'react'],
      urgente: true,
    });
    expect(result.success).toBe(true);
  });

  it('loginSchema should fail on weak password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('mínimo 8 caracteres');
    }
  });
});
