/**
 * Omnichannel Service - Servio.AI
 * 
 * Sistema unificado de comunicação multi-canal:
 * - WhatsApp (Cloud API)
 * - Instagram (Graph API)
 * - Facebook Messenger (Graph API)
 * - WebChat (widget próprio)
 * 
 * IA Central: Gemini 2.5 Pro
 * Personas: Cliente | Prestador | Prospector | Admin
 */

const express = require('express');
const crypto = require('crypto');

module.exports = (injectedAdmin) => {
  const router = express.Router();
  const admin = injectedAdmin || require('firebase-admin');
  const db = admin.firestore();

// ========================================
// WEBHOOKS - Recepção de Mensagens
// ========================================

/**
 * Recebe mensagens do WhatsApp Cloud API
 */
router.all('/webhook/whatsapp', async (req, res) => {
  try {
    // Validação de webhook (Meta)
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.OMNI_WEBHOOK_SECRET) {
      console.log('[Omni WA] Webhook verificado');
      return res.status(200).send(req.query['hub.challenge']);
    }

    const { entry } = req.body;
    if (!entry || !entry[0]?.changes) {
      return res.sendStatus(200);
    }

    const changes = entry[0].changes[0];
    const value = changes.value;

    if (value.messages) {
      for (const message of value.messages) {
        await processWhatsAppMessage(message, value.metadata);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Omni WA] Erro:', error);
    res.sendStatus(500);
  }
});

/**
 * POST /omni/webhook/instagram
 * Recebe mensagens do Instagram via Graph API
 */
router.post('/webhook/instagram', async (req, res) => {
  try {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.OMNI_WEBHOOK_SECRET) {
      return res.status(200).send(req.query['hub.challenge']);
    }

    const { entry } = req.body;
    if (!entry) return res.sendStatus(200);

    for (const item of entry) {
      if (item.messaging) {
        for (const event of item.messaging) {
          await processInstagramMessage(event);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Omni IG] Erro:', error);
    res.sendStatus(500);
  }
});

/**
 * POST /omni/webhook/facebook
 * Recebe mensagens do Facebook Messenger
 */
router.post('/webhook/facebook', async (req, res) => {
  try {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.OMNI_WEBHOOK_SECRET) {
      return res.status(200).send(req.query['hub.challenge']);
    }

    const { entry } = req.body;
    if (!entry) return res.sendStatus(200);

    for (const item of entry) {
      if (item.messaging) {
        for (const event of item.messaging) {
          await processFacebookMessage(event);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Omni FB] Erro:', error);
    res.sendStatus(500);
  }
});

/**
 * POST /omni/web/send
 * Envia mensagem via WebChat (frontend)
 */
router.post('/web/send', async (req, res) => {
  try {
    const { userId, userType, message, conversationId } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId e message obrigatórios' });
    }

    const convId = conversationId || `web_${userId}_${Date.now()}`;
    
    // Salvar mensagem do usuário
    await saveMessage({
      conversationId: convId,
      channel: 'webchat',
      sender: userId,
      senderType: userType || 'cliente',
      text: message,
      timestamp: admin.firestore.Timestamp.now()
    });

    // Processar com IA
    const aiResponse = await processWithOmniIA({
      conversationId: convId,
      channel: 'webchat',
      userType: userType || 'cliente',
      message
    });

    // Salvar resposta IA
    await saveMessage({
      conversationId: convId,
      channel: 'webchat',
      sender: 'omni_ia',
      senderType: 'bot',
      text: aiResponse,
      timestamp: admin.firestore.Timestamp.now()
    });

    res.json({ success: true, conversationId: convId, response: aiResponse });
  } catch (error) {
    console.error('[Omni Web] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// REST API - Consultas
// ========================================

/**
 * GET /omni/conversations?userId=xxx&userType=cliente
 * Lista conversas de um usuário
 */
router.get('/conversations', async (req, res) => {
  try {
    const { userId, userType, channel, limit = 50 } = req.query;

    let query = db.collection('conversations');

    if (userId) query = query.where('participants', 'array-contains', userId);
    if (userType) query = query.where('userType', '==', userType);
    if (channel) query = query.where('channel', '==', channel);

    query = query.orderBy('lastMessageAt', 'desc').limit(parseInt(limit));

    const snapshot = await query.get();
    const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ conversations });
  } catch (error) {
    console.error('[Omni] Erro ao buscar conversas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /omni/messages?conversationId=xxx
 * Lista mensagens de uma conversa
 */
router.get('/messages', async (req, res) => {
  try {
    const { conversationId, limit = 100 } = req.query;

    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId obrigatório' });
    }

    const snapshot = await db.collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('timestamp', 'asc')
      .limit(parseInt(limit))
      .get();

    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ messages });
  } catch (error) {
    console.error('[Omni] Erro ao buscar mensagens:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// PROCESSADORES DE CANAL
// ========================================

async function processWhatsAppMessage(message, metadata) {
  const conversationId = `wa_${message.from}`;
  const text = message.text?.body || message.interactive?.button_reply?.title || '';

  console.log(`[Omni WA] Mensagem de ${message.from}: ${text}`);

  // Identificar tipo de usuário (buscar no Firestore)
  const userType = await identifyUserType(message.from, 'whatsapp');

  // Salvar mensagem
  await saveMessage({
    conversationId,
    channel: 'whatsapp',
    sender: message.from,
    senderType: userType,
    text,
    timestamp: admin.firestore.Timestamp.fromMillis(parseInt(message.timestamp) * 1000),
    metadata: { phone_number_id: metadata.phone_number_id }
  });

  // Processar com IA
  const aiResponse = await processWithOmniIA({
    conversationId,
    channel: 'whatsapp',
    userType,
    message: text
  });

  // Enviar resposta
  await sendWhatsAppMessage(message.from, aiResponse, metadata.phone_number_id);

  // Log
  await logOmniEvent({
    type: 'message_processed',
    channel: 'whatsapp',
    conversationId,
    userType,
    success: true
  });
}

async function processInstagramMessage(event) {
  const senderId = event.sender.id;
  const text = event.message?.text || '';
  const conversationId = `ig_${senderId}`;

  const userType = await identifyUserType(senderId, 'instagram');

  await saveMessage({
    conversationId,
    channel: 'instagram',
    sender: senderId,
    senderType: userType,
    text,
    timestamp: admin.firestore.Timestamp.fromMillis(event.timestamp)
  });

  const aiResponse = await processWithOmniIA({
    conversationId,
    channel: 'instagram',
    userType,
    message: text
  });

  await sendInstagramMessage(senderId, aiResponse);

  await logOmniEvent({
    type: 'message_processed',
    channel: 'instagram',
    conversationId,
    userType,
    success: true
  });
}

async function processFacebookMessage(event) {
  const senderId = event.sender.id;
  const text = event.message?.text || '';
  const conversationId = `fb_${senderId}`;

  const userType = await identifyUserType(senderId, 'facebook');

  await saveMessage({
    conversationId,
    channel: 'facebook',
    sender: senderId,
    senderType: userType,
    text,
    timestamp: admin.firestore.Timestamp.fromMillis(event.timestamp)
  });

  const aiResponse = await processWithOmniIA({
    conversationId,
    channel: 'facebook',
    userType,
    message: text
  });

  await sendFacebookMessage(senderId, aiResponse);

  await logOmniEvent({
    type: 'message_processed',
    channel: 'facebook',
    conversationId,
    userType,
    success: true
  });
}

// ========================================
// HELPERS
// ========================================

async function identifyUserType(identifier, channel) {
  // Buscar em users por telefone/email/social
  const usersRef = db.collection('users');
  
  let query;
  if (channel === 'whatsapp') {
    query = usersRef.where('phone', '==', identifier);
  } else if (channel === 'instagram') {
    query = usersRef.where('instagramId', '==', identifier);
  } else if (channel === 'facebook') {
    query = usersRef.where('facebookId', '==', identifier);
  }

  if (query) {
    const snapshot = await query.limit(1).get();
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      return userData.type || 'cliente';
    }
  }

  return 'cliente'; // default
}

async function saveMessage(messageData) {
  const messageRef = db.collection('messages').doc();
  await messageRef.set({
    ...messageData,
    createdAt: admin.firestore.Timestamp.now()
  });

  // Atualizar conversa
  const convRef = db.collection('conversations').doc(messageData.conversationId);
  await convRef.set({
    channel: messageData.channel,
    participants: [messageData.sender, 'omni_ia'],
    userType: messageData.senderType,
    lastMessage: messageData.text,
    lastMessageAt: messageData.timestamp,
    updatedAt: admin.firestore.Timestamp.now()
  }, { merge: true });
}

async function logOmniEvent(eventData) {
  await db.collection('omni_logs').add({
    ...eventData,
    timestamp: admin.firestore.Timestamp.now()
  });
}

// ========================================
// ENVIO DE MENSAGENS
// ========================================

async function sendWhatsAppMessage(to, text, phoneNumberId) {
  const axios = require('axios');
  
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`[Omni WA] Mensagem enviada para ${to}`);
  } catch (error) {
    console.error('[Omni WA] Erro ao enviar:', error.response?.data || error);
  }
}

async function sendInstagramMessage(recipientId, text) {
  const axios = require('axios');
  
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`[Omni IG] Mensagem enviada para ${recipientId}`);
  } catch (error) {
    console.error('[Omni IG] Erro ao enviar:', error.response?.data || error);
  }
}

async function sendFacebookMessage(recipientId, text) {
  const axios = require('axios');
  
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`[Omni FB] Mensagem enviada para ${recipientId}`);
  } catch (error) {
    console.error('[Omni FB] Erro ao enviar:', error.response?.data || error);
  }
}

// ========================================
// IA CENTRAL
// ========================================

async function processWithOmniIA(context) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    // Buscar histórico da conversa
    const messagesSnapshot = await db.collection('messages')
      .where('conversationId', '==', context.conversationId)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const history = messagesSnapshot.docs.reverse().map(doc => {
      const data = doc.data();
      return `${data.senderType === 'bot' ? 'Assistente' : 'Usuário'}: ${data.text}`;
    }).join('\n');

    const prompt = buildPromptForPersona(context.userType, context.channel, context.message, history);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Log IA
    await db.collection('ia_logs').add({
      conversationId: context.conversationId,
      channel: context.channel,
      userType: context.userType,
      prompt,
      response,
      timestamp: admin.firestore.Timestamp.now()
    });

    return response;
  } catch (error) {
    console.error('[Omni IA] Erro:', error);
    return 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.';
  }
}

