/**
 * Notification Service - Backend FCM Integration
 * 
 * Envia notificações push para prospectores via Firebase Cloud Messaging
 * 
 * Tipos de notificações:
 * - click: Alguém clicou no link de indicação
 * - conversion: Novo prestador cadastrado via link
 * - commission: Nova comissão gerada
 * - badge: Badge desbloqueado
 */

const admin = require('firebase-admin');

/**
 * Envia notificação push para prospector
 */
async function notifyProspector({ db, prospectorId, type, data }) {
  try {
    // Buscar FCM token do prospector
    const prospectorDoc = await db.collection('prospectors').doc(prospectorId).get();
    
    if (!prospectorDoc.exists) {
      console.warn(`Prospector ${prospectorId} not found`);
      return { success: false, error: 'Prospector not found' };
    }

    const prospectorData = prospectorDoc.data();
    const fcmToken = prospectorData.fcmToken;

    if (!fcmToken) {
      console.log(`No FCM token for prospector ${prospectorId}, skipping notification`);
      return { success: false, error: 'No FCM token' };
    }

    // Templates de notificação
    const messages = {
      click: {
        title: '👀 Alguém clicou no seu link!',
        body: `Um prestador acabou de acessar seu link de indicação. Envie uma mensagem de follow-up!`,
        icon: '/prospector-icon.png',
        badge: '/badge.png',
      },
      conversion: {
        title: '🎉 Conversão! Novo recrutado!',
        body: `${data.providerName} acabou de se cadastrar através do seu link! Parabéns!`,
        icon: '/success-icon.png',
        badge: '/badge.png',
      },
      commission: {
        title: '💰 Nova comissão gerada!',
        body: `${data.providerName} completou um job. Você ganhou R$ ${data.amount.toFixed(2)}!`,
        icon: '/money-icon.png',
        badge: '/badge.png',
      },
      badge: {
        title: '🏆 Novo badge desbloqueado!',
        body: `Parabéns! Você conquistou o badge "${data.badgeName}"!`,
        icon: '/trophy-icon.png',
        badge: '/badge.png',
      },
    };

    const message = messages[type];

    if (!message) {
      console.warn(`Unknown notification type: ${type}`);
      return { success: false, error: 'Unknown type' };
    }

    // Enviar notificação via FCM
    const result = await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: message.title,
        body: message.body,
        icon: message.icon,
        badge: message.badge,
      },
      data: {
        type,
        ...data,
      },
      webpush: {
        fcmOptions: {
          link: 'https://servio-ai.com/prospector/dashboard',
        },
        notification: {
          requireInteraction: true, // Notificação persiste até user clicar
          tag: `prospector-${type}`, // Agrupa notificações do mesmo tipo
        },
      },
    });

    // Log de sucesso
    await db.collection('notification_logs').add({
      prospectorId,
      type,
      data,
      sentAt: Date.now(),
      messageId: result,
    });

    return { success: true, messageId: result };
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Se token inválido, remover do prospector
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      await db.collection('prospectors').doc(prospectorId).update({
        fcmToken: null,
      });
    }

    return { success: false, error: error.message };
  }
}

/**
 * Registra/atualiza FCM token do prospector
 */
async function registerFCMToken({ db, prospectorId, fcmToken, platform = 'web' }) {
  try {
    await db.collection('prospectors').doc(prospectorId).update({
      fcmToken,
      fcmPlatform: platform,
      fcmUpdatedAt: Date.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove FCM token do prospector
 */
async function unregisterFCMToken({ db, prospectorId }) {
  try {
    await db.collection('prospectors').doc(prospectorId).update({
      fcmToken: null,
      fcmPlatform: null,
    });
    return { success: true };
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  notifyProspector,
  registerFCMToken,
  unregisterFCMToken,
};
