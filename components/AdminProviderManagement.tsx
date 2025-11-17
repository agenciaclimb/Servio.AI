import React, { useState, useEffect } from 'react';
import { Job, User, UserStatus } from '../types';
import { suspendProvider, reactivateProvider, setVerificationStatus, createNotification } from '../services/api';
import AdminVerificationCard from './AdminVerificationCard';
import * as API from '../services/api';

const statusStyles: { [key in UserStatus]: { bg: string, text: string } } = {
  ativo: { bg: 'bg-green-100', text: 'text-green-800' },
  suspenso: { bg: 'bg-red-100', text: 'text-red-800' },
};

const AdminProviderManagement: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            const [users, jobs] = await Promise.all([
                API.fetchAllUsers(),
                API.fetchJobs(),
            ]);
            setAllUsers(users);
            setAllJobs(jobs);
        } catch (error) {
            console.error("Failed to load provider management data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  const providers = allUsers.filter(u => u.type === 'prestador');
  const pendingVerifications = providers.filter(p => p.verificationStatus === 'pendente');

    const handleUpdateStatus = async (userId: string, status: UserStatus) => {
        // optimistic update
        const previousUsers = allUsers;
        setAllUsers(prev => prev.map(u => u.email === userId ? { ...u, status } : u));
        try {
            if (status === 'suspenso') {
                await suspendProvider(userId, 'Suspended by admin via dashboard');
                await createNotification({ userId, text: 'Sua conta foi suspensa. Entre em contato com o suporte.', isRead: false });
            } else {
                await reactivateProvider(userId);
                await createNotification({ userId, text: 'Sua conta foi reativada. Você já pode voltar a trabalhar.', isRead: false });
            }
        } catch (err) {
            console.error('Failed to persist provider status change:', err);
            // revert optimistic change on error
            setAllUsers(previousUsers);
        }
    };
  
    const handleVerificationDecision = async (userId: string, decision: 'verificado' | 'recusado') => {
        // optimistic update
        const previousUsers = allUsers;
        setAllUsers(prev => prev.map(u => u.email === userId ? { ...u, verificationStatus: decision } : u));

        const notificationText = decision === 'verificado'
            ? 'Parabéns! Sua identidade foi verificada e seu perfil está ativo.'
            : 'Houve um problema com sua verificação de identidade. Por favor, envie seus documentos novamente.';

        try {
            await setVerificationStatus(userId, decision);
            await createNotification({ userId, text: notificationText, isRead: false });
        } catch (err) {
            console.error('Failed to persist verification decision:', err);
            setAllUsers(previousUsers);
        }
    };

  const getProviderStats = (providerId: string) => {
    const providerJobs = allJobs.filter(j => j.providerId === providerId);
    const completed = providerJobs.filter(j => j.status === 'concluido').length;
    const reviews = providerJobs.map(j => j.review).filter(Boolean);
    const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r!.rating, 0) / reviews.length).toFixed(1) : 'N/A';
    return { completed, avgRating };
  };

  if (isLoading) return <div className="p-4 text-sm text-gray-600">Carregando prestadores...</div>;

  return (
    <div className="space-y-8">
        {pendingVerifications.length > 0 && (
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Fila de Verificação de Identidade</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pendingVerifications.map(provider => (
                        <AdminVerificationCard 
                            key={provider.email}
                            provider={provider}
                            onApprove={() => handleVerificationDecision(provider.email, 'verificado')}
                            onReject={() => handleVerificationDecision(provider.email, 'recusado')}
                        />
                    ))}
                </div>
            </div>
        )}

        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Todos os Prestadores</h3>
            <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nome</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Verificação</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Jobs Concluídos</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Média Aval.</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {providers.map(provider => {
                                const stats = getProviderStats(provider.email);
                                const statusStyle = statusStyles[provider.status];
                                return (
                                    <tr key={provider.email}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                                            <div className="text-sm text-gray-600">{provider.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {provider.verificationStatus === 'verificado' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Verificado</span>}
                                            {provider.verificationStatus === 'recusado' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Recusado</span>}
                                            {provider.verificationStatus === 'pendente' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendente</span>}
                                            {!provider.verificationStatus && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Não iniciado</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center">{stats.completed}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center">{stats.avgRating}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                                {provider.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                            <a href={`/?profile=${provider.email}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">Ver Perfil</a>
                                            {provider.status === 'ativo' ? (
                                                <button onClick={() => handleUpdateStatus(provider.email, 'suspenso')} className="text-red-600 hover:text-red-900">Suspender</button>
                                            ) : (
                                                <button onClick={() => handleUpdateStatus(provider.email, 'ativo')} className="text-green-600 hover:text-green-900">Reativar</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminProviderManagement;
