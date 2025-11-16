import { describe, test, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from './index'; // Import the Express app

// Mock the entire firebase-admin library
vi.mock('firebase-admin', () => {
  const get = vi.fn();
  const set = vi.fn();
  const update = vi.fn();
  const deleteFn = vi.fn();
  const doc = vi.fn(() => ({ get, set, update, delete: deleteFn }));
  const where = vi.fn(() => ({ get, limit: () => ({ get }) }));
  const collection = vi.fn(() => ({ get, doc, where }));

  return {
    initializeApp: vi.fn(),
    firestore: () => ({
      collection,
      runTransaction: vi.fn(),
    }),
  };
});

// We need to import admin after the mock is defined
const admin = await import('firebase-admin');
const db = admin.firestore();

describe('API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /users', () => {
    test('should return a list of users', async () => {
      // Mock Firestore response
      const mockUsers = [{ id: 'user1', name: 'Test User' }];
      const getMock = vi.fn().mockResolvedValue({
        docs: mockUsers.map(user => ({ id: user.id, data: () => user })),
      });
      db.collection.mockReturnValue({ get: getMock });

      const response = await request(app).get('/users');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'user1', name: 'Test User' })
      ]));
    });
  });

  test('GET / should return a welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Hello from SERVIO.AI Backend (Firestore Service)!');
  });

  describe('POST /users', () => {
    test('should create a new user and return 201', async () => {
      // Mock Firestore's set method
      const setMock = vi.fn().mockResolvedValue({ writeTime: 'some-time' });
      db.collection.mockReturnValue({ doc: () => ({ set: setMock }) });

      const newUser = { email: 'new.user@test.com', name: 'New User' };

      const response = await request(app)
        .post('/users')
        .send(newUser);

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({ message: 'User created successfully', id: newUser.email });
      expect(db.collection).toHaveBeenCalledWith('users');
      expect(setMock).toHaveBeenCalledWith(newUser);
    });
  });
});