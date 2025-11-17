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
  });
});
