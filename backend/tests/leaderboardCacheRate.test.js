const request = require('supertest');
const { createApp } = require('../src/index.js');

function createMockDb(initialData = {}) {
  const collections = {};
  let prospectorsGetCount = 0;
  Object.entries(initialData).forEach(([coll, docs]) => {
    collections[coll] = new Map();
    Object.entries(docs).forEach(([id, data]) => {
      collections[coll].set(id, { id, _data: { ...data } });
    });
  });
  function ensureCollection(name) {
    if (!collections[name]) collections[name] = new Map();
    return collections[name];
  }
  const db = {
    collection(name) {
      const coll = ensureCollection(name);
      return {
        async get() {
          if (name === 'prospectors') prospectorsGetCount += 1;
          const docs = Array.from(coll.values()).map(d => ({ id: d.id, data: () => d._data }));
          return { docs };
        }
      };
    },
    _metrics: {
      getProspectorsCalls: () => prospectorsGetCount
    }
  };
  return db;
}

describe('Leaderboard cache & rate limiting', () => {
  const mockDb = createMockDb({
    prospectors: {
      'a@example.com': { name: 'Alice', totalRecruits: 12, totalCommissionsEarned: 120 },
      'b@example.com': { name: 'Bob', totalRecruits: 4, totalCommissionsEarned: 40 },
      'c@example.com': { name: 'Carol', totalRecruits: 30, totalCommissionsEarned: 450 }
    }
  });
  const app = createApp({ db: mockDb, stripe: null, genAI: null });

  test('first request fetches fresh data, second uses cache (no extra DB call)', async () => {
    const first = await request(app).get('/api/prospectors/leaderboard');
    expect(first.status).toBe(200);
    expect(first.body.cached).toBe(false);
    const callsAfterFirst = mockDb._metrics.getProspectorsCalls();
    const second = await request(app).get('/api/prospectors/leaderboard');
    expect(second.status).toBe(200);
    expect(second.body.cached).toBe(true);
    const callsAfterSecond = mockDb._metrics.getProspectorsCalls();
    // DB get should not increase on cached response
    expect(callsAfterSecond).toBe(callsAfterFirst);
  });

  test('forceRefresh bypasses cache and increments DB calls', async () => {
    const beforeForce = mockDb._metrics.getProspectorsCalls();
    const res = await request(app).get('/api/prospectors/leaderboard').query({ forceRefresh: '1' });
    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(false);
    const afterForce = mockDb._metrics.getProspectorsCalls();
    expect(afterForce).toBeGreaterThan(beforeForce);
  });

  test('rate limiting triggers 429 after threshold exceeded', async () => {
    const limitedDb = createMockDb({ prospectors: { 'x@example.com': { totalCommissionsEarned: 10 } } });
    const limitedApp = createApp({ db: limitedDb, stripe: null, genAI: null, leaderboardRateConfig: { limit: 3, windowMs: 1000 } });
    const r1 = await request(limitedApp).get('/api/prospectors/leaderboard');
    const r2 = await request(limitedApp).get('/api/prospectors/leaderboard');
    const r3 = await request(limitedApp).get('/api/prospectors/leaderboard');
    const r4 = await request(limitedApp).get('/api/prospectors/leaderboard');
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(200);
    expect(r4.status).toBe(429);
    expect(r4.body.error).toBe('Rate limit exceeded');
  });
});
