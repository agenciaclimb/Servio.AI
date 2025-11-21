import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createRequire } from 'module';
const requireCompat = createRequire(import.meta.url);
const { createApp } = requireCompat('../src/index.js');

// Minimal in-memory Firestore-like mock
function createMockDb() {
  const store = { escrows: {} };
  return {
    _store: store,
    collection(name) {
      return {
        doc(id) {
          return {
            async update(data) {
              store[name][id] = { ...(store[name][id] || {}), ...data };
            },
            async get() {
              const exists = Boolean(store[name][id]);
              return { exists, data: () => store[name][id] };
            }
          };
        }
      };
    }
  };
}

describe('Stripe Webhook (checkout.session.completed)', () => {
  let app; let db; let stripeMock; let escrowId; let paymentIntentId;
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    db = createMockDb();
    escrowId = 'escrow_123';
    paymentIntentId = 'pi_abc123';
    db._store.escrows[escrowId] = { status: 'pendente' };
    stripeMock = {
      webhooks: {
        constructEvent: () => ({
          id: 'evt_test_1',
          type: 'checkout.session.completed',
          data: { object: { metadata: { escrowId }, payment_intent: paymentIntentId } }
        })
      }
    };
    app = createApp({ db, stripe: stripeMock });
  });

  it('updates escrow to pago and sets paymentIntentId', async () => {
    const res = await request(app)
      .post('/api/stripe-webhook')
      .set('stripe-signature', 'test')
      .set('Content-Type','application/json')
      .send(Buffer.from('{}')); // raw body for express.raw
    expect(res.status).toBe(200);
    const updated = db._store.escrows[escrowId];
    expect(updated.status).toBe('pago');
    expect(updated.paymentIntentId).toBe(paymentIntentId);
  });

  it('is idempotent (second identical event does not alter data)', async () => {
    await request(app).post('/api/stripe-webhook').set('stripe-signature', 'test').set('Content-Type','application/json').send(Buffer.from('{}'));
    const first = { ...db._store.escrows[escrowId] };
    await request(app).post('/api/stripe-webhook').set('stripe-signature', 'test').set('Content-Type','application/json').send(Buffer.from('{}'));
    const second = db._store.escrows[escrowId];
    expect(second).toEqual(first);
  });
});
