import React from 'react';
import { User } from '../../types';

interface OnboardingStepWelcomeProps {
  formData: Partial<User['profile']>;
  onUpdate: (field: string, value: any) => void;
}

const OnboardingStepWelcome: React.FC<OnboardingStepWelcomeProps> = ({ formData, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Informações Pessoais</h3>
        <p className="mt-1 text-sm text-gray-500">Complete seu perfil para que os clientes possam te conhecer melhor.</p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Biografia Curta</label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={formData.bio || ''}
            onChange={(e) => onUpdate('bio', e.target.value)}
            placeholder="Fale um pouco sobre você e sua experiência..."
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingStepWelcome;