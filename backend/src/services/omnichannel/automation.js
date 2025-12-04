/**
 * Motor de Automações Omnichannel - Servio.AI
 * 
 * Triggers:
 * 1. followup_48h - Cliente sem resposta há 48h
 * 2. followup_proposta - Prestador enviou proposta, cliente não respondeu
 * 3. followup_pagamento - Pagamento pendente
 * 4. followup_onboarding - Novo usuário sem ação em 24h
 * 5. followup_prospector_recrutamento - Lead prospector não respondeu
 */

const admin = require('firebase-admin');
const db = admin.firestore();

// ========================================
// SCHEDULER - Chamado via Cloud Scheduler
// ========================================

async function runAutomations() {
  console.log('[Automação] Iniciando verificação de triggers...');
  
  const results = await Promise.all([
    checkFollowup48h(),
    checkFollowupProposta(),
    checkFollowupPagamento(),
    checkFollowupOnboarding(),
    checkFollowupProspectorRecrutamento()
  ]);

  console.log('[Automação] Resultados:', results);
  return results;
}

// ========================================
// TRIGGERS
// ========================================

/**
 * Trigger 1: Cliente sem resposta há 48h
 */
async function checkFollowup48h() {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 48);

  const snapshot = await db.collection('conversations')
    .where('userType', '==', 'cliente')
    .where('lastMessageAt', '<=', admin.firestore.Timestamp.fromDate(cutoff))
    .where('lastMessageSender', '==', 'omni_ia')
    .where('status', '==', 'active')
    .limit(50)
    .get();

  let sent = 0;

  for (const doc of snapshot.docs) {
    const conv = doc.data();
    
    // Verificar opt-out
    if (await checkOptOut(conv.participants[0])) continue;

    const message = `Olá! Vi que você não respondeu há alguns dias. Ainda posso ajudar com algo? 😊`;
    
    await sendToChannel(conv.channel, conv.participants[0], message);
    
    await db.collection('omni_logs').add({
      type: 'automation_followup_48h',
      conversationId: doc.id,
      channel: conv.channel,
      timestamp: admin.firestore.Timestamp.now()
    });

    sent++;
  }

  return { trigger: 'followup_48h', sent };
}

/**
 * Trigger 2: Proposta sem resposta
 */
async function checkFollowupProposta() {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24);

  // Buscar propostas enviadas sem resposta há 24h
  const snapshot = await db.collection('proposals')
    .where('status', '==', 'enviada')
    .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(cutoff))
    .limit(50)
    .get();

  let sent = 0;

  for (const doc of snapshot.docs) {
    const proposal = doc.data();
    
    // Buscar job e cliente
    const jobDoc = await db.collection('jobs').doc(proposal.jobId).get();
    if (!jobDoc.exists) continue;
    
    const job = jobDoc.data();
    const clientId = job.clientId;

    if (await checkOptOut(clientId)) continue;

    // Buscar canal preferido do cliente
    const userDoc = await db.collection('users').doc(clientId).get();
    if (!userDoc.exists) continue;

    const preferredChannel = userDoc.data().preferredChannel || 'webchat';
    
    const message = `Olá! Vi que você recebeu uma proposta para "${job.title}". Gostaria de revisar? 📋`;
    
    await sendToChannel(preferredChannel, clientId, message);
    
    await db.collection('omni_logs').add({
      type: 'automation_followup_proposta',
      proposalId: doc.id,
      jobId: proposal.jobId,
      channel: preferredChannel,
      timestamp: admin.firestore.Timestamp.now()
    });

    sent++;
  }

  return { trigger: 'followup_proposta', sent };
}

/**
 * Trigger 3: Pagamento pendente
 */
async function checkFollowupPagamento() {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 12);

  const snapshot = await db.collection('escrow')
    .where('status', '==', 'pending')
    .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(cutoff))
    .limit(30)
    .get();

  let sent = 0;

  for (const doc of snapshot.docs) {
    const escrow = doc.data();
    
    if (await checkOptOut(escrow.clientId)) continue;

    const userDoc = await db.collection('users').doc(escrow.clientId).get();
    if (!userDoc.exists) continue;

    const preferredChannel = userDoc.data().preferredChannel || 'webchat';
    
    const message = `Olá! Percebi que há um pagamento pendente de R$ ${escrow.amount.toFixed(2)}. Posso ajudar a concluir? 💳`;
    
    await sendToChannel(preferredChannel, escrow.clientId, message);
    
    await db.collection('omni_logs').add({
      type: 'automation_followup_pagamento',
      escrowId: doc.id,
      channel: preferredChannel,
      timestamp: admin.firestore.Timestamp.now()
    });

    sent++;
  }

  return { trigger: 'followup_pagamento', sent };
}

/**
 * Trigger 4: Onboarding - Novo usuário sem ação
 */
