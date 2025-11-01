import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { ProviderService } from '../../types';
import ProfileStrength from './ProfileStrength';
import ProfileTips from './ProfileTips';
import EarningsProfileCard from './EarningsProfileCard';
import BadgesShowcase from './BadgesShowcase';
import ServiceCatalogModal from './ServiceCatalogModal';

const ProviderDashboard: React.FC = () => {
  const {
    currentUser,
    jobs,
    handleLogout,
    authToken,
    handleSaveServiceCatalog,
  } = useAppContext();

  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  if (!currentUser) return null; // Should be handled by ProtectedRoute

  const myJobs = jobs.filter(job => job.providerId === currentUser.email && job.status !== 'concluido');
  const completedJobs = jobs.filter(job => job.providerId === currentUser.email && job.status === 'concluido');
  const openJobs = jobs.filter(job => !job.providerId && (job.status === 'ativo' || job.status === 'em_leilao'));

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'em_progresso': return 'bg-blue-100 text-blue-800';
      case 'ativo': return 'bg-yellow-100 text-yellow-800';
      case 'em_disputa': return 'bg-red-100 text-red-800';
      case 'em_leilao': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Olá, {currentUser.name.split(' ')[0]}!</h1>
          {(currentUser as any).earningsProfile && (
            <span className={`ml-2 px-3 py-1 text-xs font-bold rounded-full ${(currentUser as any).earningsProfile.tier === 'Ouro' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
              Nível {(currentUser as any).earningsProfile.tier}
            </span>
          )}
          <p className="text-gray-500 mt-1">Pronto para encontrar seu próximo serviço?</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-blue-600">Sair</button>
          <Link to={`/provider/${currentUser.email}`} className="text-sm font-medium text-blue-600 hover:underline">Ver meu perfil público</Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <ProfileStrength user={currentUser} />
        </div>
        <div>
          <EarningsProfileCard user={currentUser} authToken={authToken} />
        </div>
      </div>

      <ProfileTips user={currentUser} onEditProfile={() => alert('Abrir modal de edição de perfil.')} />

      {/* Badges Section */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Suas Medalhas</h2>
  <BadgesShowcase badges={(currentUser as any).badges || []} />
      </div>

      {/* Open Jobs Section */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Novas Oportunidades</h2>
        <div className="space-y-4">
          {openJobs.length > 0 ? openJobs.map(job => (
            <Link to={`/job/${job.id}`} key={job.id} className="block p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{job.category}</p>
                  <p className="text-sm text-gray-500 truncate max-w-xs sm:max-w-md">{job.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(job.status)}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">Ver Detalhes</span>
                </div>
              </div>
            </Link>
          )) : (
            <p className="text-center text-gray-500 py-4">Nenhuma nova oportunidade no momento.</p>
          )}
        </div>
      </div>

      {/* My Jobs Section */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Meus Serviços</h2>
        <div className="space-y-4">
          {myJobs.length > 0 ? myJobs.map(job => (
            <Link to={`/job/${job.id}`} key={job.id} className="block p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{job.category}</p>
                  <p className="text-sm text-gray-500 truncate max-w-xs sm:max-w-md">{job.description}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(job.status)}`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
            </Link>
          )) : (
            <p className="text-center text-gray-500 py-4">Você ainda não possui serviços em andamento.</p>
          )}
        </div>
      </div>

      {/* Earnings History Section */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Histórico de Ganhos</h2>
        <div className="space-y-3">
          {completedJobs.length > 0 ? completedJobs.map(job => (
            <div key={job.id} className="p-3 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-700">{job.category}</p>
                  <p className="text-xs text-gray-500">Concluído em: {new Date(((job as any).completedAt || job.createdAt)).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-lg">+ R$ {( (job as any).earnings?.providerShare ?? 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    ({(((job as any).earnings?.rate ?? 0) * 100).toFixed(0)}% de R$ {((((job as any).earnings?.providerShare ?? 0) + ((job as any).earnings?.platformShare ?? 0)).toFixed(2))})
                  </p>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-500 py-4">Você ainda não concluiu nenhum serviço.</p>
          )}
        </div>
      </div>

      {/* My Offered Services Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Meu Catálogo de Serviços</h2>
          <button onClick={() => setIsCatalogModalOpen(true)} className="text-sm font-medium text-blue-600 hover:underline">Gerenciar</button>
        </div>
        <div className="space-y-2">
          {currentUser.serviceCatalog && currentUser.serviceCatalog.length > 0 ? currentUser.serviceCatalog.map(service => (
            <div key={service.id} className="p-3 border dark:border-gray-600 rounded-lg">
              <p className="font-semibold">{service.name} ({service.type}) - {service.price ? `R$ ${service.price}` : 'Sob consulta'}</p>
            </div>
          )) : <p className="text-center text-gray-500 py-4">Você ainda não cadastrou nenhum serviço.</p>}
        </div>
      </div>

      {isCatalogModalOpen && (
        <ServiceCatalogModal 
          user={currentUser}
          onClose={() => setIsCatalogModalOpen(false)}
          onSave={(catalog) => {
            handleSaveServiceCatalog(catalog);
            setIsCatalogModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ProviderDashboard;