import React, { useState, useEffect } from 'react';
import { Job, User } from '../../types';
import LoadingSpinner from './LoadingSpinner';

interface ProposalAssistantProps {
  job: Job;
  provider: User;
  onClose: () => void;
  onStartProposal: (jobId: string, draft: string) => void;
}

interface Insights {
  pricingSuggestion: string;
  clientInsights: string;
  messageDraft: string;
}

const ProposalAssistant: React.FC<ProposalAssistantProps> = ({ job, provider, onClose, onStartProposal }) => {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    const synthesizeInsights = async () => {
      setIsLoading(true);
      try {
        // Simple heuristic-based placeholder to avoid external API dependency during dev
        const suggestedPrice = (() => {
          const base = 100;
          const complexity = Math.min(3, Math.ceil((job.description?.length || 0) / 80));
          return base * (1 + 0.25 * complexity);
        })();

        const pricingSuggestion = `Sugestão inicial: R$ ${suggestedPrice.toFixed(2)}. Ajuste conforme distância, urgência e materiais.`;
        const clientInsights = `Categoria: ${job.category}. Cliente parece buscar ${job.description?.slice(0, 80) || 'serviço específico'}...`;
        const messageDraft = `Olá! Vi seu anúncio de ${job.category} e posso ajudar. Tenho experiência com ${job.category.toLowerCase()} e disponibilidade nas próximas 48h. Posso te enviar um orçamento detalhado após confirmar alguns detalhes (endereço, horário e escopo). Obrigado!`;

        const data: Insights = { pricingSuggestion, clientInsights, messageDraft };
        // Simulate latency
        await new Promise((r) => setTimeout(r, 300));
        setInsights(data);
      } catch (error) {
        console.error('Failed to synthesize insights:', error);
      } finally {
        setIsLoading(false);
      }
    };
    synthesizeInsights();
  }, [job, provider]);

  const handleCopyDraft = () => {
    if (insights?.messageDraft) {
      navigator.clipboard.writeText(insights.messageDraft);
      setCopySuccess('Copiado!');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl m-4 transform transition-all max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="relative p-6 border-b border-gray-200">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Assistente de Proposta IA ✨</h2>
          <p className="text-sm text-gray-500 mt-1">Análise da oportunidade: {job.category}</p>
        </header>

        <main className="flex-grow overflow-y-auto p-6 space-y-6">
          {isLoading ? <LoadingSpinner /> : !insights ? <p>Não foi possível carregar a análise.</p> : (
            <>
              <div>
                <h3 className="font-semibold text-gray-700">💡 Sugestão de Preço</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md mt-1 border">{insights.pricingSuggestion}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">👤 Sobre o Cliente</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md mt-1 border">{insights.clientInsights}</p>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700">✍️ Rascunho de Mensagem</h3>
                  <button onClick={handleCopyDraft} className="text-xs font-medium text-blue-600 hover:underline">{copySuccess || 'Copiar'}</button>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md mt-1 border whitespace-pre-wrap">{insights.messageDraft}</p>
              </div>
            </>
          )}
        </main>

        <footer className="p-4 bg-gray-50 border-t border-gray-200 text-right rounded-b-2xl">
          <button
            onClick={() => onStartProposal(job.id, insights?.messageDraft || '')}
            disabled={isLoading || !insights}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Criar Proposta
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ProposalAssistant;