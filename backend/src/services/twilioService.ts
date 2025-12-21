/**
 * Twilio Integration Service
 * Handles SMS and Voice notifications via Twilio API
 * Task 4.2 - Integração Twilio SMS/Voice Notifications
 */

import twilio from 'twilio';
import admin from 'firebase-admin';
import { logger } from 'firebase-functions';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

export interface NotificationTemplate {
  key: string;
  smsBody: string;
  voiceMessage: string;
  title: string;
}

export interface UserCommunicationPreference {
  userId: string;
  smsEnabled: boolean;
  voiceEnabled: boolean;
  emailEnabled: boolean;
  preferredLanguage: 'pt-BR' | 'en-US';
}

export interface NotificationPayload {
  userId: string;
  templateKey: string;
  phoneNumber: string;
  variables?: Record<string, string>;
  channel: 'sms' | 'voice' | 'both';
}

class TwilioService {
  private client: any;
  private templates: Map<string, NotificationTemplate>;

  constructor() {
    this.client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    this.templates = this.initializeTemplates();
  }

  /**
   * Detect test mode to allow deterministic behavior without real credentials
   */
  private isTestMode(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.TWILIO_TEST_MODE === 'true';
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): Map<string, NotificationTemplate> {
    return new Map([
      [
        'nova_proposta',
        {
          key: 'nova_proposta',
          smsBody:
            'Olá {{clientName}}, você recebeu uma nova proposta para {{jobTitle}}. Clique aqui para visualizar: {{jobUrl}}',
          voiceMessage:
            'Você recebeu uma nova proposta para {{jobTitle}}. Acesse a plataforma para visualizar detalhes.',
          title: 'Nova Proposta Recebida',
        },
      ],
      [
        'job_aceito',
        {
          key: 'job_aceito',
          smsBody:
            'Parabéns {{providerName}}, seu trabalho em {{jobTitle}} foi aceito! Próximas instruções estão em: {{jobUrl}}',
          voiceMessage: 'Seu trabalho foi aceito. Verifique os detalhes na plataforma.',
          title: 'Trabalho Aceito',
        },
      ],
      [
        'pagamento_confirmado',
        {
          key: 'pagamento_confirmado',
          smsBody:
            'Seu pagamento de R$ {{amount}} foi confirmado. Referência: {{reference}}. Comprovante em: {{receiptUrl}}',
          voiceMessage: 'Seu pagamento foi processado com sucesso.',
          title: 'Pagamento Confirmado',
        },
      ],
      [
        'job_concluido',
        {
          key: 'job_concluido',
          smsBody:
            'O trabalho {{jobTitle}} foi concluído! Avalie {{raterName}} aqui: {{reviewUrl}}',
          voiceMessage: 'O trabalho foi concluído. Por favor, deixe sua avaliação.',
          title: 'Trabalho Concluído',
        },
      ],
      [
        'cancelamento',
        {
          key: 'cancelamento',
          smsBody:
            'O trabalho {{jobTitle}} foi cancelado. Motivo: {{reason}}. Suporte em: {{supportUrl}}',
          voiceMessage:
            'O trabalho foi cancelado. Entre em contato com nosso suporte se tiver dúvidas.',
          title: 'Trabalho Cancelado',
        },
      ],
    ]);
  }

  /**
   * Send SMS notification
   */
  async sendSMS(
    payload: NotificationPayload
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        logger.warn('Twilio credentials not configured');
        if (!this.isTestMode()) {
          return { success: false, error: 'Twilio not configured' };
        }
      }

      // Validate phone number (basic E.164 format)
      if (!payload.phoneNumber.match(/^\+\d{10,15}$/)) {
        return { success: false, error: 'Invalid phone number format' };
      }

      const template = this.templates.get(payload.templateKey);
      if (!template) {
        return { success: false, error: `Template not found: ${payload.templateKey}` };
      }

      // Interpolate variables
      let messageBody = template.smsBody;
      if (payload.variables) {
        Object.entries(payload.variables).forEach(([key, value]) => {
          messageBody = messageBody.replace(`{{${key}}}`, value);
        });
      }

      // Send SMS via Twilio
      const message = await this.client.messages.create({
        body: messageBody,
        from: TWILIO_PHONE_NUMBER,
        to: payload.phoneNumber,
      });

      // Log to Firestore
      await this.logNotification({
        type: 'sms',
        userId: payload.userId,
        templateKey: payload.templateKey,
        phoneNumber: payload.phoneNumber,
        status: 'sent',
        messageId: message.sid,
        timestamp: new Date(),
      });

