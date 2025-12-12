import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStripeConnectAccount, releasePayment } from '../../services/api';

const mockFetch = vi.fn();

beforeEach(() => {
  global.fetch = mockFetch as any;
  mockFetch.mockReset();
});

describe('stripeService.smoke', () => {
  it('pagamento sucesso (mock)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, message: 'ok' }) });
    const res = await releasePayment('job-1');
    expect(res.success).toBe(true);
  });

  it('pagamento erro', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    await expect(createStripeConnectAccount('u1')).rejects.toBeTruthy();
  });
});
