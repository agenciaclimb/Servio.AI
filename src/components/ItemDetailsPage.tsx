import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MaintainedItem, Job, User } from '../../types';
import LoadingSpinner from './LoadingSpinner';

interface ItemDetailsPageProps {
  currentUser: User;
  authToken: string | null;
}

const ItemDetailsPage: React.FC<ItemDetailsPageProps> = ({ currentUser, authToken }) => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<MaintainedItem | null>(null);
  const [history, setHistory] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestion, setSuggestion] = useState<{ suggestionTitle: string; jobDescription: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!itemId || !authToken) return;
      setIsLoading(true);
      try {
        const [itemResponse, historyResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_BACKEND_API_URL}/maintained-items/${itemId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          }),
          fetch(`${import.meta.env.VITE_BACKEND_API_URL}/maintained-items/${itemId}/history`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          }),
        ]);
        const itemData = await itemResponse.json();
        const historyData = await historyResponse.json();
        setItem(itemData);
        setHistory(historyData);

        // Fetch AI suggestion
        const suggestionResponse = await fetch(`${import.meta.env.VITE_AI_API_URL}/api/suggest-maintenance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ item: itemData }),
        });
        setSuggestion(await suggestionResponse.json());

      } catch (error) {
        console.error("Failed to fetch item details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [itemId, authToken]);

  if (isLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  if (!item) return <div className="text-center p-8">Item não encontrado.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-blue-600 hover:text-blue-500 mb-4">&larr; Voltar</button>
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row gap-8">
          <img src={item.imageUrl} alt={item.name} className="w-full md:w-1/3 h-auto object-cover rounded-lg" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-gray-500">{item.category}</p>
            {item.brand && <p className="text-sm"><strong>Marca:</strong> {item.brand}</p>}
            {item.model && <p className="text-sm"><strong>Modelo:</strong> {item.model}</p>}
            {item.serialNumber && <p className="text-sm"><strong>Nº de Série:</strong> {item.serialNumber}</p>}
          </div>
        </div>

        {suggestion && (
            <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <h4 className="font-bold text-blue-800">💡 Sugestão da IA: {suggestion.suggestionTitle}</h4>
                <p className="text-sm text-blue-700 mt-1">{suggestion.jobDescription}</p>
            </div>
        )}

        <div className="mt-8 pt-6 border-t">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Histórico de Serviços</h2>
          <div className="space-y-4">
            {history.length > 0 ? history.map(job => (
              <Link to={`/job/${job.id}`} key={job.id} className="block p-4 border rounded-lg hover:bg-gray-50">
                <p className="font-semibold">{job.category}</p>
                <p className="text-sm text-gray-500">Status: {job.status} | Prestador: {job.providerId || 'N/A'}</p>
              </Link>
            )) : <p className="text-center text-gray-500 py-4">Nenhum serviço registrado para este item.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsPage;