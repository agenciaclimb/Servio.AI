import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { User, FraudAlert, Dispute } from '../../types';
import VerificationModal from './VerificationModal';
import FraudAlertModal from './FraudAlertModal';
import DisputeAnalysisModal from './DisputeAnalysisModal';
import AdminProspects from './AdminProspects';
import AdminTeamManagement from './AdminTeamManagement';
import StaffOnboardingTour from './StaffOnboardingTour';
import DailyBriefingCard from './DailyBriefingCard';
import AdminMarketingHub from './AdminMarketingHub';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

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

// Mapa de permissões para controlar o acesso às seções do dashboard
const permissions = {
  stats: ['super_admin', 'financeiro', 'marketing'],
  charts: ['super_admin', 'financeiro', 'marketing'],
  prospects: ['super_admin', 'prospectador'],
  team: ['super_admin'],
  verifications: ['super_admin', 'suporte'],
  disputes: ['super_admin', 'suporte'],
  marketing: ['super_admin', 'marketing'],
};

const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    jobs,
    fraudAlerts,
    disputes,
    metrics,
    handleLogout,
    handleVerification,
    handleResolveFraudAlert,
    handleAddStaff, // Supondo que esta função será criada no AppContext
    handleResolveDispute,
  } = useAppContext();

  const [userToVerify, setUserToVerify] = useState<User | null>(null);
  const [alertToAnalyze, setAlertToAnalyze] = useState<FraudAlert | null>(null);
  const [disputeToAnalyze, setDisputeToAnalyze] = useState<Dispute | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(currentUser?.type === 'staff' && !currentUser?.hasCompletedOnboarding);

  const staffMembers = users.filter(u => u.type === 'staff');
  const pendingVerifications = users.filter(u => u.verificationStatus === 'pendente');
  const recentJobs = [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const totalRevenue = metrics.revenue.reduce((sum, item) => sum + item.value, 0);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'em_progresso': return 'bg-blue-100 text-blue-800';
      case 'ativo': return 'bg-yellow-100 text-yellow-800';
      case 'em_disputa': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    // Marcar no backend que o onboarding foi concluído
    // await api.put(`/users/${currentUser.email}`, { hasCompletedOnboarding: true });
  };

  if (!currentUser) return null; // Garante que currentUser não é nulo

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {showOnboarding && currentUser.role && (
        <StaffOnboardingTour role={currentUser.role} onComplete={handleOnboardingComplete} />
      )}

      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel do Administrador</h1>
          <p className="text-gray-500 mt-1">Visão geral da plataforma SERVIO.AI.</p>
        </div>
        <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-blue-600">Sair</button>
      </header>

      {/* Daily Briefing for Staff */}
      {currentUser.type === 'staff' && (
        <div className="mb-8">
          <DailyBriefingCard user={currentUser} metrics={{
            openDisputes: disputes.filter(d => d.status === 'aberta').length,
            pendingVerifications: pendingVerifications.length,
            newProspects: 0, // Adicionar lógica para buscar prospects
          }} />
        </div>
      )}

      {/* Stats Section */}
      {permissions.stats.includes(currentUser.role!) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total de Usuários" value={users.length} icon="👥" />
          <StatCard title="Total de Serviços" value={jobs.length} icon="🛠️" />
          <StatCard title="Receita da Plataforma" value={`R$ ${totalRevenue.toFixed(2)}`} icon="💰" />
          <StatCard title="Disputas Abertas" value={disputes.filter(d => d.status === 'aberta').length} icon="⚖️" />
        </div>
      )}

      {/* Charts Section */}
      {permissions.charts.includes(currentUser.role!) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Crescimento de Usuários</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" name="Novos Usuários" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Criação de Serviços</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.jobCreation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Novos Serviços" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Marketing Hub Section */}
      {permissions.marketing.includes(currentUser.role!) && (
        <div id="marketing-panel" className="mb-8">
          <AdminMarketingHub />
        </div>
      )}

      {/* Prospecting Section */}
      {permissions.prospects.includes(currentUser.role!) && (
        <div id="prospects-panel" className="mb-8">
          <AdminProspects />
        </div>
      )}

      {/* Team Management Section - Only for Super Admins */}
      {permissions.team.includes(currentUser.role!) && (
        <div id="team-panel" className="mb-8">
          <AdminTeamManagement staff={staffMembers} onAddStaff={handleAddStaff} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Verifications */}
        {permissions.verifications.includes(currentUser.role!) && (
          <div id="verifications-panel" className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
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
        )}

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
        {permissions.disputes.includes(currentUser.role!) && (
          <div id="disputes-panel" className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
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
        )}

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
          onVerify={handleVerification}
        />
      )}

      {disputeToAnalyze && (
        <DisputeAnalysisModal
          dispute={disputeToAnalyze}
          job={jobs.find(j => j.id === disputeToAnalyze.jobId)!}
          onClose={() => setDisputeToAnalyze(null)}
          onResolve={(disputeId, resolution, comment) => {
            handleResolveDispute(disputeId, resolution, comment);
            setDisputeToAnalyze(null);
          }}
        />
      )}

      {alertToAnalyze && (
        <FraudAlertModal
          alert={alertToAnalyze}
          provider={users.find(u => u.email === alertToAnalyze.providerId)}
          onClose={() => setAlertToAnalyze(null)}
          onResolve={alertId => {
            handleResolveFraudAlert(alertId);
            setAlertToAnalyze(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;