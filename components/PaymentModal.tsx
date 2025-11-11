import React, { useState } from 'react';
import { getModalOverlayProps, getModalContentProps } from './utils/a11yHelpers';
import type { Job, Proposal, User } from '../types';

interface PaymentModalProps {
  job: Job;
  proposal: Proposal;
  provider: User;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (proposal: Proposal) => Promise<void>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ job, proposal, provider, isOpen, onClose, onConfirmPayment }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirmPayment(proposal);
      // A navegação será tratada pela função onConfirmPayment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      setIsLoading(false);
    }
  };

  return (
    <div {...getModalOverlayProps(onClose)} className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div {...getModalContentProps()} className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4 transform transition-all" data-testid="payment-modal">
        <div className="relative p-8 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">&times;</button>
          
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800">Finalizar Pagamento</h2>
          <p className="text-gray-600 mt-2">Você está contratando <span className="font-semibold">{provider.name}</span> para o serviço de <span className="font-semibold">{job.category}</span>.</p>

          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-gray-900">Total a pagar:</span>
              <span className="font-bold text-blue-600">{proposal.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>

          <div className="mt-6 text-left bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-bold text-yellow-800 text-sm mb-2">🔒 Como funciona o Pagamento Seguro:</h4>
            <ul className="space-y-1 text-xs text-yellow-700 list-disc list-inside">
              <li>Seu dinheiro fica bloqueado com segurança na plataforma.</li>
              <li>Você aprova a liberação para o profissional somente após a conclusão do serviço.</li>
              <li>Em caso de problema, você pode abrir uma disputa para nossa equipe mediar.</li>
            </ul>
          </div>

          {error && (
            <div className="mt-4 text-center p-3 bg-red-100 text-red-700 rounded-lg">
              <p className="font-semibold">Erro ao processar pagamento</p>
              <p className="text-sm">{error} Tente novamente.</p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-3 text-sm font-medium rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">
              Cancelar
            </button>
            <button onClick={handlePayment} disabled={isLoading} className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center">
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </>
              ) : 'Pagar com Stripe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;