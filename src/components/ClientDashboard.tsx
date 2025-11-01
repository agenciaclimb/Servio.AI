import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import ItemCard from './ItemCard';

const ClientDashboard: React.FC = () => {
  const {
    currentUser,
    jobs,
    items,
    handleLogout,
    setIsWizardOpen,
    setMapJobId,
    setIsAddItemModalOpen,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'jobs' | 'items'>('jobs');

  if (!currentUser) return null; // Should be handled by ProtectedRoute, but good practice

  const clientJobs = jobs.filter(job => job.clientId === currentUser.email);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'em_progresso': return 'bg-blue-100 text-blue-800';
      case 'ativo': return 'bg-yellow-100 text-yellow-800';
      case 'em_disputa': return 'bg-red-100 text-red-800';
      case 'agendado': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bem-vinda, {currentUser.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie seus serviços e itens.</p>
        </div>
        <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">Sair</button>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('jobs')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'jobs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            Meus Serviços
          </button>
          <button onClick={() => setActiveTab('items')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'items' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            Meus Itens
          </button>
        </nav>
      </div>

      {activeTab === 'jobs' && (
        <>
          <div className="mb-6">
            <button onClick={() => setIsWizardOpen(true)} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              Solicitar Novo Serviço
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="space-y-4">
              {clientJobs.length > 0 ? clientJobs.map(job => (
                <div key={job.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900/50">
                  <div className="flex justify-between items-center" >
                    <Link to={`/job/${job.id}`} className="flex-grow">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{job.category}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs sm:max-w-md">{job.description}</p>
                      </div>
                    </Link>
                    <div className="flex items-center space-x-4 ml-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                      {job.providerId && ['agendado', 'em_progresso', 'concluido'].includes(job.status) && (
                        <button onClick={() => setMapJobId(job.id)} className="text-sm font-medium text-blue-600 hover:underline">Ver no Mapa</button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-500 py-4">Você ainda não solicitou nenhum serviço.</p>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'items' && (
        <>
          <div className="mb-6">
            <button onClick={() => setIsAddItemModalOpen(true)} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              Adicionar Novo Item
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map(item => (
              <ItemCard key={item.id} item={item} onClick={() => alert(`Abrir detalhes do item: ${item.name}`)} />
            ))}
          </div>
          {items.length === 0 && <p className="text-center text-gray-500 py-8">Você ainda não cadastrou nenhum item.</p>}
        </>
      )}
    </div>
  );
};

export default ClientDashboard;