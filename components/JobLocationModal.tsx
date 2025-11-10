import React from 'react';
import { Job, User } from '../types';
import LocationMap from './LocationMap';

interface JobLocationModalProps {
  job: Job;
  client: User;
  provider: User;
  onClose: () => void;
}

const JobLocationModal: React.FC<JobLocationModalProps> = ({ job, client, provider, onClose }) => {
  
  const mapLocations = [
    { id: 'client', name: client.location, type: 'job' as const },
    { id: 'provider', name: provider.location, type: 'provider' as const }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <header className="relative p-6 border-b border-gray-200">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-xl font-bold text-gray-800">Localização do Serviço</h2>
            <p className="text-sm text-gray-600 mt-1">Visão geral da rota entre o cliente e o prestador.</p>
        </header>
        
        <main className="p-6">
            <LocationMap locations={mapLocations} />
             <div className="mt-4 text-center bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                    <span className="font-bold">Aviso de Privacidade:</span> As localizações no mapa são aproximadas para proteger a privacidade. O endereço exato do serviço está disponível no chat.
                </p>
            </div>
        </main>
      </div>
    </div>
  );
};

export default JobLocationModal;
