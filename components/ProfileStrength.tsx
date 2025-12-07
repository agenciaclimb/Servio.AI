import React from 'react';
import { User } from '../types';

interface ProfileStrengthProps {
  user: User;
  onEditProfile: () => void;
}

const ProfileStrength: React.FC<ProfileStrengthProps> = ({ user, onEditProfile }) => {
  const checklistItems = [
    { label: 'Nome Completo', completed: !!user.name },
    { label: 'Título Profissional', completed: !!user.headline },
    { label: 'Biografia', completed: !!user.bio },
    { label: 'Endereço', completed: !!user.address },
    { label: 'CPF', completed: !!user.cpf },
    { label: 'Especialidades', completed: !!user.specialties?.length },
    { label: 'Verificar Certificados', completed: !!user.hasCertificates },
    { label: 'Verificar Antecedentes', completed: !!user.hasCriminalRecordCheck },
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const strengthPercentage = Math.round((completedCount / totalCount) * 100);

  const progressColor =
    strengthPercentage > 80
      ? 'text-green-500'
      : strengthPercentage > 50
        ? 'text-yellow-500'
        : 'text-red-500';
  // const progressBg = strengthPercentage > 80 ? 'bg-green-500' : strengthPercentage > 50 ? 'bg-yellow-500' : 'bg-red-500'; // unused background variant

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Circle */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className={progressColor}
                strokeDasharray={`${strengthPercentage}, 100`}
                d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${progressColor}`}>{strengthPercentage}%</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mt-4">Força do Perfil</h3>
          <p className="text-sm text-gray-600">Perfis completos recebem mais propostas.</p>
        </div>

        {/* Checklist */}
        <div className="lg:col-span-2">
          <h4 className="font-semibold text-gray-800 mb-4">Como melhorar seu perfil:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {checklistItems.map(item => (
              <div key={item.label} className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${item.completed ? 'bg-green-500' : 'border-2 border-gray-300'}`}
                >
                  {item.completed && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  )}
                </div>
                <span
                  className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-700 font-medium'}`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          {strengthPercentage < 100 && (
            <button
              onClick={onEditProfile}
              className="mt-6 w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Completar Perfil Agora
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileStrength;
