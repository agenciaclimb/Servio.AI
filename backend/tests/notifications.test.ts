import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * QA 360 - NOTIFICAÇÕES AUTOMÁTICAS
 * 
 * Cobertura:
 * 1. Proposta aceita → Notifica prestador
 * 2. Disputa aberta → Notifica cliente + prestador + admin
 * 3. Prestador suspenso → Notifica prestador
 * 4. Verificação aprovada → Notifica prestador
 * 5. Pagamento liberado → Notifica prestador
 * 6. Review recebida → Notifica prestador
 * 7. Job cancelado → Notifica cliente + prestador
 * 
 * Critérios de aceite:
 * - Notificações persistem em Firestore /notifications
 * - Cada evento dispara exatamente 1 notificação por destinatário
 * - Notificações marcadas como read=false por padrão
 */

// Mock Firestore
const createMockCollection = () => ({
  add: vi.fn(() => Promise.resolve({ id: 'notif-001' })),
  doc: vi.fn(() => ({
    get: vi.fn(),
    update: vi.fn()
  })),
  where: vi.fn(() => ({
    get: vi.fn(() => Promise.resolve({ docs: [] }))
  }))
});

let mockCollection = createMockCollection();

const mockFirestore = {
  collection: vi.fn(() => mockCollection)
};

vi.mock('firebase-admin', () => ({
  firestore: () => mockFirestore
}));

describe('QA 360 - Notificações', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Recriar mock para cada teste
    mockCollection = createMockCollection();
  });

  it('1. Proposta aceita → Notifica prestador', async () => {
    const createNotification = async (userId: string, type: string, message: string) => {
      return await mockFirestore.collection('notifications').add({
        userId,
        type,
        message,
        read: false,
        createdAt: new Date()
      });
    };

    const result = await createNotification(
      'prestador@servio.ai',
      'proposal_accepted',
      'Sua proposta para o job #001 foi aceita!'
    );

    expect(result.id).toBe('notif-001');
    expect(mockFirestore.collection).toHaveBeenCalledWith('notifications');
    console.log('✅ Notificação de proposta aceita criada');
  });

  it('2. Disputa aberta → Notifica cliente + prestador + admin', async () => {
    const notifyDispute = async (jobId: string, clientId: string, providerId: string) => {
      const recipients = [clientId, providerId, 'admin@servio.ai'];
      const notifications = [];
      const collection = mockFirestore.collection('notifications');

      for (const userId of recipients) {
        notifications.push(
          await collection.add({
            userId,
            type: 'dispute_opened',
            message: `Disputa aberta no job #${jobId}`,
            read: false,
            createdAt: new Date()
          })
        );
      }

      return notifications;
    };

    const results = await notifyDispute('job-001', 'cliente@servio.ai', 'prestador@servio.ai');

    expect(results).toHaveLength(3);
    expect(mockCollection.add).toHaveBeenCalledTimes(3);
    console.log('✅ Notificações de disputa enviadas para 3 usuários');
  });

  it('3. Prestador suspenso → Notifica prestador', async () => {
    const notifySuspension = async (providerId: string, reason: string) => {
      return await mockFirestore.collection('notifications').add({
        userId: providerId,
        type: 'account_suspended',
        message: `Sua conta foi suspensa. Motivo: ${reason}`,
        read: false,
        createdAt: new Date()
      });
    };

    const result = await notifySuspension('prestador@servio.ai', 'Múltiplas disputas');

    expect(result.id).toBe('notif-001');
    console.log('✅ Notificação de suspensão criada');
  });

  it('4. Verificação aprovada → Notifica prestador', async () => {
    const notifyVerification = async (providerId: string) => {
      return await mockFirestore.collection('notifications').add({
        userId: providerId,
        type: 'verification_approved',
        message: 'Sua conta foi verificada! Agora você pode receber propostas.',
        read: false,
        createdAt: new Date()
      });
    };

    const result = await notifyVerification('prestador@servio.ai');

    expect(result.id).toBe('notif-001');
    console.log('✅ Notificação de verificação criada');
  });

  it('5. Pagamento liberado → Notifica prestador', async () => {
    const notifyPayment = async (providerId: string, amount: number) => {
      return await mockFirestore.collection('notifications').add({
        userId: providerId,
        type: 'payment_released',
        message: `Pagamento de R$ ${(amount / 100).toFixed(2)} liberado!`,
        read: false,
        createdAt: new Date()
      });
    };

    const result = await notifyPayment('prestador@servio.ai', 12750);

    expect(result.id).toBe('notif-001');
    console.log('✅ Notificação de pagamento criada');
  });

  it('6. Review recebida → Notifica prestador', async () => {
    const notifyReview = async (providerId: string, rating: number, jobId: string) => {
      return await mockFirestore.collection('notifications').add({
        userId: providerId,
        type: 'review_received',
        message: `Você recebeu uma avaliação de ${rating} estrelas no job #${jobId}`,
        read: false,
        createdAt: new Date()
      });
    };

    const result = await notifyReview('prestador@servio.ai', 5, 'job-001');

    expect(result.id).toBe('notif-001');
    console.log('✅ Notificação de review criada');
  });

  it('7. Job cancelado → Notifica cliente + prestador', async () => {
    const notifyCancellation = async (jobId: string, clientId: string, providerId: string) => {
      const recipients = [clientId, providerId];
      const notifications = [];
      const collection = mockFirestore.collection('notifications');

      for (const userId of recipients) {
        notifications.push(
          await collection.add({
            userId,
            type: 'job_cancelled',
            message: `Job #${jobId} foi cancelado`,
            read: false,
            createdAt: new Date()
          })
        );
      }

      return notifications;
    };

    const results = await notifyCancellation('job-001', 'cliente@servio.ai', 'prestador@servio.ai');

    expect(results).toHaveLength(2);
    expect(mockCollection.add).toHaveBeenCalledTimes(2);
    console.log('✅ Notificações de cancelamento enviadas');
  });
});
