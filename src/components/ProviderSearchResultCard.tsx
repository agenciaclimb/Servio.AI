// FIX: Create the ProviderSearchResultCard component
import React from 'react';

// Extend ProviderProfile to include jobsCompleted
interface ProviderProfile {
  id: string;
  name: string;
  service: string;
  location: string;
  rating: number;
  jobsCompleted: number; // New field
  bio: string;
  headline: string;
}

interface ProviderSearchResultCardProps {
  provider: ProviderProfile;
  onViewProfile: () => void;
  onContact: () => void;
}

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg className={`w-4 h-4 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const ProviderSearchResultCard: React.FC<ProviderSearchResultCardProps> = ({ provider, onViewProfile, onContact }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon key={i} filled={i < Math.round(rating)} />
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300">
      <div className="p-6 flex-grow">
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{provider.service}</p>
        <h3 className="block mt-1 text-lg leading-tight font-bold text-black">{provider.name}</h3>
        <p className="mt-2 text-gray-500 text-sm">{provider.location}</p>

        <div className="flex items-center mt-3 text-xs text-gray-600 space-x-4">
            <div className="flex items-center">
                {renderStars(provider.rating)}
                <span className="font-semibold ml-1.5">{provider.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center">
                 <svg className="w-4 h-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                <span className="font-semibold">{provider.jobsCompleted}</span>
                <span className="ml-1">jobs concluídos</span>
            </div>
        </div>

        <p className="mt-4 text-gray-600 text-sm flex-grow line-clamp-3">
          {provider.bio || 'Este profissional ainda não adicionou uma biografia.'}
        </p>
      </div>

      <div className="px-6 pb-4 pt-2 bg-gray-50 border-t border-gray-100 flex items-center space-x-3">
        <button
          onClick={onViewProfile}
          className="flex-1 text-center py-2 px-4 border rounded-lg text-sm font-medium transition duration-300 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          Ver Perfil
        </button>
        <button
          onClick={onContact}
          className="flex-1 text-center py-2 px-4 border rounded-lg text-sm font-medium transition duration-300 border-transparent text-white bg-blue-600 hover:bg-blue-700"
        >
          Contatar
        </button>
      </div>
    </div>
  );
};

export default ProviderSearchResultCard;
