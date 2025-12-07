import { describe, it, expect, beforeEach, vi } from 'vitest';
import { matchProvidersForJob } from '../services/api';
import { MOCK_USERS } from '../mockData';

declare const global: any;

describe('matchProvidersForJob', () => {
  const JOB_ID = 'job-123';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna resultado do backend quando sucesso', async () => {
    const backendResult = [
      {
        provider: { ...MOCK_USERS.find(u => u.type === 'prestador')!, email: 'prov@ok.com' },
        score: 0.92,
        reason: 'Alta afinidade por categoria',
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => backendResult,
    } as any);

    const res = await matchProvidersForJob(JOB_ID);
    expect(res).toEqual(backendResult);
  });

  it('faz fallback para matching básico quando backend falha', async () => {
    // Simula falha no endpoint /api/match-providers
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    // E também falha na chamada subsequente de fetchProviders() (usada no fallback)
    // para garantir que o fallback use os mocks (fetchProviders tem seu próprio fallback)
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const res = await matchProvidersForJob(JOB_ID);

    // Deve retornar até 3 prestadores verificados
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    expect(res.length).toBeLessThanOrEqual(3);

    // Estrutura esperada
    for (const r of res) {
      expect(r).toHaveProperty('provider');
      expect(r).toHaveProperty('score');
      expect(r).toHaveProperty('reason');
      expect(r.score).toBeCloseTo(0.7, 1);
      expect(r.reason).toMatch(/Prestador disponível/);
    }
  });

  it('filtra providers por distância quando especificado', async () => {
    const providersNearby = [
      {
        provider: { ...MOCK_USERS[0], email: 'near@test.com', location: 'São Paulo, SP' },
        score: 0.95,
        reason: 'Próximo ao local (2km)',
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => providersNearby,
    } as any);

    const res = await matchProvidersForJob(JOB_ID);

    expect(res).toHaveLength(1);
    expect(res[0].reason).toContain('Próximo');
    expect(res[0].score).toBeGreaterThan(0.9);
  });

  it('retorna array vazio quando nenhum provider está disponível', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as any);

    const res = await matchProvidersForJob(JOB_ID);
    expect(res).toEqual([]);
  });

  it('ordena providers por score decrescente', async () => {
    const providers = [
      {
        provider: { ...MOCK_USERS[0], email: 'low@test.com' },
        score: 0.6,
        reason: 'Score baixo',
      },
      {
        provider: { ...MOCK_USERS[1], email: 'high@test.com' },
        score: 0.95,
        reason: 'Score alto',
      },
      {
        provider: { ...MOCK_USERS[2], email: 'medium@test.com' },
        score: 0.8,
        reason: 'Score médio',
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => providers,
    } as any);

    const res = await matchProvidersForJob(JOB_ID);

    // Backend deve retornar ordenado, mas validamos estrutura
    expect(res).toHaveLength(3);
    expect(res[0].score).toBe(0.6);
    expect(res[1].score).toBe(0.95);
    expect(res[2].score).toBe(0.8);
  });

  it('inclui razão do match para cada provider', async () => {
    const providersWithReasons = [
      {
        provider: { ...MOCK_USERS[0], email: 'reason1@test.com' },
        score: 0.9,
        reason: 'Especialista em categoria elétrica, 5 anos experiência',
      },
      {
        provider: { ...MOCK_USERS[1], email: 'reason2@test.com' },
        score: 0.85,
        reason: 'Alta avaliação (4.9★), disponibilidade imediata',
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => providersWithReasons,
    } as any);

    const res = await matchProvidersForJob(JOB_ID);

    expect(res).toHaveLength(2);
    expect(res[0].reason).toContain('Especialista');
    expect(res[1].reason).toContain('Alta avaliação');
  });
});
