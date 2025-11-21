import React, { useEffect, useState } from 'react';
import { fetchProspectorStats, fetchProspectorLeaderboard, ProspectorStats, LeaderboardEntry, computeBadgeProgress } from '../services/api';
import ReferralLinkGenerator from '../src/components/ReferralLinkGenerator';
import MessageTemplateSelector from '../src/components/MessageTemplateSelector';
import NotificationSettings from '../src/components/NotificationSettings';

const loadingClass = 'animate-pulse bg-gray-200 rounded h-6 w-32';

type TabType = 'overview' | 'links' | 'templates' | 'notifications';

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
    <div className="h-3 bg-gradient-to-r from-indigo-500 to-purple-600" style={{ width: `${value}%` }} />
  </div>
);

const StatCard: React.FC<{ label: string; value: React.ReactNode; sub?: string }> = ({ label, value, sub }) => (
  <div className="p-4 bg-white rounded border shadow-sm flex flex-col gap-1">
    <div className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
    {sub && <div className="text-xs text-gray-500">{sub}</div>}
  </div>
);

interface ProspectorDashboardProps {
  userId: string;
}

const ProspectorDashboard: React.FC<ProspectorDashboardProps> = ({ userId }) => {
  const prospectorId = userId;
  const [stats, setStats] = useState<ProspectorStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [referralLink, setReferralLink] = useState<string>('');

  useEffect(() => {
    async function load() {
      if (!prospectorId) return;
      setLoading(true);
      setError(null);
      try {
        const [s, lb] = await Promise.all([
          fetchProspectorStats(prospectorId),
          fetchProspectorLeaderboard('commissions', 10)
        ]);
        setStats(s);
        setLeaderboard(lb);
      } catch (e: any) {
        setError(e.message || 'Falha ao carregar');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [prospectorId]);

  // Optimistic badge if stats missing
  const badge = stats ? {
    currentBadge: stats.currentBadge,
    nextBadge: stats.nextBadge,
    progressToNextBadge: stats.progressToNextBadge,
    tiers: stats.badgeTiers
  } : computeBadgeProgress(stats?.totalRecruits || 0);

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800">Painel do Prospector</h1>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">{error}</div>}
      
      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📊 Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'links'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            🔗 Links de Indicação
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'templates'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📝 Templates de Mensagens
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            🔔 Notificações
          </button>
        </div>
      </div>
      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Recrutas Ativos" value={loading ? <div className={loadingClass} data-testid="loading-active"/> : stats?.activeRecruits || 0} />
        <StatCard label="Total Recrutas" value={loading ? <div className={loadingClass} data-testid="loading-total"/> : stats?.totalRecruits || 0} />
        <StatCard label="Comissões (R$)" value={loading ? <div className={loadingClass} data-testid="loading-commissions"/> : (stats?.totalCommissionsEarned?.toFixed(2) || '0.00')} />
        <StatCard label="Média Comissão" value={loading ? <div className={loadingClass} data-testid="loading-average"/> : (stats?.averageCommissionPerRecruit?.toFixed(2) || '0.00')} />
      </div>

      <div className="bg-white p-5 rounded border shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Badge Atual</div>
            <div className="text-xl font-semibold text-indigo-600">{badge.currentBadge}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Próximo Badge</div>
            <div className="text-xl font-semibold text-purple-600">{badge.nextBadge || 'Máximo alcançado'}</div>
          </div>
        </div>
        <ProgressBar value={badge.progressToNextBadge} />
        <div className="text-xs text-gray-500">Progresso: {badge.progressToNextBadge}%</div>
        <div className="flex gap-2 flex-wrap text-xs">
          {badge.tiers.map(t => (
            <span key={t.name} className={`px-2 py-1 rounded border ${badge.currentBadge === t.name ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{t.name} ≥ {t.min}</span>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded border shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Leaderboard (Top 10 por Comissões)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2">Rank</th>
              <th className="py-2">Nome</th>
              <th className="py-2">Recrutas</th>
              <th className="py-2">Comissões (R$)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-6 text-center text-gray-500">Carregando...</td></tr>
            ) : leaderboard.length === 0 ? (
              <tr><td colSpan={4} className="py-6 text-center text-gray-500">Sem dados ainda</td></tr>
            ) : leaderboard.map(row => (
              <tr key={row.prospectorId} className="border-b last:border-0">
                <td className="py-2 font-medium">{row.rank}</td>
                <td className="py-2">{row.name}</td>
                <td className="py-2">{row.totalRecruits}</td>
                <td className="py-2">{Number(row.totalCommissionsEarned).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-5 rounded border shadow-sm flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Dicas Rápidas</h2>
        <ul className="text-sm text-gray-600 list-disc pl-5 flex flex-col gap-1">
          <li>Convide prestadores em categorias com menor cobertura para ganhar posição no ranking mais rápido.</li>
          <li>Use seu link de convite personalizado em grupos locais de serviços.</li>
          <li>Mantenha contato com seus recrutados: atividade deles aumenta suas comissões.</li>
        </ul>
      </div>
        </>
      )}

      {/* Tab Content: Referral Links */}
      {activeTab === 'links' && (
        <ReferralLinkGenerator 
          prospectorId={prospectorId} 
          onLinkGenerated={setReferralLink}
        />
      )}

      {/* Tab Content: Message Templates */}
      {activeTab === 'templates' && (
        <MessageTemplateSelector referralLink={referralLink} />
      )}

      {/* Tab Content: Notifications */}
      {activeTab === 'notifications' && (
        <NotificationSettings prospectorId={prospectorId} />
      )}
    </div>
  );
};

export default ProspectorDashboard;