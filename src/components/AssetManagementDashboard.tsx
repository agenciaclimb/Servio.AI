import React, { useState } from 'react';
import { MaintainedItem, User } from '../../types';
import { aiApi as api } from '../lib/aiApi';

interface AssetManagementDashboardProps {
  user: User;
  items: MaintainedItem[];
  onUpgradeClick: () => void;
  onAddItemClick: () => void;
}

interface AssetAnalysis {
  overallStatus: string;
  maintenanceAlerts: string[];
  budgetForecast: string;
  optimizationSuggestion: string;
}

const AssetManagementDashboard: React.FC<AssetManagementDashboardProps> = ({ user, items, onUpgradeClick, onAddItemClick }) => {
  const [analysis, setAnalysis] = useState<AssetAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSubscribed = user.subscription?.status === 'active' || user.subscription?.status === 'trialing';

  const handleAnalyzeFleet = async () => {
    if (!isSubscribed) {
      onUpgradeClick();
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/analyze-asset-fleet', { maintainedItems: items });
      setAnalysis(response as unknown as AssetAnalysis);
    } catch (error) {
      console.error("Failed to analyze asset fleet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Gestão de Ativos</h2>
          <p className="text-sm text-gray-500 mt-1">Controle e otimize a manutenção do seu patrimônio.</p>
        </div>
        <button onClick={onAddItemClick} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          + Adicionar Ativo
        </button>
      </div>

      {/* Analysis Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold text-gray-700">Assistente de Gestão IA</h3>
        {!analysis && !isLoading && (
          <button
            onClick={handleAnalyzeFleet}
            className="mt-2 w-full text-center py-2 px-4 rounded-lg text-sm font-bold transition duration-300 bg-blue-100 text-blue-700 hover:bg-blue-200"
          >
            {isSubscribed ? 'Analisar Meus Ativos ✨' : 'Desbloquear Análise Corporativa 🚀'}
          </button>
        )}
        {isLoading && <p className="text-center text-sm text-gray-500 mt-2 animate-pulse">Analisando sua frota de ativos...</p>}
        {analysis && (
          <div className="mt-2 space-y-3 text-sm">
            <p><strong>Status Geral:</strong> {analysis.overallStatus}</p>
            <div>
              <p className="font-semibold">Alertas de Manutenção:</p>
              <ul className="list-disc list-inside text-yellow-800">
                {analysis.maintenanceAlerts.map((alert, i) => <li key={i}>{alert}</li>)}
              </ul>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="font-semibold text-green-800">💡 Otimização: <span className="font-normal">{analysis.optimizationSuggestion}</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Ativo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Localização / Grupo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Garantia</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{item.name} <span className="text-gray-500">({item.brand})</span></td>
                <td className="px-4 py-3 text-gray-600">{item.location || 'N/A'} / {item.group || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-600">{item.warrantyExpiresAt ? new Date(item.warrantyExpiresAt).toLocaleDateString() : 'N/A'}</td>
                <td className="px-4 py-3">
                  <button className="font-medium text-blue-600 hover:underline">Ver Histórico</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum ativo cadastrado.</p>}
      </div>
    </div>
  );
};

export default AssetManagementDashboard;