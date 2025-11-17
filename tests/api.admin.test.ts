import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suspendProvider, reactivateProvider, setVerificationStatus } from '../services/api';

declare const global: any;

describe('Admin Provider Management', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('suspende um provedor com motivo', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Provider suspended' }),
    } as any);

    const res = await suspendProvider('prov@test.com', 'fraude');
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/suspend/);
  });

  it('reativa um provedor', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Provider reactivated' }),
    } as any);

    const res = await reactivateProvider('prov@test.com');
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/reactiv/);
  });

  it('atualiza status de verificação', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Verification updated' }),
    } as any);

    const res = await setVerificationStatus('prov@test.com', 'verificado', 'docs ok');
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/Verif|verif/i);
  });
});
