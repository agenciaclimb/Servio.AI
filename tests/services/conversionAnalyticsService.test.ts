import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ConversionAnalyticsService, { conversionAnalytics } from '../../src/services/conversionAnalyticsService';

// Mock Firestore
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDoc = vi.fn((db, collectionName, docId) => ({ collectionName, docId }));
const mockCollection = vi.fn((db, collectionName) => ({ collectionName }));
const mockIncrement = vi.fn(value => ({ _increment: value }));

vi.mock('../../firebaseConfig', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  increment: (...args: unknown[]) => mockIncrement(...args),
  Timestamp: {
    now: () => ({ toDate: () => new Date(), seconds: Date.now() / 1000 }),
    fromDate: (date: Date) => ({ toDate: () => date, seconds: Math.floor(date.getTime() / 1000) }),
  },
}));

describe('ConversionAnalyticsService', () => {
  let service: ConversionAnalyticsService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: 'event-123' });
    mockUpdateDoc.mockResolvedValue({});
    service = new ConversionAnalyticsService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trackEvent', () => {
    it('deve registrar evento com timestamp', async () => {
      const eventId = await service.trackEvent({
        eventType: 'job_created',
        userId: 'user-1',
        userEmail: 'user@example.com',
        userRole: 'cliente',
      });

      expect(eventId).toBe('event-123');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collectionName: 'conversion_events' }),
        expect.objectContaining({
          eventType: 'job_created',
          userId: 'user-1',
          userEmail: 'user@example.com',
          userRole: 'cliente',
          timestamp: expect.objectContaining({ toDate: expect.any(Function) }),
        })
      );
    });

    it('deve incluir metadata quando fornecida', async () => {
      await service.trackEvent({
        eventType: 'proposal_sent',
        userId: 'user-1',
        userEmail: 'user@example.com',
        userRole: 'prestador',
        metadata: {
          jobId: 'job-123',
          proposalId: 'proposal-456',
          amount: 500,
          currency: 'BRL',
        },
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata: expect.objectContaining({
            jobId: 'job-123',
            proposalId: 'proposal-456',
            amount: 500,
            currency: 'BRL',
          }),
        })
      );
    });

    it('deve atualizar métricas após registrar evento', async () => {
      await service.trackEvent({
        eventType: 'payment_completed',
        userId: 'user-1',
        userEmail: 'user@example.com',
        userRole: 'cliente',
        metadata: { amount: 1000 },
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collectionName: 'analytics_metrics', docId: 'daily_summary' }),
        expect.objectContaining({
          'counts.payment_completed': expect.objectContaining({ _increment: 1 }),
          'amounts.payment_completed': expect.objectContaining({ _increment: 1000 }),
          'by_role.cliente.payment_completed': expect.objectContaining({ _increment: 1 }),
        })
      );
    });

    it('deve lançar erro se falhar ao registrar evento', async () => {
      mockAddDoc.mockRejectedValueOnce(new Error('Firestore error'));

      await expect(
        service.trackEvent({
          eventType: 'job_created',
          userId: 'user-1',
          userEmail: 'user@example.com',
          userRole: 'cliente',
        })
      ).rejects.toThrow('Firestore error');
    });

    it('não deve falhar se atualização de métricas falhar', async () => {
      mockUpdateDoc.mockRejectedValueOnce(new Error('Metrics error'));

      await expect(
        service.trackEvent({
          eventType: 'job_created',
          userId: 'user-1',
          userEmail: 'user@example.com',
          userRole: 'cliente',
        })
      ).resolves.toBe('event-123');
    });
  });

  describe('trackJobCreated', () => {
    it('deve rastrear criação de job com categoria e localização', async () => {
      await service.trackJobCreated(
        'user-1',
        'user@example.com',
        'job-123',
        'Encanador',
        'São Paulo, SP'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'job_created',
          userId: 'user-1',
          userEmail: 'user@example.com',
          userRole: 'cliente',
          metadata: expect.objectContaining({
            jobId: 'job-123',
            source: 'Encanador',
            location: 'São Paulo, SP',
          }),
        })
      );
    });

    it('deve atualizar métricas de job_created', async () => {
      await service.trackJobCreated(
        'user-1',
        'user@example.com',
        'job-123',
        'Eletricista',
        'Rio de Janeiro, RJ'
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'counts.job_created': expect.objectContaining({ _increment: 1 }),
          'by_role.cliente.job_created': expect.objectContaining({ _increment: 1 }),
        })
      );
    });
  });

  describe('trackProposalSent', () => {
    it('deve rastrear proposta enviada com valor', async () => {
      await service.trackProposalSent(
        'provider-1',
        'provider@example.com',
        'proposal-123',
        'job-456',
        750.5
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'proposal_sent',
          userId: 'provider-1',
          userEmail: 'provider@example.com',
          userRole: 'prestador',
          metadata: expect.objectContaining({
            proposalId: 'proposal-123',
            jobId: 'job-456',
            amount: 750.5,
            currency: 'BRL',
          }),
        })
      );
    });

    it('deve atualizar métricas com valor da proposta', async () => {
      await service.trackProposalSent(
        'provider-1',
        'provider@example.com',
        'proposal-123',
        'job-456',
        500
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'counts.proposal_sent': expect.objectContaining({ _increment: 1 }),
          'amounts.proposal_sent': expect.objectContaining({ _increment: 500 }),
          'by_role.prestador.proposal_sent': expect.objectContaining({ _increment: 1 }),
        })
      );
    });
  });

  describe('trackProposalAccepted', () => {
    it('deve rastrear proposta aceita para cliente e prestador', async () => {
      await service.trackProposalAccepted(
        'client-1',
        'client@example.com',
        'provider-1',
        'provider@example.com',
        'proposal-123',
        'job-456',
        1000
      );

      expect(mockAddDoc).toHaveBeenCalledTimes(2);

      // Cliente
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'proposal_accepted',
          userId: 'client-1',
          userEmail: 'client@example.com',
          userRole: 'cliente',
        })
      );

      // Prestador
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'proposal_accepted',
          userId: 'provider-1',
          userEmail: 'provider@example.com',
          userRole: 'prestador',
        })
      );
    });

    it('deve atualizar métricas para ambos os roles', async () => {
      await service.trackProposalAccepted(
        'client-1',
        'client@example.com',
        'provider-1',
        'provider@example.com',
        'proposal-123',
        'job-456',
        1200
      );

      expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('trackPaymentCompleted', () => {
    it('deve rastrear pagamento concluído com método de pagamento', async () => {
      await service.trackPaymentCompleted(
        'client-1',
        'client@example.com',
        'job-123',
        2500,
        'credit_card'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'payment_completed',
          userId: 'client-1',
          userEmail: 'client@example.com',
          userRole: 'cliente',
          metadata: expect.objectContaining({
            jobId: 'job-123',
            amount: 2500,
            currency: 'BRL',
            source: 'credit_card',
          }),
        })
      );
    });

    it('deve atualizar métricas com valor do pagamento', async () => {
      await service.trackPaymentCompleted(
        'client-1',
        'client@example.com',
        'job-123',
        1500,
        'pix'
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'counts.payment_completed': expect.objectContaining({ _increment: 1 }),
          'amounts.payment_completed': expect.objectContaining({ _increment: 1500 }),
        })
      );
    });
  });

  describe('trackJobCompleted', () => {
    it('deve rastrear job concluído para cliente e prestador', async () => {
      await service.trackJobCompleted(
        'client-1',
        'client@example.com',
        'provider-1',
        'provider@example.com',
        'job-123'
      );

      expect(mockAddDoc).toHaveBeenCalledTimes(2);

      // Cliente
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'job_completed',
          userId: 'client-1',
          userRole: 'cliente',
          metadata: expect.objectContaining({ jobId: 'job-123' }),
        })
      );

      // Prestador
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'job_completed',
          userId: 'provider-1',
          userRole: 'prestador',
          metadata: expect.objectContaining({ jobId: 'job-123' }),
        })
      );
    });

    it('deve atualizar métricas para cliente e prestador', async () => {
      await service.trackJobCompleted(
        'client-1',
        'client@example.com',
        'provider-1',
        'provider@example.com',
        'job-123'
      );

      expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('trackLeadImported', () => {
    it('deve rastrear lead importado com source', async () => {
      await service.trackLeadImported(
        'prospector-1',
        'prospector@example.com',
        'lead-123',
        'google_ads'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'lead_imported',
          userId: 'prospector-1',
          userEmail: 'prospector@example.com',
          userRole: 'prospector',
          metadata: expect.objectContaining({
            leadId: 'lead-123',
            source: 'google_ads',
          }),
        })
      );
    });

    it('deve atualizar métricas de lead_imported', async () => {
      await service.trackLeadImported(
        'prospector-1',
        'prospector@example.com',
        'lead-123',
        'facebook_ads'
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'counts.lead_imported': expect.objectContaining({ _increment: 1 }),
          'by_role.prospector.lead_imported': expect.objectContaining({ _increment: 1 }),
        })
      );
    });
  });

  describe('trackLeadContacted', () => {
    it('deve rastrear lead contatado', async () => {
      await service.trackLeadContacted(
        'prospector-1',
        'prospector@example.com',
        'lead-456'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'lead_contacted',
          userId: 'prospector-1',
          userEmail: 'prospector@example.com',
          userRole: 'prospector',
          metadata: expect.objectContaining({
            leadId: 'lead-456',
          }),
        })
      );
    });

    it('deve atualizar métricas de lead_contacted', async () => {
      await service.trackLeadContacted(
        'prospector-1',
        'prospector@example.com',
        'lead-456'
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'counts.lead_contacted': expect.objectContaining({ _increment: 1 }),
          'by_role.prospector.lead_contacted': expect.objectContaining({ _increment: 1 }),
        })
      );
    });
  });

  describe('trackSignupCompleted', () => {
    it('deve rastrear signup de cliente com referrer', async () => {
      await service.trackSignupCompleted(
        'user-1',
        'user@example.com',
        'cliente',
        'google_search'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'signup_completed',
          userId: 'user-1',
          userEmail: 'user@example.com',
          userRole: 'cliente',
          metadata: expect.objectContaining({
            referrer: 'google_search',
          }),
        })
      );
    });

    it('deve usar organic como referrer padrão', async () => {
      await service.trackSignupCompleted(
        'user-2',
        'user2@example.com',
        'prestador'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata: expect.objectContaining({
            referrer: 'organic',
          }),
        })
      );
    });

    it('deve rastrear signup de prestador', async () => {
      await service.trackSignupCompleted(
        'provider-1',
        'provider@example.com',
        'prestador',
        'facebook_ads'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userRole: 'prestador',
        })
      );
    });
  });

  describe('trackProfileCompleted', () => {
    it('deve rastrear perfil completado de cliente', async () => {
      await service.trackProfileCompleted(
        'user-1',
        'user@example.com',
        'cliente'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'profile_completed',
          userId: 'user-1',
          userEmail: 'user@example.com',
          userRole: 'cliente',
        })
      );
    });

    it('deve rastrear perfil completado de prestador', async () => {
      await service.trackProfileCompleted(
        'provider-1',
        'provider@example.com',
        'prestador'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userRole: 'prestador',
        })
      );
    });

    it('deve rastrear perfil completado de prospector', async () => {
      await service.trackProfileCompleted(
        'prospector-1',
        'prospector@example.com',
        'prospector'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userRole: 'prospector',
        })
      );
    });

    it('deve atualizar métricas de profile_completed', async () => {
      await service.trackProfileCompleted(
        'user-1',
        'user@example.com',
        'cliente'
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'counts.profile_completed': expect.objectContaining({ _increment: 1 }),
          'by_role.cliente.profile_completed': expect.objectContaining({ _increment: 1 }),
        })
      );
    });
  });

  describe('Singleton Instance', () => {
    it('deve exportar instância singleton', () => {
      expect(conversionAnalytics).toBeInstanceOf(ConversionAnalyticsService);
    });

    it('singleton deve ter todos os métodos públicos', () => {
      expect(typeof conversionAnalytics.trackJobCreated).toBe('function');
      expect(typeof conversionAnalytics.trackProposalSent).toBe('function');
      expect(typeof conversionAnalytics.trackProposalAccepted).toBe('function');
      expect(typeof conversionAnalytics.trackPaymentCompleted).toBe('function');
      expect(typeof conversionAnalytics.trackJobCompleted).toBe('function');
      expect(typeof conversionAnalytics.trackLeadImported).toBe('function');
      expect(typeof conversionAnalytics.trackLeadContacted).toBe('function');
      expect(typeof conversionAnalytics.trackSignupCompleted).toBe('function');
      expect(typeof conversionAnalytics.trackProfileCompleted).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com valores monetários decimais', async () => {
      await service.trackProposalSent(
        'provider-1',
        'provider@example.com',
        'proposal-123',
        'job-456',
        1234.56
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata: expect.objectContaining({
            amount: 1234.56,
          }),
        })
      );
    });

    it('deve lidar com emails longos', async () => {
      const longEmail = 'very.long.email.address.with.many.dots@example.subdomain.com';

      await service.trackJobCreated(
        'user-1',
        longEmail,
        'job-123',
        'Category',
        'Location'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userEmail: longEmail,
        })
      );
    });

    it('deve lidar com caracteres especiais em metadata', async () => {
      await service.trackJobCreated(
        'user-1',
        'user@example.com',
        'job-123',
        'Encanador & Eletricista',
        'São Paulo/SP - Brasil'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata: expect.objectContaining({
            source: 'Encanador & Eletricista',
            location: 'São Paulo/SP - Brasil',
          }),
        })
      );
    });

    it('não deve incluir amount field se valor for 0', async () => {
      await service.trackEvent({
        eventType: 'job_created',
        userId: 'user-1',
        userEmail: 'user@example.com',
        userRole: 'cliente',
        metadata: { amount: 0 },
      });

      const updateCall = mockUpdateDoc.mock.calls[0][1];
      expect(updateCall).not.toHaveProperty('amounts.job_created');
    });
  });
});
