const request = require('supertest');
const { createApp } = require('../src/index.js');
const { processPendingOutreach } = require('../src/outreachScheduler.js');

// Extended Firestore mock with update & get for new collection
function createMockDb(initialData = {}) {
  const collections = {};
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
  return {
    collection(name) {
      const coll = ensureCollection(name);
      return {
        doc(id) {
          return {
            async get() { const entry = coll.get(id); return { exists: !!entry, id, data: () => entry? entry._data : undefined }; },
            async set(data) { coll.set(id, { id, _data: { ...data } }); },
            async update(patch) { if (!coll.get(id)) throw new Error('Doc does not exist'); coll.get(id)._data = { ...coll.get(id)._data, ...patch }; }
          };
        },
        async get() { const docs = Array.from(coll.values()).map(d => ({ id: d.id, data: () => d._data })); return { docs }; }
      };
    }
  };
}

describe('Prospector outreach automation', () => {
  const FOLLOW_UP_MS = 48 * 60 * 60 * 1000;
  const mockDb = createMockDb({
    prospectors: {
      'p@example.com': { name: 'Prospector', totalRecruits: 0 }
    },
    prospector_outreach: {
      // Eligible record (older than threshold)
      'provider1@example.com': {
        id: 'provider1@example.com',
        prospectorId: 'p@example.com',
        providerName: 'Provider One',
        providerEmail: 'provider1@example.com',
        providerPhone: '+5511999999999',
        emailSentAt: Date.now() - FOLLOW_UP_MS - 1000,
        followUpEligibleAt: Date.now() - 1000,
        whatsappSentAt: null,
        status: 'email_sent',
        optOut: false,
        errorHistory: []
      },
      // Not yet eligible
      'provider2@example.com': {
        id: 'provider2@example.com',
        prospectorId: 'p@example.com',
        providerName: 'Provider Two',
        providerEmail: 'provider2@example.com',
        providerPhone: '+5511888888888',
        emailSentAt: Date.now() - 1000,
        followUpEligibleAt: Date.now() + FOLLOW_UP_MS,
        whatsappSentAt: null,
        status: 'email_sent',
        optOut: false,
        errorHistory: []
      },
      // Opted out
      'provider3@example.com': {
        id: 'provider3@example.com',
        prospectorId: 'p@example.com',
        providerName: 'Provider Three',
        providerEmail: 'provider3@example.com',
        providerPhone: '+5511777777777',
        emailSentAt: Date.now() - FOLLOW_UP_MS - 1000,
        followUpEligibleAt: Date.now() - 1000,
        whatsappSentAt: null,
        status: 'email_sent',
        optOut: true,
        errorHistory: []
      }
    }
  });

  const app = createApp({ db: mockDb, stripe: null, genAI: null });

  test('POST /api/prospector/outreach creates new outreach record', async () => {
    const res = await request(app)
      .post('/api/prospector/outreach')
      .send({ prospectorId: 'p@example.com', providerEmail: 'new@example.com', providerName: 'New Provider' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('email_sent');
    // Verify stored
    const snap = await mockDb.collection('prospector_outreach').doc('new@example.com').get();
    expect(snap.exists).toBe(true);
    expect(snap.data().status).toBe('email_sent');
  });

  test('processPendingOutreach sends WhatsApp for eligible records only', async () => {
    const processed = await processPendingOutreach({ db: mockDb, sendWhatsApp: async () => ({ success: true }) });
    // provider1 should be processed, provider2 not yet, provider3 opted out
    const ids = processed.map(p => p.id);
    expect(ids).toContain('provider1@example.com');
    expect(ids).not.toContain('provider2@example.com');
    expect(ids).not.toContain('provider3@example.com');
    const updated = await mockDb.collection('prospector_outreach').doc('provider1@example.com').get();
    expect(updated.data().status).toBe('whatsapp_sent');
    expect(updated.data().whatsappSentAt).toBeTruthy();
  });

  test('opt-out prevents follow-up', async () => {
    // Create fresh eligible record then opt-out
    await mockDb.collection('prospector_outreach').doc('x@example.com').set({
      id: 'x@example.com', prospectorId: 'p@example.com', providerName: 'X', providerEmail: 'x@example.com', providerPhone: null,
      emailSentAt: Date.now() - FOLLOW_UP_MS - 2000,
      followUpEligibleAt: Date.now() - 1000,
      whatsappSentAt: null,
      status: 'email_sent', optOut: false, errorHistory: []
    });
    const optRes = await request(app).post('/api/prospector/outreach/x@example.com/optout');
    expect(optRes.status).toBe(200);
    const processed = await processPendingOutreach({ db: mockDb, sendWhatsApp: async () => ({ success: true }) });
    const ids = processed.map(p => p.id);
    expect(ids).not.toContain('x@example.com');
    const snap = await mockDb.collection('prospector_outreach').doc('x@example.com').get();
    expect(snap.data().status).toBe('opted_out');
  });
});
