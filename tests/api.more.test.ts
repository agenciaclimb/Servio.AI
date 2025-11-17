import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchOpenJobs,
  fetchMaintainedItems,
  createMaintainedItem,
  fetchBids,
  fetchBidsForProvider,
  fetchFraudAlerts,
  fetchSentimentAlerts,
} from '../services/api';

declare const global: any;

describe('API Service – additional coverage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchOpenJobs', () => {
    it('combina resultados de jobs ativos e em leilão do backend', async () => {
      const active = [
        { id: 'job-a1', status: 'ativo' },
        { id: 'job-a2', status: 'ativo' },
      ];
      const auction = [
        { id: 'job-l1', status: 'em_leilao' },
      ];

      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: true, json: async () => active } as any)
        .mockResolvedValueOnce({ ok: true, json: async () => auction } as any);

      const result = await fetchOpenJobs();

      expect(result).toHaveLength(active.length + auction.length);
      expect(result.map(j => j.id)).toEqual(['job-a1', 'job-a2', 'job-l1']);
    });

    it('faz fallback para MOCK_JOBS quando o backend falha', async () => {
      // Primeira chamada falha -> cai no catch e usa mock
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network down'));

      const result = await fetchOpenJobs();

      // Do mockData.ts: job-3 (ativo) e job-6 (em_leilao)
      const ids = result.map(j => j.id).sort();
      expect(ids).toEqual(['job-3', 'job-6']);
    });
  });

  describe('Maintained Items', () => {
    it('busca itens mantidos para um cliente (sucesso)', async () => {
      const clientId = 'cliente@servio.ai';
      const items = [
        { id: 'item-x', clientId, name: 'Ar Condicionado' },
      ];

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => items,
      } as any);

      const result = await fetchMaintainedItems(clientId);
      expect(result).toEqual(items);
    });

    it('faz fallback para itens do mock quando o backend falha', async () => {
      const clientId = 'cliente@servio.ai';
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('timeout'));

      const result = await fetchMaintainedItems(clientId);
      // mockData.ts possui 2 itens para este cliente
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.every((i: any) => i.clientId === clientId)).toBe(true);
    });

    it('cria novo item mantido (sucesso)', async () => {
      const newItem = {
        clientId: 'cliente@servio.ai',
        name: 'Purificador',
        category: 'Eletrodomésticos',
        brand: 'MarcaX',
        model: 'M1',
        serialNumber: 'SN-123',
        imageUrl: 'https://example.com/img.png',
      };

      const created = {
        ...newItem,
        id: 'item-new-1',
        createdAt: new Date().toISOString(),
        maintenanceHistory: [],
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => created,
      } as any);

      const result = await createMaintainedItem(newItem as any);
      expect(result.id).toBe('item-new-1');
      expect(result.name).toBe('Purificador');
    });
  });

  describe('Bids', () => {
    it('lista bids (sucesso)', async () => {
      const bids = [
        { id: 'bid-1', jobId: 'job-6', providerId: 'prov1', amount: 100 },
      ];
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => bids,
      } as any);

      const result = await fetchBids();
      expect(result).toEqual(bids);
    });

    it('faz fallback para MOCK_BIDS quando falha', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('offline'));
      const result = await fetchBids();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('filtra bids por provider no fallback', async () => {
      // Forçamos fallback
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('nope'));
      const result = await fetchBidsForProvider('fernanda.design@email.com');
      // mockData.ts tem 1 bid para essa provider
      expect(result).toHaveLength(1);
      expect(result[0].providerId).toBe('fernanda.design@email.com');
    });
  });

  describe('fetchFraudAlerts (alias)', () => {
    it('retorna o mesmo resultado de fetchSentimentAlerts', async () => {
      const alerts = [
        { id: 'a1', providerId: 'p@test.com', riskScore: 70, reason: 'teste', status: 'novo' },
      ];
      const spy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => alerts,
      } as any);

      const [fraud, sentiment] = await Promise.all([
        fetchFraudAlerts(),
        fetchSentimentAlerts(),
      ]);

      expect(fraud).toEqual(sentiment);
      expect(fraud[0].id).toBe('a1');
      expect(spy).toHaveBeenCalled();
    });
  });
});
