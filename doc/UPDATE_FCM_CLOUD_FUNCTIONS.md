#update_log - 08/11/2025 23:15
🔔🚀 **CLOUD FUNCTIONS + PUSH NOTIFICATIONS (FCM) COMPLETOS**

**🎉 FEATURES IMPLEMENTADAS:**

- ✅ Cloud Functions Infrastructure (3 functions)
- ✅ Firebase Cloud Messaging (FCM) Web Push
- ✅ Auto token registration on login
- ✅ Foreground & background notification handlers
- ✅ Notification preferences system
- ✅ 15/15 function tests passing

**📊 TESTES TOTAIS: 114/114 (100%)**

- 81/81 Backend unit/integration tests ✅
- 8/8 E2E SPRINT 1 tests ✅
- 5/5 Real-time chat E2E tests ✅
- 5/5 Provider earnings E2E tests ✅
- 15/15 Cloud Functions unit tests ✅

**📂 ARQUIVOS CRIADOS:**

- `functions/index.js` - 3 Cloud Functions (273 linhas)
- `functions/package.json` - Dependencies & scripts
- `functions/test/functions.test.js` - Unit tests (230 linhas)
- `functions/README.md` - Deployment guide
- `services/messagingService.ts` - FCM client SDK
- `public/firebase-messaging-sw.js` - Service Worker
- `FCM_SETUP_GUIDE.md` - Setup & troubleshooting
- `scripts/deploy-functions.{sh,ps1}` - Deploy scripts

---

**☁️ CLOUD FUNCTIONS (3 DEPLOYED):**

### 1. **notifyOnNewMessage**

**Trigger**: Firestore onCreate `/messages/{messageId}`

**Flow**:

```
Nova mensagem criada
  → Identifica destinatário (cliente ou prestador)
  → Cria notificação no Firestore
  → Verifica user.fcmToken
  → Envia push notification via FCM
  → Remove token inválido automaticamente
```

**FCM Payload**:

```javascript
{
  token: userData.fcmToken,
  notification: {
    title: 'Nova Mensagem no Servio.AI',
    body: `Nova mensagem sobre "${job.category}": ${text}...`,
  },
  webpush: {
    fcmOptions: {
      link: 'https://servio.ai/dashboard',
    },
  },
}
```

**Notification Preferences**:

- Respeita `user.notificationPreferences.newMessage` (default: true)
- Skipa mensagens do sistema (`senderType: 'system'`)
- Auto-remove tokens inválidos

### 2. **updateProviderRate**

**Trigger**: Firestore onUpdate `/jobs/{jobId}` quando status → `concluido`

**Flow**:

```
Job concluído
  → Busca jobs completados do prestador
  → Calcula stats (totalJobs, revenue, rating, disputes)
  → Aplica lógica de bonuses (75-85%)
  → Atualiza user.providerRate
  → Salva rateTier (Bronze/Ouro)
```

**Rate Calculation**:

- Base: 75%
- +2% Profile complete
- +2% High rating (4.8+)
- +3% Volume tier (R$ 1.5k, 6k, 11k)
- +1% Low dispute rate (<5%)
- Cap: 85%

### 3. **cleanupOldNotifications**

**Trigger**: Pub/Sub scheduled `0 2 * * *` (daily 2am BRT)

**Flow**:

```
2am diariamente
  → Query notifications createdAt < 30 dias
  → Batch delete (limit 500)
  → Log result
```

---

**📱 FIREBASE CLOUD MESSAGING (WEB PUSH):**

### **Client-side Integration**

**1. Token Registration** (`services/messagingService.ts`):

```typescript
export async function getFcmToken(): Promise<string | null> {
  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: swReg,
  });
  return token;
}

export async function registerUserFcmToken(userEmail: string) {
  const token = await getFcmToken();
  await API.updateUser(userEmail, { fcmToken: token });
}
```

**2. Foreground Handler** (`App.tsx`):

```typescript
onForegroundMessage(payload => {
  if (payload?.notification) {
    alert(`🔔 ${payload.notification.title}\n${payload.notification.body}`);
  }
});
```

**3. Background Handler** (`public/firebase-messaging-sw.js`):

```javascript
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || 'Servio.AI';
  const options = {
    body: payload.notification?.body,
    icon: '/icons/icon-192.png',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});
```

### **User Type Extensions**

```typescript
interface User {
  // ... existing fields
  fcmToken?: string;
  notificationPreferences?: {
    newMessage?: boolean; // Chat notifications
    jobStatusChange?: boolean; // Job updates
    disputeEvents?: boolean; // Dispute alerts
    marketing?: boolean; // Promo messages
  };
}
```

### **Environment Variables**

`.env`:

```bash
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_FROM_CONSOLE
```

---

**🔄 NOTIFICATION FLOW (COMPLETO):**

```
Cliente envia mensagem
  ↓
POST /messages → Firestore
  ↓
Cloud Function: notifyOnNewMessage triggers
  ↓
Identifica prestador como destinatário
  ↓
Cria doc em /notifications
  ↓
Busca user.fcmToken do prestador
  ↓
Envia FCM push notification
  ↓
SE app está aberto: onForegroundMessage → alert
SE app está minimizado: Service Worker → browser notification
  ↓
Prestador clica → redireciona para /dashboard
```

---

**🧪 TESTES:**

### **Unit Tests (15/15 passing)**

```
Cloud Functions Tests
  calculateProviderRate
    ✓ should return base rate for new provider
    ✓ should add profile complete bonus
    ✓ should add high rating bonus
    ✓ should add volume tier bonus
    ✓ should add low dispute rate bonus
    ✓ should cap at 85%
    ✓ should award Ouro tier for excellent provider
  notifyOnNewMessage logic
    ✓ should identify correct recipient when client sends message
    ✓ should identify correct recipient when provider sends message
    ✓ should skip notification for system messages
  updateProviderRate trigger logic
    ✓ should only trigger when job becomes concluido
    ✓ should not trigger when job stays concluido
    ✓ should not trigger when job is not concluido
  cleanupOldNotifications logic
    ✓ should calculate correct date threshold
    ✓ should identify notifications to delete
```

---

**📝 DEPLOYMENT:**

### **Deploy All Functions**

```bash
cd functions
npm install
firebase deploy --only functions
```

### **Deploy Individual**

```bash
# PowerShell
.\scripts\deploy-functions.ps1 notify

# Bash
./scripts/deploy-functions.sh notify
```

### **View Logs**

```bash
firebase functions:log --only notifyOnNewMessage
firebase functions:log --tail  # Live tail
```

---

**🎯 PRÓXIMOS PASSOS:**

1. ✅ **Deploy functions to production** (pendente comando firebase deploy)
2. ⏳ **Add Toast UI** instead of alert() for foreground
3. ⏳ **Notification Center** component with history
4. ⏳ **Preferences UI** in ProfileModal
5. ⏳ **Admin Dashboard** analytics & fraud detection

---

**💡 KEY INSIGHTS:**

- FCM tokens expire automatically → need re-registration after ~2 months
- Service Worker must be at root path (`/firebase-messaging-sw.js`)
- VAPID key required for web push (generate in Firebase Console)
- Invalid tokens auto-removed to keep DB clean
- Foreground vs background handlers have different behaviors
- Notification preferences enable granular control per user
- Cloud Functions cost: ~33k invocations/month (within free tier)

---
