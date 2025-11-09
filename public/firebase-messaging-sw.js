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
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Servio.AI';
  const options = {
    body: payload.notification?.body,
    icon: '/icons/icon-192.png',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});
