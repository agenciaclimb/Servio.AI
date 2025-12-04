/**
 * Cloud Function para Webhooks Omnichannel - Servio.AI
 * 
 * Deploy: firebase deploy --only functions:omnichannelWebhook
 * 
 * Endpoint: https://us-central1-{PROJECT_ID}.cloudfunctions.net/omnichannelWebhook
 * 
 * Processa webhooks de:
 * - WhatsApp Cloud API
 * - Instagram (Graph API)
 * - Facebook Messenger (Graph API)
 * 
 * Normaliza mensagens, valida duplicação, persiste no Firestore, dispara IA
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ========================================
// WEBHOOK HANDLER
// ========================================

exports.omnichannelWebhook = functions.https.onRequest(async (req, res) => {
  const channel = req.query.channel; // whatsapp | instagram | facebook

  if (!channel) {
    return res.status(400).send('Missing channel parameter');
  }

  // Verificação de webhook (Meta)
  if (req.method === 'GET') {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.OMNI_WEBHOOK_SECRET) {
      console.log('[Omni Webhook] Verificação bem-sucedida:', channel);
      return res.status(200).send(req.query['hub.challenge']);
    }
    return res.status(403).send('Forbidden');
  }

  // Processamento de mensagens (POST)
  if (req.method === 'POST') {
    try {
      // Validar assinatura (Meta)
      if (channel === 'whatsapp' || channel === 'instagram' || channel === 'facebook') {
        const signature = req.headers['x-hub-signature-256'];
        if (signature && !validateMetaSignature(signature, req.rawBody, process.env.META_APP_SECRET)) {
          console.error('[Omni Webhook] Assinatura inválida');
          return res.status(403).send('Invalid signature');
        }
      }

      const { entry } = req.body;
      if (!entry) {
        return res.sendStatus(200);
      }

      // Processar mensagens
      for (const item of entry) {
        if (channel === 'whatsapp') {
          await processWhatsAppEntry(item);
        } else if (channel === 'instagram' || channel === 'facebook') {
          await processSocialEntry(item, channel);
        }
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('[Omni Webhook] Erro:', error);
      res.sendStatus(500);
    }
  } else {
    res.status(405).send('Method not allowed');
  }
});

// ========================================
// PROCESSADORES
// ========================================

async function processWhatsAppEntry(entry) {
  const changes = entry.changes || [];
  
  for (const change of changes) {
    const value = change.value;
    if (!value.messages) continue;

    for (const message of value.messages) {
      const normalized = normalizeWhatsAppMessage(message, value.metadata);
      
      // Validar duplicação
      if (await isDuplicate(normalized)) {
        console.log('[Omni WA] Mensagem duplicada ignorada:', message.id);
        continue;
      }

      // Persistir
      await saveNormalizedMessage(normalized);

      // Disparar IA (async, não bloqueia resposta)
      triggerOmniIA(normalized).catch(err => console.error('[Omni WA] Erro IA:', err));
    }
  }
}

async function processSocialEntry(entry, channel) {
  const messaging = entry.messaging || [];
  
  for (const event of messaging) {
    if (!event.message) continue;

    const normalized = normalizeSocialMessage(event, channel);
    
    if (await isDuplicate(normalized)) {
      console.log(`[Omni ${channel.toUpperCase()}] Mensagem duplicada ignorada:`, event.message.mid);
      continue;
    }

    await saveNormalizedMessage(normalized);
    triggerOmniIA(normalized).catch(err => console.error(`[Omni ${channel.toUpperCase()}] Erro IA:`, err));
  }
}

// ========================================
// NORMALIZAÇÃO
// ========================================

function normalizeWhatsAppMessage(message, metadata) {
  return {
    messageId: message.id,
    conversationId: `wa_${message.from}`,
    channel: 'whatsapp',
    sender: message.from,
    senderType: null, // será identificado pela IA
    text: message.text?.body || message.interactive?.button_reply?.title || '',
    timestamp: admin.firestore.Timestamp.fromMillis(parseInt(message.timestamp) * 1000),
    metadata: {
      phone_number_id: metadata.phone_number_id,
      display_phone_number: metadata.display_phone_number
    },
    createdAt: admin.firestore.Timestamp.now()
  };
}

function normalizeSocialMessage(event, channel) {
  return {
    messageId: event.message.mid,
    conversationId: `${channel}_${event.sender.id}`,
    channel,
    sender: event.sender.id,
    senderType: null,
    text: event.message.text || '',
    timestamp: admin.firestore.Timestamp.fromMillis(event.timestamp),
    metadata: {
      recipient_id: event.recipient.id
    },
    createdAt: admin.firestore.Timestamp.now()
  };
}

// ========================================
// PERSISTÊNCIA
// ========================================

async function saveNormalizedMessage(normalized) {
  const messageRef = db.collection('messages').doc(normalized.messageId);
  await messageRef.set(normalized);

  // Atualizar conversa
  const convRef = db.collection('conversations').doc(normalized.conversationId);
  await convRef.set({
    channel: normalized.channel,
    participants: [normalized.sender, 'omni_ia'],
    userType: normalized.senderType,
    lastMessage: normalized.text,
    lastMessageAt: normalized.timestamp,
    lastMessageSender: normalized.sender,
    status: 'active',
    updatedAt: admin.firestore.Timestamp.now()
  }, { merge: true });

  console.log(`[Omni] Mensagem persistida: ${normalized.conversationId}`);
}

async function isDuplicate(normalized) {
  const doc = await db.collection('messages').doc(normalized.messageId).get();
  return doc.exists;
}

// ========================================
// IA TRIGGER
// ========================================

async function triggerOmniIA(normalized) {
  // Identificar tipo de usuário
  const userType = await identifyUserType(normalized.sender, normalized.channel);
  
  // Atualizar senderType
  await db.collection('messages').doc(normalized.messageId).update({ senderType: userType });
  await db.collection('conversations').doc(normalized.conversationId).update({ userType });

  // Buscar histórico
  const historySnapshot = await db.collection('messages')
    .where('conversationId', '==', normalized.conversationId)
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();

  const history = historySnapshot.docs.reverse().map(doc => {
    const data = doc.data();
    return `${data.senderType === 'bot' ? 'Assistente' : 'Usuário'}: ${data.text}`;
  }).join('\n');

  // Gerar resposta com Gemini
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const prompt = buildPrompt(userType, normalized.channel, normalized.text, history);
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const result = await model.generateContent(prompt);
  const response = result.response.text();

  // Salvar resposta
  const responseRef = db.collection('messages').doc();
  await responseRef.set({
    messageId: responseRef.id,
    conversationId: normalized.conversationId,
    channel: normalized.channel,
    sender: 'omni_ia',
    senderType: 'bot',
    text: response,
    timestamp: admin.firestore.Timestamp.now(),
    createdAt: admin.firestore.Timestamp.now()
  });

  // Atualizar conversa
  await db.collection('conversations').doc(normalized.conversationId).update({
    lastMessage: response,
    lastMessageAt: admin.firestore.Timestamp.now(),
    lastMessageSender: 'omni_ia'
  });

  // Enviar resposta ao canal
  await sendToChannel(normalized.channel, normalized.sender, response, normalized.metadata);

  // Log IA
  await db.collection('ia_logs').add({
    conversationId: normalized.conversationId,
    channel: normalized.channel,
    userType,
    prompt,
    response,
    timestamp: admin.firestore.Timestamp.now()
  });

  console.log(`[Omni IA] Resposta enviada: ${normalized.conversationId}`);
}

function buildPrompt(userType, channel, message, history) {
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

async function identifyUserType(identifier, channel) {
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

  return 'cliente';
}

async function sendToChannel(channel, recipient, text, metadata) {
  const axios = require('axios');

  try {
    if (channel === 'whatsapp') {
      await axios.post(
        `https://graph.facebook.com/v18.0/${metadata.phone_number_id}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipient,
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
    } else if (channel === 'instagram' || channel === 'facebook') {
      await axios.post(
        `https://graph.facebook.com/v18.0/me/messages`,
        {
          recipient: { id: recipient },
          message: { text }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    console.error(`[Omni] Erro ao enviar ${channel}:`, error.response?.data || error);
  }
}

// ========================================
// VALIDAÇÃO
// ========================================

function validateMetaSignature(signature, rawBody, appSecret) {
  const expectedSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
