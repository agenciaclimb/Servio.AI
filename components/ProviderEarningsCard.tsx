import React from 'react';
import { Job } from '../types';

interface ProviderEarningsCardProps {
  completedJobs: Job[];
  currentRate: number;
  totalJobs: number;
  averageRating: number;
}

const ProviderEarningsCard: React.FC<ProviderEarningsCardProps> = ({
  completedJobs,
  currentRate,
  totalJobs,
  averageRating,
}) => {
  // Calculate earnings
  const totalEarnings = completedJobs.reduce((sum, job) => {
    return sum + (job.earnings?.providerShare || 0);
  }, 0);

  const thisMonthJobs = completedJobs.filter(job => {
    const jobDate = new Date(job.createdAt);
    const now = new Date();
    return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear();
  });

  const thisMonthEarnings = thisMonthJobs.reduce((sum, job) => {
    return sum + (job.earnings?.providerShare || 0);
  }, 0);

  const averageJobValue = completedJobs.length > 0 
    ? totalEarnings / completedJobs.length 
    : 0;

  // Badge logic
  const getBadge = () => {
    if (totalJobs >= 100 && averageRating >= 4.8) return { name: '🏆 Elite', color: 'bg-yellow-500', textColor: 'text-yellow-900' };
    if (totalJobs >= 50 && averageRating >= 4.5) return { name: '💎 Premium', color: 'bg-purple-500', textColor: 'text-purple-900' };
    if (totalJobs >= 20 && averageRating >= 4.0) return { name: '⭐ Profissional', color: 'bg-blue-500', textColor: 'text-blue-900' };
    if (totalJobs >= 5) return { name: '🌟 Verificado', color: 'bg-green-500', textColor: 'text-green-900' };
    return { name: '🆕 Iniciante', color: 'bg-gray-400', textColor: 'text-gray-900' };
  };

  const badge = getBadge();

  // Commission rate percentage
  const platformFee = (1 - currentRate) * 100;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-6 border border-blue-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-800">💰 Meus Ganhos</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} ${badge.textColor}`}>
          {badge.name}
        </span>
      </div>

      {/* Total Earnings */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <p className="text-sm text-gray-600 mb-1">Total Acumulado</p>
        <p className="text-3xl font-bold text-green-600">
          {totalEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <p className="text-xs text-gray-600 mt-1">{completedJobs.length} serviços concluídos</p>
      </div>

      {/* This Month */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">Este Mês</p>
          <p className="text-lg font-bold text-blue-600">
            {thisMonthEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-gray-600">{thisMonthJobs.length} jobs</p>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">Média por Job</p>
          <p className="text-lg font-bold text-purple-600">
            {averageJobValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-gray-600">ticket médio</p>
        </div>
      </div>

      {/* Commission Rate */}
      <div className="bg-white rounded-lg p-3 shadow-sm mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-600">Sua Comissão Atual</span>
          <span className="text-lg font-bold text-green-600">{(currentRate * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${currentRate * 100}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Plataforma: {platformFee.toFixed(0)}% • Você: {(currentRate * 100).toFixed(0)}%
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-2 shadow-sm text-center">
          <p className="text-xs text-gray-600">Jobs</p>
          <p className="text-lg font-bold text-gray-800">{totalJobs}</p>
        </div>
        <div className="bg-white rounded-lg p-2 shadow-sm text-center">
          <p className="text-xs text-gray-600">Rating</p>
          <p className="text-lg font-bold text-yellow-600">⭐ {averageRating.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-lg p-2 shadow-sm text-center">
          <p className="text-xs text-gray-600">Taxa</p>
          <p className="text-lg font-bold text-green-600">{(currentRate * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Next Badge Progress */}
      {badge.name !== '🏆 Elite' && (
        <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs font-semibold text-blue-800 mb-1">📈 Próximo Nível</p>
          {badge.name === '🆕 Iniciante' && (
            <p className="text-xs text-blue-700">Complete 5 jobs para ser <strong>🌟 Verificado</strong></p>
          )}
          {badge.name === '🌟 Verificado' && (
            <p className="text-xs text-blue-700">Complete 20 jobs com rating 4.0+ para ser <strong>⭐ Profissional</strong></p>
          )}
          {badge.name === '⭐ Profissional' && (
            <p className="text-xs text-blue-700">Complete 50 jobs com rating 4.5+ para ser <strong>💎 Premium</strong></p>
          )}
          {badge.name === '💎 Premium' && (
            <p className="text-xs text-blue-700">Complete 100 jobs com rating 4.8+ para ser <strong>🏆 Elite</strong></p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProviderEarningsCard;
