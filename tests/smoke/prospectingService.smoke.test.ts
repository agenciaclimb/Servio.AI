import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  searchGoogleForProviders,
  sendProspectInvitation,
} from '../../services/prospectingService';

const mockFetch = vi.fn();

beforeEach(() => {
  global.fetch = mockFetch as any;
  mockFetch.mockReset();
});

describe('prospectingService.smoke', () => {
  it('getProspects() sucesso', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [{ name: 'Pro' }] });
    const res = await searchGoogleForProviders('eletricista', 'sp');
    expect(res[0]?.name).toBe('Pro');
  });

  it('getProspects() erro', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const res = await searchGoogleForProviders('eletricista', 'sp');
    expect(res).toEqual([]);
  });

  it('matchingProviders() sucesso', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const ok = await sendProspectInvitation('p@x.com', 'Pro', 'cat', 'loc');
    expect(ok).toBe(true);
  });

  it('matchingProviders() erro', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    const ok = await sendProspectInvitation('p@x.com', 'Pro', 'cat', 'loc');
    expect(ok).toBe(false);
  });
});
