import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as notificationService from '../../src/services/notificationService';

// Mock Firestore
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockDoc = vi.fn((db, collectionName, docId?) => ({ 
  collectionName, 
  id: docId || 'generated-id',
  docId: docId || 'generated-id' 
}));
const mockCollection = vi.fn((db, collectionName) => ({ collectionName }));
const mockQuery = vi.fn((...args) => ({ args }));
const mockWhere = vi.fn((field, operator, value) => ({ field, operator, value }));

// Mock Firebase Messaging
const mockGetToken = vi.fn();
const mockUnsubscribe = vi.fn();
const mockOnMessage = vi.fn(() => mockUnsubscribe);
const mockGetMessaging = vi.fn(() => ({}));

vi.mock('../../firebaseConfig', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

vi.mock('firebase/messaging', () => ({
  getMessaging: () => mockGetMessaging(),
  getToken: (...args: unknown[]) => mockGetToken(...args),
  onMessage: (...args: unknown[]) => mockOnMessage(...args),
}));

// Mock browser Notification API
const mockNotification = vi.fn();
global.Notification = mockNotification as never;
(global.Notification as never)['requestPermission'] = vi.fn();

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetDoc.mockResolvedValue({});
    mockUpdateDoc.mockResolvedValue({});
    (global.Notification.requestPermission as never) = vi.fn().mockResolvedValue('granted');
    mockGetToken.mockResolvedValue('fcm-token-123');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requestNotificationPermission', () => {
    it('deve verificar suporte do navegador', async () => {
      const originalNotification = global.Notification;
      delete (global as { Notification?: unknown }).Notification;

      const token = await notificationService.requestNotificationPermission('prospector-1');

      expect(token).toBeNull();

      global.Notification = originalNotification;
    });

    it('deve retornar null se permissão negada', async () => {
      (global.Notification.requestPermission as never) = vi.fn().mockResolvedValue('denied');

      const token = await notificationService.requestNotificationPermission('prospector-1');

      expect(token).toBeNull();
    });

    it('deve obter token FCM se permissão concedida', async () => {
      const token = await notificationService.requestNotificationPermission('prospector-1');

      expect(token).toBe('fcm-token-123');
      expect(mockGetToken).toHaveBeenCalled();
    });

    it('deve salvar token no Firestore', async () => {
      await notificationService.requestNotificationPermission('prospector-1');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collectionName: 'notification_preferences', docId: 'prospector-1' }),
        expect.objectContaining({
          fcmToken: 'fcm-token-123',
          lastUpdated: expect.any(Date),
        }),
        { merge: true }
      );
    });

    it('deve retornar null se falhar ao obter token', async () => {
      mockGetToken.mockResolvedValueOnce(null);

      const token = await notificationService.requestNotificationPermission('prospector-1');

      expect(token).toBeNull();
    });

    it('deve lidar com erro graciosamente', async () => {
      mockGetToken.mockRejectedValueOnce(new Error('Firebase error'));

      const token = await notificationService.requestNotificationPermission('prospector-1');

      expect(token).toBeNull();
    });
  });

  describe('updateFCMToken', () => {
    it('deve atualizar token no Firestore', async () => {
      await notificationService.updateFCMToken('prospector-1', 'new-token-456');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collectionName: 'notification_preferences', docId: 'prospector-1' }),
        expect.objectContaining({
          fcmToken: 'new-token-456',
          lastUpdated: expect.any(Date),
        }),
        { merge: true }
      );
    });

    it('deve usar merge para não sobrescrever preferências existentes', async () => {
      await notificationService.updateFCMToken('prospector-1', 'token-789');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { merge: true }
      );
    });
  });

  describe('getNotificationPreferences', () => {
    it('deve retornar preferências existentes', async () => {
      const mockPrefs = {
        enabled: true,
        clickNotifications: true,
        conversionNotifications: true,
        commissionNotifications: false,
        followUpReminders: true,
        email: 'prospector@example.com',
        fcmToken: 'token-123',
        lastUpdated: { toDate: () => new Date('2025-01-01') },
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockPrefs,
      });

      const prefs = await notificationService.getNotificationPreferences('prospector-1');

      expect(prefs).toEqual({
        prospectorId: 'prospector-1',
        ...mockPrefs,
        lastUpdated: new Date('2025-01-01'),
      });
    });

    it('deve retornar null se não existir', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const prefs = await notificationService.getNotificationPreferences('prospector-1');

      expect(prefs).toBeNull();
    });
  });

  describe('updateNotificationPreferences', () => {
    it('deve atualizar preferências com merge', async () => {
      await notificationService.updateNotificationPreferences('prospector-1', {
        clickNotifications: false,
        commissionNotifications: true,
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collectionName: 'notification_preferences', docId: 'prospector-1' }),
        expect.objectContaining({
          prospectorId: 'prospector-1',
          clickNotifications: false,
          commissionNotifications: true,
          lastUpdated: expect.any(Date),
        }),
        { merge: true }
      );
    });

    it('deve incluir prospectorId e lastUpdated automaticamente', async () => {
      await notificationService.updateNotificationPreferences('prospector-2', {
        enabled: false,
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          prospectorId: 'prospector-2',
          lastUpdated: expect.any(Date),
        }),
        { merge: true }
      );
    });
  });

  describe('createNotification', () => {
    it('deve lançar erro se notificações desabilitadas', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ enabled: false }),
      });

      await expect(
        notificationService.createNotification('prospector-1', 'click', 'Title', 'Body')
      ).rejects.toThrow('Notifications disabled for this user');
    });

    it('deve lançar erro se preferências não existem', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      await expect(
        notificationService.createNotification('prospector-1', 'click', 'Title', 'Body')
      ).rejects.toThrow('Notifications disabled for this user');
    });

    it('deve lançar erro se tipo de notificação desabilitado', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          enabled: true,
          clickNotifications: false,
          conversionNotifications: true,
          commissionNotifications: true,
          followUpReminders: true,
        }),
      });

      await expect(
        notificationService.createNotification('prospector-1', 'click', 'Title', 'Body')
      ).rejects.toThrow('Notification type click disabled for this user');
    });

    it('deve criar notificação quando habilitada', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          enabled: true,
          clickNotifications: true,
          conversionNotifications: true,
          commissionNotifications: true,
          followUpReminders: true,
        }),
      });

      const notificationId = await notificationService.createNotification(
        'prospector-1',
        'click',
        'Test Title',
        'Test Body',
        { key: 'value' }
      );

      expect(notificationId).toBe('generated-id');
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: 'generated-id',
          prospectorId: 'prospector-1',
          type: 'click',
          title: 'Test Title',
          body: 'Test Body',
          data: { key: 'value' },
          sentAt: expect.any(Date),
          read: false,
        })
      );
    });

    it('deve criar notificação sem data opcional', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          enabled: true,
          clickNotifications: true,
          conversionNotifications: true,
          commissionNotifications: true,
          followUpReminders: true,
        }),
      });

      await notificationService.createNotification(
        'prospector-1',
        'click',
        'Title',
        'Body'
      );

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: undefined,
        })
      );
    });
  });

  describe('getUnreadNotifications', () => {
    it('deve retornar notificações não lidas', async () => {
      const mockDocs = [
        {
          id: 'notif-1',
          data: () => ({
            prospectorId: 'prospector-1',
            type: 'click',
            title: 'Title 1',
            body: 'Body 1',
            sentAt: { toDate: () => new Date('2025-01-01') },
            read: false,
          }),
        },
        {
          id: 'notif-2',
          data: () => ({
            prospectorId: 'prospector-1',
            type: 'conversion',
            title: 'Title 2',
            body: 'Body 2',
            sentAt: { toDate: () => new Date('2025-01-02') },
            read: false,
          }),
        },
      ];

      mockGetDocs.mockResolvedValueOnce({
        docs: mockDocs,
      });

      const notifications = await notificationService.getUnreadNotifications('prospector-1');

      expect(notifications).toHaveLength(2);
      expect(notifications[0].id).toBe('notif-1');
      expect(notifications[1].id).toBe('notif-2');
      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('prospectorId', '==', 'prospector-1');
      expect(mockWhere).toHaveBeenCalledWith('read', '==', false);
    });

    it('deve retornar array vazio se sem notificações', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [],
      });

      const notifications = await notificationService.getUnreadNotifications('prospector-1');

      expect(notifications).toEqual([]);
    });
  });

  describe('markNotificationAsRead', () => {
    it('deve marcar notificação como lida com timestamp', async () => {
      await notificationService.markNotificationAsRead('notif-123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collectionName: 'notifications', docId: 'notif-123' }),
        expect.objectContaining({
          read: true,
          clickedAt: expect.any(Date),
        })
      );
    });
  });

  describe('getUnreadNotificationCount', () => {
    it('deve retornar contagem de notificações não lidas', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: '1', data: () => ({}) },
          { id: '2', data: () => ({}) },
          { id: '3', data: () => ({}) },
        ],
      });

      const count = await notificationService.getUnreadNotificationCount('prospector-1');

      expect(count).toBe(3);
    });

    it('deve retornar 0 se sem notificações', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [],
      });

      const count = await notificationService.getUnreadNotificationCount('prospector-1');

      expect(count).toBe(0);
    });
  });

  describe('sendClickNotification', () => {
    beforeEach(() => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          enabled: true,
          clickNotifications: true,
          conversionNotifications: true,
          commissionNotifications: true,
          followUpReminders: true,
        }),
      });
    });

    it('deve enviar notificação de click com dados corretos', async () => {
      const notificationId = await notificationService.sendClickNotification(
        'prospector-1',
        'João Silva',
        'WhatsApp'
      );

      expect(notificationId).toBe('generated-id');
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'click',
          title: '🎯 Novo Clique no Seu Link!',
          body: 'João Silva clicou no seu link de indicação via WhatsApp',
          data: {
            type: 'click',
            prospectName: 'João Silva',
            source: 'WhatsApp',
          },
        })
      );
    });
  });

  describe('sendConversionNotification', () => {
    beforeEach(() => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          enabled: true,
          clickNotifications: true,
          conversionNotifications: true,
          commissionNotifications: true,
          followUpReminders: true,
        }),
      });
    });

    it('deve enviar notificação de conversão', async () => {
      const notificationId = await notificationService.sendConversionNotification(
        'prospector-1',
        'Maria Santos',
        'Encanadora'
      );

      expect(notificationId).toBe('generated-id');
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'conversion',
          title: '🎉 Conversão Confirmada!',
          body: 'Maria Santos se cadastrou como Encanadora através do seu link!',
          data: {
            type: 'conversion',
            providerName: 'Maria Santos',
            category: 'Encanadora',
          },
        })
      );
    });
  });

  describe('sendCommissionNotification', () => {
    beforeEach(() => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          enabled: true,
          clickNotifications: true,
          conversionNotifications: true,
          commissionNotifications: true,
          followUpReminders: true,
        }),
      });
    });

    it('deve enviar notificação de comissão com valor formatado', async () => {
      const notificationId = await notificationService.sendCommissionNotification(
        'prospector-1',
        125.50,
        'Pedro Costa'
      );

      expect(notificationId).toBe('generated-id');
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'commission',
          title: '💰 Nova Comissão Gerada!',
          body: 'Você ganhou R$ 125.50 do job completado por Pedro Costa',
          data: {
            type: 'commission',
            amount: '125.5',
            providerName: 'Pedro Costa',
          },
        })
      );
    });

    it('deve formatar valor com 2 casas decimais', async () => {
      await notificationService.sendCommissionNotification(
        'prospector-1',
        50,
        'Provider'
      );

      const callArgs = mockSetDoc.mock.calls[0][1];
      expect(callArgs.body).toContain('R$ 50.00');
    });
  });

  describe('sendFollowUpReminder', () => {
    beforeEach(() => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          enabled: true,
          clickNotifications: true,
          conversionNotifications: true,
          commissionNotifications: true,
          followUpReminders: true,
        }),
      });
    });

    it('deve enviar lembrete de follow-up', async () => {
      const notificationId = await notificationService.sendFollowUpReminder(
        'prospector-1',
        'Ana Paula',
        7
      );

      expect(notificationId).toBe('generated-id');
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'follow-up',
          title: '📞 Follow-up Pendente',
          body: 'Lembre-se de fazer follow-up com Ana Paula (contato há 7 dias)',
          data: {
            type: 'follow-up',
            prospectName: 'Ana Paula',
            daysAgo: '7',
          },
        })
      );
    });
  });

  describe('setupForegroundMessageListener', () => {
    it('deve configurar listener de mensagens', () => {
      const mockCallback = vi.fn();
      const unsubscribe = notificationService.setupForegroundMessageListener(mockCallback);

      expect(mockOnMessage).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
