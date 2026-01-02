console.log('DEBUG: Custom firebase-admin mock loaded');
const mockFirestore = {
  collection: () => mockFirestore,
  doc: () => mockFirestore,
  get: () => Promise.resolve({ exists: true, data: () => ({}) }),
  set: () => Promise.resolve(),
  add: () => Promise.resolve({ id: 'mock_id' }),
  update: () => Promise.resolve(),
  delete: () => Promise.resolve(),
  where: () => mockFirestore,
  orderBy: () => mockFirestore,
  limit: () => mockFirestore,
  startAfter: () => mockFirestore,
  limitToLast: () => mockFirestore,
};

const mockAdmin = {
  initializeApp: () => {},
  firestore: () => mockFirestore,
  messaging: () => ({ send: () => Promise.resolve() }),
  auth: () => ({
    verifyIdToken: () => Promise.resolve({ uid: 'test_user' }),
    getUser: () => Promise.resolve({ uid: 'test_user', email: 'test@example.com' }),
  }),
  storage: () => ({ bucket: () => ({ file: () => ({ save: () => Promise.resolve() }) }) }),
  credential: {
    cert: () => {},
  },
};

// Mock Timestamp separately to attach to firestore
mockFirestore.Timestamp = {
  now: () => ({ toDate: () => new Date() }),
  fromDate: date => ({ toDate: () => date }),
  fromMillis: ms => ({ toDate: () => new Date(ms) }),
};
mockAdmin.firestore.Timestamp = mockFirestore.Timestamp;

module.exports = mockAdmin;
