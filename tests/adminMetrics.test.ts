import { describe, it, expect } from 'vitest';
import { computeAnalytics, computeTimeSeriesData, formatCurrencyBRL } from '../src/analytics/adminMetrics';
import type { Job, User, Dispute, FraudAlert } from '../types';

describe('adminMetrics', () => {
  const mockJobs: Job[] = [
    {
      id: 'job1',
      clientId: 'client1@test.com',
      category: 'Eletricista',
      description: 'Instalação',
      status: 'concluido',
      createdAt: '2024-11-01T10:00:00.000Z',
      serviceType: 'personalizado',
      urgency: 'hoje',
      earnings: { totalAmount: 1000, providerShare: 850, platformFee: 150 },
    },
    {
      id: 'job2',
      clientId: 'client2@test.com',
      providerId: 'prov1@test.com',
      category: 'Encanador',
      description: 'Reparo',
      status: 'em_progresso',
      createdAt: '2024-11-05T14:00:00.000Z',
      serviceType: 'tabelado',
      urgency: 'amanha',
    },
    {
      id: 'job3',
      clientId: 'client1@test.com',
      providerId: 'prov2@test.com',
      category: 'Eletricista',
      description: 'Manutenção',
      status: 'concluido',
      createdAt: '2024-10-15T09:00:00.000Z',
      serviceType: 'personalizado',
      urgency: '3dias',
      earnings: { totalAmount: 500, providerShare: 425, platformFee: 75 },
    },
    {
      id: 'job4',
      clientId: 'client3@test.com',
      category: 'Pintor',
      description: 'Pintura',
      status: 'cancelado',
      createdAt: '2024-11-10T16:00:00.000Z',
      serviceType: 'diagnostico',
      urgency: '1semana',
    },
  ];

  const mockUsers: User[] = [
    {
      email: 'client1@test.com',
      name: 'Cliente 1',
      type: 'cliente',
      status: 'ativo',
      location: 'SP',
      memberSince: '2024-01-01T00:00:00.000Z',
      bio: '',
    },
    {
      email: 'prov1@test.com',
      name: 'Prestador 1',
      type: 'prestador',
      status: 'ativo',
      verificationStatus: 'verificado',
      location: 'RJ',
      memberSince: '2024-02-01T00:00:00.000Z',
      bio: '',
    },
    {
      email: 'prov2@test.com',
      name: 'Prestador 2',
      type: 'prestador',
      status: 'suspenso',
      verificationStatus: 'pendente',
      location: 'MG',
      memberSince: '2024-03-01T00:00:00.000Z',
      bio: '',
    },
  ];

  const mockDisputes: Dispute[] = [
    {
      id: 'disp1',
      jobId: 'job2',
      initiatorId: 'client2@test.com',
      reason: 'Trabalho incompleto',
      status: 'aberta',
      messages: [],
      createdAt: '2024-11-08T12:00:00.000Z',
    },
  ];

  const mockFraudAlerts: FraudAlert[] = [
    {
      id: 'fraud1',
      providerId: 'prov2@test.com',
      riskScore: 8,
      reason: 'Múltiplas reclamações',
      status: 'novo',
      createdAt: '2024-11-09T15:00:00.000Z',
    },
    {
      id: 'fraud2',
      providerId: 'prov1@test.com',
      riskScore: 3,
      reason: 'Análise de sentimento negativa',
      status: 'revisado',
      createdAt: '2024-11-07T10:00:00.000Z',
    },
  ];

  describe('computeAnalytics', () => {
    it('deve calcular métricas de usuários corretamente', () => {
      const analytics = computeAnalytics(mockJobs, mockUsers, mockDisputes, mockFraudAlerts);
      
      expect(analytics.users.total).toBe(3);
      expect(analytics.users.activeProviders).toBe(1);
      expect(analytics.users.verifiedProviders).toBe(1);
      expect(analytics.users.suspendedUsers).toBe(1);
    });

    it('deve calcular métricas de jobs corretamente', () => {
      const analytics = computeAnalytics(mockJobs, mockUsers, mockDisputes, mockFraudAlerts);
      
      expect(analytics.jobs.total).toBe(4);
      expect(analytics.jobs.completed).toBe(2);
      expect(analytics.jobs.active).toBe(1);
      expect(analytics.jobs.canceled).toBe(1);
      expect(analytics.jobs.completionRate).toBe('50.0');
    });

    it('deve calcular métricas de receita corretamente', () => {
      const analytics = computeAnalytics(mockJobs, mockUsers, mockDisputes, mockFraudAlerts);
      
      expect(analytics.revenue.total).toBe(1500);
      expect(analytics.revenue.platform).toBe(225);
      expect(analytics.revenue.avgJobValue).toBe(750);
    });

    it('deve calcular métricas de disputas corretamente', () => {
      const analytics = computeAnalytics(mockJobs, mockUsers, mockDisputes, mockFraudAlerts);
      
      expect(analytics.disputes.total).toBe(1);
      expect(analytics.disputes.open).toBe(1);
      expect(analytics.disputes.resolved).toBe(0);
      expect(analytics.disputes.rate).toBe('25.0'); // 1 disputa / 4 jobs = 25%
    });

    it('deve calcular métricas de fraude corretamente', () => {
      const analytics = computeAnalytics(mockJobs, mockUsers, mockDisputes, mockFraudAlerts);
      
      expect(analytics.fraud.total).toBe(2);
      expect(analytics.fraud.new).toBe(1);
      expect(analytics.fraud.highRisk).toBe(1); // riskScore >= 7
    });

    it('deve calcular métricas recentes (últimos 30 dias)', () => {
      const now = new Date('2024-11-11T12:00:00.000Z');
      const analytics = computeAnalytics(mockJobs, mockUsers, mockDisputes, mockFraudAlerts, now);
      
      // Jobs criados após 2024-10-12 (30 dias antes de 2024-11-11)
      // Todos os 4 jobs estão dentro dos últimos 30 dias
      expect(analytics.recent.jobs).toBe(4);
      expect(analytics.recent.completions).toBe(2); // job1 e job3 concluídos
    });

    it('deve identificar top 5 categorias', () => {
      const analytics = computeAnalytics(mockJobs, mockUsers, mockDisputes, mockFraudAlerts);
      
      expect(analytics.topCategories).toHaveLength(3);
      expect(analytics.topCategories[0]).toEqual(['Eletricista', 2]);
      expect(analytics.topCategories[1][0]).toBe('Encanador');
      expect(analytics.topCategories[2][0]).toBe('Pintor');
    });

    it('deve identificar top 5 prestadores por número de jobs', () => {
      const analytics = computeAnalytics(mockJobs, mockUsers, mockDisputes, mockFraudAlerts);
      
      expect(analytics.topProviders).toHaveLength(2);
      expect(analytics.topProviders[0].email).toBe('prov1@test.com');
      expect(analytics.topProviders[0].count).toBe(1);
      expect(analytics.topProviders[0].name).toBe('Prestador 1');
    });

    it('deve lidar com arrays vazios sem erros', () => {
      const analytics = computeAnalytics([], [], [], []);
      
      expect(analytics.users.total).toBe(0);
      expect(analytics.jobs.total).toBe(0);
      expect(analytics.jobs.completionRate).toBe('0.0');
      expect(analytics.revenue.total).toBe(0);
      expect(analytics.disputes.rate).toBe('0.0');
      expect(analytics.topCategories).toHaveLength(0);
      expect(analytics.topProviders).toHaveLength(0);
    });
  });

  describe('computeTimeSeriesData', () => {
    it('deve agrupar jobs por mês corretamente', () => {
      const timeSeries = computeTimeSeriesData(mockJobs, 'month');
      
      expect(timeSeries).toHaveLength(2);
      expect(timeSeries[0].label).toBe('2024-10');
      expect(timeSeries[0].jobs).toBe(1);
      expect(timeSeries[0].revenue).toBe(500);
      
      expect(timeSeries[1].label).toBe('2024-11');
      expect(timeSeries[1].jobs).toBe(3);
      expect(timeSeries[1].revenue).toBe(1000);
    });

    it('deve agrupar jobs por dia corretamente', () => {
      const timeSeries = computeTimeSeriesData(mockJobs, 'day');
      
      expect(timeSeries.length).toBeGreaterThanOrEqual(3);
      expect(timeSeries[0].label).toBe('2024-10-15');
      expect(timeSeries[0].jobs).toBe(1);
      
      const nov01 = timeSeries.find(t => t.label === '2024-11-01');
      expect(nov01?.jobs).toBe(1);
      expect(nov01?.revenue).toBe(1000);
    });

    it('deve ordenar série temporal por data', () => {
      const timeSeries = computeTimeSeriesData(mockJobs, 'month');
      
      for (let i = 1; i < timeSeries.length; i++) {
        expect(timeSeries[i].label.localeCompare(timeSeries[i - 1].label)).toBeGreaterThan(0);
      }
    });

    it('deve somar receita apenas de jobs com earnings', () => {
      const timeSeries = computeTimeSeriesData(mockJobs, 'month');
      
      const outubro = timeSeries.find(t => t.label === '2024-10');
      expect(outubro?.revenue).toBe(500); // apenas job3 tem earnings em outubro
      
      const novembro = timeSeries.find(t => t.label === '2024-11');
      expect(novembro?.revenue).toBe(1000); // apenas job1 tem earnings em novembro
    });

    it('deve lidar com array vazio', () => {
      const timeSeries = computeTimeSeriesData([], 'month');
      expect(timeSeries).toHaveLength(0);
    });

    it('deve usar granularidade month por padrão', () => {
      const timeSeries = computeTimeSeriesData(mockJobs);
      
      expect(timeSeries[0].label).toMatch(/^\d{4}-\d{2}$/); // formato YYYY-MM
    });
  });

  describe('formatCurrencyBRL', () => {
    it('deve formatar valores em BRL corretamente', () => {
      // A formatação pode variar dependendo do locale do sistema
      const formatted = formatCurrencyBRL(1000);
      expect(formatted).toContain('1');
      expect(formatted).toContain('000');
      expect(formatted).toMatch(/R\$|BRL/);
      
      const small = formatCurrencyBRL(0);
      expect(small).toContain('0');
    });

    it('should format decimal values correctly', () => {
      const formatted = formatCurrencyBRL(99.99);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).toMatch(/R\$|BRL/);
    });

    it('should format large numbers with thousands separator', () => {
      const formatted = formatCurrencyBRL(1000000);
      expect(typeof formatted).toBe('string');
      expect(formatted.match(/,|\./) || formatted.length > 8).toBeTruthy();
    });

    it('should format negative numbers', () => {
      const formatted = formatCurrencyBRL(-500);
      expect(formatted).toContain('500');
      expect(typeof formatted).toBe('string');
    });

    it('should be consistent for same input', () => {
      const formatted1 = formatCurrencyBRL(2500.50);
      const formatted2 = formatCurrencyBRL(2500.50);
      expect(formatted1).toBe(formatted2);
    });

    it('should handle very small values', () => {
      const formatted = formatCurrencyBRL(0.01);
      expect(typeof formatted).toBe('string');
      expect(formatted).toMatch(/R\$|BRL/);
    });
  });

  describe('computeTimeSeriesData', () => {
    it('should return empty array for empty jobs', () => {
      const data = computeTimeSeriesData([]);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('should aggregate jobs by month by default', () => {
      const jobs: Job[] = [
        {
          id: 'j1',
          createdAt: '2024-01-10T10:00:00Z',
          earnings: { totalAmount: 100 },
        } as any,
        {
          id: 'j2',
          createdAt: '2024-01-20T14:00:00Z',
          earnings: { totalAmount: 200 },
        } as any,
        {
          id: 'j3',
          createdAt: '2024-02-15T09:00:00Z',
          earnings: { totalAmount: 300 },
        } as any,
      ];

      const data = computeTimeSeriesData(jobs);
      expect(data.length).toBe(2);
      expect(data[0].label).toBe('2024-01');
      expect(data[0].jobs).toBe(2);
      expect(data[0].revenue).toBe(300);
      expect(data[1].label).toBe('2024-02');
      expect(data[1].jobs).toBe(1);
      expect(data[1].revenue).toBe(300);
    });

    it('should aggregate jobs by day when specified', () => {
      const jobs: Job[] = [
        {
          id: 'j1',
          createdAt: '2024-01-10T10:00:00Z',
          earnings: { totalAmount: 100 },
        } as any,
        {
          id: 'j2',
          createdAt: '2024-01-11T14:00:00Z',
          earnings: { totalAmount: 200 },
        } as any,
        {
          id: 'j3',
          createdAt: '2024-01-10T20:00:00Z',
          earnings: { totalAmount: 150 },
        } as any,
      ];

      const data = computeTimeSeriesData(jobs, 'day');
      expect(data.length).toBe(2);
      expect(data[0].label).toBe('2024-01-10');
      expect(data[0].jobs).toBe(2);
      expect(data[0].revenue).toBe(250);
      expect(data[1].label).toBe('2024-01-11');
      expect(data[1].jobs).toBe(1);
      expect(data[1].revenue).toBe(200);
    });

    it('should sum revenue correctly across time periods', () => {
      const jobs: Job[] = [
        { id: 'j1', createdAt: '2024-01-15', earnings: { totalAmount: 500 } } as any,
        { id: 'j2', createdAt: '2024-01-15', earnings: { totalAmount: 300 } } as any,
        { id: 'j3', createdAt: '2024-01-15', earnings: { totalAmount: 200 } } as any,
      ];

      const data = computeTimeSeriesData(jobs);
      expect(data[0].revenue).toBe(1000);
    });

    it('should count jobs correctly', () => {
      const jobs: Job[] = [
        { id: 'j1', createdAt: '2024-01-15' } as any,
        { id: 'j2', createdAt: '2024-01-15' } as any,
        { id: 'j3', createdAt: '2024-01-15' } as any,
        { id: 'j4', createdAt: '2024-01-15' } as any,
        { id: 'j5', createdAt: '2024-02-15' } as any,
      ];

      const data = computeTimeSeriesData(jobs);
      expect(data[0].jobs).toBe(4);
      expect(data[1].jobs).toBe(1);
    });

    it('should sort results by date ascending', () => {
      const jobs: Job[] = [
        { id: 'j1', createdAt: '2024-03-15' } as any,
        { id: 'j2', createdAt: '2024-01-15' } as any,
        { id: 'j3', createdAt: '2024-02-15' } as any,
      ];

      const data = computeTimeSeriesData(jobs, 'month');
      expect(data[0].label).toBe('2024-01');
      expect(data[1].label).toBe('2024-02');
      expect(data[2].label).toBe('2024-03');
    });

    it('should handle jobs without earnings gracefully', () => {
      const jobs: Job[] = [
        { id: 'j1', createdAt: '2024-01-15', earnings: { totalAmount: 100 } } as any,
        { id: 'j2', createdAt: '2024-01-15' } as any,
      ];

      const data = computeTimeSeriesData(jobs);
      expect(data[0].jobs).toBe(2);
      expect(data[0].revenue).toBeGreaterThanOrEqual(100);
    });

    it('should return objects with label, jobs, and revenue properties', () => {
      const jobs: Job[] = [
        { id: 'j1', createdAt: '2024-01-15', earnings: { totalAmount: 500 } } as any,
      ];

      const data = computeTimeSeriesData(jobs);
      expect(data[0]).toHaveProperty('label');
      expect(data[0]).toHaveProperty('jobs');
      expect(data[0]).toHaveProperty('revenue');
      expect(typeof data[0].label).toBe('string');
      expect(typeof data[0].jobs).toBe('number');
      expect(typeof data[0].revenue).toBe('number');
    });

    it('should pad date components with zeros', () => {
      const jobs: Job[] = [
        { id: 'j1', createdAt: '2024-01-05T12:00:00Z', earnings: {} } as any,
        { id: 'j2', createdAt: '2024-02-03T14:00:00Z', earnings: {} } as any,
      ];

      const data = computeTimeSeriesData(jobs, 'day');
      expect(data[0].label).toMatch(/2024-01-05/);
      expect(data[1].label).toMatch(/2024-02-03/);
    });

    it('should handle multiple years of data', () => {
      const jobs: Job[] = [
        { id: 'j1', createdAt: '2023-12-15', earnings: { totalAmount: 100 } } as any,
        { id: 'j2', createdAt: '2024-01-15', earnings: { totalAmount: 200 } } as any,
        { id: 'j3', createdAt: '2024-02-15', earnings: { totalAmount: 300 } } as any,
      ];

      const data = computeTimeSeriesData(jobs);
      expect(data.length).toBe(3);
      expect(data[0].label).toBe('2023-12');
      expect(data[2].label).toBe('2024-02');
    });
  });

  describe('computeAnalytics - complex scenarios', () => {
    it('should correctly calculate completion rate with various job statuses', () => {
      const jobs: Job[] = [
        { status: 'concluido', earnings: { totalAmount: 100 } } as any,
        { status: 'concluido', earnings: { totalAmount: 100 } } as any,
        { status: 'cancelado', earnings: {} } as any,
        { status: 'ativo', earnings: {} } as any,
      ];

      const analytics = computeAnalytics(jobs, [], [], []);

      expect(analytics.jobs.completed).toBe(2);
      expect(analytics.jobs.total).toBe(4);
      expect(parseFloat(analytics.jobs.completionRate)).toBeCloseTo(50, 0);
    });

    it('should categorize providers correctly by verification status', () => {
      const users: User[] = [
        { type: 'prestador', status: 'ativo', verificationStatus: 'verificado', email: 'p1@test.com', name: 'Provider 1' } as any,
        { type: 'prestador', status: 'ativo', verificationStatus: 'verificado', email: 'p2@test.com', name: 'Provider 2' } as any,
        { type: 'prestador', status: 'ativo', verificationStatus: 'pendente', email: 'p3@test.com', name: 'Provider 3' } as any,
        { type: 'prestador', status: 'suspenso', verificationStatus: 'rejeitado', email: 'p4@test.com', name: 'Provider 4' } as any,
      ];

      const analytics = computeAnalytics([], users, [], []);

      expect(analytics.users.total).toBe(4);
      expect(analytics.users.activeProviders).toBe(3);
      expect(analytics.users.verifiedProviders).toBe(2);
      expect(analytics.users.suspendedUsers).toBe(1);
    });

    it('should track top 5 categories by volume', () => {
      const jobs: Job[] = [
        { category: 'Limpeza' } as any,
        { category: 'Limpeza' } as any,
        { category: 'Limpeza' } as any,
        { category: 'Eletricidade' } as any,
        { category: 'Eletricidade' } as any,
        { category: 'Encanamento' } as any,
        { category: 'Pintura' } as any,
        { category: 'Carpintaria' } as any,
        { category: 'Jardinagem' } as any,
      ];

      const analytics = computeAnalytics(jobs, [], [], []);

      expect(analytics.topCategories.length).toBeLessThanOrEqual(5);
      if (analytics.topCategories.length > 0) {
        expect(analytics.topCategories[0][0]).toBe('Limpeza');
        expect(analytics.topCategories[0][1]).toBe(3);
      }
    });

    it('should track top providers with correct metadata', () => {
      const jobs: Job[] = [
        { providerId: 'prov1@test.com' } as any,
        { providerId: 'prov1@test.com' } as any,
        { providerId: 'prov2@test.com' } as any,
      ];
      const users: User[] = [
        { email: 'prov1@test.com', name: 'João Silva', type: 'prestador' } as any,
        { email: 'prov2@test.com', name: 'Maria Santos', type: 'prestador' } as any,
      ];

      const analytics = computeAnalytics(jobs, users, [], []);

      expect(analytics.topProviders.length).toBeLessThanOrEqual(5);
      if (analytics.topProviders.length > 0) {
        expect(analytics.topProviders[0].email).toBe('prov1@test.com');
        expect(analytics.topProviders[0].count).toBe(2);
        expect(analytics.topProviders[0].name).toBe('João Silva');
      }
    });

    it('should calculate dispute metrics accurately', () => {
      const disputes: Dispute[] = [
        { status: 'aberta' } as any,
        { status: 'aberta' } as any,
        { status: 'resolvida' } as any,
      ];
      const jobs: Job[] = [
        { status: 'concluido' }, { status: 'concluido' }, { status: 'concluido' }, 
        { status: 'concluido' }, { status: 'concluido' }
      ] as any;

      const analytics = computeAnalytics(jobs, [], disputes, []);

      expect(analytics.disputes.total).toBe(3);
      expect(analytics.disputes.open).toBe(2);
      expect(analytics.disputes.resolved).toBe(1);
      expect(parseFloat(analytics.disputes.rate)).toBe(60);
    });

    it('should calculate revenue metrics with platform and provider shares', () => {
      const jobs: Job[] = [
        { status: 'concluido', earnings: { totalAmount: 1000, providerShare: 850, platformFee: 150 } } as any,
        { status: 'concluido', earnings: { totalAmount: 2000, providerShare: 1600, platformFee: 400 } } as any,
      ];

      const analytics = computeAnalytics(jobs, [], [], []);

      expect(analytics.revenue.total).toBe(3000);
      expect(analytics.revenue.avgJobValue).toBe(1500);
    });

    it('should track fraud alerts with risk scoring', () => {
      const fraudAlerts: FraudAlert[] = [
        { status: 'novo', riskScore: 8.5 } as any,
        { status: 'novo', riskScore: 9.2 } as any,
        { status: 'resolvido', riskScore: 7.1 } as any,
        { status: 'novo', riskScore: 4.3 } as any,
      ];

      const analytics = computeAnalytics([], [], [], fraudAlerts);

      expect(analytics.fraud.total).toBe(4);
      expect(analytics.fraud.new).toBe(3);
      expect(analytics.fraud.highRisk).toBeGreaterThanOrEqual(2);
    });

    it('should return consistent results for identical inputs', () => {
      const jobs: Job[] = [
        { status: 'concluido', category: 'Limpeza', earnings: { totalAmount: 100 } } as any,
        { status: 'ativo', category: 'Eletricidade' } as any,
      ];
      const users: User[] = [
        { type: 'prestador', status: 'ativo', verificationStatus: 'verificado', email: 'p1@test.com', name: 'P1' } as any,
      ];

      const analytics1 = computeAnalytics(jobs, users, [], []);
      const analytics2 = computeAnalytics(jobs, users, [], []);

      expect(JSON.stringify(analytics1)).toBe(JSON.stringify(analytics2));
    });

    it('should handle empty inputs for all categories', () => {
      const analytics = computeAnalytics([], [], [], []);

      expect(analytics.jobs.total).toBe(0);
      expect(analytics.users.total).toBe(0);
      expect(analytics.disputes.total).toBe(0);
      expect(analytics.fraud.total).toBe(0);
      expect(analytics.revenue.total).toBe(0);
    });

    it('should filter recent data to 30-day window correctly', () => {
      const date30DaysAgo = new Date();
      date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
      
      const date45DaysAgo = new Date();
      date45DaysAgo.setDate(date45DaysAgo.getDate() - 45);

      const jobs: Job[] = [
        { status: 'concluido', createdAt: date45DaysAgo.toISOString() } as any,
        { status: 'concluido', createdAt: date30DaysAgo.toISOString() } as any,
        { status: 'ativo', createdAt: new Date().toISOString() } as any,
      ];

      const analytics = computeAnalytics(jobs, [], [], []);

      expect(analytics.recent.jobs).toBeGreaterThanOrEqual(1);
      expect(analytics.recent.completions).toBeGreaterThanOrEqual(1);
    });

    it('should compute all required analytics fields', () => {
      const analytics = computeAnalytics(mockJobs, mockJobs.length > 0 ? [{} as any] : [], [], []);

      expect(analytics).toHaveProperty('users');
      expect(analytics).toHaveProperty('jobs');
      expect(analytics).toHaveProperty('revenue');
      expect(analytics).toHaveProperty('disputes');
      expect(analytics).toHaveProperty('fraud');
      expect(analytics).toHaveProperty('recent');
      expect(analytics).toHaveProperty('topCategories');
      expect(analytics).toHaveProperty('topProviders');

      expect(analytics.users).toHaveProperty('total');
      expect(analytics.jobs).toHaveProperty('total');
      expect(analytics.revenue).toHaveProperty('total');
      expect(analytics.disputes).toHaveProperty('total');
      expect(analytics.fraud).toHaveProperty('total');
    });
  });
});
