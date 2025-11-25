import React, { useState, useEffect } from 'react';
import { Job, User, UserStatus } from '../types';
import AdminVerificationCard from './AdminVerificationCard';
import * as API from '../services/api';
import { logInfo, logError } from '../utils/logger';

const statusStyles: { [key: string]: { bg: string, text: string } } = {
  ativo: { bg: 'bg-green-100', text: 'text-green-800' },
  suspenso: { bg: 'bg-red-100', text: 'text-red-800' },
  pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  inativo: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

const AdminProviderManagement: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            logInfo('[AdminProviderManagement] Carregando usuários...');
            const users = await API.fetchAllUsers();
            logInfo('[AdminProviderManagement] Usuários carregados:', users.length);
            setAllUsers(users);
            
            logInfo('[AdminProviderManagement] Carregando jobs...');
            const jobs = await API.fetchJobs();
            logInfo('[AdminProviderManagement] Jobs carregados:', jobs.length);
            setAllJobs(jobs);
        } catch (error) {
            logError('[AdminProviderManagement] Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  const providers = allUsers.filter(u => u.type === 'prestador');
  const pendingVerifications = providers.filter(p => p.verificationStatus === 'pendente');
  const totalPages = Math.ceil(providers.length / ITEMS_PER_PAGE);
  const paginatedProviders = providers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleUpdateStatus = async (userId: string, status: UserStatus) => {
        // optimistic update
        const previousUsers = allUsers;
        setAllUsers(prev => prev.map(u => u.email === userId ? { ...u, status } : u));
        try {
            await API.updateUser(userId, { status });
            const notificationText = status === 'suspenso' 
                ? 'Sua conta foi suspensa. Entre em contato com o suporte.'
                : 'Sua conta foi reativada. Você já pode voltar a trabalhar.';
            await API.createNotification({ userId, text: notificationText, isRead: false });
        } catch (err) {
            logError('Failed to persist provider status change:', err);
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
            await API.updateUser(userId, { verificationStatus: decision });
            await API.createNotification({ userId, text: notificationText, isRead: false });
        } catch (err) {
            logError('Failed to persist verification decision:', err);
            setAllUsers(previousUsers);
        }
    };

  const getProviderStats = (providerId: string) => {
    try {
      const providerJobs = allJobs.filter(j => j.providerId === providerId);
      const completed = providerJobs.filter(j => j.status === 'concluido').length;
      const reviews = providerJobs.map(j => j.review).filter(Boolean);
      const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + (r?.rating || 0), 0) / reviews.length).toFixed(1) : 'N/A';
      return { completed, avgRating };
        } catch (error) {
            logError('Error calculating provider stats:', error);
      return { completed: 0, avgRating: 'N/A' };
    }
  };

  if (isLoading) return <div className="p-4 text-sm text-gray-600">Carregando prestadores...</div>;

  if (!allUsers || allUsers.length === 0) {
    return <div className="p-4 text-sm text-gray-600">Nenhum usuário encontrado.</div>;
  }

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
            <h3 className="text-xl font-bold text-gray-800 mb-4">
                Todos os Prestadores ({providers.length} total)
            </h3>
            {providers.length === 0 ? (
                <div className="bg-white shadow-sm border rounded-lg p-8 text-center text-gray-600">
                    Nenhum prestador cadastrado no sistema.
                </div>
            ) : (
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
                            {paginatedProviders.map(provider => {
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
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle?.bg || 'bg-gray-100'} ${statusStyle?.text || 'text-gray-800'}`}>
                                                {provider.status || 'desconhecido'}
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
                {totalPages > 1 && (
                    <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Mostrando {((page - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(page * ITEMS_PER_PAGE, providers.length)} de {providers.length} prestadores
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="px-3 py-1 text-sm">
                                Página {page} de {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    </div>
  );
};

export default AdminProviderManagement;
