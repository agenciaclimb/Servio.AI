import app, { isFirebaseMock } from '../firebaseConfig';
import { getMessaging, getToken, onMessage, isSupported, MessagePayload } from 'firebase/messaging';
import * as API from './api';

let swRegPromise: Promise<ServiceWorkerRegistration> | null = null;

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  if (!swRegPromise) {
    swRegPromise = navigator.serviceWorker.register('/firebase-messaging-sw.js');
  }
  return swRegPromise;
}

export async function getFcmToken(): Promise<string | null> {
  if (isFirebaseMock) {
    console.warn('[FCM] Firebase mock ativo. Push notifications desativadas em CI/teste.');
    return null;
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('[FCM] Messaging not supported in this browser.');
      return null;
    }
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
    if (!vapidKey) {
      console.warn('[FCM] Missing VITE_FIREBASE_VAPID_KEY env. Push will be disabled.');
      return null;
    }
    const swReg = await registerServiceWorker();
    if (!swReg) return null;
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
    return token || null;
  } catch (err) {
    console.warn('[FCM] Failed to get token:', err);
    return null;
  }
}

export async function registerUserFcmToken(userEmail: string): Promise<string | null> {
  const token = await getFcmToken();
  if (!token) return null;
  try {
    await API.updateUser(userEmail, { fcmToken: token });
    // Token registered successfully
  } catch (e) {
    // Failed to save token - will retry on next login
  }
  return token;
}

export async function onForegroundMessage(callback: (payload: MessagePayload) => void) {
  if (isFirebaseMock) return;
  const supported = await isSupported();
  if (!supported) return;
  const messaging = getMessaging(app);
  onMessage(messaging, payload => {
    callback(payload);
  });
}
