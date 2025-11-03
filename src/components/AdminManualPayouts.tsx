import React from 'react';
import { Escrow } from '../../types';

interface AdminManualPayoutsProps {
  pendingPayouts: Escrow[];
  onMarkAsPaid: (escrowId: string) => Promise<void>;
}

const AdminManualPayouts: React.FC<AdminManualPayoutsProps> = ({ pendingPayouts, onMarkAsPaid }) => {
  
  const handlePaidClick = async (escrowId: string) => {
    if (window.confirm('Você confirma que realizou o pagamento manual para este prestador? Esta ação não pode ser desfeita.')) {
      await onMarkAsPaid(escrowId);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Pagamentos Manuais Pendentes</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">ID do Serviço</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Prestador</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Valor</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Ação</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingPayouts.length > 0 ? pendingPayouts.map(payout => (
              <tr key={payout.id}>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{payout.jobId.substring(0, 8)}...</td>
                <td className="px-4 py-3 font-medium text-gray-800">{payout.providerId}</td>
                <td className="px-4 py-3 font-bold text-green-600">R$ {payout.amount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handlePaidClick(payout.id)}
                    className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Marcar como Pago
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  Nenhum pagamento pendente no momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminManualPayouts;