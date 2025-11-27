/**
 * WhatsApp Business API Routes
 * 
 * Endpoints para integração com WhatsApp Business API
 * - POST /api/whatsapp/send - Enviar mensagem
 * - POST /api/whatsapp/webhook - Receber webhook
 * - GET /api/whatsapp/webhook - Verificar webhook
 * - GET /api/whatsapp/status - Status da conexão
 */

const express = require('express');
const whatsappService = require('./whatsappService');
const logger = require('./logger');

const router = express.Router();

/**
 * POST /api/whatsapp/send
 * Envia mensagem WhatsApp para prospecto
 */
router.post('/send', async (req, res) => {
  try {
    const { prospectorId, prospectPhone, prospectName, message, referralLink } = req.body;

    // Validação
    if (!prospectPhone) {
      return res.status(400).json({ error: 'Telefone do prospecto obrigatório' });
    }

    if (!message && !referralLink) {
      return res.status(400).json({ error: 'Mensagem ou link de referral obrigatório' });
    }

    // Construir mensagem se não fornecida
    let finalMessage = message;
    if (!finalMessage) {
      finalMessage = `Oi ${prospectName}! 👋

Sou prospector da Servio.AI e identifiquei uma oportunidade perfeita pra você!

💰 Ganhe comissões por indicações
🚀 Comece gratuitamente, 100% grátis
⏰ Gerencie seu próprio horário

Quer saber mais? ${referralLink}

Fico no aguardo!`;
    }

    // Enviar mensagem
    const result = await whatsappService.sendMessage(prospectPhone, finalMessage);

    if (!result.success) {
      logger.error(`Falha ao enviar WhatsApp para ${prospectPhone}: ${result.error}`);
      return res.status(400).json(result);
    }

    // Registrar envio no Firestore
    if (req.app.locals.db) {
      const db = req.app.locals.db;
      await db.collection('whatsapp_messages').add({
        prospectorId: prospectorId || 'unknown',
        prospectPhone: result.phone,
        prospectName: prospectName || 'Unknown',
        messageId: result.messageId,
        status: 'sent',
        createdAt: new Date(),
        referralLink: referralLink || null,
        message: finalMessage,
      });

      logger.info(`✅ Mensagem registrada: ${prospectName} (${result.phone})`);
    }

    res.json({
      success: true,
      messageId: result.messageId,
      phone: result.phone,
      message: 'Mensagem enviada com sucesso!',
    });
  } catch (error) {
    logger.error('Erro ao enviar WhatsApp:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/webhook
 * Recebe webhooks do WhatsApp (mensagens recebidas, status de entrega, etc.)
 * 
 * Meta Business Manager → App → Webhook URL:
 * https://api.servio-ai.com/api/whatsapp/webhook
 */
router.post('/webhook', (req, res) => {
  try {
    logger.info('📨 Webhook do WhatsApp recebido');

    // Processar eventos
    const events = whatsappService.processWebhookEvent(req.body);

    if (!events || events.length === 0) {
      return res.sendStatus(200);
    }

    // Processar cada evento
    events.forEach(event => {
      if (event.type === 'message_received') {
        logger.info(`💬 Mensagem recebida de ${event.from}: ${event.text}`);
        // Implementar lógica de resposta automática aqui
      } else if (event.type === 'message_status') {
        logger.info(`📊 Status da mensagem ${event.messageId}: ${event.status}`);

        // Atualizar status no Firestore
        if (req.app.locals.db) {
          const db = req.app.locals.db;
          db.collection('whatsapp_messages')
            .where('messageId', '==', event.messageId)
            .get()
            .then(snapshot => {
              snapshot.forEach(doc => {
                doc.ref.update({
                  status: event.status,
                  statusUpdatedAt: new Date(),
                });
              });
            });
        }
      }
    });

    res.sendStatus(200);
  } catch (error) {
    logger.error('Erro ao processar webhook:', error);
    res.sendStatus(200); // Sempre retornar 200 para evitar retry infinito
  }
});

/**
 * GET /api/whatsapp/webhook
 * Verifica webhook (requerido pelo WhatsApp para setup)
 * 
 * Parâmetros:
 * - hub.mode: 'subscribe'
 * - hub.challenge: Token de desafio
 * - hub.verify_token: Token para verificação
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];
  const expectedToken = whatsappService.getWebhookToken();

  // Validar requisição
  if (mode === 'subscribe' && token === expectedToken) {
    logger.info('✅ Webhook verificado com sucesso');
    res.status(200).send(challenge);
  } else {
    logger.warn('❌ Falha na verificação do webhook');
    res.sendStatus(403);
  }
});

/**
 * GET /api/whatsapp/status
 * Status da conexão com WhatsApp API
 */
router.get('/status', async (req, res) => {
  try {
    const status = await whatsappService.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Erro ao obter status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/template
 * Envia mensagem usando template pré-aprovado
 */
router.post('/template', async (req, res) => {
  try {
    const { prospectPhone, templateName, parameters } = req.body;

    if (!prospectPhone || !templateName) {
      return res.status(400).json({
        error: 'Telefone e nome do template obrigatórios',
      });
    }

    const result = await whatsappService.sendTemplate(
      prospectPhone,
      templateName,
      parameters || []
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Template enviado com sucesso!',
    });
  } catch (error) {
    logger.error('Erro ao enviar template:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
