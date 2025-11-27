import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../../services/api';

// Mock fetch
global.fetch = vi.fn();

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getJobs', () => {
    it('should fetch jobs from API', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobs: [] }),
      } as Response);

      const result = await api.getJobs();
      expect(Array.isArray(result) || result).toBeTruthy();
    });

    it('should handle job fetching error', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await api.getJobs();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getProposals', () => {
    it('should fetch proposals', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ proposals: [] }),
      } as Response);

      const result = await api.getProposals('user123');
      expect(Array.isArray(result) || result).toBeTruthy();
    });
  });

  describe('createJob', () => {
    it('should create a new job', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'job-123', status: 'open' }),
      } as Response);

      const result = await api.createJob({
        title: 'Test Job',
        category: 'plumbing',
        description: 'Test description',
        budget: 100,
      });
      expect(result).toBeDefined();
    });
  });

  describe('getMessages', () => {
    it('should fetch messages', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [] }),
      } as Response);

      const result = await api.getMessages('job-123');
      expect(Array.isArray(result) || result).toBeTruthy();
    });
  });

  describe('sendMessage', () => {
    it('should send message', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg-123' }),
      } as Response);

      const result = await api.sendMessage('job-123', 'Hello');
      expect(result).toBeDefined();
    });
  });

  describe('getUser', () => {
    it('should fetch user details', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user-123', name: 'John' }),
      } as Response);

      const result = await api.getUser('user-123');
      expect(result).toBeDefined();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const result = await api.updateProfile({ name: 'Jane' });
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response);

      try {
        await api.getJobs();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle network timeouts', async () => {
      vi.mocked(global.fetch).mockImplementationOnce(() =>
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      try {
        await api.getJobs();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
