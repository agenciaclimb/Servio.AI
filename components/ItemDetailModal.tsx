import React from 'react';
import { MaintainedItem } from '../types';

interface ItemDetailModalProps {
  item: MaintainedItem;
  onClose: () => void;
  onServiceRequest: (item: MaintainedItem) => void;
}

const DetailRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{value || 'Não informado'}</dd>
    </div>
);


const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose, onServiceRequest }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl m-4 transform transition-all max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="relative p-6 border-b border-gray-200">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-xl font-bold text-gray-800">{item.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{item.category}</p>
        </header>
        
        <main className="flex-grow overflow-y-auto p-6">
            <div className="w-full h-56 bg-gray-200 rounded-lg overflow-hidden mb-6">
                 <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
            </div>
            
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Detalhes do Item</h3>
                <div className="mt-2 border-t border-gray-200">
                    <dl className="divide-y divide-gray-200">
                        <DetailRow label="Marca" value={item.brand} />
                        <DetailRow label="Modelo" value={item.model} />
                        <DetailRow label="Número de Série" value={item.serialNumber} />
                        <DetailRow label="Notas" value={item.notes} />
                    </dl>
                </div>
            </div>
            
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800">Histórico de Manutenção</h3>
                 <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-sm text-gray-500">Nenhum histórico de serviço encontrado na SERVIO.AI para este item.</p>
                </div>
            </div>
        </main>

        <footer className="p-4 bg-gray-50 border-t border-gray-200 text-right rounded-b-2xl">
            <button 
                onClick={() => onServiceRequest(item)}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
            >
                Solicitar Serviço para este Item
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ItemDetailModal;