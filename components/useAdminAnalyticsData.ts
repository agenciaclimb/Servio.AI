import { useState, useEffect, useMemo } from 'react';
import { Job, User, Dispute, FraudAlert } from '../types';
import * as API from '../services/api';

export type TimePeriod = 30 | 90 | 365 | 'all';

export function useAdminAnalyticsData(period: TimePeriod) {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allDisputes, setAllDisputes] = useState<Dispute[]>([]);
  const [allFraudAlerts, setAllFraudAlerts] = useState<FraudAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [jobs, users, disputes, fraudAlerts] = await Promise.all([
          API.fetchJobs(),
          API.fetchAllUsers(),
          API.fetchDisputes(),
          API.fetchSentimentAlerts(),
        ]);
        setAllJobs(jobs);
        setAllUsers(users);
        setAllDisputes(disputes);
        setAllFraudAlerts(fraudAlerts);
      } catch (error) {
        console.error("Failed to load admin analytics data:", error);
      } finally {
        setIsLoading(false);
        setInitialLoadComplete(true);
      }
    };
    loadData();
  }, []);

  const filteredJobs = useMemo(() => {
    if (period === 'all') return allJobs;
    const now = new Date();
    const startDate = new Date(now.setDate(now.getDate() - period));
    return allJobs.filter(job => new Date(job.createdAt) >= startDate);
  }, [allJobs, period]);

  // As outras métricas podem ou não ser filtradas por tempo.
  // Por exemplo, disputas e usuários geralmente são contados no total,
  // mas poderíamos criar versões filtradas se necessário.
  const filteredDisputes = useMemo(() => {
    if (period === 'all') return allDisputes;
    const now = new Date();
    const startDate = new Date(now.setDate(now.getDate() - period));
    return allDisputes.filter(d => new Date(d.createdAt) >= startDate);
  }, [allDisputes, period]);

  return {
    jobs: filteredJobs,
    allUsers,
    disputes: filteredDisputes,
    allFraudAlerts,
    isLoading: isLoading && !initialLoadComplete, // Só mostra loading na carga inicial
  };
}