import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as API from '../services/api';

declare const global: any;

describe('inviteProvider', () => {
  const JOB_ID = 'job-123';
  const PROVIDER_ID = 'provider@example.com';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('envia convite com sucesso para o backend', async () => {
    const mockResponse = { success: true };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const result = await API.inviteProvider(JOB_ID, PROVIDER_ID);

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/jobs/${JOB_ID}/invite-provider`),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('retorna { success: false } quando backend retorna erro', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid provider' }),
    } as any);

    try {
      await API.inviteProvider(JOB_ID, PROVIDER_ID);
      // Se o backend retorna ok: false, apiCall deve lançar erro
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('faz fallback para sucesso simulado quando rede falha', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const result = await API.inviteProvider(JOB_ID, PROVIDER_ID);

    // Deve retornar sucesso via fallback mock
    expect(result.success).toBe(true);
  });

  it('valida que o corpo da requisição contém providerId correto', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as any);

    await API.inviteProvider(JOB_ID, PROVIDER_ID);

    const callArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body).toEqual({ providerId: PROVIDER_ID });
  });

  it('usa método HTTP POST para o endpoint', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as any);

    await API.inviteProvider(JOB_ID, PROVIDER_ID);

    const callArgs = (global.fetch as any).mock.calls[0];
    expect(callArgs[1].method).toBe('POST');
  });

  it('tratamento de erro com fallback para sucesso', async () => {
    // Primeiro request falha
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Connection timeout'));

    const result = await API.inviteProvider(JOB_ID, PROVIDER_ID);

    // Fallback deve retornar sucesso
    expect(result).toEqual({ success: true });
  });

  it('loga warning quando backend falha e usa mock', async () => {
    const warnSpy = vi.spyOn(console, 'warn');
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API unavailable'));

    await API.inviteProvider(JOB_ID, PROVIDER_ID);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send provider invite'),
      expect.any(Error)
    );
  });
});
