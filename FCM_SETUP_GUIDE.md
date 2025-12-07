# Push Notifications (FCM) Setup Guide

## 📱 Firebase Cloud Messaging Integration

Servio.AI now supports web push notifications for real-time user engagement.

---

## 🔧 Setup Steps

### 1. Generate VAPID Key

1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Under **Web Push certificates**, click **Generate key pair**
3. Copy the generated **Key pair** (VAPID key)

### 2. Add Environment Variable

Add to `.env`:

```bash
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

### 3. Update Firebase Config

Ensure `firebaseConfig.ts` includes `messagingSenderId` and `appId`.

### 4. Service Worker Registration

The service worker (`public/firebase-messaging-sw.js`) is automatically registered when a user logs in.

---

## 🚀 How It Works

### User Login Flow

1. User logs in → `App.tsx` calls `registerUserFcmToken()`
2. Browser requests notification permission
3. FCM token generated and saved to `user.fcmToken` in Firestore
4. Foreground message handler setup

### Notification Flow

**Foreground (app open)**:

- `onForegroundMessage()` in `App.tsx` displays alert (replace with toast UI later)

**Background (app closed/minimized)**:

- Service worker receives message → shows browser notification

**Server-side**:

- Cloud Function `notifyOnNewMessage` sends FCM when new chat message arrives (if `user.fcmToken` exists)

---

## 📋 API Integration

### Update User FCM Token

Already handled automatically in `App.tsx`. Can also call manually:

```typescript
import { registerUserFcmToken } from './services/messagingService';

await registerUserFcmToken(currentUser.email);
```

### Send Notification (Backend/Cloud Function)

In `functions/index.js` (already scaffolded with TODO):

```javascript
const admin = require('firebase-admin');

const userDoc = await db.collection('users').doc(recipientId).get();
if (userDoc.exists && userDoc.data().fcmToken) {
  await admin.messaging().send({
    token: userDoc.data().fcmToken,
    notification: {
      title: 'Nova Mensagem',
      body: notification.text,
    },
    webpush: {
      fcmOptions: {
        link: 'https://servio.ai/dashboard',
      },
    },
  });
}
```

---

## 🧪 Testing

### 1. Test Permission Request

1. Run app: `npm run dev`
2. Login with any user
3. Browser prompts for notification permission → **Allow**
4. Check console for: `[FCM] Token registered for user <email>`

### 2. Test Foreground Notification

Use Firebase Console → Cloud Messaging → Send test message:

1. Add FCM token (copy from console logs)
2. Title: "Test"
3. Body: "Foreground test"
4. Send → Alert appears in app

### 3. Test Background Notification

1. Minimize browser tab
2. Send test message from console
3. Browser notification appears (system-level)

---

## 🛠️ Notification Preferences

Users can customize which notifications they receive via `user.notificationPreferences`:

```typescript
interface User {
  fcmToken?: string;
  notificationPreferences?: {
    newMessage?: boolean; // Chat messages
    jobStatusChange?: boolean; // Job status updates
    disputeEvents?: boolean; // Dispute notifications
    marketing?: boolean; // Promotional messages
  };
}
```

**Future**: Add UI in ProfileModal to toggle these preferences.

---

## 🔒 Security

- FCM tokens are user-specific and expire automatically
- Service worker runs in isolated scope (no access to main app context)
- Backend validates recipient ID before sending notifications
- Rate limiting on notification endpoints (future)

---

## 📊 Monitoring

### Check Token Registration

```bash
# Firestore console
users → [email] → fcmToken
```

### Cloud Function Logs

```bash
firebase functions:log --only notifyOnNewMessage
```

### FCM Delivery Stats

Firebase Console → Cloud Messaging → Reports

---

## 🚨 Troubleshooting

### "Permission denied"

- User needs to grant notification permission in browser settings
- Re-prompt by calling `Notification.requestPermission()`

### "Token generation failed"

- Check VAPID key is correct in `.env`
- Ensure HTTPS or localhost (FCM requires secure context)
- Verify `firebase-messaging-sw.js` is in `/public` folder

### "Service worker not registering"

- Check browser console for errors
- Ensure path is `/firebase-messaging-sw.js` (must be root)
- Clear service worker cache: DevTools → Application → Service Workers → Unregister

### "No notification received"

- Check user has valid `fcmToken` in Firestore
- Verify Cloud Function is deployed and sending to correct token
- Check FCM quota limits (free tier: 15k/month)

---

## 📚 Next Steps

1. **Deploy Cloud Functions** with FCM sending logic
2. **Add Toast UI** instead of alert() for foreground notifications
3. **Notification Center** component to show history
4. **Preferences UI** in ProfileModal
5. **Analytics** tracking for notification engagement

---

## 🔗 Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
