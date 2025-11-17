import React, { useState } from 'react';
import { getModalOverlayProps, getModalContentProps } from './utils/a11yHelpers';
import { Job, User } from '../types';
import { generateProposalMessage } from '../services/geminiService';

interface ProposalModalProps {
  job: Job;
  provider: User;
  onClose: () => void;
  onSubmit: (proposalData: { message: string; price: number }) => void;
}

const ProposalModal: React.FC<ProposalModalProps> = ({ job, provider, onClose, onSubmit }) => {
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState<string>(job.fixedPrice?.toString() || '');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const isFixedPrice = job.serviceType === 'tabelado';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Por favor, insira um valor válido.');
      return;
    }

    onSubmit({ message, price: numericPrice });
  };

  const handleGenerateMessage = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const generatedMessage = await generateProposalMessage(job, provider);
      setMessage(generatedMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div {...getModalOverlayProps(onClose)} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div {...getModalContentProps()} className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 transform transition-all">
        <div className="relative p-8">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Enviar Proposta</h2>
            <p className="text-gray-600 mb-4">Para o job: <span className="font-semibold text-gray-700">{job.category}</span></p>

            <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
              <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      {isFixedPrice ? 'Valor Fixo do Serviço (R$)' : 'Seu Orçamento (R$)'}
                    </label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-600 sm:text-sm">R$</span>
                      </div>
                      <input 
                        type="number" 
                        id="price" 
                        required 
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)} 
                        className="block w-full rounded-md border-gray-300 pl-10 pr-4 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 disabled:bg-gray-100 disabled:cursor-not-allowed" 
                        placeholder="150.00"
                        step="0.01"
                        disabled={isFixedPrice}
                      />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="message"  className="block text-sm font-medium text-gray-700">Mensagem</label>
                        <button 
                            type="button" 
                            onClick={handleGenerateMessage}
                            disabled={isGenerating}
                            className="flex items-center space-x-1 px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8
 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Gerando...</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" transform="rotate(45 10 10)" /></svg>
                                    <span>Gerar com IA</span>
                                </>
                            )}
                        </button>
                    </div>
                    <textarea 
                      id="message" 
                      rows={5} 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Apresente-se e explique por que você é a pessoa certa para este trabalho."
                    />
                </div>
                
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                
                <div className="!mt-6">
                    <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Confirmar e Enviar Proposta
                    </button>
                </div>

                <div className="text-center mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                        <span className="font-bold">Dica de Segurança:</span> Mantenha todas as negociações e pagamentos dentro da SERVIO.AI para garantir sua proteção.
                    </p>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ProposalModal;