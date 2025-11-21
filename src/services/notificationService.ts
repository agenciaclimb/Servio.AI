/**
 * Firebase Cloud Messaging Service
 * 
 * Manages push notifications for prospectors:
 * - Click notifications (when prospect clicks referral link)
 * - Conversion notifications (when prospect registers)
 * - Commission notifications (when commission is generated)
 * - Follow-up reminders (pending actions)
 */

import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// VAPID key for web push (generate at Firebase Console > Project Settings > Cloud Messaging)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export interface NotificationPreferences {
  prospectorId: string;
  enabled: boolean;
  clickNotifications: boolean;
  conversionNotifications: boolean;
  commissionNotifications: boolean;
  followUpReminders: boolean;
  email: string;
  fcmToken?: string;
  lastUpdated: Date;
}

export interface PushNotification {
  id: string;
  prospectorId: string;
  type: 'click' | 'conversion' | 'commission' | 'follow-up';
  title: string;
  body: string;
  data?: Record<string, string>;
  sentAt: Date;
  read: boolean;
  clickedAt?: Date;
}

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(prospectorId: string): Promise<string | null> {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('[FCM] Browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied');
      return null;
    }

    // Get FCM token
    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (!token) {
      console.warn('[FCM] Failed to get FCM token');
      return null;
    }

    // Save token to Firestore
    await updateFCMToken(prospectorId, token);

    return token;
  } catch (error) {
    console.error('[FCM] Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Update FCM token in Firestore
 */
export async function updateFCMToken(prospectorId: string, token: string): Promise<void> {
  const prefRef = doc(db, 'notification_preferences', prospectorId);
  await setDoc(
    prefRef,
    {
      fcmToken: token,
      lastUpdated: new Date(),
    },
    { merge: true }
  );
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(prospectorId: string): Promise<NotificationPreferences | null> {
  const prefDoc = await getDoc(doc(db, 'notification_preferences', prospectorId));
  if (!prefDoc.exists()) return null;

  return {
    prospectorId,
    ...prefDoc.data(),
    lastUpdated: prefDoc.data().lastUpdated?.toDate(),
  } as NotificationPreferences;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  prospectorId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  const prefRef = doc(db, 'notification_preferences', prospectorId);
  await setDoc(
    prefRef,
    {
      ...preferences,
      prospectorId,
      lastUpdated: new Date(),
    },
    { merge: true }
  );
}

/**
 * Send notification (server-side via Cloud Function or backend API)
 * This is a helper to create notification data; actual sending happens server-side
 */
export async function createNotification(
  prospectorId: string,
  type: PushNotification['type'],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<string> {
  // Check if prospector has this notification type enabled
  const prefs = await getNotificationPreferences(prospectorId);
  if (!prefs || !prefs.enabled) {
    throw new Error('Notifications disabled for this user');
  }

  // Check specific notification type
  const typeEnabled = {
    click: prefs.clickNotifications,
    conversion: prefs.conversionNotifications,
    commission: prefs.commissionNotifications,
    'follow-up': prefs.followUpReminders,
  };

  if (!typeEnabled[type]) {
    throw new Error(`Notification type ${type} disabled for this user`);
  }

  // Create notification record
  const notificationRef = doc(collection(db, 'notifications'));
  const notification: PushNotification = {
    id: notificationRef.id,
    prospectorId,
    type,
    title,
    body,
    data,
    sentAt: new Date(),
    read: false,
  };

  await setDoc(notificationRef, notification);

  return notificationRef.id;
}

/**
 * Listen for foreground messages
 */
export function setupForegroundMessageListener(
  onNotification: (payload: MessagePayload) => void
): () => void {
  const messaging = getMessaging();
  return onMessage(messaging, (payload) => {
    // Handle foreground notification
    if (payload.notification) {
      // Show browser notification
      new Notification(payload.notification.title || 'Servio.AI', {
        body: payload.notification.body,
        icon: '/logo.png',
        badge: '/badge.png',
        data: payload.data,
      });
    }

    onNotification(payload);
  });
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(prospectorId: string): Promise<PushNotification[]> {
  const q = query(
    collection(db, 'notifications'),
    where('prospectorId', '==', prospectorId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    sentAt: doc.data().sentAt?.toDate(),
    clickedAt: doc.data().clickedAt?.toDate(),
  })) as PushNotification[];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notificationId), {
    read: true,
    clickedAt: new Date(),
  });
}

/**
 * Get notification count
 */
export async function getUnreadNotificationCount(prospectorId: string): Promise<number> {
  const notifications = await getUnreadNotifications(prospectorId);
  return notifications.length;
}

/**
 * Helper functions for specific notification types
 */

export async function sendClickNotification(
  prospectorId: string,
  prospectName: string,
  source: string
): Promise<string> {
  return createNotification(
    prospectorId,
    'click',
    '🎯 Novo Clique no Seu Link!',
    `${prospectName} clicou no seu link de indicação via ${source}`,
    {
      type: 'click',
      prospectName,
      source,
    }
  );
}

export async function sendConversionNotification(
  prospectorId: string,
  providerName: string,
  category: string
): Promise<string> {
  return createNotification(
    prospectorId,
    'conversion',
    '🎉 Conversão Confirmada!',
    `${providerName} se cadastrou como ${category} através do seu link!`,
    {
      type: 'conversion',
      providerName,
      category,
    }
  );
}

export async function sendCommissionNotification(
  prospectorId: string,
  amount: number,
  providerName: string
): Promise<string> {
  return createNotification(
    prospectorId,
    'commission',
    '💰 Nova Comissão Gerada!',
    `Você ganhou R$ ${amount.toFixed(2)} do job completado por ${providerName}`,
    {
      type: 'commission',
      amount: amount.toString(),
      providerName,
    }
  );
}

export async function sendFollowUpReminder(
  prospectorId: string,
  prospectName: string,
  daysAgo: number
): Promise<string> {
  return createNotification(
    prospectorId,
    'follow-up',
    '📞 Follow-up Pendente',
    `Lembre-se de fazer follow-up com ${prospectName} (contato há ${daysAgo} dias)`,
    {
      type: 'follow-up',
      prospectName,
      daysAgo: daysAgo.toString(),
    }
  );
}
