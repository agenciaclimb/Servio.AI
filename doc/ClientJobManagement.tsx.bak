import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Job, JobStatus } from '../types';
import * as API from '../services/api';

interface ClientJobManagementProps {
  user: User;
  onCreateJob: () => void;
  onViewMap: (jobId: string) => void;
}

const getStatusClass = (status: JobStatus) => {
  switch (status) {
    case 'concluido': return 'bg-green-100 text-green-800';
    case 'em_progresso': return 'bg-blue-100 text-blue-800';
    case 'ativo': return 'bg-yellow-100 text-yellow-800';
    case 'em_disputa': return 'bg-red-100 text-red-800';
    case 'agendado': return 'bg-purple-100 text-purple-800';
    case 'em_leilao': return 'bg-orange-100 text-orange-800';
    case 'proposta_aceita': return 'bg-green-100 text-green-800';
    case 'a_caminho': return 'bg-cyan-100 text-cyan-800';
    case 'pagamento_pendente': return 'bg-orange-100 text-orange-800';
    case 'cancelado': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const ClientJobManagement: React.FC<ClientJobManagementProps> = ({ user, onCreateJob, onViewMap }) => {
  const [clientJobs, setClientJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClientJobs = async () => {
      setIsLoading(true);
      try {
        const allJobs = await API.fetchJobs(); // Assuming fetchJobs fetches all and we filter
        const filteredJobs = allJobs.filter(job => job.clientId === user.email);
        setClientJobs(filteredJobs);
      } catch (error) {
        console.error("Failed to fetch client jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClientJobs();
  }, [user.email]);

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-600 dark:text-gray-400">Carregando seus serviços...</div>;
  }

  return (
    <>
      <div className="mb-6">
        <button onClick={onCreateJob} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          Solicitar Novo Serviço
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="space-y-4">
          {clientJobs.length > 0 ? clientJobs.map(job => (
            <div key={job.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900/50">
              <div className="flex justify-between items-center" >
                <Link to={`/job/${job.id}`} className="flex-grow">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{job.category}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs sm:max-w-md">{job.description}</p>
                  </div>
                </Link>
                <div className="flex items-center space-x-4 ml-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(job.status)}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                  {job.providerId && ['agendado', 'em_progresso', 'concluido'].includes(job.status) && (
                    <button onClick={() => onViewMap(job.id)} className="text-sm font-medium text-blue-600 hover:underline">Ver no Mapa</button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">Você ainda não solicitou nenhum serviço.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientJobManagement;