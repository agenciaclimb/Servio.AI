import React, { useState } from 'react';
import type { User, Job, Dispute } from '../types';
import { useToast } from '../contexts/ToastContext';
import AdminAnalyticsDashboard from './AdminAnalyticsDashboard';
import AdminJobManagement from './AdminJobManagement';
import AdminProviderManagement from './AdminProviderManagement';
import AdminFinancials from './AdminFinancials';
import AdminFraudAlerts from './AdminFraudAlerts';
import AdminUserManagement from './AdminUserManagement';
import AdminProspecting from './AdminProspecting';
import AdminMarketing from './AdminMarketing';
import AdminProspectorManagement from './AdminProspectorManagement';
import DisputeDetailsModal from './DisputeDetailsModal';
import * as API from '../services/api';

interface AdminDashboardProps {
  user: User;
}

type AdminTab = 'analytics' | 'jobs' | 'providers' | 'financials' | 'fraud' | 'users' | 'prospecting' | 'marketing' | 'prospectors';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

    // Internal state for all data
    // O estado e o carregamento de dados foram movidos para os subcomponentes.
    // O AdminDashboard agora apenas orquestra qual aba está ativa.
    const [mediatingJob, setMediatingJob] = useState<Job | null>(null); // Apenas para o modal de disputa
    const [disputeForJob, setDisputeForJob] = useState<Dispute | null>(null);
    const [clientForJob, setClientForJob] = useState<User | null>(null);
    const [providerForJob, setProviderForJob] = useState<User | null>(null);
    
    // Os contadores agora seriam gerenciados internamente ou via um contexto/hook compartilhado se necessário.

    const handleResolveDispute = async (
        disputeId: string, 
        resolution: Dispute['resolution']
    ) => {
        if (!resolution) return;
        try {
            await API.resolveDispute(disputeId, {
                decision: resolution.outcome,
                notes: resolution.reason
            });
            addToast('Disputa resolvida com sucesso!', 'success');
            // A atualização do estado local agora é responsabilidade do componente que gerencia os dados (AdminJobManagement).
            // Para refletir a mudança, precisaríamos de um mecanismo de atualização (ex: callback) ou um gerenciador de estado global.
            // Por simplicidade, o modal será fechado e a lista pode ser recarregada.
        } catch (error) {
            console.error("Falha ao resolver a disputa:", error);
            addToast('Não foi possível resolver a disputa. Tente novamente.', 'error');
        } finally {
            setMediatingJob(null); // Fechar o modal
        }
    };

    const handleMediateClick = async (job: Job) => {
        try {
            const [allDisp, client, provider] = await Promise.all([
                API.fetchDisputes(),
                API.fetchUserById(job.clientId),
                job.providerId ? API.fetchUserById(job.providerId) : Promise.resolve(null),
            ]);
            const jobDispute = allDisp.find(d => d.jobId === job.id);

            if (jobDispute && client && provider) {
                setDisputeForJob(jobDispute);
                setClientForJob(client);
                setProviderForJob(provider);
                setMediatingJob(job);
            } else {
                addToast('Não foi possível carregar os detalhes da disputa.', 'error');
            }
        } catch (error) {
            addToast('Erro ao buscar dados da disputa.', 'error');
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'analytics':
                return <AdminAnalyticsDashboard />;
            case 'jobs':
                return <AdminJobManagement onMediateClick={handleMediateClick} />;
            case 'providers':
                return <AdminProviderManagement />;
            case 'financials':
                return <AdminFinancials />;
            case 'fraud':
                return <AdminFraudAlerts />;
            case 'users':
                return <AdminUserManagement />;
            case 'prospecting':
                return <AdminProspecting />;
            case 'marketing':
                return <AdminMarketing />;
            case 'prospectors':
                return <AdminProspectorManagement />;
            default:
                return null;
        }
    };

    return (
        <div data-testid="admin-dashboard-root">
            <div className="flex justify-between items-center mb-6">
            </div>

            <div className="border-b border-gray-200 mb-6" data-testid="admin-tabs">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {['analytics', 'jobs', 'providers', 'financials', 'fraud', 'users', 'prospecting', 'marketing', 'prospectors'].map(tabId => (
                        <button
                            data-testid={`admin-tab-${tabId}`}
                            key={tabId}
                            onClick={() => setActiveTab(tabId as AdminTab)}
                            className={`${activeTab === tabId ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'}
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2`}
                        >
                            <span>{tabId.charAt(0).toUpperCase() + tabId.slice(1)}</span>
                        </button>
                    ))}
                </nav>
            </div>
            <div data-testid="admin-active-tab-content">
                {renderTabContent()}
            </div>
             {mediatingJob && disputeForJob && clientForJob && providerForJob && (
                <DisputeDetailsModal
                    isOpen={true}
                    job={mediatingJob}
                    dispute={disputeForJob}
                    currentUser={user}
                    client={clientForJob}
                    provider={providerForJob}
                    onClose={() => setMediatingJob(null)}
                    onSendMessage={() => { /* Admin não envia mensagens neste fluxo */ }}
                    onResolve={(disputeId, resolution) => handleResolveDispute(disputeId, resolution)}
                />
            )}
        </div>
    );
};

export default AdminDashboard;