/**
 * Unit tests for API Service
 * Tests core functions with mocked fetch responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as API from '../services/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAllUsers', () => {
    it('deve buscar usuários do backend com sucesso', async () => {
      const mockUsers = [
        { email: 'user1@test.com', name: 'User 1', type: 'cliente' },
        { email: 'user2@test.com', name: 'User 2', type: 'prestador' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      });

      const users = await API.fetchAllUsers();

      expect(users).toEqual(mockUsers);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('deve retornar mock data quando backend falha', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const users = await API.fetchAllUsers();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });
  });

  describe('fetchSentimentAlerts', () => {
    it('deve buscar alertas de sentimento do backend', async () => {
      const mockAlerts = [
        {
          id: 'alert1',
          userId: 'provider1@test.com',
          alertType: 'sentimento_negativo',
          riskScore: 8,
          status: 'novo',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlerts,
      });

      const alerts = await API.fetchSentimentAlerts();

      expect(alerts).toEqual(mockAlerts);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sentiment-alerts'),
        expect.any(Object)
      );
    });
  });

  describe('createJob', () => {
    it('deve criar job com sucesso', async () => {
      const jobData = {
        description: 'Test description',
        category: 'reparos' as any,
        serviceType: 'Encanador' as any,
        urgency: '3dias' as any,
        address: 'Test Address',
        jobMode: 'normal' as any,
      };
      const clientId = 'client@test.com';

      const mockResponse = {
        id: 'job123',
        clientId,
        ...jobData,
        status: 'ativo',
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const job = await API.createJob(jobData, clientId);

      expect(job.id).toBe('job123');
      expect(job.description).toBe(jobData.description);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('updateJob', () => {
    it('deve atualizar job com sucesso', async () => {
      const jobId = 'job123';
      const updates = { status: 'concluido' as any };

      const mockResponse = {
        id: jobId,
        status: 'concluido',
        updatedAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const job = await API.updateJob(jobId, updates);

      expect(job.status).toBe('concluido');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/jobs/${jobId}`),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
    });
  });

  describe('fetchDisputes', () => {
    it('deve buscar todas as disputas', async () => {
      const mockDisputes = [
        {
          id: 'dispute1',
          jobId: 'job1',
          status: 'aberta',
          reason: 'Qualidade insatisfatória',
        },
        {
          id: 'dispute2',
          jobId: 'job2',
          status: 'resolvida',
          reason: 'Atraso na entrega',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputes,
      });

      const disputes = await API.fetchDisputes();

      expect(disputes).toHaveLength(2);
      expect(disputes[0].status).toBe('aberta');
      expect(disputes[1].status).toBe('resolvida');
    });
  });

  describe('createProposal', () => {
    it('deve criar proposta com sucesso', async () => {
      const proposalData = {
        jobId: 'job123',
        providerId: 'provider@test.com',
        price: 150,
        message: 'Posso realizar o serviço com qualidade.',
        status: 'pendente' as any,
      };

      const mockResponse = {
        id: 'proposal123',
        ...proposalData,
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const proposal = await API.createProposal(proposalData);

      expect(proposal.id).toBe('proposal123');
      expect(proposal.status).toBe('pendente');
      expect(proposal.price).toBe(150);
    });
  });

  describe('createMessage', () => {
    it('deve criar mensagem com sucesso', async () => {
      const messageData = {
        chatId: 'chat123',
        senderId: 'user@test.com',
        text: 'Olá, tudo bem?',
      };

      const mockResponse = {
        id: 'msg123',
        ...messageData,
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const message = await API.createMessage(messageData);

      expect(message.id).toBe('msg123');
      expect(message.text).toBe('Olá, tudo bem?');
    });
  });

  describe('Error handling', () => {
    it('deve usar fallback para mock data em caso de erro de rede', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const users = await API.fetchAllUsers();

      // Should fallback to mock data
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });
  });

  describe('createNotification', () => {
    it('deve criar notificação com sucesso', async () => {
      const notificationData = {
        userId: 'user@test.com',
        text: 'Nova proposta recebida',
        type: 'proposta' as any,
        isRead: false,
      };

      const mockResponse = {
        id: 'notif123',
        ...notificationData,
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const notification = await API.createNotification(notificationData);

      expect(notification.id).toBe('notif123');
      expect(notification.isRead).toBe(false);
      expect(notification.text).toBe('Nova proposta recebida');
    });
  });

  describe('Stripe Integration', () => {
    it('deve criar conta Stripe Connect', async () => {
      const mockResponse = { accountId: 'acct_123456' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await API.createStripeConnectAccount('provider@test.com');

      expect(result.accountId).toBe('acct_123456');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/create-connect-account'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userId: 'provider@test.com' }),
        })
      );
    });

    it('deve gerar link de onboarding Stripe', async () => {
      const mockResponse = { url: 'https://connect.stripe.com/setup/123' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await API.createStripeAccountLink('provider@test.com');

      expect(result.url).toContain('stripe.com');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/create-account-link'),
        expect.any(Object)
      );
    });

    it('deve criar sessão de checkout', async () => {
      const mockResponse = { sessionId: 'cs_123', url: 'https://checkout.stripe.com/123' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await API.createCheckoutSession('job123', 'proposal456', 150);

      expect(result.sessionId).toBe('cs_123');
      expect(result.url).toContain('checkout.stripe.com');
    });

    it('deve liberar pagamento após conclusão', async () => {
      const mockResponse = { success: true, message: 'Payment released' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await API.releasePayment('job123');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/release-payment'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('Dispute Management', () => {
    it('deve criar disputa', async () => {
      const disputeData = {
        jobId: 'job123',
        reporterId: 'client@test.com',
        reporterRole: 'client' as any,
        reason: 'Trabalho incompleto',
        description: 'O serviço não foi finalizado conforme acordado',
      };

      const mockResponse = {
        id: 'dispute123',
        ...disputeData,
        status: 'aberta',
        createdAt: new Date().toISOString(),
        messages: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const dispute = await API.createDispute(disputeData);

      expect(dispute.id).toBe('dispute123');
      expect(dispute.status).toBe('aberta');
      expect(dispute.reason).toBe('Trabalho incompleto');
    });

    it('deve resolver disputa com sucesso', async () => {
      const resolutionData = {
        decision: 'reembolsado' as any,
        notes: 'Reembolso total aprovado',
      };

      const mockResponse = {
        id: 'dispute123',
        status: 'resolvida',
        resolution: {
          decidedBy: 'admin',
          outcome: 'reembolsado',
          reason: resolutionData.notes,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const dispute = await API.resolveDispute('dispute123', resolutionData);

      expect(dispute.status).toBe('resolvida');
      expect(dispute.resolution?.outcome).toBe('reembolsado');
    });

    it('deve buscar disputas do backend', async () => {
      const mockDisputes = [
        {
          id: 'dispute1',
          jobId: 'job1',
          initiatorId: 'client@test.com',
          status: 'aberta',
          reason: 'Issue with service',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputes,
      });

      const disputes = await API.fetchDisputes();

      expect(Array.isArray(disputes)).toBe(true);
      expect(disputes[0].status).toBe('aberta');
    });
  });

  describe('Error Handling', () => {
    it('deve retornar mock data quando API retorna 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const users = await API.fetchAllUsers();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0); // Should fallback to MOCK_USERS
    });

    it('deve lançar erro em operações críticas sem fallback', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(API.createJob({
        description: 'Test',
        category: 'reparos' as any,
        serviceType: 'Encanador' as any,
        urgency: '3dias' as any,
        address: 'Test Address',
        jobMode: 'normal' as any,
      }, 'client@test.com')).rejects.toThrow();
    });
  });
});
