import React, { useState } from 'react';
import { User } from '../../types';

interface ProviderWelcomeTourProps {
  user: User;
  onClose: () => void;
  onGoToOnboarding: () => void;
  onGoToDashboard: () => void;
}

const steps = [
  {
    icon: '👋',
    title: 'Bem-vindo(a) à SERVIO.AI!',
    description: 'Estamos felizes em ter você aqui. Preparamos um guia rápido para você começar a ganhar dinheiro com suas habilidades.',
    buttonText: 'Começar',
  },
  {
    icon: '👤',
    title: 'Complete Seu Perfil',
    description: 'Um perfil completo com título, biografia e especialidades aumenta em até 3x suas chances de ser contratado. É o seu cartão de visitas digital!',
    buttonText: 'Próximo',
  },
  {
    icon: '✅',
    title: 'Verifique Sua Identidade',
    description: 'Para a segurança de todos, precisamos verificar sua identidade. Este passo é obrigatório para você poder enviar propostas.',
    buttonText: 'Verificar Agora',
  },
  {
    icon: '💰',
    title: 'Entenda Seus Ganhos',
    description: 'Você começa com 75% do valor de cada serviço e pode chegar a 85%! Complete objetivos como ter boas avaliações e um perfil completo para aumentar seu percentual.',
    buttonText: 'Entendi',
  },
  {
    icon: '🚀',
    title: 'Tudo Pronto!',
    description: 'Seu próximo passo é explorar as oportunidades no seu painel. Bons negócios!',
    buttonText: 'Ir para o Painel',
  },
];

const ProviderWelcomeTour: React.FC<ProviderWelcomeTourProps> = ({ onClose, onGoToOnboarding, onGoToDashboard }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep === 2) { // Verification step
      onGoToOnboarding();
    } else if (currentStep === steps.length - 1) { // Last step
      onGoToDashboard();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4 transform transition-all text-center p-8" onClick={(e) => e.stopPropagation()}>
        <div className="text-5xl mb-4">{step.icon}</div>
        <h2 className="text-2xl font-bold text-gray-800">{step.title}</h2>
        <p className="text-gray-600 mt-3 mb-8">{step.description}</p>
        
        <div className="flex items-center justify-center mb-4">
          {steps.map((_, index) => (
            <div key={index} className={`w-2 h-2 rounded-full mx-1 ${index === currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          ))}
        </div>

        <button onClick={handleNext} className="w-full px-6 py-3 text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          {step.buttonText}
        </button>
      </div>
    </div>
  );
};

export default ProviderWelcomeTour;