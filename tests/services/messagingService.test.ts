import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFcmToken, registerUserFcmToken, onForegroundMessage } from '../../services/messagingService';
import * as firebaseApp from '../../firebaseConfig';
import * as messaging from 'firebase/messaging';
import * as API from '../../services/api';

vi.mock('../../firebaseConfig');
vi.mock('firebase/messaging');
vi.mock('../../services/api');

describe('messagingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - mocking navigator.serviceWorker
    global.navigator.serviceWorker = {
      register: vi.fn().mockResolvedValue({ active: true }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFcmToken', () => {
    it('should return null when Firebase is in mock mode', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = true;

      const token = await getFcmToken();

      expect(token).toBeNull();
    });

    it('should return null when messaging is not supported', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = false;
      vi.mocked(messaging.isSupported).mockResolvedValue(false);

      const token = await getFcmToken();

      expect(token).toBeNull();
    });

    it('should return null when VAPID key is missing', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = false;
      vi.mocked(messaging.isSupported).mockResolvedValue(true);
      // @ts-expect-error - mocking import.meta.env
      import.meta.env.VITE_FIREBASE_VAPID_KEY = undefined;

      const token = await getFcmToken();

      expect(token).toBeNull();
    });

    it('should return null when service worker registration fails', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = false;
      vi.mocked(messaging.isSupported).mockResolvedValue(true);
      // @ts-expect-error - mocking import.meta.env
      import.meta.env.VITE_FIREBASE_VAPID_KEY = 'test-vapid-key';
      // @ts-expect-error - mocking navigator.serviceWorker
      global.navigator.serviceWorker = undefined;

      const token = await getFcmToken();

      expect(token).toBeNull();
    });

    it('should return FCM token when all conditions are met', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = false;
      vi.mocked(messaging.isSupported).mockResolvedValue(true);
      // @ts-expect-error - mocking import.meta.env
      import.meta.env.VITE_FIREBASE_VAPID_KEY = 'test-vapid-key';
      vi.mocked(messaging.getMessaging).mockReturnValue({} as any);
      vi.mocked(messaging.getToken).mockResolvedValue('test-fcm-token');

      const token = await getFcmToken();

      expect(token).toBe('test-fcm-token');
      expect(messaging.getToken).toHaveBeenCalled();
    });

    it('should return null when getToken fails', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = false;
      vi.mocked(messaging.isSupported).mockResolvedValue(true);
      // @ts-expect-error - mocking import.meta.env
      import.meta.env.VITE_FIREBASE_VAPID_KEY = 'test-vapid-key';
      vi.mocked(messaging.getMessaging).mockReturnValue({} as any);
      vi.mocked(messaging.getToken).mockRejectedValue(new Error('Token error'));

      const token = await getFcmToken();

      expect(token).toBeNull();
    });

    it('should return null when getToken returns empty string', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = false;
      vi.mocked(messaging.isSupported).mockResolvedValue(true);
      // @ts-expect-error - mocking import.meta.env
      import.meta.env.VITE_FIREBASE_VAPID_KEY = 'test-vapid-key';
      vi.mocked(messaging.getMessaging).mockReturnValue({} as any);
      vi.mocked(messaging.getToken).mockResolvedValue('');

      const token = await getFcmToken();

      expect(token).toBeNull();
    });
  });

  describe('registerUserFcmToken', () => {
    it('should return null when getFcmToken returns null', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = true;

      const result = await registerUserFcmToken('user@test.com');

      expect(result).toBeNull();
      expect(API.updateUser).not.toHaveBeenCalled();
    });

    it('should register token with API and return it', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = false;
      vi.mocked(messaging.isSupported).mockResolvedValue(true);
      // @ts-expect-error - mocking import.meta.env
      import.meta.env.VITE_FIREBASE_VAPID_KEY = 'test-vapid-key';
      vi.mocked(messaging.getMessaging).mockReturnValue({} as any);
      vi.mocked(messaging.getToken).mockResolvedValue('test-token');
      vi.mocked(API.updateUser).mockResolvedValue(undefined);

      const result = await registerUserFcmToken('user@test.com');

      expect(result).toBe('test-token');
      expect(API.updateUser).toHaveBeenCalledWith('user@test.com', { fcmToken: 'test-token' });
    });

    it('should return token even when API update fails', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = false;
      vi.mocked(messaging.isSupported).mockResolvedValue(true);
      // @ts-expect-error - mocking import.meta.env
      import.meta.env.VITE_FIREBASE_VAPID_KEY = 'test-vapid-key';
      vi.mocked(messaging.getMessaging).mockReturnValue({} as any);
      vi.mocked(messaging.getToken).mockResolvedValue('test-token');
      vi.mocked(API.updateUser).mockRejectedValue(new Error('API error'));

      const result = await registerUserFcmToken('user@test.com');

      expect(result).toBe('test-token');
    });
  });

  describe('onForegroundMessage', () => {
    it('should not register callback when Firebase is in mock mode', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = true;
      const callback = vi.fn();

      await onForegroundMessage(callback);

      expect(messaging.onMessage).not.toHaveBeenCalled();
    });

    it('should not register callback when messaging is not supported', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = false;
      vi.mocked(messaging.isSupported).mockResolvedValue(false);
      const callback = vi.fn();

      await onForegroundMessage(callback);

      expect(messaging.onMessage).not.toHaveBeenCalled();
    });

    it('should register callback when messaging is supported', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = false;
      vi.mocked(messaging.isSupported).mockResolvedValue(true);
      vi.mocked(messaging.getMessaging).mockReturnValue({} as any);
      const callback = vi.fn();

      await onForegroundMessage(callback);

      expect(messaging.getMessaging).toHaveBeenCalled();
      expect(messaging.onMessage).toHaveBeenCalled();
    });

    it('should call callback when message is received', async () => {
      vi.mocked(firebaseApp).isFirebaseMock = false;
      vi.mocked(messaging.isSupported).mockResolvedValue(true);
      vi.mocked(messaging.getMessaging).mockReturnValue({} as any);
      
      const mockPayload = { notification: { title: 'Test', body: 'Message' } };
      vi.mocked(messaging.onMessage).mockImplementation((_, callback) => {
        callback(mockPayload as any);
        return vi.fn();
      });

      const callback = vi.fn();
      await onForegroundMessage(callback);

      expect(callback).toHaveBeenCalledWith(mockPayload);
    });
  });
});
