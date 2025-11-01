import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface LandingPageProps {
  onSearch: (query: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <div className="text-center py-20 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tighter">
            Problemas resolvidos.
            <span className="block text-blue-600">Simples assim.</span>
          </h1>
          <p className="mt-4 max-w-md mx-auto text-lg text-gray-500 dark:text-gray-400 sm:text-xl md:mt-5 md:max-w-3xl">
            Descreva sua necessidade. Nossa IA encontra o profissional perfeito, gerencia o pagamento e garante a qualidade do serviço.
          </p>
          
          <form onSubmit={handleSubmit} className="mt-10 max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-grow w-full px-5 py-4 text-base text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Meu chuveiro não esquenta mais e preciso de um conserto..."
              />
              <button type="submit" className="px-8 py-4 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Resolver com IA
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Ou <Link to="/provider/register" className="font-medium text-blue-600 hover:underline">seja um prestador de serviço</Link>.</p>
          </form>
        </div>
      </main>
      <footer className="text-center py-6 border-t dark:border-gray-700">
        <div className="space-x-6 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/terms" className="hover:underline">Termos de Serviço</Link>
          <Link to="/privacy" className="hover:underline">Política de Privacidade</Link>
          <span>© {new Date().getFullYear()} SERVIO.AI. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;