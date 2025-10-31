import React from 'react';
import { Link } from 'react-router-dom';
import { User, Job } from '../types';
import ProfileStrength from './ProfileStrength';
import ProfileTips from './ProfileTips';
import ServiceCatalogModal from './ServiceCatalogModal';

interface ProviderDashboardProps {
  user: User;
  jobs: Job[];
  onLogout: () => void;
  onSaveCatalog: (updatedCatalog: ProviderService[]) => void;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ user, jobs, onLogout, onSaveCatalog }) => {
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  // Jobs assigned to this provider
  const myJobs = jobs.filter(job => job.providerId === user.email);
  // Open jobs that are not assigned to anyone yet
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
          <h1 className="text-3xl font-bold text-gray-900">Olá, {user.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 mt-1">Pronto para encontrar seu próximo serviço?</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <button onClick={onLogout} className="text-sm font-medium text-gray-600 hover:text-blue-600">Sair</button>
          <Link to={`/provider/${user.email}`} className="text-sm font-medium text-blue-600 hover:underline">Ver meu perfil público</Link>
        </div>
      </header>

      {/* Profile Strength Section */}
      <ProfileStrength user={user} />

      {/* AI Profile Tip Section */}
      <ProfileTips user={user} onEditProfile={() => alert('Abrir modal de edição de perfil.')} />

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

      {/* My Offered Services Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Meu Catálogo de Serviços</h2>
          <button onClick={() => setIsCatalogModalOpen(true)} className="text-sm font-medium text-blue-600 hover:underline">Gerenciar</button>
        </div>
        <div className="space-y-2">
          {user.serviceCatalog && user.serviceCatalog.length > 0 ? user.serviceCatalog.map(service => (
            <div key={service.id} className="p-3 border dark:border-gray-600 rounded-lg">
              <p className="font-semibold">{service.name} ({service.type}) - {service.price ? `R$ ${service.price}` : 'Sob consulta'}</p>
            </div>
          )) : <p className="text-center text-gray-500 py-4">Você ainda não cadastrou nenhum serviço.</p>}
        </div>
      </div>

      {isCatalogModalOpen && (
        <ServiceCatalogModal 
          user={user}
          onClose={() => setIsCatalogModalOpen(false)}
          onSave={(catalog) => {
            onSaveCatalog(catalog);
            setIsCatalogModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ProviderDashboard;