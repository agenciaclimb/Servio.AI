import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCheckoutSession,
  releasePayment,
  confirmPayment,
  createDispute,
  resolveDispute,
} from '../services/api';
import type { Job, Dispute } from '../types';

declare const global: any;

describe('Payment & Escrow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('createCheckoutSession', () => {
    const mockJob: Job = {
      id: 'job-pay-123',
      clientId: 'client@test.com',
      description: 'Serviço de teste',
      category: 'Eletricista',
      serviceType: 'Instalação',
      urgency: 'normal',
      address: 'Rua Teste, 123',
      status: 'ativo',
      createdAt: '2025-11-01T10:00:00Z',
      jobMode: 'normal',
    };

    it('cria sessão de checkout com valor válido', async () => {
      const mockSession = { id: 'cs_test_123' };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      } as any);

      const result = await createCheckoutSession(mockJob, 200);

      expect(result).toEqual(mockSession);
      expect(result.id).toMatch(/^cs_/);
    });

    it('valida valor mínimo de R$ 50', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      } as any);

      await expect(createCheckoutSession(mockJob, 30)).rejects.toThrow();
    });

    it('valida valor máximo de R$ 50.000', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      } as any);

      await expect(createCheckoutSession(mockJob, 60000)).rejects.toThrow();
    });
  });

  describe('confirmPayment', () => {
    it('confirma pagamento e atualiza status do job', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as any);

      const result = await confirmPayment('job-123', 'cs_test_456');

      expect(result.success).toBe(true);
    });
  });

  describe('releasePayment', () => {
    it('libera pagamento quando job é completado', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Pagamento liberado com sucesso',
        }),
      } as any);

      const result = await releasePayment('job-complete-789');

      expect(result.success).toBe(true);
      expect(result.message).toContain('sucesso');
    });

    it('bloqueia liberação se disputa estiver ativa', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        statusText: 'Conflict',
        json: async () => ({
          error: 'Não é possível liberar pagamento com disputa ativa',
        }),
      } as any);

      await expect(releasePayment('job-with-dispute')).rejects.toThrow();
    });

    it('requer review antes de completar job', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        statusText: 'Precondition Failed',
      } as any);

      await expect(releasePayment('job-no-review')).rejects.toThrow();
    });
  });

  describe('Disputes', () => {
    const validDisputeData = {
      jobId: 'job-dispute-123',
      reporterId: 'client@test.com',
      reporterRole: 'client' as const,
      reason: 'Serviço não entregue',
      description: 'Prestador não compareceu no horário agendado',
    };

    it('cria disputa com evidências', async () => {
      const mockDispute: Dispute = {
        id: 'disp-456',
        ...validDisputeData,
        status: 'aberta',
        createdAt: '2025-11-12T10:00:00Z',
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockDispute,
      } as any);

      const result = await createDispute(validDisputeData);

      expect(result.id).toBe('disp-456');
      expect(result.status).toBe('aberta');
    });

    it('resolve disputa com decisão admin', async () => {
      const resolvedDispute: Dispute = {
        id: 'disp-789',
        ...validDisputeData,
        status: 'resolvida',
        resolution: {
          decision: 'a favor do cliente',
          notes: 'Evidências comprovam não comparecimento',
          resolvedAt: '2025-11-12T15:00:00Z',
          resolvedBy: 'admin@servio.ai',
        },
        createdAt: '2025-11-11T10:00:00Z',
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => resolvedDispute,
      } as any);

      const result = await resolveDispute('disp-789', {
        decision: 'a favor do cliente',
        notes: 'Evidências comprovam não comparecimento',
      });

      expect(result.status).toBe('resolvida');
      expect(result.resolution).toBeDefined();
      expect(result.resolution?.decision).toContain('cliente');
    });
  });
});
