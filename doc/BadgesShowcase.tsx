import React from 'react';

interface BadgesShowcaseProps {
  badges: string[];
}

const badgeDictionary: { [key: string]: { icon: string; title: string; description: string } } = {
  first_job: { icon: '🎉', title: 'Primeiro Serviço', description: 'Você concluiu seu primeiro serviço na plataforma!' },
  '10_jobs': { icon: '🔟', title: '10 Serviços Concluídos', description: 'Um marco de experiência e confiança.' },
  '50_jobs': { icon: '🏆', title: '50 Serviços Concluídos', description: 'Você é um veterano da SERVIO.AI!' },
  first_5_star: { icon: '⭐', title: 'Primeira Avaliação 5 Estrelas', description: 'Excelente trabalho reconhecido!' },
  '5_five_stars': { icon: '🌟', title: '5 Avaliações 5 Estrelas', description: 'A qualidade do seu serviço é consistente.' },
  profile_complete: { icon: '✅', title: 'Perfil Completo', description: 'Seu perfil está 100% preenchido.' },
};

const BadgesShowcase: React.FC<BadgesShowcaseProps> = ({ badges }) => {
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Conclua serviços e receba boas avaliações para ganhar medalhas!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {badges.map(badgeKey => {
        const badge = badgeDictionary[badgeKey];
        if (!badge) return null;
        return (
          <div key={badgeKey} title={badge.description} className="flex flex-col items-center justify-center text-center p-3 bg-gray-100 rounded-lg w-24 h-24 cursor-pointer transform hover:scale-105 transition-transform">
            <span className="text-3xl">{badge.icon}</span>
            <span className="text-xs font-semibold mt-1 text-gray-700">{badge.title}</span>
          </div>
        );
      })}
    </div>
  );
};

export default BadgesShowcase;