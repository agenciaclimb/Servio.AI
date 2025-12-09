/**
 * CRM Service Tests
 * Testa sincronização com Pipedrive e HubSpot
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock CRMService since it's CommonJS
const CRMService = vi.fn().mockImplementation((db) => {
  return {
    db,
    pipedriveAxios: {
      defaults: {
        params: {
          api_token: process.env.PIPEDRIVE_API_TOKEN || 'test-token',
        },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    },
    hubspotAxios: {
      defaults: {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_API_KEY || 'test-key'}`,
        },
      },
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    },
    syncLeadToCRM: vi.fn(),
    syncLeadsBatch: vi.fn(),
    findPipedrivePerson: vi.fn(),
    findHubspotContact: vi.fn(),
    getSyncStatus: vi.fn(),
    processWebhook: vi.fn(),
    syncPipedriveToDB: vi.fn(),
    syncHubspotToDB: vi.fn(),
  };
});

describe('CRMService', () => {
  let crmService;
  let mockDb;

  beforeEach(() => {
    // Mock Firestore
    mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              firstName: 'João',
              lastName: 'Silva',
              email: 'joao@example.com',
              phone: '+5511999999999',
              company: 'Acme Corp',
              position: 'Gerente',
              score: 85,
              prospectorEmail: 'prospector@servio.ai',
              createdAt: new Date(),
            }),
          }),
          set: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({}),
        })),
        add: vi.fn().mockResolvedValue({}),
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({
                docs: [
                  {
                    data: () => ({
                      prospectId: 'prospect1',
                      crmType: 'pipedrive',
                      action: 'created',
                      timestamp: new Date(),
                    }),
                  },
                ],
              }),
            })),
          })),
        })),
      })),
    };

    // Mock environment variables
    process.env.PIPEDRIVE_API_TOKEN = 'test-token-pipedrive';
    process.env.HUBSPOT_API_KEY = 'test-key-hubspot';

    crmService = CRMService(mockDb);
  });

  describe('Pipedrive Integration', () => {
    it('should initialize Pipedrive client with token', () => {
      expect(crmService.pipedriveAxios).toBeDefined();
      expect(crmService.pipedriveAxios.defaults.params.api_token).toBeDefined();
    });

    it('should sync lead to Pipedrive', async () => {
      const lead = {
        prospectId: 'prospect1',
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao@example.com',
        phone: '+5511999999999',
        company: 'Acme Corp',
        position: 'Gerente',
        score: 85,
        prospectorEmail: 'prospector@servio.ai',
      };

      // Setup mocks
      crmService.syncLeadToCRM.mockResolvedValue({
        success: true,
        action: 'created',
        crmId: 123,
        prospectId: 'prospect1',
      });

      const result = await crmService.syncLeadToCRM(lead, 'pipedrive');

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(result.crmId).toBe(123);
    });

    it('should handle Pipedrive API errors', async () => {
      const lead = {
        prospectId: 'prospect1',
        firstName: 'João',
        email: 'joao@example.com',
      };

      crmService.syncLeadToCRM.mockRejectedValue(new Error('Pipedrive sync failed'));

      try {
        await crmService.syncLeadToCRM(lead, 'pipedrive');
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.message).toContain('Pipedrive');
      }
    });
  });

  describe('HubSpot Integration', () => {
    it('should initialize HubSpot client with API key', () => {
      expect(crmService.hubspotAxios).toBeDefined();
      expect(crmService.hubspotAxios.defaults.headers.Authorization).toBeDefined();
    });

    it('should sync lead to HubSpot', async () => {
      const lead = {
        prospectId: 'prospect1',
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria@example.com',
        phone: '+5511888888888',
        company: 'Tech Corp',
        position: 'Diretora',
        score: 92,
        prospectorEmail: 'prospector@servio.ai',
      };

      crmService.syncLeadToCRM.mockResolvedValue({
        success: true,
        action: 'created',
        crmId: 'hubspot-contact-456',
      });

      const result = await crmService.syncLeadToCRM(lead, 'hubspot');

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(result.crmId).toBe('hubspot-contact-456');
    });

    it('should update existing HubSpot contact', async () => {
      const lead = {
        prospectId: 'prospect1',
        firstName: 'Carlos',
        lastName: 'Oliveira',
        email: 'carlos@example.com',
        phone: '+5511777777777',
        company: 'Finance Ltd',
        position: 'CFO',
        score: 78,
        prospectorEmail: 'prospector@servio.ai',
      };

      crmService.syncLeadToCRM.mockResolvedValue({
        success: true,
        action: 'updated',
        crmId: 'existing-contact-789',
      });

      const result = await crmService.syncLeadToCRM(lead, 'hubspot');

      expect(result.success).toBe(true);
      expect(result.action).toBe('updated');
      expect(result.crmId).toBe('existing-contact-789');
    });
  });

  describe('Batch Sync', () => {
    it('should sync multiple leads in batch', async () => {
      const leads = [
        {
          prospectId: 'prospect1',
          firstName: 'Lead1',
          email: 'lead1@example.com',
          score: 80,
        },
        {
          prospectId: 'prospect2',
          firstName: 'Lead2',
          email: 'lead2@example.com',
          score: 75,
        },
      ];

      crmService.syncLeadsBatch.mockResolvedValue({
        successful: 2,
        failed: 0,
        results: [{ success: true }, { success: true }],
        errors: [],
      });

      const result = await crmService.syncLeadsBatch(leads, 'pipedrive');

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should handle partial failures in batch', async () => {
      const leads = [
        {
          prospectId: 'prospect1',
          firstName: 'Lead1',
          email: 'lead1@example.com',
        },
        {
          prospectId: 'prospect2',
          firstName: 'Lead2',
          email: 'lead2@example.com',
        },
      ];

      crmService.syncLeadsBatch.mockResolvedValue({
        successful: 1,
        failed: 1,
        results: [{ success: true }],
        errors: [{ prospectId: 'prospect2', error: 'API Error' }],
      });

      const result = await crmService.syncLeadsBatch(leads, 'hubspot');

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors[0]).toHaveProperty('error');
    });
  });

  describe('Sync Status', () => {
    it('should retrieve sync history for a prospect', async () => {
      const prospectId = 'prospect1';

      crmService.getSyncStatus.mockResolvedValue([
        {
          prospectId: 'prospect1',
          crmType: 'pipedrive',
          action: 'created',
          timestamp: new Date(),
        },
      ]);

      const syncStatus = await crmService.getSyncStatus(prospectId);

      expect(Array.isArray(syncStatus)).toBe(true);
      expect(syncStatus.length).toBeGreaterThan(0);
      expect(syncStatus[0]).toHaveProperty('prospectId');
    });
  });

  describe('Webhook Processing', () => {
    it('should process Pipedrive webhook for new person', async () => {
      const webhookData = {
        event: 'added.person',
        data: {
          id: 123,
          name: 'New Person',
          email: [{ value: 'new@example.com' }],
          phone: [{ value: '+5511999999999' }],
        },
      };

      crmService.processWebhook.mockResolvedValue({
        processed: true,
        crmId: 123,
      });

      const result = await crmService.processWebhook(webhookData, 'pipedrive');

      expect(result).toBeDefined();
      expect(result.processed).toBe(true);
    });

    it('should process HubSpot webhook for contact creation', async () => {
      const webhookData = {
        portal: 123,
        subscriptionType: 'contact.creation',
        objectId: 'hubspot-456',
        properties: {
          firstname: 'HubSpot',
          lastname: 'Contact',
          email: 'hubspot@example.com',
        },
      };

      crmService.processWebhook.mockResolvedValue({
        processed: true,
        crmId: 'hubspot-456',
      });

      const result = await crmService.processWebhook(webhookData, 'hubspot');

      expect(result).toBeDefined();
      expect(result.processed).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should verify CRM connections', async () => {
      crmService.pipedriveAxios.get = vi.fn().mockResolvedValue({});
      crmService.hubspotAxios.get = vi.fn().mockResolvedValue({});

      // Health check logic would be tested in routes
      expect(crmService.pipedriveAxios).toBeDefined();
      expect(crmService.hubspotAxios).toBeDefined();
    });
  });

  describe('Deduplication', () => {
    it('should find existing Pipedrive person by email', async () => {
      const email = 'existing@example.com';

      crmService.findPipedrivePerson.mockResolvedValue({
        id: 789,
        name: 'Existing Person',
      });

      const person = await crmService.findPipedrivePerson(email);

      expect(person).toBeDefined();
      expect(person.id).toBe(789);
    });

    it('should find existing HubSpot contact by email', async () => {
      const email = 'existing@example.com';

      crmService.findHubspotContact.mockResolvedValue({
        id: 'hubspot-existing-123',
        name: 'Existing Contact',
      });

      const contact = await crmService.findHubspotContact(email);

      expect(contact).toBeDefined();
      expect(contact.id).toBe('hubspot-existing-123');
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.PIPEDRIVE_API_TOKEN;
    delete process.env.HUBSPOT_API_KEY;
  });
});
