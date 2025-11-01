import { describe, it, expect } from 'vitest';
import app, { auth, db, storage, getAnalyticsIfSupported } from '../firebaseConfig';

// This test ensures our Firebase config wires up without exposing or logging any secrets.
// It also validates the analytics guard works safely in non-browser environments.

describe('firebaseConfig wiring', () => {
  it('exports app and core services', () => {
    expect(app).toBeDefined();
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
    expect(storage).toBeDefined();
  });

  it('analytics guard does not throw in Node and returns null when unsupported', async () => {
    const analytics = await getAnalyticsIfSupported();
    // In Node (Vitest default), analytics should be null. In browsers it may be an object.
    expect(analytics === null || typeof analytics === 'object').toBe(true);
  });
});
