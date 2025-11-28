/**
 * API Edge Case Tests - Error handling, rate limiting, concurrent operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as API from '../services/api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Service - Edge Cases', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Error handling', () => {
    it('deve lidar com erros de rede corretamente', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      // fetchAllUsers deve retornar mock data como fallback
      const users = await API.fetchAllUsers();
      
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it('deve lidar com resposta 500 do servidor', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      // Deve usar mock data como fallback
      const users = await API.fetchAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it('deve lidar com resposta 404 não encontrada', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not found' }),
      });

      const users = await API.fetchAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it('deve lidar com JSON inválido na resposta', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // API service deve capturar erro e usar mock data como fallback
      const users = await API.fetchAllUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it('deve lidar com timeout de requisição', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const users = await API.fetchAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('Concorrência', () => {
    it('deve lidar com múltiplas requisições simultâneas', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [{ email: 'test@test.com', name: 'Test User' }],
      });

      const promises = [
        API.fetchAllUsers(),
        API.fetchAllUsers(),
        API.fetchAllUsers(),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(users => {
        expect(Array.isArray(users)).toBe(true);
      });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('deve manter isolamento entre requisições paralelas que falham', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ email: 'success@test.com' }],
        })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ email: 'success2@test.com' }],
        });

      const [result1, result2, result3] = await Promise.all([
        API.fetchAllUsers(),
        API.fetchAllUsers(),
        API.fetchAllUsers(),
      ]);

      expect(result1[0].email).toBe('success@test.com');
      expect(Array.isArray(result2)).toBe(true); // fallback to mock
      expect(result3[0].email).toBe('success2@test.com');
    });
  });

  describe('Rate limiting e retry', () => {
    it('deve lidar com resposta 429 (Too Many Requests)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' }),
      });

      const users = await API.fetchAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it('deve lidar com múltiplas falhas consecutivas', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'));

      const users1 = await API.fetchAllUsers();
      const users2 = await API.fetchAllUsers();

      expect(Array.isArray(users1)).toBe(true);
      expect(Array.isArray(users2)).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Validação de dados', () => {
    it('deve lidar com resposta vazia do servidor', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const users = await API.fetchAllUsers();
      expect(users).toEqual([]);
    });

    it('deve lidar com resposta null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const users = await API.fetchAllUsers();
      expect(users).toBeNull();
    });

    it('deve lidar com resposta com estrutura inesperada', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: 'structure' }),
      });

      const result = await API.fetchAllUsers();
      expect(result).toEqual({ unexpected: 'structure' });
    });
  });

  describe('Headers e autenticação', () => {
    it('deve enviar headers corretos nas requisições', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await API.fetchAllUsers();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('deve lidar com erro de autenticação (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Authentication required' }),
      });

      const users = await API.fetchAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it('deve lidar com erro de permissão (403)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'Insufficient permissions' }),
      });

      const users = await API.fetchAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('Fallback para mock data', () => {
    it('deve usar mock data quando backend está indisponível', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const users = await API.fetchAllUsers();
      
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      // Valida que retornou mock data estruturado
      expect(users[0]).toHaveProperty('email');
    });

    it('deve usar mock data quando resposta é inválida', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => {
          throw new Error('Service down');
        },
      });

      const users = await API.fetchAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });
  });
});
