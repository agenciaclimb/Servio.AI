import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../../types';
import { useAppContext } from '../contexts/AppContext';
import ProposalAssistant from './ProposalAssistant';

interface ProviderJobFunnelProps {
  openJobs: Job[];
  proposedJobs: Job[];
  inProgressJobs: Job[];
  paymentPendingJobs: Job[];
}

const FunnelColumn: React.FC<{ 
  title: string; 
  jobs: Job[]; 
  textColor: string; 
  onJobClick?: (job: Job) => void;
}> = ({ title, jobs, textColor, onJobClick }) => (
  <div className={`flex-1 min-w-[300px] bg-gray-50 rounded-xl p-4`}>
    <h3 className={`font-bold text-lg mb-4 ${textColor}`}>{title} ({jobs.length})</h3>
    <div className="space-y-3 h-[400px] overflow-y-auto pr-2">
      {jobs.map(job => (
        <div 
          key={job.id} 
          onClick={() => onJobClick ? onJobClick(job) : null} 
          className={`block p-4 bg-white rounded-lg shadow-sm border transition-all ${onJobClick ? 'cursor-pointer hover:border-blue-500 hover:shadow-md' : ''}`}
        >
          <p className="font-semibold text-gray-800">{job.category}</p>
          <p className="text-sm text-gray-500 truncate">{job.description}</p>
          <div className="text-xs text-gray-400 mt-2">Cliente: {job.clientId.split('@')[0]}</div>
        </div>
      ))}
    </div>
  </div>
);

const ProviderJobFunnel: React.FC<ProviderJobFunnelProps> = ({ openJobs, proposedJobs, inProgressJobs, paymentPendingJobs }) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const navigate = useNavigate();
  const { currentUser } = useAppContext();

  const handleJobClick = (job: Job) => {
    // Para colunas que não são de novas oportunidades, navega direto
    if (openJobs.find(j => j.id === job.id)) {
      setSelectedJob(job);
    } else {
      navigate(`/job/${job.id}`);
    }
  };

  const handleStartProposal = (jobId: string, draft: string) => {
    setSelectedJob(null);
    // Navega para a página do job, passando o rascunho da mensagem no estado
    navigate(`/job/${jobId}`, { state: { proposalDraft: draft } });
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Meu Funil de Negócios</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          <FunnelColumn title="🚀 Novas Oportunidades" jobs={openJobs} textColor="text-blue-800" onJobClick={handleJobClick} />
          <FunnelColumn title="✉️ Propostas Enviadas" jobs={proposedJobs} textColor="text-yellow-800" onJobClick={handleJobClick} />
          <FunnelColumn title="🛠️ Em Andamento" jobs={inProgressJobs} textColor="text-indigo-800" onJobClick={handleJobClick} />
          <FunnelColumn title="💰 Aguardando Pagamento" jobs={paymentPendingJobs} textColor="text-green-800" onJobClick={handleJobClick} />
        </div>
      </div>
      {selectedJob && currentUser && (
        <ProposalAssistant
          job={selectedJob}
          provider={currentUser}
          onClose={() => setSelectedJob(null)}
          onStartProposal={handleStartProposal}
        />
      )}
    </>
  );
};

export default ProviderJobFunnel;
