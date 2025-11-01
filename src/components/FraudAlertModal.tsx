import React from 'react';
import { FraudAlert, User } from '../../types';

interface FraudAlertModalProps {
  alert: FraudAlert;
  provider: User | undefined;
  onClose: () => void;
  onResolve: (alertId: string) => void;
}

const FraudAlertModal: React.FC<FraudAlertModalProps> = ({ alert, provider, onClose, onResolve }) => {
  const riskColor = alert.riskScore > 75 ? 'text-red-600' : alert.riskScore > 50 ? 'text-orange-600' : 'text-yellow-600';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analisar Alerta de Fraude</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
        </div>

        <div className="space-y-4 mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
          <p><span className="font-semibold">Prestador:</span> {provider?.name || alert.providerId}</p>
          <p><span className="font-semibold">Pontuação de Risco:</span> <span className={`font-bold ${riskColor}`}>{alert.riskScore} / 100</span></p>
          <p className="font-semibold">Análise da IA:</p>
          <p className="text-gray-700 dark:text-gray-300 italic border-l-4 border-red-500 pl-4">"{alert.reason}"</p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => onResolve(alert.id)}
            className="px-6 py-2 border border-transparent bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
          >
            Marcar como Revisado
          </button>
          <button
            // TODO: Implement suspension logic
            onClick={() => window.alert('Ação de suspensão a ser implementada.')}
            className="px-6 py-2 border border-red-300 text-red-600 font-medium rounded-md hover:bg-red-50 dark:hover:bg-red-900/50"
          >
            Suspender Prestador
          </button>
        </div>
      </div>
    </div>
  );
};

export default FraudAlertModal;