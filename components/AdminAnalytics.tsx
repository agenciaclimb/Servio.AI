import React from 'react';
import { Job, User } from '../types';
import StatCard from './StatCard';
import Chart from './Chart';

interface AdminAnalyticsProps {
  allJobs: Job[];
  allUsers: User[];
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ allJobs, allUsers }) => {
  const totalUsers = allUsers.length;
  const totalProviders = allUsers.filter(u => u.type === 'prestador').length;
  const totalJobs = allJobs.length;
  const completedJobs = allJobs.filter(j => j.status === 'concluido').length;

  // Data for charts
  const jobsByMonthData = allJobs.reduce((acc, job) => {
    const month = new Date(job.createdAt).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const jobsByCategoryData = allJobs.reduce((acc, job) => {
    const category = job.category.charAt(0).toUpperCase() + job.category.slice(1);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total de Usuários" value={totalUsers.toString()} icon={<p>👥</p>} />
            <StatCard title="Total de Prestadores" value={totalProviders.toString()} icon={<p>🛠️</p>} />
            <StatCard title="Total de Jobs Criados" value={totalJobs.toString()} icon={<p>📝</p>} />
            <StatCard title="Jobs Concluídos" value={completedJobs.toString()} icon={<p>✅</p>} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Chart title="Jobs Criados por Mês" data={jobsByMonthData} />
            <Chart title="Distribuição de Serviços" data={jobsByCategoryData} />
        </div>
    </div>

  );
};
export default AdminAnalytics;