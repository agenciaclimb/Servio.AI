import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';

const mockModel = {
  generateContent: vi.fn(),
};

const mockGenAI = {
  getGenerativeModel: vi.fn(() => mockModel),
};

describe('AI endpoints (Gemini)', () => {
  let app: any;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp({ genAI: mockGenAI as any });
  });

  it('enhance-job returns parsed JSON', async () => {
    const payload = {
      prompt: 'Troca de chuveiro elétrico',
      address: 'Rua A, 123',
      fileCount: 2,
    };
    const aiResponse = '{"description":"Troca profissional","category":"instalacao","serviceType":"chuveiro","urgency":"amanha","estimatedBudget":150}';
    mockModel.generateContent.mockResolvedValue({ response: { text: () => aiResponse } });

    const res = await request(app).post('/api/enhance-job').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.description).toMatch(/Troca/);
    expect(res.body.category).toBe('instalacao');
  });

  it('enhance-job 400 when prompt missing', async () => {
    const res = await request(app).post('/api/enhance-job').send({});
    expect(res.status).toBe(400);
  });

  it('suggest-maintenance returns null when AI outputs null', async () => {
    mockModel.generateContent.mockResolvedValue({ response: { text: () => 'null' } });
    const res = await request(app).post('/api/suggest-maintenance').send({ item: { name: 'Geladeira' } });
    expect(res.status).toBe(200);
    expect(res.body).toBe(null);
  });

  it('suggest-maintenance returns parsed object when JSON present', async () => {
    const aiResponse = '{"title":"Limpeza do condensador","description":"Limpar","urgency":"baixa","estimatedCost":80}';
    mockModel.generateContent.mockResolvedValue({ response: { text: () => aiResponse } });
    const res = await request(app).post('/api/suggest-maintenance').send({ item: { name: 'Geladeira' } });
    expect(res.status).toBe(200);
    expect(res.body.title).toMatch(/Limpeza/);
  });
});
