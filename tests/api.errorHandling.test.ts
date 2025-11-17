/**
 * Testes de tratamento de erro da função apiCall
 * Cobre todos os branches de erro estruturado (E_NETWORK, E_TIMEOUT, E_AUTH, E_NOT_FOUND, E_SERVER)
 * 
 * Usa funções Stripe que NÃO fazem fallback para mock (lançam erros diretamente):
 * - createStripeConnectAccount
 * - createStripeAccountLink
 * - createCheckoutSession
 * - releasePayment
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as API from '../services/api';

// Mock global fetch
const originalFetch = global.fetch;
let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFetch = vi.fn();
  global.fetch = mockFetch as any;
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.clearAllMocks();
});

describe('apiCall - Error Handling', () => {
  describe('E_TIMEOUT - AbortController', () => {
    it('deve lançar E_TIMEOUT quando AbortError ocorre', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      mockFetch.mockRejectedValueOnce(abortError);

      try {
        await API.createStripeConnectAccount('test@test.com');
        expect.fail('Should have thrown E_TIMEOUT');
      } catch (error: any) {
        expect(error.code).toBe('E_TIMEOUT');
        expect(error.message).toContain('Tempo de resposta excedido');
      }
    });
  });

  describe('E_AUTH - 401/403', () => {
    it('deve lançar E_AUTH para status 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Token inválido' }),
      });

      try {
        await API.createStripeConnectAccount('test@test.com');
        expect.fail('Should have thrown E_AUTH');
      } catch (error: any) {
        expect(error.code).toBe('E_AUTH');
        expect(error.status).toBe(401);
        expect(error.message).toContain('Não autorizado');
        expect(error.details).toEqual({ error: 'Token inválido' });
      }
    });

    it('deve lançar E_AUTH para status 403', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'Acesso negado' }),
      });

      try {
        await API.createStripeAccountLink('test@test.com');
        expect.fail('Should have thrown E_AUTH');
      } catch (error: any) {
        expect(error.code).toBe('E_AUTH');
        expect(error.status).toBe(403);
        expect(error.message).toContain('Não autorizado');
      }
    });
  });

  describe('E_NOT_FOUND - 404', () => {
    it('deve lançar E_NOT_FOUND para status 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Conta Stripe não encontrada' }),
      });

      try {
        await API.releasePayment('job-123');
        expect.fail('Should have thrown E_NOT_FOUND');
      } catch (error: any) {
        expect(error.code).toBe('E_NOT_FOUND');
        expect(error.status).toBe(404);
        expect(error.message).toContain('Recurso não encontrado');
        expect(error.details).toEqual({ error: 'Conta Stripe não encontrada' });
      }
    });
  });

  describe('E_SERVER - 500+', () => {
    it('deve lançar E_SERVER para status 500', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Stripe API error' }),
      });

      try {
        await API.createStripeConnectAccount('test@test.com');
        expect.fail('Should have thrown E_SERVER');
      } catch (error: any) {
        expect(error.code).toBe('E_SERVER');
        expect(error.status).toBe(500);
        expect(error.message).toContain('Erro interno do servidor');
        expect(error.details).toEqual({ error: 'Stripe API error' });
      }
    });

    it('deve lançar E_SERVER para status 503', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ error: 'Service temporarily unavailable' }),
      });

      try {
        await API.createCheckoutSession('proposal-123', 'client@test.com');
        expect.fail('Should have thrown E_SERVER');
      } catch (error: any) {
        expect(error.code).toBe('E_SERVER');
        expect(error.status).toBe(503);
        expect(error.message).toContain('Erro interno do servidor');
      }
    });

    it('deve tratar erro quando json() falha', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      try {
        await API.releasePayment('job-123');
        expect.fail('Should have thrown E_SERVER');
      } catch (error: any) {
        expect(error.code).toBe('E_SERVER');
        expect(error.status).toBe(500);
        expect(error.details).toEqual({ message: 'Internal Server Error' });
      }
    });
  });

  describe('E_NETWORK - Network failures', () => {
    it('deve lançar E_NETWORK para TypeError (network error)', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      try {
        await API.createStripeConnectAccount('test@test.com');
        expect.fail('Should have thrown E_NETWORK');
      } catch (error: any) {
        expect(error.code).toBe('E_NETWORK');
        expect(error.message).toContain('Falha de rede');
      }
    });

    it('deve lançar E_NETWORK para erro genérico', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      try {
        await API.createStripeAccountLink('test@test.com');
        expect.fail('Should have thrown E_NETWORK');
      } catch (error: any) {
        expect(error.code).toBe('E_NETWORK');
        expect(error.message).toContain('Falha de rede');
      }
    });

    it('deve rethrow erro já estruturado', async () => {
      const structuredError: any = new Error('Custom error');
      structuredError.code = 'E_CUSTOM';
      
      mockFetch.mockRejectedValueOnce(structuredError);

      try {
        await API.createCheckoutSession('proposal-123', 'client@test.com');
        expect.fail('Should have rethrown structured error');
      } catch (error: any) {
        expect(error.code).toBe('E_CUSTOM');
        expect(error.message).toBe('Custom error');
      }
    });
  });

  describe('E_SERVER - Other HTTP errors', () => {
    it('deve lançar E_SERVER para status 400 (não AUTH/NOT_FOUND)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid userId format' }),
      });

      try {
        await API.createStripeConnectAccount('invalid-user');
        expect.fail('Should have thrown E_SERVER');
      } catch (error: any) {
        expect(error.code).toBe('E_SERVER');
        expect(error.status).toBe(400);
        expect(error.message).toContain('Erro interno do servidor');
      }
    });

    it('deve lançar E_SERVER para status 422', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({ error: 'Validation failed: amount too low' }),
      });

      try {
        await API.createCheckoutSession('proposal-123', 'client@test.com');
        expect.fail('Should have thrown E_SERVER');
      } catch (error: any) {
        expect(error.code).toBe('E_SERVER');
        expect(error.status).toBe(422);
      }
    });
  });

  describe('Timeout clearTimeout', () => {
    it('deve limpar timeout quando requisição é bem-sucedida', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accountId: 'acct_123' }),
      });

      await API.createStripeConnectAccount('test@test.com');

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('deve limpar timeout quando requisição falha', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      try {
        await API.createStripeConnectAccount('test@test.com');
      } catch {
        // Expected
      }

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
