import React from 'react';
import { ScheduledDateTime } from '../../types';

interface AISchedulingAssistantProps {
  schedule: ScheduledDateTime;
  onConfirm: () => void;
  onClose: () => void;
}

const AISchedulingAssistant: React.FC<AISchedulingAssistantProps> = ({ schedule, onConfirm, onClose }) => {
  const formattedDate = new Date(`${schedule.date}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="p-3 mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl">🤖</span>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Detectei um acordo! Confirmar agendamento para <span className="font-bold">{formattedDate} às {schedule.time}</span>?
          </p>
        </div>
        <div className="flex space-x-2">
          <button onClick={onConfirm} className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Confirmar</button>
          <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
        </div>
      </div>
    </div>
  );
};

export default AISchedulingAssistant;