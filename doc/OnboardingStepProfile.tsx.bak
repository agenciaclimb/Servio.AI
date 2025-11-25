import React, { useState } from 'react';

interface OnboardingStepProfileProps {
  specialties: string[];
  onUpdate: (field: string, value: any) => void;
}

const OnboardingStepProfile: React.FC<OnboardingStepProfileProps> = ({ specialties, onUpdate }) => {
  const [newSpecialty, setNewSpecialty] = useState('');

  const handleAddSpecialty = () => {
    if (newSpecialty && !specialties.includes(newSpecialty)) {
      onUpdate('specialties', [...specialties, newSpecialty]);
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specialtyToRemove: string) => {
    onUpdate('specialties', specialties.filter(s => s !== specialtyToRemove));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Especialidades e Portfólio</h3>
        <p className="mt-1 text-sm text-gray-500">Adicione as áreas em que você atua. Isso é crucial para o matching com clientes.</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newSpecialty}
          onChange={(e) => setNewSpecialty(e.target.value)}
          className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Ex: Eletricista, Encanador"
        />
        <button onClick={handleAddSpecialty} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Adicionar</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {specialties.map(spec => (
          <span key={spec} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {spec}
            <button onClick={() => handleRemoveSpecialty(spec)} className="ml-2 text-blue-500 hover:text-blue-700">&times;</button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default OnboardingStepProfile;