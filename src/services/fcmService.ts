import { getMessaging, getToken, onMessage, Messaging, MessagePayload } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { logInfo, logWarn, logError } from '../../utils/logger';

const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  'BKuUCO3Txjcom91NDIbwHDOn4VlDFsf8S_1QvcRRF5cUjw4RpKtEZj2dMs65i02IBxCv2jM4Y6tXnJDCeGAqphk';

let messagingInstance: Messaging | null = null;

/**
 * FCM Service - Firebase Cloud Messaging para notificações push
 *
 * Features:
 * - Request permission para notificações
 * - Registra FCM token no backend
 * - Listen mensagens em foreground
 * - Dispatch custom events para UI updates
 *
 * Eventos Suportados:
 * - prospector-click: Alguém clicou no link
 * - prospector-conversion: Novo recrutado
 * - prospector-commission: Nova comissão
 * - prospector-badge: Badge desbloqueado
 */

/**
 * Inicializa Firebase Messaging
 */
function getMessagingInstance(): Messaging | null {
  if (messagingInstance) return messagingInstance;

  try {
    const app = getApp();
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    logError('Failed to initialize Firebase Messaging:', error);
    return null;
  }
}

/**
 * Verifica se notificações são suportadas no browser
 */
export function isNotificationSupported(): boolean {
  const hasNotification = typeof Notification !== 'undefined' && !!Notification;
  const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const hasPushManager = typeof (globalThis as unknown as { PushManager?: unknown }).PushManager !== 'undefined';

  return hasNotification && hasServiceWorker && hasPushManager;
}

/**
 * Verifica status da permissão de notificações
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported() || typeof Notification === 'undefined' || !Notification) return 'denied';
  return Notification.permission;
}

/**
 * Solicita permissão para notificações e registra token
 */
export async function requestNotificationPermission(userId: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  if (!isNotificationSupported()) {
    return { success: false, error: 'Notifications not supported' };
  }

  try {
    // Solicitar permissão
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      return { success: false, error: 'Permission denied' };
    }

    // Obter token FCM
    const messaging = getMessagingInstance();
    if (!messaging) {
      return { success: false, error: 'Messaging not initialized' };
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (!token) {
      return { success: false, error: 'Failed to get FCM token' };
    }

    // Registrar token no backend
    const backendUrl = import.meta.env.VITE_BACKEND_API_URL || '/api';
    await fetch(`${backendUrl}/prospector/fcm-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospectorId: userId,
        fcmToken: token,
        platform: 'web',
      }),
    });

    return { success: true, token };
  } catch (error) {
    logError('Error requesting notification permission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Setup listener para mensagens FCM em foreground
 */
export function setupForegroundListener(): () => void {
  const messaging = getMessagingInstance();
  if (!messaging) {
    logWarn('FCM not initialized, skipping foreground listener');
    return () => {};
  }

  const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
    logInfo('FCM message received:', payload);

    const { notification, data } = payload;

    // Mostrar notificação browser
    if (notification?.title && notification?.body) {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/logo192.png',
        tag: data?.type || 'prospector-notification',
      });
    }

    // Dispatch custom event para atualizar UI
    if (data?.type) {
      globalThis.dispatchEvent(
        new CustomEvent(`prospector-${data.type}`, {
          detail: data,
        })
      );
    }
  });

  return unsubscribe;
}

/**
 * Hook para escutar eventos de notificação
 */
type ProspectorNotificationDetail = Record<string, unknown>;

export function useProspectorNotifications(
  onNotification: (type: string, data: ProspectorNotificationDetail) => void
) {
  if (globalThis.window === undefined) return;

  const forwardEvent = (type: string) => (e: Event) => {
    const event = e as CustomEvent<ProspectorNotificationDetail>;
    onNotification(type, event.detail ?? {});
  };

  const handleClick = forwardEvent('click');
  const handleConversion = forwardEvent('conversion');
  const handleCommission = forwardEvent('commission');
  const handleBadge = forwardEvent('badge');

  globalThis.addEventListener('prospector-click', handleClick);
  globalThis.addEventListener('prospector-conversion', handleConversion);
  globalThis.addEventListener('prospector-commission', handleCommission);
  globalThis.addEventListener('prospector-badge', handleBadge);

  // Cleanup
  return (): void => {
    globalThis.removeEventListener('prospector-click', handleClick);
    globalThis.removeEventListener('prospector-conversion', handleConversion);
    globalThis.removeEventListener('prospector-commission', handleCommission);
    globalThis.removeEventListener('prospector-badge', handleBadge);
  };
}

/**
 * Revoga permissão de notificações (unregister token)
 */
export async function revokeNotificationPermission(userId: string): Promise<void> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_API_URL || '/api';
    await fetch(`${backendUrl}/prospector/fcm-token`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospectorId: userId }),
    });
  } catch (error) {
    logError('Error revoking FCM token:', error);
  }
}

export default {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  setupForegroundListener,
  revokeNotificationPermission,
};
