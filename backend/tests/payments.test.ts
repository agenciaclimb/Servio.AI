import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';

// Mocks
const stripeTransfersCreate = vi.fn();
const stripePaymentIntentsRetrieve = vi.fn();
const stripeCheckoutSessionsCreate = vi.fn();

const mockStripe = {
  transfers: { create: stripeTransfersCreate },
  paymentIntents: { retrieve: stripePaymentIntentsRetrieve },
  checkout: { sessions: { create: stripeCheckoutSessionsCreate } },
};

// Minimal Firestore mock shape com suporte a where() encadeado
function makeDb() {
  const data: Record<string, any[]> = {
    escrows: [],
    jobs: [],
    users: [],
  };

  class Query {
    name: string;
    filters: Array<{ field: string; value: any }> = [];
    _limit?: number;
    constructor(name: string) {
      this.name = name;
    }
    where(field: string, _op: string, value: any) {
      this.filters.push({ field, value });
      return this;
    }
    limit(n: number) {
      this._limit = n;
      return this;
    }
    async get() {
      let docs = (data[this.name] || []).filter((d) =>
        this.filters.every((f) => d[f.field] === f.value)
      );
      if (typeof this._limit === 'number') {
        docs = docs.slice(0, this._limit);
      }
      const mapped = docs.map((d) => ({
        id: d.id,
        data: () => d,
        ref: {
          update: async (partial: any) => {
            const idx = data[this.name].findIndex((x) => x.id === d.id);
            if (idx >= 0) data[this.name][idx] = { ...data[this.name][idx], ...partial };
          },
        },
      }));
      return { empty: mapped.length === 0, docs: mapped };
    }
  }

  const collection = (name: string) => ({
    doc: (id?: string) => {
      const _id = id || Math.random().toString(36).slice(2);
      return {
        id: _id,
        set: async (val: any) => {
          const idx = data[name].findIndex((d: any) => d.id === _id);
          if (idx >= 0) data[name][idx] = val; else data[name].push({ id: _id, ...val });
        },
        get: async () => {
          const found = data[name].find((d: any) => d.id === _id);
          return { exists: !!found, data: () => found };
        },
        update: async (partial: any) => {
          const idx = data[name].findIndex((d: any) => d.id === _id);
          if (idx >= 0) data[name][idx] = { ...data[name][idx], ...partial };
        },
        ref: { update: async (partial: any) => {
          const idx = data[name].findIndex((d: any) => d.id === _id);
          if (idx >= 0) data[name][idx] = { ...data[name][idx], ...partial };
        }},
      };
    },
    where: (field: string, _op: string, value: any) => new Query(name).where(field, _op, value),
    get: async () => ({ docs: (data[name] || []).map((d) => ({ id: d.id, data: () => d })) }),
  });

  return {
    _data: data,
    collection,
    runTransaction: async (fn: any) => fn({ update: () => {} }),
  };
}

