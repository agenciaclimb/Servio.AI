import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchProviders,
  fetchUserById,
  createUser,
  updateUser,
  fetchJobs,
  fetchJobsForUser,
  fetchMessages,
  fetchNotifications,
} from '../services/api';

// Tipar global para evitar TS reclamar em alguns ambientes
declare const global: any;

const originalFetch = global.fetch;

describe('API Service – Users, Jobs, Messages & Notifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('Users', () => {
    it('fetchProviders: busca apenas prestadores verificados (sucesso)', async () => {
      const providers = [
        { email: 'prov1@test.com', type: 'prestador', verificationStatus: 'verificado' },
        { email: 'prov2@test.com', type: 'prestador', verificationStatus: 'verificado' },
      ];

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => providers,
      } as any);

      const result = await fetchProviders();
      expect(result).toEqual(providers);
    });

    it('fetchUserById: retorna usuário do backend (sucesso) e cai para mock quando falha', async () => {
      const userId = 'cliente@servio.ai';
      const backendUser = { email: userId, name: 'Cliente X', type: 'cliente' };

      // Sucesso do backend
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => backendUser,
      } as any);

      const ok = await fetchUserById(userId);
      expect(ok?.email).toBe(userId);

      // Falha do backend -> fallback para MOCK_USERS
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('offline'));
      const fb = await fetchUserById(userId);
      expect(fb?.email).toBe(userId); // user existe em MOCK_USERS
    });

    it('createUser: cria usuário (POST) com sucesso', async () => {
      const newUser = { email: 'novo@test.com', name: 'Novo', type: 'cliente' } as any;
      const created = { ...newUser, memberSince: new Date().toISOString() };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => created,
      } as any);

      const result = await createUser(newUser);
      expect(result.email).toBe('novo@test.com');
    });

    it('updateUser: atualiza usuário (PUT) com sucesso', async () => {
      const userId = 'cliente@servio.ai';
      const updates = { city: 'São Paulo' } as any;
      const updated = { email: userId, name: 'Cliente', type: 'cliente', city: 'São Paulo' };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => updated,
      } as any);

      const result = await updateUser(userId, updates);
      expect(result.city).toBe('São Paulo');
    });
  });

  describe('Jobs', () => {
    it('fetchJobs: busca lista de jobs (sucesso) e faz fallback quando falha', async () => {
      const jobs = [
        { id: 'job-a', status: 'ativo' },
        { id: 'job-b', status: 'concluido' },
      ];

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => jobs,
      } as any);

      const ok = await fetchJobs();
      expect(ok).toEqual(jobs);

      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network'));
      const fb = await fetchJobs();
      expect(Array.isArray(fb)).toBe(true);
      expect(fb.length).toBeGreaterThan(0);
    });

    it('fetchJobsForUser: busca jobs do cliente (sucesso) e faz fallback quando falha', async () => {
      const userId = 'cliente@servio.ai';
      const jobs = [
        { id: 'job-1', clientId: userId },
        { id: 'job-2', clientId: userId },
      ];

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => jobs,
      } as any);

      const ok = await fetchJobsForUser(userId);
      expect(ok.every((j: any) => j.clientId === userId)).toBe(true);

      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('down'));
      const fb = await fetchJobsForUser(userId);
      expect(fb.every((j: any) => j.clientId === userId)).toBe(true);
    });
  });

  describe('Messages', () => {
    it('fetchMessages: busca todas as mensagens quando chatId não é passado', async () => {
      const messages = [
        { id: 'm1', chatId: 'c1', text: 'oi' },
        { id: 'm2', chatId: 'c2', text: 'ola' },
      ];

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => messages,
      } as any);

      const result = await fetchMessages();
      expect(result).toEqual(messages);
    });

    it('fetchMessages: busca mensagens por chatId, com fallback em caso de falha', async () => {
      const chatId = 'chat-abc';

      // Sucesso
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'm3', chatId, text: 'tudo bem?' }],
      } as any);

      const ok = await fetchMessages(chatId);
      expect(ok[0].chatId).toBe(chatId);

      // Falha -> fallback
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('timeout'));
      const fb = await fetchMessages(chatId);
      expect(Array.isArray(fb)).toBe(true);
      expect(fb.every((m: any) => m.chatId === chatId)).toBe(true);
    });
  });

  describe('Notifications', () => {
    it('fetchNotifications: busca por usuário (sucesso) e faz fallback quando falha', async () => {
      const userId = 'cliente@servio.ai';
      const notifs = [{ id: 'n1', userId, text: 'Bem-vindo' }];

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => notifs,
      } as any);

      const ok = await fetchNotifications(userId);
      expect(ok).toEqual(notifs);

      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('nope'));
      const fb = await fetchNotifications(userId);
      expect(Array.isArray(fb)).toBe(true);
      expect(fb.every((n: any) => n.userId === userId)).toBe(true);
    });
  });
});
