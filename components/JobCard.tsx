import React, { useState } from 'react';
import { Job, ServiceType, Bid } from '../types';
import JobFAQModal from './JobFAQModal';

interface JobCardProps {
  job: Job;
  bids: Bid[];
  onProposeClick: () => void;
  hasProposed: boolean;
}

const categoryDetails: { [key: string]: { name: string, icon: string } } = {
    'limpeza': { name: 'Limpeza', icon: '✨' },
    'reparos': { name: 'Reparos', icon: '🔧' },
    'aulas': { name: 'Aulas', icon: '🎓' },
    'eventos': { name: 'Eventos', icon: '🎉' },
    'design': { name: 'Design', icon: '🎨' },
    'saude': { name: 'Saúde', icon: '❤️' },
    'default': { name: 'Serviço', icon: '💼' },
};

const serviceTypeDetails: { [key in ServiceType]: { text: string, className: string, icon: string } } = {
    'personalizado': { text: 'Personalizado', className: 'bg-purple-100 text-purple-800', icon: '📝' },
    'tabelado': { text: 'Tabelado', className: 'bg-green-100 text-green-800', icon: '💰' },
    'diagnostico': { text: 'Diagnóstico', className: 'bg-yellow-100 text-yellow-800', icon: '🔍' },
};

const timeAgo = (dateIso: string): string => {
  const date = new Date(dateIso);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "agora mesmo";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
};

const JobCard: React.FC<JobCardProps> = ({ job, bids, onProposeClick, hasProposed }) => {
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const category = categoryDetails[job.category] || categoryDetails['default'];
  const serviceType = serviceTypeDetails[job.serviceType];
  const isAuction = job.jobMode === 'leilao';

  const lowestBid = isAuction && bids.length > 0
    ? Math.min(...bids.map(b => b.amount))
    : null;

  return (
    <>
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300">
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start">
            <div className='flex-grow'>
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{category.name}</p>
                </div>
            </div>
             <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${isAuction ? 'bg-orange-100 text-orange-800' : serviceType.className}`}>
                {isAuction ? '⚖️ Leilão' : <>{serviceType.icon} <span className="ml-1.5">{serviceType.text}</span></>}
             </span>
        </div>
        
        {isAuction ? (
            <div className="mt-4 text-center bg-orange-50 p-3 rounded-lg border border-orange-200">
                <p className="text-sm font-semibold text-orange-800">Menor Lance Atual</p>
                <p className="text-2xl font-bold text-orange-700">
                    {lowestBid ? lowestBid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Nenhum lance'}
                </p>
            </div>
        ) : (
            job.serviceType === 'tabelado' && job.fixedPrice && (
                <div className="mt-4 text-center bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-green-800">Preço Fixo</p>
                    <p className="text-2xl font-bold text-green-700">{job.fixedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            )
        )}
        
        <p className="mt-4 text-gray-700 text-sm flex-grow line-clamp-4">
            {job.description}
        </p>

      </div>
      <div className="px-6 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
            <span>Publicado {timeAgo(job.createdAt)}</span>
             {!isAuction && (
                <button onClick={() => setIsFaqOpen(true)} className="font-semibold text-blue-600 hover:underline">
                    FAQ Rápida ✨
                </button>
             )}
        </div>
        
        <button 
          onClick={onProposeClick}
          disabled={hasProposed && isAuction}
          className="w-full text-center py-2 px-4 border rounded-lg text-sm font-medium transition duration-300
                     disabled:bg-green-100 disabled:text-green-700 disabled:border-green-200 disabled:cursor-not-allowed
                     border-transparent text-white bg-blue-600 hover:bg-blue-700"
        >
          {isAuction ? (hasProposed ? 'Você deu o menor lance ✓' : 'Dar Lance') : (hasProposed ? 'Proposta Enviada ✓' : 'Enviar Proposta')}
        </button>
      </div>
    </div>
    {isFaqOpen && <JobFAQModal job={job} onClose={() => setIsFaqOpen(false)} />}
    </>
  );
};

export default JobCard;