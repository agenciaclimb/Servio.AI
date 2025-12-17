/**
 * WhatsApp Service
 * Integration with WhatsApp Business API for customer support
 * Task 4.5 - Integração WhatsApp
 */

import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import axios from 'axios';

const db = admin.firestore();

interface WhatsAppMessage {
  from: string;
  to: string;
  type: 'text' | 'template' | 'interactive';
  content: string;
  metadata?: Record<string, any>;
}

interface ConversationMessage {
  id?: string;
  conversationId: string;
  sender: 'user' | 'bot' | 'agent';
  message: string;
  timestamp: Date;
  type: 'text' | 'template' | 'interactive';
  messageId?: string;
}

interface Conversation {
  id?: string;
  userId: string;
  providerEmail?: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
  messages: ConversationMessage[];
}

interface BotResponse {
  response: string;
  action: 'reply' | 'escalate';
  metadata?: Record<string, any>;
}

interface QuickReply {
  id: string;
  text: string;
}

interface InteractiveMessage {
  type: 'buttons' | 'list';
  body: string;
  action: {
    buttons?: Array<{ type: string; reply: { id: string; title: string } }>;
    sections?: Array<{ title: string; rows: Array<{ id: string; title: string; description: string }> }>;
  };
}

class WhatsAppService {
  private phoneNumberId: string;
  private accessToken: string;
  private businessAccountId: string;
  private webhookVerifyToken: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
    this.webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
  }

  /**
   * Send text message via WhatsApp
   */
  async sendTextMessage(to: string, text: string): Promise<string> {
    try {
      const response = await axios.post(
        `https://graph.instagram.com/v18.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: 'text',
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const messageId = response.data.messages?.[0]?.id;
      await this.logMessageToFirestore({
        from: this.phoneNumberId,
        to,
        type: 'text',
        content: text,
        metadata: { messageId, status: 'sent' },
      });

      return messageId;
    } catch (error: any) {
      logger.error('Error sending WhatsApp text message', { error: error.message });
      throw new Error('Failed to send WhatsApp text message');
    }
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateLanguage: string = 'pt_BR',
    parameters: string[] = []
  ): Promise<string> {
    try {
      const response = await axios.post(
        `https://graph.instagram.com/v18.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: templateLanguage,
            },
            components: parameters.length > 0 ? [{ type: 'body', parameters: parameters.map((p) => ({ type: 'text', text: p })) }] : undefined,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const messageId = response.data.messages?.[0]?.id;
      await this.logMessageToFirestore({
        from: this.phoneNumberId,
        to,
        type: 'template',
        content: templateName,
        metadata: { messageId, parameters, status: 'sent' },
      });

      return messageId;
    } catch (error: any) {
      logger.error('Error sending WhatsApp template message', { error: error.message });
      throw new Error('Failed to send WhatsApp template message');
    }
  }

  /**
   * Send interactive message (buttons/list)
   */
  async sendInteractiveMessage(to: string, interactive: InteractiveMessage): Promise<string> {
    try {
      const response = await axios.post(
        `https://graph.instagram.com/v18.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: 'interactive',
          interactive,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const messageId = response.data.messages?.[0]?.id;
      await this.logMessageToFirestore({
        from: this.phoneNumberId,
        to,
        type: 'interactive',
        content: JSON.stringify(interactive),
        metadata: { messageId, status: 'sent' },
      });

      return messageId;
    } catch (error: any) {
      logger.error('Error sending WhatsApp interactive message', { error: error.message });
      throw new Error('Failed to send WhatsApp interactive message');
    }
  }

  /**
   * Process incoming webhook message
   */
  async processIncomingMessage(body: any): Promise<void> {
    try {
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!message) return;

      const senderId = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id;
      const conversation = await this.getOrCreateConversation(senderId);

      // Log incoming message
      await db
        .collection('conversations')
        .doc(conversation.id)
        .collection('messages')
        .add({
          sender: 'user',
          message: message.text?.body || '[Media or template response]',
          timestamp: new Date(),
          type: message.type,
          messageId: message.id,
        } as ConversationMessage);

      // Get bot response
      const botResponse = await this.getBotResponse(message.text?.body || '', conversation);

      if (botResponse.action === 'escalate') {
        // Update conversation status to require human intervention
        await db.collection('conversations').doc(conversation.id).update({
          status: 'in_progress',
          updatedAt: new Date(),
        });

        // Notify human agents
        await this.notifyAgents(conversation.id, senderId);
      } else {
        // Send bot reply
        await this.sendTextMessage(senderId, botResponse.response);

        // Log bot response
        await db
          .collection('conversations')
          .doc(conversation.id)
          .collection('messages')
          .add({
            sender: 'bot',
            message: botResponse.response,
            timestamp: new Date(),
            type: 'text',
          } as ConversationMessage);
      }
    } catch (error: any) {
      logger.error('Error processing incoming WhatsApp message', { error: error.message });
      throw new Error('Failed to process incoming message');
    }
  }

  /**
   * Get AI response from bot (simple implementation)
   */
  private async getBotResponse(userMessage: string, conversation: any): Promise<BotResponse> {
    const lowerMessage = userMessage.toLowerCase();

    // Simple FAQ responses
    const faqResponses: Record<string, string> = {
      'como funciona': 'Nosso serviço conecta clientes com prestadores de serviço qualificados. Você pode publicar um job, receber propostas e gerenciar pagamentos de forma segura.',
      'quanto custa':
        'O valor depende do tipo de serviço. Você define o orçamento e recebe propostas de prestadores.',
      'como pagar':
        'Usamos Stripe para pagamentos seguros. Os fundos são retidos como escrow até a conclusão do serviço.',
      'segurança': 'Todos os pagamentos são protegidos e auditados. Seus dados estão seguros em nossa plataforma.',
      'suporte': 'Estamos aqui para ajudar! Qual é sua dúvida específica?',
    };

    // Check for FAQ matches
    for (const [keyword, response] of Object.entries(faqResponses)) {
      if (lowerMessage.includes(keyword)) {
        return { response, action: 'reply' };
      }
    }

    // Default escalation for unknown questions
    return {
      response: 'Sua pergunta foi registrada. Um agente humano entrará em contato em breve para ajudar.',
      action: 'escalate',
    };
  }

  /**
   * Get or create conversation
   */
  private async getOrCreateConversation(userId: string): Promise<any> {
    try {
      // Check if active conversation exists
      const existing = await db
        .collection('conversations')
        .where('userId', '==', userId)
        .where('status', '==', 'open')
        .limit(1)
        .get();

      if (!existing.empty) {
        return { id: existing.docs[0].id, ...existing.docs[0].data() };
      }

      // Create new conversation
      const newConv = await db.collection('conversations').add({
        userId,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      } as Conversation);

      return { id: newConv.id, userId, status: 'open' };
    } catch (error: any) {
      logger.error('Error getting or creating conversation', { error: error.message });
      throw new Error('Failed to manage conversation');
    }
  }

  /**
   * Notify human agents
   */
  private async notifyAgents(conversationId: string, userId: string): Promise<void> {
    try {
      // Get active agents
      const agents = await db
        .collection('agents')
        .where('status', '==', 'ativo')
        .where('type', '==', 'support')
        .get();

      // Create notifications for each agent
      for (const agent of agents.docs) {
        await db
          .collection('agent_notifications')
          .add({
            agentId: agent.id,
            conversationId,
            userId,
            type: 'escalated_conversation',
            createdAt: new Date(),
            read: false,
          });
      }
    } catch (error: any) {
      logger.error('Error notifying agents', { error: error.message });
    }
  }

  /**
   * Log message to Firestore
   */
  private async logMessageToFirestore(message: WhatsAppMessage): Promise<void> {
    try {
      await db.collection('whatsapp_messages').add({
        ...message,
        timestamp: new Date(),
      });
    } catch (error: any) {
      logger.error('Error logging message to Firestore', { error: error.message });
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: string): Promise<ConversationMessage[]> {
    try {
      const snapshot = await db
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as ConversationMessage));
    } catch (error: any) {
      logger.error('Error getting conversation history', { error: error.message });
      throw new Error('Failed to get conversation history');
    }
  }

  /**
   * Close conversation
   */
  async closeConversation(conversationId: string): Promise<boolean> {
    try {
      await db.collection('conversations').doc(conversationId).update({
        status: 'resolved',
        updatedAt: new Date(),
      });
      return true;
    } catch (error: any) {
      logger.error('Error closing conversation', { error: error.message });
      throw new Error('Failed to close conversation');
    }
  }

  /**
   * Get active conversations
   */
  async getActiveConversations(limit: number = 50): Promise<Conversation[]> {
    try {
      const snapshot = await db
        .collection('conversations')
        .where('status', '==', 'in_progress')
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Conversation));
    } catch (error: any) {
      logger.error('Error getting active conversations', { error: error.message });
      throw new Error('Failed to get active conversations');
    }
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Ensure it starts with country code
    return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  }

  /**
   * Verify webhook token
   */
  verifyWebhookToken(token: string): boolean {
    return token === this.webhookVerifyToken;
  }

  /**
   * Get bot suggestions for conversation
   */
  async getBotSuggestions(conversationId: string): Promise<QuickReply[]> {
    const suggestions: QuickReply[] = [
      { id: '1', text: 'Ver status do job' },
      { id: '2', text: 'Enviar mensagem' },
      { id: '3', text: 'Solicitar pagamento' },
      { id: '4', text: 'Falar com agente' },
    ];
    return suggestions;
  }
}

export default new WhatsAppService();
