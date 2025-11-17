import React, { useState, useEffect } from 'react';
import { Job, User, JobStatus } from '../types';
import * as API from '../services/api';

const statusStyles: { [key in JobStatus]: { bg: string; text: string } } = {
    ativo: { bg: 'bg-blue-100', text: 'text-blue-800' },
    em_leilao: { bg: 'bg-orange-100', text: 'text-orange-800' },
    proposta_aceita: { bg: 'bg-green-100', text: 'text-green-800' },
    agendado: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    a_caminho: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    em_progresso: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    pagamento_pendente: { bg: 'bg-orange-100', text: 'text-orange-800' },
    em_disputa: { bg: 'bg-red-200', text: 'text-red-800' },
    concluido: { bg: 'bg-gray-200', text: 'text-gray-800' },
    cancelado: { bg: 'bg-red-100', text: 'text-red-800' },
};

interface AdminJobManagementProps {
  onMediateClick: (job: Job) => void;
}

const AdminJobManagement: React.FC<AdminJobManagementProps> = ({ onMediateClick }) => {
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            const [jobs, users] = await Promise.all([
                API.fetchJobs(),
                API.fetchAllUsers(),
            ]);
            setAllJobs(jobs);
            setAllUsers(users);
        } catch (error) {
            console.error("Failed to load job management data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  const filteredJobs = (filter === 'all' ? allJobs : allJobs.filter(j => j.status === filter))
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (isLoading) return <div className="p-4 text-sm text-gray-600">Carregando jobs...</div>;

  return (
     <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
            <label htmlFor="status-filter" className="sr-only">Filtrar por Status</label>
            <select
                id="status-filter"
                value={filter}
                onChange={e => setFilter(e.target.value as JobStatus | 'all')}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
                <option value="all">Todos os Status</option>
                {Object.keys(statusStyles).map(status => (
                    <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </option>
                ))}
            </select>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Job ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cliente / Prestador</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Categoria</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Data</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs.map(job => {
                        const client = allUsers.find(u => u.email === job.clientId);
                        const provider = allUsers.find(u => u.email === job.providerId);
                        const statusStyle = statusStyles[job.status];
                        return (
                            <tr key={job.id} className={`${job.status === 'em_disputa' ? 'bg-red-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{job.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{client?.name}</div>
                                    <div className="text-sm text-gray-600">{provider?.name || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{job.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                        {job.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(job.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {job.status === 'em_disputa' ? (
                                        <button onClick={() => onMediateClick(job)} className="text-red-600 hover:text-red-900 font-bold">Mediar</button>
                                    ) : (
                                        <a href="#" className="text-blue-600 hover:text-blue-900">Detalhes</a>
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

export default AdminJobManagement;