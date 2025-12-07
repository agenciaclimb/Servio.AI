import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MetricData {
  date: string;
  conversions: number;
  outreach: number;
  followUp: number;
  revenue: number;
}

interface CampaignMetric {
  name: string;
  status: string;
  leads: number;
  converted: number;
  conversionRate: number;
  revenue: number;
}

interface DashboardStats {
  totalLeads: number;
  totalConverted: number;
  overallConversionRate: number;
  totalRevenue: number;
  avgFollowUpTime: number;
  lastUpdated: string;
}

export const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Fetch from backend analytics endpoints
      const [metricsRes, campaignsRes] = await Promise.all([
        fetch('/api/analytics/metrics-timeline'),
        fetch('/api/analytics/campaign-performance'),
      ]);

      if (!metricsRes.ok || !campaignsRes.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const metricsData = await metricsRes.json();
      const campaignsData = await campaignsRes.json();

      setMetrics(metricsData.data);
      setCampaigns(campaignsData.campaigns);

      // Calculate aggregate stats
      const totalLeads = metricsData.data.reduce(
        (sum: number, m: MetricData) => sum + m.outreach,
        0
      );
      const totalConverted = metricsData.data.reduce(
        (sum: number, m: MetricData) => sum + m.conversions,
        0
      );
      const totalRevenue = metricsData.data.reduce(
        (sum: number, m: MetricData) => sum + m.revenue,
        0
      );

      setStats({
        totalLeads,
        totalConverted,
        overallConversionRate: totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0,
        totalRevenue,
        avgFollowUpTime: 4.2, // Hours
        lastUpdated: new Date().toISOString(),
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro ao carregar métricas: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Métricas</h1>
          <p className="text-gray-600 mt-2">
            Últimas atualizações:{' '}
            {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString('pt-BR') : 'N/A'}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total de Leads</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalLeads ?? 0}</div>
            <div className="text-xs text-gray-500 mt-2">Últimos 30 dias</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Conversões</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {stats?.totalConverted ?? 0}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Taxa: {stats?.overallConversionRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Receita</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              R$ {(stats?.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500 mt-2">Gerada</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Tempo Médio Follow-up</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              {stats?.avgFollowUpTime ?? 0}h
            </div>
            <div className="text-xs text-gray-500 mt-2">Entre contatos</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Taxa de Conversão</div>
            <div className="text-3xl font-bold text-orange-600 mt-2">
              {stats?.overallConversionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-2">Global</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Timeline Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Evolução de Métricas</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="outreach" stroke="#3b82f6" name="Outreach" />
                <Line type="monotone" dataKey="conversions" stroke="#10b981" name="Conversões" />
                <Line type="monotone" dataKey="followUp" stroke="#f59e0b" name="Follow-up" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Receita Gerada</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Bar dataKey="revenue" fill="#3b82f6" name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance por Campanha</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Campanha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Leads</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Convertidos</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Taxa</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Receita</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{campaign.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          campaign.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {campaign.status === 'active' ? 'Ativa' : 'Pausada'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">{campaign.leads}</td>
                    <td className="text-center py-3 px-4">{campaign.converted}</td>
                    <td className="text-center py-3 px-4">{campaign.conversionRate.toFixed(1)}%</td>
                    <td className="text-right py-3 px-4 font-semibold">
                      R$ {campaign.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Funil de Conversão</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-lg p-6 mb-2">
                <div className="text-3xl font-bold text-blue-600">{stats?.totalLeads ?? 0}</div>
              </div>
              <p className="text-sm text-gray-600">Leads</p>
            </div>
            <div className="flex items-center justify-center md:mb-0 mb-4">
              <div className="text-2xl text-gray-400">→</div>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-lg p-6 mb-2">
                <div className="text-3xl font-bold text-purple-600">
                  {Math.floor((stats?.totalLeads ?? 0) * 0.4)}
                </div>
              </div>
              <p className="text-sm text-gray-600">Qualificados</p>
            </div>
            <div className="flex items-center justify-center md:mb-0 mb-4">
              <div className="text-2xl text-gray-400">→</div>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-lg p-6 mb-2">
                <div className="text-3xl font-bold text-green-600">
                  {stats?.totalConverted ?? 0}
                </div>
              </div>
              <p className="text-sm text-gray-600">Convertidos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