async function checkFollowupOnboarding() {
  const cutoffMin = new Date();
  cutoffMin.setHours(cutoffMin.getHours() - 24);
  
  const cutoffMax = new Date();
  cutoffMax.setHours(cutoffMax.getHours() - 25);

  const snapshot = await db.collection('users')
    .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(cutoffMin))
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(cutoffMax))
    .where('onboardingCompleted', '==', false)
    .limit(50)
    .get();

  let sent = 0;

  for (const doc of snapshot.docs) {
    const user = doc.data();
    
    if (await checkOptOut(doc.id)) continue;

    const preferredChannel = user.preferredChannel || 'webchat';
    
    const messages = {
      cliente: `Bem-vindo à Servio.AI! 👋 Vejo que você ainda não publicou seu primeiro serviço. Posso te ajudar a começar?`,
      prestador: `Olá! Vi que você se cadastrou como prestador. Quer ajuda para configurar seu perfil e começar a receber jobs? 🚀`,
      prospector: `Bem-vindo à equipe! 🎉 Vamos começar sua jornada de prospecção? Tenho dicas valiosas para você.`
    };

    const message = messages[user.type] || messages.cliente;
    
    await sendToChannel(preferredChannel, doc.id, message);
    
    await db.collection('omni_logs').add({
      type: 'automation_followup_onboarding',
      userId: doc.id,
      userType: user.type,
      channel: preferredChannel,
      timestamp: admin.firestore.Timestamp.now()
    });

    sent++;
  }

  return { trigger: 'followup_onboarding', sent };
}

/**
 * Trigger 5: Prospector Recrutamento
 */
async function checkFollowupProspectorRecrutamento() {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 72);

  const snapshot = await db.collection('prospector_prospects')
    .where('status', '==', 'contatado')
    .where('lastContactAt', '<=', admin.firestore.Timestamp.fromDate(cutoff))
    .limit(30)
    .get();

  let sent = 0;

  for (const doc of snapshot.docs) {
    const prospect = doc.data();
    
    if (await checkOptOut(prospect.email)) continue;

    // Preferência: email para prospects
    const message = `Olá ${prospect.name}! 👋\n\nVi que conversamos recentemente sobre oportunidades na Servio.AI.\n\nAinda está interessado(a) em fazer parte da nossa plataforma de prestadores?\n\nTemos vagas abertas e adoraríamos te ter no time! 🚀`;
    
    await sendToChannel('email', prospect.email, message, prospect.name);
    
    await db.collection('omni_logs').add({
      type: 'automation_followup_prospector_recrutamento',
      prospectId: doc.id,
      channel: 'email',
      timestamp: admin.firestore.Timestamp.now()
    });

    sent++;
  }

  return { trigger: 'followup_prospector_recrutamento', sent };
}

// ========================================
// HELPERS
// ========================================

async function checkOptOut(userId) {
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return false;
  
  const userData = doc.data();
  return userData.optOutAutomations === true;
}

async function sendToChannel(channel, recipient, message, recipientName = '') {
  switch (channel) {
    case 'whatsapp':
      return sendWhatsApp(recipient, message);
    case 'instagram':
      return sendInstagram(recipient, message);
    case 'facebook':
      return sendFacebook(recipient, message);
    case 'email':
      return sendEmail(recipient, message, recipientName);
    case 'webchat':
      return saveWebChatMessage(recipient, message);
    default:
      return saveWebChatMessage(recipient, message);
  }
}

async function sendWhatsApp(phone, text) {
  const axios = require('axios');
  
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone,
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
  } catch (error) {
    console.error('[Automação WA] Erro:', error.response?.data || error);
  }
}

async function sendInstagram(recipientId, text) {
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
  } catch (error) {
    console.error('[Automação IG] Erro:', error.response?.data || error);
  }
}

async function sendFacebook(recipientId, text) {
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
  } catch (error) {
    console.error('[Automação FB] Erro:', error.response?.data || error);
  }
}

async function sendEmail(email, text, name) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  try {
    await sgMail.send({
      to: email,
      from: 'noreply@servio.ai',
      subject: 'Mensagem da Servio.AI',
      text,
      html: `<p>Olá ${name || ''},</p><p>${text.replace(/\n/g, '<br>')}</p>`
    });
  } catch (error) {
    console.error('[Automação Email] Erro:', error);
  }
}

async function saveWebChatMessage(userId, text) {
  const conversationId = `web_${userId}_auto`;
  
  await db.collection('messages').add({
    conversationId,
    channel: 'webchat',
    sender: 'omni_ia',
    senderType: 'bot',
    text,
    timestamp: admin.firestore.Timestamp.now(),
    isAutomation: true
  });

  await db.collection('conversations').doc(conversationId).set({
    channel: 'webchat',
    participants: [userId, 'omni_ia'],
    lastMessage: text,
    lastMessageAt: admin.firestore.Timestamp.now(),
    lastMessageSender: 'omni_ia',
    status: 'active'
  }, { merge: true });
}

module.exports = {
  runAutomations,
  checkFollowup48h,
  checkFollowupProposta,
  checkFollowupPagamento,
  checkFollowupOnboarding,
  checkFollowupProspectorRecrutamento
};
