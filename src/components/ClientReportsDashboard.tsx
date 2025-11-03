import React, { useState } from 'react';
import { User, Job } from '../../types';
import { aiApi as api } from '../lib/aiApi';

interface ClientReportsDashboardProps {
  user: User;
  completedJobs: Job[];
  onUpgradeClick: () => void;
}

interface Report {
  totalSpending: number;
  topCategory: string;
  topProvider: string;
  actionableInsight: string;
}

const ClientReportsDashboard: React.FC<ClientReportsDashboardProps> = ({ user, completedJobs, onUpgradeClick }) => {
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSubscribed = user.subscription?.status === 'active' || user.subscription?.status === 'trialing';

  const handleGenerateReport = async () => {
    if (!isSubscribed) {
      onUpgradeClick();
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/analyze-spending-report', { completedJobs });
      setReport(response as unknown as Report);
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800">Relatórios de Gestão</h2>
      <p className="text-sm text-gray-500 mt-1">Analise seus gastos e otimize suas contratações com a ajuda da IA.</p>

      {!report && !isLoading && (
        <button
          onClick={handleGenerateReport}
          className="mt-4 w-full text-center py-2.5 px-4 rounded-lg text-sm font-bold transition duration-300 bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          {isSubscribed ? 'Gerar Relatório do Mês ✨' : 'Desbloquear Relatórios Corporativos 🚀'}
        </button>
      )}

      {isLoading && <p className="text-center text-sm text-gray-500 mt-4 animate-pulse">Analisando seus dados...</p>}

      {report && (
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Gasto Total</p>
            <p className="text-xl font-bold text-gray-800">R$ {report.totalSpending.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Principal Categoria</p>
            <p className="text-xl font-bold text-gray-800">{report.topCategory}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Prestador Mais Contratado</p>
            <p className="text-xl font-bold text-gray-800">{report.topProvider.split('@')[0]}</p>
          </div>
          <div className="md:col-span-3 mt-2 p-3 bg-green-50 border border-green-200 rounded-md text-left">
            <p className="text-sm font-semibold text-green-800">💡 Insight da IA: <span className="font-normal">{report.actionableInsight}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientReportsDashboard;