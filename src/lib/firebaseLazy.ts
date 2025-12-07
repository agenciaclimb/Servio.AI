/**
 * Lazy-loaded Firebase initializer
 * Only loads Firebase when user needs authentication
 */

import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';
import type { FirebaseStorage } from 'firebase/storage';

let firebaseInitialized = false;
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

export const initFirebase = async () => {
  if (firebaseInitialized) {
    return { auth: authInstance!, db: dbInstance! };
  }

  const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);

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
  appInstance = app;
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  firebaseInitialized = true;

  return { auth: authInstance, db: dbInstance };
};

export const getAuth = async (): Promise<Auth> => {
  if (!authInstance) {
    await initFirebase();
  }
  if (!authInstance) {
    throw new Error('Firebase auth failed to initialize');
  }
  return authInstance;
};

export const getDb = async (): Promise<Firestore> => {
  if (!dbInstance) {
    await initFirebase();
  }
  if (!dbInstance) {
    throw new Error('Firebase Firestore failed to initialize');
  }
  return dbInstance;
};

export const getStorage = async (): Promise<FirebaseStorage> => {
  if (!storageInstance) {
    if (!firebaseInitialized) {
      await initFirebase();
    }
    const { getStorage: getStorageImpl } = await import('firebase/storage');
    if (!appInstance) {
      const { initializeApp } = await import('firebase/app');
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      };
      appInstance = initializeApp(firebaseConfig);
    }
    storageInstance = getStorageImpl(appInstance);
  }
  return storageInstance;
};
