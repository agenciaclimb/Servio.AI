import React, { useMemo, useState } from 'react';
import { User, Job } from '../../types';

interface FinancialInsightsCardProps {
  user: User;
  completedJobs: Job[];
  onUpgradeClick: () => void;
}

const FinancialInsightsCard: React.FC<FinancialInsightsCardProps> = ({ user, completedJobs, onUpgradeClick }) => {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSubscribed = user.subscription?.status === 'active' || user.subscription?.status === 'trialing';

  const handleGetInsights = async () => {
    if (!isSubscribed) {
      onUpgradeClick();
      return;
    }
    setIsLoading(true);
    try {
      // Local, deterministic summary (placeholder for API)
      const total = completedJobs.length;
      const categories = completedJobs.reduce<Record<string, number>>((acc, j) => {
        acc[j.category] = (acc[j.category] || 0) + 1;
        return acc;
      }, {});
      const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'geral';
      const profitabilityAnalysis = `Você concluiu ${total} serviços recentemente. A categoria mais frequente foi ${topCategory}.`;
      const actionableSuggestion = `Crie um pacote promocional para ${topCategory} e destaque depoimentos no seu perfil.`;
      setInsights({ profitabilityAnalysis, actionableSuggestion });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="text-xl font-semibold text-gray-800">Análise Financeira IA 📈</h3>
      <p className="text-sm text-gray-500 mt-1">Descubra seus serviços mais lucrativos e receba dicas para crescer.</p>
      
      {!insights && !isLoading && (
        <button
          onClick={handleGetInsights}
          className="mt-4 w-full text-center py-2.5 px-4 rounded-lg text-sm font-bold transition duration-300 bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          {isSubscribed ? 'Analisar Meus Ganhos ✨' : 'Desbloquear Análise Pro 🚀'}
        </button>
      )}

      {isLoading && <p className="text-center text-sm text-gray-500 mt-4 animate-pulse">Analisando seus dados...</p>}

      {insights && (
        <div className="mt-4 pt-4 border-t space-y-3 text-sm">
          <div>
            <p className="font-semibold text-gray-700">Análise de Rentabilidade (IA):</p>
            <p className="text-gray-600">{insights.profitabilityAnalysis}</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="font-semibold text-blue-800">💡 Dica da IA: <span className="font-normal">{insights.actionableSuggestion}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialInsightsCard;