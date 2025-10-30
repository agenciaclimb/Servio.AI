
import React, { useState } from 'react';
import { Job, Proposal, User } from '../types';

interface PaymentModalProps {
  job: Job;
  proposal: Proposal;
  provider: User;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ job, proposal, provider, onClose, onPaymentSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const platformFee = proposal.price * 0.15;
  const providerReceives = proposal.price * 0.85;

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    // Simulate API call to payment gateway
    setTimeout(() => {
        onPaymentSuccess();
        setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="relative p-8">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Pagamento Seguro</h2>
                <p className="text-gray-500 mt-2">Você está contratando <span className="font-semibold text-gray-700">{provider.name}</span> para o serviço de <span className="font-semibold text-gray-700">{job.category}</span>.</p>
            </div>

            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Valor do serviço</span>
                    <span className="font-semibold text-gray-800">{proposal.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Taxa de serviço SERVIO.AI (15%)</span>
                    <span className="text-gray-600">{platformFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">O profissional recebe</span>
                    <span className="text-gray-600">{providerReceives.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total a pagar</span>
                    <span className="text-lg font-bold text-blue-600">{proposal.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
            </div>

            <div className="mt-6 text-center bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                        <span className="font-bold">Como funciona o Pagamento Seguro?</span> Seu pagamento fica retido com a SERVIO.AI e só é liberado para o profissional após você confirmar que o serviço foi concluído com sucesso.
                    </p>
            </div>

            <div className="mt-8">
                <button 
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Processando Pagamento...
                        </>
                    ) : (
                        `Pagar ${proposal.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} com Segurança`
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;