import React from 'react';
import { Job, User } from '../../types';

interface CompletedJobCardProps {
  job: Job;
  client?: User;
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

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const CompletedJobCard: React.FC<CompletedJobCardProps> = ({ job, client }) => {
    const { icon, name } = categoryDetails[job.category] || categoryDetails['default'];
    const clientName = client?.name || job.clientId;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xl">{icon}</span>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{name}</p>
                    </div>
                    <p className="text-sm text-gray-600">{job.description}</p>
                    <p className="text-xs text-gray-400 mt-2">Cliente: {clientName}</p>
                </div>
                {job.review && (
                    <div className="mt-4 sm:mt-0 sm:ml-6 text-left sm:text-right flex-shrink-0">
                         <p className="text-sm font-medium text-gray-600">Avaliação Recebida:</p>
                        <div className="flex items-center justify-start sm:justify-end space-x-1 mt-1">
                            {Array.from({ length: 5 }, (_, i) => (
                                <StarIcon key={i} filled={i < job.review.rating} />
                            ))}
                            <span className="text-sm font-bold text-gray-700">({job.review.rating.toFixed(1)})</span>
                        </div>
                    </div>
                )}
            </div>

            {job.review && job.review.comment && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 italic">
                        <span className="font-semibold not-italic text-gray-700">Comentário do cliente:</span> "{job.review.comment}"
                    </p>
                </div>
            )}
        </div>
    );
};

export default CompletedJobCard;