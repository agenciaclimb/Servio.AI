import React from 'react';
import { Job, User, JobStatus } from '../types';
import JobTimeline from './JobTimeline';

interface ProviderJobCardProps {
  job: Job;
  client?: User;
  onChat: () => void;
  onUpdateStatus: (jobId: string, newStatus: JobStatus) => void;
}

const ProviderJobCard: React.FC<ProviderJobCardProps> = ({ job, client, onChat, onUpdateStatus }) => {
  const clientName = client?.name || job.clientId;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col h-full">
      <div className="p-6 flex-grow flex flex-col">
        <div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{job.category}</p>
            <p className="text-xs text-gray-600 mt-1">Cliente: {clientName}</p>
        </div>
        <p className="mt-2 text-gray-700 text-sm flex-grow line-clamp-3">{job.description}</p>
        <div className="mt-4">
            <JobTimeline job={job} />
        </div>
      </div>
      <div className="px-6 pb-4 pt-2 bg-gray-50 border-t border-gray-100 space-y-2">
        
        {job.status === 'em_disputa' ? (
            <button onClick={onChat} className="w-full text-center py-2 px-4 border rounded-lg text-sm font-medium transition duration-300 border-transparent text-white bg-red-600 hover:bg-red-700">
                Ver Disputa
            </button>
        ) : (
            <>
                {job.status === 'agendado' && (
                    <button onClick={() => onUpdateStatus(job.id, 'a_caminho')} className="w-full text-center py-2 px-4 border rounded-lg text-sm font-medium transition duration-300 border-transparent text-white bg-cyan-600 hover:bg-cyan-700">
                        Estou a Caminho 🚚
                    </button>
                )}
                {job.status === 'a_caminho' && (
                    <button onClick={() => onUpdateStatus(job.id, 'em_progresso')} className="w-full text-center py-2 px-4 border rounded-lg text-sm font-medium transition duration-300 border-transparent text-white bg-yellow-500 hover:bg-yellow-600">
                        Iniciar Serviço 🛠️
                    </button>
                )}

                <button onClick={onChat} className="w-full text-center py-2 px-4 border rounded-lg text-sm font-medium transition duration-300 border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                Abrir Chat com Cliente
                </button>
            </>
        )}
      </div>
    </div>
  );
};

export default ProviderJobCard;
