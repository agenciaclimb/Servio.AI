import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import admin from 'firebase-admin';

// Mock Firebase Admin SDK
vi.mock('firebase-admin', () => {
  const firestore = () => ({
    collection: (path) => ({
      doc: (docPath) => ({
        get: vi.fn(),
        set: vi.fn(),
      }),
    }),
  });
  return {
    initializeApp: vi.fn(),
    firestore: firestore,
  };
});

describe('Cloud Functions', () => {
  let myFunctions;

  beforeAll(async () => {
    // Import functions after mocks are set up
    myFunctions = await import('./index.js');
  });

  describe('notifyClientOnNewProposal', () => {
    test('should create a notification when a new proposal is created', async () => {
      // 1. Mock Data
      const proposalData = { jobId: 'job-123', providerId: 'provider@test.com' };
      const jobData = { clientId: 'client@test.com', category: 'Reparos' };

      // Mock the snapshot for the onCreate trigger
      const snap = {
        data: () => proposalData,
      };

      // 2. Mock Firestore responses
      const getMock = vi.fn().mockResolvedValue({
        exists: true,
        data: () => jobData,
      });
      const setMock = vi.fn().mockResolvedValue(true);
      admin.firestore().collection().doc.mockReturnValue({ get: getMock, set: setMock });

      // 3. Execute the function
      const wrapped = myFunctions.notifyClientOnNewProposal;
      await wrapped(snap);

      // 4. Assertions
      expect(setMock).toHaveBeenCalled();
      const notificationPayload = setMock.mock.calls[0][0];
      expect(notificationPayload.userId).toBe('client@test.com');
      expect(notificationPayload.text).toContain('Reparos');
    });
  });
});