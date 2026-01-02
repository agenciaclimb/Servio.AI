import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as analyticsService from '../../src/services/analyticsService';

// Mock Firestore
const mockAddDoc = vi.fn();
const mockCollection = vi.fn();

vi.mock('../../firebaseConfig', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date, seconds: Math.floor(date.getTime() / 1000) }),
  },
}));

vi.mock('../../utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: 'event-123' });
    mockCollection.mockReturnValue({});
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trackEvent', () => {
    it('deve rastrear evento com propriedades básicas', async () => {
      await analyticsService.trackEvent('test_event', 'user-1');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          eventName: 'test_event',
          userId: 'user-1',
          prospectorId: 'user-1',
        })
      );
    });

    it('deve incluir sessionId gerado automaticamente', async () => {
      await analyticsService.trackEvent('test_event', 'user-1');

      const eventData = mockAddDoc.mock.calls[0][1];
      expect(eventData.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('deve reutilizar sessionId dentro de 30 minutos', async () => {
      await analyticsService.trackEvent('event1', 'user-1');
      const firstSessionId = mockAddDoc.mock.calls[0][1].sessionId;

      await analyticsService.trackEvent('event2', 'user-1');
      const secondSessionId = mockAddDoc.mock.calls[1][1].sessionId;

      expect(firstSessionId).toBe(secondSessionId);
    });

    it('deve incluir propriedades customizadas', async () => {
      await analyticsService.trackEvent('test_event', 'user-1', {
        customProp: 'value',
        anotherProp: 123,
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          properties: expect.objectContaining({
            customProp: 'value',
            anotherProp: 123,
          }),
        })
      );
    });

    it('deve usar prospectorId de properties quando fornecido', async () => {
      await analyticsService.trackEvent('test_event', 'user-1', {
        prospectorId: 'prospector-2',
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          userId: 'user-1',
          prospectorId: 'prospector-2',
        })
      );
    });

    it('deve converter timestamp para Firestore Timestamp', async () => {
      await analyticsService.trackEvent('test_event', 'user-1');

      const eventData = mockAddDoc.mock.calls[0][1];
      expect(eventData.timestamp).toHaveProperty('toDate');
      expect(eventData.timestamp).toHaveProperty('seconds');
    });

    it('deve lidar com erro no Firestore graciosamente', async () => {
      mockAddDoc.mockRejectedValueOnce(new Error('Firestore error'));

      await expect(
        analyticsService.trackEvent('test_event', 'user-1')
      ).resolves.not.toThrow();
    });

    it('deve usar properties vazio quando não fornecido', async () => {
      await analyticsService.trackEvent('test_event', 'user-1');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          properties: {},
        })
      );
    });
  });

  describe('trackPageView', () => {
    it('deve rastrear page_view imediatamente', async () => {
      analyticsService.trackPageView('dashboard', 'user-1');

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            eventName: 'page_view',
            userId: 'user-1',
            properties: expect.objectContaining({
              pageName: 'dashboard',
            }),
          })
        );
      });
    });

    it('deve retornar função de cleanup', () => {
      const cleanup = analyticsService.trackPageView('dashboard', 'user-1');

      expect(typeof cleanup).toBe('function');
    });

    it('deve rastrear page_exit com tempo gasto ao chamar cleanup', async () => {
      const cleanup = analyticsService.trackPageView('dashboard', 'user-1');

      // Wait 100ms
      await new Promise(resolve => setTimeout(resolve, 100));

      cleanup();

      await vi.waitFor(() => {
        const exitCall = mockAddDoc.mock.calls.find(
          call => call[1]?.eventName === 'page_exit'
        );
        expect(exitCall).toBeDefined();
        expect(exitCall?.[1]?.properties?.pageName).toBe('dashboard');
        expect(exitCall?.[1]?.properties?.timeSpent).toBeGreaterThanOrEqual(0);
      });
    });

    it('deve formatar tempo gasto em segundos', async () => {
      const cleanup = analyticsService.trackPageView('dashboard', 'user-1');

      await new Promise(resolve => setTimeout(resolve, 50));

      cleanup();

      await vi.waitFor(() => {
        const exitCall = mockAddDoc.mock.calls.find(
          call => call[1]?.eventName === 'page_exit'
        );
        expect(exitCall?.[1]?.properties?.timeSpentFormatted).toMatch(/^\d+s$/);
      });
    });
  });

  describe('trackTourStarted', () => {
    it('deve rastrear início do tour', async () => {
      analyticsService.trackTourStarted('user-1');

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            eventName: 'tour_started',
            userId: 'user-1',
            properties: expect.objectContaining({
              feature: 'prospector_onboarding',
            }),
          })
        );
      });
    });
  });

  describe('trackTourCompleted', () => {
    it('deve rastrear conclusão do tour com tempo', async () => {
      analyticsService.trackTourCompleted('user-1', 120);

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            eventName: 'tour_completed',
            userId: 'user-1',
            properties: expect.objectContaining({
              feature: 'prospector_onboarding',
              completionTimeSeconds: 120,
              completionTimeFormatted: '2m 0s',
            }),
          })
        );
      });
    });

    it('deve formatar tempo < 60s sem minutos', async () => {
      analyticsService.trackTourCompleted('user-1', 45);

      await vi.waitFor(() => {
        const call = mockAddDoc.mock.calls.find(
          call => call[1]?.eventName === 'tour_completed'
        );
        expect(call?.[1]?.properties?.completionTimeFormatted).toBe('45s');
      });
    });

    it('deve formatar tempo >= 60s com minutos', async () => {
      analyticsService.trackTourCompleted('user-1', 185);

      await vi.waitFor(() => {
        const call = mockAddDoc.mock.calls.find(
          call => call[1]?.eventName === 'tour_completed'
        );
        expect(call?.[1]?.properties?.completionTimeFormatted).toBe('3m 5s');
      });
    });
  });

  describe('trackTourSkipped', () => {
    it('deve rastrear skip do tour com step number', async () => {
      analyticsService.trackTourSkipped('user-1', 3);

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            eventName: 'tour_skipped',
            userId: 'user-1',
            properties: expect.objectContaining({
              feature: 'prospector_onboarding',
              stepNumber: 3,
            }),
          })
        );
      });
    });
  });

  describe('trackQuickActionUsed', () => {
    it('deve rastrear uso de quick action - copy_link', async () => {
      analyticsService.trackQuickActionUsed('user-1', 'copy_link');

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            eventName: 'quick_action_used',
            properties: expect.objectContaining({
              feature: 'quick_actions_bar',
              action: 'copy_link',
            }),
          })
        );
      });
    });

    it('deve rastrear uso de quick action - copy_whatsapp', async () => {
      analyticsService.trackQuickActionUsed('user-1', 'copy_whatsapp');

      await vi.waitFor(() => {
        const call = mockAddDoc.mock.calls.find(
          call => call[1]?.eventName === 'quick_action_used'
        );
        expect(call?.[1]?.properties?.action).toBe('copy_whatsapp');
      });
    });
  });

  describe('trackDashboardEngagement', () => {
    it('deve rastrear click no dashboard', async () => {
      analyticsService.trackDashboardEngagement('user-1', 'leads_table', 'click');

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            eventName: 'dashboard_engagement',
            properties: expect.objectContaining({
              feature: 'dashboard_unified',
              section: 'leads_table',
              action: 'click',
            }),
          })
        );
      });
    });

    it('deve rastrear scroll no dashboard', async () => {
      analyticsService.trackDashboardEngagement('user-1', 'stats_section', 'scroll');

      await vi.waitFor(() => {
        const call = mockAddDoc.mock.calls.find(
          call => call[1]?.eventName === 'dashboard_engagement'
        );
        expect(call?.[1]?.properties?.action).toBe('scroll');
      });
    });

    it('deve rastrear hover no dashboard', async () => {
      analyticsService.trackDashboardEngagement('user-1', 'quick_actions', 'hover');

      await vi.waitFor(() => {
        const call = mockAddDoc.mock.calls.find(
          call => call[1]?.eventName === 'dashboard_engagement'
        );
        expect(call?.[1]?.properties?.action).toBe('hover');
      });
    });
  });

  describe('trackNotificationPermission', () => {
    it('deve rastrear permissão concedida no primeiro prompt', async () => {
      analyticsService.trackNotificationPermission('user-1', true, 'first');

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            eventName: 'notification_permission_granted',
            properties: expect.objectContaining({
              feature: 'fcm_notifications',
              prompt: 'first',
            }),
          })
        );
      });
    });

    it('deve rastrear permissão negada', async () => {
      analyticsService.trackNotificationPermission('user-1', false, 'first');

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            eventName: 'notification_permission_denied',
          })
        );
      });
    });

    it('deve rastrear retry prompt', async () => {
      analyticsService.trackNotificationPermission('user-1', true, 'retry');

      await vi.waitFor(() => {
        const call = mockAddDoc.mock.calls.find(
          call => call[1]?.eventName === 'notification_permission_granted'
        );
        expect(call?.[1]?.properties?.prompt).toBe('retry');
      });
    });

    it('deve usar first como padrão quando prompt não fornecido', async () => {
      analyticsService.trackNotificationPermission('user-1', true);

      await vi.waitFor(() => {
        const call = mockAddDoc.mock.calls.find(
          call => call[1]?.eventName === 'notification_permission_granted'
        );
        expect(call?.[1]?.properties?.prompt).toBe('first');
      });
    });
  });

  describe('trackNotificationReceived', () => {
    it('deve rastrear notificação de click recebida', async () => {
      analyticsService.trackNotificationReceived('user-1', 'click');

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            eventName: 'notification_received',
            properties: expect.objectContaining({
              feature: 'fcm_notifications',
              notificationType: 'click',
            }),
          })
        );
      });
    });

    it('deve rastrear notificação de conversion recebida', async () => {
      analyticsService.trackNotificationReceived('user-1', 'conversion');

      await vi.waitFor(() => {
        const call = mockAddDoc.mock.calls.find(
          call => call[1]?.eventName === 'notification_received'
        );
        expect(call?.[1]?.properties?.notificationType).toBe('conversion');
      });
    });
  });

  describe('trackNotificationClicked', () => {
    it('deve rastrear click na notificação de commission', async () => {
      analyticsService.trackNotificationClicked('user-1', 'commission');

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            eventName: 'notification_clicked',
            properties: expect.objectContaining({
              notificationType: 'commission',
            }),
          })
        );
      });
    });

    it('deve rastrear click na notificação de badge', async () => {
      analyticsService.trackNotificationClicked('user-1', 'badge');

      await vi.waitFor(() => {
        const call = mockAddDoc.mock.calls.find(
          call => call[1]?.eventName === 'notification_clicked'
        );
        expect(call?.[1]?.properties?.notificationType).toBe('badge');
      });
    });
  });

  describe('trackReferralShare', () => {
    it('deve rastrear compartilhamento via WhatsApp', async () => {
      analyticsService.trackReferralShare('user-1', 'whatsapp');

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            eventName: 'referral_share',
            properties: expect.objectContaining({
              feature: 'referral_links',
              method: 'whatsapp',
            }),
          })
        );
      });
    });

    it('deve rastrear todos os métodos de compartilhamento', async () => {
      const methods: Array<'whatsapp' | 'email' | 'sms' | 'copy' | 'qr'> = ['whatsapp', 'email', 'sms', 'copy', 'qr'];

      for (const method of methods) {
        analyticsService.trackReferralShare('user-1', method);
      }

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledTimes(methods.length);
      });
    });
  });

  describe('trackTemplateUsed', () => {
    it('deve rastrear uso de template no WhatsApp', async () => {
      analyticsService.trackTemplateUsed('user-1', 'template-123', 'whatsapp');

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            eventName: 'template_used',
            properties: expect.objectContaining({
              feature: 'message_templates',
              templateId: 'template-123',
              platform: 'whatsapp',
            }),
          })
        );
      });
    });

    it('deve rastrear template em todas as plataformas', async () => {
      const platforms: Array<'whatsapp' | 'email' | 'sms'> = ['whatsapp', 'email', 'sms'];

      for (const platform of platforms) {
        analyticsService.trackTemplateUsed('user-1', 'template-123', platform);
      }

      await vi.waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledTimes(platforms.length);
      });
    });
  });

  describe('Session Management', () => {
    it('deve criar novo sessionId após expiração de 30 minutos', async () => {
      // First event
      await analyticsService.trackEvent('event1', 'user-1');
      const firstSessionId = mockAddDoc.mock.calls[0][1].sessionId;

      // Simulate expired session by manipulating sessionStorage
      const expiredSession = {
        id: firstSessionId,
        timestamp: Date.now() - 31 * 60 * 1000, // 31 minutes ago
      };
      sessionStorage.setItem('servio_session_id', JSON.stringify(expiredSession));

      // Second event should create new session
      await analyticsService.trackEvent('event2', 'user-1');
      const secondSessionId = mockAddDoc.mock.calls[1][1].sessionId;

      expect(secondSessionId).not.toBe(firstSessionId);
    });

    it('sessionId deve ter formato correto', async () => {
      await analyticsService.trackEvent('test_event', 'user-1');

      const sessionId = mockAddDoc.mock.calls[0][1].sessionId;
      expect(sessionId).toMatch(/^session_\d{13}_[a-z0-9]{9}$/);
    });
  });
});
