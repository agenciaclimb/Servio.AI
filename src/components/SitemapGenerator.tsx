import React from 'react';
import { User } from '../types';

interface SitemapGeneratorProps {
  users: User[];
  serviceNameToCategory: { [key: string]: string };
  onClose: () => void;
}

const SitemapGenerator: React.FC<SitemapGeneratorProps> = ({ users, serviceNameToCategory, onClose }) => {
  const baseUrl = window.location.origin;

  const providerUrls = users
    .filter(u => u.type === 'prestador')
    .map(u => `${baseUrl}/?profile=${encodeURIComponent(u.email)}`);
  
  // Generate unique service and location URLs
  const services = new Set<string>();
  const serviceLocations = new Set<string>();
  const locations = new Set<string>();

  users.filter(u => u.type === 'prestador').forEach(u => {
    const category = serviceNameToCategory[u.headline || ''] || u.headline?.toLowerCase();
    if(category) {
        services.add(category);
        locations.add(u.location);
        serviceLocations.add(`${category}/${u.location}`);
    }
  });

  const serviceUrls = Array.from(services).map(s => `${baseUrl}/servico/${encodeURIComponent(s)}`);
  const serviceLocationUrls = Array.from(serviceLocations).map(sl => `${baseUrl}/servico/${encodeURIComponent(sl.split('/')[0])}/${encodeURIComponent(sl.split('/')[1])}`);

  const allUrls = [baseUrl, ...providerUrls, ...serviceUrls, ...serviceLocationUrls];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl m-4 transform transition-all h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="relative p-6 border-b border-gray-200">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-xl font-bold text-gray-800">Simulação do Sitemap</h2>
            <p className="text-sm text-gray-500 mt-1">Esta é uma lista de todas as URLs importantes que seriam enviadas ao Google.</p>
        </header>
        
        <main className="flex-grow overflow-y-auto p-6 font-mono text-sm bg-gray-50">
            <p className="text-gray-600 mb-4">// Total de {allUrls.length} URLs geradas</p>
            <div className="space-y-2">
                {allUrls.map(url => (
                    <div key={url} className="text-blue-700 break-words">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">{url}</a>
                    </div>
                ))}
            </div>
        </main>
        
        <footer className="p-4 bg-gray-100 border-t border-gray-200 text-right rounded-b-2xl">
            <button 
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
            >
                Fechar
            </button>
        </footer>
      </div>
    </div>
  );
};

export default SitemapGenerator;
