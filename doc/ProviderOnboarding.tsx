import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import * as api from '../services/api';

import OnboardingStepWelcome from './OnboardingStepWelcome';
import OnboardingStepProfile from './OnboardingStepProfile';
import OnboardingStepPayments from './OnboardingStepPayments';
import OnboardingProgress from './OnboardingProgress'; // 1. Importar o novo componente

interface ProviderOnboardingProps {
  user: User;
  onOnboardingComplete: () => void;
}

const steps = [
  { id: 1, title: 'Boas-vindas' },
  { id: 2, title: 'Perfil Profissional' },
  { id: 3, title: 'Pagamentos' },
];

const ProviderOnboarding: React.FC<ProviderOnboardingProps> = ({ user, onOnboardingComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false); // Estado para feedback de salvamento
  const [formData, setFormData] = useState<Partial<User['profile']>>({
    bio: user.profile?.bio || '',
    specialties: user.profile?.specialties || [],
  });

  const handleUpdate = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    setErrors({}); // Limpa erros anteriores

    // Validação da Etapa 1
    if (currentStep === 1 && (!formData.bio || formData.bio.length < 30)) {
      setErrors({ bio: 'Sua biografia precisa ter pelo menos 30 caracteres para se destacar.' });
      return;
    }

    // Validação da Etapa 2
    if (currentStep === 2 && (!formData.specialties || formData.specialties.length === 0)) {
      setErrors({ specialties: 'Adicione pelo menos uma especialidade.' });
      return;
    }

    if (currentStep < steps.length) {
      setIsSaving(true);
      // Persiste os dados no backend a cada passo
      try {
        await api.updateUser(user.email, { profile: { ...user.profile, ...formData } });
        setCurrentStep(prev => prev + 1);
      } catch (error) {
        console.error("Falha ao salvar progresso:", error);
      } finally {
        setIsSaving(false);
      }
    } else {
      await handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleConnectStripe = async () => {
    if (!user?.email) return;
    setIsConnecting(true);
    try {
      await api.createStripeConnectAccount(user.email);
      const { url } = await api.createStripeAccountLink(user.email);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Falha ao conectar com o Stripe", error);
      // Adicionar um toast de erro aqui seria ideal
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFinish = async () => {
    await api.updateUser(user.email, { profile: { ...user.profile, ...formData }, verificationStatus: 'verificado' });
    onOnboardingComplete();
    navigate('/dashboard');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <OnboardingStepWelcome formData={formData} onUpdate={handleUpdate} error={errors.bio} />;
      case 2:
        return <OnboardingStepProfile specialties={formData.specialties || []} onUpdate={handleUpdate} error={errors.specialties} />;
      case 3:
        return <OnboardingStepPayments onConnectStripe={handleConnectStripe} isConnecting={isConnecting} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      {/* 2. Adicionar o componente de progresso */}
      <div className="mb-8">
        <OnboardingProgress formData={formData} />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Complete seu Cadastro</h2>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Etapa {currentStep} de {steps.length}: {steps[currentStep - 1].title}
          </p>
          <div className="flex space-x-1">
            {steps.map(step => (
              <div key={step.id} className={`h-2 w-8 rounded-full ${currentStep >= step.id ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-[200px] mb-8">
        {renderStepContent()}
      </div>

      <div className="flex justify-between border-t pt-6">
        <button onClick={handleBack} disabled={currentStep === 1} className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50">
          Voltar
        </button>
        <button onClick={handleNext} disabled={isSaving} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 w-28 text-center">
          {isSaving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
          ) : (
            currentStep === steps.length ? 'Concluir' : 'Próximo'
          )}
        </button>
      </div>
    </div>
  );
};

export default ProviderOnboarding;