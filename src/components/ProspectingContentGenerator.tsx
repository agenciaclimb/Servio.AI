import React, { useState } from 'react';
import { api } from '../lib/api';
import LoadingSpinner from './LoadingSpinner';

interface ProspectingContentGeneratorProps {
  providerName: string;
  onClose: () => void;
}

const ProspectingContentGenerator: React.FC<ProspectingContentGeneratorProps> = ({ providerName, onClose }) => {
  const [serviceName, setServiceName] = useState('');
  const [postText, setPostText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName) return;
    setIsLoading(true);
    setPostText('');
    try {
      const response = await api.post('/generate-prospecting-post', { serviceName, providerName });
      setPostText(response.data.postText);
    } catch (error) {
      console.error("Failed to generate post:", error);
      setPostText('Desculpe, não foi possível gerar o conteúdo no momento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(postText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <header className="relative p-6 border-b border-gray-200">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Gerador de Conteúdo para Prospecção 📣</h2>
          <p className="text-sm text-gray-500 mt-1">Crie posts para suas redes sociais e atraia mais clientes.</p>
        </header>

        <main className="p-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="service-name" className="block text-sm font-medium text-gray-700">Qual serviço você quer promover?</label>
              <input
                type="text"
                id="service-name"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Ex: Instalação de ar condicionado"
              />
            </div>
            <button type="submit" disabled={isLoading || !serviceName} className="w-full py-2.5 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? 'Gerando...' : 'Gerar Post com IA ✨'}
            </button>
          </form>

          {postText && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">Sugestão de Post:</h3>
                <button onClick={handleCopy} className="text-xs font-medium text-blue-600 hover:underline">
                  {copySuccess ? 'Copiado!' : 'Copiar Texto'}
                </button>
              </div>
              <p className="text-sm text-gray-800 bg-gray-50 p-4 rounded-md border whitespace-pre-wrap">{postText}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProspectingContentGenerator;