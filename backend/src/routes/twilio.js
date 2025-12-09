/**
 * Twilio Routes - Endpoints REST para integração Twilio
 * 
 * Endpoints:
 * - POST /api/twilio/send-sms - Envia SMS individual
 * - POST /api/twilio/send-whatsapp - Envia WhatsApp individual
 * - POST /api/twilio/make-call - Realiza chamada telefônica
 * - POST /api/twilio/send-batch - Envia SMS em batch
 * - POST /api/twilio/webhook/message-status - Webhook status de mensagem
 * - POST /api/twilio/webhook/call-status - Webhook status de chamada
 * - POST /api/twilio/webhook/recording-status - Webhook status de gravação
 * - GET /api/twilio/history/:prospectId - Histórico de comunicações
 * - GET /api/twilio/health - Status de saúde da conexão
 * 
 * @module TwilioRoutes
 */

const express = require('express');
const crypto = require('crypto');

/**
 * Verifica assinatura do webhook Twilio
 * 
 * @param {Object} req - Request do Express
 * @returns {boolean} True se assinatura válida
 */
function verifyTwilioWebhook(req) {
  const twilioSignature = req.headers['x-twilio-signature'];
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!twilioSignature || !authToken) {
    return false;
  }

  // Reconstrói URL completa
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  
  // Constrói string de dados
  let data = url;
  Object.keys(req.body).sort().forEach(key => {
    data += key + req.body[key];
  });

  // Calcula HMAC-SHA1
  const hmac = crypto.createHmac('sha1', authToken);
  const signature = hmac.update(Buffer.from(data, 'utf-8')).digest('base64');

  return signature === twilioSignature;
}

/**
 * Factory para criar router Twilio
 * 
 * @param {Object} deps - Dependências injetadas
 * @param {Object} deps.db - Instância do Firestore
 * @param {Object} deps.twilioService - Instância do TwilioService
 * @returns {Object} Express Router
 */
function createTwilioRouter({ db, twilioService }) {
  const router = express.Router();

  /**
   * POST /api/twilio/send-sms
   * Envia SMS individual
   */
  router.post('/send-sms', async (req, res) => {
    try {
      const { to, body, prospectId } = req.body;

      // Validação de input
      if (!to || !body || !prospectId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: to, body, prospectId',
        });
      }

      // Valida formato do número
      if (!to.match(/^\+[1-9]\d{1,14}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Use E.164 format (+5511999999999)',
        });
      }

      // Envia SMS
      const result = await twilioService.sendSMS({ to, body, prospectId });

      res.status(200).json({
        success: true,
        message: 'SMS sent successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in /send-sms:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/twilio/send-whatsapp
   * Envia WhatsApp individual
   */
  router.post('/send-whatsapp', async (req, res) => {
    try {
      const { to, body, prospectId, mediaUrl } = req.body;

      // Validação de input
      if (!to || !body || !prospectId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: to, body, prospectId',
        });
      }

      // Valida formato do número
      if (!to.match(/^\+[1-9]\d{1,14}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Use E.164 format (+5511999999999)',
        });
      }

      // Envia WhatsApp
      const result = await twilioService.sendWhatsApp({ to, body, prospectId, mediaUrl });

      res.status(200).json({
        success: true,
        message: 'WhatsApp sent successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in /send-whatsapp:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/twilio/make-call
   * Realiza chamada telefônica
   */
  router.post('/make-call', async (req, res) => {
    try {
      const { to, prospectId, callbackUrl, record } = req.body;

      // Validação de input
      if (!to || !prospectId || !callbackUrl) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: to, prospectId, callbackUrl',
        });
      }

      // Valida formato do número
      if (!to.match(/^\+[1-9]\d{1,14}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Use E.164 format (+5511999999999)',
        });
      }

      // Realiza chamada
      const result = await twilioService.makeCall({ to, prospectId, callbackUrl, record });

      res.status(200).json({
        success: true,
        message: 'Call initiated successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in /make-call:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/twilio/send-batch
   * Envia SMS em batch
   */
  router.post('/send-batch', async (req, res) => {
    try {
      const { messages } = req.body;

      // Validação de input
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid messages array',
        });
      }

      // Limita batch size
      if (messages.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Batch size exceeds maximum of 100 messages',
        });
      }

      // Valida cada mensagem
      for (const msg of messages) {
        if (!msg.to || !msg.body || !msg.prospectId) {
          return res.status(400).json({
            success: false,
            error: 'Each message must have to, body, and prospectId',
          });
        }
      }

      // Envia batch
      const result = await twilioService.sendSMSBatch(messages);

      res.status(200).json({
        success: true,
        message: `Batch sent: ${result.success}/${result.total} successful`,
        data: result,
      });
    } catch (error) {
      console.error('Error in /send-batch:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/twilio/webhook/message-status
   * Webhook para status de mensagens (SMS/WhatsApp)
   */
  router.post('/webhook/message-status', async (req, res) => {
    try {
      // Verifica assinatura do webhook (DESCOMENTE EM PRODUÇÃO)
      // if (!verifyTwilioWebhook(req)) {
      //   console.warn('⚠️ Invalid Twilio webhook signature');
      //   return res.status(403).json({ error: 'Invalid signature' });
      // }

      const webhookData = req.body;
      console.log('📩 Message webhook received:', webhookData);

      // Processa webhook
      await twilioService.processMessageWebhook(webhookData);

      // Responde com TwiML vazio (Twilio espera XML)
      res.set('Content-Type', 'text/xml');
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    } catch (error) {
      console.error('Error in /webhook/message-status:', error.message);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
  });

  /**
   * POST /api/twilio/webhook/call-status
   * Webhook para status de chamadas
   */
  router.post('/webhook/call-status', async (req, res) => {
    try {
      // Verifica assinatura do webhook (DESCOMENTE EM PRODUÇÃO)
      // if (!verifyTwilioWebhook(req)) {
      //   console.warn('⚠️ Invalid Twilio webhook signature');
      //   return res.status(403).json({ error: 'Invalid signature' });
      // }

      const webhookData = req.body;
      console.log('📞 Call webhook received:', webhookData);

      // Processa webhook
      await twilioService.processCallWebhook(webhookData);

      // Responde com TwiML vazio
      res.set('Content-Type', 'text/xml');
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    } catch (error) {
      console.error('Error in /webhook/call-status:', error.message);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
  });

  /**
   * POST /api/twilio/webhook/recording-status
   * Webhook para status de gravações
   */
  router.post('/webhook/recording-status', async (req, res) => {
    try {
      const { CallSid, RecordingUrl, RecordingSid, RecordingDuration } = req.body;
      
      console.log(`🎙️ Recording webhook: Call ${CallSid}, Recording ${RecordingSid}`);

      // Atualiza comunicação com URL de gravação
      const communicationsRef = db.collection('communications');
      const snapshot = await communicationsRef
        .where('twilioSid', '==', CallSid)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await docRef.update({
          recordingUrl: RecordingUrl,
          recordingSid: RecordingSid,
          recordingDuration: parseInt(RecordingDuration, 10),
          updatedAt: new Date(),
        });
        
        console.log(`✅ Recording saved for call ${CallSid}`);
      }

      // Responde com TwiML vazio
      res.set('Content-Type', 'text/xml');
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    } catch (error) {
      console.error('Error in /webhook/recording-status:', error.message);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
  });

  /**
   * GET /api/twilio/history/:prospectId
   * Obtém histórico de comunicações
   */
  router.get('/history/:prospectId', async (req, res) => {
    try {
      const { prospectId } = req.params;
      const { type } = req.query; // sms, whatsapp, call, all

      if (!prospectId) {
        return res.status(400).json({
          success: false,
          error: 'Missing prospectId parameter',
        });
      }

      // Busca histórico
      const history = await twilioService.getCommunicationHistory(prospectId, type || 'all');

      res.status(200).json({
        success: true,
        data: {
          prospectId,
          type: type || 'all',
          count: history.length,
          communications: history,
        },
      });
    } catch (error) {
      console.error('Error in /history/:prospectId:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/twilio/health
   * Verifica status de saúde da conexão Twilio
   */
  router.get('/health', async (req, res) => {
    try {
      const health = await twilioService.checkHealth();

      res.status(health.healthy ? 200 : 503).json({
        success: health.healthy,
        data: health,
      });
    } catch (error) {
      console.error('Error in /health:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
}

module.exports = createTwilioRouter;
