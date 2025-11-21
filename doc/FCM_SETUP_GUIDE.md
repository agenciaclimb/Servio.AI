# Firebase Cloud Messaging (FCM) - Guia de Configuração

## 📋 Visão Geral

Este guia explica como configurar Firebase Cloud Messaging para enviar notificações push aos prospectores da Servio.AI.

## 🎯 O que você pode fazer

- **Notificações de Cliques**: Avisar quando alguém clica no link de indicação
- **Notificações de Conversão**: Avisar quando prospect se registra como prestador
- **Notificações de Comissão**: Avisar quando prospector ganha comissão
- **Lembretes de Follow-up**: Avisar sobre follow-ups pendentes

## 🚀 Passo 1: Configurar FCM no Firebase Console

### 1.1 Gerar VAPID Key

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto (`gen-lang-client-0737507616`)
3. Vá em **Project Settings** (ícone de engrenagem) → **Cloud Messaging**
4. Na seção **Web Push certificates**, clique em **Generate key pair**
5. Copie a **Web Push certificate** (chave VAPID)

### 1.2 Adicionar VAPID Key ao .env

No arquivo `.env` local e no ambiente de produção:

```bash
VITE_FIREBASE_VAPID_KEY=sua_vapid_key_aqui
```

### 1.3 Configurar Service Worker

O arquivo `public/firebase-messaging-sw.js` já está configurado. Apenas certifique-se de que:

1. O arquivo está servido da raiz do domínio (não de `/assets` ou `/static`)
2. O Content-Type é `application/javascript`

Para testar localmente:
```bash
npm run dev
# Abra: http://localhost:5173/firebase-messaging-sw.js
# Deve retornar o código JavaScript (não 404)
```

## 🔧 Passo 2: Implementar Backend para Envio

O frontend apenas **recebe** notificações. O **envio** deve ser feito pelo backend usando Firebase Admin SDK.

### 2.1 Instalar Firebase Admin SDK (Backend)

```bash
cd backend
npm install firebase-admin
```

### 2.2 Criar Serviço de Notificações (Backend)

Crie `backend/src/fcmService.js`:

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../path/to/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * Send push notification to specific user
 */
