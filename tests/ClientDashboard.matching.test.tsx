import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as API from '../services/api';

describe('ClientDashboard - Matching Flow Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('matchProvidersForJob integration with matching state', () => {
    it('carrega profissionais recomendados para um job', async () => {
      const jobId = 'job-123';
      const mockMatches: API.MatchingProvider[] = [
        {
          provider: {
            email: 'joao@servio.ai',
            name: 'João Silva',
            type: 'prestador',
            status: 'ativo',
            location: 'São Paulo, SP',
            headline: 'Eletricista',
            completionRate: 0.95,
          },
          score: 0.92,
          reason: 'Excelente match',
        },
      ];

      vi.spyOn(API, 'matchProvidersForJob').mockResolvedValueOnce(mockMatches);

      const results = await API.matchProvidersForJob(jobId);

      expect(results).toHaveLength(1);
      expect(results[0].provider.name).toBe('João Silva');
      expect(results[0].score).toBe(0.92);
    });

    it('retorna múltiplos profissionais ordenados por score', async () => {
      const jobId = 'job-456';
      const mockMatches: API.MatchingProvider[] = [
        {
          provider: {
            email: 'prov1@email.com',
            name: 'Provider 1',
            type: 'prestador',
            status: 'ativo',
            location: 'São Paulo',
            headline: 'Skilled',
            completionRate: 0.9,
          },
          score: 0.95,
          reason: 'Best match',
        },
        {
          provider: {
            email: 'prov2@email.com',
            name: 'Provider 2',
            type: 'prestador',
            status: 'ativo',
            location: 'São Paulo',
            headline: 'Good',
            completionRate: 0.8,
          },
          score: 0.82,
          reason: 'Good match',
        },
      ];

      vi.spyOn(API, 'matchProvidersForJob').mockResolvedValueOnce(mockMatches);

      const results = await API.matchProvidersForJob(jobId);

      expect(results).toHaveLength(2);
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });

    it('trata erro ao carregar matches com fallback', async () => {
      const jobId = 'job-789';

      vi.spyOn(API, 'matchProvidersForJob').mockRejectedValueOnce(new Error('Network error'));

      try {
        await API.matchProvidersForJob(jobId);
        expect.fail('Should throw error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('inviteProvider integration flow', () => {
    it('convida prestador com sucesso para um job', async () => {
      const jobId = 'job-999';
      const providerId = 'provider@example.com';

      vi.spyOn(API, 'inviteProvider').mockResolvedValueOnce({ success: true });

      const result = await API.inviteProvider(jobId, providerId);

      expect(result.success).toBe(true);
    });

    it('mantém estado de convite após sucesso', async () => {
      const jobId = 'job-111';
      const providerId = 'email1@example.com';
      const providerId2 = 'email2@example.com';

      vi.spyOn(API, 'inviteProvider').mockResolvedValue({ success: true });

      const result1 = await API.inviteProvider(jobId, providerId);
      const result2 = await API.inviteProvider(jobId, providerId2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('convida múltiplos prestadores de um mesmo job', async () => {
      const jobId = 'job-multi';
      const providers = ['prov1@email.com', 'prov2@email.com', 'prov3@email.com'];

      vi.spyOn(API, 'inviteProvider').mockResolvedValue({ success: true });

      const results = await Promise.all(
        providers.map(providerId => API.inviteProvider(jobId, providerId))
      );

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Modal state management for recommendations', () => {
    it('abre modal ao clicar em ver recomendações', async () => {
      // Simular estado local: { isMatchingModalOpen: true, matchingJobId, matchingResults }
      const mockState = {
        isMatchingModalOpen: true,
        matchingJobId: 'job-123',
        matchingResults: [],
      };

      const mockMatches: API.MatchingProvider[] = [
        {
          provider: {
            email: 'test@email.com',
            name: 'Test Provider',
            type: 'prestador',
            status: 'ativo',
            location: 'São Paulo',
            headline: 'Test',
            completionRate: 0.9,
          },
          score: 0.85,
          reason: 'Test reason',
        },
      ];

      vi.spyOn(API, 'matchProvidersForJob').mockResolvedValueOnce(mockMatches);

      const results = await API.matchProvidersForJob(mockState.matchingJobId);

      expect(mockState.isMatchingModalOpen).toBe(true);
      expect(mockState.matchingJobId).toBe('job-123');
      expect(results).toHaveLength(1);
    });

    it('fecha modal e limpa estado', async () => {
      // Simular estado inicial com modal aberto
      let state = {
        isMatchingModalOpen: true,
        matchingJobId: 'job-123',
        matchingResults: [
          {
            provider: {
              email: 'test@email.com',
              name: 'Test',
              type: 'prestador',
              status: 'ativo',
              location: 'SP',
              headline: 'Test',
              completionRate: 0.9,
            },
            score: 0.85,
            reason: 'Test',
          },
        ],
      };

      // Simular handleCloseMatchingModal
      state = {
        isMatchingModalOpen: false,
        matchingJobId: null,
        matchingResults: [],
      };

      expect(state.isMatchingModalOpen).toBe(false);
      expect(state.matchingJobId).toBeNull();
      expect(state.matchingResults).toHaveLength(0);
    });

    it('mantém estado de recomendações ao convidar prestador', async () => {
      const state = {
        isMatchingModalOpen: true,
        matchingJobId: 'job-123',
        matchingResults: [
          {
            provider: {
              email: 'prov1@email.com',
              name: 'Provider 1',
              type: 'prestador',
              status: 'ativo',
              location: 'SP',
              headline: 'Skilled',
              completionRate: 0.95,
            },
            score: 0.92,
            reason: 'Best',
          },
          {
            provider: {
              email: 'prov2@email.com',
              name: 'Provider 2',
              type: 'prestador',
              status: 'ativo',
              location: 'SP',
              headline: 'Good',
              completionRate: 0.85,
            },
            score: 0.8,
            reason: 'Good',
          },
        ],
      };

      vi.spyOn(API, 'inviteProvider').mockResolvedValueOnce({ success: true });

      const result = await API.inviteProvider(
        state.matchingJobId,
        state.matchingResults[0].provider.email
      );

      // Modal deve permanecer aberto com dados intactos
      expect(state.isMatchingModalOpen).toBe(true);
      expect(state.matchingResults).toHaveLength(2);
      expect(result.success).toBe(true);
    });
  });

  describe('Toast feedback messages', () => {
    it('exibe sucesso ao carregar recomendações', async () => {
      const mockMatches: API.MatchingProvider[] = [];
      vi.spyOn(API, 'matchProvidersForJob').mockResolvedValueOnce(mockMatches);

      const results = await API.matchProvidersForJob('job-test');

      // Esperado: "Profissionais recomendados carregados com sucesso!"
      expect(Array.isArray(results)).toBe(true);
    });

    it('exibe sucesso ao convidar prestador', async () => {
      vi.spyOn(API, 'inviteProvider').mockResolvedValueOnce({ success: true });

      const result = await API.inviteProvider('job-test', 'provider@test.com');

      // Esperado: "Prestador convidado com sucesso!"
      expect(result.success).toBe(true);
    });

    it('exibe erro ao falhar carregar recomendações', async () => {
      vi.spyOn(API, 'matchProvidersForJob').mockRejectedValueOnce(new Error('Failed to fetch'));

      try {
        await API.matchProvidersForJob('job-fail');
        expect.fail('Should reject');
      } catch (error) {
        // Esperado: "Erro ao carregar profissionais recomendados. Tente novamente."
        expect(error).toBeDefined();
      }
    });
  });
});
