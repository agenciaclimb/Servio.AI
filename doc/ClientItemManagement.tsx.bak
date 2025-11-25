import React, { useState, useEffect } from 'react';
import { User, MaintainedItem } from '../types';
import ItemCard from './ItemCard';
import * as API from '../services/api';

interface ClientItemManagementProps {
  user: User;
  onAddItem: () => void;
}

const ClientItemManagement: React.FC<ClientItemManagementProps> = ({ user, onAddItem }) => {
  const [clientItems, setClientItems] = useState<MaintainedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClientItems = async () => {
      setIsLoading(true);
      try {
        // Assuming an API call to fetch items for a specific client
        const items = await API.fetchMaintainedItems(user.email);
        setClientItems(items);
      } catch (error) {
        console.error("Failed to fetch client items:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClientItems();
  }, [user.email]);

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-600 dark:text-gray-400">Carregando seus itens...</div>;
  }

  return (
    <>
      <div className="mb-6">
        <button onClick={onAddItem} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          Adicionar Novo Item
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {clientItems.map(item => (
          <ItemCard key={item.id} item={item} onClick={() => alert(`Abrir detalhes do item: ${item.name}`)} />
        ))}
      </div>
      {clientItems.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Você ainda não cadastrou nenhum item.</p>}
    </>
  );
};

export default ClientItemManagement;