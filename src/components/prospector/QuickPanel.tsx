import { FiUsers, FiClipboard, FiTarget, FiBarChart2 } from 'react-icons/fi';
import { useProspectorStats } from '../../../hooks/useProspectorStats';
import React from 'react'; // Adicionado para React.ReactNode

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <div className={`p-4 rounded-lg shadow-sm flex items-start gap-4 border-l-4 ${color}`}>
    <div className="text-2xl">{icon}</div>
    <div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      <div className="text-sm font-medium text-gray-500">{label}</div>
    </div>
  </div>
);

interface QuickPanelProps {
  prospectorId: string;
}

const QuickPanel: React.FC<QuickPanelProps> = ({ prospectorId }) => {
  const { stats, leadsCount, loading, error } = useProspectorStats(prospectorId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg shadow-sm bg-gray-200 animate-pulse h-24"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">Erro ao carregar dados: {error}</div>
    );
  }

  const activeRecruits = stats?.activeRecruits || 0;
  const totalLeads = leadsCount;
  const conversionRate = totalLeads > 0 ? ((activeRecruits / totalLeads) * 100).toFixed(1) : 0;
  const totalCommissions = stats?.totalCommissionsEarned?.toFixed(2) || '0.00';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <StatCard
        icon={<FiUsers />}
        label="Recrutas Ativos"
        value={activeRecruits}
        color="border-blue-500"
      />
      <StatCard
        icon={<FiClipboard />}
        label="Total de Leads"
        value={totalLeads}
        color="border-purple-500"
      />
      <StatCard
        icon={<FiTarget />}
        label="Taxa de Conversão"
        value={`${conversionRate}%`}
        color="border-green-500"
      />
      <StatCard
        icon={<FiBarChart2 />}
        label="Comissões (R$)"
        value={totalCommissions}
        color="border-yellow-500"
      />
    </div>
  );
};

export default QuickPanel;
