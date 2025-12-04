/**
 * WhatsApp Business API Service
 * 
 * Gerencia integração com WhatsApp Business API para envio de mensagens
 * via Cloud Run / Express backend
 */

const axios = require('axios');
const logger = require('./logger');

const WHATSAPP_API_URL = 'https://graph.instagram.com/v18.0';
const PHONE_NUMBER_ID = process.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WEBHOOK_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN || 'servio-ai-webhook-token-2025';

class WhatsAppService {
  constructor() {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      logger.warn('⚠️  WhatsApp credentials not configured - service disabled');
    }
  }

  /**
   * Envia mensagem de texto via WhatsApp
   * @param {string} phoneNumber - Número do destinatário (formato: 5511987654321)
   * @param {string} message - Conteúdo da mensagem
   * @param {string} messageId - ID único da mensagem para rastreamento
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendMessage(phoneNumber, message, messageId = null) {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return { success: false, error: 'WhatsApp service not configured' };
    }

    try {
      // Normalizar número (adicionar código país se necessário)
      const normalizedPhone = this._normalizePhone(phoneNumber);

      logger.info(`📤 Enviando WhatsApp para ${normalizedPhone}`);

      const response = await axios.post(
        `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const sentMessageId = response.data.messages[0]?.id;
      logger.info(`✅ WhatsApp enviado com sucesso para ${normalizedPhone} (ID: ${sentMessageId})`);

      return {
        success: true,
        messageId: sentMessageId,
        phone: normalizedPhone,
      };
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      logger.error(`❌ Erro ao enviar WhatsApp: ${errorMsg}`, {
        phone: phoneNumber,
        status: error.response?.status,
      });

      return {
        success: false,
        error: errorMsg,
        phone: phoneNumber,
      };
    }
  }

  /**
   * Envia mensagem usando template pré-aprovado no WhatsApp Business Account
   * @param {string} phoneNumber - Número do destinatário
   * @param {string} templateName - Nome do template configurado
   * @param {Array<string>} parameters - Parâmetros para substituição
   */
  async sendTemplate(phoneNumber, templateName, parameters = []) {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return { success: false, error: 'WhatsApp service not configured' };
    }

    try {
      const normalizedPhone = this._normalizePhone(phoneNumber);

      logger.info(`📤 Enviando template "${templateName}" para ${normalizedPhone}`);

      const response = await axios.post(
        `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: parameters.map(param => ({ type: 'text', text: param })),
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const sentMessageId = response.data.messages[0]?.id;
      logger.info(`✅ Template enviado com sucesso para ${normalizedPhone}`);

      return {
        success: true,
        messageId: sentMessageId,
        phone: normalizedPhone,
      };
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      logger.error(`❌ Erro ao enviar template WhatsApp: ${errorMsg}`);

      return {
        success: false,
        error: errorMsg,
        phone: phoneNumber,
      };
    }
  }

  /**
   * Valida webhook do WhatsApp (POST)
   * Verifica assinatura da requisição
   */
  validateWebhookSignature(req) {
    const signature = req.get('x-hub-signature-256');
    if (!signature) return false;

    const hmac = require('crypto')
      .createHmac('sha256', process.env.WHATSAPP_SECRET_KEY || '')
      .update(req.rawBody || JSON.stringify(req.body))
      .digest('hex');

    const expectedSignature = `sha256=${hmac}`;
    return signature === expectedSignature;
  }

  /**
   * Processa webhook do WhatsApp (recebimento de mensagens)
   */
  processWebhookEvent(body) {
    try {
      if (body.object !== 'whatsapp_business_account') {
        return null;
      }

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) return null;

      const events = [];

      // Mensagens recebidas
      if (value.messages && value.messages.length > 0) {
        const message = value.messages[0];
        events.push({
          type: 'message_received',
          from: message.from,
          timestamp: message.timestamp,
          text: message.text?.body,
          messageId: message.id,
          messageType: message.type,
        });
      }

      // Confirmações de entrega
      if (value.statuses && value.statuses.length > 0) {
        const status = value.statuses[0];
        events.push({
          type: 'message_status',
          messageId: status.id,
          status: status.status, // 'sent', 'delivered', 'read', 'failed'
          timestamp: status.timestamp,
          recipientId: status.recipient_id,
        });
      }

      return events;
    } catch (error) {
      logger.error('❌ Erro ao processar webhook do WhatsApp', error);
      return null;
    }
  }

  /**
   * Normaliza número de telefone para formato E.164
   * @private
   */
  _normalizePhone(phone) {
    // Remove caracteres especiais
    const cleaned = phone.replace(/\D/g, '');

    // Se não começar com 55, adicionar código país
    if (!cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Verifica se o serviço está configurado
   */
  isConfigured() {
    return Boolean(PHONE_NUMBER_ID && ACCESS_TOKEN);
  }

  /**
   * Obtem status da conexão com WhatsApp API
   */
  async getStatus() {
    if (!this.isConfigured()) {
      return { configured: false, message: 'WhatsApp credentials not set' };
    }

    try {
      const response = await axios.get(
        `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}?access_token=${ACCESS_TOKEN}`,
        { timeout: 5000 }
      );

      return {
        configured: true,
        connected: true,
        phoneNumberId: PHONE_NUMBER_ID,
        displayPhoneNumber: response.data.display_phone_number,
        qualityRating: response.data.quality_rating,
      };
    } catch (error) {
      logger.error('❌ Erro ao conectar com WhatsApp API', error.message);
      return {
        configured: true,
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * Webhook token para verificação
   */
  getWebhookToken() {
    return WEBHOOK_TOKEN;
  }

  /**
   * Envia mensagens em massa com rate limiting e retry logic
   * @param {Array} recipients - Array de { phone, message, leadId }
   * @param {Object} options - { delayMs: tempo entre msgs, maxRetries: tentativas }
   * @returns {Promise<Object>} { sent, failed, results }
   */
  async sendBulkMessages(recipients, options = {}) {
    const {
      delayMs = 15, // 15ms = ~66 msg/seg (limite Meta: 80/seg)
      maxRetries = 2,
      batchSize = 100
    } = options;

    const results = {
      sent: 0,
      failed: 0,
      details: []
    };

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      let attempts = 0;
      let success = false;
      let lastError = null;

      // Retry logic
      while (attempts < maxRetries && !success) {
        attempts++;

        const result = await this.sendMessage(
          recipient.phone,
          recipient.message,
          recipient.messageId || `bulk_${Date.now()}_${i}`
        );

        if (result.success) {
          success = true;
          results.sent++;
        } else {
          lastError = result.error;
          
          // Se erro for rate limit, aguarda mais tempo
          if (lastError && lastError.includes('rate limit')) {
            await this._sleep(1000); // 1 segundo de pausa
          }
        }
      }

      results.details.push({
        leadId: recipient.leadId || null,
        phone: recipient.phone,
        success,
        attempts,
        error: success ? null : lastError
      });

      if (!success) {
        results.failed++;
      }

      // Rate limiting: pausa entre mensagens
      if (i < recipients.length - 1) {
        await this._sleep(delayMs);
      }

      // Log de progresso a cada 10 mensagens
      if ((i + 1) % 10 === 0) {
        logger.info(`📊 Progresso WhatsApp bulk: ${i + 1}/${recipients.length} (${results.sent} enviados, ${results.failed} falhados)`);
      }
    }

    logger.info(`✅ WhatsApp bulk finalizado: ${results.sent} enviados, ${results.failed} falhados de ${recipients.length} total`);
    return results;
  }

  /**
   * Helper: sleep promise
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new WhatsAppService();
