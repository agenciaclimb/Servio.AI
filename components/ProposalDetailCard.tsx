
import React from 'react';
import { Proposal, User } from '../types';

interface ProposalDetailCardProps {
  proposal: Proposal;
  provider?: User;
  onAccept: (proposalId: string) => void;
  isJobDecided: boolean;
  onViewProfile: (userId: string) => void;
}

const statusDetails: { [key in Proposal['status']]: { text: string; bg: string; text_color: string; border: string; } } = {
  pendente: { text: 'Pendente', bg: 'bg-yellow-50', text_color: 'text-yellow-800', border: 'border-yellow-200' },
  aceita: { text: 'Aceita', bg: 'bg-green-50', text_color: 'text-green-800', border: 'border-green-200' },
  recusada: { text: 'Recusada', bg: 'bg-gray-50', text_color: 'text-gray-600', border: 'border-gray-200' },
  bloqueada: { text: 'Bloqueada', bg: 'bg-red-50', text_color: 'text-red-800', border: 'border-red-200' },
};

const ProposalDetailCard: React.FC<ProposalDetailCardProps> = ({ proposal, provider, onAccept, isJobDecided, onViewProfile }) => {
  const statusKey = (proposal.status || 'pendente') as Proposal['status'];
  const status = statusDetails[statusKey];
  const isPending = statusKey === 'pendente';
  const providerName = provider?.name || proposal.providerId;

  return (
    <div className={`rounded-xl border ${status.border} ${status.bg} p-5 transition-all duration-300 ${proposal.status !== 'pendente' ? 'opacity-75' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-600">Proposta de:</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text_color}`}>
              {status.text}
            </span>
          </div>
          <button 
            onClick={() => onViewProfile(proposal.providerId)}
            className="font-bold text-gray-800 truncate text-left hover:text-blue-600 hover:underline"
            title={`Ver perfil de ${providerName}`}
          >
            {providerName}
          </button>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-6 text-left sm:text-right">
          <p className="text-sm font-semibold text-gray-600">Valor:</p>
          <p className="text-2xl font-bold text-blue-600">
            {proposal.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>
      
      {proposal.message && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 italic">"{proposal.message}"</p>
        </div>
      )}

      {isPending && !isJobDecided && (
        <div className="mt-5 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
          <button 
            onClick={() => onAccept(proposal.id)}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 transition"
            data-testid={`accept-proposal-${proposal.id}`}
          >
            Aceitar e Pagar com Segurança
          </button>
        </div>
      )}
    </div>
  );
};

export default ProposalDetailCard;