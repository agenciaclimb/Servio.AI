import request from 'supertest';
import { describe, it, expect } from 'vitest';

// Import the app factory and run with genAI disabled to force fallbacks
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - CommonJS export from JS file
import { createApp } from '../src/index.js';

const app = createApp({ genAI: null });

describe('AI routes fallback behavior (genAI disabled)', () => {
  it('POST /api/generate-tip returns deterministic tip when no model', async () => {
    const res = await request(app)
      .post('/api/generate-tip')
      .send({ user: { name: 'Carlos' } });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tip');
    expect(res.body.tip).toContain('Complete seu perfil');
    expect(res.body.tip).toContain('Carlos');
  });

  it('POST /api/enhance-profile returns stub JSON when no model', async () => {
    const profile = { name: 'Ana', headline: 'Eletricista experiente', bio: '' };
    const res = await request(app)
      .post('/api/enhance-profile')
      .send({ profile });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('suggestedHeadline');
    expect(res.body).toHaveProperty('suggestedBio');
    expect(res.body.suggestedHeadline).toContain('Profissional de');
    expect(typeof res.body.suggestedBio).toBe('string');
  });

  it('POST /api/generate-proposal returns stub message when no model', async () => {
    const res = await request(app)
      .post('/api/generate-proposal')
      .send({ job: { description: 'Instalação de tomada 110V em sala' }, provider: { name: 'João' } });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('Olá! Posso ajudar');
    expect(res.body.message).toContain('Instalação de tomada');
  });

  it('POST /api/generate-faq returns stub array when no model', async () => {
    const res = await request(app)
      .post('/api/generate-faq')
      .send({ job: { description: 'Pintura de quarto 12m2' } });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0]).toHaveProperty('question');
    expect(res.body[0]).toHaveProperty('answer');
  });

  it('POST /api/generate-seo returns stub object when no model', async () => {
    const res = await request(app)
      .post('/api/generate-seo')
      .send({ user: { name: 'Marcos', headline: 'Técnico em TI', bio: 'Atendimento remoto e presencial' }, reviews: [] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('seoTitle');
    expect(res.body.seoTitle).toContain('Marcos');
    expect(res.body).toHaveProperty('metaDescription');
    expect(res.body).toHaveProperty('publicHeadline');
    expect(res.body).toHaveProperty('publicBio');
  });
});
