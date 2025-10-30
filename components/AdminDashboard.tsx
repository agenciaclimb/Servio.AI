import React, { useState } from 'react';
import { Job, User, Proposal, FraudAlert, Escrow, Dispute, Notification } from '../types';
import AdminAnalytics from './AdminAnalytics';
import AdminJobManagement from './AdminJobManagement';
import AdminProviderManagement from './AdminProviderManagement';
import AdminFinancials from './AdminFinancials';
import SitemapGenerator from './SitemapGenerator';
import AdminFraudAlerts from './AdminFraudAlerts';
import AdminDisputeModal from './AdminDisputeModal'; // Import the new modal
import { serviceNameToCategory } from '../services/geminiService';

interface AdminDashboardProps {
  user: User;
  allJobs: Job[];
  allUsers: User[];
  allProposals: Proposal[];
  allFraudAlerts: FraudAlert[];
  allEscrows: Escrow[];
  allDisputes: Dispute[];
  setAllFraudAlerts: React.Dispatch<React.SetStateAction<FraudAlert[]>>;
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setAllJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  setAllEscrows: React.Dispatch<React.SetStateAction<Escrow[]>>;
  setAllDisputes: React.Dispatch<React.SetStateAction<Dispute[]>>;
  setAllNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

type AdminTab = 'analytics' | 'jobs' | 'providers' | 'financials' | 'fraud';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    user, allJobs, allUsers, allProposals, allFraudAlerts, allEscrows, allDisputes,
    setAllFraudAlerts, setAllUsers, setAllJobs, setAllEscrows, setAllDisputes, setAllNotifications
}) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('providers');
    const [isSitemapOpen, setIsSitemapOpen] = useState(false);
    const [mediatingJob, setMediatingJob] = useState<Job | null>(null);
    
    const newAlertsCount = allFraudAlerts.filter(a => a.status === 'novo').length;
    const openDisputesCount = allJobs.filter(j => j.status === 'em_disputa').length;
    const pendingVerificationsCount = allUsers.filter(u => u.type === 'prestador' && u.verificationStatus === 'pendente').length;

    const handleResolveDispute = (
        jobId: string, 
        disputeId: string, 
        resolution: Dispute['resolution']
    ) => {
        // Find the escrow for the job
        const escrow = allEscrows.find(e => e.jobId === jobId);
        if (!escrow) return;

        // 1. Update Escrow Status
        setAllEscrows(prev => prev.map(e => e.id === escrow.id ? { ...e, status: resolution!.outcome === 'reembolsado' ? 'reembolsado' : 'liberado' } : e));

        // 2. Update Dispute Status
        setAllDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'resolvida', resolution } : d));

        // 3. Update Job Status to Concluido
        setAllJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'concluido' } : j));
        
        setMediatingJob(null); // Close the modal
    };


    const renderTabContent = () => {
        switch (activeTab) {
            case 'analytics':
                return <AdminAnalytics allJobs={allJobs} allUsers={allUsers} />;
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Painel do Administrador</h1>
                 <button onClick={() => setIsSitemapOpen(true)} className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    Simular Sitemap
                </button>
            </div>

            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
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
            <div>
                {renderTabContent()}
            </div>
             {isSitemapOpen && <SitemapGenerator users={allUsers} serviceNameToCategory={serviceNameToCategory} onClose={() => setIsSitemapOpen(false)} />}
             {mediatingJob && (
                <AdminDisputeModal 
                    job={mediatingJob}
                    dispute={allDisputes.find(d => d.id === mediatingJob.disputeId)!}
                    client={allUsers.find(u => u.email === mediatingJob.clientId)!}
                    provider={allUsers.find(u => u.email === mediatingJob.providerId)!}
                    onClose={() => setMediatingJob(null)}
                    onResolve={handleResolveDispute}
                />
             )}
        </div>
    );
};

export default AdminDashboard;