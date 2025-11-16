import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchProposals, fetchDisputes, fetchJobById } from '../services/api';

declare const global: any;

describe('API Service – cobertura adicional pontual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchProposals: sucesso e fallback para MOCK_PROPOSALS quando falha', async () => {
    const proposals = [
      { id: 'p1', jobId: 'job-1', providerId: 'prov@test.com', price: 100, status: 'pendente' },
    ];

    // Sucesso
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => proposals,
    } as any);

    const ok = await fetchProposals();
    expect(ok).toEqual(proposals);

    // Falha -> fallback
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('down'));
    const fb = await fetchProposals();
    expect(Array.isArray(fb)).toBe(true);
    expect(fb.length).toBeGreaterThan(0);
  });

  it('fetchDisputes: fallback para [] quando backend falha', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('offline'));
    const result = await fetchDisputes();
    expect(result).toEqual([]);
  });

  it('fetchJobById: sucesso e fallback quando backend falha', async () => {
    // Sucesso
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'job-3', status: 'ativo' }),
    } as any);
    const ok = await fetchJobById('job-3');
    expect(ok?.id).toBe('job-3');

    // Falha -> fallback do MOCK_JOBS
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('timeout'));
    const fb = await fetchJobById('job-3');
    expect(fb?.id).toBe('job-3');
  });
});
