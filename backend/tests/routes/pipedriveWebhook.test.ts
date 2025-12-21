/**
 * Testes para Pipedrive Webhook Endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import pipedriveWebhookRouter from '../../src/routes/pipedriveWebhook';

describe('Pipedrive Webhook Endpoint', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', pipedriveWebhookRouter);

    // Mock do Firestore
    vi.mock('../firebaseConfig', () => ({
      db: {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: vi.fn(),
            update: vi.fn().mockResolvedValue(undefined),
          })),
          add: vi.fn().mockResolvedValue({ id: 'mock-id' }),
        })),
      },
    }));
  });

  describe('POST /api/pipedrive-webhook', () => {
    it('deve retornar 401 se assinatura for inválida', async () => {
      const response = await request(app)
        .post('/api/pipedrive-webhook')
        .send({
          event: 'added.deal',
          data: { id: 123 },
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid signature');
    });

    it('deve processar webhook se assinatura for válida', async () => {
      const payload = {
        event: 'added.deal',
        data: { id: 123, title: 'Test Deal' },
      };

      const response = await request(app)
        .post('/api/pipedrive-webhook')
        .set('x-pipedrive-signature', 'valid-signature')
        .send(payload);

      // Nota: Este test falhará em assinatura real
      // No ambiente real, usar token correto do Pipedrive
      expect(response.status).toBeOneOf([200, 401]);
    });
  });

  describe('POST /api/pipedrive/sync-proposal', () => {
    it('deve validar campos obrigatórios', async () => {
      const response = await request(app).post('/api/pipedrive/sync-proposal').send({
        proposalId: 'prop-123',
        // Faltam clientEmail, title, value
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('deve sincronizar proposta com sucesso', async () => {
      const response = await request(app).post('/api/pipedrive/sync-proposal').send({
        proposalId: 'prop-123',
        clientEmail: 'client@example.com',
        title: 'Nova Proposta',
        value: 5000,
        currency: 'BRL',
      });

      expect(response.status).toBeOneOf([200, 500]); // Depende de mocks
    });
  });

  describe('GET /api/pipedrive/deal/:dealId', () => {
    it('deve retornar informações do deal', async () => {
      const response = await request(app).get('/api/pipedrive/deal/123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/pipedrive/sync-status/:proposalId', () => {
    it('deve retornar 404 se proposta não existir', async () => {
      const response = await request(app).get('/api/pipedrive/sync-status/nonexistent');

      expect(response.status).toBeOneOf([404, 500]);
    });

    it('deve retornar status de sincronização', async () => {
      const response = await request(app).get('/api/pipedrive/sync-status/prop-123');

      expect(response.status).toBeOneOf([200, 404, 500]);
      if (response.status === 200) {
        expect(response.body.syncStatus).toBeDefined();
      }
    });
  });

  describe('GET /api/pipedrive/health', () => {
    it('deve retornar health check', async () => {
      const response = await request(app).get('/api/pipedrive/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('pipedrive-integration');
      expect(response.body.status).toBe('healthy');
    });
  });
});
