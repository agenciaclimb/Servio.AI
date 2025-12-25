import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as API from '../services/api';

function simulateResponse(status: number, body: any = { message: 'x' }) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('[E2E-SMOKE] Error Handling API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('404 → retorna fallback ou lança ApiError E_NOT_FOUND (jobs)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(simulateResponse(404));
    const jobs = await API.fetchOpenJobs();
    expect(Array.isArray(jobs)).toBe(true);
  });

  it('500 → usa fallback de propostas mock (não lança)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(simulateResponse(500));
    const proposals = await API.fetchProposals();
    expect(Array.isArray(proposals)).toBe(true);
    expect(proposals.length).toBeGreaterThan(0);
  });

  it('Timeout → retorna lista básica de providers (fallback)', async () => {
    // Primeira chamada: força AbortError (timeout interno)
    // Segunda chamada (fallback fetchProviders): retorna lista mínima mock
    vi.spyOn(globalThis, 'fetch')
      .mockImplementationOnce((_url, _opts) =>
        Promise.reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              type: 'prestador',
              verificationStatus: 'verificado',
              email: 'p@mock',
              name: 'Prestador Mock',
              status: 'ativo',
              memberSince: '2023-01-01T00:00:00Z',
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

    const providers = await API.matchProvidersForJob('job-x');
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
    expect(providers[0]).toHaveProperty('provider');
  });

  it('Network failure → retorna lista mock de usuários', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Network down'));
    const users = await API.fetchAllUsers();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  it('Auth 401 → retorna notificações mock (fallback)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(simulateResponse(401));
    const notifications = await API.fetchNotifications('user@test');
    expect(Array.isArray(notifications)).toBe(true);
  });
});
