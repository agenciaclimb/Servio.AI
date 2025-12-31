import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';

// Mock Firebase Admin globally
const mockVerifyIdToken = vi.fn().mockResolvedValue({
  uid: 'test-uid',
  email: 'test@example.com',
  role: 'cliente', // Custom claim from Task 1.1
});

vi.mock('firebase-admin', () => ({
  default: {
    auth: vi.fn(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
    initializeApp: vi.fn(),
    firestore: vi.fn(),
  },
}));

describe('Jobs API Pagination (Task 2.1)', () => {
  let app;
  let mockDb;
  let mockCollection;
  let mockQuery;

  beforeEach(() => {
    // Reset mock
    mockVerifyIdToken.mockClear();
    mockVerifyIdToken.mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com',
      role: 'cliente',
    });

    // Mock Firestore query chain
    mockQuery = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn(),
    };

    // Mock user document for dev mode (x-user-email header)
    const mockUserDoc = {
      exists: true,
      data: () => ({
        email: 'test@example.com',
        type: 'cliente',
        uid: 'test-uid',
      }),
    };

    mockCollection = {
      doc: vi.fn(docId => {
        // Return user doc when looking up users/test@example.com
        if (docId === 'test@example.com') {
          return {
            get: vi.fn().mockResolvedValue(mockUserDoc),
          };
        }
        // For jobs pagination cursor lookups
        return {
          get: vi.fn().mockResolvedValue({
            exists: true,
            id: docId,
            data: () => ({ title: 'Job' }),
          }),
        };
      }),
      where: vi.fn((...args) => mockQuery.where(...args)),
      orderBy: vi.fn((...args) => mockQuery.orderBy(...args)),
      limit: vi.fn((...args) => mockQuery.limit(...args)),
      get: vi.fn(),
    };

    mockDb = {
      collection: vi.fn(collectionName => {
        // Return appropriate mock based on collection
        return mockCollection;
      }),
    };

    app = createApp({ db: mockDb });
  });

  describe('GET /api/jobs - Pagination', () => {
    it('should return first page with default limit of 20', async () => {
      const mockJobs = Array.from({ length: 20 }, (_, i) => ({
        id: `job-${i + 1}`,
        title: `Job ${i + 1}`,
        status: 'aberto',
        createdAt: new Date().toISOString(),
      }));

      mockQuery.get.mockResolvedValue({
        docs: mockJobs.map(job => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app).get('/api/jobs').set('x-user-email', 'test@example.com'); // Dev mode header

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jobs');
      expect(response.body).toHaveProperty('nextPageCursor');
      expect(response.body.jobs).toHaveLength(20);
      expect(response.body.nextPageCursor).toBe('job-20');
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
    });

    it('should return custom limit when specified', async () => {
      const mockJobs = Array.from({ length: 10 }, (_, i) => ({
        id: `job-${i + 1}`,
        title: `Job ${i + 1}`,
        status: 'aberto',
      }));

      mockQuery.get.mockResolvedValue({
        docs: mockJobs.map(job => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app)
        .get('/api/jobs?limit=10')
        .set('x-user-email', 'test@example.com');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(10);
      expect(response.body.nextPageCursor).toBe('job-10');
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should return null cursor when results are less than limit', async () => {
      const mockJobs = Array.from({ length: 5 }, (_, i) => ({
        id: `job-${i + 1}`,
        title: `Job ${i + 1}`,
      }));

      mockQuery.get.mockResolvedValue({
        docs: mockJobs.map(job => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app)
        .get('/api/jobs?limit=10')
        .set('x-user-email', 'test@example.com');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(5);
      expect(response.body.nextPageCursor).toBeNull();
      expect(response.body.page.hasMore).toBe(false);
    });

    it('should use cursor for next page pagination', async () => {
      const mockStartAfterDoc = {
        exists: true,
        id: 'job-20',
        data: () => ({ title: 'Job 20' }),
      };

      mockCollection.doc.mockReturnValue({
        get: vi.fn().mockResolvedValue(mockStartAfterDoc),
      });

      const mockJobs = Array.from({ length: 10 }, (_, i) => ({
        id: `job-${i + 21}`,
        title: `Job ${i + 21}`,
      }));

      mockQuery.get.mockResolvedValue({
        docs: mockJobs.map(job => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app)
        .get('/api/jobs?limit=10&startAfter=job-20')
        .set('x-user-email', 'test@example.com');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(10);
      expect(response.body.jobs[0].id).toBe('job-21');
      expect(mockQuery.startAfter).toHaveBeenCalled();
    });
  });

  describe('GET /api/jobs - Filtering', () => {
    it('should filter by status', async () => {
      const mockJobs = [
        { id: 'job-1', status: 'aberto', title: 'Job 1' },
        { id: 'job-2', status: 'aberto', title: 'Job 2' },
      ];

      mockQuery.get.mockResolvedValue({
        docs: mockJobs.map(job => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app)
        .get('/api/jobs?status=aberto&limit=10')
        .set('x-user-email', 'test@example.com');

      expect(response.status).toBe(200);
      expect(mockQuery.where).toHaveBeenCalledWith('status', '==', 'aberto');
    });

    it('should filter by category', async () => {
      const mockJobs = [{ id: 'job-1', category: 'Eletricista', title: 'Job 1' }];

      mockQuery.get.mockResolvedValue({
        docs: mockJobs.map(job => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app)
        .get('/api/jobs?category=Eletricista&limit=10')
        .set('x-user-email', 'test@example.com');

      expect(response.status).toBe(200);
      expect(mockQuery.where).toHaveBeenCalledWith('category', '==', 'Eletricista');
    });

    it('should filter by location', async () => {
      const mockJobs = [{ id: 'job-1', location: 'São Paulo', title: 'Job 1' }];

      mockQuery.get.mockResolvedValue({
        docs: mockJobs.map(job => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app)
        .get('/api/jobs?location=São Paulo&limit=10')
        .set('x-user-email', 'test@example.com');

      expect(response.status).toBe(200);
      expect(mockQuery.where).toHaveBeenCalledWith('location', '==', 'São Paulo');
    });

    it('should apply multiple filters', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          status: 'aberto',
          category: 'Eletricista',
          location: 'São Paulo',
          title: 'Job 1',
        },
      ];

      mockQuery.get.mockResolvedValue({
        docs: mockJobs.map(job => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app)
        .get('/api/jobs?status=aberto&category=Eletricista&location=São Paulo&limit=10')
        .set('x-user-email', 'test@example.com');

      expect(response.status).toBe(200);
      expect(mockQuery.where).toHaveBeenCalledWith('status', '==', 'aberto');
      expect(mockQuery.where).toHaveBeenCalledWith('category', '==', 'Eletricista');
      expect(mockQuery.where).toHaveBeenCalledWith('location', '==', 'São Paulo');
    });
  });

  describe('GET /api/jobs - Sorting', () => {
    it('should sort by createdAt desc by default', async () => {
      const mockJobs = [{ id: 'job-1', title: 'Job 1' }];

      mockQuery.get.mockResolvedValue({
        docs: mockJobs.map(job => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app)
        .get('/api/jobs?limit=10')
        .set('x-user-email', 'test@example.com');

      expect(response.status).toBe(200);
      expect(mockQuery.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should sort by custom field and order', async () => {
      const mockJobs = [{ id: 'job-1', title: 'Job 1' }];

      mockQuery.get.mockResolvedValue({
        docs: mockJobs.map(job => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app)
        .get('/api/jobs?sortBy=title&sortOrder=asc&limit=10')
        .set('x-user-email', 'test@example.com');

      expect(response.status).toBe(200);
      expect(mockQuery.orderBy).toHaveBeenCalledWith('title', 'asc');
    });
  });

  describe('GET /jobs (legacy) - Pagination', () => {
    it('should have same pagination behavior as /api/jobs', async () => {
      const mockJobs = Array.from({ length: 10 }, (_, i) => ({
        id: `job-${i + 1}`,
        title: `Job ${i + 1}`,
      }));

      mockQuery.get.mockResolvedValue({
        docs: mockJobs.map(job => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app)
        .get('/jobs?limit=10&status=aberto')
        .set('x-user-email', 'test@example.com');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jobs');
      expect(response.body).toHaveProperty('nextPageCursor');
      expect(response.body.jobs).toHaveLength(10);
      expect(mockQuery.where).toHaveBeenCalledWith('status', '==', 'aberto');
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results', async () => {
      mockQuery.get.mockResolvedValue({
        docs: [],
      });

      const response = await request(app)
        .get('/api/jobs?status=inexistente&limit=10')
        .set('x-user-email', 'test@example.com');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(0);
      expect(response.body.nextPageCursor).toBeNull();
      expect(response.body.page.hasMore).toBe(false);
    });

    it('should handle invalid startAfter cursor gracefully', async () => {
      mockCollection.doc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: false,
        }),
      });

      const mockJobs = [{ id: 'job-1', title: 'Job 1' }];

      mockQuery.get.mockResolvedValue({
        docs: mockJobs.map(job => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app)
        .get('/api/jobs?startAfter=invalid-id&limit=10')
        .set('x-user-email', 'test@example.com');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(1);
      // Should not call startAfter if document doesn't exist
      expect(mockQuery.startAfter).not.toHaveBeenCalled();
    });
  });
});
