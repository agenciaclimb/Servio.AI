const request = require('supertest');
const { createApp } = require('../src/index.js');

// Minimal in-memory Firestore mock covering methods used by endpoints
function createMockDb(initialData = {}) {
  const collections = {};
  // Seed initial data
  Object.entries(initialData).forEach(([coll, docs]) => {
    collections[coll] = new Map();
    Object.entries(docs).forEach(([id, data]) => {
      collections[coll].set(id, {
        id,
        _data: { ...data },
        ref: {
          update: patch => {
            collections[coll].get(id)._data = { ...collections[coll].get(id)._data, ...patch };
          },
        },
      });
    });
  });
  function ensureCollection(name) {
    if (!collections[name]) collections[name] = new Map();
    return collections[name];
  }
  return {
    collection(name) {
      const coll = ensureCollection(name);
      return {
        doc(id) {
          return {
            async get() {
              const entry = coll.get(id);
              return {
                exists: !!entry,
                id,
                data: () => (entry ? entry._data : undefined),
              };
            },
            async set(data) {
              coll.set(id, {
                id,
                _data: { ...data },
                ref: {
                  update: patch => {
                    coll.get(id)._data = { ...coll.get(id)._data, ...patch };
                  },
                },
              });
            },
            async update(patch) {
              if (!coll.get(id)) throw new Error('Doc does not exist');
              coll.get(id)._data = { ...coll.get(id)._data, ...patch };
            },
          };
        },
        async get() {
          const docs = Array.from(coll.values()).map(d => ({ id: d.id, data: () => d._data }));
          return { docs };
        },
      };
    },
  };
}

describe('Prospector Phase 1 Endpoints', () => {
  const mockDb = createMockDb({
    prospectors: {
      'a@example.com': {
        name: 'Alice',
        totalRecruits: 12,
        activeRecruits: 10,
        totalCommissionsEarned: 120,
      },
      'b@example.com': {
        name: 'Bob',
        totalRecruits: 4,
        activeRecruits: 4,
        totalCommissionsEarned: 40,
      },
      'c@example.com': {
        name: 'Carol',
        totalRecruits: 30,
        activeRecruits: 28,
        totalCommissionsEarned: 450,
      },
    },
  });
  const app = createApp({ db: mockDb, stripe: null, genAI: null });

  test('GET /api/prospector/stats returns correct badge and progress', async () => {
    const res = await request(app)
      .get('/api/prospector/stats')
      .query({ prospectorId: 'a@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.currentBadge).toBe('Ouro');
    expect(res.body.nextBadge).toBe('Platina');
    // Progress from 10 to 25 with 12 recruits: (12-10)/(25-10)=0.1333 -> 13%
    expect(res.body.progressToNextBadge).toBe(13);
    expect(res.body.averageCommissionPerRecruit).toBe(10);
  });

  test('GET /api/prospector/stats handles missing prospectorId', async () => {
    const res = await request(app).get('/api/prospector/stats');
    expect(res.status).toBe(400);
  });

  test('GET /api/prospector/stats not found', async () => {
    const res = await request(app)
      .get('/api/prospector/stats')
      .query({ prospectorId: 'x@example.com' });
    expect(res.status).toBe(404);
  });

  test('GET /api/prospectors/leaderboard default sort commissions', async () => {
    const res = await request(app).get('/api/prospectors/leaderboard');
    expect(res.status).toBe(200);
    const idsOrdered = res.body.results.map(r => r.prospectorId);
    expect(idsOrdered).toEqual(['c@example.com', 'a@example.com', 'b@example.com']);
    expect(res.body.results[0].rank).toBe(1);
  });

  test('GET /api/prospectors/leaderboard sort=recruits', async () => {
    const res = await request(app).get('/api/prospectors/leaderboard').query({ sort: 'recruits' });
    expect(res.status).toBe(200);
    const idsOrdered = res.body.results.map(r => r.prospectorId);
    expect(idsOrdered).toEqual(['c@example.com', 'a@example.com', 'b@example.com']);
  });
});
