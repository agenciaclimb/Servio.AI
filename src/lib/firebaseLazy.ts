/**
 * Lazy-loaded Firebase initializer
 * Only loads Firebase when user needs authentication
 */

let firebaseInitialized = false;
let authInstance: any = null;
let dbInstance: any = null;
let storageInstance: any = null;

export const initFirebase = async () => {
  if (firebaseInitialized) {
    return { auth: authInstance, db: dbInstance };
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
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  firebaseInitialized = true;

  return { auth: authInstance, db: dbInstance };
};

export const getAuth = async () => {
  if (!authInstance) {
    await initFirebase();
  }
  return authInstance;
};

export const getDb = async () => {
  if (!dbInstance) {
    await initFirebase();
  }
  return dbInstance;
};

export const getStorage = async () => {
  if (!storageInstance) {
    if (!firebaseInitialized) {
      await initFirebase();
    }
    const { getStorage: getStorageImpl } = await import('firebase/storage');
    const { initializeApp } = await import('firebase/app');
    
    // Get app instance
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
    storageInstance = getStorageImpl(app);
  }
  return storageInstance;
};

// For backward compatibility during migration
export { authInstance as auth, dbInstance as db };
