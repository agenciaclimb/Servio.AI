import React, { useState } from 'react';
import { User, ProviderService } from './types';

interface ServiceCatalogModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedCatalog: ProviderService[]) => void;
}

const ServiceCatalogModal: React.FC<ServiceCatalogModalProps> = ({ user, onClose, onSave }) => {
  const [catalog, setCatalog] = useState<ProviderService[]>(user.serviceCatalog || []);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceType, setNewServiceType] = useState<'tabelado' | 'personalizado' | 'diagnostico'>('personalizado');
  const [newServicePrice, setNewServicePrice] = useState('');

  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    const newService: ProviderService = {
      id: `service-${Date.now()}`,
      name: newServiceName,
      type: newServiceType,
      description: '', // Can be expanded later
      price: newServiceType === 'tabelado' ? parseFloat(newServicePrice) || 0 : undefined,
    };
    setCatalog(prev => [...prev, newService]);
    // Reset form
    setNewServiceName('');
    setNewServiceType('personalizado');
    setNewServicePrice('');
  };

  const handleRemoveService = (serviceId: string) => {
    setCatalog(prev => prev.filter(s => s.id !== serviceId));
  };

  const handleSave = () => {
    onSave(catalog);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl m-4 transform transition-all max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="relative p-8 flex-grow overflow-y-auto">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Gerenciar Catálogo de Serviços</h2>

          {/* Existing Services */}
          <div className="space-y-2 mb-6">
            {catalog.map(service => (
              <div key={service.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{service.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {service.type} - {service.price ? `R$ ${service.price.toFixed(2)}` : 'Sob consulta'}
                  </p>
                </div>
                <button onClick={() => handleRemoveService(service.id)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
              </div>
            ))}
          </div>

          {/* Add New Service Form */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-semibold">Adicionar Novo Serviço</h3>
            <input
              type="text"
              placeholder="Nome do Serviço (ex: Instalação de Chuveiro)"
              value={newServiceName}
              onChange={e => setNewServiceName(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:border-gray-600 shadow-sm"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={newServiceType} onChange={e => setNewServiceType(e.target.value as any)} className="block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:border-gray-600 shadow-sm">
                <option value="personalizado">Personalizado (sob consulta)</option>
                <option value="tabelado">Tabelado (preço fixo)</option>
                <option value="diagnostico">Diagnóstico (taxa de visita)</option>
              </select>
              {newServiceType === 'tabelado' && (
                <input
                  type="number"
                  placeholder="Preço (ex: 150.00)"
                  value={newServicePrice}
                  onChange={e => setNewServicePrice(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:border-gray-600 shadow-sm"
                />
              )}
            </div>
            <button onClick={handleAddService} className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              + Adicionar à Lista
            </button>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 px-8 py-4 rounded-b-2xl text-right flex-shrink-0">
          <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">Cancelar</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
            Salvar Catálogo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCatalogModal;