import { describe, it, expect, vi, afterEach } from 'vitest';
import * as API from '../../services/api';
import type { Job } from '../../types';

describe('[E2E-SMOKE] Stripe Timeout + Retry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('createCheckoutSession: 1ª tentativa E_TIMEOUT → 2ª tentativa sucesso', async () => {
    const job = { id: 'job-timeout-retry' } as unknown as Job;
    const amount = 150;

    const fetchSpy = vi.spyOn(globalThis, 'fetch' as any);

    // 1) Simula AbortError (vitest/node: criar Error e setar name)
    const abortErr = new Error('aborted');
    (abortErr as any).name = 'AbortError';
    fetchSpy.mockRejectedValueOnce(abortErr);

    // 2) Segunda chamada com sucesso
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'cs_test_retry_ok' }),
    } as any);

    // 1ª: deve falhar com E_TIMEOUT
    await expect(API.createCheckoutSession(job, amount)).rejects.toMatchObject({ code: 'E_TIMEOUT' });

    // 2ª: retry manual (sucesso)
    const res = await API.createCheckoutSession(job, amount);
    expect(res).toEqual({ id: 'cs_test_retry_ok' });

    // Sanidade: 2 chamadas ao fetch, endpoint esperado utilizado
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [firstCallUrl] = fetchSpy.mock.calls[0];
    const [secondCallUrl] = fetchSpy.mock.calls[1];
    expect(String(firstCallUrl)).toContain('/create-checkout-session');
    expect(String(secondCallUrl)).toContain('/create-checkout-session');
  });
});
