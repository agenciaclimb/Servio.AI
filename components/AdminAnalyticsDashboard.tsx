import React, { useMemo, useState } from 'react';
import { computeAnalytics, computeTimeSeriesData } from '../src/analytics/adminMetrics';
import AnalyticsTimeSeriesChart from './admin/AnalyticsTimeSeriesChart';
import { useAdminAnalyticsData } from './useAdminAnalyticsData';
import TimePeriodFilter, { TimePeriod } from './TimePeriodFilter';

const AdminAnalyticsDashboard: React.FC = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(90);
  const { jobs, allUsers, disputes, allFraudAlerts, isLoading } = useAdminAnalyticsData(timePeriod);

  // Determina a granularidade e o título do gráfico com base no período selecionado
  const chartGranularity = timePeriod === 30 ? 'day' : 'month';
  const chartTitle = timePeriod === 30 ? 'Crescimento Diário (Últimos 30 dias)' : 'Crescimento Mensal';

  const analytics = useMemo(() => computeAnalytics(jobs, allUsers, disputes, allFraudAlerts), [jobs, allUsers, disputes, allFraudAlerts]);
  const timeSeries = useMemo(() => computeTimeSeriesData(jobs, chartGranularity), [jobs, chartGranularity]);

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-600">Carregando métricas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <TimePeriodFilter selectedPeriod={timePeriod} onSelectPeriod={setTimePeriod} />
      </div>
      <AnalyticsTimeSeriesChart data={timeSeries} title={chartTitle} />
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 mb-1">Usuários Totais</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.users.total}</p>
              <p className="text-xs text-gray-600 mt-2">
                {analytics.users.activeProviders} prestadores ativos
              </p>
            </div>
            <span className="text-3xl">👥</span>
          </div>
        </div>

        {/* Jobs */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 mb-1">Jobs Criados</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.jobs.total}</p>
              <p className="text-xs text-gray-600 mt-2">
                {analytics.jobs.completionRate}% conclusão
              </p>
            </div>
            <span className="text-3xl">📝</span>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 mb-1">Receita Plataforma</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.revenue.platform.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Ticket médio: {analytics.revenue.avgJobValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <span className="text-3xl">💰</span>
          </div>
        </div>

        {/* Disputes */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 mb-1">Disputas</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.disputes.total}</p>
              <p className="text-xs text-gray-600 mt-2">
                {analytics.disputes.open} abertas • {analytics.disputes.rate}% taxa
              </p>
            </div>
            <span className="text-3xl">⚠️</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-2">Alertas de Fraude</p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-orange-600">{analytics.fraud.total}</span>
            <div className="text-right">
              <p className="text-xs text-gray-600">{analytics.fraud.new} novos</p>
              <p className="text-xs text-red-600">{analytics.fraud.highRisk} alto risco</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-2">Últimos 30 Dias</p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-blue-600">{analytics.recent.jobs}</span>
            <div className="text-right">
              <p className="text-xs text-gray-600">jobs criados</p>
              <p className="text-xs text-green-600">{analytics.recent.completions} concluídos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-2">Prestadores</p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-indigo-600">{analytics.users.verifiedProviders}</span>
            <div className="text-right">
              <p className="text-xs text-gray-600">verificados</p>
              <p className="text-xs text-red-600">{analytics.users.suspendedUsers} suspensos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts/Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Categorias</h3>
          <div className="space-y-3">
            {analytics.topCategories.map(([category, count], idx) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 w-6">#{idx + 1}</span>
                  <span className="text-sm text-gray-900">{category}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(count / analytics.jobs.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Providers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Prestadores</h3>
          <div className="space-y-3">
            {analytics.topProviders.map((provider, idx) => (
              <div key={provider.email} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 w-6">#{idx + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{provider.name}</p>
                    <p className="text-xs text-gray-600">{provider.email}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-green-600">{provider.count} jobs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status de Jobs</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{analytics.jobs.completed}</p>
            <p className="text-sm text-gray-600">Concluídos</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{analytics.jobs.active}</p>
            <p className="text-sm text-gray-600">Ativos</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{analytics.disputes.open}</p>
            <p className="text-sm text-gray-600">Em Disputa</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">{analytics.jobs.canceled}</p>
            <p className="text-sm text-gray-600">Cancelados</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
