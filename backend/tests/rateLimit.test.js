import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';

const buildMockDb = () => {
  const add = vi.fn(async (data) => ({ id: 'proposal-id', ...data }));
  return {
    collection: vi.fn(() => ({ add })),
  };
};

describe('Rate limiting - critical endpoints', () => {
  let app;
  let mockDb;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockDb = buildMockDb();
    app = createApp({
      db: mockDb,
      rateLimitConfig: {
        base: { windowMs: 100, max: 2 },
        proposals: { windowMs: 100, max: 2 },
        users: { windowMs: 100, max: 2 },
        auth: { windowMs: 100, max: 2 },
      },
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

    await request(app).post('/proposals').send(payload);
    await request(app).post('/proposals').send(payload);
    const third = await request(app).post('/proposals').send(payload);

    expect(third.status).toBe(429);
    expect(third.body).toHaveProperty('error');
  });
});
