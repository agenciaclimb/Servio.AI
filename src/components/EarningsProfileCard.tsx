import React, { useState, useEffect } from 'react';
import { User } from '../../types';

interface EarningsProfileCardProps {
  user: User;
  authToken: string | null;
}

const tierColors = {
  Bronze: 'text-yellow-600',
  Prata: 'text-gray-500',
  Ouro: 'text-yellow-500',
  Platina: 'text-blue-500',
};

const BonusItem: React.FC<{ label: string; value: number; achieved: boolean }> = ({ label, value, achieved }) => (
  <li className={`flex justify-between items-center text-sm ${achieved ? 'text-green-600' : 'text-gray-500'}`}>
    <span>{achieved ? '✅' : '⬜️'} {label}</span>
    <span className="font-semibold">{achieved ? `+${(value * 100).toFixed(0)}%` : 'Ganhe +'+(value * 100).toFixed(0)+'%'}</span>
  </li>
);

const EarningsProfileCard: React.FC<EarningsProfileCardProps> = ({ user, authToken }) => {
  // Using any here because earningsProfile is provided by backend and not part of core User type
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEarningsProfile = async () => {
      if (!user || !authToken) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${user.email}/earnings-profile`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) throw new Error('Failed to fetch earnings profile');
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEarningsProfile();
  }, [user, authToken]);

  if (isLoading) return <div className="p-6 bg-white rounded-lg shadow-sm border animate-pulse">Carregando perfil de ganhos...</div>;
  if (!profile) return null;

  const { baseRate, bonuses, currentRate, tier } = profile;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-800">Seu Perfil de Ganhos</h3>
        <p className={`text-3xl font-bold ${tierColors[tier]}`}>{tier}</p>
        <p className="text-5xl font-extrabold text-gray-900 mt-2">{(currentRate * 100).toFixed(1)}%</p>
        <p className="text-sm text-gray-500">dos valores dos serviços concluídos</p>
      </div>
      {(tier === 'Ouro' || tier === 'Platina') && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-sm font-semibold text-yellow-800">⭐ Parabéns! Você tem destaque nos resultados de busca.</p>
        </div>
      )}
      <div className="mt-6 pt-4 border-t">
        <h4 className="font-semibold text-gray-700 mb-3">Como você chega a este valor:</h4>
        <ul className="space-y-2">
          <li className="flex justify-between items-center text-sm text-gray-600">
            <span>Taxa Base</span>
            <span className="font-semibold">{(baseRate * 100)}%</span>
          </li>
          <BonusItem label="Perfil Completo" value={0.02} achieved={bonuses.profileComplete > 0} />
          <BonusItem label="Avaliação Excelente (4.8+)" value={0.02} achieved={bonuses.highRating > 0} />
          <BonusItem label="Volume de Serviços" value={0.03} achieved={bonuses.volumeTier > 0} />
          <BonusItem label="Baixa Taxa de Disputas" value={0.01} achieved={bonuses.lowDisputeRate > 0} />
        </ul>
      </div>
    </div>
  );
};

export default EarningsProfileCard;