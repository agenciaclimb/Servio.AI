/* @ts-nocheck
  Deprecated orphaned file kept as a placeholder to avoid build errors. Not used by the app.
*/
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function SentimentAlerts() { return null; }

/* const SentimentAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<SentimentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/sentiment-alerts');
        // Filtra para mostrar apenas alertas novos
        setAlerts(response.data.filter((a: SentimentAlert) => a.status === 'novo'));
        setError(null);
      } catch (err) {
        console.error("Failed to fetch sentiment alerts:", err);
        setError("Falha ao carregar os alertas de sentimento.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleReviewClick = (jobId: string) => {
    // Navega para a página de detalhes do job, que contém o chat
    navigate(`/job/${jobId}`);
  };

  if (loading) {
    return <div className="text-center p-4">Carregando alertas...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <AlertTriangle className="mr-2 text-yellow-500" />
          Alertas de Sentimento
        </h3>
        <p className="text-gray-600 dark:text-gray-400">Nenhum alerta de risco de disputa no momento.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <AlertTriangle className="mr-2 text-yellow-500" />
        Alertas de Sentimento ({alerts.length})
      </h3>
      <ul className="space-y-4">
        {alerts.map((alert) => (
          <li key={alert.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-bold text-yellow-800 dark:text-yellow-300 capitalize">{alert.sentiment}: {alert.reason}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                <Clock size={14} className="mr-1.5" />
                {new Date(alert.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
            <button
              onClick={() => handleReviewClick(alert.jobId)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
            >
              <MessageSquare size={16} className="mr-2" /> Revisar Chat
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SentimentAlerts; */