import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as api from '../../services/api';

// Mock the entire mockData module
vi.mock('../../mockData', () => ({
  MOCK_USERS: [
    { email: 'user1@test.com', type: 'cliente', verificationStatus: 'verificado' },
    { email: 'user2@test.com', type: 'prestador', verificationStatus: 'verificado' },
    { email: 'user3@test.com', type: 'prestador', verificationStatus: 'pendente' },
  ],
  MOCK_JOBS: [
    { id: 'job1', status: 'ativo' },
    { id: 'job2', status: 'em_leilao' },
    { id: 'job3', status: 'concluido' },
  ],
  MOCK_PROPOSALS: [{ id: 'prop1', providerId: 'user2@test.com', jobId: 'job1' }],
  MOCK_MESSAGES: [{ id: 'msg1', chatId: 'chat1', text: 'ola' }],
  MOCK_ITEMS: [{ id: 'item1', clientId: 'user1@test.com', name: 'Ar Condicionado' }],
  MOCK_NOTIFICATIONS: [
    {
      id: 'notif1',
      userId: 'user1@test.com',
      text: 'Notification 1',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif2',
      userId: 'user1@test.com',
      text: 'Notification 2',
      isRead: true,
      createdAt: new Date().toISOString(),
    },
  ],
  MOCK_BIDS: [{ id: 'bid1', jobId: 'job2', providerId: 'user2@test.com' }],
  MOCK_FRAUD_ALERTS: [],
}));