async function sendNotification(fcmToken, title, body, data = {}) {
  const message = {
    notification: {
      title,
      body,
    },
    data,
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('[FCM] Notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('[FCM] Error sending notification:', error);
    throw error;
  }
}

/**
 * Send notification to prospector when link is clicked
 */
async function notifyLinkClicked(prospectorId, prospectName, source) {
  // Get prospector's FCM token from Firestore
  const prospectorDoc = await admin.firestore()
    .collection('notification_preferences')
    .doc(prospectorId)
    .get();

  if (!prospectorDoc.exists || !prospectorDoc.data().fcmToken) {
    console.log('[FCM] No FCM token for prospector:', prospectorId);
    return;
  }

  const { fcmToken, clickNotifications, enabled } = prospectorDoc.data();
  
  if (!enabled || !clickNotifications) {
    console.log('[FCM] Click notifications disabled for:', prospectorId);
    return;
  }

  return sendNotification(
    fcmToken,
    '🎯 Novo Clique no Seu Link!',
    `${prospectName} clicou no seu link via ${source}`,
    {
      type: 'click',
      prospectorId,
      prospectName,
      source,
    }
  );
}

/**
 * Send notification when prospect converts (registers)
 */
async function notifyConversion(prospectorId, providerName, category) {
  const prospectorDoc = await admin.firestore()
    .collection('notification_preferences')
    .doc(prospectorId)
    .get();

  if (!prospectorDoc.exists || !prospectorDoc.data().fcmToken) return;

  const { fcmToken, conversionNotifications, enabled } = prospectorDoc.data();
  if (!enabled || !conversionNotifications) return;

  return sendNotification(
    fcmToken,
    '🎉 Conversão Confirmada!',
    `${providerName} se cadastrou como ${category}!`,
    {
      type: 'conversion',
      prospectorId,
      providerName,
      category,
    }
  );
}

/**
 * Send notification when commission is generated
 */
async function notifyCommission(prospectorId, amount, providerName) {
  const prospectorDoc = await admin.firestore()
    .collection('notification_preferences')
    .doc(prospectorId)
    .get();

  if (!prospectorDoc.exists || !prospectorDoc.data().fcmToken) return;

  const { fcmToken, commissionNotifications, enabled } = prospectorDoc.data();
  if (!enabled || !commissionNotifications) return;

  return sendNotification(
    fcmToken,
    '💰 Nova Comissão Gerada!',
    `Você ganhou R$ ${amount.toFixed(2)} com ${providerName}`,
    {
      type: 'commission',
      prospectorId,
      amount: amount.toString(),
      providerName,
    }
  );
}

module.exports = {
  sendNotification,
  notifyLinkClicked,
  notifyConversion,
  notifyCommission,
};
```

### 2.3 Integrar com Eventos do Sistema

**Quando link é clicado** (`referralLinkService.trackClick`):
```javascript
// Em trackClick() após salvar no Firestore:
const fcmService = require('./fcmService');
await fcmService.notifyLinkClicked(prospectorId, prospectName, source);
```

**Quando prospect se registra** (`providerRegistration`):
```javascript
// Após criar documento do provider:
const fcmService = require('./fcmService');
await fcmService.notifyConversion(prospectorId, providerName, category);
```

**Quando comissão é gerada** (`paymentService`):
```javascript
// Após calcular comissão:
const fcmService = require('./fcmService');
await fcmService.notifyCommission(prospectorId, commissionAmount, providerName);
```

## 🧪 Passo 3: Testar Notificações

### 3.1 Teste Manual no Frontend

1. Abra o Prospector Dashboard
2. Vá para a aba "🔔 Notificações"
3. Clique em "Ativar Notificações"
4. Autorize quando o navegador solicitar
5. Verifique se o status mudou para "✅ Notificações ativadas"

### 3.2 Teste de Envio (Backend)

Crie um script de teste `backend/scripts/test_fcm.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function testNotification() {
  // Get a prospector's FCM token from Firestore
  const prospectorId = 'TEST_PROSPECTOR_ID'; // Replace with real ID
  
  const doc = await admin.firestore()
    .collection('notification_preferences')
    .doc(prospectorId)
    .get();

  if (!doc.exists || !doc.data().fcmToken) {
    console.log('❌ No FCM token found for prospector');
    return;
  }

  const fcmToken = doc.data().fcmToken;

  const message = {
    notification: {
      title: '🧪 Teste de Notificação',
      body: 'Se você vê isso, FCM está funcionando! ✅',
    },
    data: {
      type: 'test',
      timestamp: new Date().toISOString(),
    },
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent:', response);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testNotification();
```

Executar:
```bash
node backend/scripts/test_fcm.js
```

## 📊 Passo 4: Monitoramento e Logs

### 4.1 Ver Logs no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Cloud Messaging** → **Diagnostics**
3. Veja estatísticas de entregas, falhas, etc.

### 4.2 Logs no Backend

```javascript
// Log successful deliveries
console.log('[FCM] Sent to:', prospectorId, 'Result:', response);

// Log failures
console.error('[FCM] Failed to send:', error.code, error.message);
```

### 4.3 Métricas Importantes

- **Delivery rate**: % de notificações entregues com sucesso
- **Open rate**: % de notificações clicadas
- **Opt-out rate**: % de usuários que desativam notificações

## 🔒 Segurança e Boas Práticas

### 4.1 Proteção de Tokens

- **Nunca** exponha tokens FCM publicamente
- Armazene tokens em Firestore com regras de segurança:

```javascript
// firestore.rules
match /notification_preferences/{prospectorId} {
  allow read, write: if request.auth.uid == prospectorId;
}
```

### 4.2 Rate Limiting

Evite spamming de notificações:

```javascript
// Máximo 5 notificações por hora por usuário
const recentNotifs = await admin.firestore()
  .collection('notifications')
  .where('prospectorId', '==', prospectorId)
  .where('sentAt', '>', new Date(Date.now() - 3600000))
  .get();

if (recentNotifs.size >= 5) {
  console.log('[FCM] Rate limit exceeded for:', prospectorId);
  return;
}
```

### 4.3 Retry Logic

Implementar retry para falhas temporárias:

```javascript
async function sendWithRetry(token, title, body, data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await sendNotification(token, title, body, data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## 🐛 Troubleshooting

### Problema: "Notification permission denied"

**Solução**: Usuário bloqueou notificações. Instruções:
1. Chrome: Ícone de cadeado → Permissões → Notificações → Permitir
2. Firefox: Ícone de escudo → Permissões → Notificações → Permitir
3. Safari: Preferências → Sites → Notificações → Permitir

### Problema: "Service worker not found"

**Solução**: Verifique que `firebase-messaging-sw.js` está sendo servido da raiz:
- ✅ `https://servio-ai.com/firebase-messaging-sw.js`
- ❌ `https://servio-ai.com/assets/firebase-messaging-sw.js`

Em Vite, coloque em `/public`, não em `/src`.

### Problema: "Token registration failed"

**Solução**: Verifique VAPID key no `.env`:
```bash
# .env
VITE_FIREBASE_VAPID_KEY=BJa...sua_key...xyz
```

### Problema: "No FCM token in Firestore"

**Solução**: Usuário não ativou notificações ainda. Verificar:
```javascript
const doc = await getDoc(doc(db, 'notification_preferences', userId));
console.log('FCM Token:', doc.data()?.fcmToken);
```

## 📈 Próximos Passos

- [ ] Implementar analytics de notificações (open rate, click-through rate)
- [ ] Adicionar A/B testing de mensagens
- [ ] Criar dashboard de performance de notificações
- [ ] Implementar notificações agendadas (ex: "Você não acessa há 7 dias")
- [ ] Adicionar deep linking (abrir app em página específica ao clicar)

## 📚 Referências

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
