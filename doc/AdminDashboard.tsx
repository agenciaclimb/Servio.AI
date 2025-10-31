import React, { useState } from 'react';
import { User, Job, FraudAlert, Dispute } from '../types';
import VerificationModal from './VerificationModal';
import FraudAlertModal from './FraudAlertModal';
import DisputeAnalysisModal from './DisputeAnalysisModal';

interface AdminDashboardProps {
  user: User;
  users: User[];
  jobs: Job[];
  fraudAlerts: FraudAlert[];
  disputes: Dispute[];
  onLogout: () => void;
  onVerifyUser: (userId: string, newStatus: 'verificado' | 'recusado') => void;
  onResolveFraudAlert: (alertId: string) => void;
  onResolveDispute: (disputeId: string, resolution: 'release_to_provider' | 'refund_client', comment: string) => void;
}

const StatCard: React.FC<{ title: string; value: number | string; icon: string }> = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center space-x-4">
    <div className="bg-blue-100 text-blue-600 rounded-lg w-12 h-12 flex items-center justify-center text-2xl">
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, users, jobs, fraudAlerts, disputes, onLogout, onVerifyUser, onResolveFraudAlert, onResolveDispute }) => {
  const [userToVerify, setUserToVerify] = useState<User | null>(null);
  const [alertToAnalyze, setAlertToAnalyze] = useState<FraudAlert | null>(null);
  const [disputeToAnalyze, setDisputeToAnalyze] = useState<Dispute | null>(null);

  const pendingVerifications = users.filter(u => u.verificationStatus === 'pendente');
  const recentJobs = [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'em_progresso': return 'bg-blue-100 text-blue-800';
      case 'ativo': return 'bg-yellow-100 text-yellow-800';
      case 'em_disputa': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel do Administrador</h1>
          <p className="text-gray-500 mt-1">Visão geral da plataforma SERVIO.AI.</p>
        </div>
        <button onClick={onLogout} className="text-sm font-medium text-gray-600 hover:text-blue-600">Sair</button>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total de Usuários" value={users.length} icon="👥" />
        <StatCard title="Total de Serviços" value={jobs.length} icon="🛠️" />
        <StatCard title="Verificações Pendentes" value={pendingVerifications.length} icon="📝" />
        <StatCard title="Disputas Abertas" value={disputes.filter(d => d.status === 'aberta').length} icon="⚖️" />
        <StatCard title="Alertas de Fraude" value={fraudAlerts.length} icon="🚨" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Verifications */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Verificações Pendentes</h2>
          <div className="space-y-3">
            {pendingVerifications.length > 0 ? pendingVerifications.map(p => (
              <div key={p.email} className="p-3 border rounded-lg flex justify-between items-center">
                <p className="font-medium text-gray-700">{p.name} ({p.email})</p>
                <button onClick={() => setUserToVerify(p)} className="text-sm font-medium text-blue-600 hover:text-blue-500">Analisar</button>
              </div>
            )) : <p className="text-center text-gray-500 py-4">Nenhuma verificação pendente.</p>}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Serviços Recentes</h2>
          <div className="space-y-4">
            {recentJobs.map(job => (
              <div key={job.id} className="p-3 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-700">{job.category}</p>
                  <p className="text-xs text-gray-500">Cliente: {job.clientId}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(job.status)}`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Open Disputes */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Disputas Abertas</h2>
          <div className="space-y-3">
            {disputes.filter(d => d.status === 'aberta').map(d => (
              <div key={d.id} className="p-3 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-700">Job: {d.jobId.substring(0, 8)}...</p>
                  <p className="text-xs text-gray-500">Iniciada por: {d.initiatorId}</p>
                </div>
                <button onClick={() => setDisputeToAnalyze(d)} className="text-sm font-medium text-blue-600 hover:text-blue-500">Analisar</button>
              </div>
            ))}
          </div>
        </div>

        {/* Fraud Alerts */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Alertas de Fraude</h2>
          <div className="space-y-3">
            {fraudAlerts.filter(a => a.status === 'novo').map(alert => (
              <div key={alert.id} className="p-3 border dark:border-gray-600 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Risco: <span className="font-bold">{alert.riskScore}</span> - {alert.providerId}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{alert.reason}</p>
                </div>
                <button onClick={() => setAlertToAnalyze(alert)} className="text-sm font-medium text-blue-600 hover:text-blue-500">Analisar</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {userToVerify && (
        <VerificationModal 
          user={userToVerify}
          onClose={() => setUserToVerify(null)}
          onVerify={onVerifyUser}
        />
      )}

      {disputeToAnalyze && (
        <DisputeAnalysisModal
          dispute={disputeToAnalyze}
          job={jobs.find(j => j.id === disputeToAnalyze.jobId)!}
          onClose={() => setDisputeToAnalyze(null)}
          onResolve={(disputeId, resolution, comment) => {
            onResolveDispute(disputeId, resolution, comment);
            setDisputeToAnalyze(null);
          }}
        />
      )}

      {alertToAnalyze && (
        <FraudAlertModal
          alert={alertToAnalyze}
          provider={users.find(u => u.email === alertToAnalyze.providerId)}
          onClose={() => setAlertToAnalyze(null)}
          onResolve={(alertId) => {
            onResolveFraudAlert(alertId);
            setAlertToAnalyze(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;