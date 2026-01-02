/* eslint-disable no-undef */
// Firebase Messaging Service Worker (compat for simplicity)
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

// The config is injected at build via environment; for SW, we pass minimal init via placeholders
firebase.initializeApp({
  apiKey: self?.ENV_VITE_FIREBASE_API_KEY || undefined,
  authDomain: self?.ENV_VITE_FIREBASE_AUTH_DOMAIN || undefined,
  projectId: self?.ENV_VITE_FIREBASE_PROJECT_ID || undefined,
  storageBucket: self?.ENV_VITE_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: self?.ENV_VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
  appId: self?.ENV_VITE_FIREBASE_APP_ID || undefined,
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage(payload => {
  console.log('[FCM SW] Background message received:', payload);

  const title = payload.notification?.title || 'Servio.AI';
  const options = {
    body: payload.notification?.body || 'Você tem uma nova notificação',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: payload.data?.type || 'default',
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
    requireInteraction: payload.data?.type === 'commission' || payload.data?.type === 'conversion',
  };

  self.registration.showNotification(title, options);
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[FCM SW] Notification click:', event);
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Open or focus app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window with appropriate tab
      if (clients.openWindow) {
        const data = event.notification.data;
        let url = '/';

        if (data?.type === 'click' || data?.type === 'conversion') {
          url = '/prospector-dashboard?tab=links';
        } else if (data?.type === 'commission') {
          url = '/prospector-dashboard?tab=overview';
        } else if (data?.type === 'follow-up') {
          url = '/prospector-dashboard?tab=templates';
        }

        return clients.openWindow(url);
      }
    })
  );
});
