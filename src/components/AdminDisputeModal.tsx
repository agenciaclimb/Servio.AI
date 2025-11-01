import React, { useState, useEffect, useRef } from 'react';
import { Job, Dispute, User } from '../../types';
import { mediateDispute } from '../../services/geminiService';

interface AdminDisputeModalProps {
  job: Job;
  dispute: Dispute;
  client: User;
  provider: User;
  onClose: () => void;
  onResolve: (jobId: string, disputeId: string, resolution: Dispute['resolution']) => void;
}

type AIAnalysis = { summary: string; analysis: string; suggestion: string; };

const AdminDisputeModal: React.FC<AdminDisputeModalProps> = ({ job, dispute, client, provider, onClose, onResolve }) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [dispute.messages]);

  const handleAnalyze = async () => {
    setIsLoadingAnalysis(true);
    setAiAnalysis(null);
    try {
      const result = await mediateDispute(dispute.messages, client.name, provider.name);
      setAiAnalysis(result);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Falha ao analisar disputa.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };
  
  const handleResolution = (outcome: 'reembolsado' | 'liberado') => {
      const reason = aiAnalysis?.suggestion || `Decisão manual do administrador baseada na conversa.`;
      onResolve(job.id, dispute.id, {
          decidedBy: 'admin',
          outcome: outcome,
          reason,
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl m-4 transform transition-all h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="relative p-4 border-b border-red-200 bg-red-50 flex-shrink-0">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-lg font-bold text-red-800">Mediar Disputa</h2>
            <p className="text-sm text-red-600 truncate">Job: {job.id}</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 flex-grow min-h-0">
            {/* Chat History */}
            <div className="flex flex-col border-r border-gray-200">
                <h3 className="p-3 text-sm font-semibold text-gray-700 bg-slate-100 border-b">Histórico da Conversa</h3>
                <main className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {dispute.messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.senderId === client.email ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${msg.senderId === client.email ? 'bg-gray-200 text-gray-800' : 'bg-blue-600 text-white'}`}>
                                <p className="font-bold text-xs mb-1">{msg.senderId === client.email ? client.name : provider.name}</p>
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </main>
            </div>
            {/* AI Analysis & Actions */}
            <div className="flex flex-col">
                <h3 className="p-3 text-sm font-semibold text-gray-700 bg-slate-100 border-b">Análise e Ações</h3>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {!aiAnalysis && !isLoadingAnalysis && (
                         <button onClick={handleAnalyze} className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700">
                            Analisar com IA ✨
                        </button>
                    )}
                    {isLoadingAnalysis && <p className="text-center animate-pulse">Analisando disputa...</p>}
                    {aiAnalysis && (
                        <div className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-bold text-gray-800">Resumo da IA</h4>
                                <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md border">{aiAnalysis.summary}</p>
                            </div>
                             <div>
                                <h4 className="font-bold text-gray-800">Análise da IA</h4>
                                <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md border">{aiAnalysis.analysis}</p>
                            </div>
                             <div className="!mt-6">
                                <h4 className="font-bold text-blue-800 bg-blue-50 p-2 rounded-md">Sugestão da IA</h4>
                                <p className="mt-1 text-blue-700 font-semibold p-3 border-l-4 border-blue-500">{aiAnalysis.suggestion}</p>
                            </div>
                        </div>
                    )}
                </div>
                <footer className="p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 space-x-4 text-right">
                    <button onClick={() => handleResolution('reembolsado')} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">
                        Reembolsar Cliente
                    </button>
                     <button onClick={() => handleResolution('liberado')} className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700">
                        Liberar Pagamento
                    </button>
                </footer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDisputeModal;
