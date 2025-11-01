import React from 'react';
import { Job, Proposal, JobStatus } from '../../types';

interface ClientJobCardProps {
  job: Job;
  proposals: Proposal[];
  onViewProposals: () => void;
  onChat: () => void;
  onFinalize: () => void;
  onReportIssue: () => void;
  onViewOnMap: (job: Job) => void;
}

const statusDetails: { [key in JobStatus]: { text: string; className: string; } } = {
    ativo: { text: 'Buscando Profissionais', className: 'bg-blue-100 text-blue-800' },
    em_leilao: { text: 'Em Leilão', className: 'bg-orange-100 text-orange-800' },
    proposta_aceita: { text: 'Profissional Contratado', className: 'bg-green-100 text-green-800' },
    agendado: { text: 'Serviço Agendado', className: 'bg-indigo-100 text-indigo-800' },
    a_caminho: { text: 'A Caminho', className: 'bg-cyan-100 text-cyan-800' },
    em_progresso: { text: 'Em Progresso', className: 'bg-yellow-100 text-yellow-800' },
    pagamento_pendente: { text: 'Aguardando Finalização', className: 'bg-orange-100 text-orange-800' },
    em_disputa: { text: 'Em Disputa', className: 'bg-red-200 text-red-800' },
    concluido: { text: 'Concluído', className: 'bg-gray-200 text-gray-800' },
    cancelado: { text: 'Cancelado', className: 'bg-red-100 text-red-800' },
};

const ClientJobCard: React.FC<ClientJobCardProps> = ({ job, proposals, onViewProposals, onChat, onFinalize, onReportIssue, onViewOnMap }) => {
  const status = statusDetails[job.status];
  const proposalCount = proposals.filter(p => p.status === 'pendente').length;
  const isAuction = job.jobMode === 'leilao';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col h-full">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{job.category}</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                {status.text}
            </span>
        </div>
        <p className="mt-2 text-gray-700 text-sm flex-grow line-clamp-3">{job.description}</p>
         {job.address && (
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <svg className="w-4 h-4 mr-1.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.1.4-.22.655-.364C11.888 18.01 12.872 17.5 14 16.5c1.128-1 2-2.304 2-3.5V6.5a1 1 0 00-1-1h-1.414a1 1 0 00-.707.293L10 8.586 7.121 5.707A1 1 0 006.414 5.5H5a1 1 0 00-1 1v6.5c0 1.196.872 2.5 2 3.5 1.128 1 2.112 1.51 2.692 1.933z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{job.address}</span>
          </div>
        )}
      </div>
      <div className="px-6 pb-4 pt-4 bg-gray-50 border-t border-gray-100 space-y-2">
        {job.status === 'ativo' && (
             <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">{proposalCount} Propostas</span>
                <button onClick={onViewProposals} className="text-blue-600 hover:underline font-medium" disabled={proposalCount === 0}>
                    Ver Propostas
                </button>
            </div>
        )}
        {job.status === 'em_leilao' && (
            <button onClick={onViewProposals} className="w-full text-center py-2 px-4 border rounded-lg text-sm font-medium transition duration-300 border-transparent text-white bg-orange-600 hover:bg-orange-700">
                Acompanhar Leilão ⚖️
            </button>
        )}
         {(job.status === 'proposta_aceita' || job.status === 'agendado' || job.status === 'a_caminho' || job.status === 'em_progresso') && (
            <div className="flex space-x-2">
                <button onClick={onChat} className="flex-1 text-center py-2 px-4 border rounded-lg text-sm font-medium transition duration-300 border-transparent text-white bg-blue-600 hover:bg-blue-700">
                    Chat
                </button>
                 <button onClick={() => onViewOnMap(job)} title="Ver no Mapa" className="flex-shrink-0 py-2 px-3 border rounded-lg text-sm font-medium transition duration-300 border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.1.4-.22.655-.364C11.888 18.01 12.872 17.5 14 16.5c1.128-1 2-2.304 2-3.5V6.5a1 1 0 0 0-1-1h-1.414a1 1 0 0 0-.707.293L10 8.586 7.121 5.707A1 1 0 0 0 6.414 5.5H5a1 1 0 0 0-1 1v6.5c0 1.196.872 2.5 2 3.5 1.128 1 2.112 1.51 2.692 1.933z" clipRule="evenodd" /></svg>
                </button>
            </div>
        )}
         {job.status === 'pagamento_pendente' && (
            <>
             <button onClick={onFinalize} className="w-full text-center py-2 px-4 border rounded-lg text-sm font-medium transition duration-300 border-transparent text-white bg-green-600 hover:bg-green-700">
                Finalizar e Avaliar
            </button>
             <button onClick={onReportIssue} className="w-full text-center py-2 px-4 mt-2 border rounded-lg text-sm font-medium transition duration-300 border-gray-300 bg-white text-red-600 hover:bg-red-50">
                Reportar um Problema
            </button>
            </>
        )}
        {job.status === 'em_disputa' && (
             <button onClick={onChat} className="w-full text-center py-2 px-4 border rounded-lg text-sm font-medium transition duration-300 border-transparent text-white bg-red-600 hover:bg-red-700">
                Ver Disputa
            </button>
        )}
        {(job.status === 'concluido' || job.status === 'cancelado') && !job.review && (
             <p className="text-xs text-center text-gray-500">Job finalizado sem avaliação.</p>
        )}
         {(job.status === 'concluido') && job.review && (
            <div className="text-center">
                 <p className="text-xs text-gray-500 mb-1">Sua avaliação:</p>
                 <div className="flex items-center justify-center space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                         <svg key={i} className={`w-4 h-4 ${i < job.review!.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ClientJobCard;