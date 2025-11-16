import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processScheduledJobs } from '../src/index.js';

// Reuse a lightweight Firestore-like mock similar to payments.test.ts
function makeDb() {
  const data: Record<string, any[]> = {
    proposals: [],
    jobs: [],
  };

  const collection = (name: string) => ({
    doc: (id?: string) => {
      const _id = id || Math.random().toString(36).slice(2);
      return {
        id: _id,
        update: async (partial: any) => {
          const idx = data[name].findIndex((d) => d.id === _id);
          if (idx >= 0) data[name][idx] = { ...data[name][idx], ...partial };
        },
        set: async (val: any) => {
          const idx = data[name].findIndex((d) => d.id === _id);
          if (idx >= 0) data[name][idx] = val; else data[name].push({ id: _id, ...val });
        },
      };
    },
    get: async () => ({
      docs: (data[name] || []).map((d) => ({ id: d.id, data: () => d })),
    }),
  });

  return { _data: data, collection };
}

describe('processScheduledJobs', () => {
  let db: any;
  const now = new Date('2025-11-12T12:00:00.000Z');

  beforeEach(() => {
    db = makeDb();
  });

  it('expira proposals pendentes com expiresAt passado', async () => {
    // Seed proposals: one expired, one future, one already finalized
    db._data.proposals.push(
      { id: 'p1', status: 'pendente', expiresAt: '2025-11-12T09:00:00.000Z' }, // -3h
      { id: 'p2', status: 'pendente', expiresAt: '2025-11-12T15:00:00.000Z' }, // +3h
      { id: 'p3', status: 'aceita', expiresAt: '2025-11-12T09:00:00.000Z' },
    );

    const res = await processScheduledJobs({ db, now, thresholdHours: 12 });

    expect(res.expiredProposals).toBe(1);
    const p1 = db._data.proposals.find(p => p.id === 'p1');
    const p2 = db._data.proposals.find(p => p.id === 'p2');
    expect(p1.status).toBe('expirado');
    expect(p2.status).toBe('pendente');
  });

  it('escalona jobs abertos sem propostas mais antigos que o threshold', async () => {
    db._data.jobs.push(
      { id: 'j1', status: 'aberto', proposalsCount: 0, createdAt: '2025-11-11T00:00:00.000Z' }, // 36h atrás -> escalado
      { id: 'j2', status: 'aberto', proposalsCount: 1, createdAt: '2025-11-11T00:00:00.000Z' }, // tem proposta
      { id: 'j3', status: 'aberto', proposalsCount: 0, createdAt: '2025-11-12T04:00:00.000Z' }, // 8h atrás
      { id: 'j4', status: 'concluido', proposalsCount: 0, createdAt: '2025-11-10T00:00:00.000Z' }, // não aplicável
    );

    const res = await processScheduledJobs({ db, now, thresholdHours: 12 });

    expect(res.escalatedJobs).toBe(1);
    const j1 = db._data.jobs.find(j => j.id === 'j1');
    expect(j1.escalation).toBe('no_proposals');
    expect(j1.notifiedAt).toBeDefined();
    const j3 = db._data.jobs.find(j => j.id === 'j3');
    expect(j3.escalation).toBeUndefined();
  });
});