function buildPromptForPersona(userType, channel, message, history) {
  const baseContext = `Você é o assistente virtual da Servio.AI, uma plataforma de serviços.
Canal: ${channel}
Histórico recente:
${history}

Mensagem atual: ${message}`;

  const personas = {
    cliente: `${baseContext}

Você está conversando com um CLIENTE.
- Ajude com dúvidas sobre serviços, orçamentos, pagamentos
- Seja cordial e resolutivo
- Ofereça encontrar prestadores se necessário
- Use linguagem clara e acessível`,
    
    prestador: `${baseContext}

Você está conversando com um PRESTADOR.
- Ajude com jobs, propostas, pagamentos, perfil
- Oriente sobre como melhorar visibilidade
- Seja profissional e direto
- Incentive ações que aumentem conversão`,
    
    prospector: `${baseContext}

Você está conversando com um PROSPECTOR/FUNCIONÁRIO.
- Ajude com CRM, leads, metas, ferramentas internas
- Forneça dicas de prospecção
- Seja estratégico e motivacional
- Use linguagem de equipe interna`,
    
    admin: `${baseContext}

Você está conversando com um ADMINISTRADOR.
- Forneça insights sobre plataforma, usuários, performance
- Seja técnico e objetivo
- Apresente dados quando relevante`
  };

  return personas[userType] || personas.cliente;
}

  return router;
};
