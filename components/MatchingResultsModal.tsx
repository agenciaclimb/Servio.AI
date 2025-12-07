import React, { useState } from 'react';
import { getModalOverlayProps, getModalContentProps } from './utils/a11yHelpers';
import { MatchingResult } from '../types';
import ProviderCard from './ProviderCard';

interface MatchingResultsModalProps {
  results: MatchingResult[];
  onClose: () => void;
  onInvite: (providerId: string) => void;
}

const MatchingResultsModal: React.FC<MatchingResultsModalProps> = ({
  results,
  onClose,
  onInvite,
}) => {
  const [invitedProviders, setInvitedProviders] = useState<string[]>([]);

  const handleInvite = (providerId: string) => {
    onInvite(providerId);
    setInvitedProviders(prev => [...prev, providerId]);
  };

  return (
    <div
      {...getModalOverlayProps(onClose)}
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
    >
      <div
        {...getModalContentProps()}
        className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-4xl m-4 transform transition-all h-[90vh] flex flex-col"
      >
        <header className="relative p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Profissionais Recomendados</h2>
          <p className="text-sm text-gray-600 mt-1">
            Encontramos os melhores profissionais para o seu serviço. Você pode convidá-los para
            enviar uma proposta.
          </p>
        </header>

        <main className="flex-grow overflow-y-auto p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map(result => (
              <ProviderCard
                key={result.provider.id}
                result={result}
                onInvite={handleInvite}
                isInvited={invitedProviders.includes(result.provider.id)}
              />
            ))}
          </div>
        </main>

        <footer className="p-4 bg-gray-100 border-t border-gray-200 text-right rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default MatchingResultsModal;
