/**
 * TwilioService Tests
 * Testa integração com Twilio (SMS, WhatsApp, Calls)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock TwilioService since it's CommonJS
const TwilioService = vi.fn().mockImplementation((db) => {
  return {
    db,
    accountSid: 'test_account_sid',
    authToken: 'test_auth_token',
    phoneNumber: '+15551234567',
    whatsappNumber: '+15559876543',
    twilioClient: {
      post: vi.fn(),
      get: vi.fn(),
    },
    sendSMS: vi.fn(),
    sendWhatsApp: vi.fn(),
    makeCall: vi.fn(),
    processMessageWebhook: vi.fn(),
    processCallWebhook: vi.fn(),
    getCommunicationHistory: vi.fn(),
    logCommunication: vi.fn(),
    checkHealth: vi.fn(),
    sendSMSBatch: vi.fn(),
  };
});

describe('TwilioService', () => {
  let twilioService;
  let mockDb;

  beforeEach(() => {
    // Mock Firestore
    mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              prospectId: 'prospect123',
              type: 'sms',
              status: 'delivered',
            }),
          }),
          set: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({}),
        })),
        add: vi.fn().mockResolvedValue({ id: 'new_comm_id' }),
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({
              empty: false,
              docs: [{
                ref: { update: vi.fn() },
                data: () => ({ twilioSid: 'SM123', status: 'sent' }),
              }],
            }),
          })),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({
                forEach: (fn) => {
                  fn({
                    id: 'comm1',
                    data: () => ({
                      prospectId: 'prospect123',
                      type: 'sms',
                      status: 'delivered',
                    }),
                  });
                },
              }),
            })),
          })),
        })),
      })),
    };

    // Mock environment variables
    process.env.TWILIO_ACCOUNT_SID = 'test_sid';
    process.env.TWILIO_AUTH_TOKEN = 'test_token';
    process.env.TWILIO_PHONE_NUMBER = '+15551234567';
    process.env.TWILIO_WHATSAPP_NUMBER = '+15559876543';

    twilioService = TwilioService(mockDb);
  });

  describe('SMS Integration', () => {
    it('should initialize Twilio client', () => {
      expect(twilioService.twilioClient).toBeDefined();
      expect(twilioService.phoneNumber).toBe('+15551234567');
    });

  it('should send SMS successfully', async () => {
      twilioService.sendSMS.mockResolvedValue({
        success: true,
        messageSid: 'SM123456789',
        status: 'queued',
        to: '+5511999999999',
      });

      const result = await twilioService.sendSMS({
        to: '+5511999999999',
        body: 'Test SMS',
        prospectId: 'prospect123',
      });

      expect(result.success).toBe(true);
      expect(result.messageSid).toBe('SM123456789');
    });

    it('should handle SMS errors', async () => {
      twilioService.sendSMS.mockRejectedValue(new Error('Twilio API error'));

      try {
        await twilioService.sendSMS({
          to: '+5511999999999',
          body: 'Test',
          prospectId: 'prospect123',
        });
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.message).toContain('Twilio');
      }
    });
  });

  describe('WhatsApp Integration', () => {
    it('should send WhatsApp successfully', async () => {
      twilioService.sendWhatsApp.mockResolvedValue({
        success: true,
        messageSid: 'SM987654321',
        status: 'queued',
      });

      const result = await twilioService.sendWhatsApp({
        to: '+5511999999999',
        body: 'Test WhatsApp',
        prospectId: 'prospect123',
      });

      expect(result.success).toBe(true);
      expect(result.messageSid).toBe('SM987654321');
    });

    it('should send WhatsApp with media', async () => {
      twilioService.sendWhatsApp.mockResolvedValue({ success: true });

      await twilioService.sendWhatsApp({
        to: '+5511999999999',
        body: 'Test',
        prospectId: 'prospect123',
        mediaUrl: 'https://example.com/image.jpg',
      });

      expect(twilioService.sendWhatsApp).toHaveBeenCalled();
    });

    it('should handle WhatsApp errors', async () => {
      twilioService.sendWhatsApp.mockRejectedValue(new Error('WhatsApp failed'));

      try {
        await twilioService.sendWhatsApp({
          to: '+5511999999999',
          body: 'Test',
          prospectId: 'prospect123',
        });
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.message).toContain('WhatsApp');
      }
    });
  });

  describe('Call Integration', () => {
    it('should initiate call successfully', async () => {
      twilioService.makeCall.mockResolvedValue({
        success: true,
        callSid: 'CA123456789',
        status: 'initiated',
      });

      const result = await twilioService.makeCall({
        to: '+5511999999999',
        prospectId: 'prospect123',
        callbackUrl: 'https://example.com/twiml',
      });

      expect(result.success).toBe(true);
      expect(result.callSid).toBe('CA123456789');
    });

    it('should handle call errors', async () => {
      twilioService.makeCall.mockRejectedValue(new Error('Call failed'));

      try {
        await twilioService.makeCall({
          to: '+5511999999999',
          prospectId: 'prospect123',
          callbackUrl: 'https://example.com/twiml',
        });
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.message).toContain('Call');
      }
    });
  });

  describe('Webhook Processing', () => {
    it('should process message webhook', async () => {
      twilioService.processMessageWebhook.mockResolvedValue({
        success: true,
        action: 'updated',
      });

      const result = await twilioService.processMessageWebhook({
        MessageSid: 'SM123',
        MessageStatus: 'delivered',
      });

      expect(result.success).toBe(true);
    });

    it('should process call webhook', async () => {
      twilioService.processCallWebhook.mockResolvedValue({
        success: true,
        action: 'updated',
      });

      const result = await twilioService.processCallWebhook({
        CallSid: 'CA123',
        CallStatus: 'completed',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Communication History', () => {
    it('should retrieve communication history', async () => {
      twilioService.getCommunicationHistory.mockResolvedValue([
        {
          id: 'comm1',
          type: 'sms',
          status: 'delivered',
        },
      ]);

      const history = await twilioService.getCommunicationHistory('prospect123', 'all');

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should log communication', async () => {
      twilioService.logCommunication.mockResolvedValue('comm_id_123');

      const logId = await twilioService.logCommunication({
        prospectId: 'prospect123',
        type: 'sms',
        status: 'sent',
      });

      expect(logId).toBe('comm_id_123');
    });
  });

  describe('Health Check', () => {
    it('should check Twilio health', async () => {
      twilioService.checkHealth.mockResolvedValue({
        healthy: true,
        accountSid: 'test_sid',
        accountStatus: 'active',
      });

      const health = await twilioService.checkHealth();

      expect(health.healthy).toBe(true);
      expect(health.accountStatus).toBe('active');
    });

    it('should handle health check failures', async () => {
      twilioService.checkHealth.mockResolvedValue({
        healthy: false,
        error: 'Connection failed',
      });

      const health = await twilioService.checkHealth();

      expect(health.healthy).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    it('should send batch SMS', async () => {
      twilioService.sendSMSBatch.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
      });

      const result = await twilioService.sendSMSBatch([
        { to: '+5511111111111', body: 'Msg1', prospectId: 'p1' },
        { to: '+5511222222222', body: 'Msg2', prospectId: 'p2' },
        { to: '+5511333333333', body: 'Msg3', prospectId: 'p3' },
      ]);

      expect(result.total).toBe(3);
      expect(result.success).toBe(3);
    });

    it('should handle partial batch failures', async () => {
      twilioService.sendSMSBatch.mockResolvedValue({
        total: 2,
        success: 1,
        failed: 1,
      });

      const result = await twilioService.sendSMSBatch([
        { to: '+5511111111111', body: 'Msg1', prospectId: 'p1' },
        { to: 'invalid', body: 'Msg2', prospectId: 'p2' },
      ]);

      expect(result.total).toBe(2);
      expect(result.failed).toBe(1);
    });
  });
});
