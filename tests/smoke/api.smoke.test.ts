import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchJobs } from '../../services/api';

const mockFetch = vi.fn();

beforeEach(() => {
  global.fetch = mockFetch as any;
  mockFetch.mockReset();
});

describe('api.smoke', () => {
  it('Teste GET com sucesso', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    const res = await fetchJobs();
    expect(Array.isArray(res)).toBe(true);
  });

  it('Teste GET com erro', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const res = await fetchJobs();
    expect(Array.isArray(res)).toBe(true);
  });
});
