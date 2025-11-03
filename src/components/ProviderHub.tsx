import React, { useState } from 'react';
import { User, Invitation } from '../../types';

interface ProviderHubProps {
  user: User;
  invitations: Invitation[];
  onInvite: (providerEmail: string) => Promise<void>;
  onUpgradeClick: () => void;
}

const statusStyles = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aceito: 'bg-green-100 text-green-800',
};

const ProviderHub: React.FC<ProviderHubProps> = ({ user, invitations, onInvite, onUpgradeClick }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isSubscribed = user.subscription?.status === 'active' || user.subscription?.status === 'trialing';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubscribed) {
      onUpgradeClick();
      return;
    }
    if (!email) return;
    setIsLoading(true);
    try {
      await onInvite(email);
      setEmail('');
    } catch (error) {
      console.error("Failed to send invitation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800">Hub de Prestadores</h2>
      <p className="text-sm text-gray-500 mt-1">Convide e gerencie seus prestadores de confiança.</p>

      <form onSubmit={handleInvite} className="mt-4 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-grow block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="E-mail do prestador"
          required
        />
        <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
          {isSubscribed ? (isLoading ? 'Enviando...' : 'Convidar') : 'Convidar 🚀'}
        </button>
      </form>

      <div className="mt-6">
        <h3 className="text-md font-semibold text-gray-700">Convites Enviados</h3>
        <div className="mt-2 space-y-2">
          {invitations.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Nenhum convite enviado ainda.</p>}
          {invitations.map(inv => (
            <div key={inv.id} className="p-3 border rounded-lg flex justify-between items-center">
              <p className="text-sm font-medium text-gray-800">{inv.providerEmail}</p>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusStyles[inv.status]}`}>{inv.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProviderHub;