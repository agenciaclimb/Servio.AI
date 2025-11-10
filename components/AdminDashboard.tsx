import React, { useState, useEffect } from 'react';
import { Job, User, Proposal, FraudAlert, Escrow, Dispute, Notification } from '../types';
import { useToast } from '../contexts/ToastContext';
import AdminAnalyticsDashboard from './AdminAnalyticsDashboard';
import AdminJobManagement from './AdminJobManagement';
import AdminProviderManagement from './AdminProviderManagement';
import AdminFinancials from './AdminFinancials';
import AdminFraudAlerts from './AdminFraudAlerts';
import DisputeDetailsModal from './DisputeDetailsModal'; // Substituindo o modal antigo
import { serviceNameToCategory } from '../services/geminiService';
import * as API from '../services/api';

interface AdminDashboardProps {
  user: User;
}

type AdminTab = 'analytics' | 'jobs' | 'providers' | 'financials' | 'fraud';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<AdminTab>('providers');
    const [mediatingJob, setMediatingJob] = useState<Job | null>(null);

    // Internal state for all data
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allProposals, setAllProposals] = useState<Proposal[]>([]);
    const [allFraudAlerts, setAllFraudAlerts] = useState<FraudAlert[]>([]);
    const [allEscrows, setAllEscrows] = useState<Escrow[]>([]);
    const [allDisputes, setAllDisputes] = useState<Dispute[]>([]);
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAdminData = async () => {
            setIsLoading(true);
            try {
                const [
                    jobs,
                    users,
                    proposals,
                    fraudAlerts,
                    // escrows, // Assuming no direct fetch for all escrows yet
                    disputes,
                ] = await Promise.all([
                    API.fetchJobs(),
                    API.fetchAllUsers(),
                    API.fetchProposals(),
                    API.fetchSentimentAlerts(), // Using new name (fetchFraudAlerts is now deprecated wrapper)
                    // API.fetchEscrows(),
                    API.fetchDisputes(),
                ]);
                setAllJobs(jobs);
                setAllUsers(users);
                setAllProposals(proposals);
                setAllFraudAlerts(fraudAlerts);
                // setAllEscrows(escrows);
                setAllDisputes(disputes);
            } catch (error) {
                console.error("Failed to load admin dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadAdminData();
    }, []);
    
    const newAlertsCount = allFraudAlerts.filter(a => a.status === 'novo').length;
    const openDisputesCount = allJobs.filter(j => j.status === 'em_disputa').length;
    const pendingVerificationsCount = allUsers.filter(u => u.type === 'prestador' && u.verificationStatus === 'pendente').length;

    const handleResolveDispute = async (
        disputeId: string, 
        resolution: Dispute['resolution']
    ) => {
        const dispute = allDisputes.find(d => d.id === disputeId);
        if (!dispute) return;

        try {
            // 1. Chamar API para resolver a disputa
            await API.resolveDispute(disputeId, {
                decision: resolution.outcome,
                notes: resolution.reason
            });

            // 2. Atualizar estado local
            setAllDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'resolvida', resolution } : d));
            setAllJobs(prev => prev.map(j => j.id === dispute.jobId ? { ...j, status: 'concluido' } : j));

            // 3. Notificar as partes (a API do backend deve fazer isso, mas podemos simular)
            const job = allJobs.find(j => j.id === dispute.jobId);
            if (job) {
                await API.createNotification({ userId: job.clientId, text: `A disputa para o serviço "${job.category}" foi resolvida.`, isRead: false });
                if (job.providerId) {
                    await API.createNotification({ userId: job.providerId, text: `A disputa para o serviço "${job.category}" foi resolvida.`, isRead: false });
                }
            }
            addToast('Disputa resolvida com sucesso!', 'success');
        } catch (error) {
            console.error("Falha ao resolver a disputa:", error);
            addToast('Não foi possível resolver a disputa. Tente novamente.', 'error');
        } finally {
            setMediatingJob(null); // Fechar o modal
        }
    };

    const handleSuspendProvider = async (userId: string) => {
        try {
            await API.updateUser(userId, { status: 'suspenso' });
            setAllUsers(prev => prev.map(u => u.email === userId ? { ...u, status: 'suspenso' } : u));
            addToast('Prestador suspenso com sucesso!', 'success');
            console.log(`Provider ${userId} suspended.`);
        } catch (error) {
            console.error(`Failed to suspend provider ${userId}:`, error);
            addToast('Falha ao suspender o prestador.', 'error');
        }
    };


    const renderTabContent = () => {
        switch (activeTab) {
            case 'analytics':
                return <AdminAnalyticsDashboard allJobs={allJobs} allUsers={allUsers} allDisputes={allDisputes} allFraudAlerts={allFraudAlerts} />;
            case 'jobs':
                return <AdminJobManagement allJobs={allJobs} allUsers={allUsers} onMediateClick={setMediatingJob} />;
            case 'providers':
                return <AdminProviderManagement allUsers={allUsers} allJobs={allJobs} setAllUsers={setAllUsers} setAllNotifications={setAllNotifications} />;
            case 'financials':
                return <AdminFinancials allJobs={allJobs} allProposals={allProposals} allEscrows={allEscrows} />;
            case 'fraud':
                // FIX: Pass the correct prop `setAllFraudAlerts` which is available in the component scope, instead of the undefined `setAllAlerts`.
                return <AdminFraudAlerts allAlerts={allFraudAlerts} allUsers={allUsers} setAllAlerts={setAllFraudAlerts} />;
            default:
                return null;
        }
    };

    const tabs: { id: AdminTab, label: string, count?: number }[] = [
        { id: 'analytics', label: 'Analytics' },
        { id: 'jobs', label: 'Gerenciar Jobs', count: openDisputesCount },
        { id: 'providers', label: 'Gerenciar Prestadores', count: pendingVerificationsCount },
        { id: 'financials', label: 'Financeiro' },
        { id: 'fraud', label: 'Alertas de Fraude', count: newAlertsCount },
    ];

    return (
        <div data-testid="admin-dashboard-root">
            <div className="flex justify-between items-center mb-6">
            </div>

            <div className="border-b border-gray-200 mb-6" data-testid="admin-tabs">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            data-testid={`admin-tab-${tab.id}`}
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'}
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2`}
                        >
                            <span>{tab.label}</span>
                            {tab.count && tab.count > 0 && (
                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tab.id === 'fraud' || tab.id === 'jobs' || tab.id === 'providers' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
            <div data-testid="admin-active-tab-content">
                {isLoading ? (
                    <div className="p-4 text-sm text-gray-600" data-testid="admin-loading">Carregando dados administrativos...</div>
                ) : (
                    renderTabContent()
                )}
            </div>
             {mediatingJob && (
                (() => {
                    const dispute = allDisputes.find(d => d.jobId === mediatingJob.id);
                    if (!dispute) return null;
                    return (
                        <DisputeDetailsModal
                            isOpen={true}
                            job={mediatingJob}
                            dispute={dispute}
                            currentUser={user}
                            client={allUsers.find(u => u.email === mediatingJob.clientId)!}
                            provider={allUsers.find(u => u.email === mediatingJob.providerId)!}
                            onClose={() => setMediatingJob(null)}
                            onSendMessage={() => { /* Admin não envia mensagens neste fluxo */ }}
                            onResolve={(disputeId, resolution) => handleResolveDispute(disputeId, resolution)}
                        />
                    );
                })()
             )}
        </div>
    );
};

export default AdminDashboard;