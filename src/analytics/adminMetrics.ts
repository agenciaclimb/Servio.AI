// Pure functions extraídos de AdminAnalyticsDashboard para permitir testes unitários
// Cada função recebe arrays de entidades e retorna métricas agregadas.
// Mantém a lógica original para evitar divergências.

import { Job, User, Dispute, FraudAlert } from '../../types';

export interface UserMetrics {
  total: number;
  activeProviders: number;
  verifiedProviders: number;
  suspendedUsers: number;
}

export interface JobMetrics {
  total: number;
  completed: number;
  active: number;
  canceled: number;
  completionRate: string; // percentual formatado com uma casa
}

export interface RevenueMetrics {
  total: number;
  platform: number;
  avgJobValue: number;
}

export interface DisputeMetrics {
  total: number;
  open: number;
  resolved: number;
  rate: string; // percentual formatado
}

export interface FraudMetrics {
  total: number;
  new: number;
  highRisk: number;
}

export interface RecentMetrics {
  jobs: number;
  completions: number;
}

export interface TopProvider {
  email: string;
  count: number;
  name: string;
}
export type TopCategory = [string, number];

export interface AdminAnalytics {
  users: UserMetrics;
  jobs: JobMetrics;
  revenue: RevenueMetrics;
  disputes: DisputeMetrics;
  fraud: FraudMetrics;
  recent: RecentMetrics;
  topCategories: TopCategory[];
  topProviders: TopProvider[];
}

const ACTIVE_JOB_STATUSES = [
  'ativo',
  'em_leilao',
  'proposta_aceita',
  'agendado',
  'a_caminho',
  'em_progresso',
];

export function computeAnalytics(
  allJobs: Job[],
  allUsers: User[],
  allDisputes: Dispute[],
  allFraudAlerts: FraudAlert[],
  now: Date = new Date()
): AdminAnalytics {
  // Users
  const users: UserMetrics = {
    total: allUsers.length,
    activeProviders: allUsers.filter(u => u.type === 'prestador' && u.status === 'ativo').length,
    verifiedProviders: allUsers.filter(
      u => u.type === 'prestador' && u.verificationStatus === 'verificado'
    ).length,
    suspendedUsers: allUsers.filter(u => u.status === 'suspenso').length,
  };

  // Jobs
  const totalJobs = allJobs.length;
  const completedJobs = allJobs.filter(j => j.status === 'concluido').length;
  const jobMetrics: JobMetrics = {
    total: totalJobs,
    completed: completedJobs,
    active: allJobs.filter(j => ACTIVE_JOB_STATUSES.includes(j.status)).length,
    canceled: allJobs.filter(j => j.status === 'cancelado').length,
    completionRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : '0.0',
  };

  // Revenue
  const jobsWithEarnings = allJobs.filter(j => j.status === 'concluido' && j.earnings?.totalAmount);
  const totalRevenue = jobsWithEarnings.reduce((s, j) => s + (j.earnings?.totalAmount || 0), 0);
  const platformRevenue = jobsWithEarnings.reduce((s, j) => s + (j.earnings?.platformFee || 0), 0);
  const revenue: RevenueMetrics = {
    total: totalRevenue,
    platform: platformRevenue,
    avgJobValue: jobsWithEarnings.length ? totalRevenue / jobsWithEarnings.length : 0,
  };

  // Disputes
  const disputes: DisputeMetrics = {
    total: allDisputes.length,
    open: allDisputes.filter(d => d.status === 'aberta').length,
    resolved: allDisputes.filter(d => d.status === 'resolvida').length,
    rate: totalJobs > 0 ? ((allDisputes.length / totalJobs) * 100).toFixed(1) : '0.0',
  };

  // Fraud/Sentiment Alerts
  const fraud: FraudMetrics = {
    total: allFraudAlerts.length,
    new: allFraudAlerts.filter(a => a.status === 'novo').length,
    highRisk: allFraudAlerts.filter(a => a.riskScore >= 7).length,
  };

  // Recent (30 days)
  const thirty = new Date(now);
  thirty.setDate(thirty.getDate() - 30);
  const recentJobs = allJobs.filter(j => new Date(j.createdAt) >= thirty);
  const recent: RecentMetrics = {
    jobs: recentJobs.length,
    completions: recentJobs.filter(j => j.status === 'concluido').length,
  };

  // Categories (top 5)
  const jobsByCategory = allJobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.category] = (acc[job.category] || 0) + 1;
    return acc;
  }, {});
  const topCategories: TopCategory[] = Object.entries(jobsByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Providers (top 5 by job count)
  const providerJobs = allJobs.filter(j => j.providerId);
  const providersByJobCount: Record<string, number> = {};
  providerJobs.forEach(j => {
    if (j.providerId)
      providersByJobCount[j.providerId] = (providersByJobCount[j.providerId] || 0) + 1;
  });
  const topProviders: TopProvider[] = Object.entries(providersByJobCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([email, count]) => ({
      email,
      count,
      name: allUsers.find(u => u.email === email)?.name || email,
    }));

  return { users, jobs: jobMetrics, revenue, disputes, fraud, recent, topCategories, topProviders };
}

// Pequena função auxiliar para formatar em BRL (pode ser mockada no teste)
export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Gera série temporal de jobs e receita por dia ou mês
export function computeTimeSeriesData(
  jobs: Job[],
  granularity: 'day' | 'month' = 'month'
): Array<{ label: string; jobs: number; revenue: number }> {
  const buckets = new Map<string, { jobs: number; revenue: number }>();
  for (const j of jobs) {
    const d = new Date(j.createdAt);
    const key =
      granularity === 'day'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.get(key) || { jobs: 0, revenue: 0 };
    bucket.jobs += 1;
    if (j.earnings?.totalAmount) bucket.revenue += j.earnings.totalAmount;
    buckets.set(key, bucket);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, v]) => ({ label, jobs: v.jobs, revenue: v.revenue }));
}
