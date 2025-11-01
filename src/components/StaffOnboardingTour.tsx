import React, { useState, useEffect } from 'react';
import { StaffRole } from '../../types';

interface OnboardingStep {
  title: string;
  description: string;
  targetElementId: string;
}

interface StaffOnboardingTourProps {
  role: StaffRole;
  onComplete: () => void;
}

const StaffOnboardingTour: React.FC<StaffOnboardingTourProps> = ({ role, onComplete }) => {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fallback local até a API estar disponível
    const defaultSteps: OnboardingStep[] = [
      { title: 'Bem-vindo!', description: 'Explore seu painel para começar.', targetElementId: '' },
      { title: 'Equipe', description: 'Gerencie a equipe no painel de time.', targetElementId: '#team-panel' },
      { title: 'Verificações', description: 'Aprove/recuse verificações de prestadores.', targetElementId: '#verifications-panel' },
    ];
    setSteps(defaultSteps);
    setIsLoading(false);
  }, [role]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const currentStep = steps[currentStepIndex];

  // Highlight the target element
  useEffect(() => {
    document.querySelectorAll('.highlighted-tour').forEach(el => el.classList.remove('highlighted-tour', 'shadow-2xl', 'ring-4', 'ring-blue-500', 'z-20', 'relative'));
    if (currentStep.targetElementId) {
      const element = document.querySelector(currentStep.targetElementId);
      element?.classList.add('highlighted-tour', 'shadow-2xl', 'ring-4', 'ring-blue-500', 'z-20', 'relative');
    }
  }, [currentStep]);

  if (isLoading || steps.length === 0) {
    return null; // Or a loading indicator
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-10 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
        <h3 className="text-xl font-bold text-gray-900">{currentStep.title}</h3>
        <p className="text-gray-600 my-4">{currentStep.description}</p>
        <div className="flex items-center justify-center my-4">
          {steps.map((_, index) => (
            <div key={index} className={`w-2 h-2 rounded-full mx-1 ${index === currentStepIndex ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          ))}
        </div>
        <button onClick={handleNext} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
          {currentStepIndex === steps.length - 1 ? 'Concluir' : 'Próximo'}
        </button>
      </div>
    </div>
  );
};

export default StaffOnboardingTour;