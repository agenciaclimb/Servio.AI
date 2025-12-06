
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
       MOCK_PROPOSALS: [
         { id: 'prop1', providerId: 'user2@test.com', jobId: 'job1' },
       ],
       MOCK_MESSAGES: [
        { id: 'msg1', chatId: 'chat1', text: 'ola'}
       ],
       MOCK_ITEMS: [
        { id: 'item1', clientId: 'user1@test.com', name: 'Ar Condicionado'}
       ],
       MOCK_NOTIFICATIONS: [
         { id: 'notif1', userId: 'user1@test.com', text: 'Notification 1', isRead: false, createdAt: new Date().toISOString() },
         { id: 'notif2', userId: 'user1@test.com', text: 'Notification 2', isRead: true, createdAt: new Date().toISOString() },
       ],
       MOCK_BIDS: [
        { id: 'bid1', jobId: 'job2', providerId: 'user2@test.com'}
       ],
       MOCK_FRAUD_ALERTS: [],
      }));
      
      describe('API Service Comprehensive Tests', () => {
        // Mock the generic apiCall to simulate backend failures
        const apiCallSpy = vi.spyOn(api, 'apiCall');
      
        beforeEach(() => {
          // Reset spy before each test
          apiCallSpy.mockClear();
          // Default to failure to test fallback logic
          apiCallSpy.mockRejectedValue(new Error('Simulated API Failure'));
        });
      
        afterEach(() => {
          vi.clearAllMocks();
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
            const newUser = { email: 'new@test.com', name: 'New User', type: 'cliente' as const, bio: '' };
            // Ensure apiCall fails for this test
            apiCallSpy.mockRejectedValue(new Error('Backend unavailable'));
      
            await expect(api.createUser(newUser)).rejects.toThrow('Backend unavailable');
            expect(apiCallSpy).toHaveBeenCalledWith('/users', expect.objectContaining({ method: 'POST' }));
          });

          it('updateUser should call the backend with a PUT request', async () => {
            const updates = { bio: 'A new bio.' };
            apiCallSpy.mockResolvedValue({ email: 'user1@test.com', ...updates });
      
            const result = await api.updateUser('user1@test.com', updates);
      
            expect(apiCallSpy).toHaveBeenCalledWith('/users/user1@test.com', expect.objectContaining({ method: 'PUT' }));
            expect(result.bio).toBe('A new bio.');
          });

          it('createJob should call the backend with a POST request', async () => {
            const jobData: api.JobData = {
              description: 'New job',
              category: 'testing',
              serviceType: 'personalizado',
              urgency: '3dias',
            };
            const newJob = { ...jobData, id: 'job4', clientId: 'user1@test.com', createdAt: new Date().toISOString(), status: 'ativo' };
            apiCallSpy.mockResolvedValue(newJob);

            const result = await api.createJob(jobData, 'user1@test.com');

            expect(apiCallSpy).toHaveBeenCalledWith('/jobs', expect.objectContaining({ method: 'POST' }));
            expect(result.id).toBe('job4');
            expect(JSON.parse(apiCallSpy.mock.calls[0][1].body).clientId).toBe('user1@test.com');
          });

          it('createNotification should call backend and return new notification', async () => {
            const notificationData = { userId: 'user1@test.com', text: 'Hello!', isRead: false };
            const newNotification = { ...notificationData, id: 'notif3', createdAt: new Date().toISOString() };
            apiCallSpy.mockResolvedValue(newNotification);

            const result = await api.createNotification(notificationData);

            expect(apiCallSpy).toHaveBeenCalledWith('/notifications', expect.objectContaining({ method: 'POST' }));
            expect(result.id).toBe('notif3');
            expect(result.text).toBe('Hello!');
          });
        });

        describe('AI Matching Logic', () => {
          it('matchProvidersForJob should fall back to basic local matching on API failure', async () => {
            const result = await api.matchProvidersForJob('job1');
            // It should have called the AI endpoint
            expect(apiCallSpy).toHaveBeenCalledWith('/api/match-providers', expect.any(Object));
            // And then it should have called the user fetching endpoint as a fallback
            expect(apiCallSpy).toHaveBeenCalledWith('/users?type=prestador&verificationStatus=verificado');
            // Even if the second call fails, it falls back to MOCK_USERS
            expect(result).toHaveLength(1);
            expect(result[0].provider.email).toBe('user2@test.com');
            expect(result[0].reason).toBe('Prestador disponível');
          });

          it('matchProvidersForJob should return AI results when successful', async () => {
            const aiResults = [
              { provider: { email: 'user2@test.com' }, score: 0.95, reason: 'Perfect match by AI' }
            ];
            apiCallSpy.mockResolvedValue(aiResults);
      
            const result = await api.matchProvidersForJob('job1');
      
            expect(apiCallSpy).toHaveBeenCalledWith('/api/match-providers', expect.any(Object));
            expect(apiCallSpy).toHaveBeenCalledTimes(1); // Should not fall back
            expect(result).toEqual(aiResults);
            expect(result[0].reason).toBe('Perfect match by AI');
          });
        });

        describe('Admin Actions', () => {
          it('suspendProvider should call the correct admin endpoint and throw on failure', async () => {
            await expect(api.suspendProvider('user2@test.com', 'Violation')).rejects.toThrow('Simulated API Failure');
            expect(apiCallSpy).toHaveBeenCalledWith('/admin/providers/user2@test.com/suspend', expect.objectContaining({ method: 'POST' }));
          });

          it('resolveDispute should call the correct dispute endpoint', async () => {
            const resolution = { decision: 'Refund client', notes: 'Provider did not complete the job.' };
            apiCallSpy.mockResolvedValue({ id: 'disp1', ...resolution });

            await api.resolveDispute('disp1', resolution);

            expect(apiCallSpy).toHaveBeenCalledWith('/api/disputes/disp1/resolve', expect.objectContaining({ method: 'PATCH' }));
            expect(JSON.parse(apiCallSpy.mock.calls[0][1].body).decision).toBe('Refund client');
          });
        });

        describe('Stripe and Payments', () => {
          it('createStripeConnectAccount should call the correct endpoint', async () => {
            apiCallSpy.mockResolvedValue({ accountId: 'acct_123' });
            const result = await api.createStripeConnectAccount('user2@test.com');
            expect(apiCallSpy).toHaveBeenCalledWith('/api/stripe/create-connect-account', expect.objectContaining({ method: 'POST' }));
            expect(result.accountId).toBe('acct_123');
          });

          it('releasePayment should call the correct endpoint and return success', async () => {
            apiCallSpy.mockResolvedValue({ success: true, message: 'Payment released' });
            const result = await api.releasePayment('job1');
            expect(apiCallSpy).toHaveBeenCalledWith('/jobs/job1/release-payment', expect.objectContaining({ method: 'POST' }));
            expect(result.success).toBe(true);
          });

          it('confirmPayment should call the payment confirmation endpoint', async () => {
            apiCallSpy.mockResolvedValue({ success: true });
            const result = await api.confirmPayment('job1', 'sess_123');
            expect(apiCallSpy).toHaveBeenCalledWith('/api/payments/confirm', 
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
                apiCallSpy.mockResolvedValue(undefined); // DELETE returns no content
                await api.deleteUser('user1@test.com');
                expect(apiCallSpy).toHaveBeenCalledWith('/users/user1@test.com', expect.objectContaining({ method: 'DELETE' }));
            });
        });

        describe('Dispute System', () => {
            it('fetchDisputes should fall back to an empty array', async () => {
                const result = await api.fetchDisputes();
                expect(result).toEqual([]);
                expect(apiCallSpy).toHaveBeenCalledWith('/disputes');
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
                apiCallSpy.mockResolvedValue(newDispute);

                const result = await api.createDispute(disputeData);
                expect(apiCallSpy).toHaveBeenCalledWith('/api/disputes', expect.objectContaining({ method: 'POST' }));
                expect(result.id).toBe('disp2');
            });
        });

        describe('Prospecting and Marketing', () => {
            it('fetchProspects should fall back to an empty array on failure', async () => {
                const result = await api.fetchProspects();
                expect(result).toEqual([]);
                expect(apiCallSpy).toHaveBeenCalledWith('/prospects');
            });

            it('updateProspect should call the correct endpoint', async () => {
                apiCallSpy.mockResolvedValue({ id: 'prospect1' });
                await api.updateProspect('prospect1', { status: 'contacted' });
                expect(apiCallSpy).toHaveBeenCalledWith('/prospects/prospect1', expect.objectContaining({ method: 'PUT' }));
            });

            it('fetchCampaigns should fall back to an empty array on failure', async () => {
                const result = await api.fetchCampaigns();
                expect(result).toEqual([]);
                expect(apiCallSpy).toHaveBeenCalledWith('/campaigns');
            });

            it('registerWithInvite should call the backend', async () => {
                apiCallSpy.mockResolvedValue(undefined);
                await api.registerWithInvite('provider@test.com', 'INVITE123');
                expect(apiCallSpy).toHaveBeenCalledWith('/register-with-invite', expect.any(Object));
            });

            it('fetchProspectorStats should use mock data on failure', async () => {
                // The mock is defined in the function for USE_MOCK=true, so we just check if it returns non-null
                const result = await api.fetchProspectorStats('prospector_id');
                expect(result).not.toBeNull();
                expect(result?.totalRecruits).toBe(12);
            });

            it('fetchProspectorLeaderboard should use mock data on failure', async () => {
                const result = await api.fetchProspectorLeaderboard();
                expect(result).toHaveLength(3);
                expect(result[0].rank).toBe(1);
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
                apiCallSpy.mockResolvedValue({ id: 'item2', ...itemData });
                const result = await api.createMaintainedItem(itemData);
                expect(apiCallSpy).toHaveBeenCalledWith('/maintained-items', expect.any(Object));
                expect(result.name).toBe('Aquecedor');
            });

            it('fetchMessages should fall back to mock data', async () => {
                const result = await api.fetchMessages('chat1');
                expect(result).toHaveLength(1);
                expect(result[0].text).toBe('ola');
            });

            it('createMessage should call the backend', async () => {
                const msgData = { chatId: 'chat1', senderId: 'user1@test.com', text: 'tchau' };
                apiCallSpy.mockResolvedValue({ id: 'msg2', ...msgData });
                const result = await api.createMessage(msgData);
                expect(apiCallSpy).toHaveBeenCalledWith('/messages', expect.any(Object));
                expect(result.text).toBe('tchau');
            });
        });
      });
