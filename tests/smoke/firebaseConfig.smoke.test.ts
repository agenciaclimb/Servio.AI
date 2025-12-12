import { describe, it, expect, vi } from 'vitest';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({ app: true })) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ auth: true })),
  GoogleAuthProvider: class GoogleAuthProvider {},
  signInWithPopup: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({ getFirestore: vi.fn(() => ({ db: true })) }));
vi.mock('firebase/storage', () => ({ getStorage: vi.fn(() => ({ storage: true })) }));
vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({ analytics: true })),
  isSupported: vi.fn(async () => true),
}));

import { auth, googleProvider } from '../../firebaseConfig';

describe('firebaseConfig.smoke', () => {
  it('firebase inicializa', () => {
    expect(auth).toBeTruthy();
  });

  it('provider de auth existe', () => {
    expect(googleProvider).toBeTruthy();
  });
});
