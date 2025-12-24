import { describe, it, expect, vi } from 'vitest';
import * as API from '../services/api';

function simulateResponse(status: number, body: any = { message: 'x' }) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('[E2E-SMOKE] Pagamentos/Stripe Errors', () => {
  it('checkout session 500 → ApiError E_SERVER', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(simulateResponse(500));
    await expect(API.createCheckoutSession({ id: 'job-1' } as any, 100)).rejects.toMatchObject({ code: 'E_SERVER' });
  });

  it('releasePayment conflito 409 → ApiError E_SERVER (normalizado)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(simulateResponse(409));
    await expect(API.releasePayment('job-2')).rejects.toMatchObject({ code: 'E_SERVER' });
  });

  it('network failure ao confirmar pagamento → ApiError E_NETWORK', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Network down'));
    await expect(API.confirmPayment('job-3', 'sess_123')).rejects.toMatchObject({ code: 'E_NETWORK' });
  });
});
