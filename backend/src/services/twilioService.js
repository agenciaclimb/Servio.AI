/**
 * TwilioService - Serviço de integração com Twilio API
 * 
 * Funcionalidades:
 * - Envio de SMS
 * - Envio de WhatsApp
 * - Chamadas telefônicas com gravação
 * - Webhook receivers para status de mensagens e chamadas
 * - Histórico de comunicações em Firestore
 * 
 * @module TwilioService
 */

const axios = require('axios');
const admin = require('firebase-admin');

class TwilioService {
  /**
   * @param {Object} firestore - Instância do Firestore
   */
  constructor(firestore) {
    const hasDefaultApp = admin.apps && admin.apps.length > 0;
    const allowAdHocDb = this.isTestMode();
    this.db = firestore || ((hasDefaultApp || allowAdHocDb) && admin.firestore ? admin.firestore() : null);
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    this.templates = this.initializeTemplates();
    
    // Inicializa cliente Twilio apenas se credenciais estiverem presentes
    if (this.accountSid && this.authToken) {
      this.initializeTwilioClient();
    } else {
      console.warn('⚠️ Twilio credentials not configured. Service will run in mock mode.');
    }
  }

  /**
   * Inicializa cliente Axios para Twilio API
   */
  initializeTwilioClient() {
    const authHeader = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    
    this.twilioClient = axios.create({
      baseURL: `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`,
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 15000,
    });

    console.log('✅ Twilio API client initialized');
  }

  /**
   * Detecta modo de teste para evitar chamadas reais ao Twilio
   */
  isTestMode() {
    return process.env.NODE_ENV === 'test' || process.env.TWILIO_TEST_MODE === 'true';
  }

