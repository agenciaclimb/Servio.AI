import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Critical path: Auth and Firestore loaded immediately
export const auth = getAuth(app);
export const db = getFirestore(app);

// Lazy-loaded modules: Storage and Analytics
let storageInstance: FirebaseStorage | null = null;
let analyticsInstance: Analytics | null = null;

export const getStorageInstance = async (): Promise<FirebaseStorage> => {
  if (!storageInstance) {
    const { getStorage } = await import('firebase/storage');
    storageInstance = getStorage(app);
  }
  return storageInstance;
};

export const getAnalyticsIfSupported = async (): Promise<Analytics | null> => {
  if (analyticsInstance) return analyticsInstance;
  
  const { getAnalytics, isSupported } = await import('firebase/analytics');
  if (await isSupported()) {
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  }
  return null;
};

// Legacy export for backward compatibility (will lazy-load on first access)
export const storage = new Proxy({} as FirebaseStorage, {
  get: (_target, prop) => {
    console.warn('⚠️ Direct storage access deprecated. Use getStorageInstance() instead.');
    return getStorageInstance().then(s => (s as any)[prop]);
  }
});

export default app;
