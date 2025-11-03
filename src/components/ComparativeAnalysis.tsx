import React, { useState } from 'react';
import { Proposal, User } from '../../types';
import { aiApi as api } from '../lib/aiApi';

interface ComparativeAnalysisProps {
  proposals: Proposal[];
  providers: User[];
  onUpgradeClick: () => void;
  isSubscribed: boolean;
}

interface AnalysisResult {
  comparisonTable: {
    providerName: string;
    price: number;
    rating: number;
    summary: string;
  }[];
  recommendation: string;
}

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({ proposals, providers, onUpgradeClick, isSubscribed }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!isSubscribed) {
      onUpgradeClick();
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/compare-proposals', { proposals, providers });
      setAnalysis(response as unknown as AnalysisResult);
    } catch (error) {
      console.error("Failed to get comparative analysis:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (proposals.length < 2) return null; // Only show for 2 or more proposals

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
      <h2 className="text-xl font-semibold text-gray-800">Análise Comparativa IA</h2>
      <p className="text-sm text-gray-500 mt-1">Deixe a IA analisar as propostas e te ajudar a escolher a melhor opção.</p>

      {!analysis && !isLoading && (
        <button
          onClick={handleAnalyze}
          className="mt-4 w-full text-center py-2.5 px-4 rounded-lg text-sm font-bold transition duration-300 bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          {isSubscribed ? 'Analisar Propostas com IA ✨' : 'Desbloquear Análise Corporativa 🚀'}
        </button>
      )}

      {isLoading && <p className="text-center text-sm text-gray-500 mt-4 animate-pulse">Analisando propostas...</p>}

      {analysis && (
        <div className="mt-4 pt-4 border-t">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Prestador</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Preço</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Avaliação</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Resumo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysis.comparisonTable.map((row, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.providerName}</td>
                    <td className="px-4 py-3 text-gray-700">R$ {row.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-700">{row.rating.toFixed(1)} ★</td>
                    <td className="px-4 py-3 text-gray-600">{row.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-semibold text-green-800">💡 Recomendação da IA: <span className="font-normal">{analysis.recommendation}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparativeAnalysis;