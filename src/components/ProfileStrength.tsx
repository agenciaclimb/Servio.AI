import React from 'react';
import { User } from '../../types';

interface ProfileStrengthProps {
  user: User;
}

const checklistItems = [
  { key: 'headline', label: 'Título Profissional', weight: 10 },
  { key: 'bio', label: 'Biografia Completa', weight: 15 },
  { key: 'specialties', label: 'Especialidades Definidas', weight: 15 },
  { key: 'cpf', label: 'Documento Verificado', weight: 20 },
  { key: 'portfolio', label: 'Portfólio com Trabalhos', weight: 20 },
  { key: 'hasCertificates', label: 'Certificados Adicionados', weight: 10 },
  { key: 'hasCriminalRecordCheck', label: 'Verificação de Antecedentes', weight: 10 },
];

const ProfileStrength: React.FC<ProfileStrengthProps> = ({ user }) => {
  const calculateScore = () => {
    let score = 0;
    if (user.headline) score += checklistItems[0].weight;
    if (user.bio && user.bio.length > 50) score += checklistItems[1].weight;
    if (user.specialties && user.specialties.length > 0) score += checklistItems[2].weight;
    if (user.cpf && user.verificationStatus === 'verificado') score += checklistItems[3].weight;
    if (user.portfolio && user.portfolio.length > 0) score += checklistItems[4].weight;
    if (user.hasCertificates) score += checklistItems[5].weight;
    if (user.hasCriminalRecordCheck) score += checklistItems[6].weight;
    return score;
  };

  const score = calculateScore();
  const progressColor = score > 75 ? 'bg-green-500' : score > 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="p-6 mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Força do seu Perfil</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Perfis completos têm até 3x mais chances de serem contratados.</p>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${progressColor}`} style={{ width: `${score}%` }}></div>
      </div>
      <div className="text-right text-sm font-bold mt-1">{score}%</div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {checklistItems.map(item => {
          const isComplete = (item.key === 'portfolio' || item.key === 'specialties') ? (user[item.key]?.length || 0) > 0 : !!user[item.key as keyof User];
          return (
            <div key={item.key} className={`flex items-center ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {isComplete ? '✅' : '⬜️'} <span className="ml-2">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileStrength;