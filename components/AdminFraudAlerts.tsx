
import React from 'react';
import { FraudAlert, User, FraudAlertStatus } from '../types';

interface AdminFraudAlertsProps {
  allAlerts: FraudAlert[];
  allUsers: User[];
  setAllAlerts: React.Dispatch<React.SetStateAction<FraudAlert[]>>;
}

const statusStyles: { [key in FraudAlertStatus]: { bg: string, text: string } } = {
  novo: { bg: 'bg-red-100', text: 'text-red-800' },
  revisado: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  resolvido: { bg: 'bg-green-100', text: 'text-green-800' },
};


const AdminFraudAlerts: React.FC<AdminFraudAlertsProps> = ({ allAlerts, allUsers, setAllAlerts }) => {

  const handleUpdateStatus = (alertId: string, status: FraudAlertStatus) => {
    setAllAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status } : a));
  };
    
  if (allAlerts.length === 0) {
    return <div className="text-center bg-white p-10 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900">Tudo Certo!</h3>
        <p className="mt-1 text-sm text-gray-600">Nenhum alerta de fraude foi gerado.</p>
    </div>;
  }

  return (
    <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Data</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Prestador</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Risco</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Motivo</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {allAlerts.map(alert => {
                        const provider = allUsers.find(u => u.email === alert.providerId);
                        const statusStyle = statusStyles[alert.status];
                        return (
                            <tr key={alert.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(alert.createdAt).toLocaleString('pt-BR')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{provider?.name || alert.providerId}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                        {alert.riskScore}%
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">{alert.reason}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                        {alert.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {alert.status === 'novo' && (
                                        <button onClick={() => handleUpdateStatus(alert.id, 'revisado')} className="text-yellow-600 hover:text-yellow-900">Marcar como Revisado</button>
                                    )}
                                    {alert.status === 'revisado' && (
                                        <button onClick={() => handleUpdateStatus(alert.id, 'resolvido')} className="text-green-600 hover:text-green-900">Marcar como Resolvido</button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default AdminFraudAlerts;
