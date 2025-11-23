// Setup global para testes - Mocks do Firebase
import { vi } from 'vitest';

// Mock completo do Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ 
    docs: [],
    empty: true,
    size: 0
  })),
  getDoc: vi.fn(() => Promise.resolve({ 
    exists: () => false,
    data: () => ({})
  })),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
  doc: vi.fn(),
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
    fromDate: vi.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
  },
}));

// Mock do Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
}));

// Mock do Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(() => Promise.resolve('https://mock-url.com/file.jpg')),
}));