      logger.info(`SMS sent to ${payload.phoneNumber}`, { messageId: message.sid });
      return { success: true, messageId: message.sid };
    } catch (error: any) {
      logger.error('Error sending SMS', { error: error.message, payload });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Voice Call notification
   */
  async sendVoiceCall(
    payload: NotificationPayload
  ): Promise<{ success: boolean; callId?: string; error?: string }> {
    try {
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        logger.warn('Twilio credentials not configured');
        if (!this.isTestMode()) {
          return { success: false, error: 'Twilio not configured' };
        }
      }

      // Validate phone number
      if (!payload.phoneNumber.match(/^\+\d{10,15}$/)) {
        return { success: false, error: 'Invalid phone number format' };
      }

      const template = this.templates.get(payload.templateKey);
      if (!template) {
        return { success: false, error: `Template not found: ${payload.templateKey}` };
      }

      // Interpolate variables
      let voiceMessage = template.voiceMessage;
      if (payload.variables) {
        Object.entries(payload.variables).forEach(([key, value]) => {
          voiceMessage = voiceMessage.replace(`{{${key}}}`, value);
        });
      }

      // Generate TwiML (Twilio Markup Language) for voice call
      const twiml = `<Response><Say voice="alice" language="pt-BR">${voiceMessage}</Say></Response>`;

      // Make voice call via Twilio
      const call = await this.client.calls.create({
        url: `data:text/plain,${encodeURIComponent(twiml)}`,
        to: payload.phoneNumber,
        from: TWILIO_PHONE_NUMBER,
      });

      // Log to Firestore
      await this.logNotification({
        type: 'voice',
        userId: payload.userId,
        templateKey: payload.templateKey,
        phoneNumber: payload.phoneNumber,
        status: 'initiated',
        callId: call.sid,
        timestamp: new Date(),
      });

      logger.info(`Voice call initiated to ${payload.phoneNumber}`, { callId: call.sid });
      return { success: true, callId: call.sid };
    } catch (error: any) {
      logger.error('Error making voice call', { error: error.message, payload });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification (SMS or Voice or both)
   */
  async sendNotification(
    payload: NotificationPayload
  ): Promise<{ success: boolean; results?: any; error?: string }> {
    try {
      const results: any = {};

      // Check user preferences
      const prefs = await this.getUserCommunicationPreference(payload.userId);
      if (!prefs) {
        logger.warn(`No communication preferences found for user ${payload.userId}`);
      }

      // Send SMS if enabled
      if (payload.channel === 'sms' || payload.channel === 'both') {
        if (!prefs || prefs.smsEnabled) {
          results.sms = await this.sendSMS(payload);
        }
      }

      // Send Voice if enabled
      if (payload.channel === 'voice' || payload.channel === 'both') {
        if (!prefs || prefs.voiceEnabled) {
          results.voice = await this.sendVoiceCall(payload);
        }
      }

      return { success: true, results };
    } catch (error: any) {
      logger.error('Error sending notification', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user communication preferences
   */
  async getUserCommunicationPreference(
    userId: string
  ): Promise<UserCommunicationPreference | null> {
    try {
      const db = admin.firestore();
      const doc = await db.collection('user_communication_preferences').doc(userId).get();
      return doc.exists ? (doc.data() as UserCommunicationPreference) : null;
    } catch (error: any) {
      logger.error('Error fetching communication preferences', { error: error.message, userId });
      return null;
    }
  }

  /**
   * Update user communication preferences
   */
  async updateUserCommunicationPreference(
    userId: string,
    preferences: Partial<UserCommunicationPreference>
  ): Promise<boolean> {
    try {
      const db = admin.firestore();
      await db
        .collection('user_communication_preferences')
        .doc(userId)
        .set(preferences, { merge: true });
      logger.info('Communication preferences updated', { userId });
      return true;
    } catch (error: any) {
      logger.error('Error updating communication preferences', { error: error.message, userId });
      return false;
    }
  }

  /**
   * Log notification to Firestore for audit trail
   */
  private async logNotification(logEntry: any): Promise<void> {
    try {
      const db = admin.firestore();
      await db.collection('notification_logs').add(logEntry);
    } catch (error: any) {
      logger.warn('Error logging notification', { error: error.message });
    }
  }

  /**
   * Get notification templates
   */
  getTemplates(): Record<string, NotificationTemplate> {
    const result: Record<string, NotificationTemplate> = {};
    this.templates.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Add custom template
   */
  addTemplate(template: NotificationTemplate): void {
    this.templates.set(template.key, template);
    logger.info(`Template added: ${template.key}`);
  }
}

export default new TwilioService();
