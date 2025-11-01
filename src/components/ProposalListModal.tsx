
import React from 'react';
import { Job, Proposal, User } from '../../types';
import ProposalDetailCard from './ProposalDetailCard';

interface ProposalListModalProps {
  job: Job;
  proposals: Proposal[];
  users: User[];
  onClose: () => void;
  onAcceptProposal: (proposalId: string) => void;
  onViewProfile: (userId: string) => void;
}

const ProposalListModal: React.FC<ProposalListModalProps> = ({ job, proposals, users, onClose, onAcceptProposal, onViewProfile }) => {
  const isJobDecided = job.status !== 'ativo';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-3xl m-4 transform transition-all h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="relative p-6 border-b border-gray-200">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-xl font-bold text-gray-800">Propostas para: <span className="text-blue-600">{job.category}</span></h2>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{job.description}</p>
        </header>
        
        <main className="flex-grow overflow-y-auto p-6 space-y-4">
            {proposals.filter(p => p.status !== 'bloqueada').length > 0 ? (
                proposals
                    .filter(p => p.status !== 'bloqueada')
                    .sort((a,b) => a.price - b.price) // Sort by price, lowest first
                    .map(proposal => {
                        const provider = users.find(u => u.email === proposal.providerId);
                        return (
                            <ProposalDetailCard 
                                key={proposal.id} 
                                proposal={proposal} 
                                provider={provider}
                                onAccept={onAcceptProposal}
                                isJobDecided={isJobDecided}
                                onViewProfile={onViewProfile}
                            />
                        )
                    })
            ) : (
                <div className="text-center py-16">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma proposta recebida</h3>
                    <p className="mt-1 text-sm text-gray-500">Aguarde um pouco. Os prestadores foram notificados sobre seu job.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default ProposalListModal;