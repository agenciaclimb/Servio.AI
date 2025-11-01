import React, { useState, useMemo } from 'react';
import { Job, Proposal, User } from '../../types';

type ProposalStatusFilter = 'enviada' | 'aprovada' | 'agendada' | 'em_execucao' | 'rejeitada';

interface ProviderProposalManagerProps {
  proposals: Proposal[];
  jobs: Job[];
  user: User;
}

const ProposalCard: React.FC<{ proposal: Proposal; job?: Job; user: User }> = ({ proposal, job, user }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!job) return;
    setIsLoading(true);
    try {
      // Placeholder local até o endpoint existir
      const isSubscriber = user.subscription?.status === 'active';
      setAnalysis({
        pricingSuggestion: isSubscriber ? 'Como assinante, você pode oferecer um pacote premium.' : 'Considere oferecer um preço competitivo para ganhar experiência.',
        competitionAnalysis: 'Poucos prestadores verificados na sua região para esta categoria.',
        finalTip: 'Personalize sua mensagem destacando certificações e disponibilidade.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!job) return null;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-800">{job.category}</p>
          <p className="text-sm text-gray-500">Sua proposta: <span className="font-bold">R$ {proposal.price.toFixed(2)}</span></p>
        </div>
        <button onClick={handleAnalyze} disabled={isLoading} className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 disabled:opacity-50">
          {isLoading ? 'Analisando...' : 'Analisar com IA ✨'}
        </button>
      </div>
      {analysis && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
          {analysis.pricingSuggestion && (
            <div className="mb-2">
              <p><strong>Sugestão de Preço:</strong> {analysis.pricingSuggestion}</p>
              <p><strong>Concorrência:</strong> {analysis.competitionAnalysis}</p>
            </div>
          )}
          <p className="text-blue-800 bg-blue-50 p-2 rounded-md"><span className="font-bold">Dica da IA:</span> {analysis.finalTip}</p>
        </div>
      )}
    </div>
  );
};

const ProviderProposalManager: React.FC<ProviderProposalManagerProps> = ({ proposals, jobs, user }) => {
  const [activeTab, setActiveTab] = useState<ProposalStatusFilter>('enviada');

  const filteredProposals = useMemo(() => {
    switch (activeTab) {
      case 'enviada':
        return proposals.filter(p => p.status === 'pendente');
      case 'aprovada':
        return proposals.filter(p => p.status === 'aceita');
      case 'agendada':
        const acceptedJobIds = proposals.filter(p => p.status === 'aceita').map(p => p.jobId);
        return jobs.filter(j => j.status === 'agendado' && acceptedJobIds.includes(j.id));
      case 'em_execucao':
        const inProgressJobIds = proposals.filter(p => p.status === 'aceita').map(p => p.jobId);
        return jobs.filter(j => ['em_progresso', 'a_caminho'].includes(j.status) && inProgressJobIds.includes(j.id));
      case 'rejeitada':
        return proposals.filter(p => p.status === 'recusada');
      default:
        return [];
    }
  }, [activeTab, proposals, jobs]);

  const tabs: { id: ProposalStatusFilter; label: string }[] = [
    { id: 'enviada', label: 'Enviadas' },
    { id: 'aprovada', label: 'Aprovadas' },
    { id: 'agendada', label: 'Agendadas' },
    { id: 'em_execucao', label: 'Em Execução' },
    { id: 'rejeitada', label: 'Rejeitadas' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Minhas Propostas</h2>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6 space-y-4">
        {filteredProposals.length > 0 ? (
          filteredProposals.map(item => {
            // 'item' pode ser uma Proposta ou um Job
            if ('price' in item) { // É uma Proposal
              const job = jobs.find(j => j.id === item.jobId);
              return <ProposalCard key={item.id} proposal={item} job={job} user={user} />;
            } else { // É um Job
              const proposal = proposals.find(p => p.jobId === item.id && p.status === 'aceita');
              if (!proposal) return null;
              return <ProposalCard key={proposal.id} proposal={proposal} job={item} user={user} />;
            }
          })
        ) : (
          <p className="text-center text-gray-500 py-8">Nenhuma proposta nesta categoria.</p>
        )}
      </div>
    </div>
  );
};

export default ProviderProposalManager;