import { describe, test, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
const { createApp } = await import('./index');

function mockSnapshot(docs) {
  return {
    docs: docs.map(d => ({ id: d.id, data: () => ({ ...d }) })),
    empty: docs.length === 0,
  };
}

let collectionMocks;
let db;
let app;

describe('API Endpoints', () => {
  beforeEach(() => {
    collectionMocks = {};
    db = {
      collection: vi.fn((name) => collectionMocks[name] || {}),
      runTransaction: vi.fn(async () => {}),
    };
    app = createApp({ db });
  });

  describe('GET /users', () => {
    test('should return a list of users', async () => {
      const mockUsers = [{ id: 'user1', name: 'Test User' }];
      collectionMocks['users'] = { get: vi.fn().mockResolvedValue(mockSnapshot(mockUsers)) };

      const response = await request(app).get('/users');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'user1', name: 'Test User' })
      ]));
    });
  });

  test('GET / should return a welcome message', async () => {
    const response = await request(createApp({ db })).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Hello from SERVIO.AI Backend (Firestore Service)!');
  });

  describe('POST /users', () => {
    test('should create a new user and return 201', async () => {
      const setMock = vi.fn().mockResolvedValue({ writeTime: 'some-time' });
      collectionMocks['users'] = { doc: vi.fn(() => ({ set: setMock })) };

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