  /**
   * Inicializa templates de notificação usados pelas rotas e testes
   */
  initializeTemplates() {
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
          smsBody: 'O trabalho {{jobTitle}} foi concluído! Avalie {{raterName}} aqui: {{reviewUrl}}',
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

  interpolateTemplate(templateString, variables = {}) {
    return Object.entries(variables || {}).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`{{${key}}}`, 'g'), value),
      templateString
    );
  }

  /**
   * Envia SMS para um número de telefone
   * 
   * @param {Object} params - Parâmetros do SMS
   * @param {string} params.to - Número de destino (formato E.164: +5511999999999)
   * @param {string} params.body - Corpo da mensagem
   * @param {string} params.prospectId - ID do prospect relacionado
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendSMS(params = {}) {
    const {
      to,
      phoneNumber,
      body,
      prospectId,
      templateKey,
      variables = {},
      userId,
    } = params;

    const targetNumber = to || phoneNumber;
    if (!targetNumber) {
      return { success: false, error: 'Phone number is required' };
    }

    const formattedNumber = targetNumber.startsWith('+')
      ? targetNumber
      : `+${targetNumber.replace(/\D/g, '')}`;

    if (!formattedNumber.match(/^\+\d{10,15}$/)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    let messageBody = body;
    if (!messageBody && templateKey) {
      const template = this.templates.get(templateKey);
      if (!template) {
        return { success: false, error: `Template not found: ${templateKey}` };
      }

      messageBody = this.interpolateTemplate(template.smsBody, variables);
    }

    if (!messageBody) {
      return { success: false, error: 'Message body is required' };
    }

    try {
      if (!this.twilioClient && this.isTestMode()) {
        const fakeSid = `test_sms_${Date.now()}`;
        await this.logNotification({
          type: 'sms',
          userId: userId || prospectId || 'unknown',
          templateKey: templateKey || 'custom',
          phoneNumber: formattedNumber,
          status: 'sent',
          messageId: fakeSid,
          timestamp: new Date(),
        });

        return { success: true, messageId: fakeSid, status: 'queued' };
      }

      if (!this.twilioClient) {
        return { success: false, error: 'Twilio client not initialized. Check credentials.' };
      }

      const response = await this.twilioClient.post('/Messages.json', new URLSearchParams({
        From: this.phoneNumber,
        To: formattedNumber,
        Body: messageBody,
      }));

      const messageData = response.data;

      await this.logCommunication({
        prospectId,
        type: 'sms',
        direction: 'outbound',
        to: formattedNumber,
        from: this.phoneNumber,
        body: messageBody,
        twilioSid: messageData.sid,
        status: messageData.status,
        timestamp: new Date(),
      });

      await this.logNotification({
        type: 'sms',
        userId: userId || prospectId || 'unknown',
        templateKey: templateKey || 'custom',
        phoneNumber: formattedNumber,
        status: messageData.status,
        messageId: messageData.sid,
        timestamp: new Date(),
      });

      return {
        success: true,
        messageSid: messageData.sid,
        messageId: messageData.sid,
        status: messageData.status,
        to: formattedNumber,
      };
    } catch (error) {
      await this.logCommunication({
        prospectId,
        type: 'sms',
        direction: 'outbound',
        to: formattedNumber,
        body: messageBody,
        status: 'failed',
        error: error.message,
        timestamp: new Date(),
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Envia mensagem WhatsApp via Twilio
   * 
   * @param {Object} params - Parâmetros do WhatsApp
   * @param {string} params.to - Número WhatsApp de destino (formato E.164: +5511999999999)
   * @param {string} params.body - Corpo da mensagem
   * @param {string} params.prospectId - ID do prospect relacionado
   * @param {string} params.mediaUrl - URL de mídia (opcional)
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendWhatsApp({ to, body, prospectId, mediaUrl }) {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized. Check credentials.');
      }

      // Valida número de telefone
      if (!to.match(/^\+[1-9]\d{1,14}$/)) {
        throw new Error(`Invalid phone number format: ${to}. Use E.164 format (+5511999999999)`);
      }

      // Prepara parâmetros da mensagem
      const params = {
        From: `whatsapp:${this.whatsappNumber}`,
        To: `whatsapp:${to}`,
        Body: body,
      };

      if (mediaUrl) {
        params.MediaUrl = mediaUrl;
      }

      // Envia WhatsApp via Twilio API
      const response = await this.twilioClient.post('/Messages.json', new URLSearchParams(params));

      const messageData = response.data;

      // Registra envio no Firestore
      await this.logCommunication({
        prospectId,
        type: 'whatsapp',
        direction: 'outbound',
        to,
        from: this.whatsappNumber,
        body,
        mediaUrl,
        twilioSid: messageData.sid,
        status: messageData.status,
        timestamp: new Date(),
      });

      console.log(`✅ WhatsApp sent to ${to} (SID: ${messageData.sid})`);

      return {
        success: true,
        messageSid: messageData.sid,
        status: messageData.status,
        to,
      };
    } catch (error) {
      console.error('❌ Error sending WhatsApp:', error.message);
      
      // Registra erro no Firestore
      await this.logCommunication({
        prospectId,
        type: 'whatsapp',
        direction: 'outbound',
        to,
        body,
        status: 'failed',
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * Envia chamada de voz usando Twilio
   */
  async sendVoiceCall(params = {}) {
    const { to, phoneNumber, templateKey, variables = {}, userId, prospectId } = params;
    const targetNumber = to || phoneNumber;

    if (!targetNumber) {
      return { success: false, error: 'Phone number is required' };
    }

    const formattedNumber = targetNumber.startsWith('+')
      ? targetNumber
      : `+${targetNumber.replace(/\D/g, '')}`;

    if (!formattedNumber.match(/^\+\d{10,15}$/)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const template = templateKey ? this.templates.get(templateKey) : null;
    const voiceMessage = template
      ? this.interpolateTemplate(template.voiceMessage, variables)
      : params.voiceMessage || 'Notification';

    try {
      if (!this.twilioClient && this.isTestMode()) {
        const fakeCallId = `test_call_${Date.now()}`;
        await this.logNotification({
          type: 'voice',
          userId: userId || prospectId || 'unknown',
          templateKey: templateKey || 'custom',
          phoneNumber: formattedNumber,
          status: 'initiated',
          callId: fakeCallId,
          timestamp: new Date(),
        });

        return { success: true, callId: fakeCallId };
      }

      if (!this.twilioClient) {
        return { success: false, error: 'Twilio client not initialized. Check credentials.' };
      }

      const twiml = `<Response><Say voice="alice" language="pt-BR">${voiceMessage}</Say></Response>`;

      const response = await this.twilioClient.post('/Calls.json', new URLSearchParams({
        From: this.phoneNumber,
        To: formattedNumber,
        Twiml: twiml,
      }));

      const callData = response.data;

      await this.logCommunication({
        prospectId,
        type: 'call',
        direction: 'outbound',
        to: formattedNumber,
        from: this.phoneNumber,
        twilioSid: callData.sid,
        status: callData.status,
        timestamp: new Date(),
      });

      await this.logNotification({
        type: 'voice',
        userId: userId || prospectId || 'unknown',
        templateKey: templateKey || 'custom',
        phoneNumber: formattedNumber,
        status: callData.status,
        callId: callData.sid,
        timestamp: new Date(),
      });

      return {
        success: true,
        callId: callData.sid,
        status: callData.status,
        to: formattedNumber,
      };
    } catch (error) {
      await this.logCommunication({
        prospectId,
        type: 'call',
        direction: 'outbound',
        to: formattedNumber,
        status: 'failed',
        error: error.message,
        timestamp: new Date(),
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Envia notificação de acordo com preferências do usuário
   */
  async sendNotification(payload = {}) {
    const channel = payload.channel || 'sms';
    const prefs = payload.userId ? await this.getUserCommunicationPreference(payload.userId) : null;

    const results = {};

    if (channel === 'sms' || channel === 'both') {
      if (!prefs || prefs.smsEnabled) {
        results.sms = await this.sendSMS(payload);
      }
    }

    if (channel === 'voice' || channel === 'both') {
      if (!prefs || prefs.voiceEnabled) {
        results.voice = await this.sendVoiceCall(payload);
      }
    }

    return { success: true, results };
  }

  async getUserCommunicationPreference(userId) {
    try {
      if (!this.db) return null;
      const doc = await this.db.collection('user_communication_preferences').doc(userId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('❌ Error fetching communication preferences:', error.message);
      return null;
    }
  }

  async updateUserCommunicationPreference(userId, preferences = {}) {
    try {
      if (!this.db) return false;
      await this.db
        .collection('user_communication_preferences')
        .doc(userId)
        .set(preferences, { merge: true });
      return true;
    } catch (error) {
      console.error('❌ Error updating communication preferences:', error.message);
      return false;
    }
  }

  getTemplates() {
    const result = {};
    this.templates.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  addTemplate(template) {
    if (!template || !template.key) return;
    this.templates.set(template.key, template);
  }

  /**
   * Realiza chamada telefônica com gravação
   * 
   * @param {Object} params - Parâmetros da chamada
   * @param {string} params.to - Número de destino
   * @param {string} params.prospectId - ID do prospect relacionado
   * @param {string} params.callbackUrl - URL para TwiML (instruções da chamada)
   * @param {boolean} params.record - Se deve gravar a chamada (default: true)
   * @returns {Promise<Object>} Resultado da chamada
   */
  async makeCall({ to, prospectId, callbackUrl, record = true }) {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized. Check credentials.');
      }

      // Valida número de telefone
      if (!to.match(/^\+[1-9]\d{1,14}$/)) {
        throw new Error(`Invalid phone number format: ${to}. Use E.164 format (+5511999999999)`);
      }

      // Prepara parâmetros da chamada
      const params = {
        From: this.phoneNumber,
        To: to,
        Url: callbackUrl, // TwiML URL que define o fluxo da chamada
        StatusCallback: `${process.env.BACKEND_URL}/api/twilio/webhook/call-status`,
      };

      if (record) {
        params.Record = 'true';
        params.RecordingStatusCallback = `${process.env.BACKEND_URL}/api/twilio/webhook/recording-status`;
      }

      // Realiza chamada via Twilio API
      const response = await this.twilioClient.post('/Calls.json', new URLSearchParams(params));

      const callData = response.data;

      // Registra chamada no Firestore
      await this.logCommunication({
        prospectId,
        type: 'call',
        direction: 'outbound',
        to,
        from: this.phoneNumber,
        twilioSid: callData.sid,
        status: callData.status,
        record,
        timestamp: new Date(),
      });

      console.log(`✅ Call initiated to ${to} (SID: ${callData.sid})`);

      return {
        success: true,
        callSid: callData.sid,
        status: callData.status,
        to,
      };
    } catch (error) {
      console.error('❌ Error making call:', error.message);
      
      // Registra erro no Firestore
      await this.logCommunication({
        prospectId,
        type: 'call',
        direction: 'outbound',
        to,
        status: 'failed',
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * Processa webhook de status de mensagem
   * 
   * @param {Object} webhookData - Dados do webhook Twilio
   * @returns {Promise<Object>} Resultado do processamento
   */
  async processMessageWebhook(webhookData) {
    try {
      const { MessageSid, MessageStatus, From, To, Body } = webhookData;

      console.log(`📩 Webhook received: Message ${MessageSid} - Status: ${MessageStatus}`);

      // Busca comunicação existente no Firestore
      const communicationsRef = this.db.collection('communications');
      const snapshot = await communicationsRef
        .where('twilioSid', '==', MessageSid)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn(`⚠️ Communication not found for SID: ${MessageSid}`);
        
        // Cria registro se for mensagem entrante
        if (webhookData.SmsStatus === 'received') {
          await this.logCommunication({
            type: webhookData.From.includes('whatsapp') ? 'whatsapp' : 'sms',
            direction: 'inbound',
            from: From,
            to: To,
            body: Body,
            twilioSid: MessageSid,
            status: MessageStatus,
            timestamp: new Date(),
          });
        }
        
        return { success: true, action: 'created_new' };
      }

      // Atualiza status da comunicação existente
      const docRef = snapshot.docs[0].ref;
      await docRef.update({
        status: MessageStatus,
        updatedAt: new Date(),
      });

      console.log(`✅ Updated communication ${MessageSid} to status: ${MessageStatus}`);

      return { success: true, action: 'updated' };
    } catch (error) {
      console.error('❌ Error processing message webhook:', error.message);
      throw error;
    }
  }

  /**
   * Processa webhook de status de chamada
   * 
   * @param {Object} webhookData - Dados do webhook Twilio
   * @returns {Promise<Object>} Resultado do processamento
   */
  async processCallWebhook(webhookData) {
    try {
      const { CallSid, CallStatus, CallDuration, RecordingUrl } = webhookData;

      console.log(`📞 Webhook received: Call ${CallSid} - Status: ${CallStatus}`);

      // Busca comunicação existente no Firestore
      const communicationsRef = this.db.collection('communications');
      const snapshot = await communicationsRef
        .where('twilioSid', '==', CallSid)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn(`⚠️ Communication not found for SID: ${CallSid}`);
        return { success: false, error: 'Communication not found' };
      }

      // Atualiza status da chamada
      const updateData = {
        status: CallStatus,
        updatedAt: new Date(),
      };

      if (CallDuration) {
        updateData.duration = parseInt(CallDuration, 10);
      }

      if (RecordingUrl) {
        updateData.recordingUrl = RecordingUrl;
      }

      const docRef = snapshot.docs[0].ref;
      await docRef.update(updateData);

      console.log(`✅ Updated call ${CallSid} to status: ${CallStatus}`);

      return { success: true, action: 'updated' };
    } catch (error) {
      console.error('❌ Error processing call webhook:', error.message);
      throw error;
    }
  }

  /**
   * Obtém histórico de comunicações de um prospect
   * 
   * @param {string} prospectId - ID do prospect
   * @param {string} type - Tipo de comunicação (sms, whatsapp, call, all)
   * @returns {Promise<Array>} Lista de comunicações
   */
  async getCommunicationHistory(prospectId, type = 'all') {
    try {
      let query = this.db.collection('communications').where('prospectId', '==', prospectId);

      if (type !== 'all') {
        query = query.where('type', '==', type);
      }

      const snapshot = await query.orderBy('timestamp', 'desc').limit(50).get();

      const communications = [];
      snapshot.forEach(doc => {
        communications.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(`📊 Retrieved ${communications.length} communications for prospect ${prospectId}`);

      return communications;
    } catch (error) {
      console.error('❌ Error fetching communication history:', error.message);
      throw error;
    }
  }

  /**
   * Registra notificações (SMS/voz) em coleção dedicada
   */
  async logNotification(entry) {
    try {
      if (!this.db) return null;
      const ref = await this.db.collection('notification_logs').add({
        ...entry,
        createdAt: new Date(),
      });
      return ref.id;
    } catch (error) {
      console.warn('⚠️ Error logging notification:', error.message);
      return null;
    }
  }

  /**
   * Registra comunicação no Firestore
   * 
   * @param {Object} data - Dados da comunicação
   * @returns {Promise<string>} ID do documento criado
   */
  async logCommunication(data) {
    try {
      const communicationsRef = this.db.collection('communications');
      const docRef = await communicationsRef.add({
        ...data,
        createdAt: new Date(),
      });

      console.log(`📝 Communication logged: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error logging communication:', error.message);
      throw error;
    }
  }

  /**
   * Verifica status de saúde da conexão com Twilio
   * 
   * @returns {Promise<Object>} Status da conexão
   */
  async checkHealth() {
    try {
      if (!this.twilioClient) {
        return {
          healthy: false,
          error: 'Twilio client not initialized',
        };
      }

      // Testa conexão buscando account info
      const response = await this.twilioClient.get('.json');

      return {
        healthy: true,
        accountSid: response.data.sid,
        accountStatus: response.data.status,
        phoneNumber: this.phoneNumber,
        whatsappNumber: this.whatsappNumber,
      };
    } catch (error) {
      console.error('❌ Twilio health check failed:', error.message);
      
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  /**
   * Envia SMS em batch para múltiplos prospects
   * 
   * @param {Array} messages - Array de objetos {to, body, prospectId}
   * @returns {Promise<Object>} Resultado do envio em batch
   */
  async sendSMSBatch(messages) {
    const results = {
      total: messages.length,
      success: 0,
      failed: 0,
      details: [],
    };

    for (const message of messages) {
      try {
        const result = await this.sendSMS(message);
        results.success++;
        results.details.push({ ...message, status: 'sent', result });
      } catch (error) {
        results.failed++;
        results.details.push({ ...message, status: 'failed', error: error.message });
      }
    }

    console.log(`📊 Batch SMS: ${results.success}/${results.total} sent successfully`);

    return results;
  }
}

module.exports = TwilioService;
module.exports.default = new TwilioService();
