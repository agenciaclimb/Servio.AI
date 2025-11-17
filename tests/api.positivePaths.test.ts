import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as API from '../services/api';
import { Job } from '../types';

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

describe('API Service – positive paths (no fallback)', () => {
  it('createStripeConnectAccount returns accountId on success', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ accountId: 'acct_123' }) });
    const res = await API.createStripeConnectAccount('user@test.com');
    expect(res).toEqual({ accountId: 'acct_123' });
  });

  it('createStripeAccountLink returns url on success', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ url: 'https://stripe.test' }) });
    const res = await API.createStripeAccountLink('user@test.com');
    expect(res).toEqual({ url: 'https://stripe.test' });
  });

  it('createCheckoutSession returns id on success', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'cs_123' }) });
    const res = await API.createCheckoutSession({ id: 'job-1' } as unknown as Job, 10000);
    expect(res).toEqual({ id: 'cs_123' });
  });

  it('releasePayment returns success on success', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, message: 'ok' }) });
    const res = await API.releasePayment('job-1');
    expect(res).toEqual({ success: true, message: 'ok' });
  });
});
