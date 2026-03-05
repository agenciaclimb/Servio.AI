import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';

describe('API Header Rewrite Middleware & Endpoints', () => {
  let app;
  let mockDb;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    mockDb = {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
      set: vi.fn().mockResolvedValue({}),
      get: vi.fn().mockResolvedValue({ exists: false }),
    };
    app = createApp({ db: mockDb });
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('GET /api/health should return 200 and match GET /health', async () => {
    const resApiHealth = await request(app).get('/api/health');
    const resHealth = await request(app).get('/health');
    
    expect(resApiHealth.status).toBe(200);
    expect(resHealth.status).toBe(200);
    // As in index.js, /api/health and /health are the SAME endpoint structurally
    expect(resApiHealth.body.status).toBe('healthy');
    expect(resHealth.body.status).toBe('healthy');
  });

  it('GET /api/csrf should work and set expected cookie', async () => {
    const res = await request(app).get('/api/csrf');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    
    // Check Set-Cookie array
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(c => c.includes('XSRF-TOKEN='))).toBe(true);
  });

  it('POST /api/users (representing an upload/mutate endpoint) works with CSRF token', async () => {
    // 1. Get token
    const resCsrf = await request(app).get('/api/csrf');
    const token = resCsrf.body.token;
    const cookies = resCsrf.headers['set-cookie'];

    // 2. Post to /api/users
    // We mock req.user injection for test auth
    const resPost = await request(app)
      .post('/api/users')
      .set('Cookie', cookies)
      .set('x-csrf-token', token)
      .set('x-user-email', 'test@example.com')
      .send({ email: 'new@example.com' });

    // Assuming user creation passes
    expect(resPost.status).toBe(201);
  });

  it('POST /api/users returns 403 when CSRF token is missing', async () => {
    const resPost = await request(app)
      .post('/api/users')
      .set('x-user-email', 'test@example.com')
      .send({ email: 'new@example.com' });

    // Missing CSRF token is 403
    expect(resPost.status).toBe(403);
    expect(resPost.body.code).toBe('CSRF_TOKEN_MISSING');
  });

  it('GET /internal/smoke-test should return 200', async () => {
    const res = await request(app).get('/internal/smoke-test');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
