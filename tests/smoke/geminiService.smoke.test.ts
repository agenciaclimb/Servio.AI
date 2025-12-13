import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enhanceJobRequest } from '../../services/geminiService';

const mockFetch = vi.fn();

beforeEach(() => {
  global.fetch = mockFetch as any;
  mockFetch.mockReset();
});

describe('geminiService.smoke', () => {
  it('chamada para IA com sucesso (mock)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        enhancedDescription: 'ok',
        suggestedCategory: 'geral',
        suggestedServiceType: 'personalizado',
      }),
    });
    const res = await enhanceJobRequest('Preciso de reparo');
    expect(res.suggestedCategory).toBe('geral');
  });

  it('chamada retorna erro', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail'));
    mockFetch.mockResolvedValueOnce({ ok: false });
    const res = await enhanceJobRequest('Reparo de luz');
    expect(res.enhancedDescription).toContain('Reparo');
  });
});
