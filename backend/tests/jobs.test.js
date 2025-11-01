import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';

describe('Jobs API Endpoints', () => {
  let app;
  let mockDb;

  beforeEach(() => {
    // Mock do Firestore
    mockDb = {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
      set: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      get: vi.fn(),
      where: vi.fn().mockReturnThis(),
    };

    // Cria a aplicação Express com o DB mockado
    app = createApp({ db: mockDb });
  });

  describe('POST /jobs', () => {
    it('should create a new job successfully', async () => {
      const newJob = {
        clientId: 'client@example.com',
        category: 'Eletricista',
        description: 'Instalar nova tomada',
      };

      // O método `doc()` sem argumento gera um ID, então mockamos o retorno para ter um ID fixo
      mockDb.collection('jobs').doc = vi.fn(() => ({
        id: 'new-job-123',
        set: mockDb.set,
      }));

      const response = await request(app)
        .post('/jobs')
        .send(newJob);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(mockDb.collection).toHaveBeenCalledWith('jobs');
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining(newJob));
    });
  });

  describe('GET /jobs', () => {
    it('should filter jobs by status', async () => {
      const mockJobs = [{ id: 'job-1', status: 'aberto' }];
      mockDb.get.mockResolvedValue({
        docs: mockJobs.map(job => ({ id: job.id, data: () => job })),
      });

      const response = await request(app).get('/jobs?status=aberto');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockJobs);
      expect(mockDb.where).toHaveBeenCalledWith('status', '==', 'aberto');
    });
  });

  describe('POST /jobs/:jobId/set-on-the-way', () => {
    it('should update job status to "a_caminho"', async () => {
      const jobId = 'job-to-update';

      const response = await request(app)
        .post(`/jobs/${jobId}/set-on-the-way`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Status updated to "a_caminho" successfully.');
      expect(mockDb.collection).toHaveBeenCalledWith('jobs');
      expect(mockDb.doc).toHaveBeenCalledWith(jobId);
      expect(mockDb.update).toHaveBeenCalledWith({ status: 'a_caminho' });
    });
  });
});