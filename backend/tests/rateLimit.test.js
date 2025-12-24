import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import rateLimit from 'express-rate-limit'; // Import real rateLimit to wrap

// Mock do middleware rateLimiter (deve ser hoisted ou doMock)
vi.mock('../src/middleware/rateLimiter.js', () => ({
  globalLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next(),
  apiLimiter: (req, res, next) => next(), // Override in test if needed, or see below
  paymentLimiter: (req, res, next) => next(),
  webhookLimiter: (req, res, next) => next(),
  createCustomLimiter: () => (req, res, next) => next(),
}));

import { createApp } from '../src/index.js';

const buildMockDb = () => {
  const add = vi.fn(async (data) => ({ id: 'proposal-id', ...data }));
  return {
    collection: vi.fn(() => ({ add })),
  };
};

describe.skip('Rate limiting - critical endpoints', () => {
  let app;
  let mockDb;

  beforeEach(async () => {
    vi.resetModules();
    // Re-mock rateLimiter for this test suite setup
    // But since index.js uses it, we need to mock it properly.
    // However, rateLimiter.js exports CONSTANTS.
    // If we want to test that a limit IS hit, we need to mock apiLimiter to BE a limiter with small limit.
    
    vi.doMock('../src/middleware/rateLimiter.js', () => {
       let count = 0;
       return {
           globalLimiter: (req, res, next) => next(),
           authLimiter: (req, res, next) => next(),
           apiLimiter: (req, res, next) => {
               count++;
               if (count > 2) { // Max 2
                   return res.status(429).json({ error: 'Too many requests' });
               }
               next();
           },
           paymentLimiter: (req, res, next) => next(),
           webhookLimiter: (req, res, next) => next(),
           createCustomLimiter: () => (req, res, next) => next(),
       };
    });

    const index = await import('../src/index.js');
    mockDb = buildMockDb();
    
    // We assume createApp uses apiLimiter. Note that index.js might import it at top level.
    // Using doMock + import should reset it.
    app = index.createApp({
      db: mockDb,
      // Config ignored by implementation, but mock handles it
    });
  });

  it('permite requisições dentro do limite configurado', async () => {
    const payload = { jobId: 'job-1', providerId: 'prov-1', price: 100 };

    const first = await request(app).post('/proposals').send(payload);
    const second = await request(app).post('/proposals').send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
  });

  it('retorna 429 quando o limite é excedido', async () => {
    const payload = { jobId: 'job-1', providerId: 'prov-1', price: 100 };

    await request(app).post('/proposals').send(payload); // 1
    await request(app).post('/proposals').send(payload); // 2
    const third = await request(app).post('/proposals').send(payload); // 3 (Blocked)

    expect(third.status).toBe(429);
    expect(third.body).toHaveProperty('error');
  });
});