describe('Payments/Stripe integration (mocked)', () => {
  let db: any;
  let app: any;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeDb();
    app = createApp({ db, stripe: mockStripe as any });
  });

  it('creates checkout session and escrow', async () => {
    // Arrange baseline
    const client = { email: 'cli@test.com' };
    const provider = { email: 'pro@test.com', stripeAccountId: 'acct_123' };
    await db.collection('users').doc(client.email).set(client);
    await db.collection('users').doc(provider.email).set(provider);

    // Seed job document requerido pelo endpoint
    const job = {
      id: 'job1',
      clientId: client.email,
      providerId: provider.email,
      category: 'eletrica',
      description: 'Instalação de tomada',
    };
    await db.collection('jobs').doc(job.id).set(job);

    stripeCheckoutSessionsCreate.mockResolvedValue({ id: 'cs_test_1', url: 'https://checkout.stripe.com/test' });

    const body = { job, amount: 123.45 };

    // Act
    const res = await request(app).post('/create-checkout-session').send(body);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('cs_test_1');
    expect(db._data.escrows.length).toBe(1);
    expect(stripeCheckoutSessionsCreate).toHaveBeenCalled();
  });

  it('release-payment happy path', async () => {
    // Seed data
    await db.collection('users').doc('pro@test.com').set({ email: 'pro@test.com', stripeAccountId: 'acct_123', verificationStatus: 'verificado', headline: 'Pro', });
    await db.collection('users').doc('cli@test.com').set({ email: 'cli@test.com' });
    await db.collection('jobs').doc('job1').set({ id: 'job1', clientId: 'cli@test.com', providerId: 'pro@test.com', price: 200, status: 'em_progresso' });
    // Seed one completed job to exercise stats query
    await db.collection('jobs').doc('job_prev').set({ id: 'job_prev', clientId: 'cli@test.com', providerId: 'pro@test.com', price: 100, status: 'concluido', review: { rating: 5 } });
    await db.collection('escrows').doc('esc1').set({ id: 'esc1', jobId: 'job1', amount: 200, status: 'pago', paymentIntentId: 'pi_123', providerId: 'pro@test.com' });

    stripePaymentIntentsRetrieve.mockResolvedValue({ latest_charge: 'ch_123' });
    stripeTransfersCreate.mockResolvedValue({ id: 'tr_123' });

    // Fake auth middleware by injecting req.user via supertest? Our createApp currently doesn't set req.user.
    // Como workaround para este teste, vamos simular que o backend confia no clientId (excluir verificação). Caso contrário, ajustar app para aceitar header X-User.

    // Act
    const res = await request(app)
      .post('/jobs/job1/release-payment')
      .set('x-user-email', 'cli@test.com')
      .send({});

    // Assert estrito
    expect(res.status).toBe(200);
    const jobAfter = db._data.jobs.find((j: any) => j.id === 'job1');
    const escrowAfter = db._data.escrows.find((e: any) => e.id === 'esc1');
    expect(jobAfter.status).toBe('concluido');
    expect(escrowAfter.status).toBe('liberado');
    expect(stripeTransfersCreate).toHaveBeenCalled();
  });

  it('webhook checkout.session.completed marca escrow como pago', async () => {
    // Arrange
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    // Mock stripe.webhooks.constructEvent
    const webhooksConstructEvent = vi.fn(() => ({
      type: 'checkout.session.completed',
      data: { object: { metadata: { escrowId: 'esc1' }, payment_intent: 'pi_000' } },
    }));
    const stripeWithWebhook = {
      ...mockStripe,
      webhooks: { constructEvent: webhooksConstructEvent },
    } as any;

    db = makeDb();
    // seed escrow
    await db.collection('escrows').doc('esc1').set({ id: 'esc1', jobId: 'job1', status: 'em_espera' });

    app = createApp({ db, stripe: stripeWithWebhook });

    // Act: enviar corpo bruto (string) e header de assinatura
    const res = await request(app)
      .post('/api/stripe-webhook')
      .set('stripe-signature', 'sig_test')
      .set('content-type', 'application/json')
      .send('{}');

    // Assert
    expect(res.status).toBe(200);
    const escrowAfter = db._data.escrows.find((e: any) => e.id === 'esc1');
    expect(escrowAfter.status).toBe('pago');
    expect(escrowAfter.paymentIntentId).toBe('pi_000');
    expect(webhooksConstructEvent).toHaveBeenCalled();
  });

  it('release-payment retorna 404 quando escrow não existe', async () => {
    await db.collection('users').doc('cli@test.com').set({ email: 'cli@test.com' });
    await db.collection('users').doc('pro@test.com').set({ email: 'pro@test.com', stripeAccountId: 'acct_123' });
    await db.collection('jobs').doc('job1').set({ id: 'job1', clientId: 'cli@test.com', providerId: 'pro@test.com', price: 100, status: 'em_progresso' });

    const res = await request(app)
      .post('/jobs/job1/release-payment')
      .set('x-user-email', 'cli@test.com')
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/não encontrado/i);
  });

  it('release-payment retorna 400 quando status do escrow não é pago', async () => {
    await db.collection('users').doc('cli@test.com').set({ email: 'cli@test.com' });
    await db.collection('users').doc('pro@test.com').set({ email: 'pro@test.com', stripeAccountId: 'acct_123' });
    await db.collection('jobs').doc('job1').set({ id: 'job1', clientId: 'cli@test.com', providerId: 'pro@test.com', price: 100, status: 'em_progresso' });
    await db.collection('escrows').doc('esc1').set({ id: 'esc1', jobId: 'job1', amount: 100, status: 'em_espera', providerId: 'pro@test.com' });

    const res = await request(app)
      .post('/jobs/job1/release-payment')
      .set('x-user-email', 'cli@test.com')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Status atual: em_espera/);
  });

  it('release-payment retorna 400 quando provider não possui stripeAccountId', async () => {
    await db.collection('users').doc('cli@test.com').set({ email: 'cli@test.com' });
    // provider sem stripeAccountId
    await db.collection('users').doc('pro@test.com').set({ email: 'pro@test.com' });
    await db.collection('jobs').doc('job1').set({ id: 'job1', clientId: 'cli@test.com', providerId: 'pro@test.com', price: 100, status: 'em_progresso' });
    await db.collection('escrows').doc('esc1').set({ id: 'esc1', jobId: 'job1', amount: 100, status: 'pago', paymentIntentId: 'pi_123', providerId: 'pro@test.com' });

    // stripe retrieve não deve ser chamado; mas mock resolve para segurança
    stripePaymentIntentsRetrieve.mockResolvedValue({ latest_charge: 'ch_123' });

    const res = await request(app)
      .post('/jobs/job1/release-payment')
      .set('x-user-email', 'cli@test.com')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/não possui uma conta de pagamento configurada/i);
  });

  it('release-payment retorna 400 quando escrow sem paymentIntentId', async () => {
    await db.collection('users').doc('cli@test.com').set({ email: 'cli@test.com' });
    await db.collection('users').doc('pro@test.com').set({ email: 'pro@test.com', stripeAccountId: 'acct_123' });
    await db.collection('jobs').doc('job1').set({ id: 'job1', clientId: 'cli@test.com', providerId: 'pro@test.com', price: 100, status: 'em_progresso' });
    await db.collection('escrows').doc('esc1').set({ id: 'esc1', jobId: 'job1', amount: 100, status: 'pago', providerId: 'pro@test.com' });

    const res = await request(app)
      .post('/jobs/job1/release-payment')
      .set('x-user-email', 'cli@test.com')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/intenção de pagamento não encontrado/i);
  });

  it('release-payment retorna 403 quando usuário não é o cliente do job', async () => {
    await db.collection('users').doc('cli@test.com').set({ email: 'cli@test.com' });
    await db.collection('users').doc('outro@test.com').set({ email: 'outro@test.com' });
    await db.collection('users').doc('pro@test.com').set({ email: 'pro@test.com', stripeAccountId: 'acct_123' });
    await db.collection('jobs').doc('job1').set({ id: 'job1', clientId: 'cli@test.com', providerId: 'pro@test.com', price: 100, status: 'em_progresso' });
    await db.collection('escrows').doc('esc1').set({ id: 'esc1', jobId: 'job1', amount: 100, status: 'pago', paymentIntentId: 'pi_123', providerId: 'pro@test.com' });

    const res = await request(app)
      .post('/jobs/job1/release-payment')
      .set('x-user-email', 'outro@test.com')
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Only the client can release the payment/i);
  });
});
