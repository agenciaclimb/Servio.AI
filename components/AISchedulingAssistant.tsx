import React from 'react';
import { ScheduledDateTime } from '../types';

interface AISchedulingAssistantProps {
  schedule: ScheduledDateTime;
  onConfirm: () => void;
  onClose: () => void;
}

const AISchedulingAssistant: React.FC<AISchedulingAssistantProps> = ({
  schedule,
  onConfirm,
  onClose,
}) => {
  const formattedDate = new Date(`${schedule.date}T00:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = schedule.time;

  return (
    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl">✨</span>
          <div>
            <h4 className="font-bold text-indigo-900">Sugestão da IA</h4>
            <p className="text-sm text-indigo-700">
              Confirmar agendamento para <strong>{formattedDate}</strong> às{' '}
              <strong>{formattedTime}</strong>?
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Ignorar
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISchedulingAssistant;
