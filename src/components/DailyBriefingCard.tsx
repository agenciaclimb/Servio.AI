import React, { useState, useEffect } from 'react';
import { User } from '../../types';

interface DailyBriefingCardProps {
  user: User;
  metrics: { openDisputes: number; pendingVerifications: number; newProspects: number };
}

const DailyBriefingCard: React.FC<DailyBriefingCardProps> = ({ user, metrics }) => {
  const [briefing, setBriefing] = useState<{ title: string; summary: string; priority: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Placeholder local até a API estar disponível
    setBriefing({
      title: `Bom dia, ${user.name.split(' ')[0]}!`,
      summary: `Hoje há ${metrics.openDisputes} disputas abertas e ${metrics.pendingVerifications} verificações pendentes.`,
      priority: metrics.openDisputes > 0 ? 'Priorize a mediação de disputas.' : 'Revise as verificações pendentes.',
    });
    setIsLoading(false);
  }, [user, metrics]);

  if (isLoading) {
    return <div className="p-6 bg-white rounded-lg shadow-sm border animate-pulse">Carregando seu briefing diário...</div>;
  }

  if (!briefing) return null;

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100">
      <h2 className="text-2xl font-bold text-gray-800">{briefing.title}</h2>
      <p className="text-gray-600 mt-2">{briefing.summary}</p>
      <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
        <p className="text-sm font-semibold text-yellow-800">
          <span className="font-bold">Foco do Dia:</span> {briefing.priority}
        </p>
      </div>
    </div>
  );
};

export default DailyBriefingCard;