import React, { useEffect, useRef } from 'react';
import { useProspectorStats } from '../hooks/useProspectorStats';
import ProspectorDashboardSkeleton from './skeletons/ProspectorDashboardSkeleton';
import { computeBadgeProgress } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import confetti from 'canvas-confetti';

const StatCard: React.FC<{ label: string; value: React.ReactNode; sub?: string }> = ({ label, value, sub }) => (
  <div className="p-4 bg-white rounded border shadow-sm flex flex-col gap-1">
    <div className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
    {sub && <div className="text-xs text-gray-500">{sub}</div>}
  </div>
);

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const isNearCompletion = clampedValue >= 90;

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div
        className={`bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ${isNearCompletion ? 'animate-pulse' : ''}`}
        style={{ width: `${clampedValue}%` }}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso: ${clampedValue}%`}
      ></div>
    </div>
  );
};

const ProspectorStatistics: React.FC<{ prospectorId: string }> = ({ prospectorId }) => {
  const { stats, leaderboard, loading, error } = useProspectorStats(prospectorId);
  const { addToast } = useToast();
  const prevBadgeRef = useRef<string>();

  // Efeito para celebração de badge
  useEffect(() => {
    if (stats?.currentBadge && prevBadgeRef.current && stats.currentBadge !== prevBadgeRef.current) {
      addToast(`🎉 Novo Badge Conquistado: ${stats.currentBadge}!`, 'success');
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        zIndex: 10000
      });
    }
    prevBadgeRef.current = stats?.currentBadge;
  }, [stats, addToast]);
  
  if (loading) {
    return <ProspectorDashboardSkeleton />;
  }

  if (error) {
    return <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded mb-4">{error}</div>;
  }
  
  const badge = stats ? {
    currentBadge: stats.currentBadge,
    nextBadge: stats.nextBadge,
    progressToNextBadge: stats.progressToNextBadge,
    tiers: stats.badgeTiers
  } : computeBadgeProgress(0);

  return (
     <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Recrutas Ativos" value={stats?.activeRecruits || 0} />
            <StatCard label="Total Recrutas" value={stats?.totalRecruits || 0} />
            <StatCard label="Comissões (R$)" value={stats?.totalCommissionsEarned?.toFixed(2) || '0.00'} />
            <StatCard label="Média Comissão" value={stats?.averageCommissionPerRecruit?.toFixed(2) || '0.00'} />
        </div>

        <div className="bg-white p-5 rounded border shadow-sm flex flex-col gap-4 mt-4">
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
          <div className="text-xs text-gray-500">Progresso: {badge.progressToNextBadge.toFixed(1)}% para {badge.nextBadge}</div>
          <div className="flex gap-2 flex-wrap text-xs">
              {badge.tiers.map(t => (
              <span key={t.name} className={`px-2 py-1 rounded border ${badge.currentBadge === t.name ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{t.name} ≥ {t.min}</span>
              ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded border shadow-sm mt-4">
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
                {leaderboard.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-500">Sem dados ainda</td></tr>
                ) : (
                    leaderboard.map(row => (
                    <tr key={row.prospectorId} className="border-b last:border-0">
                        <td className="py-2 font-medium">{row.rank}</td>
                        <td className="py-2">{row.name}</td>
                        <td className="py-2">{row.totalRecruits}</td>
                        <td className="py-2">{Number(row.totalCommissionsEarned).toFixed(2)}</td>
                    </tr>
                    ))
                )}
              </tbody>
          </table>
        </div>
    </>
  );
};

export default ProspectorStatistics;