describe('API Service Comprehensive Tests', () => {
  let fetchSpy: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch' as any);
    // Default to failure so we exercise fallback logic deterministically
    fetchSpy.mockRejectedValue(new TypeError('Network down'));
  });

  afterEach(() => {
    vi.clearAllMocks();
    fetchSpy?.mockRestore?.();
  });

  describe('Data Fetching with Mock Fallback', () => {
    it('fetchAllUsers should fall back to MOCK_USERS', async () => {
      const result = await api.fetchAllUsers();
      expect(result).toHaveLength(3);
      expect(result[1].type).toBe('prestador');
    });

    it('fetchProviders should fall back and filter for verified providers', async () => {
      const result = await api.fetchProviders();
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('user2@test.com');
    });

    it('fetchJobs should fall back to MOCK_JOBS', async () => {
      const result = await api.fetchJobs();
      expect(result).toHaveLength(3);
    });

    it('fetchOpenJobs should fall back and filter for open jobs', async () => {
      const result = await api.fetchOpenJobs();
      expect(result).toHaveLength(2);
      expect(result.map(j => j.status)).toEqual(['ativo', 'em_leilao']);
    });

    it('fetchProposals should fall back to MOCK_PROPOSALS', async () => {
      const result = await api.fetchProposals();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('prop1');
    });

    it('fetchNotifications should fall back to MOCK_NOTIFICATIONS for the correct user', async () => {
      const result = await api.fetchNotifications('user1@test.com');
      expect(result).toHaveLength(2);
      expect(result[0].isRead).toBe(false);
    });
  });

  describe('Data Creation and Updates', () => {
    it('createUser should attempt to call the backend and throw on failure', async () => {
      const newUser = {
        email: 'new@test.com',
        name: 'New User',
        type: 'cliente' as const,
        bio: '',
      };
      await expect(api.createUser(newUser)).rejects.toMatchObject({ code: 'E_NETWORK' });
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('updateUser should call the backend with a PUT request', async () => {
      const updates = { bio: 'A new bio.' };
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'user1@test.com', ...updates }),
      } as any);

      const result = await api.updateUser('user1@test.com', updates);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/users/user1@test.com'),
        expect.objectContaining({ method: 'PUT' })
      );
      expect(result.bio).toBe('A new bio.');
    });

    it('createJob should call the backend with a POST request', async () => {
      const jobData: api.JobData = {
        description: 'New job',
        category: 'testing',
        serviceType: 'personalizado',
        urgency: '3dias',
      };
      const newJob = {
        ...jobData,
        id: 'job4',
        clientId: 'user1@test.com',
        createdAt: new Date().toISOString(),
        status: 'ativo',
      };
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => newJob } as any);

      const result = await api.createJob(jobData, 'user1@test.com');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/jobs'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.id).toBe('job4');
      expect(JSON.parse(fetchSpy.mock.calls[0][1].body).clientId).toBe('user1@test.com');
    });

    it('createNotification should call backend and return new notification', async () => {
      const notificationData = { userId: 'user1@test.com', text: 'Hello!', isRead: false };
      const newNotification = {
        ...notificationData,
        id: 'notif3',
        createdAt: new Date().toISOString(),
      };
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => newNotification } as any);

      const result = await api.createNotification(notificationData);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/notifications'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.id).toBe('notif3');
      expect(result.text).toBe('Hello!');
    });
  });

  describe('AI Matching Logic', () => {
    it('matchProvidersForJob should fall back to basic local matching on API failure', async () => {
      const result = await api.matchProvidersForJob('job1');
      // It should have attempted the AI endpoint and the providers endpoint
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/match-providers'), expect.any(Object));
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/users?type=prestador&verificationStatus=verificado'),
        expect.any(Object)
      );
      // Even if the second call fails, it falls back to MOCK_USERS
      expect(result).toHaveLength(1);
      expect(result[0].provider.email).toBe('user2@test.com');
      expect(result[0].reason).toBe('Prestador disponível');
    });

    it('matchProvidersForJob should return AI results when successful', async () => {
      const aiResults = [
        { provider: { email: 'user2@test.com' }, score: 0.95, reason: 'Perfect match by AI' },
      ];
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => aiResults } as any);

      const result = await api.matchProvidersForJob('job1');

      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/match-providers'), expect.any(Object));
      expect(fetchSpy).toHaveBeenCalledTimes(1); // Should not fall back
      expect(result).toEqual(aiResults);
      expect(result[0].reason).toBe('Perfect match by AI');
    });
  });

  describe('Admin Actions', () => {
    it('suspendProvider should call the correct admin endpoint and throw on failure', async () => {
      await expect(api.suspendProvider('user2@test.com', 'Violation')).rejects.toMatchObject({
        code: 'E_NETWORK',
      });
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/admin/providers/user2@test.com/suspend'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('resolveDispute should call the correct dispute endpoint', async () => {
      const resolution = { decision: 'Refund client', notes: 'Provider did not complete the job.' };
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'disp1', ...resolution }) } as any);

      await api.resolveDispute('disp1', resolution);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/disputes/disp1/resolve'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(JSON.parse(fetchSpy.mock.calls[0][1].body).decision).toBe('Refund client');
    });
  });

  describe('Stripe and Payments', () => {
    it('createStripeConnectAccount should call the correct endpoint', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ accountId: 'acct_123' }) } as any);
      const result = await api.createStripeConnectAccount('user2@test.com');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/stripe/create-connect-account'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.accountId).toBe('acct_123');
    });

    it('releasePayment should call the correct endpoint and return success', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Payment released' }),
      } as any);
      const result = await api.releasePayment('job1');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/job1/release-payment'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.success).toBe(true);
    });

    it('confirmPayment should call the payment confirmation endpoint', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as any);
      const result = await api.confirmPayment('job1', 'sess_123');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/payments/confirm'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ jobId: 'job1', sessionId: 'sess_123' }),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('User Deletion and Other Actions', () => {
    it('deleteUser should call the backend with a DELETE request', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => undefined } as any); // DELETE returns no content
      await api.deleteUser('user1@test.com');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/users/user1@test.com'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Dispute System', () => {
    it('fetchDisputes should fall back to an empty array', async () => {
      const result = await api.fetchDisputes();
      expect(result).toEqual([]);
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/disputes'), expect.any(Object));
    });

    it('createDispute should call the correct endpoint with dispute data', async () => {
      const disputeData: api.CreateDisputeData = {
        jobId: 'job1',
        reporterId: 'user1@test.com',
        reporterRole: 'client',
        reason: 'Service not rendered',
        description: 'The provider never showed up.',
      };
      const newDispute = { id: 'disp2', ...disputeData };
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => newDispute } as any);

      const result = await api.createDispute(disputeData);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/disputes'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.id).toBe('disp2');
    });
  });

  describe('Prospecting and Marketing', () => {
    it('fetchProspects should fall back to an empty array on failure', async () => {
      const result = await api.fetchProspects();
      expect(result).toEqual([]);
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/prospects'), expect.any(Object));
    });

    it('updateProspect should call the correct endpoint', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'prospect1' }) } as any);
      await api.updateProspect('prospect1', { status: 'contacted' });
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/prospects/prospect1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('fetchCampaigns should fall back to an empty array on failure', async () => {
      const result = await api.fetchCampaigns();
      expect(result).toEqual([]);
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/campaigns'), expect.any(Object));
    });

    it('registerWithInvite should call the backend', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => undefined } as any);
      await api.registerWithInvite('provider@test.com', 'INVITE123');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/register-with-invite'),
        expect.any(Object)
      );
    });

    it('fetchProspectorStats should use mock data on failure', async () => {
      const result = await api.fetchProspectorStats('prospector_id');
      // No mock fallback when USE_MOCK=false
      expect(result).toBeNull();
    });

    it('fetchProspectorLeaderboard should use mock data on failure', async () => {
      const result = await api.fetchProspectorLeaderboard();
      // No mock fallback when USE_MOCK=false
      expect(result).toEqual([]);
    });
  });

  describe('Bids, Items, and Messages', () => {
    it('fetchBids should fall back to mock data', async () => {
      const result = await api.fetchBids();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bid1');
    });

    it('fetchMaintainedItems should fall back to mock data for the user', async () => {
      const result = await api.fetchMaintainedItems('user1@test.com');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ar Condicionado');
    });

    it('createMaintainedItem should call the backend', async () => {
      const itemData = { clientId: 'user1@test.com', name: 'Aquecedor' };
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'item2', ...itemData }) } as any);
      const result = await api.createMaintainedItem(itemData);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/maintained-items'),
        expect.any(Object)
      );
      expect(result.name).toBe('Aquecedor');
    });

    it('fetchMessages should fall back to mock data', async () => {
      const result = await api.fetchMessages('chat1');
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('ola');
    });

    it('createMessage should call the backend', async () => {
      const msgData = { chatId: 'chat1', senderId: 'user1@test.com', text: 'tchau' };
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'msg2', ...msgData }) } as any);
      const result = await api.createMessage(msgData);
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/messages'), expect.any(Object));
      expect(result.text).toBe('tchau');
    });
  });
});
