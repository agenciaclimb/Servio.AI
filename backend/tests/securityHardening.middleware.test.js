import { describe, it, expect } from 'vitest';

describe('Security Hardening Middlewares', () => {
  it('should export rate limiter middlewares', async () => {
    const rateLimiter = await import('../src/middleware/rateLimiter');
    expect(rateLimiter.globalLimiter).toBeDefined();
    expect(rateLimiter.authLimiter).toBeDefined();
    expect(rateLimiter.apiLimiter).toBeDefined();
    expect(rateLimiter.paymentLimiter).toBeDefined();
    expect(rateLimiter.webhookLimiter).toBeDefined();
  });

  it('should export security headers helpers', async () => {
    const security = await import('../src/middleware/securityHeaders');
    expect(security.securityHeaders).toBeDefined();
    expect(security.sanitizeInput).toBeDefined();
    expect(security.sanitizeQuery).toBeDefined();
    expect(security.preventPathTraversal).toBeDefined();
    expect(security.customSecurityHeaders).toBeDefined();
  });

  it('should export CSRF protection setup', async () => {
    const csrf = await import('../src/middleware/csrfProtection');
    expect(csrf.setupCsrfProtection).toBeDefined();
    expect(csrf.createCsrfTokenEndpoint).toBeDefined();
  });
});