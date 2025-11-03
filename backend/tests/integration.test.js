import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';

describe('Backend REST API Integration Tests', () => {
  let app;
  let mockDb;

  beforeAll(() => {
    // Mock Firestore for testing
    mockDb = {
      collection: (name) => ({
        doc: (id) => {
          const docId = id || `mock-${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          return {
            id: docId,
            get: async () => ({ exists: true, id: docId, data: () => ({ id: docId, status: 'ativo' }) }),
            set: async () => {},
            update: async () => {},
            delete: async () => {},
          };
        },
        add: async (data) => ({ id: 'mock-id-123', ...data }),
        where: () => ({
          get: async () => ({ docs: [], empty: true }),
          orderBy: () => ({
            get: async () => ({ docs: [] }),
          }),
        }),
        orderBy: () => ({
          get: async () => ({ docs: [] }),
        }),
        get: async () => ({ docs: [] }),
      }),
    };

    app = createApp({ db: mockDb, storage: null, stripe: null });
  });

  describe('Jobs API', () => {
    it('POST /jobs should create a new job', async () => {
      const response = await request(app)
        .post('/jobs')
        .send({
          clientId: 'test@example.com',
          category: 'Eletricista',
          description: 'Trocar tomadas',
          serviceType: 'tabelado',
          urgency: 'hoje',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('ativo');
    });

    it('GET /jobs should return jobs list', async () => {
      const response = await request(app).get('/jobs');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /jobs/:id should return a job', async () => {
      const response = await request(app).get('/jobs/test-job-id');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });

    it('PUT /jobs/:id should update a job', async () => {
      const response = await request(app)
        .put('/jobs/test-job-id')
        .send({ status: 'em_progresso' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Proposals API', () => {
    it('POST /proposals should create a proposal', async () => {
      const response = await request(app)
        .post('/proposals')
        .send({
          jobId: 'job-123',
          providerId: 'provider@example.com',
          price: 150,
          message: 'Posso fazer hoje',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('pendente');
    });

    it('GET /proposals should return proposals', async () => {
      const response = await request(app).get('/proposals?jobId=job-123');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('PUT /proposals/:id should update proposal status', async () => {
      const response = await request(app)
        .put('/proposals/proposal-123')
        .send({ status: 'aceita' });

      expect(response.status).toBe(200);
    });
  });

  describe('Messages API', () => {
    it('POST /messages should create a message', async () => {
      const response = await request(app)
        .post('/messages')
        .send({
          chatId: 'job-123',
          senderId: 'user@example.com',
          text: 'Olá, quando pode começar?',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.chatId).toBe('job-123');
    });

    it('GET /messages/:jobId should return messages', async () => {
      const response = await request(app).get('/messages/job-123');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Maintained Items API', () => {
    it('POST /maintained-items should create an item', async () => {
      const response = await request(app)
        .post('/maintained-items')
        .send({
          clientId: 'client@example.com',
          name: 'Ar Condicionado',
          category: 'HVAC',
          imageUrl: 'https://example.com/image.jpg',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.maintenanceHistory).toEqual([]);
    });

    it('GET /maintained-items should require clientId', async () => {
      const response = await request(app).get('/maintained-items');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('clientId');
    });

    it('GET /maintained-items with clientId should return items', async () => {
      const response = await request(app).get('/maintained-items?clientId=client@example.com');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Invitations API', () => {
    it('POST /invitations should create invitation', async () => {
      const response = await request(app)
        .post('/invitations')
        .send({
          providerEmail: 'provider@example.com',
          clientId: 'client@example.com',
          clientName: 'Empresa ABC',
        });

      expect(response.status).toBe(201);
    });

    it('GET /invitations should filter by clientId', async () => {
      const response = await request(app).get('/invitations?clientId=client@example.com');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Disputes API', () => {
    it('POST /disputes should create a dispute', async () => {
      const response = await request(app)
        .post('/disputes')
        .send({
          jobId: 'job-123',
          initiatorId: 'user@example.com',
          reason: 'Serviço não concluído',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('aberta');
    });

    it('GET /disputes should return disputes list', async () => {
      const response = await request(app).get('/disputes');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Escrows API', () => {
    it('GET /escrows should return escrows list', async () => {
      const response = await request(app).get('/escrows');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /escrows with status filter should work', async () => {
      const response = await request(app).get('/escrows?status=liberado');
      expect(response.status).toBe(200);
    });
  });

  describe('Admin Endpoints', () => {
    it('GET /users should return users list', async () => {
      const response = await request(app).get('/users');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /fraud-alerts should return alerts', async () => {
      const response = await request(app).get('/fraud-alerts');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
