// Minimal Firebase config stub for backend tests
import * as admin from 'firebase-admin';

try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
} catch (e) {
  // Ignore initialization errors in local/test environments
}

export const db = admin.firestore();
