import React, { useMemo } from 'react';
import { User } from '../../types';

interface OnboardingProgressProps {
  formData: Partial<User['profile']>;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ formData }) => {
  const strengthPercentage = useMemo(() => {
    let score = 0;
    if (formData.bio && formData.bio.length > 50) score += 50;
    if (formData.specialties && formData.specialties.length > 0) score += 50;
    return score;
  }, [formData]);

  const progressColor = strengthPercentage > 80 ? 'bg-green-500' : strengthPercentage > 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium text-blue-700">Força do Perfil</span>
        <span className="text-sm font-medium text-blue-700">{strengthPercentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`${progressColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${strengthPercentage}%` }}></div>
      </div>
    </div>
  );
};

export default OnboardingProgress;