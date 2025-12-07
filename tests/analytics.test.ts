import { describe, it, expect } from 'vitest';
import { computeAnalytics } from '../src/analytics/adminMetrics';
import { Job, User, Dispute, FraudAlert } from '../types';

function d(daysFromNow: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysFromNow);
  return dt.toISOString();
}

describe('computeAnalytics', () => {
  const users: User[] = [
    {
      email: 'prov1@example.com',
      name: 'Prov 1',
      type: 'prestador',
      status: 'ativo',
      verificationStatus: 'verificado',
    } as any,
    {
      email: 'prov2@example.com',
      name: 'Prov 2',
      type: 'prestador',
      status: 'ativo',
      verificationStatus: 'pendente',
    } as any,
    {
      email: 'client@example.com',
      name: 'Cli 1',
      type: 'cliente',
      status: 'ativo',
      verificationStatus: 'verificado',
    } as any,
    {
      email: 'susp@example.com',
      name: 'Susp',
      type: 'cliente',
      status: 'suspenso',
      verificationStatus: 'verificado',
    } as any,
  ];

  const jobs: Job[] = [
    {
      id: 'j1',
      category: 'Elétrica',
      status: 'concluido',
      providerId: 'prov1@example.com',
      createdAt: d(-5),
      earnings: { totalAmount: 1000, platformFee: 150 },
    } as any,
    {
      id: 'j2',
      category: 'Elétrica',
      status: 'concluido',
      providerId: 'prov1@example.com',
      createdAt: d(-10),
      earnings: { totalAmount: 800, platformFee: 120 },
    } as any,
    {
      id: 'j3',
      category: 'Hidráulica',
      status: 'ativo',
      providerId: 'prov2@example.com',
      createdAt: d(-2),
    } as any,
    { id: 'j4', category: 'Pintura', status: 'cancelado', createdAt: d(-40) } as any,
  ];

  const disputes: Dispute[] = [
    { id: 'd1', jobId: 'j4', status: 'aberta' } as any,
    { id: 'd2', jobId: 'j2', status: 'resolvida' } as any,
  ];

  const alerts: FraudAlert[] = [
    { id: 'a1', userEmail: 'prov1@example.com', status: 'novo', riskScore: 8 } as any,
    { id: 'a2', userEmail: 'prov2@example.com', status: 'revisado', riskScore: 6 } as any,
    { id: 'a3', userEmail: 'client@example.com', status: 'novo', riskScore: 9 } as any,
  ];

  it('calcula métricas de usuários, jobs e receita corretamente', () => {
    const a = computeAnalytics(jobs, users, disputes, alerts, new Date());

    expect(a.users.total).toBe(4);
    expect(a.users.activeProviders).toBe(2);
    expect(a.users.verifiedProviders).toBe(1);
    expect(a.users.suspendedUsers).toBe(1);

    expect(a.jobs.total).toBe(4);
    expect(a.jobs.completed).toBe(2);
    expect(a.jobs.active).toBe(1);
    expect(a.jobs.canceled).toBe(1);
    expect(a.jobs.completionRate).toBe('50.0');

    expect(a.revenue.total).toBe(1800);
    expect(a.revenue.platform).toBe(270);
    expect(a.revenue.avgJobValue).toBeCloseTo(900);
  });

  it('calcula disputas, alertas e últimos 30 dias', () => {
    const a = computeAnalytics(jobs, users, disputes, alerts, new Date());

    expect(a.disputes.total).toBe(2);
    expect(a.disputes.open).toBe(1);
    expect(a.disputes.resolved).toBe(1);
    expect(a.disputes.rate).toBe('50.0');

    // recentes: j1 (-5), j2 (-10), j3 (-2) => 3; j4 (-40) fica fora
    expect(a.recent.jobs).toBe(3);
    expect(a.recent.completions).toBe(2);

    expect(a.fraud.total).toBe(3);
    expect(a.fraud.new).toBe(2);
    expect(a.fraud.highRisk).toBe(2);
  });

  it('ordena top categorias e top prestadores', () => {
    const a = computeAnalytics(jobs, users, disputes, alerts, new Date());

    // categorias: Elétrica=2, Hidráulica=1, Pintura=1
    expect(a.topCategories[0][0]).toBe('Elétrica');
    expect(a.topCategories[0][1]).toBe(2);

    // prov1 tem 2 jobs, prov2 tem 1
    expect(a.topProviders[0].email).toBe('prov1@example.com');
    expect(a.topProviders[0].count).toBe(2);
    expect(a.topProviders[0].name).toBe('Prov 1');
  });
});
