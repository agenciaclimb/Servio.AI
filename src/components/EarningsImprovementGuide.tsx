import React, { useState } from 'react';
import { User } from '../../types';

interface EarningsImprovementGuideProps {
  user: User;
  authToken: string | null;
}

const GoalItem: React.FC<{ text: string; achieved: boolean; bonus: string }> = ({ text, achieved, bonus }) => (
  <li className={`flex items-start transition-all duration-300 ${achieved ? 'text-gray-400' : 'text-gray-700'}`}>
    <span className={`mr-3 mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${achieved ? 'bg-green-500' : 'border-2 border-blue-500'}`}>
      {achieved && <span className="text-white font-bold">✓</span>}
    </span>
    <div>
      <span className={`${achieved ? 'line-through' : 'font-semibold'}`}>{text}</span>
      {!achieved && <span className="ml-2 text-xs font-bold text-green-600">+{bonus}</span>}
    </div>
  </li>
);

const EarningsImprovementGuide: React.FC<EarningsImprovementGuideProps> = ({ user, authToken }) => {
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);

  const fetchAiTip = async () => {
    if (!authToken) return;
    setIsLoadingTip(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_AI_API_URL}/api/generate-earnings-tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ userId: user.email }),
      });
      const data = await response.json();
      setAiTip(data.tip);
    } catch (error) {
      console.error("Error fetching AI tip:", error);
      setAiTip("Não foi possível carregar a dica. Tente novamente mais tarde.");
    } finally {
      setIsLoadingTip(false);
    }
  };

  const bonuses = (user as any).earningsProfile?.bonuses;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Como Aumentar Seus Ganhos</h3>
      <p className="text-sm text-gray-500 mb-5">Complete os objetivos abaixo para aumentar seu percentual de ganhos em cada serviço, até o teto de 85%.</p>
      <ul className="space-y-3">
        <GoalItem text="Complete seu perfil (bio, título, etc)" achieved={bonuses?.profileComplete > 0} bonus="2%" />
        <GoalItem text="Mantenha sua avaliação média acima de 4.8 estrelas" achieved={bonuses?.highRating > 0} bonus="2%" />
        <GoalItem text="Atinja o próximo nível de faturamento" achieved={bonuses?.volumeTier > 0} bonus="até 3%" />
        <GoalItem text="Mantenha uma baixa taxa de disputas" achieved={bonuses?.lowDisputeRate > 0} bonus="1%" />
      </ul>
      <div className="mt-6 pt-5 border-t">
        {!aiTip && !isLoadingTip && (
          <button onClick={fetchAiTip} className="w-full text-center py-2.5 px-4 rounded-lg text-sm font-bold transition duration-300 bg-blue-100 text-blue-700 hover:bg-blue-200">
            Receber Dica da IA ✨
          </button>
        )}
        {isLoadingTip && <p className="text-center text-sm text-gray-500 animate-pulse">Analisando seu perfil...</p>}
        {aiTip && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <p className="text-sm text-blue-800"><span className="font-bold">Dica da IA:</span> {aiTip}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EarningsImprovementGuide;