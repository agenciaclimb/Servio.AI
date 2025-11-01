import React from 'react';
import { MatchingResult } from '../../types';

interface ProviderCardProps {
  result: MatchingResult;
  onInvite?: (providerId: string) => void;
  isInvited?: boolean;
}

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const ProviderCard: React.FC<ProviderCardProps> = ({ result, onInvite, isInvited }) => {
  const { provider, compatibilityScore, justification } = result;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon key={i} filled={i < Math.round(rating)} />
    ));
  };
  
  const scoreColorClass = compatibilityScore > 85 ? 'bg-green-100 text-green-800' : compatibilityScore > 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-start">
            <div className='flex-grow'>
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{provider.service}</p>
                <h3 className="block mt-1 text-xl leading-tight font-bold text-black">{provider.name}</h3>
                <p className="mt-2 text-gray-500 text-sm">{provider.location}</p>
            </div>
            <div className={`text-sm font-bold px-3 py-1 rounded-full ${scoreColorClass}`}>
                {compatibilityScore}%
                <span className="hidden sm:inline"> compatível</span>
            </div>
        </div>
        
        <div className="flex items-center mt-4">
            {renderStars(provider.rating)}
            <span className="text-gray-600 text-sm ml-2">{provider.rating.toFixed(1)} de 5 estrelas</span>
        </div>

        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-gray-700 text-sm italic">
                <span className="font-semibold text-gray-800 not-italic">Por que é uma boa escolha?</span> "{justification}"
            </p>
        </div>
        
        <div className="mt-6">
            {onInvite ? (
                <button
                    onClick={() => onInvite(provider.id)}
                    disabled={isInvited}
                    className="w-full font-bold py-2 px-4 rounded-lg transition duration-300
                                disabled:bg-green-100 disabled:border-green-200 disabled:text-green-700 disabled:cursor-not-allowed
                                bg-blue-600 text-white hover:bg-blue-700"
                >
                    {isInvited ? 'Convite Enviado ✓' : 'Convidar para o Job'}
                </button>
            ) : (
                <button className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300">
                    Ver Perfil
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;