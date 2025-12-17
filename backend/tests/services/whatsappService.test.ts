/**
 * WhatsApp Service Tests
 * Unit tests for WhatsApp Business API integration
 * Task 4.5 - Integração WhatsApp
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import WhatsAppService from '../../src/services/whatsappService';

// Mock Firebase Admin
const mockFirestoreCollectionGet = vi.fn();
const mockFirestoreCollectionAdd = vi.fn();
const mockFirestoreDocSet = vi.fn();
const mockFirestoreDocGet = vi.fn();
const mockFirestoreDocUpdate = vi.fn();

vi.mock('firebase-admin', () => ({
  firestore: vi.fn(() => ({
    collection: vi.fn((path: string) => ({
      add: mockFirestoreCollectionAdd,
      get: mockFirestoreCollectionGet,
      where: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: mockFirestoreCollectionGet,
          })),
        })),
        limit: vi.fn(() => ({
          get: mockFirestoreCollectionGet,
        })),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: mockFirestoreCollectionGet,
          })),
          get: mockFirestoreCollectionGet,
        })),
        get: mockFirestoreCollectionGet,
      })),
      doc: vi.fn(() => ({
        set: mockFirestoreDocSet,
        get: mockFirestoreDocGet,
        update: mockFirestoreDocUpdate,
        collection: vi.fn(() => ({
          add: mockFirestoreCollectionAdd,
          orderBy: vi.fn(() => ({
            get: mockFirestoreCollectionGet,
          })),
        })),
      })),
    })),
  })),
}));

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

import axios from 'axios';

describe('WhatsAppService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendTextMessage', () => {
    it('should send text message successfully', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockResolvedValue({
        data: { messages: [{ id: 'msg-123' }] },
      });
      mockFirestoreCollectionAdd.mockResolvedValue({ id: 'log-123' });

      const messageId = await WhatsAppService.sendTextMessage('5511999999999', 'Hello!');

      expect(messageId).toBe('msg-123');
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.objectContaining({
          messaging_product: 'whatsapp',
          type: 'text',
        }),
        expect.any(Object)
      );
    });

    it('should format phone number correctly', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockResolvedValue({
        data: { messages: [{ id: 'msg-456' }] },
      });
      mockFirestoreCollectionAdd.mockResolvedValue({ id: 'log-456' });

      await WhatsAppService.sendTextMessage('11999999999', 'Test');

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          to: expect.stringMatching(/^55/),
        }),
        expect.any(Object)
      );
    });

    it('should throw error on API failure', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockRejectedValue(new Error('API Error'));

      await expect(WhatsAppService.sendTextMessage('5511999999999', 'Hello')).rejects.toThrow(
        'Failed to send WhatsApp text message'
      );
    });
  });

  describe('sendTemplateMessage', () => {
    it('should send template message successfully', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockResolvedValue({
        data: { messages: [{ id: 'template-123' }] },
      });
      mockFirestoreCollectionAdd.mockResolvedValue({ id: 'log-template' });

      const messageId = await WhatsAppService.sendTemplateMessage(
        '5511999999999',
        'hello_world',
        'pt_BR',
        ['Param1']
      );

      expect(messageId).toBe('template-123');
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'template',
          template: expect.objectContaining({
            name: 'hello_world',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should use default language if not provided', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockResolvedValue({
        data: { messages: [{ id: 'template-456' }] },
      });
      mockFirestoreCollectionAdd.mockResolvedValue({ id: 'log-template' });

      await WhatsAppService.sendTemplateMessage('5511999999999', 'hello_world');

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          template: expect.objectContaining({
            language: { code: 'pt_BR' },
          }),
        }),
        expect.any(Object)
      );
    });

    it('should throw error on template send failure', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockRejectedValue(new Error('Template error'));

      await expect(
        WhatsAppService.sendTemplateMessage('5511999999999', 'invalid_template')
      ).rejects.toThrow('Failed to send WhatsApp template message');
    });
  });

  describe('sendInteractiveMessage', () => {
    it('should send interactive message successfully', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockResolvedValue({
        data: { messages: [{ id: 'interactive-123' }] },
      });
      mockFirestoreCollectionAdd.mockResolvedValue({ id: 'log-interactive' });

      const interactive = {
        type: 'buttons',
        body: 'Choose an option',
        action: {
          buttons: [
            { type: 'reply', reply: { id: '1', title: 'Option 1' } },
            { type: 'reply', reply: { id: '2', title: 'Option 2' } },
          ],
        },
      };

      const messageId = await WhatsAppService.sendInteractiveMessage('5511999999999', interactive);

      expect(messageId).toBe('interactive-123');
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'interactive',
        }),
        expect.any(Object)
      );
    });

    it('should throw error on interactive send failure', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockRejectedValue(new Error('Interactive error'));

      await expect(
        WhatsAppService.sendInteractiveMessage('5511999999999', {
          type: 'buttons',
          body: 'Test',
          action: {},
        })
      ).rejects.toThrow('Failed to send WhatsApp interactive message');
    });
  });

  describe('processIncomingMessage', () => {
    it('should handle FAQ response', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockResolvedValue({
        data: { messages: [{ id: 'response-123' }] },
      });

      mockFirestoreCollectionGet.mockResolvedValue({
        empty: true,
      });

      mockFirestoreCollectionAdd.mockResolvedValue({ id: 'conv-123' });

      const body = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '5511999999999',
                      id: 'msg-incoming',
                      type: 'text',
                      text: { body: 'Como funciona?' },
                    },
                  ],
                  contacts: [{ wa_id: '5511999999999' }],
                },
              },
            ],
          },
        ],
      };

      await WhatsAppService.processIncomingMessage(body);

      expect(mockAxios.post).toHaveBeenCalled();
    });

    it('should escalate unknown queries', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockResolvedValue({
        data: { messages: [{ id: 'escalate-123' }] },
      });

      mockFirestoreCollectionGet.mockResolvedValue({
        empty: true,
      });

      mockFirestoreCollectionAdd.mockResolvedValue({ id: 'conv-123' });

      const body = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '5511999999999',
                      id: 'msg-unknown',
                      type: 'text',
                      text: { body: 'Pergunta desconhecida sobre xyz' },
                    },
                  ],
                  contacts: [{ wa_id: '5511999999999' }],
                },
              },
            ],
          },
        ],
      };

      await WhatsAppService.processIncomingMessage(body);

      expect(mockAxios.post).toHaveBeenCalled();
      expect(mockFirestoreDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress',
        })
      );
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history', async () => {
      const mockMessages = [
        { id: '1', sender: 'user', message: 'Hi', timestamp: new Date() },
        { id: '2', sender: 'bot', message: 'Hello', timestamp: new Date() },
      ];

      mockFirestoreCollectionGet.mockResolvedValue({
        docs: mockMessages.map((msg) => ({
          id: msg.id,
          data: () => msg,
        })),
      });

      const history = await WhatsAppService.getConversationHistory('conv-123');

      expect(history).toHaveLength(2);
      expect(history[0].sender).toBe('user');
      expect(history[1].sender).toBe('bot');
    });

    it('should return empty array if no messages', async () => {
      mockFirestoreCollectionGet.mockResolvedValue({ docs: [] });

      const history = await WhatsAppService.getConversationHistory('conv-empty');

      expect(history).toEqual([]);
    });

    it('should throw error on retrieval failure', async () => {
      mockFirestoreCollectionGet.mockRejectedValue(new Error('DB Error'));

      await expect(WhatsAppService.getConversationHistory('conv-error')).rejects.toThrow(
        'Failed to get conversation history'
      );
    });
  });

  describe('closeConversation', () => {
    it('should close conversation successfully', async () => {
      mockFirestoreDocUpdate.mockResolvedValue(undefined);

      const result = await WhatsAppService.closeConversation('conv-123');

      expect(result).toBe(true);
      expect(mockFirestoreDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'resolved',
        })
      );
    });

    it('should throw error on close failure', async () => {
      mockFirestoreDocUpdate.mockRejectedValue(new Error('Update error'));

      await expect(WhatsAppService.closeConversation('conv-error')).rejects.toThrow(
        'Failed to close conversation'
      );
    });
  });

  describe('getActiveConversations', () => {
    it('should retrieve active conversations', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          userId: 'user-1',
          status: 'in_progress',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'conv-2',
          userId: 'user-2',
          status: 'in_progress',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFirestoreCollectionGet.mockResolvedValue({
        docs: mockConversations.map((conv) => ({
          id: conv.id,
          data: () => conv,
        })),
      });

      const conversations = await WhatsAppService.getActiveConversations();

      expect(conversations).toHaveLength(2);
      expect(conversations[0].status).toBe('in_progress');
    });

    it('should respect limit parameter', async () => {
      mockFirestoreCollectionGet.mockResolvedValue({ docs: [] });

      await WhatsAppService.getActiveConversations(25);

      expect(mockFirestoreCollectionGet).toHaveBeenCalled();
    });

    it('should return empty array if no active conversations', async () => {
      mockFirestoreCollectionGet.mockResolvedValue({ docs: [] });

      const conversations = await WhatsAppService.getActiveConversations();

      expect(conversations).toEqual([]);
    });
  });

  describe('verifyWebhookToken', () => {
    it('should return true for valid token', () => {
      const result = WhatsAppService.verifyWebhookToken(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '');
      expect(typeof result).toBe('boolean');
    });

    it('should return false for invalid token', () => {
      const result = WhatsAppService.verifyWebhookToken('invalid-token');
      expect(result).toBe(false);
    });
  });

  describe('getBotSuggestions', () => {
    it('should return bot suggestions', async () => {
      const suggestions = await WhatsAppService.getBotSuggestions('conv-123');

      expect(suggestions).toHaveLength(4);
      expect(suggestions[0]).toHaveProperty('id');
      expect(suggestions[0]).toHaveProperty('text');
    });
  });
});
