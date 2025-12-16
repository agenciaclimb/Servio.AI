import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { Analytics } from 'firebase/analytics';
import type { FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const mockConfig = {
  apiKey: 'mock-api-key',
  authDomain: 'mock.firebaseapp.com',
  projectId: 'mock-project',
  storageBucket: 'mock.appspot.com',
  messagingSenderId: 'mock-sender',
  appId: '1:mock:web:mock',
  measurementId: 'mock-measurement-id',
};

export const isFirebaseMock =
  Object.values(firebaseConfig).some(value => !value) ||
  import.meta.env.VITE_USE_FIREBASE_MOCK === 'true' ||
  import.meta.env.MODE === 'test';

const noopAsync = async () => null as unknown as never;
const noopUnsubscribe = () => undefined;

const app: FirebaseApp = initializeApp(isFirebaseMock ? mockConfig : firebaseConfig);

let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

if (isFirebaseMock) {
  console.warn('[firebase] Usando mocks porque a configuração está ausente ou desativada.');

  auth = {
    currentUser: null,
    onAuthStateChanged: () => noopUnsubscribe,
    signOut: noopAsync,
  } as unknown as ReturnType<typeof getAuth>;
  db = {} as ReturnType<typeof getFirestore>;
} else {
  auth = getAuth(app);
  db = getFirestore(app);
}

// Critical path: Auth and Firestore loaded immediately
export { app, auth, db };

// Google Auth provider helper
export const googleProvider = isFirebaseMock
  ? ({} as GoogleAuthProvider)
  : new GoogleAuthProvider();

export const signInWithGoogle = () =>
  isFirebaseMock
    ? Promise.reject(new Error('Google login indisponível em modo mock.'))
    : signInWithPopup(auth, googleProvider);

// Lazy-loaded modules: Storage and Analytics
let storageInstance: FirebaseStorage | null = null;
let analyticsInstance: Analytics | null = null;

export const getStorageInstance = async (): Promise<FirebaseStorage> => {
  if (isFirebaseMock) {
    return ({} as FirebaseStorage);
  }

  if (!storageInstance) {
    const { getStorage } = await import('firebase/storage');
    storageInstance = getStorage(app);
  }
  return storageInstance;
};

export const getAnalyticsIfSupported = async (): Promise<Analytics | null> => {
  if (isFirebaseMock) return null;

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
  get: (_target, prop: string | symbol) => {
    if (isFirebaseMock) {
      console.warn('⚠️ Storage mock ativo: operação ignorada.');
      return undefined;
    }
    console.warn('⚠️ Direct storage access deprecated. Use getStorageInstance() instead.');
    return getStorageInstance().then(s => Reflect.get(s as object, prop));
  },
});

export default app;
